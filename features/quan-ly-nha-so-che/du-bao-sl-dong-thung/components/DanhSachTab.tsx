import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { DuBaoSlDongThungListServerQuery } from '../services/du-bao-sl-dong-thung-list-query';
import { fetchAllDuBaoSlDongThungForListQuery } from '../services/du-bao-sl-dong-thung-service';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';
import {
  useDuBaoSlDongThungPage,
  useDuBaoSlDongThungTomTat,
  useDuBaoSlDongThungById,
  useDeleteDuBaoSlDongThung,
  useDeleteDuBaoSlDongThungMany,
} from '../hooks/use-du-bao-sl-dong-thung';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useDuBaoSlDongThungStore } from '../store/useDuBaoSlDongThungStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '../../../../lib/button-labels';
import type { FarmDuBaoSlDongThung } from '../core/types';
import { getPreferredBranchFromUserLastRecords } from '../core/form-mappers';
import { useDuBaoSlDongThungPermissions } from '../hooks/use-du-bao-sl-dong-thung-permissions';
import { useUpdateDuBaoSlDongThungTrangThaiMany } from '../hooks/use-du-bao-sl-dong-thung';
import { TRANG_THAI_DU_BAO_SL_DONG_THUNG } from '../core/types';
import type { TrangThaiDuBaoSlDongThungPhieu } from '../core/types';
import { useAuthStore } from '../../../../store/useStore';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { useDuBaoSlDongThungViewScope } from '../hooks/use-du-bao-sl-dong-thung-view-scope';
import DuBaoSlDongThungToolbar from './DuBaoSlDongThungToolbar';
import DuBaoSlDongThungList from './DuBaoSlDongThungList';
import DuBaoSlDongThungForm from './DuBaoSlDongThungForm';
import DuBaoSlDongThungDetail from './DuBaoSlDongThungDetail';

