import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { ensureFeatureLocale } from '../../../lib/i18n-feature-locales';
import DanhSachNhaCungCapToolbar from './components/DanhSachNhaCungCapToolbar';
import DanhSachNhaCungCapList from './components/DanhSachNhaCungCapList';
import DanhSachNhaCungCapForm from './components/DanhSachNhaCungCapForm';
import DanhSachNhaCungCapDetail from './components/DanhSachNhaCungCapDetail';
import { useNhaCungCapList, useNhomNhaCungCapList, useTagList, useDeleteNhaCungCap, useDeleteNhaCungCapMany } from './hooks/use-nha-cung-cap';
import { useNhaCungCapStore } from './store/useNhaCungCapStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { TRANG_THAI_HOAT_DONG } from '../../../lib/constants';
import type { NhaCungCap } from './core/types';

const DanhSachNhaCungCapPage: React.FC = () => {
  const { t } = useTranslation();

  useEffect(() => {
    void ensureFeatureLocale('danh-sach-nha-cung-cap');
  }, []);
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
  } = useNhaCungCapStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<NhaCungCap | null>(null);
  const [viewingItem, setViewingItem] = useState<NhaCungCap | null>(null);

  const { data: list = [], isLoading } = useNhaCungCapList();
  const { data: nhomList = [] } = useNhomNhaCungCapList();
  const { data: tagList = [] } = useTagList();
  const deleteMutation = useDeleteNhaCungCap();
  const deleteManyMutation = useDeleteNhaCungCapMany();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = list.find((n) => n.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [list, viewingItem?.id]);

  const filterFn = useCallback(
    (item: NhaCungCap, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ten_ncc.toLowerCase().includes(searchLower) ||
        item.ma_ncc.toLowerCase().includes(searchLower) ||
        (item.ten_nhom?.toLowerCase().includes(searchLower) ?? false);
      const statusKey = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      const matchesNhom = f.id_nhom.length === 0 || (item.id_nhom != null && f.id_nhom.includes(item.id_nhom));
      return matchesSearch && matchesStatus && matchesNhom;
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

  const handleEdit = (item: NhaCungCap) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleView = (item: NhaCungCap) => {
    setViewingItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('nhaCungCap.deleteTitle'),
      message: t('nhaCungCap.deleteMessage'),
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
      title: t('nhaCungCap.deleteTitle'),
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
        <DanhSachNhaCungCapToolbar
          data={list}
          nhomList={nhomList}
          selectedCount={selectedIds.size}
          onAdd={handleAdd}
          onDeleteMany={handleDeleteMany}
        />

        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
          <DanhSachNhaCungCapList
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
          <DanhSachNhaCungCapForm
            initialData={editingItem}
            nhomList={nhomList}
            tagList={tagList}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <DanhSachNhaCungCapDetail
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

export default DanhSachNhaCungCapPage;
