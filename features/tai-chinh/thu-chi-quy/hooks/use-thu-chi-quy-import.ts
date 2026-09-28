import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  ImportColumn,
  ImportErrorRow,
  ImportReferenceSheet,
  ImportSampleRow,
  ImportSummary,
} from '../../../../lib/import-types';
import { useAuthStore } from '../../../../store/useStore';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import type { HangMucThuChi } from '../../thiet-lap-quy/core/types';
import { getSoPhieuBatch, insertThuChiQuyBulk } from '../services/thu-chi-quy-service';
import { buildThuChiQuyImportPlan } from '../utils/import-thu-chi-quy';
import { THU_CHI_QUY_QUERY_KEY } from './use-thu-chi-quy';

/** Thứ tự cột giữ gần sổ Excel cũ để dán thẳng. */
const COLUMNS: { key: string; label: string; hint: string; required?: boolean; requiredWhen?: string }[] = [
  { key: 'ngay', label: 'store.ngayCol', hint: 'hintNgay', required: true },
  { key: 'chi_nhanh', label: 'store.chiNhanhCol', hint: 'hintFarm', requiredWhen: 'reqFarm' },
  { key: 'dien_giai', label: 'store.dienGiaiCol', hint: 'hintDienGiai', required: true },
  { key: 'so_luong', label: 'store.soLuongCol', hint: 'hintSoLuong' },
  { key: 'don_gia', label: 'store.donGiaCol', hint: 'hintDonGia' },
  { key: 'hang_muc', label: 'store.hangMucCol', hint: 'hintHangMuc', required: true },
  { key: 'thu', label: 'store.thuCol', hint: 'hintThu', requiredWhen: 'reqThuChi' },
  { key: 'chi', label: 'store.chiCol', hint: 'hintChi', requiredWhen: 'reqThuChi' },
  { key: 'so_chung_tu', label: 'store.soChungTuCol', hint: 'hintSoChungTu' },
  { key: 'ghi_chu', label: 'store.ghiChuCol', hint: 'hintGhiChu' },
];

function ddmmyyyy(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

interface Args {
  /** Farm người dùng được phép xem (đã lọc theo phạm vi). */
  allowedBranches: Branch[];
  /** Farm đang chọn trên thanh công cụ. */
  chiNhanhDangXem: string[];
  hangMucList: HangMucThuChi[];
}

/** Wiring Import Excel cho Sổ quỹ. Bố cục file mẫu do `lib/import-template.ts` dựng. */
export function useThuChiQuyImport({ allowedBranches, chiNhanhDangXem, hangMucList }: Args) {
  const { t } = useTranslation();
  const tr = useCallback((k: string, o?: Record<string, unknown>) => t(`thuChiQuy.${k}`, o ?? {}), [t]);
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [showImport, setShowImport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);

  const importColumns = useMemo<ImportColumn[]>(
    () =>
      COLUMNS.map((c) => ({
        key: c.key,
        label: tr(c.label),
        required: c.required,
        requiredWhen: c.requiredWhen ? tr(`import.${c.requiredWhen}`) : undefined,
        hint: tr(`import.${c.hint}`),
      })),
    [tr]
  );

  const sampleRows = useMemo<ImportSampleRow[]>(() => {
    const farm = allowedBranches[0]?.ma_chi_nhanh || 'FARM01';
    const hmThu = hangMucList.find((h) => h.loai !== 'chi')?.ma || 'TAM_UNG';
    const hmChi = hangMucList.filter((h) => h.loai !== 'thu');
    const chi1 = hmChi[0]?.ma || 'VAT_TU';
    const chi2 = hmChi[1]?.ma || chi1;
    const today = ddmmyyyy(new Date());
    return [
      [today, farm, tr('import.exampleThu'), '', '', hmThu, 20000000, '', '', ''],
      [today, farm, tr('import.exampleChi1'), 4, 75000, chi1, '', 300000, 'TTO-0001', ''],
      [today, '', tr('import.exampleChi2'), '', '', chi2, '', 150000, '', tr('import.exampleGhiChu')],
    ];
  }, [allowedBranches, hangMucList, tr]);

  const guideNotes = useMemo(() => [tr('import.guideNoteFarm'), tr('import.guideNoteTonQuy')], [tr]);

  const referenceSheets = useMemo<ImportReferenceSheet[]>(
    () => [
      {
        name: tr('import.sheetFarm'),
        headers: [tr('import.refMa'), tr('import.refTen')],
        data: allowedBranches.map((b) => [b.ma_chi_nhanh, b.ten_chi_nhanh]),
      },
      {
        name: tr('import.sheetHangMuc'),
        headers: [tr('import.refMa'), tr('import.refTen'), tr('import.refDungCho')],
        data: hangMucList.map((h) => [h.ma, h.ten, tr(`import.hangMucLoai.${h.loai}`)]),
      },
    ],
    [allowedBranches, hangMucList, tr]
  );

  const handleImport = useCallback(
    async (data: Record<string, unknown>[]): Promise<ImportSummary> => {
      setImportErrors([]);
      const plan = buildThuChiQuyImportPlan(data, {
        hangMuc: hangMucList.map((hm) => ({ id: hm.id, ma: hm.ma, ten: hm.ten, loai: hm.loai })),
        chiNhanh: allowedBranches.map((b) => ({ id: String(b.id), ma: b.ma_chi_nhanh, ten: b.ten_chi_nhanh })),
        defaultChiNhanhId: chiNhanhDangXem.length === 1 ? chiNhanhDangXem[0] : null,
      });
      if (plan.toInsert.length === 0) {
        setImportErrors(plan.errors);
        return { created: 0, skipped: plan.errors.length };
      }

      // Số phiếu lấy trọn lô từ cùng dãy sequence với phiếu nhập tay (2 request).
      const soThu = plan.toInsert.filter((p) => p.payload.loai === 'thu').length;
      const [soPhieuThu, soPhieuChi] = await Promise.all([
        getSoPhieuBatch('thu', soThu),
        getSoPhieuBatch('chi', plan.toInsert.length - soThu),
      ]);
      let iThu = 0;
      let iChi = 0;
      const idNguoiTao = user?.id != null && Number.isFinite(Number(user.id)) ? Number(user.id) : null;
      const tenNguoiTao = user?.ho_va_ten ?? user?.full_name ?? null;
      const items = plan.toInsert.map((p) => ({
        ...p,
        payload: {
          ...p.payload,
          so_phieu: p.payload.loai === 'thu' ? soPhieuThu[iThu++] : soPhieuChi[iChi++],
          // Thiếu người lập thì người thường không sửa / xin mở khoá được chính phiếu mình import.
          id_nguoi_tao: idNguoiTao,
          ten_nguoi_tao: tenNguoiTao,
        },
      }));

      const outcome = await insertThuChiQuyBulk(items);
      const errors = [
        ...plan.errors,
        ...outcome.failed.map((f) => ({ row: f.item.row, msg: f.msg, values: f.item.values })),
      ].sort((a, b) => a.row - b.row);
      setImportErrors(errors);
      if (outcome.done > 0) {
        qc.invalidateQueries({ queryKey: THU_CHI_QUY_QUERY_KEY });
        toast.success(tr('import.success', { count: outcome.done }));
      }
      return { created: outcome.done, skipped: errors.length };
    },
    [allowedBranches, chiNhanhDangXem, hangMucList, qc, tr, user]
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
    templateFileName: tr('import.templateName'),
  };
}
