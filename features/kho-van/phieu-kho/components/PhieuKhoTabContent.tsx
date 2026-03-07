import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { usePhieuKhoList, usePhieuKhoById, useDeletePhieuKho, useDeletePhieuKhoMany } from '../hooks/use-phieu-kho';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { usePhieuKhoStore } from '../store/usePhieuKhoStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuKho, LoaiPhieuKho } from '../core/types';
import type { PhieuKhoFilters } from '../store/usePhieuKhoStore';
import PhieuKhoToolbar from './PhieuKhoToolbar';
import PhieuKhoList from './PhieuKhoList';
import PhieuKhoForm from './PhieuKhoForm';
import PhieuKhoDetail from './PhieuKhoDetail';

interface Props {
  loai: LoaiPhieuKho;
}

const PhieuKhoTabContent: React.FC<Props> = ({ loai }) => {
  const { t } = useTranslation();
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
  } = usePhieuKhoStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PhieuKho | null>(null);
  const [viewingItem, setViewingItem] = useState<PhieuKho | null>(null);

  const { data: allList = [], isLoading } = usePhieuKhoList();
  const { data: khoList = [] } = useKhoList();
  const { data: viewingPhieuFull } = usePhieuKhoById(viewingItem?.id);
  const { data: editingPhieuFull } = usePhieuKhoById(editingItem?.id);
  const deleteMutation = useDeletePhieuKho();
  const deleteManyMutation = useDeletePhieuKhoMany();

  const listByLoai = useMemo(
    () => allList.filter((p) => p.loai === loai),
    [allList, loai]
  );

  const filterFn = useCallback((item: PhieuKho, term: string, f: PhieuKhoFilters) => {
    const searchLower = term.toLowerCase();
    const matchesSearch =
      !term ||
      item.so_phieu.toLowerCase().includes(searchLower) ||
      (item.ten_kho?.toLowerCase().includes(searchLower) ?? false) ||
      (item.ten_kho_den?.toLowerCase().includes(searchLower) ?? false) ||
      (item.mo_ta?.toLowerCase().includes(searchLower) ?? false);
    const statusKey = item.trang_thai === 0 ? 'Pending' : item.trang_thai === 1 ? 'Approved' : 'Rejected';
    const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
    const matchesKho = (f.khoIds?.length ?? 0) === 0 || (f.khoIds ?? []).includes(item.id_kho);
    const matchesKhoDen =
      (f.khoDenIds?.length ?? 0) === 0 || (item.id_kho_den != null && (f.khoDenIds ?? []).includes(item.id_kho_den));
    return matchesSearch && matchesStatus && matchesKho && matchesKhoDen;
  }, []);

  const filteredList = useListWithFilter(listByLoai, searchTerm, filters, filterFn);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = listByLoai.find((p) => p.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [listByLoai, viewingItem?.id]);

  const handleEdit = (item: PhieuKho) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('phieuKho.deleteTitle'),
      message: t('phieuKho.deleteMessage'),
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
      title: t('phieuKho.deleteTitle'),
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

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <PhieuKhoToolbar
        data={filteredList}
        loai={loai}
        khoList={khoList}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <PhieuKhoList
          data={filteredList}
          loai={loai}
          columns={columns}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAllSelection={toggleAllSelection}
          isLoading={isLoading}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={setViewingItem}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <PhieuKhoForm
            loai={loai}
            khoList={khoList}
            initialData={editingPhieuFull ?? editingItem}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <PhieuKhoDetail
            data={viewingPhieuFull ?? viewingItem}
            loai={loai}
            onClose={() => setViewingItem(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhieuKhoTabContent;
