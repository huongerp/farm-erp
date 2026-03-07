import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import TheoDoiDanhGiaToolbar from './components/TheoDoiDanhGiaToolbar';
import TheoDoiDanhGiaList from './components/TheoDoiDanhGiaList';
import TheoDoiDanhGiaFormDrawer from './components/TheoDoiDanhGiaFormDrawer';
import TheoDoiDanhGiaDetailDrawer from './components/TheoDoiDanhGiaDetailDrawer';
import { useBaoCaoList, useDeleteBaoCao } from './hooks/use-theo-doi-danh-gia';
import { useTieuChiList } from '../tieu-chi-kpi/hooks/use-tieu-chi-kpi';
import { useDonViTinhList } from '../tieu-chi-kpi/hooks/use-don-vi-tinh';
import { useDepartments } from '../../he-thong/phong-ban/hooks/use-phong-ban';
import { useTheoDoiDanhGiaStore } from './store/useTheoDoiDanhGiaStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../lib/button-labels';
import type { KetQuaBaoCaoKpi } from './core/types';

const TheoDoiDanhGiaPage: React.FC = () => {
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
  } = useTheoDoiDanhGiaStore();

  const [showForm, setShowForm] = useState(false);
  const [viewingItem, setViewingItem] = useState<KetQuaBaoCaoKpi | null>(null);
  const [editingItem, setEditingItem] = useState<KetQuaBaoCaoKpi | null>(null);
  const [fixedTieuChiId, setFixedTieuChiId] = useState<string | null>(null);
  const [fixedPhongBanId, setFixedPhongBanId] = useState<string | null>(null);

  const listParams = useMemo(
    () => ({
      id_tieu_chi: filters.id_tieu_chi ?? undefined,
      id_phong_ban: filters.id_phong_ban ?? undefined,
      ky_nam: filters.ky_nam ?? undefined,
      ky_quy: filters.ky_quy ?? undefined,
      ky_thang: filters.ky_thang ?? undefined,
      trang_thai: filters.trang_thai ?? undefined,
    }),
    [filters]
  );

  const { data: baoCaoList = [], isLoading } = useBaoCaoList(listParams);
  const { data: allBaoCaoForFilters = [] } = useBaoCaoList();
  const deleteMutation = useDeleteBaoCao();

  const { data: tieuChiList = [] } = useTieuChiList();
  const { data: donViTinhList = [] } = useDonViTinhList();
  const { data: departments = [] } = useDepartments();

  const phongBanList = useMemo(
    () => departments.map((d) => ({ id: d.id, ten_phong_ban: d.ten_phong_ban })),
    [departments]
  );

  const tieuChiById = useMemo(() => {
    const o: Record<string, string> = {};
    tieuChiList.forEach((tc) => {
      o[tc.id] = tc.ten;
    });
    return o;
  }, [tieuChiList]);

  const tieuChiMucTieuById = useMemo(() => {
    const o: Record<string, number> = {};
    tieuChiList.forEach((tc) => {
      o[tc.id] = tc.gia_tri_muc_tieu;
    });
    return o;
  }, [tieuChiList]);

  const dvtByMa = useMemo(() => {
    const o: Record<string, string> = {};
    donViTinhList.forEach((d) => {
      o[d.ma] = d.ky_hieu ?? d.ten;
    });
    return o;
  }, [donViTinhList]);

  const tieuChiDvtById = useMemo(() => {
    const o: Record<string, string> = {};
    tieuChiList.forEach((tc) => {
      o[tc.id] = dvtByMa[tc.don_vi_tinh] ?? tc.don_vi_tinh;
    });
    return o;
  }, [tieuChiList, dvtByMa]);

  const phongBanById = useMemo(() => {
    const o: Record<string, string> = {};
    departments.forEach((d) => {
      o[d.id] = d.ten_phong_ban;
    });
    return o;
  }, [departments]);

  const filterFn = useCallback(
    (item: KetQuaBaoCaoKpi, term: string) => {
      if (!term) return true;
      const lower = term.toLowerCase();
      const tcName = tieuChiById[item.id_tieu_chi] ?? '';
      const pbName = phongBanById[item.id_phong_ban] ?? '';
      return tcName.toLowerCase().includes(lower) || pbName.toLowerCase().includes(lower);
    },
    [tieuChiById, phongBanById]
  );

  const filteredList = useMemo(
    () => baoCaoList.filter((item) => filterFn(item, searchTerm)),
    [baoCaoList, searchTerm, filterFn]
  );

  useEffect(() => {
    const tieuChi = searchParams.get('tieu_chi');
    const phongBan = searchParams.get('phong_ban');
    const add = searchParams.get('add');
    if (tieuChi) {
      setFilter('id_tieu_chi', tieuChi);
      if (add === '1') {
        setFixedTieuChiId(tieuChi);
        setShowForm(true);
      }
    }
    if (phongBan) {
      setFilter('id_phong_ban', phongBan);
      if (add === '1') setFixedPhongBanId(phongBan);
    }
  }, [searchParams, setFilter]);

  useEffect(() => () => resetState(), [resetState]);

  useEffect(() => setPage(1), [filteredList.length, setPage]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const handleView = (item: KetQuaBaoCaoKpi) => setViewingItem(item);
  const handleCloseDetail = () => setViewingItem(null);

  const handleEdit = (item: KetQuaBaoCaoKpi) => {
    setViewingItem(null);
    setEditingItem(item);
    setFixedTieuChiId(null);
    setFixedPhongBanId(null);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFixedTieuChiId(null);
    setFixedPhongBanId(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFixedTieuChiId(null);
    setFixedPhongBanId(null);
  };

  const handleDelete = (id: string) => {
    setViewingItem((prev) => (prev?.id === id ? null : prev));
    confirm({
      title: t('theoDoiDanhGia.deleteTitle'),
      message: t('theoDoiDanhGia.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteMutation.mutate(id),
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] min-h-0">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <TheoDoiDanhGiaToolbar
          fullListForFilters={allBaoCaoForFilters}
          tieuChiList={tieuChiList}
          phongBanList={phongBanList}
          onAdd={handleAdd}
        />

        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1 overflow-auto">
          <TheoDoiDanhGiaList
            data={filteredList}
            tieuChiById={tieuChiById}
            tieuChiMucTieuById={tieuChiMucTieuById}
            tieuChiDvtById={tieuChiDvtById}
            phongBanById={phongBanById}
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
          <TheoDoiDanhGiaDetailDrawer
            data={viewingItem}
            tieuChiLabel={tieuChiById[viewingItem.id_tieu_chi] ?? '—'}
            phongBanLabel={phongBanById[viewingItem.id_phong_ban] ?? '—'}
            mucTieuLabel={
              tieuChiMucTieuById[viewingItem.id_tieu_chi] != null
                ? `${tieuChiMucTieuById[viewingItem.id_tieu_chi]} ${tieuChiDvtById[viewingItem.id_tieu_chi] ?? ''}`
                : '—'
            }
            dvtLabel={tieuChiDvtById[viewingItem.id_tieu_chi] ?? ''}
            onClose={handleCloseDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        {showForm && (
          <TheoDoiDanhGiaFormDrawer
            initialData={editingItem}
            fixedTieuChiId={fixedTieuChiId}
            fixedPhongBanId={fixedPhongBanId}
            tieuChiList={tieuChiList}
            phongBanList={phongBanList}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TheoDoiDanhGiaPage;
