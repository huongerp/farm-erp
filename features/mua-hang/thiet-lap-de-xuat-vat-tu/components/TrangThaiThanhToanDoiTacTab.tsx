import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import TrangThaiThanhToanDoiTacToolbar from './TrangThaiThanhToanDoiTacToolbar';
import TrangThaiThanhToanDoiTacTable from './TrangThaiThanhToanDoiTacTable';
import TrangThaiThanhToanDoiTacForm from './TrangThaiThanhToanDoiTacForm';
import TrangThaiThanhToanDoiTacDetail from './TrangThaiThanhToanDoiTacDetail';
import {
  useTrangThaiThanhToanDoiTacList,
  useDeleteTrangThaiThanhToanDoiTacList,
  useUpdateTrangThaiThanhToanDoiTacStatus,
} from '../hooks/use-trang-thai-thanh-toan-doi-tac';
import { useTrangThaiThanhToanDoiTacStore } from '../store/useTrangThaiThanhToanDoiTacStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import type { TrangThaiThanhToanDoiTac } from '../core/types';

const TrangThaiThanhToanDoiTacTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
  } = useTrangThaiThanhToanDoiTacStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TrangThaiThanhToanDoiTac | null>(null);
  const [detailItem, setDetailItem] = useState<TrangThaiThanhToanDoiTac | null>(null);

  const { data: list = [], isLoading } = useTrangThaiThanhToanDoiTacList();
  const deleteMutation = useDeleteTrangThaiThanhToanDoiTacList();
  const statusMutation = useUpdateTrangThaiThanhToanDoiTacStatus();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: TrangThaiThanhToanDoiTac, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ma.toLowerCase().includes(searchLower) ||
        item.ten.toLowerCase().includes(searchLower) ||
        (item.ghi_chu && item.ghi_chu.toLowerCase().includes(searchLower));
      const statusKey = item.trang_thai === 1 ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: TrangThaiThanhToanDoiTac, b: TrangThaiThanhToanDoiTac) => {
      const aVal = a[sort.column as keyof TrangThaiThanhToanDoiTac] ?? '';
      const bVal = b[sort.column as keyof TrangThaiThanhToanDoiTac] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleEdit = (item: TrangThaiThanhToanDoiTac) => {
    setEditingItem(item);
    setShowForm(true);
    if (detailItem?.id === item.id) setDetailItem(null);
  };

  const handleView = (item: TrangThaiThanhToanDoiTac) => {
    setDetailItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('thietLapDeXuatVatTu.thanhToan.deleteTitle'),
      message: t('thietLapDeXuatVatTu.thanhToan.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () =>
        deleteMutation.mutate([id], {
          onSuccess: () => {
            if (detailItem?.id === id) setDetailItem(null);
          },
        }),
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('thietLapDeXuatVatTu.thanhToan.bulkDeleteTitle'),
      message: t('thietLapDeXuatVatTu.thanhToan.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => deleteMutation.mutate(ids, { onSuccess: () => clearSelection() }),
    });
  };

  const handleStatusChangeMany = (ids: string[], status: 0 | 1) => {
    const statusLabel = status === 1 ? t('common.activeStatus') : t('common.inactiveStatus');
    confirm({
      title: t('thietLapDeXuatVatTu.thanhToan.statusChangeTitle'),
      message: t('thietLapDeXuatVatTu.thanhToan.statusChangeMessage', { count: ids.length, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => statusMutation.mutate({ ids, status }, { onSuccess: () => clearSelection() }),
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <TrangThaiThanhToanDoiTacToolbar
        items={list}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onStatusChangeMany={handleStatusChangeMany}
      />
      <div className="flex-1 min-h-0 overflow-auto px-2 pb-2">
        <TrangThaiThanhToanDoiTacTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRowClick={handleView}
        />
      </div>
      <AnimatePresence>
        {showForm && (
          <TrangThaiThanhToanDoiTacForm initialData={editingItem} onClose={handleCloseForm} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {detailItem && (
          <TrangThaiThanhToanDoiTacDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrangThaiThanhToanDoiTacTab;
