import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import PayrollFormGroupToolbar from './group-toolbar';
import PayrollFormGroupTable from './group-table';
import PayrollFormGroupForm from './group-form';
import PayrollFormGroupDetail from './group-detail';
import {
  usePayrollAdminFormGroups,
  useDeletePayrollAdminFormGroups,
  useUpdatePayrollAdminFormGroupStatus,
} from '../hooks/use-payroll-form-group';
import { usePayrollFormGroupStore } from '../store/usePayrollFormGroupStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { PayrollAdminFormGroup } from '../core/types';
import { getAdminFormTypeLabel } from '../core/constants';

const PayrollFormGroupTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
  } = usePayrollFormGroupStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PayrollAdminFormGroup | null>(null);
  const [detailItem, setDetailItem] = useState<PayrollAdminFormGroup | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  const { data: groups = [], isLoading } = usePayrollAdminFormGroups();
  const deleteMutation = useDeletePayrollAdminFormGroups();
  const statusMutation = useUpdatePayrollAdminFormGroupStatus();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: PayrollAdminFormGroup, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const typeLabel = getAdminFormTypeLabel(item.loai_phieu, t).toLowerCase();
      const matchesSearch =
        !term ||
        typeLabel.includes(searchLower) ||
        (item.ghi_chu && item.ghi_chu.toLowerCase().includes(searchLower));
      const statusKey = item.trang_thai === 1 ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      const matchesType = f.type.length === 0 || f.type.includes(item.loai_phieu);
      return matchesSearch && matchesStatus && matchesType;
    },
    [t]
  );

  const filteredList = useListWithFilter(groups, searchTerm, filters, filterFn);

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

  const handleView = (item: PayrollAdminFormGroup) => {
    setEditingItem(null);
    setShowForm(false);
    setDetailItem(item);
  };

  const handleEdit = (item: PayrollAdminFormGroup) => {
    setEditingItem(item);
    setShowForm(true);
    if (detailItem?.id === item.id) {
      setOpenedFormFromDetailId(item.id);
      setDetailItem(null);
    } else {
      setDetailItem(null);
      setOpenedFormFromDetailId(null);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('payrollIp.groups.deleteTitle'),
      message: t('payrollIp.groups.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            if (detailItem?.id === id) setDetailItem(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('payrollIp.groups.bulkDeleteTitle'),
      message: t('payrollIp.groups.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        deleteMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (detailItem && ids.includes(detailItem.id)) setDetailItem(null);
          },
        });
      },
    });
  };

  const handleStatusChangeMany = (ids: string[], status: 0 | 1) => {
    const statusLabel = status === 1 ? t('payrollIp.active') : t('payrollIp.inactive');
    confirm({
      title: t('payrollIp.groups.statusChangeTitle'),
      message: t('payrollIp.groups.statusChangeMessage', { count: ids.length, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate(
          { ids, status },
          {
            onSuccess: () => {
              clearSelection();
              if (detailItem && ids.includes(detailItem.id)) {
                const next = groups.find((x) => x.id === detailItem.id);
                if (next) setDetailItem(next);
              }
            },
          }
        );
      },
    });
  };

  const handleCloseForm = () => {
    const wasFromDetail = openedFormFromDetailId != null;
    const editingId = editingItem?.id;
    setShowForm(false);
    setEditingItem(null);
    setOpenedFormFromDetailId(null);
    if (wasFromDetail && editingId) {
      const fresh = groups.find((r) => r.id === editingId) ?? null;
      setDetailItem(fresh);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <PayrollFormGroupToolbar
        items={groups}
        onAdd={() => {
          setDetailItem(null);
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onStatusChangeMany={handleStatusChangeMany}
      />
      <div className="flex-1 min-h-0">
        <PayrollFormGroupTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <PayrollFormGroupForm initialData={editingItem} onClose={handleCloseForm} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailItem && !showForm && (
          <PayrollFormGroupDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={(item) => handleEdit(item)}
            onDelete={(id) => {
              setDetailItem(null);
              handleDelete(id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayrollFormGroupTab;
