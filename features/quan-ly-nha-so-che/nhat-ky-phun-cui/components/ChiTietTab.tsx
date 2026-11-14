/** Tab Chi tiết: liệt kê phẳng từng lần pha thuốc của mọi nhật ký — chỉ xem, lọc, xuất; bấm dòng mở phiếu cha (chỉ xem). */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import GenericTable from '../../../../components/shared/GenericTable';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { cn, formatYmdToDisplay } from '../../../../lib/utils';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { donViLuongThuoc } from '../core/constants';
import { formatSo } from '../core/so';
import type { NhatKyPhunCuiLanRow } from '../core/types';
import {
  useNhatKyPhunCuiById,
  useNhatKyPhunCuiChiTietPage,
  useNhatKyPhunCuiTomTat,
} from '../hooks/use-nhat-ky-phun-cui';
import type { useNhatKyPhunCuiViewScope } from '../hooks/use-nhat-ky-phun-cui-view-scope';
import type { NkpcChiTietListServerQuery } from '../services/nhat-ky-phun-cui-list-query';
import { fetchAllNkpcChiTietForListQuery } from '../services/nhat-ky-phun-cui-service';
import { useNhatKyPhunCuiChiTietStore } from '../store/useNhatKyPhunCuiChiTietStore';
import {
  exportFileNameNhatKyPhunCuiChiTiet,
  getExportColumnsNhatKyPhunCuiChiTiet,
  mapNhatKyPhunCuiChiTietRow,
} from '../utils/export-nhat-ky-phun-cui-chi-tiet';
import NhatKyPhunCuiDetail from './NhatKyPhunCuiDetail';
import ChiTietTabToolbar from './ChiTietTabToolbar';
import ChiTietCard from './ChiTietCard';

interface Props {
  viewScope: ReturnType<typeof useNhatKyPhunCuiViewScope>;
  branches: Branch[];
}

