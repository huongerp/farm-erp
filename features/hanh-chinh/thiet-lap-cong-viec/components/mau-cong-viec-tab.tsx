import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import MauCongViecToolbar from './mau-cong-viec-toolbar';
import MauCongViecTable from './mau-cong-viec-table';
import MauCongViecForm from './mau-cong-viec-form';
import {
  useMauCongViecList,
  useDeleteMauCongViecList,
  useUpdateMauCongViecStatus,
} from '../hooks/use-mau-cong-viec';
import { useMauCongViecStore } from '../store/useMauCongViecStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import type { MauCongViec } from '../core/types';
import { getUuTienLabel } from '../core/constants';

const MauCongViecTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
  } = useMauCongViecStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MauCongViec | null>(null);

  const { data: list = [], isLoading } = useMauCongViecList();
  const deleteMutation = useDeleteMauCongViecList();
  const statusMutation = useUpdateMauCongViecStatus();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: MauCongViec, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const uuTienLabel = getUuTienLabel(item.uu_tien_mac_dinh, t).toLowerCase();
      const matchesSearch =
        !term ||
        item.ten_mau.toLowerCase().includes(searchLower) ||
        (item.tieu_de_mac_dinh && item.tieu_de_mac_dinh.toLowerCase().includes(searchLower)) ||
        (item.mo_ta_mac_dinh && item.mo_ta_mac_dinh.toLowerCase().includes(searchLower)) ||
        uuTienLabel.includes(searchLower);
      const statusKey = item.trang_thai_mac_dinh === 1 ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      const matchesUuTien = f.uu_tien.length === 0 || f.uu_tien.includes(item.uu_tien_mac_dinh);
      return matchesSearch && matchesStatus && matchesUuTien;
    },
    [t]
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: MauCongViec, b: MauCongViec) => {
      const aVal = a[sort.column as keyof MauCongViec] ?? '';
      const bVal = b[sort.column as keyof MauCongViec] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleEdit = (item: MauCongViec) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('thietLapCongViec.mau.deleteTitle'),
      message: t('thietLapCongViec.mau.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id]);
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('thietLapCongViec.mau.bulkDeleteTitle'),
      message: t('thietLapCongViec.mau.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        deleteMutation.mutate(ids, { onSuccess: () => clearSelection() });
      },
    });
  };

  const handleStatusChangeMany = (ids: string[], status: 0 | 1) => {
    const statusLabel = status === 1 ? t('common.activeStatus') : t('common.inactiveStatus');
    confirm({
      title: t('thietLapCongViec.mau.statusChangeTitle'),
      message: t('thietLapCongViec.mau.statusChangeMessage', { count: ids.length, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate({ ids, status }, { onSuccess: () => clearSelection() });
      },
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <MauCongViecToolbar
        items={list}
        onAdd={() => setShowForm(true)}
        onDeleteMany={handleDeleteMany}
        onStatusChangeMany={handleStatusChangeMany}
      />
      <div className="flex-1 min-h-0">
        <MauCongViecTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleEdit}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <MauCongViecForm initialData={editingItem} onClose={handleCloseForm} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MauCongViecTab;
