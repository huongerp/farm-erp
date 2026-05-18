import { useMemo, useState } from 'react';
import type { DateRangeValue } from '../../../../components/ui/DateRangePicker';
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

  const chiNhanhOptions = useMemo(() => getChiNhanhOptions(allRows), [allRows]);

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
  const filteredRows = useMemo(() => filterThongKeSanXuatRows(allRows, filters), [allRows, filters]);
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
    allRows,
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
