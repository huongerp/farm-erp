import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import TabGroup from '../../../components/ui/TabGroup';
import HanhDongToolbar from './components/HanhDongToolbar';
import HanhDongList from './components/HanhDongList';
import HanhDongFormDrawer from './components/HanhDongFormDrawer';
import HanhDongDetailDrawer from './components/HanhDongDetailDrawer';
import ThietLapNhomHanhDongToolbar from './components/ThietLapNhomHanhDongToolbar';
import ThietLapNhomHanhDongList from './components/ThietLapNhomHanhDongList';
import ThietLapNhomHanhDongDrawer from './components/ThietLapNhomHanhDongDrawer';
import { useChienLuocDaDuyet, useHanhDongList, useHanhDongById, useDeleteHanhDongCotLoi } from './hooks/use-hanh-dong-cot-loi';
import { useNhomHanhDongList, useDeleteNhomHanhDong } from './hooks/use-nhom-hanh-dong';
import { useDeleteTieuChiKpi } from '../tieu-chi-kpi/hooks/use-tieu-chi-kpi';
import { useHanhDongCotLoiStore } from './store/useHanhDongCotLoiStore';
import { useNhomHanhDongStore } from './store/useNhomHanhDongStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../lib/button-labels';
import type { HanhDongCotLoi } from './core/types';
import type { NhomHanhDong } from './core/types';

const TAB_HANH_DONG = 'hanh-dong';
const TAB_THIET_LAP = 'thiet-lap';

type PageTabId = typeof TAB_HANH_DONG | typeof TAB_THIET_LAP;

const HanhDongCotLoiPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confirm = useConfirmStore((s) => s.confirm);
  const [activeTab, setActiveTab] = useState<PageTabId>(TAB_HANH_DONG);

  const {
    searchTerm,
    filters,
    setFilter,
    resetState,
    columns,
    pagination,
    setPage,
    setPageSize,
  } = useHanhDongCotLoiStore();

  const {
    searchTerm: thietLapSearch,
    pagination: thietLapPagination,
    setPage: setThietLapPage,
    setPageSize: setThietLapPageSize,
    resetState: resetThietLapState,
    columns: thietLapColumns,
  } = useNhomHanhDongStore();

  const [showForm, setShowForm] = useState(false);
  const [viewingItem, setViewingItem] = useState<HanhDongCotLoi | null>(null);
  const [editingItem, setEditingItem] = useState<HanhDongCotLoi | null>(null);
  const [fixedChienLuocId, setFixedChienLuocId] = useState<string | null>(null);
  const [thietLapEditing, setThietLapEditing] = useState<NhomHanhDong | null | undefined>(undefined);

  const editIdFromUrl = searchParams.get('edit');
  const { data: editItemFromUrl } = useHanhDongById(editIdFromUrl);

  const { data: chienLuocDaDuyet = [] } = useChienLuocDaDuyet();
  const chienLuocMap = useMemo(() => {
    const m = new Map<string, { nam: number }>();
    chienLuocDaDuyet.forEach((c) => m.set(c.id, { nam: c.nam }));
    return m;
  }, [chienLuocDaDuyet]);

  const listParams = useMemo(
    () => ({
      id_chien_luoc: filters.id_chien_luoc ?? undefined,
      nam: filters.nam ?? undefined,
      bsc_dimension: filters.bsc_dimension ?? undefined,
      nhom_hanh_dong: filters.nhom_hanh_dong ?? undefined,
    }),
    [filters]
  );

  const { data: hanhDongList = [], isLoading } = useHanhDongList(listParams, chienLuocMap);
  const { data: allHanhDongForSum = [] } = useHanhDongList();
  const { data: nhomHanhDongList = [], isLoading: loadingThietLap } = useNhomHanhDongList();
  const deleteMutation = useDeleteHanhDongCotLoi();
  const deleteNhomMutation = useDeleteNhomHanhDong();
  const deleteTieuChiMutation = useDeleteTieuChiKpi();

  const chienLuocById = useMemo(() => {
    const o: Record<string, { ten: string; nam: number }> = {};
    chienLuocDaDuyet.forEach((c) => {
      o[c.id] = { ten: c.ten, nam: c.nam };
    });
    return o;
  }, [chienLuocDaDuyet]);

  const nhomByMa = useMemo(() => {
    const o: Record<string, string> = {};
    nhomHanhDongList.forEach((n) => {
      o[n.ma] = n.ten;
    });
    return o;
  }, [nhomHanhDongList]);

  const filterFn = useCallback(
    (item: HanhDongCotLoi, term: string) => {
      const searchLower = term.toLowerCase();
      return (
        !term ||
        item.ten.toLowerCase().includes(searchLower) ||
        (item.ma ?? '').toLowerCase().includes(searchLower)
      );
    },
    []
  );

  const filteredList = useMemo(() => {
    return hanhDongList.filter((item) => filterFn(item, searchTerm));
  }, [hanhDongList, searchTerm, filterFn]);

  useEffect(() => {
    const id = searchParams.get('chien_luoc');
    const add = searchParams.get('add');
    if (id) {
      setFilter('id_chien_luoc', id);
      if (add === '1') {
        setFixedChienLuocId(id);
        setShowForm(true);
      }
    }
  }, [searchParams, setFilter]);

  useEffect(() => {
    if (editItemFromUrl && editIdFromUrl) {
      setEditingItem(editItemFromUrl);
      setShowForm(true);
    }
  }, [editItemFromUrl, editIdFromUrl]);

  useEffect(() => {
    return () => {
      resetState();
      resetThietLapState();
    };
  }, [resetState, resetThietLapState]);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const filteredThietLap = useMemo(() => {
    if (!thietLapSearch) return nhomHanhDongList;
    const lower = thietLapSearch.toLowerCase();
    return nhomHanhDongList.filter(
      (x) =>
        x.ten.toLowerCase().includes(lower) ||
        x.ma.toLowerCase().includes(lower) ||
        (x.mo_ta ?? '').toLowerCase().includes(lower)
    );
  }, [nhomHanhDongList, thietLapSearch]);

  const thietLapMaxPage = Math.max(
    1,
    Math.ceil(filteredThietLap.length / thietLapPagination.pageSize)
  );
  useEffect(() => {
    if (thietLapPagination.page > thietLapMaxPage) setThietLapPage(thietLapMaxPage);
  }, [thietLapPagination.page, thietLapPagination.pageSize, thietLapMaxPage, setThietLapPage]);

  const handleView = (item: HanhDongCotLoi) => {
    setViewingItem(item);
  };

  const handleCloseDetail = () => setViewingItem(null);

  const handleEdit = (item: HanhDongCotLoi) => {
    setViewingItem(null);
    setEditingItem(item);
    setFixedChienLuocId(null);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFixedChienLuocId(null);
    setShowForm(true);
  };

  const handleAddForChienLuoc = (id: string) => {
    setEditingItem(null);
    setFixedChienLuocId(id);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFixedChienLuocId(null);
  };

  const handleDelete = (id: string) => {
    setViewingItem((prev) => (prev?.id === id ? null : prev));
    confirm({
      title: t('hanhDongCotLoi.deleteTitle'),
      message: t('hanhDongCotLoi.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  const handleTieuChiEdit = (item: { id: string }) => {
    setViewingItem(null);
    navigate(`/dieu-hanh/tieu-chi-kpi?edit=${item.id}`);
  };

  const handleTieuChiDelete = (id: string) => {
    confirm({
      title: t('tieuChiKpi.deleteTitle'),
      message: t('tieuChiKpi.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteTieuChiMutation.mutate(id),
    });
  };

  const handleThietLapAdd = () => setThietLapEditing(null);
  const handleThietLapCloseDrawer = () => setThietLapEditing(undefined);
  const handleThietLapDelete = (id: string) => {
    confirm({
      title: t('hanhDongCotLoi.thietLap.deleteTitle'),
      message: t('hanhDongCotLoi.thietLap.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteNhomMutation.mutate(id),
    });
  };

  const tabs = [
    { id: TAB_HANH_DONG, label: t('hanhDongCotLoi.tab.hanhDong') },
    { id: TAB_THIET_LAP, label: t('hanhDongCotLoi.tab.thietLap') },
  ];

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

        {activeTab === TAB_HANH_DONG && (
          <HanhDongToolbar
            fullListForFilters={allHanhDongForSum}
            chienLuocDaDuyet={chienLuocDaDuyet}
            nhomHanhDongList={nhomHanhDongList}
            chienLuocMap={chienLuocMap}
            onAdd={handleAdd}
          />
        )}
        {activeTab === TAB_THIET_LAP && (
          <ThietLapNhomHanhDongToolbar
            data={nhomHanhDongList}
            onAdd={handleThietLapAdd}
          />
        )}

        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1 overflow-auto">
          {activeTab === TAB_HANH_DONG && (
            <HanhDongList
              data={filteredList}
              chienLuocById={chienLuocById}
              nhomByMa={nhomByMa}
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
            <ThietLapNhomHanhDongList
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
        {viewingItem && (
          <HanhDongDetailDrawer
            data={viewingItem}
            chienLuocLabel={
              chienLuocById[viewingItem.id_chien_luoc]
                ? `${chienLuocById[viewingItem.id_chien_luoc].ten} (${chienLuocById[viewingItem.id_chien_luoc].nam})`
                : '—'
            }
            nhomLabel={nhomByMa[viewingItem.nhom_hanh_dong] ?? viewingItem.nhom_hanh_dong}
            onClose={handleCloseDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTieuChiEdit={handleTieuChiEdit}
            onTieuChiDelete={handleTieuChiDelete}
          />
        )}
        {showForm && (
          <HanhDongFormDrawer
            initialData={editingItem}
            fixedChienLuocId={fixedChienLuocId}
            chienLuocDaDuyet={chienLuocDaDuyet}
            nhomHanhDongList={nhomHanhDongList}
            existingHanhDongForSum={allHanhDongForSum}
            onClose={handleCloseForm}
          />
        )}
        {showThietLapDrawer && (
          <ThietLapNhomHanhDongDrawer
            item={thietLapEditing ?? null}
            onClose={handleThietLapCloseDrawer}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HanhDongCotLoiPage;
