import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  ImportColumn,
  ImportErrorRow,
  ImportReferenceSheet,
  ImportSampleRow,
  ImportSummary,
} from '../../../../lib/import-types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { formatDbError } from '../../../../lib/db-errors';
import { useAuthStore } from '../../../../store/useStore';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import type { NhomDoiTac } from '../../../kho-van/danh-sach-doi-tac/core/types';
import type { TrangThaiThanhToanDoiTac } from '../../thiet-lap-de-xuat-vat-tu/core/types';
import {
  getDoiTacNccImportRef,
  getSoPhieuDaCo,
  insertThanhToanDoiTacImport,
} from '../services/thanh-toan-doi-tac-import.service';
import { buildThanhToanDoiTacImportPlan, loaiDongTrungSoPhieuDb } from '../utils/import-thanh-toan-doi-tac';
import { useCauHinhSoPhieuThanhToan } from './use-cau-hinh-so-phieu-thanh-toan';

/** Thứ tự cột: số phiếu, ngày, đơn vị … gần phiếu giấy. */
const COLUMNS: { key: string; label: string; hint: string; required?: boolean; requiredWhen?: string }[] = [
  { key: 'so_phieu', label: 'store.soPhieuCol', hint: 'hintSoPhieu', requiredWhen: 'reqSoPhieu' },
  { key: 'ngay', label: 'store.ngayCol', hint: 'hintNgay', required: true },
  { key: 'don_vi', label: 'store.donViCol', hint: 'hintDonVi', requiredWhen: 'reqDonVi' },
  { key: 'nhom_doi_tac', label: 'store.nhomDoiTacCol', hint: 'hintNhomDoiTac' },
  { key: 'doi_tac', label: 'store.doiTacCol', hint: 'hintDoiTac', required: true },
  { key: 'hang_muc_thanh_toan', label: 'store.hangMucCol', hint: 'hintHangMuc', required: true },
  { key: 'noi_dung_chi_tiet', label: 'store.noiDungChiTietCol', hint: 'hintNoiDungChiTiet' },
  { key: 'so_tien', label: 'store.soTienCol', hint: 'hintSoTien', required: true },
  { key: 'trang_thai', label: 'store.trangThaiCol', hint: 'hintTrangThai' },
  { key: 'ngay_xu_ly', label: 'store.ngayXuLyCol', hint: 'hintNgayXuLy' },
  { key: 'ghi_chu', label: 'form.ghiChu', hint: 'hintGhiChu' },
];

