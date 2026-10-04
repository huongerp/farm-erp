import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import DanhSachKhoToolbar from './components/danh-sach-kho-toolbar';
import DanhSachKhoList from './components/danh-sach-kho-list';
import DanhSachKhoForm from './components/danh-sach-kho-form';
import DanhSachKhoDetail from './components/danh-sach-kho-detail';
import ExportDialog from '../../../components/shared/LazyExportDialog';
import ImportDialog from '../../../components/shared/LazyImportDialog';
import {
  useKhoList,
  useDeleteKho,
  useUpdateKhoStatus,
  useDeleteKhoMany,
} from './hooks/use-kho';
import { useKhoStore, DEFAULT_COLUMNS } from './store/useKhoStore';
import { useKhoImport } from './hooks/use-kho-import';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { useExportData } from '../../../lib/useExportData';
import { TRANG_THAI_HOAT_DONG } from '../../../lib/constants';
import { Kho } from './core/types';
import { createListSearchMatcher } from '../../../lib/list-search-matcher';

/** Ô tìm kiếm quét MỌI cột của bảng, bỏ dấu tiếng Việt — xem lib/list-search-matcher.ts. */
const khopTimKiem = createListSearchMatcher({ columns: DEFAULT_COLUMNS });

const DanhSachKhoPage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    resetState,
    selectedIds,
    columns,
    resizeColumn,
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
  } = useKhoStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Kho | null>(null);
  // Bản chụp lúc mở chi tiết; bản hiển thị (viewingItem) lấy dòng mới nhất từ list khi refetch.
  const [viewingSnapshot, setViewingItem] = useState<Kho | null>(null);
  const [showExport, setShowExport] = useState(false);

  const { data: khoList = [], isLoading } = useKhoList();
  const nextThuTu = useMemo(
    () => (khoList.length === 0 ? 1 : Math.max(...khoList.map((k) => k.thu_tu ?? 0)) + 1),
    [khoList]
  );
  const deleteMutation = useDeleteKho();
  const deleteManyMutation = useDeleteKhoMany();
  const statusMutation = useUpdateKhoStatus();
  const importer = useKhoImport();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const viewingItem = useMemo(
    () => (viewingSnapshot ? (khoList.find((k) => k.id === viewingSnapshot.id) ?? viewingSnapshot) : null),
    [khoList, viewingSnapshot]
  );

  const filterFn = useCallback((item: Kho, term: string, f: typeof filters) => {
    const matchesSearch = khopTimKiem(item, term);
    const statusKey = item.trang_thai === 'Đang hoạt động' ? 'Active' : 'Inactive';
    const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
    const matchesBranch =
      f.id_chi_nhanh.length === 0 || (item.id_chi_nhanh != null && f.id_chi_nhanh.includes(item.id_chi_nhanh));
    return matchesSearch && matchesStatus && matchesBranch;
  }, []);

  const filteredList = useListWithFilter(khoList, searchTerm, filters, filterFn);

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

  const EXPORT_COLUMNS = useMemo(
    () => [
      { key: 'ma_kho', label: t('kho.exportCode') },
      { key: 'ten_kho', label: t('kho.exportName') },
      { key: 'ten_chi_nhanh', label: t('kho.form.branch') },
      { key: 'dia_chi', label: t('kho.form.address') },
      { key: 'mo_ta', label: t('kho.detail.description') },
      { key: 'thu_tu', label: t('kho.exportOrder') },
      { key: 'trang_thai_text', label: t('kho.exportStatus') },
    ],
    [t]
  );

  const exportMapFn = useCallback(
    (item: Kho) => ({
      ma_kho: item.ma_kho,
      ten_kho: item.ten_kho,
      ten_chi_nhanh: item.ten_chi_nhanh ?? '',
      dia_chi: item.dia_chi ?? '',
      mo_ta: item.mo_ta ?? '',
      thu_tu: item.thu_tu,
      trang_thai_text: item.trang_thai,
    }),
    []
  );

  const {
    exportData,
    paginatedData: paginatedExportData,
    selectedData: selectedExportData,
  } = useExportData({
    data: filteredList,
    isOpen: showExport,
    mapFn: exportMapFn,
    pagination: exportPagination,
    selectedIds,
    keyExtractor: (item) => item.id,
  });

  const visibleColumnKeys = useMemo(() => EXPORT_COLUMNS.map((c) => c.key), [EXPORT_COLUMNS]);

  const handleEdit = (item: Kho) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('kho.deleteTitle'),
      message: t('kho.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
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
      title: t('kho.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        await deleteManyMutation.mutateAsync(ids);
        clearSelection();
        if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
      },
    });
  };

  const handleStatusChangeMany = (status: 0 | 1) => {
    const ids = Array.from(selectedIds);
    const statusText = status === 1 ? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG : TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
    const statusLabel = status === 1 ? t('kho.active') : t('kho.inactive');
    confirm({
      title: t('kho.statusChangeTitle'),
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

  const handleExport = () => {
    if (filteredList.length === 0) {
      toast.warning(t('kho.noExportData'));
      return;
    }
    setShowExport(true);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <DanhSachKhoToolbar
          khoList={khoList}
          selectedCount={selectedIds.size}
          onAdd={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          onExport={handleExport}
          onImport={canCreate ? importer.openImport : undefined}
          onDeleteMany={handleDeleteMany}
          onStatusChangeMany={handleStatusChangeMany}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />

        <div className="flex-1 min-h-0 flex flex-col">
          <DanhSachKhoList
            data={filteredList}
            columns={columns}
            onResizeColumn={resizeColumn}
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
            onView={setViewingItem}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <DanhSachKhoForm
            initialData={editingItem}
            defaultThuTu={nextThuTu}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <DanhSachKhoDetail
            data={viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
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
            fileName="Danh_Sach_Kho"
            visibleColumnKeys={visibleColumnKeys}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {importer.showImport && (
          <ImportDialog
            open={importer.showImport}
            onClose={importer.closeImport}
            columns={importer.importColumns}
            sampleRows={importer.sampleRows}
            referenceSheets={importer.referenceSheets}
            importErrors={importer.importErrors}
            onImport={importer.handleImport}
            templateFileName={importer.templateFileName}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachKhoPage;
