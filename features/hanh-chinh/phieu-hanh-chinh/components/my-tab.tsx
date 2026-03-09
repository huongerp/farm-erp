import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Ban } from 'lucide-react';
import AdminFormToolbar from './admin-form-toolbar';
import AdminFormTable from './admin-form-table';
import AdminFormForm from './admin-form-form';
import AdminFormDetail from './admin-form-detail';
import {
  useAdminForms,
  useCancelAdminForm,
  useDeleteAdminForm,
  useDeleteAdminForms,
  useCancelAdminForms,
} from '../hooks/use-admin-form';
import { useAdminFormMyStore } from '../store/useAdminFormMyStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { AdminFormRequest } from '../core/types';
import { getAdminFormTypeLabel } from '../../thiet-lap-cong-luong/core/constants';
import { useAuthStore } from '../../../../store/useStore';

const AdminFormMyTab: React.FC = () => {
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
  } = useAdminFormMyStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminFormRequest | null>(null);
  const [viewingItem, setViewingItem] = useState<AdminFormRequest | null>(null);

  const { data: forms = [], isLoading } = useAdminForms();
  const cancelMutation = useCancelAdminForm();
  const deleteMutation = useDeleteAdminForm();
  const deleteManyMutation = useDeleteAdminForms();
  const cancelManyMutation = useCancelAdminForms();

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
        item.ngay.includes(term);
      const matchesStatus = f.status.length === 0 || f.status.includes(item.trang_thai);
      const matchesType = f.type.length === 0 || f.type.includes(item.loai_phieu);
      const matchesShift = f.shift.length === 0 || f.shift.includes(item.ca);
      const matchesMonth = !f.month || item.ngay.startsWith(f.month);
      return matchesSearch && matchesStatus && matchesType && matchesShift && matchesMonth;
    },
    [t, filters]
  );

  const currentUserId = user?.id ?? 'emp-000';
  const effectiveUserId = useMemo(() => {
    if (forms.some((f) => f.nguoi_tao_id === currentUserId)) return currentUserId;
    if (forms.some((f) => f.nguoi_tao_id === 'emp-000')) return 'emp-000';
    return currentUserId;
  }, [forms, currentUserId]);
  const myForms = useMemo(
    () => forms.filter((f) => f.nguoi_tao_id === effectiveUserId),
    [forms, effectiveUserId]
  );
  const filteredList = useListWithFilter(myForms, searchTerm, filters, filterFn);

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

  const bulkActions = selectedIds.size > 0 ? (
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
        items={myForms}
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
        onAdd={() => setShowForm(true)}
        onDeleteMany={handleDeleteMany}
        bulkActions={bulkActions}
        searchPlaceholder={t('adminForm.my.searchPlaceholder')}
      />
      <div className="flex-1 min-h-0">
        <AdminFormTable
          data={sortedList}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          useStore={useAdminFormMyStore}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminFormMyTab;