function ddmmyyyy(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

interface Args {
  /** Đơn vị (chi nhánh) người dùng được phép xem. */
  allowedBranches: Branch[];
  statusList: TrangThaiThanhToanDoiTac[];
  nhomList: NhomDoiTac[];
  /** Đơn vị mặc định cho dòng để trống cột Đơn vị. */
  defaultDonViId?: string | null;
}

/** Wiring Import Excel cho Thanh toán đối tác. Bố cục file mẫu do `lib/import-template.ts` dựng. */
export function useThanhToanDoiTacImport({ allowedBranches, statusList, nhomList, defaultDonViId }: Args) {
  const { t } = useTranslation();
  const tr = useCallback((k: string, o?: Record<string, unknown>) => t(`thanhToanDoiTac.${k}`, o ?? {}), [t]);
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: config } = useCauHinhSoPhieuThanhToan();
  const [showImport, setShowImport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);

  const { data: doiTacRef = [] } = useQuery({
    queryKey: ['thanhToanDoiTac', 'importDoiTacRef'],
    queryFn: getDoiTacNccImportRef,
    enabled: showImport,
    staleTime: 60_000,
  });

  const activeStatus = useMemo(
    () => statusList.filter((s) => s.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG),
    [statusList]
  );

  /** Trạng thái đang hoạt động có thu_tu nhỏ nhất — cùng luật với form. */
  const idTrangThaiMacDinh = useMemo(() => {
    if (activeStatus.length === 0) return null;
    return activeStatus.reduce((best, s) => (s.thu_tu < best.thu_tu ? s : best), activeStatus[0]).id;
  }, [activeStatus]);

  const nhomTen = useMemo(() => new Map(nhomList.map((n) => [String(n.id), n.ten_nhom])), [nhomList]);

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
    const donVi = allowedBranches[0]?.ma_chi_nhanh || 'FARM01';
    const doiTac = doiTacRef[0];
    const maDoiTac = doiTac?.ma_doi_tac || 'NCC001';
    const nhom = (doiTac?.id_nhom && nhomTen.get(doiTac.id_nhom)) || '';
    const trangThai = activeStatus[0]?.ma || '';
    const today = ddmmyyyy(new Date());
    return [
      ['', today, donVi, nhom, maDoiTac, tr('import.exampleHangMuc1'), tr('import.exampleNoiDung1'), 1050000, trangThai, '', ''],
      ['TTO-9001', today, '', '', maDoiTac, tr('import.exampleHangMuc2'), '', '1.500.000', '', '', tr('import.exampleGhiChu')],
    ];
  }, [allowedBranches, doiTacRef, nhomTen, activeStatus, tr]);

  const guideNotes = useMemo(() => [tr('import.guideNoteSoPhieu'), tr('import.guideNoteNguoiTao')], [tr]);

  const referenceSheets = useMemo<ImportReferenceSheet[]>(
    () => [
      {
        name: tr('import.sheetDonVi'),
        headers: [tr('import.refMa'), tr('import.refTen')],
        data: allowedBranches.map((b) => [b.ma_chi_nhanh, b.ten_chi_nhanh]),
      },
      {
        name: tr('import.sheetNhomDoiTac'),
        headers: [tr('import.refMa'), tr('import.refTen')],
        data: nhomList.map((n) => [n.ma_nhom, n.ten_nhom]),
      },
      {
        name: tr('import.sheetDoiTac'),
        headers: [tr('import.refMa'), tr('import.refTen'), tr('import.refNhom')],
        data: doiTacRef.map((d) => [d.ma_doi_tac, d.ten_doi_tac, (d.id_nhom && nhomTen.get(d.id_nhom)) || null]),
      },
      {
        name: tr('import.sheetTrangThai'),
        headers: [tr('import.refMa'), tr('import.refTen')],
        data: activeStatus.map((s) => [s.ma, s.ten]),
      },
    ],
    [allowedBranches, nhomList, doiTacRef, nhomTen, activeStatus, tr]
  );

  const handleImport = useCallback(
    async (data: Record<string, unknown>[]): Promise<ImportSummary> => {
      setImportErrors([]);
      const tuSinh = !!config?.tu_sinh_so_phieu;
      let plan = buildThanhToanDoiTacImportPlan(data, {
        chiNhanh: allowedBranches.map((b) => ({ id: String(b.id), ma: b.ma_chi_nhanh, ten: b.ten_chi_nhanh })),
        nhom: nhomList.map((n) => ({ id: String(n.id), ma: n.ma_nhom, ten: n.ten_nhom })),
        doiTac: doiTacRef.map((d) => ({ id: d.id, ma: d.ma_doi_tac, ten: d.ten_doi_tac, idNhom: d.id_nhom })),
        trangThai: activeStatus.map((s) => ({ id: String(s.id), ma: s.ma, ten: s.ten })),
        defaultDonViId: defaultDonViId ?? null,
        idTrangThaiMacDinh,
        tuSinhSoPhieu: tuSinh,
      });

      // Số phiếu nhập tay phải chưa có trong DB — báo lỗi dòng thay vì để insert vỡ giữa chừng.
      const soPhieuList = plan.toInsert.map((p) => p.payload.so_phieu).filter((s): s is string => !!s);
      if (soPhieuList.length > 0) {
        try {
          plan = loaiDongTrungSoPhieuDb(plan, await getSoPhieuDaCo(soPhieuList));
        } catch (e) {
          toast.error(formatDbError(e));
          return { created: 0, skipped: data.length };
        }
      }

      if (plan.toInsert.length === 0) {
        setImportErrors(plan.errors);
        return { created: 0, skipped: plan.errors.length };
      }

      const idNguoiTao = user?.id != null && Number.isFinite(Number(user.id)) ? Number(user.id) : null;
      const items = plan.toInsert.map((p) => ({ ...p, payload: { ...p.payload, id_nguoi_tao: idNguoiTao } }));
      const outcome = await insertThanhToanDoiTacImport(items, {
        config: {
          tien_to_so_phieu: config?.tien_to_so_phieu ?? 'TTO-',
          do_dai_phan_so: config?.do_dai_phan_so ?? 4,
        },
      });

      const errors = [
        ...plan.errors,
        ...outcome.failed.map((f) => ({ row: f.item.row, msg: f.msg, values: f.item.values })),
      ].sort((a, b) => a.row - b.row);
      setImportErrors(errors);
      if (outcome.done > 0) {
        qc.invalidateQueries({ queryKey: ['thanhToanDoiTac'] });
        toast.success(tr('import.success', { count: outcome.done }));
      }
      return { created: outcome.done, skipped: errors.length };
    },
    [activeStatus, allowedBranches, config, defaultDonViId, doiTacRef, idTrangThaiMacDinh, nhomList, qc, tr, user]
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
