import { useMemo, useState } from 'react';
import type { DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import { useBaoCaoNhanCongList } from '../../bao-cao-nhan-cong/hooks/use-bao-cao-nhan-cong';
import { useBaoCaoSoCheList } from '../../bao-cao-so-che/hooks/use-bao-cao-so-che';
import { useDuBaoSlDongThungList } from '../../du-bao-sl-dong-thung/hooks/use-du-bao-sl-dong-thung';
import {
  mergeThongKeSanXuatRows,
  filterThongKeSanXuatRows,
  computeThongKeSanXuatSummary,
  resolveDateRange,
  countActiveFilters,
  getChiNhanhOptions,
} from '../core/compute';

const DEFAULT_PRESET = 'all';

const DEFAULT_DATE_RANGE: DateRangeValue = {
  preset: 'all',
  customStart: '',
  customEnd: '',
};

export function useThongKeSanXuat() {
  const bcncQuery = useBaoCaoNhanCongList();
  const bcscQuery = useBaoCaoSoCheList();
  const dbdtQuery = useDuBaoSlDongThungList();
  const viewScope = useEmployeeBranchModuleScope('quan-ly-farm/thong-ke-san-xuat');

  const isLoading = bcncQuery.isLoading || bcscQuery.isLoading || dbdtQuery.isLoading;
  const isError = bcncQuery.isError || bcscQuery.isError || dbdtQuery.isError;

  // ── Filter state ──────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<DateRangeValue>(DEFAULT_DATE_RANGE);
  const [chiNhanhIds, setChiNhanhIds] = useState<string[]>([]);
  const [kpiFilter, setKpiFilter] = useState<string[]>([]);
  const [hienThiFilter, setHienThiFilter] = useState<string[]>([]);
  const [trangThaiBcncFilter, setTrangThaiBcncFilter] = useState<string[]>([]);
  const [trangThaiBcscFilter, setTrangThaiBcscFilter] = useState<string[]>([]);

  // ── Resolved dates ────────────────────────────────────────────────────────
  const { dateFrom, dateTo } = useMemo(
    () => resolveDateRange(dateRange.preset, dateRange.customStart, dateRange.customEnd),
    [dateRange]
  );

  // ── Merged rows (unfiltered) ──────────────────────────────────────────────
  const allRows = useMemo(
    () =>
      mergeThongKeSanXuatRows(
        bcncQuery.data ?? [],
        bcscQuery.data ?? [],
        dbdtQuery.data ?? []
      ),
    [bcncQuery.data, bcscQuery.data, dbdtQuery.data]
  );

  // ── Branch-scope filter ───────────────────────────────────────────────────
  const scopedRows = useMemo(() => {
    if (viewScope.isLoading || viewScope.viewAll) return allRows;
    return allRows.filter((r) => viewScope.allowedBranchIds.includes(r.id_chi_nhanh));
  }, [allRows, viewScope]);

  const chiNhanhOptions = useMemo(() => getChiNhanhOptions(scopedRows), [scopedRows]);

  // ── Computed filters object ───────────────────────────────────────────────
  const filters = useMemo(
    () => ({
      datePreset: dateRange.preset,
      dateFrom,
      dateTo,
      chiNhanhIds,
      kpiFilter,
      hienThiFilter,
      trangThaiBcncFilter,
      trangThaiBcscFilter,
    }),
    [dateRange.preset, dateFrom, dateTo, chiNhanhIds, kpiFilter, hienThiFilter, trangThaiBcncFilter, trangThaiBcscFilter]
  );

  // ── Filtered rows + summary ───────────────────────────────────────────────
  const filteredRows = useMemo(() => filterThongKeSanXuatRows(scopedRows, filters), [scopedRows, filters]);
  const summary = useMemo(() => computeThongKeSanXuatSummary(filteredRows), [filteredRows]);
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  function resetFilters() {
    setDateRange(DEFAULT_DATE_RANGE);
    setChiNhanhIds([]);
    setKpiFilter([]);
    setHienThiFilter([]);
    setTrangThaiBcncFilter([]);
    setTrangThaiBcscFilter([]);
  }

  return {
    isLoading,
    isError,
    allRows: scopedRows,
    filteredRows,
    summary,
    activeFilterCount,
    chiNhanhOptions,
    // DateRangePicker state
    dateRange,
    setDateRange,
    // Multi-select filter states
    chiNhanhIds,
    setChiNhanhIds,
    kpiFilter,
    setKpiFilter,
    hienThiFilter,
    setHienThiFilter,
    trangThaiBcncFilter,
    setTrangThaiBcncFilter,
    trangThaiBcscFilter,
    setTrangThaiBcscFilter,
    resetFilters,
  };
}
