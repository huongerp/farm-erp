import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useExportData } from '../../../../lib/useExportData';
import { formatDateShort } from '../../../../lib/utils';
import type { PaginationState } from '../../../../store/createGenericStore';
import type {
  ImportColumn,
  ImportReferenceSheet,
  ImportSampleRow,
} from '../../../../components/shared/LazyImportDialog';
import type { ImportErrorRow, ImportMode, ImportOptions, ImportRefColumn, ImportSummary } from '../../../../lib/import-types';
import type { FarmDanhMuc, FarmHangHoa } from '../core/types';
import type { HangHoaRefColumn } from '../utils/import-hang-hoa';
import { useImportFarmHangHoa } from './use-farm-hang-hoa';
import { useImportFarmDanhMuc } from './use-farm-danh-muc';

/**
 * Chế độ import khả dụng theo quyền.
 *
 * Mọi chế độ đều có thể sinh dòng mới nên nút Import chỉ mở cho người có quyền tạo
 * (gate ở index.tsx); riêng "ghi đè" đụng dữ liệu cũ nên cần thêm quyền sửa.
 */
function modesFor(canUpdate: boolean): ImportMode[] {
  return canUpdate ? ['create', 'upsert'] : ['create'];
}

interface HangHoaArgs {
  list: FarmHangHoa[];
  danhMucList: FarmDanhMuc[];
  filteredList: FarmHangHoa[];
  selectedIds: Set<string>;
  pagination: PaginationState;
  canUpdate: boolean;
}

export function useFarmHangHoaImportExport({
  list,
  danhMucList,
  filteredList,
  selectedIds,
  pagination,
  canUpdate,
}: HangHoaArgs) {
  const { t } = useTranslation();
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const importMutation = useImportFarmHangHoa();

  const importColumns = useMemo<ImportColumn[]>(
    () => [
      { key: 'ma_hang_hoa', label: t('farmHangHoaPhanThuoc.hangHoa.form.code'), required: true },
      { key: 'ten_hang_hoa', label: t('farmHangHoaPhanThuoc.hangHoa.form.name'), required: true },
      { key: 'danh_muc', label: t('farmHangHoaPhanThuoc.hangHoa.import.danhMucCol'), required: true },
      { key: 'dvt', label: t('farmHangHoaPhanThuoc.hangHoa.form.unit'), required: true },
      { key: 'pham_cap', label: t('farmHangHoaPhanThuoc.hangHoa.form.phamCap') },
      { key: 'don_gia', label: t('farmHangHoaPhanThuoc.hangHoa.form.price') },
      { key: 'mo_ta', label: t('farmHangHoaPhanThuoc.hangHoa.store.descCol') },
    ],
    [t]
  );

  const refColumns = useMemo<ImportRefColumn[]>(
    () => [
      { key: 'ma_hang_hoa', label: t('farmHangHoaPhanThuoc.hangHoa.import.refColMa') },
      { key: 'ten_hang_hoa', label: t('farmHangHoaPhanThuoc.hangHoa.import.refColTen') },
    ],
    [t]
  );

  /** Ưu tiên lấy dữ liệu thật làm ví dụ để người dùng thấy ngay định dạng đúng. */
  const sampleRows = useMemo<ImportSampleRow[]>(() => {
    const cap2 = danhMucList.filter((d) => d.id_cha && d.id_cha.trim() !== '');
    const dm1 = cap2[0]?.ma_danh_muc ?? 'PHAN_HC';
    const dm2 = cap2[1]?.ma_danh_muc ?? dm1;
    return [
      ['HH-001', 'Phân hữu cơ vi sinh', dm1, 'Bao', 'Loại 1', 250000, 'Bao 25kg'],
      ['HH-002', 'Thuốc trừ sâu sinh học', dm2, 'Chai', '', 85000, ''],
    ];
  }, [danhMucList]);

  const referenceSheets = useMemo<ImportReferenceSheet[]>(() => {
    const chaById: Record<string, string> = {};
    danhMucList
      .filter((d) => !d.id_cha || d.id_cha.trim() === '')
      .forEach((d) => { chaById[d.id] = d.ten_danh_muc; });

    const sheets: ImportReferenceSheet[] = [
      {
        name: t('farmHangHoaPhanThuoc.hangHoa.import.refSheetDanhMuc'),
        headers: [
          t('farmHangHoaPhanThuoc.hangHoa.import.refMaDanhMuc'),
          t('farmHangHoaPhanThuoc.hangHoa.import.refTenDanhMuc'),
          t('farmHangHoaPhanThuoc.hangHoa.import.refTenCap1'),
        ],
        data: danhMucList
          .filter((d) => d.id_cha && d.id_cha.trim() !== '')
          .map((d) => [d.ma_danh_muc, d.ten_danh_muc, (d.id_cha && chaById[d.id_cha]) ?? '']),
      },
    ];

    const dvtList = [...new Set(list.map((h) => h.dvt?.trim()).filter((x): x is string => !!x))].sort((a, b) =>
      a.localeCompare(b, 'vi')
    );
    if (dvtList.length > 0) {
      sheets.push({
        name: t('farmHangHoaPhanThuoc.hangHoa.import.refSheetDVT'),
        headers: [t('farmHangHoaPhanThuoc.hangHoa.form.unit')],
        data: dvtList.map((d) => [d]),
      });
    }

    const phamCapList = [...new Set(list.map((h) => h.pham_cap?.trim()).filter((x): x is string => !!x))].sort((a, b) =>
      a.localeCompare(b, 'vi')
    );
    if (phamCapList.length > 0) {
      sheets.push({
        name: t('farmHangHoaPhanThuoc.hangHoa.import.refSheetPhamCap'),
        headers: [t('farmHangHoaPhanThuoc.hangHoa.form.phamCap')],
        data: phamCapList.map((p) => [p]),
      });
    }

    return sheets;
  }, [danhMucList, list, t]);

  const handleImport = useCallback(
    async (rows: Record<string, unknown>[], { mode, refColumn }: ImportOptions): Promise<ImportSummary> => {
      setImportErrors([]);
      const result = await importMutation.mutateAsync({
        rows,
        mode,
        refColumn: (refColumn as HangHoaRefColumn) ?? 'ma_hang_hoa',
      });
      setImportErrors(result.errors);
      return { created: result.created, updated: result.updated };
    },
    [importMutation]
  );

  const exportColumns = useMemo(
    () => [
      { key: 'ma_hang_hoa', label: t('farmHangHoaPhanThuoc.hangHoa.store.codeCol') },
      { key: 'ten_hang_hoa', label: t('farmHangHoaPhanThuoc.hangHoa.store.nameCol') },
      { key: 'ten_danh_muc', label: t('farmHangHoaPhanThuoc.hangHoa.store.categoryCol') },
      { key: 'dvt', label: t('farmHangHoaPhanThuoc.hangHoa.store.unitCol') },
      { key: 'pham_cap', label: t('farmHangHoaPhanThuoc.hangHoa.store.phamCapCol') },
      { key: 'don_gia', label: t('farmHangHoaPhanThuoc.hangHoa.store.priceCol') },
      { key: 'mo_ta', label: t('farmHangHoaPhanThuoc.hangHoa.store.descCol') },
      { key: 'tg_cap_nhat', label: t('farmHangHoaPhanThuoc.hangHoa.store.updatedCol') },
    ],
    [t]
  );

  const exportMapFn = useCallback(
    (item: FarmHangHoa) => ({
      ma_hang_hoa: item.ma_hang_hoa,
      ten_hang_hoa: item.ten_hang_hoa,
      ten_danh_muc: item.ten_danh_muc ?? '',
      dvt: item.dvt ?? '',
      pham_cap: item.pham_cap ?? '',
      don_gia: item.don_gia ?? '',
      mo_ta: item.mo_ta ?? '',
      tg_cap_nhat: formatDateShort(item.tg_cap_nhat),
    }),
    []
  );

  const { exportData, paginatedData, selectedData } = useExportData({
    data: filteredList,
    isOpen: showExport,
    mapFn: exportMapFn,
    pagination,
    selectedIds,
    keyExtractor: (item) => item.id,
  });

  return {
    showImport,
    openImport: () => setShowImport(true),
    closeImport: () => { setShowImport(false); setImportErrors([]); },
    showExport,
    openExport: () => setShowExport(true),
    closeExport: () => setShowExport(false),
    importErrors,
    importColumns,
    refColumns,
    modes: modesFor(canUpdate),
    sampleRows,
    referenceSheets,
    handleImport,
    exportColumns,
    exportData,
    paginatedExportData: paginatedData,
    selectedExportData: selectedData,
    visibleColumnKeys: exportColumns.map((c) => c.key),
    templateFileName: t('farmHangHoaPhanThuoc.hangHoa.import.templateName'),
    exportFileName: t('farmHangHoaPhanThuoc.hangHoa.export.fileName'),
  };
}

interface DanhMucArgs {
  list: FarmDanhMuc[];
  filteredList: FarmDanhMuc[];
  selectedIds: Set<string>;
  pagination: PaginationState;
  canUpdate: boolean;
}

