import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import NoiLuuToolbar from './noi-luu-toolbar';
import NoiLuuTable from './noi-luu-table';
import NoiLuuForm from './noi-luu-form';
import NoiLuuDetail from './noi-luu-detail';
import {
  useAssetStorageLocations,
  useDeleteAssetStorageLocations,
  useUpdateAssetStorageLocationStatus,
} from '../hooks/use-noi-luu';
import { useNoiLuuStore } from '../store/useNoiLuuStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { getLanguage } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { AssetStorageLocation } from '../core/types';

export interface NoiLuuTabViewScope {
  viewAll: false;
  allowedBranchIds: string[];
}

interface NoiLuuTabProps {
  /** Khi được truyền từ module Nơi quản lý: lọc nơi lưu theo chi nhánh khi !viewAll. */
  viewScope?: NoiLuuTabViewScope;
}

const NoiLuuTab: React.FC<NoiLuuTabProps> = ({ viewScope }) => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
    pagination,
  } = useNoiLuuStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<AssetStorageLocation | null>(null);
  const [detailItem, setDetailItem] = useState<AssetStorageLocation | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const { data: list = [], isLoading } = useAssetStorageLocations();

  const viewableList = useMemo(() => {
    if (!viewScope || viewScope.viewAll) return list;
    const set = new Set(viewScope.allowedBranchIds);
    return list.filter((l) => set.has(l.id_chi_nhanh));
  }, [list, viewScope]);

  const deleteMutation = useDeleteAssetStorageLocations();
  const statusMutation = useUpdateAssetStorageLocationStatus();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const openId = searchParams.get('openId');
  useEffect(() => {
    if (!openId || viewableList.length === 0) return;
    const item = viewableList.find((l) => l.id === openId);
    if (item) setDetailItem(item);
    setSearchParams({}, { replace: true });
  }, [openId, viewableList, setSearchParams]);

  const filterFn = useCallback(
    (item: AssetStorageLocation, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ma_noi_luu.toLowerCase().includes(searchLower) ||
        item.ten_noi_luu.toLowerCase().includes(searchLower) ||
        (item.ten_chi_nhanh && item.ten_chi_nhanh.toLowerCase().includes(searchLower)) ||
        (item.ghi_chu && item.ghi_chu.toLowerCase().includes(searchLower));
      const statusKey = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      const matchesBranch = f.id_chi_nhanh.length === 0 || f.id_chi_nhanh.includes(item.id_chi_nhanh);
      return matchesSearch && matchesStatus && matchesBranch;
    },
    []
  );

  const filteredList = useListWithFilter(viewableList, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: AssetStorageLocation, b: AssetStorageLocation) => {
      const aVal = a[sort.column as keyof AssetStorageLocation] ?? '';
      const bVal = b[sort.column as keyof AssetStorageLocation] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const handleView = (item: AssetStorageLocation) => {
    setEditingItem(null);
    setShowForm(false);
    setDetailItem(item);
  };

  const handleEdit = (item: AssetStorageLocation) => {
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
      title: t('thietLapTaiSan.noiLuu.deleteTitle'),
      message: t('thietLapTaiSan.noiLuu.deleteMessage'),
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
      title: t('thietLapTaiSan.noiLuu.bulkDeleteTitle'),
      message: t('thietLapTaiSan.noiLuu.bulkDeleteMessage', { count: ids.length }),
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
      title: t('thietLapTaiSan.noiLuu.statusChangeTitle'),
      message: t('thietLapTaiSan.noiLuu.statusChangeMessage', { count: ids.length, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate(
          { ids, status },
          {
            onSuccess: () => {
              clearSelection();
              if (detailItem && ids.includes(detailItem.id)) {
                const next = viewableList.find((x) => x.id === detailItem.id);
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
      const fresh = viewableList.find((r) => r.id === editingId) ?? null;
      setDetailItem(fresh);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <NoiLuuToolbar
        items={viewableList}
        onAdd={() => {
          setDetailItem(null);
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onStatusChangeMany={handleStatusChangeMany}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0">
        <NoiLuuTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onView={handleView}
        />
      </div>

      <AnimatePresence>
        {showForm && <NoiLuuForm initialData={editingItem} onClose={handleCloseForm} />}
      </AnimatePresence>

      <AnimatePresence>
        {detailItem && !showForm && (
          <NoiLuuDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={canUpdate ? (item) => handleEdit(item) : undefined}
            onDelete={canDelete ? (id) => {
              setDetailItem(null);
              handleDelete(id);
            } : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NoiLuuTab;
