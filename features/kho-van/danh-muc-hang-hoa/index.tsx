import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import DanhMucHangHoaToolbar from './components/DanhMucHangHoaToolbar';
import DanhMucHangHoaList from './components/DanhMucHangHoaList';
import DanhMucHangHoaForm from './components/DanhMucHangHoaForm';
import DanhMucHangHoaDetail from './components/DanhMucHangHoaDetail';
import { useDanhMucHangHoaList, useDeleteDanhMucHangHoa, useDeleteDanhMucHangHoaMany } from './hooks/use-danh-muc-hang-hoa';
import { useDanhMucHangHoaStore } from './store/useDanhMucHangHoaStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import type { DanhMucHangHoa } from './core/types';

const DanhMucHangHoaPage: React.FC = () => {
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
  } = useDanhMucHangHoaStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DanhMucHangHoa | null>(null);
  const [viewingItem, setViewingItem] = useState<DanhMucHangHoa | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: list = [], isLoading } = useDanhMucHangHoaList();
  const nextThuTu = useMemo(
    () => (list.length === 0 ? 1 : Math.max(...list.map((d) => d.thu_tu ?? 0)) + 1),
    [list]
  );
  const deleteMutation = useDeleteDanhMucHangHoa();
  const deleteManyMutation = useDeleteDanhMucHangHoaMany();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = list.find((d) => d.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [list, viewingItem?.id]);

  const filterFn = useCallback(
    (item: DanhMucHangHoa, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ten_danh_muc.toLowerCase().includes(searchLower) ||
        item.ma_danh_muc.toLowerCase().includes(searchLower);
      const statusKey = item.trang_thai === 'Đang hoạt động' ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pageSize));
  useEffect(() => {
    setPage((p) => Math.min(p, maxPage));
  }, [pageSize, maxPage]);

  const handleEdit = (item: DanhMucHangHoa) => {
    setEditingItem(item);
    setDefaultParentId(null);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setDefaultParentId(null);
    setShowForm(true);
  };

  const handleAddChild = (parent: DanhMucHangHoa) => {
    setEditingItem(null);
    setDefaultParentId(parent.id);
    setShowForm(true);
  };

  const handleView = (item: DanhMucHangHoa) => {
    setViewingItem(item);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('danhMucHangHoa.deleteTitle'),
      message: t('danhMucHangHoa.deleteMessage'),
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
      title: t('danhMucHangHoa.deleteTitle'),
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
    setDefaultParentId(null);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <DanhMucHangHoaToolbar
          data={list}
          selectedCount={selectedIds.size}
          onAdd={handleAdd}
          onDeleteMany={handleDeleteMany}
          canCreate={canCreate}
          canDelete={canDelete}
        />

        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
          <DanhMucHangHoaList
            data={filteredList}
            columns={columns}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onToggleAllSelection={toggleAllSelection}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onAddChild={canCreate ? handleAddChild : undefined}
            onView={handleView}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <DanhMucHangHoaForm
            initialData={editingItem}
            allDanhMuc={list}
            defaultThuTu={nextThuTu}
            onClose={handleCloseForm}
            defaultParentId={defaultParentId}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <DanhMucHangHoaDetail
            data={viewingItem}
            allDanhMuc={list}
            onClose={() => setViewingItem(null)}
            onEdit={canUpdate ? (item) => { setViewingItem(null); handleEdit(item); } : undefined}
            onDelete={canDelete ? (id) => { setViewingItem(null); handleDelete(id); } : undefined}
            onAddChild={canCreate ? handleAddChild : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhMucHangHoaPage;
