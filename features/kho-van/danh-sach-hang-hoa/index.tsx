import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Package, ClipboardList } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import DanhSachHangHoaToolbar from './components/DanhSachHangHoaToolbar';
import DanhSachHangHoaList from './components/DanhSachHangHoaList';
import DanhSachHangHoaForm from './components/DanhSachHangHoaForm';
import DanhSachHangHoaDetail from './components/DanhSachHangHoaDetail';
import DinhMucTonTab from './components/DinhMucTonTab';
import ImportDialog from '../../../components/shared/LazyImportDialog';
import type { ImportReferenceSheet, ImportSampleRow } from '../../../components/shared/ImportDialog';
import ExportDialog from '../../../components/shared/LazyExportDialog';
import {
  useHangHoaList,
  useDeleteHangHoa,
  useDeleteHangHoaMany,
  useUpdateHangHoaStatus,
  useImportHangHoa,
} from './hooks/use-hang-hoa';
import { useDinhMucTonKho } from '../ton-kho/hooks/use-ton-kho';
import { useDanhMucHangHoaList } from '../danh-muc-hang-hoa/hooks/use-danh-muc-hang-hoa';
import { useHangHoaStore } from './store/useHangHoaStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { useExportData } from '../../../lib/useExportData';
import { TRANG_THAI_HOAT_DONG } from '../../../lib/constants';
import type { HangHoa } from './core/types';
import type { DinhMucSummaryMap } from './components/DanhSachHangHoaList';
import type { HangHoaImportRow, ImportHangHoaResult } from './services/hang-hoa-service';

