import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import TrangThaiTaiLieuToolbar from './trang-thai-tai-lieu-toolbar';
import TrangThaiTaiLieuTable from './trang-thai-tai-lieu-table';
import TrangThaiTaiLieuForm from './trang-thai-tai-lieu-form';
import TrangThaiTaiLieuDetail from './trang-thai-tai-lieu-detail';
import {
  useTrangThaiTaiLieuList,
  useDeleteTrangThaiTaiLieuList,
  useUpdateTrangThaiTaiLieuStatus,
} from '../hooks/use-trang-thai-tai-lieu';
import { useTrangThaiTaiLieuStore } from '../store/useTrangThaiTaiLieuStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import type { TrangThaiTaiLieu } from '../core/types';

const TrangThaiTaiLieuTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
  } = useTrangThaiTaiLieuStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TrangThaiTaiLieu | null>(null);
  const [detailItem, setDetailItem] = useState<TrangThaiTaiLieu | null>(null);

  const { data: list = [], isLoading } = useTrangThaiTaiLieuList();
  const deleteMutation = useDeleteTrangThaiTaiLieuList();
  const statusMutation = useUpdateTrangThaiTaiLieuStatus();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: TrangThaiTaiLieu, term: string, f: typeof filters) => {
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
    sorted.sort((a: TrangThaiTaiLieu, b: TrangThaiTaiLieu) => {
      const aVal = a[sort.column as keyof TrangThaiTaiLieu] ?? '';
      const bVal = b[sort.column as keyof TrangThaiTaiLieu] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleEdit = (item: TrangThaiTaiLieu) => {
    setEditingItem(item);
    setShowForm(true);
    if (detailItem?.id === item.id) setDetailItem(null);
  };

  const handleView = (item: TrangThaiTaiLieu) => {
    setDetailItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('thietLapTaiLieu.trangThai.deleteTitle'),
      message: t('thietLapTaiLieu.trangThai.deleteMessage'),
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
      title: t('thietLapTaiLieu.trangThai.bulkDeleteTitle'),
      message: t('thietLapTaiLieu.trangThai.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => deleteMutation.mutate(ids, { onSuccess: () => clearSelection() }),
    });
  };

  const handleStatusChangeMany = (ids: string[], status: 0 | 1) => {
    const statusLabel = status === 1 ? t('common.activeStatus') : t('common.inactiveStatus');
    confirm({
      title: t('thietLapTaiLieu.trangThai.statusChangeTitle'),
      message: t('thietLapTaiLieu.trangThai.statusChangeMessage', { count: ids.length, status: statusLabel }),
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
      <TrangThaiTaiLieuToolbar
        items={list}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onStatusChangeMany={handleStatusChangeMany}
      />
      <div className="flex-1 min-h-0 overflow-auto px-2 pb-2">
        <TrangThaiTaiLieuTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRowClick={handleView}
        />
      </div>
      <AnimatePresence>
        {showForm && (
          <TrangThaiTaiLieuForm initialData={editingItem} onClose={handleCloseForm} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {detailItem && (
          <TrangThaiTaiLieuDetail
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

export default TrangThaiTaiLieuTab;
