import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import DanhSachToolbar from './DanhSachToolbar';
import DanhSachTable from './DanhSachTable';
import HopDongDetail from './HopDongDetail';
import HopDongForm from './HopDongForm';
import PhieuThanhLyForm from './PhieuThanhLyForm';
import { useHopDongs, usePhieuThanhLyList, useDeleteHopDongs } from '../hooks/use-hop-dong';
import { useHopDongStore } from '../store/useHopDongStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage, exportToExcel, formatDate, formatDateTimeShort } from '../../../../lib/utils';
import { getLoaiHopDongLabel, getTrangThaiHopDongLabel } from '../core/constants';
import type { HopDong } from '../core/types';

const PREVIEW_BASE = '/nhan-su/hop-dong/preview';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
  } = useHopDongStore();

  const [showForm, setShowForm] = useState(false);
  const [detailItem, setDetailItem] = useState<HopDong | null>(null);
  const [editingItem, setEditingItem] = useState<HopDong | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);
  const [prefillFromHopDong, setPrefillFromHopDong] = useState<HopDong | null>(null);
  const [hopDongForPhieuThanhLy, setHopDongForPhieuThanhLy] = useState<HopDong | null>(null);

  const { data: list = [], isLoading } = useHopDongs();
  const { data: phieuList = [] } = usePhieuThanhLyList();
  const deleteMutation = useDeleteHopDongs();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: HopDong, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term || (item.ten_ung_vien && item.ten_ung_vien.toLowerCase().includes(searchLower));
      const matchesUngVien =
        f.id_ung_vien.length === 0 || f.id_ung_vien.includes(item.id_ung_vien);
      const matchesLoai =
        f.loai_hop_dong.length === 0 || f.loai_hop_dong.includes(item.loai_hop_dong);
      const matchesTrangThai =
        f.trang_thai.length === 0 || f.trang_thai.includes(item.trang_thai);
      return matchesSearch && matchesUngVien && matchesLoai && matchesTrangThai;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const getSortValue = (item: HopDong, col: string) => {
    if (col === 'ten_ung_vien') return item.ten_ung_vien ?? '';
    if (col === 'loai_hop_dong') return item.loai_hop_dong;
    if (col === 'so_hop_dong') return item.so_hop_dong ?? '';
    if (col === 'ngay_bat_dau') return item.ngay_bat_dau ?? '';
    if (col === 'ngay_ket_thuc') return item.ngay_ket_thuc ?? '';
    if (col === 'ngay_vao_lam') return item.ngay_vao_lam ?? '';
    if (col === 'trang_thai') return item.trang_thai ?? '';
    if (col === 'muc_luong') return item.muc_luong ?? '';
    if (col === 'tg_tao') return item.tg_tao ?? '';
    if (col === 'tg_cap_nhat') return item.tg_cap_nhat ?? '';
    return '';
  };

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    const isNumericCol = sort.column === 'muc_luong';
    sorted.sort((a: HopDong, b: HopDong) => {
      const aVal = getSortValue(a, sort.column!);
      const bVal = getSortValue(b, sort.column!);
      if (isNumericCol) {
        const aNum = aVal ? Number(aVal) : NaN;
        const bNum = bVal ? Number(bVal) : NaN;
        const cmp = (isNaN(aNum) ? -Infinity : aNum) - (isNaN(bNum) ? -Infinity : bNum);
        return sort.direction === 'desc' ? (cmp > 0 ? -1 : cmp < 0 ? 1 : 0) : (cmp > 0 ? 1 : cmp < 0 ? -1 : 0);
      }
      const cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const exportData = useMemo(
    () =>
      sortedList.map((item) => ({
        [t('hopDong.table.ungVien')]: item.ten_ung_vien ?? '—',
        [t('hopDong.table.soHopDong')]: item.so_hop_dong ?? '—',
        [t('hopDong.table.loaiHopDong')]: getLoaiHopDongLabel(item.loai_hop_dong, t),
        [t('hopDong.table.ngayBatDau')]: formatDate(item.ngay_bat_dau),
        [t('hopDong.table.ngayKetThuc')]: item.ngay_ket_thuc ? formatDate(item.ngay_ket_thuc) : '—',
        [t('hopDong.table.ngayVaoLam')]: item.ngay_vao_lam ? formatDate(item.ngay_vao_lam) : '—',
        [t('hopDong.table.trangThai')]: getTrangThaiHopDongLabel(item.trang_thai, t),
        [t('hopDong.table.mucLuong')]: item.muc_luong != null && item.muc_luong !== '' ? item.muc_luong : '—',
        [t('hopDong.table.ngayTao')]: formatDateTimeShort(item.tg_tao),
        [t('hopDong.table.ngayCapNhat')]: item.tg_cap_nhat ? formatDateTimeShort(item.tg_cap_nhat) : '—',
      })),
    [sortedList, t]
  );

  const handleExport = useCallback(() => {
    if (exportData.length === 0) return;
    exportToExcel(exportData, 'hop_dong');
  }, [exportData]);

  const hasPhieuThanhLy = useCallback(
    (idHopDong: string) => phieuList.some((p) => p.id_hop_dong === idHopDong),
    [phieuList]
  );

  const handleView = (item: HopDong) => {
    setDetailItem(item);
  };

  const handleEdit = (item: HopDong) => {
    setEditingItem(item);
    if (detailItem?.id === item.id) {
      setOpenedFormFromDetailId(item.id);
      setDetailItem(null);
    } else {
      setDetailItem(null);
      setOpenedFormFromDetailId(null);
    }
  };

  const handlePrint = (item: HopDong) => {
    const url = `${PREVIEW_BASE}/${encodeURIComponent(item.id)}`;
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) w.focus();
  };

  const handleOpenCreateChinhThuc = (item: HopDong) => {
    setPrefillFromHopDong(item);
    setDetailItem(null);
  };

  const handleOpenPhieuThanhLy = (item: HopDong) => {
    setHopDongForPhieuThanhLy(item);
  };

  const handleOpenHopDongGoc = (id: string) => {
    setDetailItem(null);
    const next = list.find((h) => h.id === id);
    if (next) setDetailItem(next);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('hopDong.deleteTitle'),
      message: t('hopDong.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () =>
        deleteMutation.mutate([id], {
          onSuccess: () => {
            if (detailItem?.id === id) setDetailItem(null);
          },
        }),
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('hopDong.bulkDeleteTitle'),
      message: t('hopDong.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (detailItem && ids.includes(detailItem.id)) setDetailItem(null);
          },
        });
      },
    });
  };

  const handleCloseForm = () => {
    const wasFromDetail = openedFormFromDetailId != null;
    const editingId = editingItem?.id;
    setShowForm(false);
    setEditingItem(null);
    setPrefillFromHopDong(null);
    setOpenedFormFromDetailId(null);
    if (wasFromDetail && editingId) {
      const fresh = list.find((r) => r.id === editingId) ?? null;
      setDetailItem(fresh);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DanhSachToolbar
        items={list}
        onAdd={() => {
          setDetailItem(null);
          setOpenedFormFromDetailId(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onExport={handleExport}
        exportableCount={sortedList.length}
      />
      <div className="flex-1 min-h-0">
        <DanhSachTable
          data={sortedList}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onPrint={handlePrint}
          onDelete={handleDelete}
        />
      </div>

      <AnimatePresence>
        {detailItem && (
          <HopDongDetail
            data={detailItem}
            hasPhieuThanhLy={hasPhieuThanhLy(detailItem.id)}
            phieu={phieuList.find((p) => p.id_hop_dong === detailItem.id)}
            onClose={() => setDetailItem(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenCreateChinhThuc={handleOpenCreateChinhThuc}
            onOpenPhieuThanhLy={handleOpenPhieuThanhLy}
            onOpenHopDongGoc={handleOpenHopDongGoc}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(showForm || editingItem || prefillFromHopDong) && (
          <HopDongForm
            onClose={handleCloseForm}
            initialData={editingItem ?? undefined}
            prefillFromHopDong={prefillFromHopDong ?? undefined}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {hopDongForPhieuThanhLy && (
          <PhieuThanhLyForm
            hopDong={hopDongForPhieuThanhLy}
            onClose={() => setHopDongForPhieuThanhLy(null)}
            stackLevel={1}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
