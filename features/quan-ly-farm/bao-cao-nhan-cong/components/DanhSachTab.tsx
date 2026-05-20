import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import {
  useBaoCaoNhanCongList,
  useBaoCaoNhanCongById,
  useDeleteBaoCaoNhanCong,
  useDeleteBaoCaoNhanCongMany,
} from '../hooks/use-bao-cao-nhan-cong';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useBaoCaoNhanCongStore, type BaoCaoNhanCongFilters } from '../store/useBaoCaoNhanCongStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import type { FarmBaoCaoNhanCong } from '../core/types';
import { getPreferredBranchFromUserLastRecords } from '../core/form-mappers';
import { useBaoCaoNhanCongPermissions } from '../hooks/use-bao-cao-nhan-cong-permissions';
import { useAuthStore } from '../../../../store/useStore';
import ExportDialog from '../../../../components/shared/ExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { useBaoCaoNhanCongViewScope } from '../hooks/use-bao-cao-nhan-cong-view-scope';
import BaoCaoNhanCongToolbar from './BaoCaoNhanCongToolbar';
import BaoCaoNhanCongList from './BaoCaoNhanCongList';
import BaoCaoNhanCongForm from './BaoCaoNhanCongForm';
import BaoCaoNhanCongDetail from './BaoCaoNhanCongDetail';
import {
  mapFarmBaoCaoNhanCongListRow,
  getExportColumnsBaoCaoNhanCongList,
  exportFileNameBaoCaoNhanCongDanhSach,
} from '../utils/export-bao-cao-nhan-cong-danh-sach';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    canCreate,
    canDelete,
    canEditRow,
    canDeleteRow,
    canToggleTrangThai,
    canCopyNextDay,
  } = useBaoCaoNhanCongPermissions();
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
  } = useBaoCaoNhanCongStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FarmBaoCaoNhanCong | null>(null);
  const [viewingItem, setViewingItem] = useState<FarmBaoCaoNhanCong | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const { data: allList = [], isLoading } = useBaoCaoNhanCongList();
  const viewScope = useBaoCaoNhanCongViewScope();
  const scopedList = useMemo(() => {
    if (viewScope.isLoading || viewScope.viewAll) return allList;
    return allList.filter((item) => viewScope.allowedBranchIds.includes(item.id_chi_nhanh ?? ''));
  }, [allList, viewScope]);
  const { data: branches = [] } = useBranches();
  const user = useAuthStore((s) => s.user);
  const preferredBranch = useMemo(
    () => getPreferredBranchFromUserLastRecords(allList, user?.id),
    [allList, user?.id]
  );
  const { data: viewingFull } = useBaoCaoNhanCongById(viewingItem?.id);
  const { data: editingFull } = useBaoCaoNhanCongById(editingItem?.id);
  const deleteMutation = useDeleteBaoCaoNhanCong();
  const deleteManyMutation = useDeleteBaoCaoNhanCongMany();

  const filterFn = useCallback((item: FarmBaoCaoNhanCong, term: string, f: BaoCaoNhanCongFilters) => {
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
    const matchesTrangThai = (f.trang_thai?.length ?? 0) === 0 || (f.trang_thai ?? []).includes(item.trang_thai ?? '');
    return matchesSearch && matchesBranch && matchesNam && matchesThang && matchesTrangThai;
  }, []);

  const filteredList = useListWithFilter(scopedList, searchTerm, filters, filterFn);

  const exportColumns = useMemo(() => getExportColumnsBaoCaoNhanCongList(t), [t]);
  const exportMapFn = useCallback(
    (item: FarmBaoCaoNhanCong) => mapFarmBaoCaoNhanCongListRow(item, t),
    [t]
  );
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData({
      data: filteredList,
      isOpen: showExport,
      mapFn: exportMapFn,
      pagination,
      selectedIds,
      keyExtractor: (item) => item.id,
    });

  const handleExport = useCallback(() => {
    if (filteredList.length === 0) {
      toast.warning(t('baoCaoNhanCong.noExportData'));
      return;
    }
    setShowExport(true);
  }, [filteredList.length, t]);

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

  const handleEdit = (item: FarmBaoCaoNhanCong, fromDetail = false) => {
    if (!canEditRow(item)) {
      toast.message(t('baoCaoNhanCong.toast.editNotAllowed'));
      return;
    }
    if (fromDetail) {
      setOpenedFormFromDetailId(item.id);
    } else {
      setOpenedFormFromDetailId(null);
    }
    setEditingItem(item);
    setViewingItem(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    const wasFromDetail = openedFormFromDetailId != null;
    const detailId = openedFormFromDetailId;
    setShowForm(false);
    setEditingItem(null);
    setOpenedFormFromDetailId(null);
    if (wasFromDetail && detailId) {
      const fresh = allList.find((r) => r.id === detailId) ?? null;
      setViewingItem(fresh);
    }
  };

  const handleDelete = (id: string) => {
    const item = allList.find((r) => r.id === id);
    if (!item || !canDeleteRow(item)) {
      toast.message(t('baoCaoNhanCong.toast.deleteNotAllowed'));
      return;
    }
    confirm({
      title: t('baoCaoNhanCong.deleteTitle'),
      message: t('baoCaoNhanCong.deleteMessage'),
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
      toast.message(t('baoCaoNhanCong.toast.deleteManyNoneAllowed'));
      return;
    }
    const skippedCount = ids.length - allowedIds.length;
    confirm({
      title: t('baoCaoNhanCong.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: allowedIds.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        await deleteManyMutation.mutateAsync(allowedIds);
        if (skippedCount > 0) {
          toast.message(t('baoCaoNhanCong.toast.deleteManyPartial'));
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
  const detailCanUpdate = viewedRow ? canEditRow(viewedRow) : false;
  const detailCanDelete = viewedRow ? canDeleteRow(viewedRow) : false;
  const detailCanCopyNextDay = canCopyNextDay();

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <BaoCaoNhanCongToolbar
        data={filteredList}
        branches={branches}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setOpenedFormFromDetailId(null);
          setShowForm(true);
        }}
        onDeleteMany={canBulkDeleteSelection ? handleDeleteMany : undefined}
        onExport={handleExport}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <BaoCaoNhanCongList
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
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumns}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={exportFileNameBaoCaoNhanCongDanhSach()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <BaoCaoNhanCongForm
            branches={branches}
            initialData={editingFull ?? editingItem}
            preferredBranch={editingItem ? undefined : preferredBranch}
            existingList={allList}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <BaoCaoNhanCongDetail
            data={viewingFull ?? viewingItem}
            existingList={allList}
            onClose={() => setViewingItem(null)}
            onEdit={detailCanUpdate ? (item) => handleEdit(item, true) : undefined}
            onDelete={detailCanDelete ? handleDelete : undefined}
            onAfterCopyToNextDay={
              canCreate
                ? (newItem) => {
                    setViewingItem(null);
                    setEditingItem(newItem);
                    setShowForm(true);
                  }
                : undefined
            }
            canCreate={canCreate}
            canUpdate={detailCanUpdate}
            canDelete={detailCanDelete}
            canCopyNextDay={detailCanCopyNextDay}
            canToggleTrangThai={canToggleTrangThai}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
