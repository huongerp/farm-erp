import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import TabGroup from '../../../components/ui/TabGroup';
import ChienLuocToolbar from './components/ChienLuocToolbar';
import ThietLapToolbar from './components/ThietLapToolbar';
import ChienLuocList from './components/ChienLuocList';
import ChienLuocFormDrawer from './components/ChienLuocFormDrawer';
import ChienLuocDetailDrawer from './components/ChienLuocDetailDrawer';
import ThietLapLoaiChienLuocList from './components/ThietLapLoaiChienLuocList';
import ThietLapLoaiChienLuocDrawer from './components/ThietLapLoaiChienLuocDrawer';
import { useChienLuocList, useDeleteChienLuoc } from './hooks/use-chien-luoc';
import { useLoaiChienLuocList, useDeleteLoaiChienLuoc } from './hooks/use-thiet-lap-chien-luoc';
import { useChienLuocStore } from './store/useChienLuocStore';
import { useThietLapChienLuocStore } from './store/useThietLapChienLuocStore';
import { useListWithFilter } from '../../../lib/hooks';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../lib/button-labels';
import type { ChienLuoc } from './core/types';
import type { LoaiChienLuoc } from './core/types';

const TAB_CHIEN_LUOC = 'chien-luoc';
const TAB_THIET_LAP = 'thiet-lap';

type PageTabId = typeof TAB_CHIEN_LUOC | typeof TAB_THIET_LAP;

const ChienLuocPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirmStore((s) => s.confirm);
  const [activeTab, setActiveTab] = useState<PageTabId>(TAB_CHIEN_LUOC);
  const {
    searchTerm,
    filters,
    resetState,
    columns,
    pagination,
    setPage,
    setPageSize,
  } = useChienLuocStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ChienLuoc | null>(null);
  const [viewingItem, setViewingItem] = useState<ChienLuoc | null>(null);
  /** undefined = drawer đóng, null = thêm mới, LoaiChienLuoc = sửa */
  const [thietLapEditing, setThietLapEditing] = useState<LoaiChienLuoc | null | undefined>(undefined);

  const {
    searchTerm: thietLapSearch,
    filters: thietLapFilters,
    pagination: thietLapPagination,
    setPage: setThietLapPage,
    setPageSize: setThietLapPageSize,
    resetState: resetThietLapState,
  } = useThietLapChienLuocStore();

  const { data: list = [], isLoading } = useChienLuocList();
  const { data: loaiChienLuocList = [], isLoading: loadingThietLap } = useLoaiChienLuocList();
  const deleteMutation = useDeleteChienLuoc();
  const deleteLoaiMutation = useDeleteLoaiChienLuoc();

  useEffect(() => {
    return () => {
      resetState();
      resetThietLapState();
    };
  }, [resetState, resetThietLapState]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = list.find((d) => d.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [list, viewingItem?.id]);

  const filterFn = useCallback(
    (item: ChienLuoc, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch = !term || item.ten.toLowerCase().includes(searchLower);
      const matchesNam = f.nam == null || item.nam === f.nam;
      const matchesDuyet =
        f.trang_thai_duyet.length === 0 || f.trang_thai_duyet.includes(item.trang_thai_duyet);
      const matchesTrienKhai =
        f.trang_thai_trien_khai.length === 0 ||
        f.trang_thai_trien_khai.includes(item.trang_thai_trien_khai);
      return matchesSearch && matchesNam && matchesDuyet && matchesTrienKhai;
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

  const filteredThietLap = useMemo(() => {
    let result = loaiChienLuocList;
    if (thietLapFilters.nhom) {
      result = result.filter((x) => x.nhom === thietLapFilters.nhom);
    }
    if (thietLapSearch) {
      const lower = thietLapSearch.toLowerCase();
      result = result.filter(
        (x) =>
          x.ten.toLowerCase().includes(lower) ||
          x.ma.toLowerCase().includes(lower) ||
          (x.mo_ta ?? '').toLowerCase().includes(lower) ||
          (x.cau_chien_luoc_mau ?? '').toLowerCase().includes(lower)
      );
    }
    return result;
  }, [loaiChienLuocList, thietLapSearch, thietLapFilters.nhom]);

  const thietLapMaxPage = Math.max(1, Math.ceil(filteredThietLap.length / thietLapPagination.pageSize));
  useEffect(() => {
    if (thietLapPagination.page > thietLapMaxPage) setThietLapPage(thietLapMaxPage);
  }, [thietLapPagination.page, thietLapPagination.pageSize, thietLapMaxPage, setThietLapPage]);

  const handleEdit = (item: ChienLuoc) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleView = (item: ChienLuoc) => {
    setViewingItem(item);
  };

  const handleCloseDetail = () => {
    setViewingItem(null);
  };

  const handleEditFromDetail = (item: ChienLuoc) => {
    setViewingItem(null);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDeleteFromDetail = (id: string) => {
    confirm({
      title: t('chienLuoc.deleteTitle'),
      message: t('chienLuoc.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        deleteMutation.mutate(id);
        setViewingItem(null);
      },
    });
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('chienLuoc.deleteTitle'),
      message: t('chienLuoc.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  const tabs = [
    { id: TAB_CHIEN_LUOC, label: t('chienLuoc.tab.chienLuoc') },
    { id: TAB_THIET_LAP, label: t('chienLuoc.tab.thietLap') },
  ];

  const handleThietLapAdd = () => setThietLapEditing(null);
  const handleThietLapCloseDrawer = () => setThietLapEditing(undefined);
  const handleThietLapDelete = (id: string) => {
    confirm({
      title: t('chienLuoc.thietLap.deleteTitle'),
      message: t('chienLuoc.thietLap.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteLoaiMutation.mutate(id),
    });
  };

  const showThietLapDrawer = thietLapEditing !== undefined;

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] min-h-0">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
          <TabGroup
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as PageTabId)}
          />
        </div>

        {activeTab === TAB_CHIEN_LUOC && (
          <ChienLuocToolbar data={list} onAdd={handleAdd} showBack={true} />
        )}
        {activeTab === TAB_THIET_LAP && (
          <ThietLapToolbar data={loaiChienLuocList} onAdd={handleThietLapAdd} />
        )}

        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1 overflow-auto">
          {activeTab === TAB_CHIEN_LUOC && (
            <ChienLuocList
              data={filteredList}
              columns={columns}
              isLoading={isLoading}
              page={pagination.page}
              pageSize={pagination.pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          {activeTab === TAB_THIET_LAP && (
            <ThietLapLoaiChienLuocList
              data={filteredThietLap}
              isLoading={loadingThietLap}
              page={thietLapPagination.page}
              pageSize={thietLapPagination.pageSize}
              onPageChange={setThietLapPage}
              onPageSizeChange={setThietLapPageSize}
              onEdit={(item) => setThietLapEditing(item)}
              onDelete={handleThietLapDelete}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <ChienLuocFormDrawer
            initialData={editingItem}
            onClose={handleCloseForm}
          />
        )}
        {viewingItem && (
          <ChienLuocDetailDrawer
            data={viewingItem}
            onClose={handleCloseDetail}
            onEdit={handleEditFromDetail}
            onDelete={handleDeleteFromDetail}
          />
        )}
        {showThietLapDrawer && (
          <ThietLapLoaiChienLuocDrawer
            item={thietLapEditing ?? null}
            onClose={handleThietLapCloseDrawer}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChienLuocPage;
