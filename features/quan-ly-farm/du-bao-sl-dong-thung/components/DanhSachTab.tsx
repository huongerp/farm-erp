import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import {
  useDuBaoSlDongThungList,
  useDuBaoSlDongThungById,
  useDeleteDuBaoSlDongThung,
  useDeleteDuBaoSlDongThungMany,
} from '../hooks/use-du-bao-sl-dong-thung';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useDuBaoSlDongThungStore, type DuBaoSlDongThungFilters } from '../store/useDuBaoSlDongThungStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { FarmDuBaoSlDongThung } from '../core/types';
import { getPreferredBranchFromUserLastRecords } from '../core/form-mappers';
import { canMutateDuBaoSlDongThung, canToggleTrangThaiDuBaoSlDongThung } from '../core/permissions';
import { useAuthStore } from '../../../../store/useStore';
import DuBaoSlDongThungToolbar from './DuBaoSlDongThungToolbar';
import DuBaoSlDongThungList from './DuBaoSlDongThungList';
import DuBaoSlDongThungForm from './DuBaoSlDongThungForm';
import DuBaoSlDongThungDetail from './DuBaoSlDongThungDetail';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    resetState,
    selectedIds,
    columns,
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
  } = useDuBaoSlDongThungStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FarmDuBaoSlDongThung | null>(null);
  const [viewingItem, setViewingItem] = useState<FarmDuBaoSlDongThung | null>(null);

  const { data: allList = [], isLoading } = useDuBaoSlDongThungList();
  const { data: branches = [] } = useBranches();
  const user = useAuthStore((s) => s.user);
  const preferredBranch = useMemo(
    () => getPreferredBranchFromUserLastRecords(allList, user?.id),
    [allList, user?.id]
  );
  const { data: viewingFull } = useDuBaoSlDongThungById(viewingItem?.id);
  const { data: editingFull } = useDuBaoSlDongThungById(editingItem?.id);
  const deleteMutation = useDeleteDuBaoSlDongThung();
  const deleteManyMutation = useDeleteDuBaoSlDongThungMany();

  const filterFn = useCallback((item: FarmDuBaoSlDongThung, term: string, f: DuBaoSlDongThungFilters) => {
    const q = term.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (item.ten_chi_nhanh?.toLowerCase().includes(q) ?? false) ||
      (item.ten_nguoi_tao?.toLowerCase().includes(q) ?? false) ||
      (item.ghi_chu?.toLowerCase().includes(q) ?? false) ||
      String(item.ngay).includes(q);
    const matchesBranch =
      (f.id_chi_nhanh?.length ?? 0) === 0 ||
      (item.id_chi_nhanh != null && (f.id_chi_nhanh ?? []).includes(item.id_chi_nhanh));
    const y = item.ngay?.slice(0, 4) ?? '';
    const ym = item.ngay?.slice(0, 7) ?? '';
    const matchesNam = (f.nam?.length ?? 0) === 0 || (f.nam ?? []).includes(y);
    const matchesThang = (f.thang?.length ?? 0) === 0 || (f.thang ?? []).includes(ym);
    return matchesSearch && matchesBranch && matchesNam && matchesThang;
  }, []);

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
    const fresh = allList.find((p) => p.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
    if (!fresh) setViewingItem(null);
  }, [allList, viewingItem]);

  const canEditRow = useCallback(
    (item: FarmDuBaoSlDongThung) => canMutateDuBaoSlDongThung(user, item, canUpdate),
    [user, canUpdate]
  );
  const canDeleteRow = useCallback(
    (item: FarmDuBaoSlDongThung) => canMutateDuBaoSlDongThung(user, item, canDelete),
    [user, canDelete]
  );

  const handleEdit = (item: FarmDuBaoSlDongThung) => {
    if (!canEditRow(item)) {
      toast.message(t('duBaoSlDongThung.toast.editNotAllowed'));
      return;
    }
    setEditingItem(item);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    const item = allList.find((r) => r.id === id);
    if (!item || !canDeleteRow(item)) {
      toast.message(t('duBaoSlDongThung.toast.deleteNotAllowed'));
      return;
    }
    confirm({
      title: t('duBaoSlDongThung.deleteTitle'),
      message: t('duBaoSlDongThung.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            if (viewingItem?.id === id) setViewingItem(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    const allowedIds = ids.filter((id) => {
      const item = allList.find((r) => r.id === id);
      return item && canDeleteRow(item);
    });
    if (allowedIds.length === 0) {
      toast.message(t('duBaoSlDongThung.toast.deleteManyNoneAllowed'));
      return;
    }
    const skippedCount = ids.length - allowedIds.length;
    confirm({
      title: t('duBaoSlDongThung.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: allowedIds.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        await deleteManyMutation.mutateAsync(allowedIds);
        if (skippedCount > 0) {
          toast.message(t('duBaoSlDongThung.toast.deleteManyPartial'));
        }
        clearSelection();
        if (viewingItem && allowedIds.includes(viewingItem.id)) setViewingItem(null);
      },
    });
  };

  const canBulkDeleteSelection = useMemo(() => {
    if (!canDelete) return false;
    if (selectedIds.size === 0) return true;
    return Array.from(selectedIds).some((id) => {
      const item = allList.find((r) => r.id === id);
      return item && canDeleteRow(item);
    });
  }, [canDelete, selectedIds, allList, canDeleteRow]);

  const viewedRow = viewingFull ?? viewingItem;
  const detailCanUpdate = useMemo(() => {
    if (!viewedRow) return false;
    return canMutateDuBaoSlDongThung(user, viewedRow, canUpdate);
  }, [viewedRow, user, canUpdate]);
  const detailCanDelete = useMemo(() => {
    if (!viewedRow) return false;
    return canMutateDuBaoSlDongThung(user, viewedRow, canDelete);
  }, [viewedRow, user, canDelete]);

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DuBaoSlDongThungToolbar
        data={filteredList}
        branches={branches}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={canBulkDeleteSelection ? handleDeleteMany : undefined}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <DuBaoSlDongThungList
          data={filteredList}
          columns={columns}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAllSelection={toggleAllSelection}
          isLoading={isLoading}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={setViewingItem}
          canEditRow={canEditRow}
          canDeleteRow={canDeleteRow}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <DuBaoSlDongThungForm
            branches={branches}
            initialData={editingFull ?? editingItem}
            preferredBranch={editingItem ? undefined : preferredBranch}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <DuBaoSlDongThungDetail
            data={viewingFull ?? viewingItem}
            onClose={() => setViewingItem(null)}
            onEdit={
              detailCanUpdate
                ? (item) => {
                    setViewingItem(null);
                    setEditingItem(item);
                    setShowForm(true);
                  }
                : undefined
            }
            onDelete={detailCanDelete ? handleDelete : undefined}
            canUpdate={detailCanUpdate}
            canDelete={detailCanDelete}
            canToggleTrangThai={canToggleTrangThaiDuBaoSlDongThung(user)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