export function useFarmDanhMucImportExport({
  list,
  filteredList,
  selectedIds,
  pagination,
  canUpdate,
}: DanhMucArgs) {
  const { t } = useTranslation();
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const importMutation = useImportFarmDanhMuc();

  const tenChaById = useMemo(() => {
    const map: Record<string, string> = {};
    list.forEach((d) => { map[d.id] = d.ten_danh_muc; });
    return map;
  }, [list]);

  const importColumns = useMemo<ImportColumn[]>(
    () => [
      { key: 'ma_danh_muc', label: t('farmHangHoaPhanThuoc.danhMuc.form.code'), required: true },
      { key: 'ten_danh_muc', label: t('farmHangHoaPhanThuoc.danhMuc.form.name'), required: true },
      { key: 'danh_muc_cha', label: t('farmHangHoaPhanThuoc.danhMuc.import.chaCol') },
      { key: 'thu_tu', label: t('farmHangHoaPhanThuoc.danhMuc.store.orderCol') },
      { key: 'mo_ta', label: t('farmHangHoaPhanThuoc.danhMuc.store.descCol') },
    ],
    [t]
  );

  const sampleRows = useMemo<ImportSampleRow[]>(() => {
    const cap1 = list.find((d) => !d.id_cha || d.id_cha.trim() === '');
    const maCap1 = cap1?.ma_danh_muc ?? 'PHAN';
    return [
      [maCap1, cap1?.ten_danh_muc ?? 'Phân bón', '', 1, 'Danh mục cấp 1 — để trống cột cha'],
      ['PHAN_HC', 'Phân hữu cơ', maCap1, 2, 'Danh mục cấp 2 — ghi mã hoặc tên danh mục cấp 1'],
    ];
  }, [list]);

  const referenceSheets = useMemo<ImportReferenceSheet[]>(() => {
    const cap1 = list.filter((d) => !d.id_cha || d.id_cha.trim() === '');
    if (cap1.length === 0) return [];
    return [
      {
        name: t('farmHangHoaPhanThuoc.danhMuc.import.refSheetCap1'),
        headers: [
          t('farmHangHoaPhanThuoc.danhMuc.import.refMaDanhMuc'),
          t('farmHangHoaPhanThuoc.danhMuc.import.refTenDanhMuc'),
        ],
        data: cap1.map((d) => [d.ma_danh_muc, d.ten_danh_muc]),
      },
    ];
  }, [list, t]);

  const handleImport = useCallback(
    async (rows: Record<string, unknown>[], { mode }: ImportOptions): Promise<ImportSummary> => {
      setImportErrors([]);
      const result = await importMutation.mutateAsync({ rows, mode });
      setImportErrors(result.errors);
      return { created: result.created, updated: result.updated };
    },
    [importMutation]
  );

  const exportColumns = useMemo(
    () => [
      { key: 'thu_tu', label: t('farmHangHoaPhanThuoc.danhMuc.store.orderCol') },
      { key: 'ma_danh_muc', label: t('farmHangHoaPhanThuoc.danhMuc.store.codeCol') },
      { key: 'ten_danh_muc', label: t('farmHangHoaPhanThuoc.danhMuc.store.nameCol') },
      { key: 'ten_cha', label: t('farmHangHoaPhanThuoc.danhMuc.store.tenCha') },
      { key: 'mo_ta', label: t('farmHangHoaPhanThuoc.danhMuc.store.descCol') },
      { key: 'tg_cap_nhat', label: t('farmHangHoaPhanThuoc.danhMuc.store.updatedCol') },
    ],
    [t]
  );

  const exportMapFn = useCallback(
    (item: FarmDanhMuc) => ({
      thu_tu: item.thu_tu,
      ma_danh_muc: item.ma_danh_muc,
      ten_danh_muc: item.ten_danh_muc,
      ten_cha: item.id_cha ? tenChaById[item.id_cha] ?? '' : '',
      mo_ta: item.mo_ta ?? '',
      tg_cap_nhat: formatDateShort(item.tg_cap_nhat),
    }),
    [tenChaById]
  );

  const { exportData, paginatedData, selectedData } = useExportData({
    data: filteredList,
    isOpen: showExport,
    mapFn: exportMapFn,
    pagination,
    selectedIds,
    keyExtractor: (item) => item.id,
  });

  return {
    showImport,
    openImport: () => setShowImport(true),
    closeImport: () => { setShowImport(false); setImportErrors([]); },
    showExport,
    openExport: () => setShowExport(true),
    closeExport: () => setShowExport(false),
    importErrors,
    importColumns,
    modes: modesFor(canUpdate),
    sampleRows,
    referenceSheets,
    handleImport,
    exportColumns,
    exportData,
    paginatedExportData: paginatedData,
    selectedExportData: selectedData,
    visibleColumnKeys: exportColumns.map((c) => c.key),
    templateFileName: t('farmHangHoaPhanThuoc.danhMuc.import.templateName'),
    exportFileName: t('farmHangHoaPhanThuoc.danhMuc.export.fileName'),
  };
}