const ChiTietTab: React.FC<Props> = ({ viewScope, branches }) => {
  const { t } = useTranslation();
  const { viewAll, allowedBranchIds, isLoading: scopeLoading } = viewScope;
  const {
    filters,
    columns,
    resizeColumn,
    pagination,
    setPage,
    setPageSize,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    sort,
    setSort,
    resetState,
  } = useNhatKyPhunCuiChiTietStore();
  const [showExport, setShowExport] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const { data: tomTat = [] } = useNhatKyPhunCuiTomTat(viewAll, allowedBranchIds, !scopeLoading);
  const { data: viewingItem } = useNhatKyPhunCuiById(viewingId ?? undefined);

  const listServerQuery: NkpcChiTietListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      viewAll,
      allowedBranchIds,
      thang: filters.thang ?? [],
      idChiNhanh: filters.id_chi_nhanh ?? [],
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, filters, sort, viewAll, allowedBranchIds]
  );

  const pageQuery = useNhatKyPhunCuiChiTietPage(listServerQuery, !scopeLoading);
  const rows = pageQuery.data?.data ?? [];
  const totalCount = pageQuery.data?.totalCount ?? 0;
  const isLoading = (!pageQuery.data && pageQuery.isPending) || scopeLoading;
  const isFetching = !!pageQuery.data && pageQuery.isFetching;

  useEffect(() => () => resetState(), [resetState]);

  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, maxPage, setPage]);

  /** Xuất file cần TẤT CẢ dòng khớp bộ lọc — chỉ tải khi mở hộp thoại Xuất. */
  const exportRequest = useMemo(() => (showExport ? { query: listServerQuery } : null), [showExport, listServerQuery]);
  const [exportResult, setExportResult] = useState<{
    request: { query: NkpcChiTietListServerQuery };
    rows: NhatKyPhunCuiLanRow[];
  } | null>(null);
  const exportLoading = exportRequest !== null && exportResult?.request !== exportRequest;
  const exportRows = useMemo(
    () => (exportRequest !== null && exportResult?.request === exportRequest ? exportResult.rows : []),
    [exportRequest, exportResult]
  );
  useEffect(() => {
    if (!exportRequest) return;
    let cancelled = false;
    fetchAllNkpcChiTietForListQuery(exportRequest.query)
      .then((r) => !cancelled && setExportResult({ request: exportRequest, rows: r }))
      .catch(() => !cancelled && setExportResult({ request: exportRequest, rows: [] }));
    return () => {
      cancelled = true;
    };
  }, [exportRequest]);

  const exportColumns = useMemo(() => getExportColumnsNhatKyPhunCuiChiTiet(t), [t]);
  const sttTheoId = useMemo(() => new Map(exportRows.map((r, i) => [r.id, i + 1])), [exportRows]);
  const exportMap = useCallback(
    (item: NhatKyPhunCuiLanRow) => mapNhatKyPhunCuiChiTietRow(item, sttTheoId.get(item.id) ?? 0),
    [sttTheoId]
  );
  const { exportData, paginatedData, selectedData } = useExportData({
    data: exportRows,
    isOpen: showExport && !exportLoading,
    mapFn: exportMap,
    pagination,
    selectedIds,
    keyExtractor: (r) => r.id,
  });

  const handleExport = useCallback(() => {
    if (totalCount === 0) {
      toast.warning(t('nkpc.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  const visibleColumns = useMemo(() => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order), [columns]);
  const handleView = useCallback((item: NhatKyPhunCuiLanRow) => setViewingId(item.id_nhat_ky), []);

  const renderCell = (colId: string, item: NhatKyPhunCuiLanRow) => {
    const one = (text: React.ReactNode, className?: string) => (
      <span className={cn('block truncate whitespace-nowrap text-sm', className)}>{text}</span>
    );
    switch (colId) {
      case 'ngay':
        return one(formatYmdToDisplay(item.ngay), 'tabular-nums font-medium');
      case 'ten_chi_nhanh':
        return one(item.ten_chi_nhanh || '—');
      case 'thu_tu':
        return one(item.thu_tu, 'tabular-nums text-center');
      case 'gio':
        return one(item.gio ?? '—', 'tabular-nums text-center');
      case 'ten_hang_hoa':
        return one([item.ma_hang_hoa, item.ten_hang_hoa].filter(Boolean).join(' · ') || '—');
      case 'nong_do':
        return one(item.nong_do != null ? `${formatSo(item.nong_do)} ${item.don_vi}` : '—', 'tabular-nums text-right');
      case 'luong_nuoc_lit':
        return one(item.luong_nuoc_lit != null ? formatSo(item.luong_nuoc_lit) : '—', 'tabular-nums text-right');
      case 'luong_thuoc':
        return one(
          item.luong_thuoc != null ? `${formatSo(item.luong_thuoc)} ${donViLuongThuoc(item.don_vi)}` : '—',
          'tabular-nums text-right font-semibold'
        );
      case 'ghi_chu':
        return one(item.ghi_chu || '—', 'text-muted-foreground');
      case 'ten_nhan_vien_phu_trach':
        return one(item.ten_nhan_vien_phu_trach || '—');
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col relative">
      <div className="flex-1 min-h-0 flex flex-col md:rounded-xl md:border md:border-border md:bg-card md:shadow-sm overflow-hidden">
      <ChiTietTabToolbar data={tomTat} branches={branches} selectedCount={selectedIds.size} onExport={handleExport} />
      <div className="flex-1 min-h-0 flex flex-col md:px-4 md:pb-4 pt-1">
        <GenericTable<NhatKyPhunCuiLanRow>
          data={rows}
          columns={visibleColumns}
          onResizeColumn={resizeColumn}
          isLoading={isLoading}
          isFetching={isFetching}
          totalRecordsOverride={totalCount}
          loadingText={t('nkpc.loading')}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAll={toggleAllSelection}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sort={sort}
          onSort={setSort}
          renderCell={renderCell}
          renderMobileCard={(item, isSelected) => <ChiTietCard item={item} isSelected={isSelected} onView={handleView} />}
          keyExtractor={(item) => item.id}
          onRowClick={handleView}
          emptyTitle={t('nkpc.chiTiet.empty')}
          emptyDescription={t('nkpc.chiTiet.emptyHint')}
        />
      </div>
      </div>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumns}
            data={exportData}
            paginatedData={paginatedData}
            selectedData={selectedData}
            fileName={exportFileNameNhatKyPhunCuiChiTiet()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && <NhatKyPhunCuiDetail data={viewingItem} onClose={() => setViewingId(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default ChiTietTab;
