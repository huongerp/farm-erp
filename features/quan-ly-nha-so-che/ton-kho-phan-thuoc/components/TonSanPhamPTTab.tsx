import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Warehouse, FolderOpen, AlertTriangle, Calendar, BadgeCheck } from 'lucide-react';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import { useFarmDanhMucCap2WithParent } from '../../hang-hoa-phan-thuoc/hooks/use-farm-danh-muc';
import { useFarmHangHoaList } from '../../hang-hoa-phan-thuoc/hooks/use-farm-hang-hoa';
import { useFarmTonKhoPTTheoKy } from '../hooks/use-farm-ton-kho-pt';
import {
  gomTonKhoPTTheoKy,
  laHangChuaPhatSinh,
  laHangDuoiDinhMuc,
  themHangChuaPhatSinh,
  type HangHoaDinhMucLite,
  type KhoLite,
} from '../utils/ton-kho-theo-ky';
import { sapXepTonKhoPT } from '../utils/sap-xep-ton-kho';
import { exportTonKhoPTByProductToExcel } from '../utils/export-ton-kho-pt';
import type { TonKhoPTProductAgg } from '../core/types';
import {
  isKhoColumnId,
  khoIdFromColumnId,
  mergeWarehouseColumns,
} from '../../../kho-van/ton-kho/store/useTonKhoStore';
import {
  useTonKhoPTByProductStore,
  DEFAULT_COLUMNS,
  initialTonKhoPTFilters,
  type TonKhoPTFilters,
} from '../store/useTonKhoPTByProductStore';
import { useSearchInputCommit } from '../../../../lib/hooks/use-search-input-commit';
import { useListWithFilter } from '../../../../lib/hooks';
import { getDateRangeFromPreset, getPresetFromDates } from '../../../../lib/date-presets';
import TonKhoToolbar from '../../../kho-van/ton-kho/components/TonKhoToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import GenericTable from '../../../../components/shared/GenericTable';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { MobileFilterField, type FilterGroup } from '../../../../components/ui/MobileFilterSheet';
import Tooltip from '../../../../components/ui/Tooltip';
import TonKhoPTProductDetail from './TonKhoPTProductDetail';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { laDuoiDinhMuc } from '../../phieu-kho-phan-thuoc/utils/ton-kho-check';
import { createListSearchMatcher } from '../../../../lib/list-search-matcher';

/** Ô tìm kiếm quét MỌI cột của bảng, bỏ dấu tiếng Việt — xem lib/list-search-matcher.ts. */
const khopTimKiem = createListSearchMatcher({ columns: DEFAULT_COLUMNS });

const CUSTOM_PRESET_ID = 'custom';
const KY_MAC_DINH = 'thisMonth';

/** Số trong ô: 0 hiện "—" để bảng đỡ rối. */
const so = (n: number) => (n !== 0 ? formatNumberVN(n) : '—');

const TonSanPhamPTTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: khoList = [] } = useKhoList();
  const { data: danhMucCap2 = [] } = useFarmDanhMucCap2WithParent();
  const { data: hangHoaList = [] } = useFarmHangHoaList();

  const searchTerm = useTonKhoPTByProductStore((s) => s.searchTerm);
  const commitSearchTerm = useTonKhoPTByProductStore((s) => s.commitSearchTerm);
  const filters = useTonKhoPTByProductStore((s) => s.filters);
  const setFilter = useTonKhoPTByProductStore((s) => s.setFilter);
  const resetState = useTonKhoPTByProductStore((s) => s.resetState);
  const pagination = useTonKhoPTByProductStore((s) => s.pagination);
  const setPage = useTonKhoPTByProductStore((s) => s.setPage);
  const setPageSize = useTonKhoPTByProductStore((s) => s.setPageSize);
  const sort = useTonKhoPTByProductStore((s) => s.sort);
  const setSort = useTonKhoPTByProductStore((s) => s.setSort);
  const selectedIds = useTonKhoPTByProductStore((s) => s.selectedIds);
  const toggleSelection = useTonKhoPTByProductStore((s) => s.toggleSelection);
  const toggleAllSelection = useTonKhoPTByProductStore((s) => s.toggleAllSelection);
  const columns = useTonKhoPTByProductStore((s) => s.columns);
  const toggleColumn = useTonKhoPTByProductStore((s) => s.toggleColumn);
  const reorderColumns = useTonKhoPTByProductStore((s) => s.reorderColumns);
  const resizeColumn = useTonKhoPTByProductStore((s) => s.resizeColumn);
  const resetColumns = useTonKhoPTByProductStore((s) => s.resetColumns);
  const resetColumnWidths = useTonKhoPTByProductStore((s) => s.resetColumnWidths);
  const setColumns = useTonKhoPTByProductStore((s) => s.setColumns);

  const { inputValue: searchInput, setInputValue: setSearchInput } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });

  const chiDaDuyet = filters.chiDaDuyet.includes('Yes');
  const rangeOk = !filters.tu || !filters.den || filters.tu <= filters.den;
  const {
    data: cells = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useFarmTonKhoPTTheoKy({ tu: filters.tu, den: filters.den, chiDaDuyet });

  const hangMap = useMemo(() => {
    const m: Record<string, HangHoaDinhMucLite> = {};
    hangHoaList.forEach((h) => {
      m[String(h.id)] = h;
    });
    return m;
  }, [hangHoaList]);

  const khoMap = useMemo(() => {
    const m: Record<string, KhoLite> = {};
    khoList.forEach((k) => {
      m[String(k.id)] = { id: String(k.id), ma_kho: k.ma_kho, ten_kho: k.ten_kho };
    });
    return m;
  }, [khoList]);

  /** Chỉ kho có phát sinh phiếu phân thuốc — không liệt kê mọi kho của hệ thống. */
  const farmKhoList = useMemo((): KhoLite[] => {
    const ids = new Set(cells.map((c) => c.id_kho));
    return [...ids]
      .map((id) => khoMap[id] ?? { id, ma_kho: id, ten_kho: id })
      .sort((a, b) => a.ten_kho.localeCompare(b.ten_kho, 'vi'));
  }, [cells, khoMap]);

  const displayKhoList = useMemo(() => {
    if (filters.warehouseIds.length === 0) return farmKhoList;
    const wh = new Set(filters.warehouseIds.map(String));
    return farmKhoList.filter((k) => wh.has(k.id));
  }, [farmKhoList, filters.warehouseIds]);

  useEffect(() => {
    const next = mergeWarehouseColumns(columns, displayKhoList as unknown as Kho[]);
    if (next !== columns) setColumns(() => next);
  }, [displayKhoList, columns, setColumns]);

  /** Gom theo kho đang xem, chưa lọc danh mục — dùng đếm số trên chip danh mục. */
  const aggTheoKho = useMemo(
    () => gomTonKhoPTTheoKy(cells, { hangMap, khoMap, khoIds: filters.warehouseIds }),
    [cells, hangMap, khoMap, filters.warehouseIds]
  );

  const aggregated = useMemo(() => {
    const cat = filters.categoryIds.length > 0 ? new Set(filters.categoryIds.map(String)) : null;
    const agg = cat ? aggTheoKho.filter((r) => r.danh_muc_id && cat.has(String(r.danh_muc_id))) : aggTheoKho;
    // Hàng có định mức chưa từng nhập kho nào không thuộc kho cụ thể → chỉ thêm khi không lọc kho.
    if (filters.warehouseIds.length > 0) return agg;
    const hangCanXet = cat ? hangHoaList.filter((h) => h.danh_muc_id && cat.has(String(h.danh_muc_id))) : hangHoaList;
    return themHangChuaPhatSinh(agg, hangCanXet, new Set(cells.map((c) => c.id_hang_hoa)));
  }, [aggTheoKho, filters.categoryIds, filters.warehouseIds, hangHoaList, cells]);

  const belowMinCount = useMemo(() => aggregated.filter(laHangDuoiDinhMuc).length, [aggregated]);

  const filterFn = useCallback((item: TonKhoPTProductAgg, term: string, f: TonKhoPTFilters) => {
    if (f.belowMinStock.includes('Yes') && !laHangDuoiDinhMuc(item)) return false;
    return khopTimKiem(item, term);
  }, []);

  const filteredList = useListWithFilter(aggregated, searchTerm, filters, filterFn);
  const sortedList = useMemo(() => sapXepTonKhoPT(filteredList, sort), [filteredList, sort]);

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const handleExport = useCallback(() => {
    if (sortedList.length === 0) {
      toast.warning(t('tonKhoPhanThuoc.export.noData'));
      return;
    }
    void exportTonKhoPTByProductToExcel(sortedList, visibleColumns, { tu: filters.tu, den: filters.den }, t)
      .then(() => toast.success(t('tonKhoPhanThuoc.export.success')))
      .catch(() => toast.error(t('tonKhoPhanThuoc.export.error')));
  }, [sortedList, visibleColumns, filters.tu, filters.den, t]);

  // ── Kỳ ────────────────────────────────────────────────────────────────────
  const dateRangePresets = useMemo(
    () =>
      (['thisMonth', 'lastMonth', 'thisQuarter', 'thisYear', 'all'] as const).map((id) => ({
        id,
        label: t(`tonKhoPhanThuoc.filter.preset.${id}`),
      })),
    [t]
  );

  const dateRangeValue: DateRangeValue = useMemo(
    () => ({ preset: getPresetFromDates(filters.tu, filters.den), customStart: filters.tu, customEnd: filters.den }),
    [filters.tu, filters.den]
  );

  const handleDateRangeChange = useCallback(
    (value: DateRangeValue) => {
      const r =
        value.preset === CUSTOM_PRESET_ID
          ? { dateFrom: value.customStart, dateTo: value.customEnd }
          : getDateRangeFromPreset(value.preset);
      setFilter('tu', r.dateFrom);
      setFilter('den', r.dateTo);
    },
    [setFilter]
  );

  /** Kỳ mặc định là tháng này — khác đi mới tính là đang lọc. */
  const kyKhacMacDinh = dateRangeValue.preset !== KY_MAC_DINH;

  // ── Chip lọc ──────────────────────────────────────────────────────────────
  const khoOptions = useMemo(
    () =>
      farmKhoList.map((k) => ({
        value: k.id,
        label: k.ten_kho,
        subLabel: k.ma_kho,
        count: cells.filter((c) => c.id_kho === k.id && c.ton_cuoi !== 0).length,
      })),
    [farmKhoList, cells]
  );

  const categoryOptions = useMemo(
    () =>
      danhMucCap2.map((d) => ({
        value: String(d.id),
        label: d.ten_danh_muc_cha ? `${d.ten_danh_muc_cha} › ${d.ten_danh_muc}` : d.ten_danh_muc,
        count: aggTheoKho.filter((r) => String(r.danh_muc_id) === String(d.id)).length,
      })),
    [danhMucCap2, aggTheoKho]
  );

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'warehouseIds',
        label: t('tonKhoPhanThuoc.filter.warehouse'),
        icon: Warehouse,
        options: khoOptions,
        value: filters.warehouseIds,
        onChange: (val: string[]) => setFilter('warehouseIds', val),
      },
      {
        key: 'categoryIds',
        label: t('tonKhoPhanThuoc.filter.category'),
        icon: FolderOpen,
        options: categoryOptions,
        value: filters.categoryIds,
        onChange: (val: string[]) => setFilter('categoryIds', val),
      },
      {
        key: 'belowMinStock',
        label: t('tonKhoPhanThuoc.filter.belowMin'),
        icon: AlertTriangle,
        options: [{ label: t('tonKhoPhanThuoc.filter.belowMin'), value: 'Yes', count: belowMinCount }],
        value: filters.belowMinStock,
        onChange: (val: string[]) => setFilter('belowMinStock', val),
      },
      {
        key: 'chiDaDuyet',
        label: t('tonKhoPhanThuoc.filter.chiDaDuyet'),
        icon: BadgeCheck,
        options: [{ label: t('tonKhoPhanThuoc.filter.chiDaDuyetOption'), value: 'Yes' }],
        value: filters.chiDaDuyet,
        onChange: (val: string[]) => setFilter('chiDaDuyet', val),
      },
    ],
    [t, khoOptions, categoryOptions, belowMinCount, filters.warehouseIds, filters.categoryIds, filters.belowMinStock, filters.chiDaDuyet, setFilter]
  );

  const filterItems: FilterChipItem[] = [
    {
      kind: 'custom',
      key: 'ky',
      node: (
        <DateRangePicker
          presets={dateRangePresets}
          value={dateRangeValue}
          onChange={handleDateRangeChange}
          placeholder={t('tonKhoPhanThuoc.filter.period')}
          customPresetId={CUSTOM_PRESET_ID}
          className="shrink-0"
        />
      ),
    },
    ...filterGroups.map((group): FilterChipItem => ({ kind: 'group', group })),
  ];

  const activeFilterCount =
    (searchInput.trim() ? 1 : 0) +
    filters.warehouseIds.length +
    filters.categoryIds.length +
    filters.belowMinStock.length +
    filters.chiDaDuyet.length +
    (kyKhacMacDinh ? 1 : 0);

  const handleClearAllFilters = useCallback(() => {
    commitSearchTerm('');
    const init = initialTonKhoPTFilters();
    (Object.keys(init) as (keyof TonKhoPTFilters)[]).forEach((k) => setFilter(k, init[k]));
  }, [setFilter, commitSearchTerm]);

  useEffect(() => () => resetState(), [resetState]);

  useEffect(() => {
    setPage(1);
  }, [filteredList.length, setPage]);

  const [detail, setDetail] = useState<TonKhoPTProductAgg | null>(null);

  // ── Ô bảng ────────────────────────────────────────────────────────────────
  const renderCell = (colId: string, item: TonKhoPTProductAgg): React.ReactNode => {
    if (isKhoColumnId(colId)) {
      const khoId = khoIdFromColumnId(colId);
      const qty = item.by_kho[khoId] ?? 0;
      // Chỉ tô kho có phát sinh của hàng này — kho chưa từng nhập hàng thì không báo.
      const duoiDinhMuc = khoId in item.by_kho && (qty < 0 || laDuoiDinhMuc(qty, item.dinh_muc));
      const num = (
        <div className={cn('text-right tabular-nums', duoiDinhMuc && 'text-destructive font-semibold')}>{so(qty)}</div>
      );
      return duoiDinhMuc && item.dinh_muc ? (
        <Tooltip content={t('tonKhoPhanThuoc.hint.duoiDinhMuc', { dinhMuc: formatNumberVN(item.dinh_muc) })}>{num}</Tooltip>
      ) : (
        num
      );
    }
    switch (colId) {
      case 'ma_hang':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.ma_hang}
          </span>
        );
      case 'ten_hang':
        return <span className="font-medium text-foreground">{item.ten_hang}</span>;
      case 'ten_danh_muc':
        return <span className="text-muted-foreground">{item.ten_danh_muc ?? '—'}</span>;
      case 'don_vi_tinh':
        return <span className="text-muted-foreground">{item.don_vi_tinh}</span>;
      case 'dinh_muc':
        return <div className="text-right tabular-nums text-muted-foreground">{item.dinh_muc ? formatNumberVN(item.dinh_muc) : '—'}</div>;
      case 'so_kho_co_ton':
        return <div className="text-right tabular-nums">{item.so_kho_co_ton}</div>;
      case 'ton_dau':
        return <div className={cn('text-right tabular-nums', item.ton_dau < 0 && 'text-destructive')}>{so(item.ton_dau)}</div>;
      case 'nhap':
        return <div className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{so(item.nhap)}</div>;
      case 'xuat':
        return <div className="text-right tabular-nums text-amber-600 dark:text-amber-400">{so(item.xuat)}</div>;
      case 'chuyen':
        return (
          <div className="text-right tabular-nums text-muted-foreground">
            {item.chuyen > 0 ? `+${formatNumberVN(item.chuyen)}` : so(item.chuyen)}
          </div>
        );
      case 'ton_cuoi': {
        // Hàng có định mức chưa nhập kho nào: không có ô kho để tô → báo đỏ ở Tồn cuối kỳ.
        const chuaNhap = laHangChuaPhatSinh(item);
        const num = (
          <div
            className={cn(
              'text-right tabular-nums font-semibold',
              (chuaNhap || item.ton_cuoi < 0) && 'text-destructive'
            )}
          >
            {formatNumberVN(item.ton_cuoi)}
          </div>
        );
        return chuaNhap ? <Tooltip content={t('tonKhoPhanThuoc.hint.chuaNhapKho')}>{num}</Tooltip> : num;
      }
      default:
        return null;
    }
  };

  const renderSummaryRow = (colId: string, list: TonKhoPTProductAgg[]): React.ReactNode => {
    const tong = (f: (r: TonKhoPTProductAgg) => number) => list.reduce((s, r) => s + f(r), 0);
    if (isKhoColumnId(colId)) {
      const khoId = khoIdFromColumnId(colId);
      return <div className="text-right tabular-nums font-semibold">{so(tong((r) => r.by_kho[khoId] ?? 0))}</div>;
    }
    switch (colId) {
      case 'ma_hang':
        return <span className="text-muted-foreground">{t('tonKhoPhanThuoc.summary.total', { count: list.length })}</span>;
      case 'ton_dau':
        return <div className="text-right tabular-nums font-semibold">{so(tong((r) => r.ton_dau))}</div>;
      case 'nhap':
        return <div className="text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">{so(tong((r) => r.nhap))}</div>;
      case 'xuat':
        return <div className="text-right tabular-nums font-semibold text-amber-600 dark:text-amber-400">{so(tong((r) => r.xuat))}</div>;
      case 'chuyen':
        return <div className="text-right tabular-nums font-semibold text-muted-foreground">{so(tong((r) => r.chuyen))}</div>;
      case 'ton_cuoi':
        return <div className="text-right tabular-nums font-semibold">{formatNumberVN(tong((r) => r.ton_cuoi))}</div>;
      default:
        return null;
    }
  };

  const renderMobileCard = (item: TonKhoPTProductAgg) => {
    const canhBao = laHangDuoiDinhMuc(item);
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setDetail(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setDetail(item);
          }
        }}
        className="bg-card rounded-xl border border-border p-3.5 shadow-sm cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <h4 className="font-semibold text-foreground text-sm line-clamp-1">{item.ten_hang}</h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              <span className="font-mono">{item.ma_hang}</span>
              <span>{item.don_vi_tinh}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={cn('text-base font-bold tabular-nums', (canhBao || item.ton_cuoi < 0) && 'text-destructive')}>
              {formatNumberVN(item.ton_cuoi)}
            </div>
            <div className="text-[11px] text-muted-foreground">{t('tonKhoPhanThuoc.table.tonCuoi')}</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {(
            [
              ['tonDau', item.ton_dau, ''],
              ['nhap', item.nhap, 'text-emerald-600 dark:text-emerald-400'],
              ['xuat', item.xuat, 'text-amber-600 dark:text-amber-400'],
              ['chuyen', item.chuyen, ''],
            ] as const
          ).map(([key, val, cls]) => (
            <div key={key}>
              <div className="text-muted-foreground">{t(`tonKhoPhanThuoc.table.${key}`)}</div>
              <div className={cn('tabular-nums font-medium', cls)}>{so(val)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <TonKhoToolbar
          searchTerm={searchInput}
          onSearchChange={setSearchInput}
          columns={columns}
          onToggleColumn={toggleColumn}
          onReorderColumns={reorderColumns}
          onResetColumns={resetColumns}
          onResetColumnWidths={resetColumnWidths}
          filters={<ResponsiveFilterChips items={filterItems} />}
          activeFilterCount={activeFilterCount}
          onClearAllFilters={handleClearAllFilters}
          filterGroups={filterGroups}
          mobileFilterExtra={
            <MobileFilterField label={t('tonKhoPhanThuoc.filter.period')} icon={Calendar} active={kyKhacMacDinh}>
              <DateRangePicker
                inline
                presets={dateRangePresets}
                value={dateRangeValue}
                onChange={handleDateRangeChange}
                customPresetId={CUSTOM_PRESET_ID}
              />
            </MobileFilterField>
          }
          mobileFilterExtraCount={kyKhacMacDinh ? 1 : 0}
          onExport={handleExport}
        />

        <div className="flex-1 min-h-0 flex flex-col">
          <GenericTable<TonKhoPTProductAgg>
            data={rangeOk ? sortedList : []}
            columns={columns}
            onResizeColumn={resizeColumn}
            isLoading={isLoading}
            isFetching={isFetching && !isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            loadingText={t('common.loading')}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onToggleAll={toggleAllSelection}
            page={pagination.page}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            sort={sort}
            onSort={setSort}
            stickyLeftCount={2}
            renderCell={renderCell}
            renderSummaryRow={renderSummaryRow}
            renderMobileCard={renderMobileCard}
            keyExtractor={(item) => item.id_hang_hoa}
            onRowClick={setDetail}
            showActionsColumn={false}
            emptyTitle={rangeOk ? t('tonKhoPhanThuoc.empty') : t('tonKhoPhanThuoc.dateInvalid')}
            emptyDescription={rangeOk ? t('tonKhoPhanThuoc.emptyHint') : undefined}
            emptyAction={
              activeFilterCount > 0 ? (
                <button type="button" onClick={handleClearAllFilters} className="text-sm font-medium text-primary hover:underline">
                  {t('common.clearFilters', { count: activeFilterCount })}
                </button>
              ) : undefined
            }
          />
        </div>
      </div>

      {detail && (
        <TonKhoPTProductDetail
          agg={detail}
          ky={{ tu: filters.tu, den: filters.den }}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
};

export default TonSanPhamPTTab;
