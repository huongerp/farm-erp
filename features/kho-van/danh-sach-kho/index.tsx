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
  useImportKho,
} from './hooks/use-kho';
import { useKhoStore } from './store/useKhoStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { useExportData } from '../../../lib/useExportData';
import { TRANG_THAI_HOAT_DONG } from '../../../lib/constants';
import { Kho } from './core/types';
import type { KhoFormValues } from './core/schema';

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
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
  } = useKhoStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Kho | null>(null);
  const [viewingItem, setViewingItem] = useState<Kho | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const { data: khoList = [], isLoading } = useKhoList();
  const nextThuTu = useMemo(
    () => (khoList.length === 0 ? 1 : Math.max(...khoList.map((k) => k.thu_tu ?? 0)) + 1),
    [khoList]
  );
  const deleteMutation = useDeleteKho();
  const deleteManyMutation = useDeleteKhoMany();
  const statusMutation = useUpdateKhoStatus();
  const importMutation = useImportKho(() => setShowImport(false));

  const IMPORT_COLUMNS = useMemo(
    () => [
      { key: 'ma_kho', label: t('kho.form.code'), required: true },
      { key: 'ten_kho', label: t('kho.form.name'), required: true },
      { key: 'id_chi_nhanh', label: t('kho.form.branch') },
      { key: 'dia_chi', label: t('kho.form.address') },
      { key: 'mo_ta', label: t('kho.detail.description') },
      { key: 'thu_tu', label: t('kho.detail.order') },
      { key: 'trang_thai', label: t('common.status') },
    ],
    [t]
  );

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = khoList.find((k) => k.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [khoList, viewingItem?.id]);

  const filterFn = useCallback((item: Kho, term: string, f: typeof filters) => {
    const searchLower = term.toLowerCase();
    const matchesSearch =
      !term ||
      item.ten_kho.toLowerCase().includes(searchLower) ||
      item.ma_kho.toLowerCase().includes(searchLower) ||
      (item.dia_chi?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ten_chi_nhanh?.toLowerCase().includes(searchLower) ?? false);
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

  const handleImportData = async (data: Record<string, unknown>[]) => {
    const rows = data.map((row) => {
      const raw = row.trang_thai;
      const trangThai =
        raw === 0 || String(raw).trim() === '0' || String(raw).trim().toLowerCase() === 'ngừng hoạt động'
          ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
          : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
      const idChiNhanh = row.id_chi_nhanh != null && String(row.id_chi_nhanh).trim() !== ''
        ? String(row.id_chi_nhanh).trim()
        : null;
      return {
        ma_kho: String(row.ma_kho ?? '').trim().toUpperCase(),
        ten_kho: String(row.ten_kho ?? '').trim(),
        dia_chi: row.dia_chi != null ? String(row.dia_chi).trim() : undefined,
        mo_ta: row.mo_ta != null ? String(row.mo_ta).trim() : undefined,
        id_chi_nhanh: idChiNhanh,
        thu_tu: Math.max(1, Number(row.thu_tu) || 1),
        trang_thai: trangThai,
      };
    });
    await importMutation.mutateAsync(rows);
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
          onImport={() => setShowImport(true)}
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
        {showImport && (
          <ImportDialog
            open={showImport}
            onClose={() => setShowImport(false)}
            columns={IMPORT_COLUMNS}
            onImport={handleImportData}
            templateFileName={t('kho.importTemplateName')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachKhoPage;
