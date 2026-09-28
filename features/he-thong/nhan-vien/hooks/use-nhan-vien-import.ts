import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  ImportColumn,
  ImportErrorRow,
  ImportReferenceSheet,
  ImportSampleRow,
  ImportSummary,
} from '../../../../lib/import-types';
import { useBranches } from '../../chi-nhanh/hooks/use-chi-nhanh';
import { useDepartments } from '../../phong-ban/hooks/use-phong-ban';
import { usePositions } from '../../chuc-vu/hooks/use-chuc-vu';
import { useJobLevels } from '../../cap-bac/hooks/use-cap-bac';
import { GIOI_TINH_VALUES, LOAI_HOP_DONG_VALUES, TRANG_THAI_NV_VALUES } from '../utils/import-nhan-vien';
import { useImportEmployees } from './use-nhan-vien';

const COLUMNS: { key: string; col: string; hint: string; required?: boolean; requiredWhen?: string }[] = [
  { key: 'ho_ten', col: 'colHoTen', hint: 'hintHoTen', required: true },
  { key: 'email', col: 'colEmail', hint: 'hintEmail', required: true },
  { key: 'so_dien_thoai', col: 'colSdt', hint: 'hintSdt', required: true },
  { key: 'gioi_tinh', col: 'colGioiTinh', hint: 'hintGioiTinh', required: true },
  { key: 'ngay_vao_lam', col: 'colNgayVaoLam', hint: 'hintNgay', required: true },
  { key: 'chi_nhanh', col: 'colChiNhanh', hint: 'hintChiNhanh', required: true },
  { key: 'phong_ban', col: 'colPhongBan', hint: 'hintPhongBan', required: true },
  { key: 'chuc_vu', col: 'colChucVu', hint: 'hintChucVu', required: true },
  { key: 'cap_bac', col: 'colCapBac', hint: 'hintCapBac' },
  { key: 'trang_thai', col: 'colTrangThai', hint: 'hintTrangThai' },
  { key: 'loai_hop_dong', col: 'colLoaiHopDong', hint: 'hintLoaiHopDong' },
  { key: 'ngay_het_han_hd', col: 'colNgayHetHanHd', hint: 'hintNgayHetHanHd', requiredWhen: 'reqNgayHetHanHd' },
  { key: 'ngay_sinh', col: 'colNgaySinh', hint: 'hintNgaySinh' },
  { key: 'cmnd_cccd', col: 'colCccd', hint: 'hintCccd' },
  { key: 'dia_chi_cu_the', col: 'colDiaChi', hint: 'hintDiaChi' },
];

/** Wiring Import Excel nhân viên. Bố cục file mẫu do `lib/import-template.ts` dựng. */
export function useNhanVienImport(enabled: boolean) {
  const { t } = useTranslation();
  const tr = useCallback((k: string) => t(`employee.import.${k}`), [t]);
  const [showImport, setShowImport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const importMutation = useImportEmployees();
  // Danh mục chỉ cần khi dialog mở — các hook này dùng chung cache với form nhân viên.
  const { data: branches = [] } = useBranches();
  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
  const { data: jobLevels = [] } = useJobLevels();

  const importColumns = useMemo<ImportColumn[]>(
    () =>
      COLUMNS.map((c) => ({
        key: c.key,
        label: tr(c.col),
        required: c.required,
        requiredWhen: c.requiredWhen ? tr(c.requiredWhen) : undefined,
        hint: tr(c.hint),
      })),
    [tr]
  );

  const sampleRows = useMemo<ImportSampleRow[]>(() => {
    const cn1 = branches[0]?.ma_chi_nhanh || 'FARM01';
    const cn2 = branches[1]?.ma_chi_nhanh;
    const pb = departments[0]?.ten_phong_ban || 'Kỹ thuật';
    const cv = positions[0]?.ten_chuc_vu || 'Nhân viên';
    const cb = jobLevels[0]?.ten_cap_bac || '';
    return [
      [tr('exampleHoTen1'), 'an.nguyen@congty.vn', '0912345678', 'Nam', '01/09/2026', cn1, pb, cv, cb, '', 'Có thời hạn', '31/08/2027', '15/03/1995', '', tr('exampleDiaChi')],
      [tr('exampleHoTen2'), 'binh.tran@congty.vn', '0987654321', 'Nữ', '15/09/2026', cn2 ? `${cn1}, ${cn2}` : cn1, pb, cv, '', 'Thử việc', 'Thử việc', '', '', '', ''],
    ];
  }, [branches, departments, positions, jobLevels, tr]);

  const guideNotes = useMemo(() => [tr('guideNoteMatKhau'), tr('guideNoteMaNv')], [tr]);

  const referenceSheets = useMemo<ImportReferenceSheet[]>(
    () => [
      {
        name: tr('sheetChiNhanh'),
        headers: [tr('refMa'), tr('refTen')],
        data: branches.map((b) => [b.ma_chi_nhanh, b.ten_chi_nhanh]),
      },
      { name: tr('sheetPhongBan'), headers: [tr('refTen')], data: departments.map((d) => [d.ten_phong_ban]) },
      { name: tr('sheetChucVu'), headers: [tr('refTen')], data: positions.map((p) => [p.ten_chuc_vu]) },
      {
        name: tr('sheetCapBac'),
        headers: [tr('refSoCap'), tr('refTen')],
        data: jobLevels.map((j) => [j.cap_bac, j.ten_cap_bac]),
      },
      {
        name: tr('sheetGiaTri'),
        headers: [tr('refCot'), tr('refGiaTri')],
        data: [
          [tr('colGioiTinh'), GIOI_TINH_VALUES.join(' / ')],
          [tr('colTrangThai'), TRANG_THAI_NV_VALUES.join(' / ')],
          [tr('colLoaiHopDong'), LOAI_HOP_DONG_VALUES.join(' / ')],
        ],
      },
    ],
    [branches, departments, positions, jobLevels, tr]
  );

  const handleImport = useCallback(
    async (rows: Record<string, unknown>[]): Promise<ImportSummary> => {
      setImportErrors([]);
      const result = await importMutation.mutateAsync({
        rows,
        refs: {
          chiNhanh: branches.map((b) => ({ id: String(b.id), ma: b.ma_chi_nhanh, ten: b.ten_chi_nhanh })),
          phongBan: departments.map((d) => ({ id: String(d.id), ten: d.ten_phong_ban })),
          chucVu: positions.map((p) => ({ id: String(p.id), ma: p.ma_chuc_vu, ten: p.ten_chuc_vu })),
          capBac: jobLevels.map((j) => ({ id: String(j.id), ten: j.ten_cap_bac, cap_bac: j.cap_bac })),
        },
      });
      setImportErrors(result.errors);
      return { created: result.created, updated: 0 };
    },
    [importMutation, branches, departments, positions, jobLevels]
  );

  return {
    canImport: enabled,
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
    templateFileName: t('employee.importTemplateName'),
  };
}
