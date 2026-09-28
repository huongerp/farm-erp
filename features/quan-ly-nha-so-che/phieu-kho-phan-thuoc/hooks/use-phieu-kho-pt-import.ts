import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImportColumn, ImportReferenceSheet, ImportSampleRow } from '../../../../components/shared/LazyImportDialog';
import type { ImportErrorRow, ImportSummary } from '../../../../lib/import-types';
import { useAuthStore } from '../../../../store/useStore';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import { useFarmHangHoaList } from '../../hang-hoa-phan-thuoc/hooks/use-farm-hang-hoa';
import { useImportPhieuKhoPT } from './use-phieu-kho-pt';

/** Thứ tự cột của sheet "Nhập liệu" — sheet "Ví dụ mẫu" và "Hướng dẫn" bám đúng thứ tự này. */
const COLUMN_KEYS = [
  'so_phieu',
  'loai',
  'ngay',
  'kho',
  'kho_den',
  'mo_ta',
  'ma_hang',
  'so_luong',
  'don_gia',
  'pham_cap',
  'so_lot',
  'ghi_chu',
] as const;

const LABEL_KEY: Record<(typeof COLUMN_KEYS)[number], string> = {
  so_phieu: 'colSoPhieu',
  loai: 'colLoai',
  ngay: 'colNgay',
  kho: 'colKho',
  kho_den: 'colKhoDen',
  mo_ta: 'colMoTa',
  ma_hang: 'colMaHang',
  so_luong: 'colSoLuong',
  don_gia: 'colDonGia',
  pham_cap: 'colPhamCap',
  so_lot: 'colSoLot',
  ghi_chu: 'colGhiChu',
};

const RULE_KEY: Record<(typeof COLUMN_KEYS)[number], string> = {
  so_phieu: 'ruleSoPhieu',
  loai: 'ruleLoai',
  ngay: 'ruleNgay',
  kho: 'ruleKho',
  kho_den: 'ruleKhoDen',
  mo_ta: 'ruleMoTa',
  ma_hang: 'ruleMaHang',
  so_luong: 'ruleSoLuong',
  don_gia: 'ruleDonGia',
  pham_cap: 'rulePhamCap',
  so_lot: 'ruleSoLot',
  ghi_chu: 'ruleGhiChu',
};

const REQUIRED = new Set(['loai', 'ngay', 'kho', 'ma_hang', 'so_luong']);

/** Giá trị "Loại phiếu" parser nhận (`parseLoaiPhieu`) — là dữ liệu điền vào ô, không phải nhãn giao diện. */
const LOAI_VALUES = { nhap: 'Nhập', xuat: 'Xuất', chuyen: 'Chuyển' } as const;

function ddmmyyyy(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Wiring Import Excel cho tab Danh sách phiếu. Bố cục file mẫu do `lib/import-template.ts` dựng. */
export function usePhieuKhoPTImport(khoList: Kho[]) {
  const { t } = useTranslation();
  const tr = useCallback((k: string) => t(`phieuKhoPhanThuoc.import.${k}`), [t]);
  const [showImport, setShowImport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const importMutation = useImportPhieuKhoPT();
  const { data: hangHoaList = [] } = useFarmHangHoaList();
  const user = useAuthStore((s) => s.user);

  const importColumns = useMemo<ImportColumn[]>(
    () =>
      COLUMN_KEYS.map((key) => ({
        key,
        label: tr(LABEL_KEY[key]),
        required: REQUIRED.has(key),
        requiredWhen: key === 'kho_den' ? tr('guideIfChuyen') : undefined,
        hint: tr(RULE_KEY[key]),
      })),
    [tr]
  );

  const sampleRows = useMemo<ImportSampleRow[]>(() => {
    const k1 = khoList[0]?.ma_kho || 'KHO01';
    const k2 = khoList[1]?.ma_kho || 'KHO02';
    const h1 = hangHoaList[0]?.ma_hang_hoa || 'HH-001';
    const h2 = hangHoaList[1]?.ma_hang_hoa || 'HH-002';
    const today = ddmmyyyy(new Date());
    return [
      ['VD-NHAP-01', LOAI_VALUES.nhap, today, k1, '', tr('exampleMoTaNhap'), h1, 20, 250000, '', 'LOT-01', ''],
      ['VD-NHAP-01', LOAI_VALUES.nhap, today, k1, '', tr('exampleMoTaNhap'), h2, 5, '', '', '', ''],
      ['', LOAI_VALUES.xuat, today, k1, '', tr('exampleMoTaXuat'), h1, 3, '', '', '', ''],
      ['', LOAI_VALUES.chuyen, today, k1, k2, tr('exampleMoTaChuyen'), h2, 2, '', '', '', ''],
    ];
  }, [khoList, hangHoaList, tr]);

  const guideNotes = useMemo(
    () => [tr('guideNote1'), tr('guideNote2'), tr('guideNote3'), tr('guideNote5')],
    [tr]
  );

  const referenceSheets = useMemo<ImportReferenceSheet[]>(
    () => [
      {
        name: tr('sheetLoai'),
        headers: [tr('refLoaiValue'), tr('refLoaiDesc')],
        data: [
          [LOAI_VALUES.nhap, tr('loaiNhapDesc')],
          [LOAI_VALUES.xuat, tr('loaiXuatDesc')],
          [LOAI_VALUES.chuyen, tr('loaiChuyenDesc')],
        ],
      },
      {
        name: tr('sheetKho'),
        headers: [tr('refMa'), tr('refTen')],
        data: khoList.map((k) => [k.ma_kho, k.ten_kho]),
      },
      {
        name: tr('sheetHangHoa'),
        headers: [tr('refMa'), tr('refTen'), tr('refDvt'), tr('colPhamCap'), tr('colDonGia')],
        data: hangHoaList.map((h) => [h.ma_hang_hoa, h.ten_hang_hoa, h.dvt ?? '', h.pham_cap ?? '', h.don_gia ?? '']),
      },
    ],
    [khoList, hangHoaList, tr]
  );

  const handleImport = useCallback(
    async (rows: Record<string, unknown>[]): Promise<ImportSummary> => {
      setImportErrors([]);
      const idRaw = user?.id != null ? Number(user.id) : NaN;
      const ten = user?.ho_va_ten?.trim() || user?.full_name?.trim() || null;
      const result = await importMutation.mutateAsync({
        rows,
        nguoiTao: { id: Number.isFinite(idRaw) ? idRaw : null, ten },
      });
      setImportErrors(result.errors);
      return { created: result.created, updated: 0 };
    },
    [importMutation, user]
  );

  return {
    showImport,
    openImport: () => setShowImport(true),
    closeImport: () => {
      setShowImport(false);
      setImportErrors([]);
    },
    importColumns,
    sampleRows,
    guideNotes,
    referenceSheets,
    importErrors,
    handleImport,
    templateFileName: tr('templateName'),
  };
}
