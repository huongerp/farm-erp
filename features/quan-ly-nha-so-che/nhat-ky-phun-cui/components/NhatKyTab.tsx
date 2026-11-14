/** Tab «Nhật ký»: danh sách phân trang ở server + form / chi tiết / xuất file. */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import type { EmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import type { NhatKyPhunCui } from '../core/types';
import type { NhatKyPhunCuiListServerQuery } from '../services/nhat-ky-phun-cui-list-query';
import { fetchAllNhatKyForListQuery } from '../services/nhat-ky-phun-cui-service';
import {
  useDeleteNhatKyPhunCui,
  useDeleteNhatKyPhunCuiMany,
  useNhatKyPhunCuiById,
  useNhatKyPhunCuiPage,
  useNhatKyPhunCuiTomTat,
} from '../hooks/use-nhat-ky-phun-cui';
import { useNhatKyPhunCuiStore } from '../store/useNhatKyPhunCuiStore';
import {
  exportFileNameNhatKyPhunCui,
  getExportColumnsNhatKyPhunCui,
  lamPhangNhatKy,
  mapDongXuatNhatKy,
  type DongXuatNhatKy,
} from '../utils/export-nhat-ky-phun-cui';
import NhatKyPhunCuiToolbar from './NhatKyPhunCuiToolbar';
import NhatKyPhunCuiList from './NhatKyPhunCuiList';
import NhatKyPhunCuiForm from './NhatKyPhunCuiForm';
import NhatKyPhunCuiDetail from './NhatKyPhunCuiDetail';

interface Props {
  viewScope: EmployeeBranchModuleScope;
  /** Chi nhánh đã lọc theo phạm vi xem. */
  branches: Branch[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const NhatKyTab: React.FC<Props> = ({ viewScope, branches, canCreate, canUpdate, canDelete }) => {
  const { t } = useTranslation();
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
  } = useNhatKyPhunCuiStore();

  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingItem, setEditingItem] = useState<NhatKyPhunCui | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const listServerQuery: NhatKyPhunCuiListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      searchTerm,
      viewAll: viewScope.viewAll,
      allowedBranchIds: viewScope.allowedBranchIds,
      thang: filters.thang ?? [],
      idChiNhanh: filters.id_chi_nhanh ?? [],
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, searchTerm, filters, sort, viewScope.viewAll, viewScope.allowedBranchIds]
  );

  const pageQuery = useNhatKyPhunCuiPage(listServerQuery, !viewScope.isLoading);
  const pageList = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  const { data: tomTatList = [] } = useNhatKyPhunCuiTomTat(viewScope.viewAll, viewScope.allowedBranchIds, !viewScope.isLoading);
  const { data: viewingFull } = useNhatKyPhunCuiById(viewingId ?? undefined);
  const viewingItem = viewingFull ?? pageList.find((p) => p.id === viewingId) ?? null;

  const deleteMutation = useDeleteNhatKyPhunCui();
  const deleteManyMutation = useDeleteNhatKyPhunCuiMany();

  /** Xuất file cần TẤT CẢ bản ghi khớp bộ lọc — chỉ tải khi mở hộp thoại Xuất. */
  const exportRequest = useMemo(() => (showExport ? { query: listServerQuery } : null), [showExport, listServerQuery]);
  const [exportResult, setExportResult] = useState<{
    request: { query: NhatKyPhunCuiListServerQuery };
    rows: DongXuatNhatKy[];
  } | null>(null);
  const exportLoading = exportRequest !== null && exportResult?.request !== exportRequest;
  const exportRows = useMemo(
    () => (exportRequest !== null && exportResult?.request === exportRequest ? exportResult.rows : []),
    [exportRequest, exportResult]
  );
  useEffect(() => {
    if (!exportRequest) return;
    let cancelled = false;
    fetchAllNhatKyForListQuery(exportRequest.query)
      .then((rows) => !cancelled && setExportResult({ request: exportRequest, rows: lamPhangNhatKy(rows) }))
      .catch(() => !cancelled && setExportResult({ request: exportRequest, rows: [] }));
    return () => {
      cancelled = true;
    };
  }, [exportRequest]);

  const exportColumns = useMemo(() => getExportColumnsNhatKyPhunCui(t), [t]);
  const { exportData, paginatedData, selectedData } = useExportData({
    data: exportRows,
    isOpen: showExport && !exportLoading,
    mapFn: mapDongXuatNhatKy,
    pagination,
    selectedIds,
    keyExtractor: (d) => d.nhatKy.id,
  });

  const handleExport = useCallback(() => {
    if (totalCount === 0) {
      toast.warning(t('nkpc.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  useEffect(() => () => resetState(), [resetState]);

  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, maxPage, setPage]);

  const openEdit = (item: NhatKyPhunCui) => {
    setEditingItem(item);
    setViewingId(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('nkpc.deleteTitle'),
      message: t('nkpc.deleteMessage'),
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
      title: t('nkpc.deleteTitle'),
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
    <div className="flex-1 min-h-0 flex flex-col relative">
      <div className="flex-1 min-h-0 flex flex-col md:rounded-xl md:border md:border-border md:bg-card md:shadow-sm overflow-hidden">
        <NhatKyPhunCuiToolbar
          data={tomTatList}
          branches={branches}
          selectedCount={selectedIds.size}
          onAdd={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          onDeleteMany={handleDeleteMany}
          onExport={handleExport}
          canCreate={canCreate}
          canDelete={canDelete}
        />
        <div className="flex-1 min-h-0 flex flex-col md:px-4 md:pb-4 pt-1">
          <NhatKyPhunCuiList
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
            onEdit={canUpdate ? openEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <NhatKyPhunCuiForm
            branches={branches}
            initialData={editingItem}
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
            fileName={exportFileNameNhatKyPhunCui()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && !showForm && (
          <NhatKyPhunCuiDetail
            data={viewingItem}
            onClose={() => setViewingId(null)}
            onEdit={canUpdate ? openEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NhatKyTab;
