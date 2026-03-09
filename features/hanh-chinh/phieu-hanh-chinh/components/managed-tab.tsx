import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import AdminFormToolbar from './admin-form-toolbar';
import AdminFormTable from './admin-form-table';
import AdminFormDetail from './admin-form-detail';
import AdminFormForm from './admin-form-form';
import {
  useAdminForms,
  useApproveAdminFormByManager,
  useRejectAdminFormByManager,
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
import { useAdminFormManagedStore } from '../store/useAdminFormManagedStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_YES } from '../../../../lib/button-labels';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { AdminFormRequest } from '../core/types';
import { getAdminFormTypeLabel } from '../../thiet-lap-cong-luong/core/constants';
import { useAuthStore } from '../../../../store/useStore';

const AdminFormManagedTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
    columns,
    setSearchTerm,
    setFilter,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useAdminFormManagedStore();

  const [viewingItem, setViewingItem] = useState<AdminFormRequest | null>(null);
  const [editingItem, setEditingItem] = useState<AdminFormRequest | null>(null);

  const { data: forms = [], isLoading } = useAdminForms();
  const approveManagerMutation = useApproveAdminFormByManager();
  const rejectManagerMutation = useRejectAdminFormByManager();
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

  const filterFn = useCallback(
    (item: AdminFormRequest, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const typeLabel = getAdminFormTypeLabel(item.loai_phieu, t).toLowerCase();
      const matchesSearch =
        !term ||
        typeLabel.includes(searchLower) ||
        item.ly_do.toLowerCase().includes(searchLower) ||
        item.ngay.includes(term) ||
        (item.ten_nguoi_tao && item.ten_nguoi_tao.toLowerCase().includes(searchLower));
      const matchesStatus = f.status.length === 0 || f.status.includes(item.trang_thai);
      const matchesType = f.type.length === 0 || f.type.includes(item.loai_phieu);
      const matchesShift = f.shift.length === 0 || f.shift.includes(item.ca);
      const matchesMonth = !f.month || item.ngay.startsWith(f.month);
      return matchesSearch && matchesStatus && matchesType && matchesShift && matchesMonth;
    },
    [t, filters]
  );

  const managedForms = useMemo(
    () => forms,
    [forms]
  );
  const filteredList = useListWithFilter(managedForms, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: any, b: any) => {
      const aVal = a[sort.column!] ?? '';
      const bVal = b[sort.column!] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleApproveManager = (id: string) => {
    confirm({
      title: t('adminForm.actions.approveManager'),
      message: t('adminForm.confirmApprove'),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        approveManagerMutation.mutate(id);
      },
    });
  };

  const handleRejectManager = (id: string) => {
    confirm({
      title: t('adminForm.actions.rejectManager'),
      message: t('adminForm.confirmReject'),
      variant: 'danger',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        rejectManagerMutation.mutate(id);
      },
    });
  };

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

  const bulkActions = selectedIds.size > 0 ? (
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
        items={managedForms}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filters}
        setFilter={setFilter as any}
        columns={columns}
        toggleColumn={toggleColumn}
        reorderColumns={reorderColumns}
        resetColumns={resetColumns}
        selectedIds={selectedIds}
        clearSelection={clearSelection}
        onDeleteMany={handleDeleteMany}
        bulkActions={bulkActions}
        searchPlaceholder={t('adminForm.manage.searchPlaceholder')}
      />
      <div className="flex-1 min-h-0">
        <AdminFormTable
          data={sortedList}
          isLoading={isLoading}
          onView={(item) => setViewingItem(item)}
          onEdit={(item) => setEditingItem(item)}
          onDelete={handleDelete}
          useStore={useAdminFormManagedStore}
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
            onApproveManager={handleApproveManager}
            onRejectManager={handleRejectManager}
            onApproveHcns={handleApproveHcns}
            onRejectHcns={handleRejectHcns}
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
