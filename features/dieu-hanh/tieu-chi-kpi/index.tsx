import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import TieuChiToolbar from './components/TieuChiToolbar';
import TieuChiList from './components/TieuChiList';
import TieuChiFormDrawer from './components/TieuChiFormDrawer';
import TieuChiDetailDrawer from './components/TieuChiDetailDrawer';
import { useTieuChiList, useTieuChiById, useDeleteTieuChiKpi } from './hooks/use-tieu-chi-kpi';
import { useDonViTinhList } from './hooks/use-don-vi-tinh';
import { useCachTinhDiemList } from './hooks/use-cach-tinh-diem';
import { useHanhDongList } from '../hanh-dong-cot-loi/hooks/use-hanh-dong-cot-loi';
import { useTieuChiKpiStore } from './store/useTieuChiKpiStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../lib/button-labels';
import type { TieuChiKpi } from './core/types';

const TieuChiKpiPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const confirm = useConfirmStore((s) => s.confirm);

  const {
    searchTerm,
    filters,
    resetState,
    columns,
    pagination,
    setPage,
    setPageSize,
    setFilter,
  } = useTieuChiKpiStore();

  const [showForm, setShowForm] = useState(false);
  const [viewingItem, setViewingItem] = useState<TieuChiKpi | null>(null);
  const [editingItem, setEditingItem] = useState<TieuChiKpi | null>(null);
  const [fixedHanhDongId, setFixedHanhDongId] = useState<string | null>(null);

  const editIdFromUrl = searchParams.get('edit');
  const { data: editItemFromUrl } = useTieuChiById(editIdFromUrl);

  const { data: hanhDongList = [] } = useHanhDongList();
  const listParams = useMemo(
    () => ({
      id_hanh_dong: filters.id_hanh_dong ?? undefined,
      loai: filters.loai ?? undefined,
      cach_tinh_diem: filters.cach_tinh_diem ?? undefined,
      tan_suat: filters.tan_suat ?? undefined,
    }),
    [filters]
  );

  const { data: tieuChiList = [], isLoading } = useTieuChiList(listParams);
  const { data: allTieuChiForSum = [] } = useTieuChiList();
  const deleteMutation = useDeleteTieuChiKpi();

  const { data: donViTinhList = [] } = useDonViTinhList();
  const { data: cachTinhDiemList = [] } = useCachTinhDiemList();

  const hanhDongById = useMemo(() => {
    const o: Record<string, string> = {};
    hanhDongList.forEach((h) => {
      o[h.id] = h.ten;
    });
    return o;
  }, [hanhDongList]);

  const dvtByMa = useMemo(() => {
    const o: Record<string, string> = {};
    donViTinhList.forEach((d) => {
      o[d.ma] = d.ky_hieu ?? d.ten;
    });
    return o;
  }, [donViTinhList]);

  const ctdByMa = useMemo(() => {
    const o: Record<string, string> = {};
    cachTinhDiemList.forEach((c) => {
      o[c.ma] = c.ten;
    });
    return o;
  }, [cachTinhDiemList]);

  const filterFn = useCallback((item: TieuChiKpi, term: string) => {
    const searchLower = term.toLowerCase();
    return (
      !term ||
      item.ten.toLowerCase().includes(searchLower) ||
      (item.ma ?? '').toLowerCase().includes(searchLower)
    );
  }, []);

  const filteredList = useMemo(
    () => tieuChiList.filter((item) => filterFn(item, searchTerm)),
    [tieuChiList, searchTerm, filterFn]
  );

  useEffect(() => {
    const id = searchParams.get('hanh_dong');
    const add = searchParams.get('add');
    if (id) {
      setFilter('id_hanh_dong', id);
      if (add === '1') {
        setFixedHanhDongId(id);
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

  useEffect(() => () => resetState(), [resetState]);

  useEffect(() => setPage(1), [filteredList.length, setPage]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const handleView = (item: TieuChiKpi) => setViewingItem(item);
  const handleCloseDetail = () => setViewingItem(null);

  const handleEdit = (item: TieuChiKpi) => {
    setViewingItem(null);
    setEditingItem(item);
    setFixedHanhDongId(null);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFixedHanhDongId(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFixedHanhDongId(null);
  };

  const handleDelete = (id: string) => {
    setViewingItem((prev) => (prev?.id === id ? null : prev));
    confirm({
      title: t('tieuChiKpi.deleteTitle'),
      message: t('tieuChiKpi.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] min-h-0">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <TieuChiToolbar
          fullListForFilters={allTieuChiForSum}
          hanhDongList={hanhDongList}
          onAdd={handleAdd}
        />

        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1 overflow-auto">
          <TieuChiList
            data={filteredList}
            hanhDongById={hanhDongById}
            dvtByMa={dvtByMa}
            ctdByMa={ctdByMa}
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
        </div>
      </div>

      <AnimatePresence>
        {viewingItem && (
          <TieuChiDetailDrawer
            data={viewingItem}
            hanhDongLabel={hanhDongById[viewingItem.id_hanh_dong] ?? '—'}
            dvtLabel={dvtByMa[viewingItem.don_vi_tinh] ?? viewingItem.don_vi_tinh}
            ctdLabel={ctdByMa[viewingItem.cach_tinh_diem] ?? viewingItem.cach_tinh_diem}
            onClose={handleCloseDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        {showForm && (
          <TieuChiFormDrawer
            initialData={editingItem}
            fixedHanhDongId={fixedHanhDongId}
            hanhDongList={hanhDongList}
            donViTinhList={donViTinhList}
            cachTinhDiemList={cachTinhDiemList}
            existingTieuChiForSum={allTieuChiForSum}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TieuChiKpiPage;