import {
  mapFarmDuBaoSlDongThungListRow,
  getExportColumnsDuBaoSlDongThungList,
  exportFileNameDuBaoSlDongThungDanhSach,
} from '../utils/export-du-bao-sl-dong-thung-danh-sach';

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    canCreate,
    canDelete,
    canEditRow,
    canDeleteRow,
    canToggleTrangThai,
    canAdmin,
  } = useDuBaoSlDongThungPermissions();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    resetState,
    selectedIds,
    columns,
    resizeColumn,
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
    sort,
    setSort,
  } = useDuBaoSlDongThungStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FarmDuBaoSlDongThung | null>(null);
  const [viewingItem, setViewingItem] = useState<FarmDuBaoSlDongThung | null>(null);
  const [showExport, setShowExport] = useState(false);

  const viewScope = useDuBaoSlDongThungViewScope();

  /**
   * Bộ lọc gửi thẳng xuống PostgREST: màn này chỉ tải ĐÚNG một trang thay vì cả bảng.
   */
  const listServerQuery: DuBaoSlDongThungListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      viewAll: viewScope.viewAll,
      allowedBranchIds: viewScope.allowedBranchIds,
      nam: filters.nam ?? [],
      thang: filters.thang ?? [],
      trangThai: filters.trang_thai ?? [],
      idChiNhanh: filters.id_chi_nhanh ?? [],
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, viewScope.viewAll, viewScope.allowedBranchIds, filters, sort]
  );

  const pageQuery = useDuBaoSlDongThungPage(listServerQuery, !viewScope.isLoading);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  /** Bản tóm tắt toàn bộ: chip lọc + số đếm, gợi ý chi nhánh, chặn trùng ngày. */
  const { data: tomTatList = [] } = useDuBaoSlDongThungTomTat(
    viewScope.viewAll,
    viewScope.allowedBranchIds,
    !viewScope.isLoading
  );

  const { data: branches = [] } = useBranches();
  const user = useAuthStore((s) => s.user);
  const preferredBranch = useMemo(
    () => getPreferredBranchFromUserLastRecords(tomTatList, user?.id),
    [tomTatList, user?.id]
  );
  const { data: viewingFull } = useDuBaoSlDongThungById(viewingItem?.id);
  const { data: editingFull } = useDuBaoSlDongThungById(editingItem?.id);
  const deleteMutation = useDeleteDuBaoSlDongThung();
  const deleteManyMutation = useDeleteDuBaoSlDongThungMany();
  const trangThaiManyMutation = useUpdateDuBaoSlDongThungTrangThaiMany();

  const exportColumns = useMemo(() => getExportColumnsDuBaoSlDongThungList(t), [t]);
  const exportMapFn = useCallback(
    (item: FarmDuBaoSlDongThung) => mapFarmDuBaoSlDongThungListRow(item, t),
    [t]
  );
  /**
   * Xuất file cần TẤT CẢ bản ghi khớp bộ lọc, không chỉ trang đang xem — nên chỉ
   * tải khi người dùng thực sự mở hộp thoại Xuất.
   */
  const [exportRows, setExportRows] = useState<FarmDuBaoSlDongThung[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  useEffect(() => {
    if (!showExport) {
      setExportRows([]);
      setExportLoading(false);
      return;
    }
    let cancelled = false;
    setExportLoading(true);
    fetchAllDuBaoSlDongThungForListQuery(listServerQuery)
      .then((rows) => {
        if (!cancelled) setExportRows(rows);
      })
      .catch(() => {
        if (!cancelled) setExportRows([]);
      })
      .finally(() => {
        if (!cancelled) setExportLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showExport, listServerQuery]);

  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData({
      data: exportRows,
      isOpen: showExport && !exportLoading,
      mapFn: exportMapFn,
      pagination,
      selectedIds,
      keyExtractor: (item) => item.id,
    });

  const handleExport = useCallback(() => {
    if (totalCount === 0) {
      toast.warning(t('duBaoSlDongThung.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  // Xoá bớt bản ghi hoặc đổi bộ lọc làm tổng số giảm: lùi về trang cuối còn dữ liệu.
  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  useEffect(() => {
    if (!viewingItem) return;
    const fresh = pageList.find((p) => p.id === viewingItem.id);
    if (fresh && fresh !== viewingItem) setViewingItem(fresh);
    if (!fresh) setViewingItem(null);
  }, [pageList, viewingItem]);

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
    const item = pageList.find((r) => r.id === id);
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
      const item = pageList.find((r) => r.id === id);
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

  /**
   * Khóa / mở khóa hàng loạt. Chỉ chạy phiếu đang khác trạng thái đích — phiếu đã đúng trạng thái
   * bị bỏ qua để không ghi đè tg_cap_nhat vô ích.
   */
  const handleToggleTrangThaiMany = (trangThai: TrangThaiDuBaoSlDongThungPhieu) => {
    const ids = Array.from(selectedIds);
    const allowedIds = ids.filter((id) => {
      const item = pageList.find((r) => r.id === id);
      return item && item.trang_thai !== trangThai;
    });
    if (allowedIds.length === 0) {
      toast.message(t('duBaoSlDongThung.toast.trangThaiManyNoneAllowed'));
      return;
    }
    const skippedCount = ids.length - allowedIds.length;
    const isKhoa = trangThai === TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA;
    confirm({
      title: isKhoa ? t('duBaoSlDongThung.bulkLockTitle') : t('duBaoSlDongThung.bulkUnlockTitle'),
      message: isKhoa
        ? t('duBaoSlDongThung.bulkLockMessage', { count: allowedIds.length })
        : t('duBaoSlDongThung.bulkUnlockMessage', { count: allowedIds.length }),
      variant: isKhoa ? 'warning' : 'default',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await trangThaiManyMutation.mutateAsync({ ids: allowedIds, trang_thai: trangThai });
        if (skippedCount > 0) toast.message(t('duBaoSlDongThung.toast.trangThaiManyPartial'));
        clearSelection();
      },
    });
  };

  const bulkActions =
    selectedIds.size > 0 && canToggleTrangThai ? (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleToggleTrangThaiMany(TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA)}
          className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 transition-all active:scale-95"
        >
          <Lock size={14} className="stroke-[2.5px] shrink-0" />
          <span className="text-xs font-medium">{t('duBaoSlDongThung.bulkLockAction')}</span>
        </button>
        <button
          type="button"
          onClick={() => handleToggleTrangThaiMany(TRANG_THAI_DU_BAO_SL_DONG_THUNG.MO)}
          className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted transition-all active:scale-95"
        >
          <Unlock size={14} className="stroke-[2.5px] shrink-0" />
          <span className="text-xs font-medium">{t('duBaoSlDongThung.bulkUnlockAction')}</span>
        </button>
      </div>
    ) : null;

  const canBulkDeleteSelection = useMemo(() => {
    if (!canDelete) return false;
    if (selectedIds.size === 0) return true;
    return Array.from(selectedIds).some((id) => {
      const item = pageList.find((r) => r.id === id);
      return item && canDeleteRow(item);
    });
  }, [canDelete, selectedIds, pageList, canDeleteRow]);

  const viewedRow = viewingFull ?? viewingItem;
  const detailCanUpdate = viewedRow ? canEditRow(viewedRow) : false;
  const detailCanDelete = viewedRow ? canDeleteRow(viewedRow) : false;

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DuBaoSlDongThungToolbar
        data={tomTatList}
        branches={branches}
        selectedCount={selectedIds.size}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={canBulkDeleteSelection ? handleDeleteMany : undefined}
        bulkActions={bulkActions}
        onExport={handleExport}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
        <DuBaoSlDongThungList
          data={pageList}
          totalRecordsOverride={totalCount}
          isFetching={isFetching}
          sort={sort}
          onSort={setSort}
          columns={columns}
          onResizeColumn={resizeColumn}
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
            fileName={exportFileNameDuBaoSlDongThungDanhSach()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <DuBaoSlDongThungForm
            branches={branches}
            initialData={editingFull ?? editingItem}
            preferredBranch={editingItem ? undefined : preferredBranch}
            onClose={handleCloseForm}
            canAdmin={canAdmin}
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
            canToggleTrangThai={canToggleTrangThai}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DanhSachTab;
