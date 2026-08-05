import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, FolderOpen, MapPin } from 'lucide-react';
import { useTonKhoNxtByPeriod } from '../hooks/use-ton-kho';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { useHangHoaRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import TonKhoToolbar from './TonKhoToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import type { DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { useSearchInputCommit } from '../../../../lib/hooks/use-search-input-commit';
import {
  useTonKhoTonThoiDiemStore,
  mergeWarehousePeriodColumns,
  isKhoPeriodColumnId,
  parseKhoPeriodColumnId,
  type KhoPeriodMetric,
} from '../store/useTonKhoStore';
import type { TonKhoFilters } from '../store/useTonKhoStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { getColumnCellStyle, getEffectiveColumnMinWidth } from '../../../../store/createGenericStore';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import type { HangHoaRefLite } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { NXTKHCell } from '../../bao-cao-nhap-xuat-ton/core/types';
import {
  getDateRangeFromPreset,
  getPresetFromDates,
} from '../../bao-cao-nhap-xuat-ton/core/datePresets';
import { cn } from '../../../../lib/utils';

const CUSTOM_PRESET_ID = 'custom';
const STICKY_LEFT_COL_IDS = new Set(['ma_hang', 'ten_hang']);

type PeriodCell = {
  ton_dau_ky: number;
  tong_nhap: number;
  tong_xuat: number;
  ton_cuoi_ky: number;
};

export type RowKyProduct = {
  id_hang_hoa: string;
  ma_hang: string;
  ten_hang: string;
  ten_danh_muc?: string;
  don_vi_tinh: string;
  tong_dau: number;
  tong_nhap: number;
  tong_xuat: number;
  tong_cuoi: number;
  by_kho: Record<string, PeriodCell>;
};

function zeroCell(): PeriodCell {
  return { ton_dau_ky: 0, tong_nhap: 0, tong_xuat: 0, ton_cuoi_ky: 0 };
}

function metricValue(cell: PeriodCell | undefined, metric: KhoPeriodMetric): number {
  if (!cell) return 0;
  if (metric === 'dau') return cell.ton_dau_ky;
  if (metric === 'cuoi') return cell.ton_cuoi_ky;
  return cell.tong_nhap - cell.tong_xuat;
}

function formatQty(n: number): string {
  if (n === 0) return '—';
  return n.toLocaleString();
}

function formatTrongKy(cell: PeriodCell | undefined): React.ReactNode {
  if (!cell || (cell.tong_nhap === 0 && cell.tong_xuat === 0)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const net = cell.tong_nhap - cell.tong_xuat;
  return (
    <span className="inline-flex flex-col items-end gap-0.5 leading-tight">
      <span
        className={cn(
          'tabular-nums text-sm font-medium',
          net > 0 && 'text-emerald-600 dark:text-emerald-400',
          net < 0 && 'text-rose-600 dark:text-rose-400'
        )}
      >
        {net > 0 ? `+${net.toLocaleString()}` : net.toLocaleString()}
      </span>
      <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
        +{cell.tong_nhap.toLocaleString()} / −{cell.tong_xuat.toLocaleString()}
      </span>
    </span>
  );
}

const TonKhoTonThoiDiemTab: React.FC = () => {
  const { t } = useTranslation();
  const defaultRange = useMemo(() => getDateRangeFromPreset('thisMonth'), []);
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);

  const searchTerm = useTonKhoTonThoiDiemStore((s) => s.searchTerm);
  const commitSearchTerm = useTonKhoTonThoiDiemStore((s) => s.commitSearchTerm);
  const filters = useTonKhoTonThoiDiemStore((s) => s.filters);
  const setFilter = useTonKhoTonThoiDiemStore((s) => s.setFilter);
  const columns = useTonKhoTonThoiDiemStore((s) => s.columns);
  const toggleColumn = useTonKhoTonThoiDiemStore((s) => s.toggleColumn);
  const reorderColumns = useTonKhoTonThoiDiemStore((s) => s.reorderColumns);
  const resetColumns = useTonKhoTonThoiDiemStore((s) => s.resetColumns);
  const setColumns = useTonKhoTonThoiDiemStore((s) => s.setColumns);
  const pagination = useTonKhoTonThoiDiemStore((s) => s.pagination);
  const setPage = useTonKhoTonThoiDiemStore((s) => s.setPage);
  const setPageSize = useTonKhoTonThoiDiemStore((s) => s.setPageSize);
  const resetState = useTonKhoTonThoiDiemStore((s) => s.resetState);

  const { inputValue: searchInput, setInputValue: setSearchInput } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });

  const kyFilters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      warehouseIds: filters.warehouseIds ?? [],
    }),
    [dateFrom, dateTo, filters.warehouseIds]
  );

  const { data: nxt, isLoading: nxtLoading, isFetching, isError } = useTonKhoNxtByPeriod(kyFilters);
  const { data: khoList = [], isLoading: khoLoading } = useKhoList();
  const { data: hangHoaList = [], isLoading: hangLoading } = useHangHoaRefQuery();

  const hangHoaMap = useMemo(() => {
    const m: Record<string, HangHoaRefLite> = {};
    hangHoaList.forEach((h) => {
      m[h.id] = h;
    });
    return m;
  }, [hangHoaList]);

  const khoMap = useMemo(() => {
    const m: Record<string, Kho> = {};
    khoList.forEach((k) => {
      m[k.id] = k;
    });
    return m;
  }, [khoList]);

  /** Kho hiện trên cột: theo filter chip hoặc mọi kho có trong byCell / danh sách kho. */
  const displayKhoList = useMemo(() => {
    const byCell = nxt?.byCell ?? [];
    const idsInData = new Set(byCell.map((c) => c.id_kho));
    const filterSet =
      (filters.warehouseIds?.length ?? 0) > 0 ? new Set(filters.warehouseIds) : null;
    const base = (khoList.length > 0 ? khoList : Array.from(idsInData).map((id) => ({
      id,
      ma_kho: id,
      ten_kho: khoMap[id]?.ten_kho ?? id,
    })) as Kho[]).filter((k) => {
      if (filterSet && !filterSet.has(k.id)) return false;
      return true;
    });
    // Ưu tiên kho có phát sinh / tồn trong kỳ; vẫn giữ đủ danh sách đã lọc để cột ổn định
    return [...base].sort((a, b) => a.ten_kho.localeCompare(b.ten_kho));
  }, [khoList, nxt?.byCell, filters.warehouseIds, khoMap]);

  useEffect(() => {
    const next = mergeWarehousePeriodColumns(columns, displayKhoList);
    if (next !== columns) setColumns(() => next);
  }, [displayKhoList, columns, setColumns]);

  const rows: RowKyProduct[] = useMemo(() => {
    const byCell = nxt?.byCell ?? [];
    const byHh = new Map<string, RowKyProduct>();
    const addCell = (cell: NXTKHCell) => {
      let row = byHh.get(cell.id_hang_hoa);
      if (!row) {
        const h = hangHoaMap[cell.id_hang_hoa];
        row = {
          id_hang_hoa: cell.id_hang_hoa,
          ma_hang: h?.ma_hang ?? cell.id_hang_hoa,
          ten_hang: h?.ten_hang ?? '—',
          ten_danh_muc: h?.ten_danh_muc ?? undefined,
          don_vi_tinh: h?.don_vi_tinh ?? h?.dvt ?? '—',
          tong_dau: 0,
          tong_nhap: 0,
          tong_xuat: 0,
          tong_cuoi: 0,
          by_kho: {},
        };
        byHh.set(cell.id_hang_hoa, row);
      }
      const prev = row.by_kho[cell.id_kho] ?? zeroCell();
      prev.ton_dau_ky += cell.ton_dau_ky;
      prev.tong_nhap += cell.tong_nhap;
      prev.tong_xuat += cell.tong_xuat;
      prev.ton_cuoi_ky += cell.ton_cuoi_ky;
      row.by_kho[cell.id_kho] = prev;
      row.tong_dau += cell.ton_dau_ky;
      row.tong_nhap += cell.tong_nhap;
      row.tong_xuat += cell.tong_xuat;
      row.tong_cuoi += cell.ton_cuoi_ky;
    };

    const warehouseFilter =
      (filters.warehouseIds?.length ?? 0) > 0 ? new Set(filters.warehouseIds) : null;
    byCell.forEach((c) => {
      if (warehouseFilter && !warehouseFilter.has(c.id_kho)) return;
      addCell(c);
    });

    return Array.from(byHh.values())
      .filter(
        (r) =>
          r.tong_dau !== 0 ||
          r.tong_cuoi !== 0 ||
          r.tong_nhap !== 0 ||
          r.tong_xuat !== 0
      )
      .sort((a, b) => b.tong_cuoi - a.tong_cuoi || a.ma_hang.localeCompare(b.ma_hang));
  }, [nxt?.byCell, hangHoaMap, filters.warehouseIds]);

  const filterFn = useCallback((item: RowKyProduct, term: string, f: TonKhoFilters) => {
    if (term.trim()) {
      const s = term.toLowerCase();
      if (!item.ma_hang.toLowerCase().includes(s) && !item.ten_hang.toLowerCase().includes(s)) {
        return false;
      }
    }
    if ((f.categoryIds?.length ?? 0) > 0) {
      const cat = item.ten_danh_muc ?? '';
      if (!f.categoryIds!.includes(cat)) return false;
    }
    return true;
  }, []);

  const filteredList = useListWithFilter(rows, searchTerm, filters, filterFn);

  const warehouseOptions = useMemo(
    () =>
      khoList
        .map((k) => ({ label: k.ten_kho, value: k.id, subLabel: k.ma_kho }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [khoList]
  );

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const c = r.ten_danh_muc?.trim();
      if (c) set.add(c);
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({
        label,
        value: label,
        count: rows.filter((r) => (r.ten_danh_muc ?? '') === label).length,
      }));
  }, [rows]);

  const dateRangePresets = useMemo(
    () => [
      { id: 'thisMonth', label: t('tonKho.tonThoiDiem.preset.thisMonth') },
      { id: 'lastMonth', label: t('tonKho.tonThoiDiem.preset.lastMonth') },
      { id: 'thisQuarter', label: t('tonKho.tonThoiDiem.preset.thisQuarter') },
      { id: 'thisYear', label: t('tonKho.tonThoiDiem.preset.thisYear') },
    ],
    [t]
  );

  const dateRangeValue: DateRangeValue = useMemo(
    () => ({
      preset: getPresetFromDates(dateFrom, dateTo),
      customStart: dateFrom,
      customEnd: dateTo,
    }),
    [dateFrom, dateTo]
  );

  const handleDateRangeChange = (value: DateRangeValue) => {
    if (value.preset === CUSTOM_PRESET_ID) {
      setDateFrom(value.customStart);
      setDateTo(value.customEnd);
    } else {
      const { dateFrom: from, dateTo: to } = getDateRangeFromPreset(value.preset);
      setDateFrom(from);
      setDateTo(to);
    }
  };

  const activeFilterCount =
    (filters.warehouseIds?.length ?? 0) +
    (filters.categoryIds?.length ?? 0) +
    (getPresetFromDates(dateFrom, dateTo) !== 'thisMonth' ? 1 : 0);

  const handleClearAllFilters = useCallback(() => {
    setFilter('warehouseIds', []);
    setFilter('categoryIds', []);
    const range = getDateRangeFromPreset('thisMonth');
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
  }, [setFilter]);

  const renderFilters = (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangePicker
        presets={dateRangePresets}
        value={dateRangeValue}
        onChange={handleDateRangeChange}
        placeholder={t('tonKho.tonThoiDiem.periodPlaceholder')}
        customPresetId={CUSTOM_PRESET_ID}
        className="shrink-0"
      />
      <FilterChipMultiSelect
        options={warehouseOptions}
        value={filters.warehouseIds ?? []}
        onChange={(val) => setFilter('warehouseIds', val)}
        placeholder={t('tonKho.byLocation.warehouse')}
        icon={MapPin}
        className="w-full sm:w-[180px]"
      />
      <FilterChipMultiSelect
        options={categoryOptions}
        value={filters.categoryIds ?? []}
        onChange={(val) => setFilter('categoryIds', val)}
        placeholder={t('tonKho.byProduct.category')}
        icon={FolderOpen}
        className="w-full sm:w-[160px]"
      />
    </div>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'warehouseIds',
        label: t('tonKho.byLocation.warehouse'),
        icon: MapPin,
        options: warehouseOptions,
        value: filters.warehouseIds ?? [],
        onChange: (val: string[]) => setFilter('warehouseIds', val),
      },
      {
        key: 'categoryIds',
        label: t('tonKho.byProduct.category'),
        icon: FolderOpen,
        options: categoryOptions,
        value: filters.categoryIds ?? [],
        onChange: (val: string[]) => setFilter('categoryIds', val),
      },
    ],
    [t, warehouseOptions, categoryOptions, filters.warehouseIds, filters.categoryIds, setFilter]
  );

  useEffect(() => resetState, [resetState]);
  useEffect(() => setPage(1), [filteredList.length, setPage]);
  const maxPage = Math.max(1, Math.ceil(filteredList.length / pagination.pageSize));
  useEffect(() => {
    if (pagination.page > maxPage) setPage(maxPage);
  }, [pagination.page, pagination.pageSize, maxPage, setPage]);

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const stickyLeftById = useMemo(() => {
    const map = new Map<string, number>();
    let acc = 0;
    for (const col of visibleColumns) {
      if (!STICKY_LEFT_COL_IDS.has(col.id)) continue;
      map.set(col.id, acc);
      acc += col.width ?? getEffectiveColumnMinWidth(col, 120);
    }
    return map;
  }, [visibleColumns]);

  const lastStickyColId = useMemo(() => {
    let last: string | null = null;
    for (const col of visibleColumns) {
      if (STICKY_LEFT_COL_IDS.has(col.id)) last = col.id;
    }
    return last;
  }, [visibleColumns]);

  const tableMinWidth = useMemo(
    () =>
      visibleColumns.reduce(
        (sum, c) => sum + (c.width ?? getEffectiveColumnMinWidth(c, 120)),
        0
      ),
    [visibleColumns]
  );

  /** Nhóm header: cột đơn / nhóm Tổng / nhóm theo kho (3 cột). */
  type HeaderGroup =
    | { kind: 'single'; col: ColumnConfig }
    | { kind: 'group'; key: string; label: string; cols: ColumnConfig[] };

  const headerGroups = useMemo((): HeaderGroup[] => {
    const groups: HeaderGroup[] = [];
    let i = 0;
    while (i < visibleColumns.length) {
      const col = visibleColumns[i];
      if (col.id === 'tong_dau' || col.id === 'tong_trong' || col.id === 'tong_cuoi') {
        const cols: ColumnConfig[] = [];
        while (
          i < visibleColumns.length &&
          (visibleColumns[i].id === 'tong_dau' ||
            visibleColumns[i].id === 'tong_trong' ||
            visibleColumns[i].id === 'tong_cuoi')
        ) {
          cols.push(visibleColumns[i]);
          i += 1;
        }
        groups.push({ kind: 'group', key: 'tong', label: t('tonKho.tonThoiDiem.tongKy'), cols });
        continue;
      }
      const parsed = parseKhoPeriodColumnId(col.id);
      if (parsed) {
        const { khoId } = parsed;
        const cols: ColumnConfig[] = [];
        while (i < visibleColumns.length) {
          const p = parseKhoPeriodColumnId(visibleColumns[i].id);
          if (!p || p.khoId !== khoId) break;
          cols.push(visibleColumns[i]);
          i += 1;
        }
        const ten = khoMap[khoId]?.ten_kho ?? khoId;
        groups.push({ kind: 'group', key: khoId, label: ten, cols });
        continue;
      }
      groups.push({ kind: 'single', col });
      i += 1;
    }
    return groups;
  }, [visibleColumns, khoMap, t]);

  const paginatedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return filteredList.slice(start, start + pagination.pageSize);
  }, [filteredList, pagination.page, pagination.pageSize]);

  const isLoading = nxtLoading || khoLoading || hangLoading;
  const isFetchingOverlay = isFetching && !isLoading;

  const renderCell = (item: RowKyProduct, col: ColumnConfig) => {
    const stickyLeft = stickyLeftById.get(col.id);
    const isSticky = stickyLeft !== undefined;
    const stickyClass = isSticky
      ? cn(
          'sticky z-[1] bg-card group-hover:bg-muted/50',
          col.id === lastStickyColId && 'border-r border-border'
        )
      : undefined;
    const baseStyle: React.CSSProperties = {
      ...getColumnCellStyle(col),
      ...(isSticky ? { left: stickyLeft } : null),
    };

    const periodParsed = parseKhoPeriodColumnId(col.id);
    if (periodParsed) {
      const cell = item.by_kho[periodParsed.khoId];
      if (periodParsed.metric === 'trong') {
        return (
          <td key={col.id} className="px-3 py-2.5 text-right" style={baseStyle}>
            {formatTrongKy(cell)}
          </td>
        );
      }
      const n = metricValue(cell, periodParsed.metric);
      return (
        <td key={col.id} className="px-3 py-2.5 text-right" style={baseStyle}>
          <span className="font-medium tabular-nums text-sm">{formatQty(n)}</span>
        </td>
      );
    }

    switch (col.id) {
      case 'ma_hang':
        return (
          <td key={col.id} className={cn('px-4 py-3', stickyClass)} style={baseStyle}>
            <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
              {item.ma_hang}
            </span>
          </td>
        );
      case 'ten_hang':
        return (
          <td key={col.id} className={cn('px-4 py-3', stickyClass)} style={baseStyle}>
            <span className="font-medium text-foreground">{item.ten_hang}</span>
          </td>
        );
      case 'ten_danh_muc':
        return (
          <td key={col.id} className="px-4 py-3 text-muted-foreground" style={baseStyle}>
            {item.ten_danh_muc ?? '—'}
          </td>
        );
      case 'don_vi_tinh':
        return (
          <td key={col.id} className="px-4 py-3 text-muted-foreground" style={baseStyle}>
            {item.don_vi_tinh}
          </td>
        );
      case 'tong_dau':
        return (
          <td key={col.id} className="px-3 py-2.5 text-right" style={baseStyle}>
            <span className="font-medium tabular-nums text-sm">{formatQty(item.tong_dau)}</span>
          </td>
        );
      case 'tong_trong':
        return (
          <td key={col.id} className="px-3 py-2.5 text-right" style={baseStyle}>
            {formatTrongKy({
              ton_dau_ky: item.tong_dau,
              tong_nhap: item.tong_nhap,
              tong_xuat: item.tong_xuat,
              ton_cuoi_ky: item.tong_cuoi,
            })}
          </td>
        );
      case 'tong_cuoi':
        return (
          <td key={col.id} className="px-3 py-2.5 text-right" style={baseStyle}>
            <span className="font-semibold tabular-nums text-sm">{formatQty(item.tong_cuoi)}</span>
          </td>
        );
      default:
        return <td key={col.id} className="px-4 py-3" style={baseStyle} />;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <TonKhoToolbar
          searchTerm={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder={t('tonKho.tonThoiDiem.searchPlaceholder')}
          columns={columns}
          onToggleColumn={toggleColumn}
          onReorderColumns={reorderColumns}
          onResetColumns={resetColumns}
          filters={renderFilters}
          activeFilterCount={activeFilterCount}
          onClearAllFilters={handleClearAllFilters}
          filterGroups={filterGroups}
        />

        <div className="flex-1 min-h-0 flex flex-col bg-card overflow-hidden relative">
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
          {isError ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-sm text-destructive">{t('common.error') || 'Có lỗi khi tải dữ liệu.'}</p>
            </div>
          ) : isLoading ? (
            <ListPageSkeleton
              loadingText={t('tonKho.loading')}
              tableColumns={Math.min(visibleColumns.length, 8)}
              tableRowCount={8}
              tableColumnWithSubline={0}
              cardCount={0}
            />
          ) : filteredList.length === 0 ? (
            <div className="flex-1 min-h-0 flex items-center justify-center p-4">
              <EmptyState
                icon={<Clock size={40} className="text-muted-foreground opacity-20" />}
                title={t('tonKho.tonThoiDiem.empty')}
                description={t('tonKho.tonThoiDiem.emptyHint')}
              />
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                <table
                  className="w-full text-sm text-left border-separate border-spacing-0"
                  style={{ minWidth: tableMinWidth }}
                >
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-muted/95">
                      {headerGroups.map((g) => {
                        if (g.kind === 'single') {
                          const stickyLeft = stickyLeftById.get(g.col.id);
                          const isSticky = stickyLeft !== undefined;
                          return (
                            <th
                              key={g.col.id}
                              rowSpan={2}
                              className={cn(
                                'px-4 py-2.5 font-semibold text-muted-foreground text-xs whitespace-nowrap border-b border-border bg-muted/95 align-bottom',
                                isSticky && 'sticky z-[11]',
                                isSticky && g.col.id === lastStickyColId && 'border-r border-border'
                              )}
                              style={{
                                ...getColumnCellStyle(g.col),
                                ...(isSticky ? { left: stickyLeft } : null),
                              }}
                            >
                              {g.col.label}
                            </th>
                          );
                        }
                        return (
                          <th
                            key={g.key}
                            colSpan={g.cols.length}
                            className="px-2 py-1.5 font-semibold text-foreground/80 text-xs whitespace-nowrap border-b border-border bg-muted/80 text-center border-l border-border/60"
                          >
                            {g.label}
                          </th>
                        );
                      })}
                    </tr>
                    <tr className="bg-muted/95">
                      {headerGroups.map((g) => {
                        if (g.kind === 'single') return null;
                        return g.cols.map((col, idx) => {
                          const metricLabel = isKhoPeriodColumnId(col.id)
                            ? (() => {
                                const p = parseKhoPeriodColumnId(col.id)!;
                                if (p.metric === 'dau') return t('tonKho.tonThoiDiem.colDauKy');
                                if (p.metric === 'trong') return t('tonKho.tonThoiDiem.colTrongKy');
                                return t('tonKho.tonThoiDiem.colCuoiKy');
                              })()
                            : col.id === 'tong_dau'
                              ? t('tonKho.tonThoiDiem.colDauKy')
                              : col.id === 'tong_trong'
                                ? t('tonKho.tonThoiDiem.colTrongKy')
                                : t('tonKho.tonThoiDiem.colCuoiKy');
                          return (
                            <th
                              key={col.id}
                              className={cn(
                                'px-3 py-1.5 font-medium text-muted-foreground text-[11px] whitespace-nowrap border-b border-border bg-muted/95 text-right',
                                idx === 0 && 'border-l border-border/60'
                              )}
                              style={getColumnCellStyle(col)}
                            >
                              {metricLabel}
                            </th>
                          );
                        });
                      })}
                    </tr>
                  </thead>
                  <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                    {paginatedData.map((item) => (
                      <tr
                        key={item.id_hang_hoa}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        {visibleColumns.map((col) => renderCell(item, col))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="shrink-0 border-t border-border bg-muted/30">
                <TablePaginationFooter
                  totalRecords={filteredList.length}
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  selectedCount={0}
                  recordsLabel={t('tonKho.records')}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TonKhoTonThoiDiemTab;
