import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import FarmTienDoMuaHangToolbar from './FarmTienDoMuaHangToolbar';
import FarmTienDoMuaHangTable from './FarmTienDoMuaHangTable';
import FarmTienDoMuaHangForm from './FarmTienDoMuaHangForm';
import FarmTienDoMuaHangDetail from './FarmTienDoMuaHangDetail';
import {
  useFarmTienDoMuaHangList,
  useDeleteFarmTienDoMuaHangList,
  useUpdateFarmTienDoMuaHangStatus,
} from '../hooks/use-farm-tien-do-mua-hang';
import { useFarmTienDoMuaHangStore } from '../store/useFarmTienDoMuaHangStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import type { FarmTienDoMuaHang } from '../core/types';

const FarmTienDoMuaHangTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
  } = useFarmTienDoMuaHangStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FarmTienDoMuaHang | null>(null);
  const [detailItem, setDetailItem] = useState<FarmTienDoMuaHang | null>(null);

  const { data: list = [], isLoading } = useFarmTienDoMuaHangList();
  const deleteMutation = useDeleteFarmTienDoMuaHangList();
  const statusMutation = useUpdateFarmTienDoMuaHangStatus();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: FarmTienDoMuaHang, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch = Boolean(
        !term ||
        item.ma.toLowerCase().includes(searchLower) ||
        item.ten.toLowerCase().includes(searchLower) ||
        (item.ghi_chu && item.ghi_chu.toLowerCase().includes(searchLower))
      );
      const statusKey = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    const sorted = [...filteredList];
    const byThuTu = (a: FarmTienDoMuaHang, b: FarmTienDoMuaHang) =>
      a.thu_tu - b.thu_tu || (Number(a.id) - Number(b.id));
    if (!sort.column || !sort.direction) {
      sorted.sort(byThuTu);
      return sorted;
    }
    sorted.sort((a: FarmTienDoMuaHang, b: FarmTienDoMuaHang) => {
      const aVal = a[sort.column as keyof FarmTienDoMuaHang] ?? '';
      const bVal = b[sort.column as keyof FarmTienDoMuaHang] ?? '';
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleEdit = (item: FarmTienDoMuaHang) => {
    setEditingItem(item);
    setShowForm(true);
    if (detailItem?.id === item.id) setDetailItem(null);
  };

  const handleView = (item: FarmTienDoMuaHang) => {
    setDetailItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('thietLapDeXuatMuaHang.tienDoMuaHang.deleteTitle'),
      message: t('thietLapDeXuatMuaHang.tienDoMuaHang.deleteMessage'),
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
      title: t('thietLapDeXuatMuaHang.tienDoMuaHang.bulkDeleteTitle'),
      message: t('thietLapDeXuatMuaHang.tienDoMuaHang.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => deleteMutation.mutate(ids, { onSuccess: () => clearSelection() }),
    });
  };

  const handleStatusChangeMany = (ids: string[], status: import('../../../../lib/constants').TrangThaiHoatDong) => {
    const statusLabel = status === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('common.activeStatus') : t('common.inactiveStatus');
    confirm({
      title: t('thietLapDeXuatMuaHang.tienDoMuaHang.statusChangeTitle'),
      message: t('thietLapDeXuatMuaHang.tienDoMuaHang.statusChangeMessage', { count: ids.length, status: statusLabel }),
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
      <FarmTienDoMuaHangToolbar
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
        <FarmTienDoMuaHangTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onRowClick={handleView}
        />
      </div>
      <AnimatePresence>
        {showForm && (
          <FarmTienDoMuaHangForm initialData={editingItem} onClose={handleCloseForm} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {detailItem && (
          <FarmTienDoMuaHangDetail
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

export default FarmTienDoMuaHangTab;
