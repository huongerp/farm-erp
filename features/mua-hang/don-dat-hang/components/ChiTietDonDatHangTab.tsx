import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ClipboardList } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import {
  useChiTietDonDatHangListPaged,
  useDonDatHangById,
  useDeleteDonDatHang,
  useUpdateDonDatHang,
} from '../hooks/use-don-dat-hang';
import { useDonDatHangViewScope } from '../hooks/use-don-dat-hang-view-scope';
import { buildDonDatHangListServerQuery, fetchAllChiTietDonDatHangForListQuery } from '../services/don-dat-hang-service';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { useDoiTacRefQuery, useEmployeesRefQuery, usePhieuDeXuatSoPhieuMinimalQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import { useChiTietDonDatHangStore } from '../store/useChiTietDonDatHangStore';
import type { ChiTietDonDatHangFlat, DonDatHang } from '../core/types';
import { TRANG_THAI_KEY } from '../core/constants';
import { donDatHangToFormValues } from '../core/don-dat-hang-to-form-values';
import ChiTietDonDatHangToolbar from './ChiTietDonDatHangToolbar';
import DonDatHangDetail from './DonDatHangDetail';
import DonDatHangForm from './DonDatHangForm';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import { getColumnCellStyle, getEffectiveColumnMinWidth } from '../../../../store/createGenericStore';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import ExportDialog from '../../../../components/shared/ExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import {
  mapChiTietDonDatHangFlatRow,
  getExportColumnsChiTietDonDatHang,
  exportFileNameDonDatHangChiTiet,
  CHI_TIET_EXPORT_SHEET_NAME,
} from '../utils/export-don-dat-hang-danh-sach';

