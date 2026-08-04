import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import BranchToolbar from './components/chi-nhanh-toolbar';
import BranchTable from './components/chi-nhanh-table';
import BranchForm from './components/chi-nhanh-form';
import BranchDetail from './components/chi-nhanh-detail';
import { useBranches, useDeleteBranches, useUpdateStatusBranch } from './hooks/use-chi-nhanh';
import { useBranchStore } from './store/useBranchStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { getLanguage } from '../../../lib/utils';
import { TRANG_THAI } from '../../../lib/constants';
import { Branch } from './core/types';

const BranchPage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
  } = useBranchStore();

  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [viewingBranch, setViewingBranch] = useState<Branch | null>(null);
  const [formOrigin, setFormOrigin] = useState<'list' | 'detail'>('list');

  const { data: branches = [], isLoading } = useBranches();
  const deleteMutation = useDeleteBranches();
  const statusMutation = useUpdateStatusBranch();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (!viewingBranch) return;
    const fresh = branches.find((b) => b.id === viewingBranch.id);
    if (fresh && fresh !== viewingBranch) setViewingBranch(fresh);
  }, [branches, viewingBranch?.id]);

  const filterFn = useCallback(
    (item: Branch, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ten_chi_nhanh.toLowerCase().includes(searchLower) ||
        item.ma_chi_nhanh.toLowerCase().includes(searchLower) ||
        item.dia_chi.toLowerCase().includes(searchLower) ||
        item.tinh_thanh.toLowerCase().includes(searchLower) ||
        item.quan_huyen.toLowerCase().includes(searchLower);
      const statusKey = item.trang_thai === TRANG_THAI.DANG_DUNG ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    []
  );

  const filteredBranches = useListWithFilter(branches, searchTerm, filters, filterFn);

  const sortedBranches = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredBranches;
    const sorted = [...filteredBranches];
    sorted.sort((a: any, b: any) => {
      const aVal = a[sort.column!] ?? '';
      const bVal = b[sort.column!] ?? '';
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredBranches, sort]);

  const handleEdit = (item: Branch) => {
    setFormOrigin(viewingBranch ? 'detail' : 'list');
    setEditingBranch(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('branch.deleteTitle'),
      message: t('branch.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            if (viewingBranch?.id === id) setViewingBranch(null);
          },
        });
      },
    });
  };

  const handleStatusChange = (item: Branch) => {
    const newStatus = item.trang_thai === TRANG_THAI.DANG_DUNG ? TRANG_THAI.NGUNG : TRANG_THAI.DANG_DUNG;
    const statusLabel = newStatus === TRANG_THAI.DANG_DUNG ? t('branch.active') : t('branch.inactive');
    confirm({
      title: t('branch.statusChangeTitle'),
      message: t('branch.statusChangeMessage', { count: 1, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate(
          { ids: [item.id], status: newStatus },
          {
            onSuccess: (updated) => {
              if (updated && viewingBranch?.id === updated.id) setViewingBranch(updated);
            },
          }
        );
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('branch.bulkDeleteTitle'),
      message: t('branch.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        deleteMutation.mutate(ids, { onSuccess: () => clearSelection() });
      },
    });
  };

  const handleStatusChangeMany = (ids: string[], status: Branch['trang_thai']) => {
    const statusLabel = status === TRANG_THAI.DANG_DUNG ? t('branch.active') : t('branch.inactive');
    confirm({
      title: t('branch.statusChangeTitle'),
      message: t('branch.statusChangeMessage', { count: ids.length, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate({ ids, status }, { onSuccess: () => clearSelection() });
      },
    });
  };

  const handleCloseForm = () => {
    const wasEditing = editingBranch;
    const origin = formOrigin;
    setShowForm(false);
    setEditingBranch(null);
    if (origin === 'detail' && viewingBranch && wasEditing && viewingBranch.id === wasEditing.id) {
      const fresh = branches.find((b) => b.id === viewingBranch.id);
      if (fresh) setViewingBranch(fresh);
    }
    setFormOrigin('list');
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <BranchToolbar
          items={branches}
          onAdd={() => setShowForm(true)}
          onDeleteMany={handleDeleteMany}
          onStatusChangeMany={handleStatusChangeMany}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />

        <div className="flex-1 min-h-0">
          <BranchTable
            data={sortedBranches}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={setViewingBranch}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <BranchForm initialData={editingBranch} onClose={handleCloseForm} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingBranch && !showForm && (
          <BranchDetail
            data={viewingBranch}
            onClose={() => setViewingBranch(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BranchPage;
