import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import PhongBanToolbar from './components/phong-ban-toolbar';
import DepartmentList from './components/phong-ban-list';
import DepartmentForm from './components/phong-ban-form';
import DepartmentDetail from './components/phong-ban-detail';
import ExportDialog from '../../../components/shared/LazyExportDialog';
import ImportDialog from '../../../components/shared/LazyImportDialog';
import { useDepartments, useDeleteDepartment, useUpdateStatusDepartment, useImportDepartments } from './hooks/use-phong-ban';
import { useDepartmentStore } from './store/useDepartmentStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { useExportData } from '../../../lib/useExportData';
import { Department } from './core/types';
import type { DepartmentFormValues } from './core/schema';
import { TRANG_THAI, type TrangThai } from '../../../lib/constants';

const DepartmentPage = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const { searchTerm, filters, resetState, selectedIds, columns, clearSelection, toggleSelection, toggleAllSelection } = useDepartmentStore();

  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [viewingDept, setViewingDept] = useState<Department | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: departments = [], isLoading } = useDepartments();
  const deleteMutation = useDeleteDepartment();
  const statusMutation = useUpdateStatusDepartment();
  const importMutation = useImportDepartments(() => setShowImport(false));

  const IMPORT_COLUMNS = useMemo(
    () => [
      { key: 'ten_phong_ban', label: t('department.name'), required: true },
      { key: 'chuc_nang', label: t('department.store.chucNangCol') },
      { key: 'tt', label: t('department.detail.order') },
      { key: 'trang_thai', label: t('common.status') },
    ],
    [t]
  );

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (!viewingDept) return;
    const fresh = departments.find((d) => d.id === viewingDept.id);
    if (fresh && fresh !== viewingDept) setViewingDept(fresh);
  }, [departments, viewingDept?.id]);

  const filterFn = useCallback(
    (item: Department, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ten_phong_ban.toLowerCase().includes(searchLower) ||
        (item.chuc_nang ?? '').toLowerCase().includes(searchLower);
      const statusKey = item.trang_thai === TRANG_THAI.DANG_DUNG ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      const matchesPhong = f.id_phong_goc.length === 0 || f.id_phong_goc.includes(item.id);
      return matchesSearch && matchesStatus && matchesPhong;
    },
    []
  );

  const filteredDepartments = useListWithFilter(
    departments,
    searchTerm,
    filters,
    filterFn
  );

  useEffect(() => {
    setPage(1);
  }, [filteredDepartments.length]);

  const maxPage = Math.max(1, Math.ceil(filteredDepartments.length / pageSize));
  useEffect(() => {
    setPage((p) => Math.min(p, maxPage));
  }, [pageSize, maxPage]);

  const exportPagination = useMemo(
    () => ({ page: 1, pageSize: Math.max(filteredDepartments.length, 1) }),
    [filteredDepartments.length]
  );

  const EXPORT_COLUMNS = useMemo(
    () => [
      { key: 'ten_phong_ban', label: t('department.exportName') },
      { key: 'chuc_nang', label: t('department.store.chucNangCol') },
      { key: 'tt', label: t('department.exportOrder') },
      { key: 'trang_thai_text', label: t('department.exportStatus') },
    ],
    [t]
  );

  const exportMapFn = useCallback(
    (item: Department) => ({
      ten_phong_ban: item.ten_phong_ban,
      chuc_nang: item.chuc_nang ?? '',
      tt: item.tt,
      trang_thai_text:
        item.trang_thai === TRANG_THAI.DANG_DUNG ? t('department.active') : t('department.inactive'),
    }),
    [t]
  );

  const {
    exportData,
    paginatedData: paginatedExportData,
    selectedData: selectedExportData,
  } = useExportData({
    data: filteredDepartments,
    isOpen: showExport,
    mapFn: exportMapFn,
    pagination: exportPagination,
    selectedIds,
    keyExtractor: (item) => item.id,
  });

  const visibleColumnKeys = useMemo(
    () => EXPORT_COLUMNS.map((c) => c.key),
    [EXPORT_COLUMNS]
  );

  const handleEdit = (item: Department) => {
    setEditingDept(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('department.deleteTitle'),
      message: t('department.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            if (viewingDept?.id === id) setViewingDept(null);
          },
        });
      },
    });
  };

  const handleStatusChange = (item: Department) => {
    const newStatus = item.trang_thai === TRANG_THAI.DANG_DUNG ? TRANG_THAI.NGUNG : TRANG_THAI.DANG_DUNG;
    const statusLabel = newStatus === TRANG_THAI.DANG_DUNG ? t('department.active') : t('department.inactive');
    confirm({
      title: t('department.statusChangeTitle'),
      message: t('department.statusChangeMessage', { name: item.ten_phong_ban, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate(
          { id: item.id, status: newStatus },
          {
            onSuccess: (updated) => {
              if (viewingDept?.id === item.id) setViewingDept(updated);
            },
          }
        );
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('department.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        for (const id of ids) {
          await deleteMutation.mutateAsync(id).catch(() => {});
        }
        clearSelection();
        if (viewingDept && ids.includes(viewingDept.id)) setViewingDept(null);
      },
    });
  };

  const handleStatusChangeMany = (status: TrangThai) => {
    const ids = Array.from(selectedIds);
    const statusLabel = status === TRANG_THAI.DANG_DUNG ? t('department.active') : t('department.inactive');
    confirm({
      title: t('department.statusChangeTitle'),
      message: t('common.statusChangeManyConfirm', { count: ids.length, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        for (const id of ids) {
          await statusMutation.mutateAsync({ id, status });
        }
        clearSelection();
      },
    });
  };

  const handleImportData = async (data: Record<string, unknown>[]) => {
    const rows: DepartmentFormValues[] = data.map((row) => ({
      ten_phong_ban: String(row.ten_phong_ban ?? '').trim(),
      chuc_nang: row.chuc_nang != null ? String(row.chuc_nang).trim() : undefined,
      tt: Number(row.tt) || 0,
      trang_thai: String(row.trang_thai).includes('Ngừng') ? TRANG_THAI.NGUNG : TRANG_THAI.DANG_DUNG,
    }));
    await importMutation.mutateAsync(rows);
  };

  const handleCloseForm = () => {
    const wasEditing = editingDept;
    setShowForm(false);
    if (wasEditing && viewingDept?.id === wasEditing.id) {
      const fresh = departments.find((d) => d.id === wasEditing.id);
      setViewingDept(fresh ?? null);
    }
    setEditingDept(null);
  };

  const handleExport = () => {
    if (filteredDepartments.length === 0) {
      toast.warning(t('department.noExportData'));
      return;
    }
    setShowExport(true);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <PhongBanToolbar
          departments={departments}
          selectedCount={selectedIds.size}
          onAdd={() => setShowForm(true)}
          onExport={handleExport}
          onImport={() => setShowImport(true)}
          onDeleteMany={handleDeleteMany}
          onStatusChangeMany={handleStatusChangeMany}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />

        <div className="flex-1 min-h-0 flex flex-col">
          <DepartmentList
            data={filteredDepartments}
            columns={columns}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onToggleAllSelection={toggleAllSelection}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={setViewingDept}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <DepartmentForm
            initialData={editingDept}
            allDepartments={departments}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingDept && !showForm && (
          <DepartmentDetail
            data={viewingDept}
            allDepartments={departments}
            onClose={() => setViewingDept(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            canUpdate={canUpdate}
            canDelete={canDelete}
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
            fileName="Danh_Sach_Phong_Ban"
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
            templateFileName={t('department.importTemplateName')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DepartmentPage;
