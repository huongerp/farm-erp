import React, { useEffect, useMemo, useState } from 'react';
import type { AdminFormListServerQuery } from '../services/admin-form-list-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Ban } from 'lucide-react';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import AdminFormToolbar from './admin-form-toolbar';
import AdminFormTable from './admin-form-table';
import AdminFormForm from './admin-form-form';
import AdminFormDetail from './admin-form-detail';
import {
  useAdminFormPage,
  useCancelAdminForm,
  useDeleteAdminForm,
  useDeleteAdminForms,
  useCancelAdminForms,
} from '../hooks/use-admin-form';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useAdminFormMyStore } from '../store/useAdminFormMyStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { AdminFormRequest } from '../core/types';
import { useAuthStore } from '../../../../store/useStore';

/** Phiếu mở từ deep-link `?phieu=<id>` của thông báo — index.tsx đã nạp và kiểm quyền. */
interface Props {
  deepLinkItem?: AdminFormRequest | null;
  onDeepLinkConsumed?: () => void;
}

const AdminFormMyTab: React.FC<Props> = ({ deepLinkItem, onDeepLinkConsumed }) => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useAdminFormMyStore);
  const searchTerm = useAdminFormMyStore((s) => s.searchTerm);
  const filters = useAdminFormMyStore((s) => s.filters);
  const sort = useAdminFormMyStore((s) => s.sort);
  const pagination = useAdminFormMyStore((s) => s.pagination);
  const resetState = useAdminFormMyStore((s) => s.resetState);
  const clearSelection = useAdminFormMyStore((s) => s.clearSelection);
  const selectedIds = useAdminFormMyStore((s) => s.selectedIds);
  const columns = useAdminFormMyStore((s) => s.columns);
  const setFilter = useAdminFormMyStore((s) => s.setFilter);
  const toggleColumn = useAdminFormMyStore((s) => s.toggleColumn);
  const reorderColumns = useAdminFormMyStore((s) => s.reorderColumns);
  const resetColumns = useAdminFormMyStore((s) => s.resetColumns);
  const resetColumnWidths = useAdminFormMyStore((s) => s.resetColumnWidths);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminFormRequest | null>(null);
  const [viewingItem, setViewingItem] = useState<AdminFormRequest | null>(null);

  const currentUserId = user?.id ?? '';

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
      nguoiTaoId: currentUserId || null,
      loaiTruNguoiTaoId: null,
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, currentUserId]
  );

  const pageQuery = useAdminFormPage(listServerQuery, Boolean(currentUserId));
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;
  const cancelMutation = useCancelAdminForm();
  const deleteMutation = useDeleteAdminForm();
  const deleteManyMutation = useDeleteAdminForms();
  const cancelManyMutation = useCancelAdminForms();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  // Phiếu đến từ thông báo: nhận sẵn cả đối tượng nên mở được kể cả khi nó
  // không nằm trong trang đang xem (danh sách phân trang ở server).
  useEffect(() => {
    if (!deepLinkItem) return;
    setViewingItem(deepLinkItem);
    onDeepLinkConsumed?.();
  }, [deepLinkItem, onDeepLinkConsumed]);


  const handleEdit = (item: AdminFormRequest) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleView = (item: AdminFormRequest) => {
    setViewingItem(item);
  };

  const handleCancel = (id: string) => {
    confirm({
      title: t('adminForm.cancelTitle'),
      message: t('adminForm.cancelMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        cancelMutation.mutate(id);
      },
    });
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('adminForm.deleteTitle'),
      message: t('adminForm.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate(id);
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('adminForm.deleteTitle'),
      message: t('adminForm.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteManyMutation.mutate(ids, { onSuccess: () => clearSelection() });
      },
    });
  };

  const handleCancelMany = (ids: string[]) => {
    confirm({
      title: t('adminForm.bulkCancelTitle'),
      message: t('adminForm.bulkCancelMessage', { count: ids.length }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        cancelManyMutation.mutate(ids, { onSuccess: () => clearSelection() });
      },
    });
  };

  const bulkActions = canUpdate && selectedIds.size > 0 ? (
    <button
      onClick={() => handleCancelMany(Array.from(selectedIds))}
      className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all active:scale-95 text-xs font-semibold"
    >
      <Ban size={14} /> {t('adminForm.actions.cancel')}
    </button>
  ) : null;

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

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
        onAdd={canCreate ? () => setShowForm(true) : undefined}
        onDeleteMany={canDelete ? handleDeleteMany : undefined}
        bulkActions={bulkActions}
      />
      <div className="flex-1 min-h-0">
        <AdminFormTable
          data={pageList}
          totalRecordsOverride={totalCount}
          isFetching={isFetching}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          useStore={useAdminFormMyStore}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <AdminFormForm initialData={editingItem} onClose={handleCloseForm} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && (
          <AdminFormDetail
            data={viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={(item) => { setViewingItem(null); handleEdit(item); }}
            onDelete={handleDelete}
            onCancel={handleCancel}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminFormMyTab;
