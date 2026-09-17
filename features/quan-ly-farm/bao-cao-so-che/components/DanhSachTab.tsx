import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';
import {
  useBaoCaoSoCheList,
  useBaoCaoSoCheById,
  useDeleteBaoCaoSoChe,
  useDeleteBaoCaoSoCheMany,
} from '../hooks/use-bao-cao-so-che';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useBaoCaoSoCheStore, type BaoCaoSoCheFilters } from '../store/useBaoCaoSoCheStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '../../../../lib/button-labels';
import type { FarmBaoCaoSoChe } from '../core/types';
import { getPreferredBranchFromUserLastRecords } from '../core/form-mappers';
import { useBaoCaoSoChePermissions } from '../hooks/use-bao-cao-so-che-permissions';
import { useUpdateBaoCaoSoCheTrangThaiMany } from '../hooks/use-bao-cao-so-che';
import { TRANG_THAI_BAO_CAO_SO_CHE } from '../core/types';
import type { TrangThaiBaoCaoSoChePhieu } from '../core/types';
import { useAuthStore } from '../../../../store/useStore';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { useBaoCaoSoCheViewScope } from '../hooks/use-bao-cao-so-che-view-scope';
import BaoCaoSoCheToolbar from './BaoCaoSoCheToolbar';
import BaoCaoSoCheList from './BaoCaoSoCheList';
import BaoCaoSoCheForm from './BaoCaoSoCheForm';
import BaoCaoSoCheDetail from './BaoCaoSoCheDetail';
import {
  mapFarmBaoCaoSoCheListRow,
  getExportColumnsBaoCaoSoCheList,
  exportFileNameBaoCaoSoCheDanhSach,
} from '../utils/export-bao-cao-so-che-danh-sach';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    canCreate,
    canDelete,
    canEditRow,
    canDeleteRow,
    canToggleTrangThai,
    canCopyNextDay,
    canAdmin,
  } = useBaoCaoSoChePermissions();
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
  } = useBaoCaoSoCheStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FarmBaoCaoSoChe | null>(null);
  const [viewingItem, setViewingItem] = useState<FarmBaoCaoSoChe | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const { data: allList = [], isLoading } = useBaoCaoSoCheList();
  const viewScope = useBaoCaoSoCheViewScope();
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
  const { data: viewingFull } = useBaoCaoSoCheById(viewingItem?.id);
  const { data: editingFull } = useBaoCaoSoCheById(editingItem?.id);
  const deleteMutation = useDeleteBaoCaoSoChe();
  const deleteManyMutation = useDeleteBaoCaoSoCheMany();
  const trangThaiManyMutation = useUpdateBaoCaoSoCheTrangThaiMany();

  const filterFn = useCallback((item: FarmBaoCaoSoChe, term: string, f: BaoCaoSoCheFilters) => {
    const q = term.trim().toLowerCase();
    const kpiTextBlob = (item.kpi_thuong ?? [])
      .flatMap((k) => [
        k.ten_hang_muc,
        k.don_vi_tinh,
        k.muc_tieu,
        k.thuc_te,
        k.danh_gia,
        k.ghi_chu,
      ])
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesSearch =
      !q ||
      (item.ten_chi_nhanh?.toLowerCase().includes(q) ?? false) ||
      (item.ten_nguoi_tao?.toLowerCase().includes(q) ?? false) ||
      (item.ghi_chu?.toLowerCase().includes(q) ?? false) ||
      (item.don_vi_tinh?.toLowerCase().includes(q) ?? false) ||
      kpiTextBlob.includes(q) ||
      String(item.ngay).includes(q);
    const matchesBranch =
      (f.id_chi_nhanh?.length ?? 0) === 0 ||
      (item.id_chi_nhanh != null && (f.id_chi_nhanh ?? []).includes(item.id_chi_nhanh));
    const y = item.ngay?.slice(0, 4) ?? '';
    const ym = item.ngay?.slice(0, 7) ?? '';
    const matchesNam = (f.nam?.length ?? 0) === 0 || (f.nam ?? []).includes(y);
    const matchesThang = (f.thang?.length ?? 0) === 0 || (f.thang ?? []).includes(ym);
    const matchesTrangThai = (f.trang_thai?.length ?? 0) === 0 || (f.trang_thai ?? []).includes(item.trang_thai ?? '');
    const matchesDvt = (f.don_vi_tinh?.length ?? 0) === 0 || (f.don_vi_tinh ?? []).includes(item.don_vi_tinh ?? '');
    return matchesSearch && matchesBranch && matchesNam && matchesThang && matchesTrangThai && matchesDvt;
  }, []);

  const filteredList = useListWithFilter(scopedList, searchTerm, filters, filterFn);

  const exportColumns = useMemo(() => getExportColumnsBaoCaoSoCheList(t), [t]);
  const exportMapFn = useCallback(
    (item: FarmBaoCaoSoChe) => mapFarmBaoCaoSoCheListRow(item, t),
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
      toast.warning(t('baoCaoSoChe.noExportData'));
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

  const handleEdit = (item: FarmBaoCaoSoChe, fromDetail = false) => {
    if (!canEditRow(item)) {
      toast.message(t('baoCaoSoChe.toast.editNotAllowed'));
      return;
    }
    setOpenedFormFromDetailId(fromDetail ? item.id : null);
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
      toast.message(t('baoCaoSoChe.toast.deleteNotAllowed'));
      return;
    }
    confirm({
      title: t('baoCaoSoChe.deleteTitle'),
      message: t('baoCaoSoChe.deleteMessage'),
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
      toast.message(t('baoCaoSoChe.toast.deleteManyNoneAllowed'));
      return;
    }
    const skippedCount = ids.length - allowedIds.length;
    confirm({
      title: t('baoCaoSoChe.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: allowedIds.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        await deleteManyMutation.mutateAsync(allowedIds);
        if (skippedCount > 0) {
          toast.message(t('baoCaoSoChe.toast.deleteManyPartial'));
        }
        clearSelection();
        if (viewingItem && allowedIds.includes(viewingItem.id)) setViewingItem(null);
      },
    });
  };

  /**
   * Khóa / mở khóa hàng loạt. Chỉ chạy phiếu đang khác trạng thái đích — phiếu đã đúng trạng thái
   * bị bỏ qua để không ghi đè tg_cap_nhat vô ích.
   */
  const handleToggleTrangThaiMany = (trangThai: TrangThaiBaoCaoSoChePhieu) => {
    const ids = Array.from(selectedIds);
    const allowedIds = ids.filter((id) => {
      const item = allList.find((r) => r.id === id);
      return item && item.trang_thai !== trangThai;
    });
    if (allowedIds.length === 0) {
      toast.message(t('baoCaoSoChe.toast.trangThaiManyNoneAllowed'));
      return;
    }
    const skippedCount = ids.length - allowedIds.length;
    const isKhoa = trangThai === TRANG_THAI_BAO_CAO_SO_CHE.KHOA;
    confirm({
      title: isKhoa ? t('baoCaoSoChe.bulkLockTitle') : t('baoCaoSoChe.bulkUnlockTitle'),
      message: isKhoa
        ? t('baoCaoSoChe.bulkLockMessage', { count: allowedIds.length })
        : t('baoCaoSoChe.bulkUnlockMessage', { count: allowedIds.length }),
      variant: isKhoa ? 'warning' : 'default',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await trangThaiManyMutation.mutateAsync({ ids: allowedIds, trang_thai: trangThai });
        if (skippedCount > 0) toast.message(t('baoCaoSoChe.toast.trangThaiManyPartial'));
        clearSelection();
      },
    });
  };

  const bulkActions =
    selectedIds.size > 0 && canToggleTrangThai ? (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleToggleTrangThaiMany(TRANG_THAI_BAO_CAO_SO_CHE.KHOA)}
          className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 transition-all active:scale-95"
        >
          <Lock size={14} className="stroke-[2.5px] shrink-0" />
          <span className="text-xs font-medium">{t('baoCaoSoChe.bulkLockAction')}</span>
        </button>
        <button
          type="button"
          onClick={() => handleToggleTrangThaiMany(TRANG_THAI_BAO_CAO_SO_CHE.MO)}
          className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted transition-all active:scale-95"
        >
          <Unlock size={14} className="stroke-[2.5px] shrink-0" />
          <span className="text-xs font-medium">{t('baoCaoSoChe.bulkUnlockAction')}</span>
        </button>
      </div>
    ) : null;

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
  const detailCanCopyNextDay = viewedRow ? canCopyNextDay(viewedRow) : false;

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <BaoCaoSoCheToolbar
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
        bulkActions={bulkActions}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <BaoCaoSoCheList
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
            fileName={exportFileNameBaoCaoSoCheDanhSach()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <BaoCaoSoCheForm
            branches={branches}
            initialData={editingFull ?? editingItem}
            preferredBranch={editingItem ? undefined : preferredBranch}
            existingList={allList}
            onClose={handleCloseForm}
            canAdmin={canAdmin}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <BaoCaoSoCheDetail
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
