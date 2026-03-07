import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import LoaiTaiLieuToolbar from './loai-tai-lieu-toolbar';
import LoaiTaiLieuTable from './loai-tai-lieu-table';
import LoaiTaiLieuForm from './loai-tai-lieu-form';
import LoaiTaiLieuDetail from './loai-tai-lieu-detail';
import {
  useLoaiTaiLieuList,
  useDeleteLoaiTaiLieuList,
  useUpdateLoaiTaiLieuStatus,
} from '../hooks/use-loai-tai-lieu';
import { useLoaiTaiLieuStore } from '../store/useLoaiTaiLieuStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import type { LoaiTaiLieu } from '../core/types';

const LoaiTaiLieuTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
  } = useLoaiTaiLieuStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<LoaiTaiLieu | null>(null);
  const [detailItem, setDetailItem] = useState<LoaiTaiLieu | null>(null);

  const { data: list = [], isLoading } = useLoaiTaiLieuList();
  const deleteMutation = useDeleteLoaiTaiLieuList();
  const statusMutation = useUpdateLoaiTaiLieuStatus();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: LoaiTaiLieu, term: string, f: typeof filters) => {
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
    sorted.sort((a: LoaiTaiLieu, b: LoaiTaiLieu) => {
      const aVal = a[sort.column as keyof LoaiTaiLieu] ?? '';
      const bVal = b[sort.column as keyof LoaiTaiLieu] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleEdit = (item: LoaiTaiLieu) => {
    setEditingItem(item);
    setShowForm(true);
    if (detailItem?.id === item.id) setDetailItem(null);
  };

  const handleView = (item: LoaiTaiLieu) => {
    setDetailItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('thietLapTaiLieu.loai.deleteTitle'),
      message: t('thietLapTaiLieu.loai.deleteMessage'),
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
      title: t('thietLapTaiLieu.loai.bulkDeleteTitle'),
      message: t('thietLapTaiLieu.loai.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => deleteMutation.mutate(ids, { onSuccess: () => clearSelection() }),
    });
  };

  const handleStatusChangeMany = (ids: string[], status: 0 | 1) => {
    const statusLabel = status === 1 ? t('common.activeStatus') : t('common.inactiveStatus');
    confirm({
      title: t('thietLapTaiLieu.loai.statusChangeTitle'),
      message: t('thietLapTaiLieu.loai.statusChangeMessage', { count: ids.length, status: statusLabel }),
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
      <LoaiTaiLieuToolbar
        items={list}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onStatusChangeMany={handleStatusChangeMany}
      />
      <div className="flex-1 min-h-0 overflow-auto px-2 pb-2">
        <LoaiTaiLieuTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRowClick={handleView}
        />
      </div>
      <AnimatePresence>
        {showForm && (
          <LoaiTaiLieuForm initialData={editingItem} onClose={handleCloseForm} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {detailItem && (
          <LoaiTaiLieuDetail
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

export default LoaiTaiLieuTab;
