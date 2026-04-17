import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import {
  useHopDongList,
  useHopDongById,
  useDeleteHopDong,
  useDeleteHopDongMany,
} from '../hooks/use-hop-dong';
import { useDoiTacRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useHopDongStore } from '../store/useHopDongStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { HopDong, HopDongFilters } from '../core/types';
import HopDongToolbar from './HopDongToolbar';
import HopDongList from './HopDongList';
import HopDongForm from './HopDongForm';
import HopDongDetail from './HopDongDetail';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    resetState,
    selectedIds,
    columns,
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
  } = useHopDongStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<HopDong | null>(null);
  const [viewingItem, setViewingItem] = useState<HopDong | null>(null);

  const { data: allList = [], isLoading } = useHopDongList();
  const { data: doiTacList = [] } = useDoiTacRefQuery('nha_cung_cap');
  const { data: chiNhanhList = [] } = useBranches();

  const { data: viewingFull } = useHopDongById(viewingItem?.id);
  const { data: editingFull } = useHopDongById(editingItem?.id);
  const deleteMutation = useDeleteHopDong();
  const deleteManyMutation = useDeleteHopDongMany();

  const filterFn = useCallback((item: HopDong, term: string, f: HopDongFilters) => {
    const q = term.toLowerCase();
    const matchesSearch =
      !term ||
      item.ma_hop_dong.toLowerCase().includes(q) ||
      (item.ten_hop_dong?.toLowerCase().includes(q) ?? false) ||
      (item.ten_nha_cung_cap?.toLowerCase().includes(q) ?? false) ||
      (item.ghi_chu?.toLowerCase().includes(q) ?? false);
    const matchesTt =
      (f.trangThai?.length ?? 0) === 0 || (f.trangThai ?? []).includes(item.trang_thai);
    const matchesNcc =
      (f.nccIds?.length ?? 0) === 0 || (f.nccIds ?? []).includes(item.id_nha_cung_cap);
    return matchesSearch && matchesTt && matchesNcc;
  }, []);

  const filteredList = useListWithFilter(allList, searchTerm, filters, filterFn);

  useEffect(() => resetState(), [resetState]);
  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);
  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const handleEdit = (item: HopDong) => {
    setEditingItem(item);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('hopDong.deleteTitle'),
      message: t('hopDong.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            if (viewingItem?.id === id) setViewingItem(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('hopDong.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        await deleteManyMutation.mutateAsync(ids);
        clearSelection();
        if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
      },
    });
  };

  const viewingData = viewingFull ?? viewingItem;
  const editingData = editingFull ?? editingItem;

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <HopDongToolbar
        data={filteredList}
        doiTacList={doiTacList}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <HopDongList
          data={filteredList}
          columns={columns}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAllSelection={toggleAllSelection}
          isLoading={isLoading}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onView={setViewingItem}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <HopDongForm doiTacList={doiTacList} initialData={editingData} onClose={handleCloseForm} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingData && !showForm && (
          <HopDongDetail
            data={viewingData}
            chiNhanhList={chiNhanhList}
            canUpdateChiTiet={canUpdate}
            onClose={() => setViewingItem(null)}
            onEdit={
              canUpdate
                ? (item) => {
                    setViewingItem(null);
                    setEditingItem(item);
                    setShowForm(true);
                  }
                : undefined
            }
            onDelete={canDelete ? handleDelete : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
