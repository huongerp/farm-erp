import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import DeXuatChiPhiToolbar from './DeXuatChiPhiToolbar';
import DeXuatChiPhiList from './DeXuatChiPhiList';
import DeXuatChiPhiForm from './DeXuatChiPhiForm';
import DeXuatChiPhiDetail from './DeXuatChiPhiDetail';
import { useDeXuatChiPhiList, useDeleteDeXuatChiPhi, useDeleteDeXuatChiPhiMany, useApproveDeXuatChiPhi, useRejectDeXuatChiPhi } from '../hooks/use-de-xuat-chi-phi';
import { useDeXuatChiPhiStore } from '../store/useDeXuatChiPhiStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { DeXuatChiPhi } from '../core/types';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    resetState,
    selectedIds,
    clearSelection,
    pagination,
    setPage,
    setPageSize,
  } = useDeXuatChiPhiStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DeXuatChiPhi | null>(null);
  const [viewingItem, setViewingItem] = useState<DeXuatChiPhi | null>(null);

  const { data: allList = [], isLoading } = useDeXuatChiPhiList();
  const deleteMutation = useDeleteDeXuatChiPhi();
  const deleteManyMutation = useDeleteDeXuatChiPhiMany();
  const approveMutation = useApproveDeXuatChiPhi();
  const rejectMutation = useRejectDeXuatChiPhi();

  const filterFn = useCallback(
    (item: DeXuatChiPhi, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.so_phieu.toLowerCase().includes(searchLower) ||
        (item.ten_nguoi_de_xuat && item.ten_nguoi_de_xuat.toLowerCase().includes(searchLower)) ||
        (item.ten_tai_khoan && item.ten_tai_khoan.toLowerCase().includes(searchLower)) ||
        (item.ghi_chu && item.ghi_chu.toLowerCase().includes(searchLower));
      const statusStr = String(item.trang_thai);
      const matchesStatus = f.status.length === 0 || f.status.includes(statusStr);
      const matchesLoai = !f.loai || item.loai === f.loai;
      return matchesSearch && matchesStatus && matchesLoai;
    },
    []
  );

  const filteredList = useListWithFilter(allList, searchTerm, filters, filterFn);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);

  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = allList.find((d) => d.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
  }, [allList, viewingItem?.id]);

  const handleEdit = (item: DeXuatChiPhi) => {
    setEditingItem(item);
    setViewingItem(null);
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

  const handleView = (item: DeXuatChiPhi) => setViewingItem(item);

  const handleDelete = (id: string) => {
    confirm({
      title: t('deXuatChiPhi.deleteTitle'),
      message: t('deXuatChiPhi.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () =>
        deleteMutation.mutate(id, {
          onSuccess: () => {
            if (viewingItem?.id === id) setViewingItem(null);
          },
        }),
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('deXuatChiPhi.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteManyMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
          },
        });
      },
    });
  };

  const handleApprove = useCallback(
    (id: string, payload: { id_nguoi_duyet: string; ten_nguoi_duyet?: string; ghi_chu_duyet?: string }) => {
      approveMutation.mutate(
        { id, payload },
        {
          onSuccess: () => {
            const fresh = allList.find((d) => d.id === id);
            if (viewingItem?.id === id && fresh) setViewingItem(fresh);
          },
        }
      );
    },
    [approveMutation, allList, viewingItem?.id]
  );

  const handleReject = useCallback(
    (id: string, payload: { id_nguoi_duyet: string; ten_nguoi_duyet?: string; ly_do_tu_choi?: string }) => {
      rejectMutation.mutate(
        { id, payload },
        {
          onSuccess: () => {
            const fresh = allList.find((d) => d.id === id);
            if (viewingItem?.id === id && fresh) setViewingItem(fresh);
          },
        }
      );
    },
    [rejectMutation, allList, viewingItem?.id]
  );

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <DeXuatChiPhiToolbar
          data={allList}
          selectedCount={selectedIds.size}
          onAdd={handleAdd}
          onDeleteMany={handleDeleteMany}
        />
        <div className="flex-1 min-h-0 flex flex-col">
          <DeXuatChiPhiList
            data={filteredList}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <DeXuatChiPhiForm
            initialData={editingItem}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <DeXuatChiPhiDetail
            data={viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={(item) => {
              setViewingItem(null);
              handleEdit(item);
            }}
            onDelete={(id) => {
              setViewingItem(null);
              handleDelete(id);
            }}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DanhSachTab;
