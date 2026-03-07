import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DanhMucTaiChinhToolbar from './components/DanhMucTaiChinhToolbar';
import DanhMucTaiChinhList from './components/DanhMucTaiChinhList';
import DanhMucTaiChinhForm from './components/DanhMucTaiChinhForm';
import DanhMucTaiChinhDetail from './components/DanhMucTaiChinhDetail';
import HangMucQuyenDrawer from './components/HangMucQuyenDrawer';
import { useDanhMucTaiChinh } from './hooks/use-danh-muc-tai-chinh';
import { useDeleteDanhMucTaiChinh, useDeleteDanhMucTaiChinhMany } from './hooks/use-danh-muc-tai-chinh';
import { useQuyenForList } from './hooks/use-hang-muc-quyen';
import { useDanhMucTaiChinhStore } from './store/useDanhMucTaiChinhStore';
import { useListWithFilter } from '../../../lib/hooks';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import type { HangMucTaiChinh } from '../core/types';

const DanhMucTaiChinhPage: React.FC = () => {
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
  } = useDanhMucTaiChinhStore();

  const [activeTab, setActiveTab] = useState<'thu' | 'chi'>('thu');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<HangMucTaiChinh | null>(null);
  const [viewingItem, setViewingItem] = useState<HangMucTaiChinh | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [quyenDrawer, setQuyenDrawer] = useState<{
    idHangMuc: string;
    tenHangMuc: string;
    loaiQuyen: 'quan_ly' | 'de_xuat';
  } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: list = [], isLoading } = useDanhMucTaiChinh();
  const { quyenMap } = useQuyenForList();
  const deleteMutation = useDeleteDanhMucTaiChinh();
  const deleteManyMutation = useDeleteDanhMucTaiChinhMany();

  const listByTab = useMemo(
    () => list.filter((item) => item.loai === activeTab),
    [list, activeTab]
  );

  const filterFn = useCallback(
    (item: HangMucTaiChinh, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ten_danh_muc.toLowerCase().includes(searchLower) ||
        item.ma_danh_muc.toLowerCase().includes(searchLower);
      const statusKey = item.trang_thai === 1 ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    []
  );

  const filteredList = useListWithFilter(listByTab, searchTerm, filters, filterFn);

  const tabs = useMemo(
    () => [
      { id: 'thu', label: t('danhMucTaiChinh.tabThu'), icon: ArrowDownCircle },
      { id: 'chi', label: t('danhMucTaiChinh.tabChi'), icon: ArrowUpCircle },
    ],
    [t]
  );

  const handleTabChange = useCallback(
    (id: string) => {
      if (id === 'thu' || id === 'chi') {
        setActiveTab(id);
        clearSelection();
      }
    },
    [clearSelection]
  );

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  // Đồng bộ viewing với list sau refetch (sửa/ thêm con từ form hoặc nơi khác)
  useEffect(() => {
    if (!viewingItem) return;
    const fresh = list.find((d) => d.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [list, viewingItem?.id]);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pageSize));
  useEffect(() => {
    setPage((p) => Math.min(p, maxPage));
  }, [pageSize, maxPage]);

  const handleEdit = (item: HangMucTaiChinh) => {
    setEditingItem(item);
    setDefaultParentId(null);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setDefaultParentId(null);
    setShowForm(true);
  };

  const handleAddChild = (parent: HangMucTaiChinh) => {
    setEditingItem(null);
    setDefaultParentId(parent.id);
    setShowForm(true);
  };

  const handleView = (item: HangMucTaiChinh) => {
    setViewingItem(item);
  };

  const defaultLoaiForForm = editingItem ? undefined : activeTab;

  const handleDelete = (id: string) => {
    confirm({
      title: t('danhMucTaiChinh.deleteTitle'),
      message: t('danhMucTaiChinh.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('danhMucTaiChinh.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteManyMutation.mutate(ids, {
          onSuccess: () => clearSelection(),
        });
      },
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setDefaultParentId(null);
  };

  const handleOpenQuyenQuanLy = (item: HangMucTaiChinh) => {
    setQuyenDrawer({
      idHangMuc: item.id,
      tenHangMuc: item.ten_danh_muc,
      loaiQuyen: 'quan_ly',
    });
  };

  const handleOpenQuyenDeXuat = (item: HangMucTaiChinh) => {
    setQuyenDrawer({
      idHangMuc: item.id,
      tenHangMuc: item.ten_danh_muc,
      loaiQuyen: 'de_xuat',
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <DanhMucTaiChinhToolbar
          data={listByTab}
          selectedCount={selectedIds.size}
          onAdd={handleAdd}
          onDeleteMany={handleDeleteMany}
        />

        <div className="flex-1 min-h-0 flex flex-col">
          <DanhMucTaiChinhList
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
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenQuyenQuanLy={handleOpenQuyenQuanLy}
            onOpenQuyenDeXuat={handleOpenQuyenDeXuat}
            onAddChild={handleAddChild}
            onView={handleView}
            quyenMap={quyenMap}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <DanhMucTaiChinhForm
            initialData={editingItem}
            allDanhMuc={list}
            onClose={handleCloseForm}
            defaultParentId={defaultParentId}
            defaultLoai={defaultLoaiForForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <DanhMucTaiChinhDetail
            data={viewingItem}
            allDanhMuc={list}
            onClose={() => setViewingItem(null)}
            onEdit={(item) => {
              setViewingItem(null);
              handleEdit(item);
            }}
            onDelete={(id) => {
              setViewingItem(null);
              handleDelete(id);
            }}
            onAddChild={handleAddChild}
            onOpenQuyenQuanLy={handleOpenQuyenQuanLy}
            onOpenQuyenDeXuat={handleOpenQuyenDeXuat}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quyenDrawer && (
          <HangMucQuyenDrawer
            idHangMuc={quyenDrawer.idHangMuc}
            tenHangMuc={quyenDrawer.tenHangMuc}
            loaiQuyen={quyenDrawer.loaiQuyen}
            onClose={() => setQuyenDrawer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhMucTaiChinhPage;
