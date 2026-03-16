import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import TienDoMuaHangToolbar from './TienDoMuaHangToolbar';
import TienDoMuaHangTable from './TienDoMuaHangTable';
import TienDoMuaHangForm from './TienDoMuaHangForm';
import TienDoMuaHangDetail from './TienDoMuaHangDetail';
import {
  useTienDoMuaHangList,
  useDeleteTienDoMuaHangList,
  useUpdateTienDoMuaHangStatus,
} from '../hooks/use-tien-do-mua-hang';
import { useTienDoMuaHangStore } from '../store/useTienDoMuaHangStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import type { TienDoMuaHang } from '../core/types';

const TienDoMuaHangTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
  } = useTienDoMuaHangStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TienDoMuaHang | null>(null);
  const [detailItem, setDetailItem] = useState<TienDoMuaHang | null>(null);

  const { data: list = [], isLoading } = useTienDoMuaHangList();
  const deleteMutation = useDeleteTienDoMuaHangList();
  const statusMutation = useUpdateTienDoMuaHangStatus();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: TienDoMuaHang, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ma.toLowerCase().includes(searchLower) ||
        item.ten.toLowerCase().includes(searchLower) ||
        (item.ghi_chu && item.ghi_chu.toLowerCase().includes(searchLower));
      const statusKey = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    const sorted = [...filteredList];
    const byThuTu = (a: TienDoMuaHang, b: TienDoMuaHang) =>
      a.thu_tu - b.thu_tu || (Number(a.id) - Number(b.id));
    if (!sort.column || !sort.direction) {
      sorted.sort(byThuTu);
      return sorted;
    }
    sorted.sort((a: TienDoMuaHang, b: TienDoMuaHang) => {
      const aVal = a[sort.column as keyof TienDoMuaHang] ?? '';
      const bVal = b[sort.column as keyof TienDoMuaHang] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleEdit = (item: TienDoMuaHang) => {
    setEditingItem(item);
    setShowForm(true);
    if (detailItem?.id === item.id) setDetailItem(null);
  };

  const handleView = (item: TienDoMuaHang) => {
    setDetailItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('thietLapDeXuatVatTu.tienDoMuaHang.deleteTitle'),
      message: t('thietLapDeXuatVatTu.tienDoMuaHang.deleteMessage'),
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
      title: t('thietLapDeXuatVatTu.tienDoMuaHang.bulkDeleteTitle'),
      message: t('thietLapDeXuatVatTu.tienDoMuaHang.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => deleteMutation.mutate(ids, { onSuccess: () => clearSelection() }),
    });
  };

  const handleStatusChangeMany = (ids: string[], status: import('../../../../lib/constants').TrangThaiHoatDong) => {
    const statusLabel = status === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('common.activeStatus') : t('common.inactiveStatus');
    confirm({
      title: t('thietLapDeXuatVatTu.tienDoMuaHang.statusChangeTitle'),
      message: t('thietLapDeXuatVatTu.tienDoMuaHang.statusChangeMessage', { count: ids.length, status: statusLabel }),
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
      <TienDoMuaHangToolbar
        items={list}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onStatusChangeMany={handleStatusChangeMany}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 overflow-auto px-2 pb-2">
        <TienDoMuaHangTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onRowClick={handleView}
        />
      </div>
      <AnimatePresence>
        {showForm && (
          <TienDoMuaHangForm initialData={editingItem} onClose={handleCloseForm} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {detailItem && (
          <TienDoMuaHangDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TienDoMuaHangTab;