const STATUS_VARIANTS: Record<string, string> = {
  'Nháp': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  'Chờ duyệt': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Đã gửi': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'Đã xác nhận': 'bg-primary/10 text-primary border-primary/20',
  'Đang giao': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  'Đã nhận đủ': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Đã đóng': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Hủy': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

function StatusBadge({ status, t }: { status: DonDatHang['trang_thai']; t: (k: string) => string }) {
  const key = TRANG_THAI_KEY[status];
  const label = t(`donDatHang.status.${key}`);
  const cls = STATUS_VARIANTS[status] ?? 'bg-muted text-muted-foreground border-border';
  return (
    <span className={cn('inline-flex whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>
      {label}
    </span>
  );
}

const ChiTietDonDatHangTab: React.FC = () => {
  const { t } = useTranslation();
  const { canUpdate, canDelete, canApprove, canAdmin } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: khoList = [] } = useKhoList();
  const { data: supplierList = [] } = useDoiTacRefQuery('nha_cung_cap');
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: phieuDeXuatList = [] } = usePhieuDeXuatSoPhieuMinimalQuery();
  const viewScope = useDonDatHangViewScope();

  const {
    searchTerm,
    filters,
    resetState,
    pagination,
    setPage,
    setPageSize,
    sort,
    setSort,
    columns,
    resetColumns,
  } = useChiTietDonDatHangStore(
    useShallow((s) => ({
      searchTerm: s.searchTerm,
      filters: s.filters,
      resetState: s.resetState,
      pagination: s.pagination,
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      sort: s.sort,
      setSort: s.setSort,
      columns: s.columns,
      resetColumns: s.resetColumns,
    }))
  );

  const emptySelectedIds = useMemo(() => new Set<string>(), []);
  const [showExport, setShowExport] = useState(false);
  const [exportRows, setExportRows] = useState<ChiTietDonDatHangFlat[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [viewingDonId, setViewingDonId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DonDatHang | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);

  const listServerQuery = useMemo(
    () =>
      buildDonDatHangListServerQuery({
        searchTerm,
        filters,
        viewScope,
        khoList,
      }),
    [searchTerm, filters, viewScope, khoList]
  );
  const listQueryKey = useMemo(() => stableListQueryKeyPart(listServerQuery), [listServerQuery]);
  const pageIndex = Math.max(0, pagination.page - 1);
  const pageQuery = useChiTietDonDatHangListPaged(pageIndex, listServerQuery);
  const tableRows = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = !pageQuery.data && pageQuery.isPending;
  const isFetchingOverlay = !!pageQuery.data && pageQuery.isFetching;

  const { data: viewingPoFull } = useDonDatHangById(viewingDonId ?? undefined);
  const { data: editingPoFull } = useDonDatHangById(editingItem?.id);
  const deleteMutation = useDeleteDonDatHang();
  const updateMutation = useUpdateDonDatHang();

  const sortedPageRows = useMemo(() => {
    if (!sort.column || !sort.direction) return tableRows;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...tableRows].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sort.column!];
      const bVal = (b as Record<string, unknown>)[sort.column!];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return dir;
      if (bVal == null) return -dir;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return cmp * dir;
    });
  }, [tableRows, sort.column, sort.direction]);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  useEffect(() => {
    setPage(1);
  }, [listQueryKey, setPage]);

  useEffect(() => {
    const hasCategoryColumns =
      columns.some((c) => c.id === 'ten_danh_muc_cap1') &&
      columns.some((c) => c.id === 'ten_danh_muc_cap2');
    if (!hasCategoryColumns) resetColumns();
  }, [columns, resetColumns]);

  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );
  const tableMinWidth = useMemo(
    () => visibleColumns.reduce((sum, col) => sum + (col.width ?? getEffectiveColumnMinWidth(col, 120)), 0),
    [visibleColumns]
  );

  const exportColumnsChiTiet = useMemo(() => getExportColumnsChiTietDonDatHang(t), [t]);
  const exportMapChiTiet = useCallback((row: ChiTietDonDatHangFlat) => mapChiTietDonDatHangFlatRow(row), []);
  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData({
      data: exportRows,
      isOpen: showExport && !exportLoading,
      mapFn: exportMapChiTiet,
      pagination,
      selectedIds: emptySelectedIds,
      keyExtractor: (row) => row.id,
    });

  useEffect(() => {
    if (!showExport) {
      setExportRows([]);
      setExportLoading(false);
      return;
    }
    let cancelled = false;
    setExportLoading(true);
    fetchAllChiTietDonDatHangForListQuery(listServerQuery)
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
  }, [showExport, listQueryKey, listServerQuery]);

  const handleExport = useCallback(() => {
    if (totalCount === 0) {
      toast.warning(t('donDatHang.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  const handleRowClick = useCallback((row: ChiTietDonDatHangFlat) => {
    setViewingDonId(row.id_don_dat_hang);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setViewingDonId(null);
  }, []);

  const handleEdit = useCallback((item: DonDatHang) => {
    setEditingItem(item);
    setViewingDonId(null);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    if (editingItem?.id === openedFormFromDetailId) setOpenedFormFromDetailId(null);
    setEditingItem(null);
  }, [editingItem?.id, openedFormFromDetailId]);

  const handleApprove = useCallback(
    (item: DonDatHang, payload: { trangThai: 'Đã xác nhận' | 'Hủy'; ghiChu?: string }) => {
      const full = viewingPoFull ?? item;
      const mergedGhiChu = payload.ghiChu
        ? (full.ghi_chu ? full.ghi_chu + '\n' : '') + `[Ghi chú phê duyệt]: ${payload.ghiChu}`
        : undefined;
      const data = donDatHangToFormValues(full, payload.trangThai, mergedGhiChu);
      updateMutation.mutate(
        { id: full.id, data },
        { onSuccess: () => setViewingDonId(null) }
      );
    },
    [updateMutation, viewingPoFull]
  );

  const handleChangeStatus = useCallback(
    (item: DonDatHang, payload: { trangThai: DonDatHang['trang_thai']; ghiChu?: string }) => {
      const full = viewingPoFull ?? item;
      const mergedGhiChu = payload.ghiChu
        ? (full.ghi_chu ? full.ghi_chu + '\n' : '') + `[Chuyển trạng thái]: ${payload.ghiChu}`
        : undefined;
      const data = donDatHangToFormValues(full, payload.trangThai, mergedGhiChu);
      updateMutation.mutate({ id: full.id, data });
    },
    [updateMutation, viewingPoFull]
  );

  const handleDelete = useCallback(
    (id: string) => {
      confirm({
        title: t('donDatHang.deleteTitle'),
        message: t('donDatHang.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: async () => {
          deleteMutation.mutate(id, {
            onSuccess: () => {
              if (viewingDonId === id) setViewingDonId(null);
            },
          });
        },
      });
    },
    [confirm, t, deleteMutation, viewingDonId]
  );

  const renderCell = (row: ChiTietDonDatHangFlat, col: ColumnConfig) => {
    switch (col.id) {
      case 'so_po':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span
              className="inline-block max-w-full truncate whitespace-nowrap font-mono text-xs font-medium text-primary cursor-pointer hover:underline"
              onClick={() => handleRowClick(row)}
              title={row.so_po}
            >
              {row.so_po}
            </span>
          </td>
        );
      case 'ngay_dat':
        return (
          <td key={col.id} className="px-4 py-3 whitespace-nowrap text-muted-foreground text-sm" style={getColumnCellStyle(col)}>
            {formatDateShort(row.ngay_dat)}
          </td>
        );
      case 'ten_nha_cung_cap':
        return (
          <td key={col.id} className="px-4 py-3 text-sm" style={getColumnCellStyle(col)}>
            <span className="block truncate whitespace-nowrap" title={row.ten_nha_cung_cap ?? ''}>
              {row.ten_nha_cung_cap ?? '—'}
            </span>
          </td>
        );
      case 'ten_kho_nhan':
        return (
          <td key={col.id} className="px-4 py-3 text-sm text-muted-foreground" style={getColumnCellStyle(col)}>
            <span className="block truncate whitespace-nowrap" title={row.ten_kho_nhan ?? ''}>
              {row.ten_kho_nhan ?? '—'}
            </span>
          </td>
        );
      case 'ten_danh_muc_cap1':
      case 'ten_danh_muc_cap2':
        return (
          <td key={col.id} className="px-4 py-3 text-sm text-muted-foreground" style={getColumnCellStyle(col)}>
            <span
              className="block truncate whitespace-nowrap"
              title={row[col.id as 'ten_danh_muc_cap1' | 'ten_danh_muc_cap2'] ?? ''}
            >
              {row[col.id as 'ten_danh_muc_cap1' | 'ten_danh_muc_cap2'] ?? '—'}
            </span>
          </td>
        );
      case 'ma_hang':
        return (
          <td key={col.id} className="px-4 py-3 font-mono text-xs" style={getColumnCellStyle(col)}>
            <span className="block truncate whitespace-nowrap" title={row.ma_hang ?? ''}>
              {row.ma_hang ?? '—'}
            </span>
          </td>
        );
      case 'ten_hang':
        return (
          <td key={col.id} className="px-4 py-3 text-sm" style={getColumnCellStyle(col)}>
            <span className="block truncate whitespace-nowrap" title={row.ten_hang ?? ''}>
              {row.ten_hang ?? '—'}
            </span>
          </td>
        );
      case 'so_luong':
        return (
          <td key={col.id} className="px-4 py-3 whitespace-nowrap tabular-nums text-sm" style={getColumnCellStyle(col)}>
            {formatNumberVN(row.so_luong)}
          </td>
        );
      case 'don_gia':
        return (
          <td key={col.id} className="px-4 py-3 whitespace-nowrap tabular-nums text-sm text-muted-foreground" style={getColumnCellStyle(col)}>
            {formatNumberVN(row.don_gia)}
          </td>
        );
      case 'thanh_tien':
        return (
          <td key={col.id} className="px-4 py-3 whitespace-nowrap tabular-nums text-sm" style={getColumnCellStyle(col)}>
            {formatNumberVN(row.thanh_tien)}
          </td>
        );
      case 'don_vi_tinh':
        return (
          <td key={col.id} className="px-4 py-3 text-xs text-muted-foreground" style={getColumnCellStyle(col)}>
            <span className="block truncate whitespace-nowrap" title={row.don_vi_tinh ?? ''}>
              {row.don_vi_tinh ?? '—'}
            </span>
          </td>
        );
      case 'trang_thai':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <StatusBadge status={row.trang_thai} t={t} />
          </td>
        );
      case 'ten_nguoi_dat':
        return (
          <td key={col.id} className="px-4 py-3 text-sm text-muted-foreground" style={getColumnCellStyle(col)}>
            <span className="block truncate whitespace-nowrap" title={row.ten_nguoi_dat ?? ''}>
              {row.ten_nguoi_dat ?? '—'}
            </span>
          </td>
        );
      case 'ghi_chu':
        return (
          <td
            key={col.id}
            className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate"
            style={getColumnCellStyle(col)}
            title={row.ghi_chu ?? ''}
          >
            {row.ghi_chu ?? '—'}
          </td>
        );
      default:
        return (
          <td key={col.id} className="px-4 py-3 text-sm" style={getColumnCellStyle(col)}>
            —
          </td>
        );
    }
  };

  if (isLoading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <ChiTietDonDatHangToolbar
        data={tableRows}
        chipCountsMode="unweighted"
        supplierList={supplierList}
        khoList={khoList}
        employees={employees}
        onExport={handleExport}
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        {isFetchingOverlay ? (
          <div
            className="absolute inset-0 z-[25] pointer-events-none flex items-start justify-center pt-3 bg-background/30 backdrop-blur-[1px]"
            aria-busy="true"
            aria-live="polite"
          >
            <div
              className="h-6 w-6 rounded-full border-2 border-primary/35 border-t-primary animate-spin shadow-sm"
              aria-hidden
            />
          </div>
        ) : null}
        {totalCount === 0 ? (
          <EmptyState
            icon={<ClipboardList size={48} className="text-muted-foreground/50" />}
            title={t('donDatHang.chiTietTab.empty')}
            description={t('donDatHang.chiTietTab.emptyHint')}
          />
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full border-collapse" style={{ minWidth: tableMinWidth }}>
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur border-b border-border">
                  <tr>
                    {visibleColumns.map((col) => (
                      <th
                        key={col.id}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-muted/80"
                        style={getColumnCellStyle(col)}
                        onClick={() => setSort(col.id, sort.column === col.id && sort.direction === 'asc' ? 'desc' : 'asc')}
                      >
                        {col.label}
                        {sort.column === col.id && (sort.direction === 'asc' ? ' ↑' : ' ↓')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPageRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(row)}
                    >
                      {visibleColumns.map((col) => renderCell(row, col))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <TablePaginationFooter
              totalRecords={totalCount}
              page={pagination.page}
              pageSize={pagination.pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              recordsLabel={t('donDatHang.footerRecords')}
            />
          </>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <DonDatHangForm
            supplierList={supplierList}
            khoList={khoList}
            employees={employees}
            phieuDeXuatList={phieuDeXuatList}
            initialData={editingPoFull ?? editingItem}
            onClose={handleCloseForm}
          />
        )}
      </AnimatePresence>

      {viewingPoFull && !showForm && (
        <DonDatHangDetail
          data={viewingPoFull}
          onClose={handleCloseDetail}
          onEdit={
            canUpdate
              ? (item) => {
                  setOpenedFormFromDetailId(item.id);
                  setViewingDonId(null);
                  setEditingItem(item);
                  setShowForm(true);
                }
              : undefined
          }
          onDelete={canDelete ? handleDelete : undefined}
          onApprove={canApprove ? handleApprove : undefined}
          onChangeStatus={canAdmin ? handleChangeStatus : undefined}
        />
      )}

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            key={`ddh-ct-export-${listQueryKey}`}
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumnsChiTiet}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={exportFileNameDonDatHangChiTiet()}
            sheetName={CHI_TIET_EXPORT_SHEET_NAME}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChiTietDonDatHangTab;
