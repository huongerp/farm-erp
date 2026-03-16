import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import BaoTriSuaChuaToolbar from './BaoTriSuaChuaToolbar';
import PhieuBaoTriTable from './PhieuBaoTriTable';
import PhieuBaoTriDetail from './PhieuBaoTriDetail';
import TaoPhieuBaoTriForm from './TaoPhieuBaoTriForm';
import { usePhieuBaoTriList, useDeletePhieuBaoTri } from '../hooks/use-bao-tri-sua-chua';
import { useBaoTriSuaChuaViewScope } from '../hooks/use-bao-tri-sua-chua-view-scope';
import { useAuthStore } from '../../../../store/useStore';
import { useTaiSanList } from '../../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import { useBaoTriSuaChuaStore } from '../store/useBaoTriSuaChuaStore';
import { getLanguage } from '../../../../lib/utils';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { PhieuBaoTriSuaChua } from '../core/types';

interface Props {
  /** Từ URL ?tai_san_id=... (vd: link từ chi tiết tài sản): lọc theo tài sản và mở form Thêm phiếu với tài sản mặc định */
  defaultTaiSanId?: string;
}

const TatCaTab: React.FC<Props> = ({ defaultTaiSanId }) => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const { searchTerm, filters, sort, resetState, selectedIds, clearSelection, setFilter } = useBaoTriSuaChuaStore();
  const user = useAuthStore((s) => s.user);
  const { viewAll } = useBaoTriSuaChuaViewScope();
  const { data: taiSanList = [] } = useTaiSanList();
  const { data: list = [], isLoading } = usePhieuBaoTriList({
    q: searchTerm || undefined,
    hang_muc: filters.hang_muc.length > 0 ? filters.hang_muc : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    id_tai_san: filters.id_tai_san.length > 0 ? filters.id_tai_san : undefined,
  });

  const viewableList = useMemo(() => {
    if (viewAll) return list;
    const myId = user?.id ?? '';
    const assetIdsHeldByUser = new Set(
      taiSanList.filter((a) => String(a.id_nhan_vien_dang_giu) === String(myId)).map((a) => a.id)
    );
    return list.filter(
      (p) => String(p.id_nguoi_tao) === String(myId) || assetIdsHeldByUser.has(p.id_tai_san)
    );
  }, [list, viewAll, user?.id, taiSanList]);

  const deleteMutation = useDeletePhieuBaoTri();
  const [detailItem, setDetailItem] = useState<PhieuBaoTriSuaChua | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPhieu, setEditingPhieu] = useState<PhieuBaoTriSuaChua | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);
  const [defaultAssetId, setDefaultAssetId] = useState<string | undefined>(defaultTaiSanId);

  useEffect(() => resetState, [resetState]);

  useEffect(() => {
    if (!defaultTaiSanId) return;
    setDefaultAssetId(defaultTaiSanId);
    setFilter('id_tai_san', [defaultTaiSanId]);
    setShowForm(true);
  }, [defaultTaiSanId, setFilter]);

  const filteredList = useMemo(() => {
    return viewableList.filter((p) => {
      if (filters.hang_muc.length > 0 && !filters.hang_muc.includes(p.id_hang_muc)) return false;
      if (filters.dateFrom && p.ngay < filters.dateFrom) return false;
      if (filters.dateTo && p.ngay > filters.dateTo) return false;
      if (filters.id_tai_san.length > 0 && !filters.id_tai_san.includes(p.id_tai_san)) return false;
      return true;
    });
  }, [viewableList, filters]);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a, b) => {
      const aVal = a[sort.column as keyof PhieuBaoTriSuaChua] ?? '';
      const bVal = b[sort.column as keyof PhieuBaoTriSuaChua] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleAdd = useCallback(() => {
    setEditingPhieu(null);
    setDefaultAssetId(undefined);
    setShowForm(true);
  }, []);
  const handleView = useCallback((item: PhieuBaoTriSuaChua) => {
    setDetailItem(item);
    setEditingPhieu(null);
    setShowForm(false);
  }, []);
  const handleEdit = useCallback((item: PhieuBaoTriSuaChua) => {
    if (detailItem?.id === item.id) setOpenedFormFromDetailId(item.id);
    else setOpenedFormFromDetailId(null);
    setDetailItem(null);
    setEditingPhieu(item);
    setShowForm(true);
  }, [detailItem?.id]);
  const handleSuccessAfterEdit = useCallback((item: PhieuBaoTriSuaChua) => {
    setShowForm(false);
    setEditingPhieu(null);
    setDetailItem(item);
  }, []);
  const handleDelete = useCallback(
    (item: PhieuBaoTriSuaChua) => {
      confirm({
        title: t('baoTriSuaChua.deleteTitle'),
        message: t('baoTriSuaChua.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: () => {
          deleteMutation.mutate([item.id], {
            onSuccess: () => { if (detailItem?.id === item.id) setDetailItem(null); },
          });
        },
      });
    },
    [confirm, t, deleteMutation, detailItem]
  );
  const handleDeleteMany = useCallback(
    (ids: string[]) => {
      confirm({
        title: t('baoTriSuaChua.bulkDeleteTitle'),
        message: t('baoTriSuaChua.bulkDeleteMessage', { count: ids.length }),
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
        <BaoTriSuaChuaToolbar items={list} onAdd={handleAdd} onDeleteMany={handleDeleteMany} showAdd={canCreate} canDelete={canDelete} />
        <div className="flex-1 min-h-0 overflow-auto">
          <PhieuBaoTriTable
            data={sortedList}
            isLoading={isLoading}
            onView={handleView}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
          />
        </div>
      </div>
      {detailItem && !showForm && (
        <PhieuBaoTriDetail
          data={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? (id) => {
            setDetailItem(null);
            deleteMutation.mutate([id]);
          } : undefined}
        />
      )}
      {showForm && (
        <TaoPhieuBaoTriForm
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
          defaultTaiSanId={defaultAssetId}
          initialData={editingPhieu ?? undefined}
          onSuccessAfterEdit={handleSuccessAfterEdit}
        />
      )}
    </>
  );
};

export default TatCaTab;