const DanhSachHangHoaPage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    resetState,
    selectedIds,
    columns,
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
  } = useHangHoaStore();

  const [activeTab, setActiveTab] = useState<'danhSach' | 'dinhMucTon'>('danhSach');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingItem, setEditingItem] = useState<HangHoa | null>(null);
  const [viewingItem, setViewingItem] = useState<HangHoa | null>(null);
  const [importErrors, setImportErrors] = useState<ImportHangHoaResult['errors']>([]);

  const { data: list = [], isLoading } = useHangHoaList();
  const { data: danhMucList = [] } = useDanhMucHangHoaList();
  const { data: dinhMucMap } = useDinhMucTonKho();

  /** Map hang_hoa_id -> { tong (sum ton_toi_thieu), soKho } cho cột Tổng định mức (tab Danh sách). */
  const dinhMucSummaryMap = useMemo<DinhMucSummaryMap>(() => {
    const out: DinhMucSummaryMap = {};
    if (!dinhMucMap) return out;
    dinhMucMap.forEach((ton, key) => {
      const [, hang_hoa_id] = key.split('|');
      if (!out[hang_hoa_id]) out[hang_hoa_id] = { tong: 0, soKho: 0 };
      out[hang_hoa_id].tong += ton;
      out[hang_hoa_id].soKho += 1;
    });
    return out;
  }, [dinhMucMap]);
  const nextThuTu = useMemo(
    () => (list.length === 0 ? 1 : Math.max(...list.map((h) => h.thu_tu ?? 0)) + 1),
    [list]
  );
  /** Các đơn vị tính đã có trong bảng – gợi ý khi nhập DVT (datalist). */
  const existingDvtList = useMemo(
    () =>
      [...new Set(list.map((h) => h.dvt).filter((x): x is string => x != null && x.trim() !== ''))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [list]
  );
  const deleteMutation = useDeleteHangHoa();
  const deleteManyMutation = useDeleteHangHoaMany();
  const statusMutation = useUpdateHangHoaStatus();
  const importMutation = useImportHangHoa(() => {});

  const IMPORT_COLUMNS = useMemo(
    () => [
      { key: 'ma_hang_hoa', label: t('hangHoa.form.code'), required: true },
      { key: 'ten_hang_hoa', label: t('hangHoa.form.name'), required: true },
      { key: 'danh_muc', label: t('hangHoa.import.danhMucCol'), required: true },
      { key: 'dvt', label: t('hangHoa.form.unit'), required: true },
      { key: 'don_gia', label: t('hangHoa.form.price') },
      { key: 'mo_ta', label: t('hangHoa.store.descCol') },
      { key: 'trang_thai', label: t('hangHoa.store.statusCol') },
    ],
    [t]
  );

  const importSampleRows = useMemo<ImportSampleRow[]>(
    () => [
      ['SP-001', 'Giấy A4 70gsm', 'VPP', 'Ram', 50000, 'Giấy in chất lượng cao', 'Đang hoạt động'],
      ['SP-002', 'Bút bi xanh', 'VPP', 'Cây', 5000, '', 'Đang hoạt động'],
    ],
    []
  );

  const importReferenceSheets = useMemo<ImportReferenceSheet[]>(() => {
    const danhMucCha = danhMucList.filter((d) => !d.id_cha || d.id_cha.trim() === '');
    const danhMucCon = danhMucList.filter((d) => d.id_cha && d.id_cha.trim() !== '');
    const chaById: Record<string, string> = {};
    danhMucCha.forEach((d) => { chaById[d.id] = d.ten_danh_muc; });

    const dmData = danhMucCon.map((d) => [
      d.ma_danh_muc,
      d.ten_danh_muc,
      d.id_cha ? chaById[d.id_cha] ?? '' : '',
    ]);

    const dvtSet = [...new Set(list.map((h) => h.dvt).filter((x): x is string => x != null && x.trim() !== ''))].sort();

    const sheets: ImportReferenceSheet[] = [
      {
        name: t('hangHoa.import.refSheetDanhMuc'),
        headers: [t('hangHoa.import.refMaDanhMuc'), t('hangHoa.import.refTenDanhMuc'), t('hangHoa.import.refTenCap1')],
        data: dmData,
      },
    ];

    if (dvtSet.length > 0) {
      sheets.push({
        name: t('hangHoa.import.refSheetDVT'),
        headers: [t('hangHoa.form.unit')],
        data: dvtSet.map((d) => [d]),
      });
    }

    return sheets;
  }, [danhMucList, list, t]);

  const EXPORT_COLUMNS = useMemo(
    () => [
      { key: 'thu_tu', label: t('hangHoa.store.orderCol') },
      { key: 'ma_hang_hoa', label: t('hangHoa.store.codeCol') },
      { key: 'ten_hang_hoa', label: t('hangHoa.store.nameCol') },
      { key: 'ten_danh_muc', label: t('hangHoa.store.categoryCol') },
      { key: 'dvt', label: t('hangHoa.store.unitCol') },
      { key: 'don_gia', label: t('hangHoa.store.priceCol') },
      { key: 'mo_ta', label: t('hangHoa.store.descCol') },
      { key: 'trang_thai_text', label: t('hangHoa.store.statusCol') },
    ],
    [t]
  );

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = list.find((h) => h.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [list, viewingItem?.id]);

  const filterFn = useCallback(
    (item: HangHoa, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ten_hang_hoa.toLowerCase().includes(searchLower) ||
        item.ma_hang_hoa.toLowerCase().includes(searchLower) ||
        (item.ten_danh_muc?.toLowerCase().includes(searchLower) ?? false) ||
        (item.dvt?.toLowerCase().includes(searchLower) ?? false);
      const statusKey = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      const matchesDanhMucCha =
        f.id_danh_muc_cha.length === 0 ||
        (item.danh_muc_cha_id != null && f.id_danh_muc_cha.includes(item.danh_muc_cha_id));
      const matchesDanhMucCon =
        f.id_danh_muc.length === 0 ||
        (item.danh_muc_id != null && f.id_danh_muc.includes(item.danh_muc_id));
      const matchesDvt =
        f.dvt.length === 0 || (item.dvt != null && item.dvt.trim() !== '' && f.dvt.includes(item.dvt.trim()));
      return (
        matchesSearch &&
        matchesStatus &&
        matchesDanhMucCha &&
        matchesDanhMucCon &&
        matchesDvt
      );
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const exportPagination = useMemo(
    () => ({ page: 1, pageSize: Math.max(filteredList.length, 1) }),
    [filteredList.length]
  );

  const exportMapFn = useCallback(
    (item: HangHoa) => ({
      thu_tu: item.thu_tu,
      ma_hang_hoa: item.ma_hang_hoa,
      ten_hang_hoa: item.ten_hang_hoa,
      ten_danh_muc: item.ten_danh_muc ?? '',
      dvt: item.dvt ?? '',
      don_gia: item.don_gia ?? '',
      mo_ta: item.mo_ta ?? '',
      trang_thai_text:
        item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('hangHoa.active') : t('hangHoa.inactive'),
    }),
    [t]
  );

  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } = useExportData({
    data: filteredList,
    isOpen: showExport,
    mapFn: exportMapFn,
    pagination: exportPagination,
    selectedIds,
    keyExtractor: (item) => item.id,
  });

  const visibleColumnKeys = useMemo(() => EXPORT_COLUMNS.map((c) => c.key), [EXPORT_COLUMNS]);

  const handleEdit = (item: HangHoa) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleView = (item: HangHoa) => {
    setViewingItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('hangHoa.deleteTitle'),
      message: t('hangHoa.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            if (viewingItem?.id === id) setViewingItem(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('hangHoa.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteManyMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
          },
        });
      },
    });
  };

  const handleStatusChangeMany = (status: 0 | 1) => {
    const ids = Array.from(selectedIds);
    const statusText = status === 1 ? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG : TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
    const statusLabel = status === 1 ? t('hangHoa.active') : t('hangHoa.inactive');
    confirm({
      title: t('hangHoa.statusChangeTitle'),
      message: t('common.statusChangeManyConfirm', { count: ids.length, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        for (const id of ids) {
          await statusMutation.mutateAsync({ id, status: statusText });
        }
        clearSelection();
      },
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleImportData = async (data: Record<string, unknown>[]) => {
    setImportErrors([]);
    const rows: HangHoaImportRow[] = data.map((row) => ({
      ma_hang_hoa: row.ma_hang_hoa != null ? String(row.ma_hang_hoa) : undefined,
      ten_hang_hoa: row.ten_hang_hoa != null ? String(row.ten_hang_hoa) : undefined,
      danh_muc: row.danh_muc != null ? String(row.danh_muc) : undefined,
      dvt: row.dvt != null ? String(row.dvt) : undefined,
      don_gia: row.don_gia as string | number | undefined,
      mo_ta: row.mo_ta != null ? String(row.mo_ta) : undefined,
      trang_thai: row.trang_thai != null ? String(row.trang_thai) : undefined,
    }));
    const result = await importMutation.mutateAsync(rows);
    if (result.errors.length > 0) {
      setImportErrors(result.errors);
    }
    if (result.created > 0 || result.updated > 0) {
      if (result.errors.length === 0) setShowImport(false);
    }
  };

  const tabs = useMemo(
    () => [
      { id: 'danhSach', label: t('hangHoa.tabs.danhSach'), icon: Package },
      { id: 'dinhMucTon', label: t('hangHoa.tabs.dinhMucTon'), icon: ClipboardList },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as 'danhSach' | 'dinhMucTon')} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        {activeTab === 'danhSach' && (
          <>
            <DanhSachHangHoaToolbar
              data={list}
              selectedCount={selectedIds.size}
              onAdd={handleAdd}
              onExport={() => setShowExport(true)}
              onImport={() => setShowImport(true)}
              onDeleteMany={handleDeleteMany}
              onStatusChangeMany={handleStatusChangeMany}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
            <div className="flex-1 min-h-0 flex flex-col">
              <DanhSachHangHoaList
                data={filteredList}
                columns={columns}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                onToggleAllSelection={toggleAllSelection}
                isLoading={isLoading}
                page={pagination.page}
                pageSize={pagination.pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onEdit={canUpdate ? handleEdit : undefined}
                onDelete={canDelete ? handleDelete : undefined}
                onView={handleView}
                dinhMucSummaryMap={dinhMucSummaryMap}
              />
            </div>
          </>
        )}
        {activeTab === 'dinhMucTon' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <DinhMucTonTab onBack={() => setActiveTab('danhSach')} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <DanhSachHangHoaForm
            initialData={editingItem}
            defaultThuTu={nextThuTu}
            existingDvtList={existingDvtList}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <DanhSachHangHoaDetail
            data={viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={canUpdate ? (item) => { setViewingItem(null); handleEdit(item); } : undefined}
            onDelete={canDelete ? (id) => { setViewingItem(null); handleDelete(id); } : undefined}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImport && (
          <ImportDialog
            open={showImport}
            onClose={() => { setShowImport(false); setImportErrors([]); }}
            columns={IMPORT_COLUMNS}
            onImport={handleImportData}
            templateFileName={t('hangHoa.import.templateName')}
            referenceSheets={importReferenceSheets}
            sampleRows={importSampleRows}
            importErrors={importErrors}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={EXPORT_COLUMNS}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={t('hangHoa.export.fileName')}
            visibleColumnKeys={visibleColumnKeys}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachHangHoaPage;
