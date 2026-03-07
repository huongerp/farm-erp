import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import DanhSachToolbar from './DanhSachToolbar';
import DanhSachTable from './DanhSachTable';
import DeXuatTuyenDungForm from './DeXuatTuyenDungForm';
import DeXuatTuyenDungDetail from './DeXuatTuyenDungDetail';
import UngVienDetail from '@/features/nhan-su/ung-vien/components/UngVienDetail';
import UngVienForm from '@/features/nhan-su/ung-vien/components/UngVienForm';
import { useDeleteUngViens } from '@/features/nhan-su/ung-vien/hooks/use-ung-vien';
import {
  useDeleteDeXuatTuyenDungs,
  useUpdateDeXuatTuyenDungStatus,
} from '../hooks/use-de-xuat-tuyen-dung';
import { useDeXuatTuyenDungWithCounts } from '../hooks/use-de-xuat-tuyen-dung-with-counts';
import { useDeXuatTuyenDungStore } from '../store/useDeXuatTuyenDungStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import type { DeXuatTuyenDungWithCounts } from '../core/types';
import type { UngVien } from '@/features/nhan-su/ung-vien/core/types';

const STATUS_LABELS: Record<number, string> = {
  0: 'deXuatTuyenDung.status.nhap',
  1: 'deXuatTuyenDung.status.choDuyet',
  2: 'deXuatTuyenDung.status.daDuyet',
  3: 'deXuatTuyenDung.status.tuChoi',
};

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
  } = useDeXuatTuyenDungStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DeXuatTuyenDungWithCounts | null>(null);
  const [detailItem, setDetailItem] = useState<DeXuatTuyenDungWithCounts | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);
  const [ungVienDetailItem, setUngVienDetailItem] = useState<UngVien | null>(null);
  const [showUngVienForm, setShowUngVienForm] = useState(false);
  const [editingUngVien, setEditingUngVien] = useState<UngVien | null>(null);
  const [initialDeXuatIdForUngVien, setInitialDeXuatIdForUngVien] = useState<string | null>(null);

  const { data: list = [], isLoading } = useDeXuatTuyenDungWithCounts();
  const deleteMutation = useDeleteDeXuatTuyenDungs();
  const statusMutation = useUpdateDeXuatTuyenDungStatus();
  const deleteUngVienMutation = useDeleteUngViens();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: DeXuatTuyenDungWithCounts, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ma_de_xuat.toLowerCase().includes(searchLower) ||
        (item.tieu_de && item.tieu_de.toLowerCase().includes(searchLower)) ||
        item.mo_ta.toLowerCase().includes(searchLower) ||
        item.yeu_cau.toLowerCase().includes(searchLower);
      const matchesStatus = f.status.length === 0 || f.status.includes(item.trang_thai);
      const matchesChucVu = f.id_chuc_vu.length === 0 || f.id_chuc_vu.includes(item.id_chuc_vu);
      return matchesSearch && matchesStatus && matchesChucVu;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const getSortValue = (item: DeXuatTuyenDungWithCounts, col: string) => {
    if (col === 'so_luong_con_lai') return item.so_luong_con_lai ?? 0;
    if (col === 'so_luong_onboard') return item.so_luong_onboard ?? 0;
    if (col === 'so_luong_da_nghi') return item.so_luong_da_nghi ?? 0;
    return item[col as keyof DeXuatTuyenDungWithCounts] ?? '';
  };

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: DeXuatTuyenDungWithCounts, b: DeXuatTuyenDungWithCounts) => {
      const aVal = getSortValue(a, sort.column!);
      const bVal = getSortValue(b, sort.column!);
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleView = (item: DeXuatTuyenDungWithCounts) => {
    setEditingItem(null);
    setShowForm(false);
    setDetailItem(item);
  };

  const handleEdit = (item: DeXuatTuyenDungWithCounts) => {
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
      title: t('deXuatTuyenDung.deleteTitle'),
      message: t('deXuatTuyenDung.deleteMessage'),
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
      title: t('deXuatTuyenDung.bulkDeleteTitle'),
      message: t('deXuatTuyenDung.bulkDeleteMessage', { count: ids.length }),
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

  const handleStatusChangeMany = (ids: string[], status: 0 | 1 | 2 | 3) => {
    const statusLabel = t(STATUS_LABELS[status]);
    confirm({
      title: t('deXuatTuyenDung.statusChangeTitle'),
      message: t('deXuatTuyenDung.statusChangeMessage', { count: ids.length, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate(
          { ids, status },
          {
            onSuccess: () => {
              clearSelection();
              if (detailItem && ids.includes(detailItem.id)) {
                const next = list.find((x) => x.id === detailItem.id) ?? null;
                setDetailItem(next);
              }
            },
          }
        );
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
      setDetailItem(fresh as DeXuatTuyenDungWithCounts | null);
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
        onStatusChangeMany={handleStatusChangeMany}
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
          <DeXuatTuyenDungForm initialData={editingItem} onClose={handleCloseForm} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailItem && !showForm && (
          <DeXuatTuyenDungDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={(item) => handleEdit(item)}
            onDelete={(id) => {
              setDetailItem(null);
              handleDelete(id);
            }}
            onDataUpdated={(item) => setDetailItem(item)}
            onAddUngVien={
              detailItem
                ? () => {
                    setInitialDeXuatIdForUngVien(detailItem.id);
                    setEditingUngVien(null);
                    setShowUngVienForm(true);
                  }
                : undefined
            }
            onViewUngVien={(uv) => setUngVienDetailItem(uv)}
            onEditUngVien={(uv) => {
              setEditingUngVien(uv);
              setInitialDeXuatIdForUngVien(null);
              setShowUngVienForm(true);
            }}
            onDeleteUngVien={(uv) => {
              confirm({
                title: t('ungVien.deleteTitle'),
                message: t('ungVien.deleteMessage'),
                variant: 'danger',
                confirmText: CONFIRM_DELETE(),
                onConfirm: () => {
                  deleteUngVienMutation.mutate([uv.id], {
                    onSuccess: () => {
                      if (ungVienDetailItem?.id === uv.id) setUngVienDetailItem(null);
                    },
                  });
                },
              });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ungVienDetailItem && (
          <UngVienDetail
            data={ungVienDetailItem}
            onClose={() => setUngVienDetailItem(null)}
            onEdit={() => setUngVienDetailItem(null)}
            onDelete={() => setUngVienDetailItem(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUngVienForm && (
          <UngVienForm
            initialData={editingUngVien}
            initialIdDeXuatTuyenDung={initialDeXuatIdForUngVien ?? undefined}
            onClose={() => {
              setShowUngVienForm(false);
              setEditingUngVien(null);
              setInitialDeXuatIdForUngVien(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
