import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import NhaCungCapToolbar from './components/NhaCungCapToolbar';
import NhaCungCapList from './components/NhaCungCapList';
import NhaCungCapForm from './components/NhaCungCapForm';
import NhaCungCapDetail from './components/NhaCungCapDetail';
import { useNhaCungCapList, useNhomDoiTacList, useTagList, useUpdateNhaCungCap, useDeleteNhaCungCap, useDeleteNhaCungCapMany } from './hooks/use-nha-cung-cap';
import { useNhaCungCapStore } from './store/useNhaCungCapStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import type { NhaCungCap } from './core/types';
import type { NhaCungCapFilters } from './store/useNhaCungCapStore';

const DanhSachDoiTacMuaHangPage: React.FC = () => {
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
  } = useNhaCungCapStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<NhaCungCap | null>(null);
  const [viewingItem, setViewingItem] = useState<NhaCungCap | null>(null);

  const { data: listAll = [], isLoading } = useNhaCungCapList();
  const { data: nhomList = [] } = useNhomDoiTacList();
  const { data: tagList = [] } = useTagList();
  const updateMutation = useUpdateNhaCungCap();
  const deleteMutation = useDeleteNhaCungCap();
  const deleteManyMutation = useDeleteNhaCungCapMany();

  const handleStatusChange = useCallback(
    (item: NhaCungCap, newStatus: 0 | 1) => {
      const formValues = {
        ma_ncc: item.ma_ncc,
        ten_ncc: item.ten_ncc,
        id_nhom: item.id_nhom ?? null,
        dia_chi: item.dia_chi ?? '',
        dien_thoai: item.dien_thoai ?? '',
        email: item.email ?? '',
        mo_ta: item.mo_ta ?? '',
        tag_ids: item.tag_ids ?? [],
        trang_thai: newStatus,
        thu_tu: item.thu_tu,
      };
      updateMutation.mutate(
        { id: item.id, data: formValues },
        {
          onSuccess: () => {
            setViewingItem((prev) =>
              prev && prev.id === item.id ? { ...prev, trang_thai: newStatus } : prev
            );
          },
        }
      );
    },
    [updateMutation]
  );

  const handleSaveTags = useCallback(
    (item: NhaCungCap, tagIds: string[]) => {
      const formValues = {
        ma_ncc: item.ma_ncc,
        ten_ncc: item.ten_ncc,
        id_nhom: item.id_nhom ?? null,
        dia_chi: item.dia_chi ?? '',
        dien_thoai: item.dien_thoai ?? '',
        email: item.email ?? '',
        mo_ta: item.mo_ta ?? '',
        tag_ids: tagIds,
        trang_thai: item.trang_thai,
        thu_tu: item.thu_tu,
      };
      updateMutation.mutate({ id: item.id, data: formValues });
    },
    [updateMutation]
  );

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = listAll.find((n) => n.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [listAll, viewingItem?.id]);

  const filterFn = useCallback(
    (item: NhaCungCap, term: string, f: NhaCungCapFilters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ten_ncc.toLowerCase().includes(searchLower) ||
        item.ma_ncc.toLowerCase().includes(searchLower) ||
        (item.ten_nhom?.toLowerCase().includes(searchLower) ?? false) ||
        (item.dia_chi?.toLowerCase().includes(searchLower) ?? false) ||
        (item.dien_thoai?.toLowerCase().includes(searchLower) ?? false) ||
        (item.email?.toLowerCase().includes(searchLower) ?? false);
      const statusKey = item.trang_thai === 1 ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      const matchesNhom = f.id_nhom.length === 0 || (item.id_nhom != null && f.id_nhom.includes(item.id_nhom));
      return matchesSearch && matchesStatus && matchesNhom;
    },
    []
  );

  const filteredList = useListWithFilter(listAll, searchTerm, filters, filterFn);

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
      title: t('nhaCungCapMuaHang.deleteTitle'),
      message: t('nhaCungCapMuaHang.deleteMessage'),
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
      title: t('nhaCungCapMuaHang.deleteManyTitle'),
      message: t('nhaCungCapMuaHang.deleteManyMessage', { count: ids.length }),
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
        <NhaCungCapToolbar
          data={listAll}
          nhomList={nhomList}
          selectedCount={selectedIds.size}
          onAdd={handleAdd}
          onDeleteMany={handleDeleteMany}
        />

        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
          <NhaCungCapList
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
          <NhaCungCapForm
            initialData={editingItem}
            nhomList={nhomList}
            tagList={tagList}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <NhaCungCapDetail
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
            onStatusChange={handleStatusChange}
            onSaveTags={handleSaveTags}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachDoiTacMuaHangPage;
