/** Tab Chi tiết: liệt kê phẳng từng lần pha của mọi nhật ký — chỉ xem, lọc, xuất; bấm dòng mở phiếu cha. */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import GenericTable from '../../../../components/shared/GenericTable';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { cn, formatYmdToDisplay } from '../../../../lib/utils';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import type { NhatKyPhaPhenLanRow } from '../core/types';
import { useNhatKyPhaPhenChiTietPage } from '../hooks/use-nhat-ky-pha-phen';
import type { NkppChiTietListServerQuery } from '../services/nhat-ky-pha-phen-list-query';
import { fetchAllNkppChiTietForListQuery, type NkppTomTat } from '../services/nhat-ky-pha-phen-service';
import { useNhatKyPhaPhenChiTietStore } from '../store/useNhatKyPhaPhenChiTietStore';
import {
  exportFileNameNhatKyPhaPhenChiTiet,
  getExportColumnsNhatKyPhaPhenChiTiet,
  mapNhatKyPhaPhenChiTietRow,
} from '../utils/export-nhat-ky-pha-phen-chi-tiet';
import { formatChenhLechLan, formatKg, mauChenhLech } from '../utils/hien-thi';
import ChiTietTabToolbar from './ChiTietTabToolbar';
import ChiTietCard from './ChiTietCard';

interface Props {
  viewAll: boolean;
  allowedBranchIds: string[];
  scopeLoading: boolean;
  branches: Branch[];
  tomTat: NkppTomTat[];
  /** Mở drawer chi tiết của phiếu cha. */
  onViewNhatKy: (idNhatKy: string) => void;
}

const ChiTietTab: React.FC<Props> = ({ viewAll, allowedBranchIds, scopeLoading, branches, tomTat, onViewNhatKy }) => {
  const { t } = useTranslation();
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
  } = useNhatKyPhaPhenChiTietStore();
  const [showExport, setShowExport] = useState(false);

  const listServerQuery: NkppChiTietListServerQuery = useMemo(
    () => ({
      page: pagination.page - 1,
      pageSize: pagination.pageSize,
      viewAll,
      allowedBranchIds,
      nam: filters.nam ?? [],
      thang: filters.thang ?? [],
      idChiNhanh: filters.id_chi_nhanh ?? [],
      sortColumn: sort.column,
      sortDirection: sort.direction,
    }),
    [pagination.page, pagination.pageSize, filters, sort, viewAll, allowedBranchIds]
  );

  const pageQuery = useNhatKyPhaPhenChiTietPage(listServerQuery, !scopeLoading);
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
    request: { query: NkppChiTietListServerQuery };
    rows: NhatKyPhaPhenLanRow[];
  } | null>(null);
  const exportLoading = exportRequest !== null && exportResult?.request !== exportRequest;
  const exportRows = useMemo(
    () => (exportRequest !== null && exportResult?.request === exportRequest ? exportResult.rows : []),
    [exportRequest, exportResult]
  );
  useEffect(() => {
    if (!exportRequest) return;
    let cancelled = false;
    fetchAllNkppChiTietForListQuery(exportRequest.query)
      .then((r) => !cancelled && setExportResult({ request: exportRequest, rows: r }))
      .catch(() => !cancelled && setExportResult({ request: exportRequest, rows: [] }));
    return () => {
      cancelled = true;
    };
  }, [exportRequest]);

  const exportColumns = useMemo(() => getExportColumnsNhatKyPhaPhenChiTiet(t), [t]);
  const sttTheoId = useMemo(() => new Map(exportRows.map((r, i) => [r.id, i + 1])), [exportRows]);
  const exportMap = useCallback(
    (item: NhatKyPhaPhenLanRow) => mapNhatKyPhaPhenChiTietRow(item, sttTheoId.get(item.id) ?? 0),
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
      toast.warning(t('nkpp.noExportData'));
      return;
    }
    setShowExport(true);
  }, [totalCount, t]);

  const visibleColumns = useMemo(() => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order), [columns]);
  const handleView = useCallback((item: NhatKyPhaPhenLanRow) => onViewNhatKy(item.id_nhat_ky), [onViewNhatKy]);

  const renderCell = (colId: string, item: NhatKyPhaPhenLanRow) => {
    const one = (text: React.ReactNode, className?: string) => (
      <span className={cn('block truncate whitespace-nowrap text-sm', className)}>{text}</span>
    );
    switch (colId) {
      case 'ngay':
        return one(formatYmdToDisplay(item.ngay), 'tabular-nums font-medium');
      case 'ten_chi_nhanh':
        return one(item.ten_chi_nhanh || '—');
      case 'lan':
        return one(item.lan, 'tabular-nums text-center');
      case 'gio':
        return one(item.gio ?? '—', 'tabular-nums text-center');
      case 'so_kg':
        return one(formatKg(item.so_kg), 'tabular-nums text-right font-semibold');
      case 'dinh_muc_kg':
        return one(formatKg(item.dinh_muc_kg), 'tabular-nums text-right text-muted-foreground');
      case 'chenh_lech':
        return one(formatChenhLechLan(item.chenh_lech), cn('tabular-nums text-right', mauChenhLech(item.chenh_lech)));
      case 'ten_nhan_vien_phu_trach':
        return one(item.ten_nhan_vien_phu_trach || '—');
      default:
        return null;
    }
  };

  return (
    <>
      <ChiTietTabToolbar data={tomTat} branches={branches} selectedCount={selectedIds.size} onExport={handleExport} />
      <div className="flex-1 min-h-0 flex flex-col md:px-4 md:pb-4 pt-1">
        <GenericTable<NhatKyPhaPhenLanRow>
          data={rows}
          columns={visibleColumns}
          onResizeColumn={resizeColumn}
          isLoading={isLoading}
          isFetching={isFetching}
          totalRecordsOverride={totalCount}
          loadingText={t('nkpp.loading')}
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
          emptyTitle={t('nkpp.chiTiet.empty')}
          emptyDescription={t('nkpp.chiTiet.emptyHint')}
        />
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
            fileName={exportFileNameNhatKyPhaPhenChiTiet()}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ChiTietTab;
