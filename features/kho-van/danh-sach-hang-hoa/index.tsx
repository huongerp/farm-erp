import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import DanhSachHangHoaToolbar from './components/DanhSachHangHoaToolbar';
import DanhSachHangHoaList from './components/DanhSachHangHoaList';
import DanhSachHangHoaForm from './components/DanhSachHangHoaForm';
import DanhSachHangHoaDetail from './components/DanhSachHangHoaDetail';
import { useHangHoaList, useDeleteHangHoa, useDeleteHangHoaMany } from './hooks/use-hang-hoa';
import { useDanhMucHangHoaList } from '../danh-muc-hang-hoa/hooks/use-danh-muc-hang-hoa';
import { useHangHoaStore } from './store/useHangHoaStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import type { HangHoa } from './core/types';

const DanhSachHangHoaPage: React.FC = () => {
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
  } = useHangHoaStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<HangHoa | null>(null);
  const [viewingItem, setViewingItem] = useState<HangHoa | null>(null);

  const { data: list = [], isLoading } = useHangHoaList();
  const { data: danhMucList = [] } = useDanhMucHangHoaList();
  const deleteMutation = useDeleteHangHoa();
  const deleteManyMutation = useDeleteHangHoaMany();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = list.find((h) => h.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [list, viewingItem?.id]);

  const filterFn = useCallback(
    (item: HangHoa, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ten_hang.toLowerCase().includes(searchLower) ||
        item.ma_hang.toLowerCase().includes(searchLower) ||
        (item.ten_danh_muc?.toLowerCase().includes(searchLower) ?? false);
      const statusKey = item.trang_thai === 1 ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const handleEdit = (item: HangHoa) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleView = (item: HangHoa) => {
    setViewingItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('hangHoa.deleteTitle'),
      message: t('hangHoa.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
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
      title: t('hangHoa.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteManyMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
          },
        });
      },
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <DanhSachHangHoaToolbar
          data={list}
          selectedCount={selectedIds.size}
          onAdd={handleAdd}
          onDeleteMany={handleDeleteMany}
        />

        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
          <DanhSachHangHoaList
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
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <DanhSachHangHoaForm
            initialData={editingItem}
            danhMucList={danhMucList}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <DanhSachHangHoaDetail
            data={viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={(item) => {
              setViewingItem(null);
              handleEdit(item);
            }}
            onDelete={(id) => {
              setViewingItem(null);
              handleDelete(id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachHangHoaPage;
