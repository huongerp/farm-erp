import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LoaiChiPhiToolbar from './loai-chi-phi-toolbar';
import LoaiChiPhiTable from './loai-chi-phi-table';
import LoaiChiPhiForm from './loai-chi-phi-form';
import LoaiChiPhiDetail from './loai-chi-phi-detail';
import {
  useLoaiChiPhiList,
  useDeleteLoaiChiPhiList,
  useUpdateLoaiChiPhiStatus,
} from '../hooks/use-loai-chi-phi';
import { useLoaiChiPhiStore } from '../store/useLoaiChiPhiStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { LoaiChiPhi } from '../core/types';

const LoaiChiPhiTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
  } = useLoaiChiPhiStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<LoaiChiPhi | null>(null);
  const [detailItem, setDetailItem] = useState<LoaiChiPhi | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const { data: list = [], isLoading } = useLoaiChiPhiList();
  const deleteMutation = useDeleteLoaiChiPhiList();
  const statusMutation = useUpdateLoaiChiPhiStatus();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const openId = searchParams.get('openId');
  useEffect(() => {
    if (searchParams.get('tab') !== 'loaichiphi' || !openId || list.length === 0) return;
    const item = list.find((l) => l.id === openId);
    if (item) setDetailItem(item);
    setSearchParams({}, { replace: true });
  }, [openId, list, searchParams, setSearchParams]);

  const filterFn = useCallback(
    (item: LoaiChiPhi, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ma.toLowerCase().includes(searchLower) ||
        item.ten.toLowerCase().includes(searchLower) ||
        (item.ghi_chu && item.ghi_chu.toLowerCase().includes(searchLower));
      const statusKey = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    []
  );

  const filteredList = useListWithFilter(list, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: LoaiChiPhi, b: LoaiChiPhi) => {
      const aVal = a[sort.column as keyof LoaiChiPhi] ?? '';
      const bVal = b[sort.column as keyof LoaiChiPhi] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleView = (item: LoaiChiPhi) => {
    setEditingItem(null);
    setShowForm(false);
    setDetailItem(item);
  };

  const handleEdit = (item: LoaiChiPhi) => {
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
      title: t('thietLapTaiSan.loaiChiPhi.deleteTitle'),
      message: t('thietLapTaiSan.loaiChiPhi.deleteMessage'),
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
      title: t('thietLapTaiSan.loaiChiPhi.bulkDeleteTitle'),
      message: t('thietLapTaiSan.loaiChiPhi.bulkDeleteMessage', { count: ids.length }),
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

  const handleStatusChangeMany = (ids: string[], status: import('../../../../lib/constants').TrangThaiHoatDong) => {
    const statusLabel = status === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('common.active') : t('common.inactive');
    confirm({
      title: t('thietLapTaiSan.loaiChiPhi.statusChangeTitle'),
      message: t('thietLapTaiSan.loaiChiPhi.statusChangeMessage', { count: ids.length, status: statusLabel }),
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
      <LoaiChiPhiToolbar
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
        <LoaiChiPhiTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      </div>

      <AnimatePresence>
        {showForm && <LoaiChiPhiForm initialData={editingItem} onClose={handleCloseForm} />}
      </AnimatePresence>

      <AnimatePresence>
        {detailItem && !showForm && (
          <LoaiChiPhiDetail
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

export default LoaiChiPhiTab;
