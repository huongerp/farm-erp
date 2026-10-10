/** Quản lý nhà sơ chế > Phiếu > Đăng ký tham quan farm. */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import ExportDialog from '../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../lib/useExportData';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { useAuthStore } from '../../../store/useStore';
import { useBranches } from '../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { coTheSuaPhieu, coTheXoaPhieu } from '../dang-ky-nhan-hang/core/trang-thai';
import { chiNhanhGanNhatCuaToi } from '../dang-ky-nhan-hang/core/goi-y';
import type { DangKyThamQuan } from './core/types';
import { ID_PHIEU_TRANG, taoUrlPreview } from './core/mau-in';
import type { DangKyThamQuanListServerQuery } from './services/dang-ky-tham-quan-list-query';
import { fetchAllDkTqForListQuery } from './services/dang-ky-tham-quan-service';
import {
  useDangKyThamQuanById,
  useDangKyThamQuanPage,
  useDangKyThamQuanTomTat,
  useDeleteDangKyThamQuan,
  useDeleteDangKyThamQuanMany,
} from './hooks/use-dang-ky-tham-quan';
import { useDangKyThamQuanCapCao, useDangKyThamQuanViewScope } from './hooks/use-dang-ky-tham-quan-view-scope';
import { useDangKyThamQuanStore } from './store/useDangKyThamQuanStore';
import {
  exportFileNameDangKyThamQuan,
  getExportColumnsDangKyThamQuan,
  mapDangKyThamQuanRow,
} from './utils/export-dang-ky-tham-quan';
import DangKyThamQuanToolbar from './components/DangKyThamQuanToolbar';
import DangKyThamQuanList from './components/DangKyThamQuanList';
import DangKyThamQuanForm from './components/DangKyThamQuanForm';
import DangKyThamQuanDetail from './components/DangKyThamQuanDetail';
import CheckInOutDialog from './components/CheckInOutDialog';

const DangKyThamQuanPage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const capCao = useDangKyThamQuanCapCao();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
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
  } = useDangKyThamQuanStore();

  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingItem, setEditingItem] = useState<DangKyThamQuan | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [quick, setQuick] = useState<{ item: DangKyThamQuan; mode: 'checkIn' | 'checkOut' } | null>(null);

  const viewScope = useDangKyThamQuanViewScope();

  const listServerQuery: DangKyThamQuanListServerQuery = useMemo(
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
      mucDich: filters.muc_dich ?? [],
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, viewScope.viewAll, viewScope.allowedBranchIds]
  );

  const pageQuery = useDangKyThamQuanPage(listServerQuery, !viewScope.isLoading);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  const { data: tomTatList = [] } = useDangKyThamQuanTomTat(viewScope.viewAll, viewScope.allowedBranchIds, !viewScope.isLoading);
  const { data: branches = [] } = useBranches();
  const { data: viewingFull } = useDangKyThamQuanById(viewingId ?? undefined);
  const viewingItem = viewingFull ?? pageList.find((p) => p.id === viewingId) ?? null;

  const deleteMutation = useDeleteDangKyThamQuan();
  const deleteManyMutation = useDeleteDangKyThamQuanMany();

  const preferredBranchId = useMemo(
    () => chiNhanhGanNhatCuaToi(tomTatList, user?.id != null ? String(user.id) : null),
    [tomTatList, user?.id]
  );

  /** Xuất file cần TẤT CẢ bản ghi khớp bộ lọc — chỉ tải khi mở hộp thoại Xuất. */
  const exportRequest = useMemo(() => (showExport ? { query: listServerQuery } : null), [showExport, listServerQuery]);
  const [exportResult, setExportResult] = useState<{
    request: { query: DangKyThamQuanListServerQuery };
    rows: DangKyThamQuan[];
  } | null>(null);
  const exportLoading = exportRequest !== null && exportResult?.request !== exportRequest;
  const exportRows = useMemo(
    () => (exportRequest !== null && exportResult?.request === exportRequest ? exportResult.rows : []),
    [exportRequest, exportResult]
  );
  useEffect(() => {
    if (!exportRequest) return;
    let cancelled = false;
    fetchAllDkTqForListQuery(exportRequest.query)
      .then((rows) => !cancelled && setExportResult({ request: exportRequest, rows }))
      .catch(() => !cancelled && setExportResult({ request: exportRequest, rows: [] }));
    return () => {
      cancelled = true;
    };
  }, [exportRequest]);

  const exportColumns = useMemo(() => getExportColumnsDangKyThamQuan(t), [t]);
  const exportMap = useCallback((item: DangKyThamQuan) => mapDangKyThamQuanRow(item), []);
  const { exportData, paginatedData, selectedData } = useExportData({
    data: exportRows,
    isOpen: showExport && !exportLoading,
    mapFn: exportMap,
    pagination,
    selectedIds,
    keyExtractor: (p) => p.id,
  });

  const handleExport = useCallback(() => {
    if (totalCount === 0) {
      toast.warning(t('dangKyThamQuan.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  useEffect(() => () => resetState(), [resetState]);

  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, maxPage, setPage]);

  const openEdit = (item: DangKyThamQuan) => {
    setEditingItem(item);
    setViewingId(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('dangKyThamQuan.deleteTitle'),
      message: t('dangKyThamQuan.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        await deleteMutation.mutateAsync(id);
        if (viewingId === id) setViewingId(null);
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('dangKyThamQuan.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        await deleteManyMutation.mutateAsync(ids);
        clearSelection();
        if (viewingId && ids.includes(viewingId)) setViewingId(null);
      },
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <DangKyThamQuanToolbar
          data={tomTatList}
          branches={branches}
          selectedCount={selectedIds.size}
          onAdd={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          onDeleteMany={handleDeleteMany}
          onExport={handleExport}
          onInPhieuTrang={() => window.open(taoUrlPreview(ID_PHIEU_TRANG), '_blank', 'noopener,noreferrer')}
          canCreate={canCreate}
          canDelete={canDelete}
        />
        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
          <DangKyThamQuanList
            data={pageList}
            totalRecordsOverride={totalCount}
            isFetching={isFetching}
            columns={columns}
            onResizeColumn={resizeColumn}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onToggleAllSelection={toggleAllSelection}
            isLoading={isLoading || viewScope.isLoading}
            page={pagination.page}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            sort={sort}
            onSort={setSort}
            onView={(item) => setViewingId(item.id)}
            onEdit={
              canUpdate
                ? (item) => (coTheSuaPhieu(item.trang_thai, capCao) ? openEdit(item) : toast.info(t('dangKyThamQuan.khongSuaDuoc')))
                : undefined
            }
            onDelete={
              canDelete
                ? (id) => {
                    const item = pageList.find((p) => p.id === id);
                    if (item && !coTheXoaPhieu(item.trang_thai, capCao)) toast.info(t('dangKyThamQuan.khongXoaDuoc'));
                    else handleDelete(id);
                  }
                : undefined
            }
            onQuickAction={canUpdate ? (item, mode) => setQuick({ item, mode }) : undefined}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <DangKyThamQuanForm
            branches={branches}
            initialData={editingItem}
            preferredBranchId={editingItem ? null : preferredBranchId}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumns}
            data={exportData}
            paginatedData={paginatedData}
            selectedData={selectedData}
            fileName={exportFileNameDangKyThamQuan()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <DangKyThamQuanDetail
            data={viewingItem}
            onClose={() => setViewingId(null)}
            onEdit={canUpdate ? openEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quick && <CheckInOutDialog mode={quick.mode} data={quick.item} onClose={() => setQuick(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default DangKyThamQuanPage;
