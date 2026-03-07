import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import DanhSachToolbar from './DanhSachToolbar';
import DanhSachTable from './DanhSachTable';
import UngVienForm from './UngVienForm';
import UngVienDetail from './UngVienDetail';
import LichPhongVanDetail from '@/features/nhan-su/lich-phong-van/components/LichPhongVanDetail';
import LichPhongVanForm from '@/features/nhan-su/lich-phong-van/components/LichPhongVanForm';
import LichPhongVanDanhGiaForm from '@/features/nhan-su/lich-phong-van/components/LichPhongVanDanhGiaForm';
import { useUngViens, useDeleteUngViens } from '../hooks/use-ung-vien';
import { useDeleteLichPhongVans } from '@/features/nhan-su/lich-phong-van/hooks/use-lich-phong-van';
import { useUngVienStore } from '../store/useUngVienStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { getYearFromNgaySinh } from '../utils/format';
import type { UngVien } from '../core/types';
import type { LichPhongVan } from '@/features/nhan-su/lich-phong-van/core/types';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
  } = useUngVienStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<UngVien | null>(null);
  const [detailItem, setDetailItem] = useState<UngVien | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);
  const [lichPhongVanDetailItem, setLichPhongVanDetailItem] = useState<LichPhongVan | null>(null);
  const [showLichPhongVanForm, setShowLichPhongVanForm] = useState(false);
  const [editingLichPhongVan, setEditingLichPhongVan] = useState<LichPhongVan | null>(null);
  const [initialIdUngVienForLich, setInitialIdUngVienForLich] = useState<string | null>(null);
  const [danhGiaLichItem, setDanhGiaLichItem] = useState<LichPhongVan | null>(null);

  const { data: list = [], isLoading } = useUngViens();
  const deleteMutation = useDeleteUngViens();
  const deleteLichPhongVanMutation = useDeleteLichPhongVans();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: UngVien, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ho_ten.toLowerCase().includes(searchLower) ||
        item.email.toLowerCase().includes(searchLower) ||
        (item.so_dien_thoai && item.so_dien_thoai.toLowerCase().includes(searchLower));
      const matchesTrangThai =
        f.id_trang_thai_ung_vien.length === 0 ||
        f.id_trang_thai_ung_vien.includes(item.id_trang_thai_ung_vien);
      const matchesViTri =
        f.id_de_xuat_tuyen_dung.length === 0 ||
        f.id_de_xuat_tuyen_dung.includes(item.id_de_xuat_tuyen_dung);
      const matchesNguon =
        f.id_kenh_tuyen_dung.length === 0 ||
        (item.id_kenh_tuyen_dung != null && f.id_kenh_tuyen_dung.includes(item.id_kenh_tuyen_dung));
      return matchesSearch && matchesTrangThai && matchesViTri && matchesNguon;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const getSortValue = (item: UngVien, col: string) => {
    if (col === 'vi_tri_ung_tuyen') return item.ma_de_xuat ?? '';
    if (col === 'nam_sinh') {
      const y = getYearFromNgaySinh(item.ngay_sinh);
      return y != null ? String(y) : '';
    }
    if (col === 'nguon') return item.ten_kenh_tuyen_dung ?? '';
    return item[col as keyof UngVien] ?? '';
  };

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: UngVien, b: UngVien) => {
      const aVal = getSortValue(a, sort.column!);
      const bVal = getSortValue(b, sort.column!);
      const cmp =
        typeof aVal === 'string' && typeof bVal === 'string'
          ? aVal.localeCompare(bVal, getLanguage())
          : String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleView = (item: UngVien) => {
    setEditingItem(null);
    setShowForm(false);
    setDetailItem(item);
  };

  const handleEdit = (item: UngVien) => {
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
      title: t('ungVien.deleteTitle'),
      message: t('ungVien.deleteMessage'),
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
      title: t('ungVien.bulkDeleteTitle'),
      message: t('ungVien.bulkDeleteMessage', { count: ids.length }),
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
          <UngVienForm initialData={editingItem} onClose={handleCloseForm} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailItem && !showForm && (
          <UngVienDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={(item) => handleEdit(item)}
            onDelete={(id) => {
              setDetailItem(null);
              handleDelete(id);
            }}
            onAddLichPhongVan={
              detailItem
                ? () => {
                    setInitialIdUngVienForLich(detailItem.id);
                    setEditingLichPhongVan(null);
                    setShowLichPhongVanForm(true);
                  }
                : undefined
            }
            onViewLichPhongVan={(item) => setLichPhongVanDetailItem(item)}
            onEditLichPhongVan={(item) => {
              setEditingLichPhongVan(item);
              setInitialIdUngVienForLich(undefined);
              setShowLichPhongVanForm(true);
            }}
            onDeleteLichPhongVan={(item) => {
              confirm({
                title: t('lichPhongVan.deleteTitle'),
                message: t('lichPhongVan.deleteMessage'),
                variant: 'danger',
                confirmText: CONFIRM_DELETE(),
                onConfirm: () => {
                  deleteLichPhongVanMutation.mutate([item.id], {
                    onSuccess: () => {
                      if (lichPhongVanDetailItem?.id === item.id)
                        setLichPhongVanDetailItem(null);
                    },
                  });
                },
              });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lichPhongVanDetailItem && (
          <LichPhongVanDetail
            data={lichPhongVanDetailItem}
            onClose={() => setLichPhongVanDetailItem(null)}
            onEdit={(item) => {
              setLichPhongVanDetailItem(null);
              setEditingLichPhongVan(item);
              setInitialIdUngVienForLich(undefined);
              setShowLichPhongVanForm(true);
            }}
            onDelete={(id) => {
              deleteLichPhongVanMutation.mutate([id], {
                onSuccess: () => setLichPhongVanDetailItem(null),
              });
            }}
            onOpenDanhGia={(item) => setDanhGiaLichItem(item)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLichPhongVanForm && (
          <LichPhongVanForm
            initialData={editingLichPhongVan}
            initialIdUngVien={initialIdUngVienForLich ?? undefined}
            onClose={() => {
              setShowLichPhongVanForm(false);
              setEditingLichPhongVan(null);
              setInitialIdUngVienForLich(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {danhGiaLichItem && (
          <LichPhongVanDanhGiaForm
            initialData={danhGiaLichItem}
            onClose={() => setDanhGiaLichItem(null)}
            onSuccess={(updated) => {
              if (lichPhongVanDetailItem?.id === updated.id) setLichPhongVanDetailItem(updated);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
