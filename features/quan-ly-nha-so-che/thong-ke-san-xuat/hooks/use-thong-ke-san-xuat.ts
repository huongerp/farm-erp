import { useMemo, useState } from 'react';
import type { DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import { useQuery } from '@tanstack/react-query';
import { fetchAllBaoCaoNhanCongForListQuery } from '../../bao-cao-nhan-cong/services/bao-cao-nhan-cong-service';
import { fetchAllBaoCaoSoCheForListQuery } from '../../bao-cao-so-che/services/bao-cao-so-che-service';
import { fetchAllDuBaoSlDongThungForListQuery } from '../../du-bao-sl-dong-thung/services/du-bao-sl-dong-thung-service';
import {
  mergeThongKeSanXuatRows,
  filterThongKeSanXuatRows,
  computeThongKeSanXuatSummary,
  resolveDateRange,
  DEFAULT_DATE_PRESET,
  countActiveFilters,
  getChiNhanhOptions,
} from '../core/compute';

/**
 * Mặc định "tháng này" thay vì "tất cả": màn này gộp ba nguồn dữ liệu, mở ra mà
 * kéo về toàn bộ lịch sử thì chậm và gần như không ai đọc hết. Chọn "Tất cả"
 * trong bộ lọc vẫn tải đủ như trước.
 */
const DEFAULT_DATE_RANGE: DateRangeValue = {
  preset: DEFAULT_DATE_PRESET,
  customStart: '',
  customEnd: '',
};

export function useThongKeSanXuat() {
  const viewScope = useEmployeeBranchModuleScope('quan-ly-nha-so-che/thong-ke-san-xuat');

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

  /**
   * Khoảng ngày + phạm vi chi nhánh đẩy xuống PostgREST: trước đây màn này kéo
   * TOÀN BỘ ba bảng cha kèm năm bảng con về trình duyệt rồi mới lọc.
   */
  const nguonQuery = useMemo(
    () => ({
      page: 0,
      pageSize: 1000,
      searchTerm: '',
      viewAll: viewScope.viewAll,
      allowedBranchIds: viewScope.allowedBranchIds,
      nam: [],
      thang: [],
      trangThai: [],
      idChiNhanh: chiNhanhIds,
      ngayFrom: dateFrom,
      ngayTo: dateTo,
      sortColumn: null,
      sortDirection: null,
    }),
    [viewScope.viewAll, viewScope.allowedBranchIds, chiNhanhIds, dateFrom, dateTo]
  );

  const enabled = !viewScope.isLoading;
  const bcncQuery = useQuery({
    queryKey: ['thongKeSanXuat', 'bcnc', nguonQuery],
    queryFn: () => fetchAllBaoCaoNhanCongForListQuery(nguonQuery),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
  const bcscQuery = useQuery({
    queryKey: ['thongKeSanXuat', 'bcsc', nguonQuery],
    queryFn: () => fetchAllBaoCaoSoCheForListQuery({ ...nguonQuery, donViTinh: [] }),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
  const dbdtQuery = useQuery({
    queryKey: ['thongKeSanXuat', 'dbdt', nguonQuery],
    queryFn: () => fetchAllDuBaoSlDongThungForListQuery(nguonQuery),
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  const isLoading = bcncQuery.isLoading || bcscQuery.isLoading || dbdtQuery.isLoading;
  const isError = bcncQuery.isError || bcscQuery.isError || dbdtQuery.isError;

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
