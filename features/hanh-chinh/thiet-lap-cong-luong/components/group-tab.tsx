import React, { useCallback, useEffect, useMemo, useState } from 'react';
import i18n from '../../../../lib/i18n';
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
import { usePayrollFormGroupStore, DEFAULT_COLUMNS } from '../store/usePayrollFormGroupStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { PayrollAdminFormGroup } from '../core/types';
import { getAdminFormTypeLabel } from '../core/constants';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { createListSearchMatcher } from '../../../../lib/list-search-matcher';

/** Ô tìm kiếm quét MỌI cột của bảng, bỏ dấu tiếng Việt — xem lib/list-search-matcher.ts. */
const khopTimKiem = createListSearchMatcher<PayrollAdminFormGroup>({
  columns: DEFAULT_COLUMNS,
  // Nhãn tiếng Việt của loại chỉ có sau khi dịch — không nằm trên bản ghi.
  getCellText: (colId, item) => (colId === 'loai_phieu' ? getAdminFormTypeLabel(item.loai_phieu, i18n.t.bind(i18n)) : ''),
});

const PayrollFormGroupTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
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
      const matchesSearch = khopTimKiem(item, term);
      const statusKey = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Active' : 'Inactive';
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
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), getLanguage());
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

  const handleStatusChangeMany = (ids: string[], status: import('../../../../lib/constants').TrangThaiHoatDong) => {
    const statusLabel = status === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('payrollIp.active') : t('payrollIp.inactive');
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
        onAdd={canCreate ? () => { setDetailItem(null); setEditingItem(null); setShowForm(true); } : undefined}
        onDeleteMany={canDelete ? handleDeleteMany : undefined}
        onStatusChangeMany={canUpdate ? handleStatusChangeMany : undefined}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0">
        <PayrollFormGroupTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          canUpdate={canUpdate}
          canDelete={canDelete}
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
            onDelete={(id) => { setDetailItem(null); handleDelete(id); }}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayrollFormGroupTab;
