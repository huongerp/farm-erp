import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { ImportReferenceSheet, ImportSampleRow } from '../../../../components/shared/ImportDialog';
import { IMPORT_ROW_KEY, type ImportErrorRow, type ImportSummary } from '../../../../lib/import-types';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { useEmployeesRefQuery } from '@/lib/hooks/use-ref-queries';
import { useTaiSanList } from '../../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { LOAI_PHIEU_OPTIONS } from '../core/constants';
import type { PhieuCapPhatThuHoi } from '../core/types';
import { useImportPhieuCapPhatThuHoi } from './use-cap-phat-thu-hoi';
import { useCapPhatThuHoiStore } from '../store/useCapPhatThuHoiStore';
import { phieuToExportRow } from '../utils/export-phieu';
import type { PhieuCapPhatThuHoiImportRow } from '../services/cap-phat-thu-hoi-service';

/** Wiring Import/Export chuẩn hệ thống cho tab danh sách phiếu. */
export function useCpthListImportExport(sortedList: PhieuCapPhatThuHoi[]) {
  const { t } = useTranslation();
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const pagination = useCapPhatThuHoiStore((s) => s.pagination);
  const selectedIds = useCapPhatThuHoiStore((s) => s.selectedIds);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const importMutation = useImportPhieuCapPhatThuHoi();

  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: taiSanList = [] } = useTaiSanList();
  const { data: noiLuuList = [] } = useAssetStorageLocations();

  const IMPORT_COLUMNS = useMemo(
    () => [
      { key: 'loai_phieu', label: t('capPhatThuHoi.form.loaiPhieu'), required: true, hint: t('capPhatThuHoi.import.hint_loai_phieu') },
      { key: 'ngay_thuc_hien', label: t('capPhatThuHoi.form.ngayThucHien'), required: true, hint: t('capPhatThuHoi.import.hint_ngay_thuc_hien') },
      { key: 'ma_nguoi_thuc_hien', label: t('capPhatThuHoi.import.maNguoiThucHien'), required: true, hint: t('capPhatThuHoi.import.hint_ma_nguoi_thuc_hien') },
      { key: 'ma_nguoi_giu_truoc', label: t('capPhatThuHoi.import.maNguoiGiuTruoc'), hint: t('capPhatThuHoi.import.hint_ma_nguoi_giu_truoc') },
      { key: 'ma_nguoi_giu_sau', label: t('capPhatThuHoi.import.maNguoiGiuSau'), hint: t('capPhatThuHoi.import.hint_ma_nguoi_giu_sau') },
      { key: 'ghi_chu_phieu', label: t('capPhatThuHoi.import.ghiChuPhieu'), hint: t('capPhatThuHoi.import.hint_ghi_chu_phieu') },
      { key: 'ma_tai_san', label: t('capPhatThuHoi.store.maTaiSanCol'), required: true, hint: t('capPhatThuHoi.import.hint_ma_tai_san') },
      { key: 'ma_noi_luu_sau', label: t('capPhatThuHoi.import.maNoiLuuSau'), required: true, hint: t('capPhatThuHoi.import.hint_ma_noi_luu_sau') },
      { key: 'ghi_chu_dong', label: t('capPhatThuHoi.import.ghiChuDong'), hint: t('capPhatThuHoi.import.hint_ghi_chu_dong') },
    ],
    [t]
  );

  const importGuideNotes = useMemo(() => [t('capPhatThuHoi.import.guideNoteGop')], [t]);

  const importSampleRows = useMemo<ImportSampleRow[]>(
    () => [
      [
        'cap_phat',
        '2026-01-15',
        employees[0]?.ma_nhan_vien ?? 'NV1',
        '',
        employees[0]?.ma_nhan_vien ?? 'NV1',
        '',
        taiSanList[0]?.ma_tai_san ?? 'TS-001',
        noiLuuList[0]?.ma_noi_luu ?? 'NL-001',
        '',
      ],
    ],
    [employees, taiSanList, noiLuuList]
  );

  const importReferenceSheets = useMemo<ImportReferenceSheet[]>(() => {
    return [
      {
        name: t('capPhatThuHoi.import.refSheetLoai'),
        headers: [t('capPhatThuHoi.import.refMaLoai'), t('capPhatThuHoi.import.refTenLoai')],
        data: LOAI_PHIEU_OPTIONS.map((o) => [o.value, t(o.labelKey)]),
      },
      {
        name: t('capPhatThuHoi.import.refSheetNhanVien'),
        headers: [t('capPhatThuHoi.import.maNguoiThucHien'), t('capPhatThuHoi.import.refHoTen')],
        data: employees.slice(0, 500).map((e) => [e.ma_nhan_vien, e.ho_ten]),
      },
      {
        name: t('capPhatThuHoi.import.refSheetTaiSan'),
        headers: [t('capPhatThuHoi.store.maTaiSanCol'), t('capPhatThuHoi.store.taiSanCol')],
        data: taiSanList.slice(0, 1000).map((a) => [a.ma_tai_san, a.ten_tai_san]),
      },
      {
        name: t('capPhatThuHoi.import.refSheetNoiLuu'),
        headers: [t('capPhatThuHoi.import.maNoiLuuSau'), t('capPhatThuHoi.store.noiLuuSauCol')],
        data: noiLuuList.map((l) => [l.ma_noi_luu, l.ten_noi_luu]),
      },
    ];
  }, [t, employees, taiSanList, noiLuuList]);

  const exportColumns = useMemo<ExportColumn[]>(
    () => [
      { key: 'ma_phieu', label: t('capPhatThuHoi.store.maPhieuCol') },
      { key: 'loai_phieu', label: t('capPhatThuHoi.store.loaiCol') },
      { key: 'ten_nguoi_giu_truoc', label: t('capPhatThuHoi.store.nguoiGiuTruocCol') },
      { key: 'ten_nguoi_giu_sau', label: t('capPhatThuHoi.store.nguoiGiuSauCol') },
      { key: 'ngay_thuc_hien', label: t('capPhatThuHoi.store.ngayCol') },
      { key: 'ten_nguoi_thuc_hien', label: t('capPhatThuHoi.store.nguoiThucHienCol') },
      { key: 'ghi_chu', label: t('capPhatThuHoi.store.ghiChuCol') },
      { key: 'tg_cap_nhat', label: t('capPhatThuHoi.store.updatedCol') },
    ],
    [t]
  );

  const mapExport = useCallback((item: PhieuCapPhatThuHoi) => phieuToExportRow(item) as unknown as Record<string, unknown>, []);

  const { exportData, paginatedData, selectedData } = useExportData<PhieuCapPhatThuHoi>({
    data: sortedList,
    isOpen: showExport,
    mapFn: mapExport,
    pagination,
    selectedIds,
    keyExtractor: (p) => p.id,
  });

  const handleExport = useCallback(() => {
    if (sortedList.length === 0) {
      toast.warning(t('capPhatThuHoi.noExportData'));
      return;
    }
    setShowExport(true);
  }, [sortedList.length, t]);

  const handleImportData = useCallback(
    async (rows: Record<string, unknown>[]): Promise<ImportSummary> => {
      setImportErrors([]);
      const str = (v: unknown) => (v != null ? String(v) : undefined);
      const items = rows.map((row, idx) => {
        const { [IMPORT_ROW_KEY]: rowNo, ...values } = row;
        const data: PhieuCapPhatThuHoiImportRow = {
          loai_phieu: str(row.loai_phieu),
          // Ô ngày Excel là số serial — giữ nguyên kiểu để service tự quy đổi.
          ngay_thuc_hien: row.ngay_thuc_hien as string | undefined,
          ma_nguoi_thuc_hien: str(row.ma_nguoi_thuc_hien),
          ma_nguoi_giu_truoc: str(row.ma_nguoi_giu_truoc),
          ma_nguoi_giu_sau: str(row.ma_nguoi_giu_sau),
          ghi_chu_phieu: str(row.ghi_chu_phieu),
          ma_tai_san: str(row.ma_tai_san),
          ma_noi_luu_sau: str(row.ma_noi_luu_sau),
          ghi_chu_dong: str(row.ghi_chu_dong),
        };
        return { row: Number(rowNo ?? idx + 2), values, data };
      });
      const result = await importMutation.mutateAsync(items);
      setImportErrors(result.errors);
      return { created: result.created, updated: 0 };
    },
    [importMutation]
  );

  return {
    showImport,
    setShowImport,
    importErrors,
    closeImport: () => {
      setShowImport(false);
      setImportErrors([]);
    },
    showExport,
    setShowExport,
    IMPORT_COLUMNS,
    importSampleRows,
    importGuideNotes,
    importReferenceSheets,
    exportColumns,
    exportData,
    paginatedData,
    selectedData,
    handleExport,
    handleImportData,
    templateFileName: t('capPhatThuHoi.importTemplateName'),
    exportFileName: t('capPhatThuHoi.export.fileName'),
  };
}
