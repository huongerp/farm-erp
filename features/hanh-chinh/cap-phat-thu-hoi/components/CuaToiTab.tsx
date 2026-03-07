import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import CapPhatThuHoiToolbar from './CapPhatThuHoiToolbar';
import PhieuTable from './PhieuTable';
import PhieuDetail from './PhieuDetail';
import TaoPhieuForm from './TaoPhieuForm';
import { usePhieuList, useDeletePhieu } from '../hooks/use-cap-phat-thu-hoi';
import { useCapPhatThuHoiStore } from '../store/useCapPhatThuHoiStore';
import { getLanguage } from '../../../../lib/utils';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuCapPhatThuHoi } from '../core/types';

const CuaToiTab: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const confirm = useConfirmStore((s) => s.confirm);
  const currentUserId = user?.id ?? '';
  const { searchTerm, filters, sort, resetState, selectedIds, clearSelection, pagination } = useCapPhatThuHoiStore();
  const { data: list = [], isLoading } = usePhieuList({
    filter: 'mine',
    id_nguoi: currentUserId,
    q: searchTerm || undefined,
  });
  const deleteMutation = useDeletePhieu();
  const [detailItem, setDetailItem] = useState<PhieuCapPhatThuHoi | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPhieu, setEditingPhieu] = useState<PhieuCapPhatThuHoi | null>(null);
  /** Id phiếu đang mở form Sửa từ detail — khi Hủy sẽ mở lại detail; từ list thì về list */
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filteredList = useMemo(() => {
    return list.filter((p) => {
      if (filters.loai_phieu.length > 0 && !filters.loai_phieu.includes(p.loai_phieu)) return false;
      if (filters.dateFrom && p.ngay_thuc_hien < filters.dateFrom) return false;
      if (filters.dateTo && p.ngay_thuc_hien > filters.dateTo) return false;
      if (filters.id_noi_luu_truoc.length > 0 && !filters.id_noi_luu_truoc.includes(p.id_noi_luu_truoc)) return false;
      if (filters.id_nguoi_thuc_hien.length > 0 && !filters.id_nguoi_thuc_hien.includes(p.id_nguoi_thuc_hien)) return false;
      return true;
    });
  }, [list, filters]);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a, b) => {
      const aVal = a[sort.column as keyof PhieuCapPhatThuHoi] ?? '';
      const bVal = b[sort.column as keyof PhieuCapPhatThuHoi] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleAdd = useCallback(() => {
    setEditingPhieu(null);
    setShowForm(true);
  }, []);
  /** Click dòng → xem detail (generic) */
  const handleView = useCallback((item: PhieuCapPhatThuHoi) => {
    setDetailItem(item);
    setEditingPhieu(null);
    setShowForm(false);
  }, []);
  /** Nút Sửa (từ list hoặc từ detail) → mở form sửa; ghi nhớ nguồn để Hủy quay đúng (list vs detail) */
  const handleEdit = useCallback((item: PhieuCapPhatThuHoi) => {
    if (detailItem?.id === item.id) {
      setOpenedFormFromDetailId(item.id);
    } else {
      setOpenedFormFromDetailId(null);
    }
    setDetailItem(null);
    setEditingPhieu(item);
    setShowForm(true);
  }, [detailItem?.id]);
  /** Finish view: sau khi lưu form sửa thành công → đóng form và mở detail bản ghi vừa sửa */
  const handleSuccessAfterEdit = useCallback((item: PhieuCapPhatThuHoi) => {
    setShowForm(false);
    setEditingPhieu(null);
    setDetailItem(item);
  }, []);
  const handleDelete = useCallback(
    (item: PhieuCapPhatThuHoi) => {
      confirm({
        title: t('capPhatThuHoi.deleteTitle'),
        message: t('capPhatThuHoi.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: () => {
          deleteMutation.mutate([item.id], {
            onSuccess: () => {
              if (detailItem?.id === item.id) setDetailItem(null);
            },
          });
        },
      });
    },
    [confirm, t, deleteMutation, detailItem]
  );
  const handleDeleteMany = useCallback(
    (ids: string[]) => {
      confirm({
        title: t('capPhatThuHoi.bulkDeleteTitle'),
        message: t('capPhatThuHoi.bulkDeleteMessage', { count: ids.length }),
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
    },
    [confirm, t, deleteMutation, detailItem, clearSelection]
  );

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <CapPhatThuHoiToolbar
          items={list}
          onAdd={handleAdd}
          onDeleteMany={handleDeleteMany}
          showAdd
        />
        <div className="flex-1 min-h-0 overflow-auto">
          <PhieuTable
            data={sortedList}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
      {detailItem && !showForm && (
        <PhieuDetail
          data={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={handleEdit}
          onDelete={(id) => {
            setDetailItem(null);
            deleteMutation.mutate([id]);
          }}
        />
      )}
      {showForm && (
        <TaoPhieuForm
          key={editingPhieu?.id ?? 'create'}
          onClose={() => {
            const wasFromDetail = openedFormFromDetailId != null;
            const itemToRestore = editingPhieu;
            setShowForm(false);
            setEditingPhieu(null);
            setOpenedFormFromDetailId(null);
            if (wasFromDetail && itemToRestore) {
              const fresh = sortedList.find((p) => p.id === itemToRestore.id) ?? itemToRestore;
              setDetailItem(fresh);
            }
          }}
          initialData={editingPhieu ?? undefined}
          onSuccessAfterEdit={handleSuccessAfterEdit}
        />
      )}
    </>
  );
};

export default CuaToiTab;
