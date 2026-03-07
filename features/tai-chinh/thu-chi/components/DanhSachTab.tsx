import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import ThuChiToolbar from './ThuChiToolbar';
import ThuChiList from './ThuChiList';
import ThuChiForm from './ThuChiForm';
import ThuChiDetail from './ThuChiDetail';
import { useThuChiList, useDeleteThuChi, useDeleteThuChiMany } from '../hooks/use-thu-chi';
import { useThuChiStore } from '../store/useThuChiStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { ThuChi } from '../../core/types';
import { exportThuChiToExcel } from '../utils/export-thu-chi-excel';
import { toast } from 'sonner';

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
  } = useThuChiStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ThuChi | null>(null);
  const [viewingItem, setViewingItem] = useState<ThuChi | null>(null);

  const { data: allList = [], isLoading } = useThuChiList();
  const deleteMutation = useDeleteThuChi();
  const deleteManyMutation = useDeleteThuChiMany();

  const filterFn = useCallback(
    (item: ThuChi, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ma_giao_dich.toLowerCase().includes(searchLower) ||
        (item.noi_dung && item.noi_dung.toLowerCase().includes(searchLower)) ||
        (item.ten_tai_khoan && item.ten_tai_khoan.toLowerCase().includes(searchLower)) ||
        (item.ten_danh_muc && item.ten_danh_muc.toLowerCase().includes(searchLower)) ||
        (item.ten_nhan_vien && item.ten_nhan_vien.toLowerCase().includes(searchLower));
      const matchesLoai = f.loai.length === 0 || f.loai.includes(item.loai);
      const matchesStatus = f.trang_thai.length === 0 || f.trang_thai.includes(item.trang_thai);
      const itemDate = new Date(item.ngay_giao_dich).getTime();
      const tu = f.tu_ngay ? new Date(f.tu_ngay).getTime() : 0;
      const den = f.den_ngay ? new Date(f.den_ngay).getTime() + 86400000 : Number.MAX_SAFE_INTEGER;
      const matchesDate = itemDate >= tu && itemDate <= den;
      return matchesSearch && matchesLoai && matchesStatus && matchesDate;
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

  const handleEdit = (item: ThuChi) => {
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

  const handleView = (item: ThuChi) => setViewingItem(item);

  const handleDelete = (id: string) => {
    confirm({
      title: t('thuChi.deleteTitle'),
      message: t('thuChi.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () =>
        deleteMutation.mutate(id, {
          onSuccess: () => {
            toast.success(t('thuChi.toast.deleteSuccess'));
            if (viewingItem?.id === id) setViewingItem(null);
          },
        }),
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('thuChi.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteManyMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (viewingItem && ids.includes(viewingItem.id)) setViewingItem(null);
            toast.success(t('thuChi.toast.deleteSuccess'));
          },
        });
      },
    });
  };

  const handleExportExcel = useCallback(async () => {
    try {
      await exportThuChiToExcel(filteredList, t);
      toast.success(t('thuChi.export.excel') + ' OK');
    } catch (e) {
      toast.error(t('common.error'));
    }
  }, [filteredList, t]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <ThuChiToolbar
          data={allList}
          selectedCount={selectedIds.size}
          onAdd={handleAdd}
          onClearSelection={clearSelection}
          onDeleteMany={handleDeleteMany}
          onExportExcel={handleExportExcel}
          onPrint={handlePrint}
        />
        <div className="flex-1 min-h-0 flex flex-col">
          <ThuChiList
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
          <ThuChiForm initialData={editingItem ?? undefined} onClose={handleCloseForm} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <ThuChiDetail
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
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DanhSachTab;
