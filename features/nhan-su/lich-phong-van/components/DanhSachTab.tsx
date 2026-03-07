import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import DanhSachToolbar from './DanhSachToolbar';
import DanhSachTable from './DanhSachTable';
import LichPhongVanForm from './LichPhongVanForm';
import LichPhongVanDetail from './LichPhongVanDetail';
import LichPhongVanDanhGiaForm from './LichPhongVanDanhGiaForm';
import { useLichPhongVans, useDeleteLichPhongVans } from '../hooks/use-lich-phong-van';
import { useLichPhongVanStore } from '../store/useLichPhongVanStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import type { LichPhongVan } from '../core/types';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
  } = useLichPhongVanStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<LichPhongVan | null>(null);
  const [detailItem, setDetailItem] = useState<LichPhongVan | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);
  const [danhGiaItem, setDanhGiaItem] = useState<LichPhongVan | null>(null);

  const { data: list = [], isLoading } = useLichPhongVans();
  const deleteMutation = useDeleteLichPhongVans();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: LichPhongVan, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        (item.ten_ung_vien && item.ten_ung_vien.toLowerCase().includes(searchLower)) ||
        (item.dia_diem && item.dia_diem.toLowerCase().includes(searchLower)) ||
        (item.ma_de_xuat && item.ma_de_xuat.toLowerCase().includes(searchLower));
      const matchesUngVien =
        f.id_ung_vien.length === 0 || f.id_ung_vien.includes(item.id_ung_vien);
      const matchesNgayTu = !f.ngay_tu || item.ngay >= f.ngay_tu;
      const matchesNgayDen = !f.ngay_den || item.ngay <= f.ngay_den;
      const matchesHinhThuc =
        f.hinh_thuc.length === 0 || f.hinh_thuc.includes(item.hinh_thuc);
      const matchesTrangThai =
        f.trang_thai.length === 0 || f.trang_thai.includes(item.trang_thai);
      return (
        matchesSearch &&
        matchesUngVien &&
        matchesNgayTu &&
        matchesNgayDen &&
        matchesHinhThuc &&
        matchesTrangThai
      );
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const getSortValue = (item: LichPhongVan, col: string) => {
    if (col === 'ten_ung_vien') return item.ten_ung_vien ?? '';
    return item[col as keyof LichPhongVan] ?? '';
  };

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: LichPhongVan, b: LichPhongVan) => {
      const aVal = getSortValue(a, sort.column!);
      const bVal = getSortValue(b, sort.column!);
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleView = (item: LichPhongVan) => {
    setEditingItem(null);
    setShowForm(false);
    setDetailItem(item);
  };

  const handleEdit = (item: LichPhongVan) => {
    setEditingItem(item);
    setShowForm(true);
    if (detailItem?.id === item.id) {
      setOpenedFormFromDetailId(item.id);
      setDetailItem(null);
    } else {
      setDetailItem(null);
      setOpenedFormFromDetailId(null);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('lichPhongVan.deleteTitle'),
      message: t('lichPhongVan.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            if (detailItem?.id === id) setDetailItem(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('lichPhongVan.bulkDeleteTitle'),
      message: t('lichPhongVan.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
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
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
      />
      <div className="flex-1 min-h-0">
        <DanhSachTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <LichPhongVanForm
            initialData={editingItem}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailItem && !showForm && (
          <LichPhongVanDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={(item) => handleEdit(item)}
            onDelete={(id) => {
              setDetailItem(null);
              handleDelete(id);
            }}
            onOpenDanhGia={(item) => {
              setDanhGiaItem(item);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {danhGiaItem && (
          <LichPhongVanDanhGiaForm
            initialData={danhGiaItem}
            onClose={() => setDanhGiaItem(null)}
            onSuccess={(updated) => {
              if (detailItem?.id === updated.id) setDetailItem(updated);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
