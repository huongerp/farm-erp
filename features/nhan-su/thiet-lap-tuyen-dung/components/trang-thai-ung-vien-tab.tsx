import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import TrangThaiUngVienToolbar from './trang-thai-ung-vien-toolbar';
import TrangThaiUngVienTable from './trang-thai-ung-vien-table';
import TrangThaiUngVienForm from './trang-thai-ung-vien-form';
import TrangThaiUngVienDetail from './trang-thai-ung-vien-detail';
import {
  useTrangThaiUngViens,
  useDeleteTrangThaiUngViens,
  useUpdateTrangThaiUngVienStatus,
} from '../hooks/use-trang-thai-ung-vien';
import { useTrangThaiUngVienStore } from '../store/useTrangThaiUngVienStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { TrangThaiUngVien } from '../core/types';

const TrangThaiUngVienTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
  } = useTrangThaiUngVienStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TrangThaiUngVien | null>(null);
  const [detailItem, setDetailItem] = useState<TrangThaiUngVien | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const { data: list = [], isLoading } = useTrangThaiUngViens();
  const deleteMutation = useDeleteTrangThaiUngViens();
  const statusMutation = useUpdateTrangThaiUngVienStatus();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const openId = searchParams.get('openId');
  useEffect(() => {
    if (searchParams.get('tab') !== 'trangthai' || !openId || list.length === 0) return;
    const item = list.find((l) => l.id === openId);
    if (item) setDetailItem(item);
    setSearchParams({}, { replace: true });
  }, [openId, list, searchParams, setSearchParams]);

  const filterFn = useCallback(
    (item: TrangThaiUngVien, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ma.toLowerCase().includes(searchLower) ||
        item.ten.toLowerCase().includes(searchLower) ||
        (item.ghi_chu && item.ghi_chu.toLowerCase().includes(searchLower));
      const statusKey = item.trang_thai === 1 ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: TrangThaiUngVien, b: TrangThaiUngVien) => {
      const aVal = a[sort.column as keyof TrangThaiUngVien] ?? '';
      const bVal = b[sort.column as keyof TrangThaiUngVien] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleView = (item: TrangThaiUngVien) => {
    setEditingItem(null);
    setShowForm(false);
    setDetailItem(item);
  };

  const handleEdit = (item: TrangThaiUngVien) => {
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
      title: t('thietLapTuyenDung.trangThaiUngVien.deleteTitle'),
      message: t('thietLapTuyenDung.trangThaiUngVien.deleteMessage'),
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
      title: t('thietLapTuyenDung.trangThaiUngVien.bulkDeleteTitle'),
      message: t('thietLapTuyenDung.trangThaiUngVien.bulkDeleteMessage', { count: ids.length }),
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

  const handleStatusChangeMany = (ids: string[], status: 0 | 1) => {
    const statusLabel = status === 1 ? t('common.active') : t('common.inactive');
    confirm({
      title: t('thietLapTuyenDung.trangThaiUngVien.statusChangeTitle'),
      message: t('thietLapTuyenDung.trangThaiUngVien.statusChangeMessage', { count: ids.length, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate(
          { ids, status },
          {
            onSuccess: () => {
              clearSelection();
              if (detailItem && ids.includes(detailItem.id)) {
                const next = list.find((x) => x.id === detailItem.id);
                if (next) setDetailItem(next);
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
      setDetailItem(fresh);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <TrangThaiUngVienToolbar
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
        <TrangThaiUngVienTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      </div>

      <AnimatePresence>
        {showForm && <TrangThaiUngVienForm initialData={editingItem} onClose={handleCloseForm} />}
      </AnimatePresence>

      <AnimatePresence>
        {detailItem && !showForm && (
          <TrangThaiUngVienDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={(item) => handleEdit(item)}
            onDelete={(id) => {
              setDetailItem(null);
              handleDelete(id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrangThaiUngVienTab;
