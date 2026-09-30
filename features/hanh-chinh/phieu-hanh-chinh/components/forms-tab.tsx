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
  useAdminFormTomTat,
  useApproveAdminFormByHcns,
  useRejectAdminFormByHcns,
  useApproveAdminFormsByManager,
  useRejectAdminFormsByManager,
  useApproveAdminFormsByHcns,
  useRejectAdminFormsByHcns,
  useDeleteAdminForm,
  useDeleteAdminForms,
  useCancelAdminForm,
  useCancelAdminForms,
} from '../hooks/use-admin-form';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useAdminFormListStore } from '../store/useAdminFormListStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { Ban, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { AdminFormRequest } from '../core/types';
import { useAuthStore } from '../../../../store/useStore';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';

interface Props {
  /** Được xem phiếu của mọi người + duyệt (quản trị / cấp bậc 1). */
  viewAll: boolean;
  /** Phạm vi xem chưa nạp xong — chưa truy vấn để không lộ phiếu người khác. */
  dangTaiPhamVi: boolean;
  /** Phiếu mở từ deep-link `?phieu=<id>` của thông báo — index.tsx đã nạp và kiểm quyền. */
  deepLinkItem?: AdminFormRequest | null;
  onDeepLinkConsumed?: () => void;
}

/**
 * Tab "Phiếu" duy nhất: gộp "Của tôi" + "Tôi quản lý" cũ.
 * - viewAll: thấy phiếu mọi người (có cả phiếu của mình), lọc bằng chip Người gửi, được duyệt.
 * - còn lại: chỉ phiếu của chính mình, như tab "Của tôi" cũ.
 */
const AdminFormFormsTab: React.FC<Props> = ({ viewAll, dangTaiPhamVi, deepLinkItem, onDeepLinkConsumed }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? '';
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useAdminFormListStore);
  const searchTerm = useAdminFormListStore((s) => s.searchTerm);
  const filters = useAdminFormListStore((s) => s.filters);
  const sort = useAdminFormListStore((s) => s.sort);
  const pagination = useAdminFormListStore((s) => s.pagination);
  const resetState = useAdminFormListStore((s) => s.resetState);
  const clearSelection = useAdminFormListStore((s) => s.clearSelection);
  const selectedIds = useAdminFormListStore((s) => s.selectedIds);
  const columns = useAdminFormListStore((s) => s.columns);
  const setFilter = useAdminFormListStore((s) => s.setFilter);
  const toggleColumn = useAdminFormListStore((s) => s.toggleColumn);
  const reorderColumns = useAdminFormListStore((s) => s.reorderColumns);
  const resetColumns = useAdminFormListStore((s) => s.resetColumns);
  const resetColumnWidths = useAdminFormListStore((s) => s.resetColumnWidths);

  const [viewingItem, setViewingItem] = useState<AdminFormRequest | null>(null);
  const [editingItem, setEditingItem] = useState<AdminFormRequest | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  /** Phạm vi người tạo: viewAll = mọi người (null); không thì ép đúng chính mình. */
  const phamViNguoiTao: string[] | null = viewAll ? null : [currentUserId];
  const duocTruyVan = !dangTaiPhamVi && !!currentUserId;

  const listServerQuery: AdminFormListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      status: filters.status ?? [],
      type: filters.type ?? [],
      month: filters.month ?? '',
      nguoiTaoIds: viewAll
        ? (filters.nguoiTao ?? []).length > 0 ? filters.nguoiTao : null
        : [currentUserId],
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, viewAll, currentUserId]
  );

  const pageQuery = useAdminFormPage(listServerQuery, duocTruyVan);
  const tomTatQuery = useAdminFormTomTat(phamViNguoiTao, duocTruyVan);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && (pageQuery.isPending || !duocTruyVan);
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
      confirmText: CONFIRM_DELETE(),
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

  // Duyệt / từ chối chỉ dành cho người có viewAll — nếu không, nhân viên thường
  // có quyền sửa (để sửa phiếu của mình) sẽ thấy nút Duyệt sau khi gộp tab.
  const bulkActions = selectedIds.size > 0 && canUpdate ? (
    <div className="flex items-center gap-2">
      {viewAll && (
        <>
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
        </>
      )}
      <button
        onClick={() => handleCancelMany(Array.from(selectedIds))}
        className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all active:scale-95 text-xs font-semibold"
      >
        <Ban size={14} /> {t('adminForm.actions.cancel')}
      </button>
    </div>
  ) : null;

  const formItem = editingItem;
  const showForm = showCreate || !!editingItem;
  const closeForm = () => {
    setShowCreate(false);
    setEditingItem(null);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <AdminFormToolbar
        tomTat={tomTatQuery.data ?? []}
        showPersonFilter={viewAll}
        currentUserId={currentUserId}
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
        onAdd={canCreate ? () => setShowCreate(true) : undefined}
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
          useStore={useAdminFormListStore}
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
            onApproveHcns={viewAll ? handleApproveHcns : undefined}
            onRejectHcns={viewAll ? handleRejectHcns : undefined}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && <AdminFormForm initialData={formItem} onClose={closeForm} />}
      </AnimatePresence>
    </div>
  );
};

export default AdminFormFormsTab;
