import React, { useEffect, useMemo, useState } from 'react';
import type { AdminFormListServerQuery } from '../services/admin-form-list-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import AdminFormToolbar from './admin-form-toolbar';
import AdminFormTable from './admin-form-table';
import AdminFormDetail from './admin-form-detail';
import AdminFormForm from './admin-form-form';
import {
  useAdminFormPage,
  useApproveAdminFormByHcns,
  useRejectAdminFormByHcns,
  useApproveAdminFormsByManager,
  useRejectAdminFormsByManager,
  useApproveAdminFormsByHcns,
  useRejectAdminFormsByHcns,
  useDeleteAdminForm,
  useDeleteAdminForms,
  useCancelAdminForm,
} from '../hooks/use-admin-form';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useAdminFormManagedStore } from '../store/useAdminFormManagedStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_YES } from '../../../../lib/button-labels';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { AdminFormRequest } from '../core/types';
import { useAuthStore } from '../../../../store/useStore';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';

const AdminFormManagedTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const { canUpdate, canDelete } = useModulePermissionFromContext();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useAdminFormManagedStore);
  const searchTerm = useAdminFormManagedStore((s) => s.searchTerm);
  const filters = useAdminFormManagedStore((s) => s.filters);
  const sort = useAdminFormManagedStore((s) => s.sort);
  const pagination = useAdminFormManagedStore((s) => s.pagination);
  const resetState = useAdminFormManagedStore((s) => s.resetState);
  const clearSelection = useAdminFormManagedStore((s) => s.clearSelection);
  const selectedIds = useAdminFormManagedStore((s) => s.selectedIds);
  const columns = useAdminFormManagedStore((s) => s.columns);
  const setFilter = useAdminFormManagedStore((s) => s.setFilter);
  const toggleColumn = useAdminFormManagedStore((s) => s.toggleColumn);
  const reorderColumns = useAdminFormManagedStore((s) => s.reorderColumns);
  const resetColumns = useAdminFormManagedStore((s) => s.resetColumns);
  const resetColumnWidths = useAdminFormManagedStore((s) => s.resetColumnWidths);

  const [viewingItem, setViewingItem] = useState<AdminFormRequest | null>(null);
  const [editingItem, setEditingItem] = useState<AdminFormRequest | null>(null);

  /** Bộ lọc gửi thẳng xuống PostgREST — trước đây tab này tải toàn bộ bảng phiếu. */
  const listServerQuery: AdminFormListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      status: filters.status ?? [],
      type: filters.type ?? [],
      shift: filters.shift ?? [],
      month: filters.month ?? '',
      nguoiTaoId: null,
      loaiTruNguoiTaoId: null,
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort]
  );

  const pageQuery = useAdminFormPage(listServerQuery);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;
  const approveHcnsMutation = useApproveAdminFormByHcns();
  const rejectHcnsMutation = useRejectAdminFormByHcns();
  const approveManyManagerMutation = useApproveAdminFormsByManager();
  const rejectManyManagerMutation = useRejectAdminFormsByManager();
  const approveManyHcnsMutation = useApproveAdminFormsByHcns();
  const rejectManyHcnsMutation = useRejectAdminFormsByHcns();
  const deleteMutation = useDeleteAdminForm();
  const deleteManyMutation = useDeleteAdminForms();
  const cancelMutation = useCancelAdminForm();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);


  const handleApproveHcns = (id: string) => {
    confirm({
      title: t('adminForm.actions.approveHr'),
      message: t('adminForm.confirmApprove'),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        approveHcnsMutation.mutate(id);
      },
    });
  };

  const handleRejectHcns = (id: string) => {
    confirm({
      title: t('adminForm.actions.rejectHr'),
      message: t('adminForm.confirmReject'),
      variant: 'danger',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        rejectHcnsMutation.mutate(id);
      },
    });
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('adminForm.deleteTitle'),
      message: t('adminForm.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        deleteMutation.mutate(id);
      },
    });
  };

  const handleCancel = (id: string) => {
    confirm({
      title: t('adminForm.cancelTitle'),
      message: t('adminForm.cancelMessage'),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        cancelMutation.mutate(id);
        setViewingItem(null);
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('adminForm.deleteTitle'),
      message: t('adminForm.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        deleteManyMutation.mutate(ids, { onSuccess: () => clearSelection() });
      },
    });
  };

  const handleApproveMany = (ids: string[]) => {
    confirm({
      title: t('adminForm.bulkApproveTitle'),
      message: t('adminForm.bulkApproveMessage', { count: ids.length }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        approveManyManagerMutation.mutate(ids, { onSuccess: () => clearSelection() });
      },
    });
  };

  const handleRejectMany = (ids: string[]) => {
    confirm({
      title: t('adminForm.bulkRejectTitle'),
      message: t('adminForm.bulkRejectMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        rejectManyManagerMutation.mutate(ids, { onSuccess: () => clearSelection() });
      },
    });
  };

  const handleApproveManyHcns = (ids: string[]) => {
    confirm({
      title: t('adminForm.bulkApproveHrTitle'),
      message: t('adminForm.bulkApproveHrMessage', { count: ids.length }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        approveManyHcnsMutation.mutate(ids, { onSuccess: () => clearSelection() });
      },
    });
  };

  const handleRejectManyHcns = (ids: string[]) => {
    confirm({
      title: t('adminForm.bulkRejectHrTitle'),
      message: t('adminForm.bulkRejectHrMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        rejectManyHcnsMutation.mutate(ids, { onSuccess: () => clearSelection() });
      },
    });
  };

  const bulkActions = selectedIds.size > 0 && canUpdate ? (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleApproveMany(Array.from(selectedIds))}
        className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all active:scale-95 text-xs font-semibold"
      >
        <CheckCircle2 size={14} /> {t('adminForm.actions.approveManager')}
      </button>
      <button
        onClick={() => handleRejectMany(Array.from(selectedIds))}
        className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all active:scale-95 text-xs font-semibold"
      >
        <XCircle size={14} /> {t('adminForm.actions.rejectManager')}
      </button>
      {user?.role === 'admin' && (
        <>
          <button
            onClick={() => handleApproveManyHcns(Array.from(selectedIds))}
            className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 transition-all active:scale-95 text-xs font-semibold"
          >
            <ShieldCheck size={14} /> {t('adminForm.actions.approveHr')}
          </button>
          <button
            onClick={() => handleRejectManyHcns(Array.from(selectedIds))}
            className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all active:scale-95 text-xs font-semibold"
          >
            <XCircle size={14} /> {t('adminForm.actions.rejectHr')}
          </button>
        </>
      )}
    </div>
  ) : null;

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <AdminFormToolbar
        items={pageList}
        searchTerm={searchInput}
        setSearchTerm={setSearchInput}
        filters={filters}
        setFilter={setFilter as any}
        columns={columns}
        toggleColumn={toggleColumn}
        reorderColumns={reorderColumns}
        resetColumns={resetColumns}
        resetColumnWidths={resetColumnWidths}
        selectedIds={selectedIds}
        clearSelection={clearSelection}
        onDeleteMany={canDelete ? handleDeleteMany : undefined}
        bulkActions={bulkActions}
      />
      <div className="flex-1 min-h-0">
        <AdminFormTable
          data={pageList}
          totalRecordsOverride={totalCount}
          isFetching={isFetching}
          isLoading={isLoading}
          onView={(item) => setViewingItem(item)}
          onEdit={(item) => setEditingItem(item)}
          onDelete={handleDelete}
          useStore={useAdminFormManagedStore}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      </div>

      <AnimatePresence>
        {viewingItem && (
          <AdminFormDetail
            data={viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={(item) => {
              setViewingItem(null);
              setEditingItem(item);
            }}
            onDelete={handleDelete}
            onCancel={handleCancel}
            onApproveHcns={handleApproveHcns}
            onRejectHcns={handleRejectHcns}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingItem && (
          <AdminFormForm
            initialData={editingItem}
            onClose={() => setEditingItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminFormManagedTab;
