import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Warehouse, History, AlertTriangle, FolderOpen } from 'lucide-react';
import { useAllTonKho, useDinhMucTonKho } from '../hooks/use-ton-kho';
import { useTonKhoTheoHangHoa, useLichSuNhapXuatByHangHoa } from '../hooks/use-ton-kho';
import { dinhMucKey } from '../../phieu-kho/services/ton-kho-service';
import type { TonKhoRecord } from '../../phieu-kho/services/ton-kho-service';
import { getKhoList } from '../../danh-sach-kho/services/kho-service';
import { useQuery } from '@tanstack/react-query';
import { useHangHoaRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import TonKhoToolbar from './TonKhoToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useSearchInputCommit } from '../../../../lib/hooks/use-search-input-commit';
import { useTonKhoByProductStore } from '../store/useTonKhoStore';
import type { TonKhoFilters } from '../store/useTonKhoStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { getColumnCellStyle } from '../../../../store/createGenericStore';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import type { HangHoaRefLite } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import type { LichSuNhapXuatRow } from '../../phieu-kho/services/phieu-kho-service';
import { BTN_CLOSE } from '../../../../lib/button-labels';
import { cn, formatDateTime } from '../../../../lib/utils';
import { TonKhoLoaiBadge } from './TonKhoLoaiBadge';

function lichSuRowTouchesKho(row: LichSuNhapXuatRow, idKho: string): boolean {
  if (row.loai === 'chuyển') {
    return row.kho_id === idKho || (row.kho_den_id != null && row.kho_den_id === idKho);
  }
  return row.kho_id === idKho;
}

export type RowProduct = {
  id_hang_hoa: string;
  ma_hang: string;
  ten_hang: string;
  ten_danh_muc?: string;
  don_vi_tinh: string;
  tong_so_luong: number;
  ton_toi_thieu?: number | null;
  canh_bao: boolean;
};

function useProductRows(tonKhoListOverride?: TonKhoRecord[]) {
  const { data: tonKhoListRaw = [], isLoading: tonLoading, isFetchingOverlay: tonFetching } = useAllTonKho();
  const tonKhoList = tonKhoListOverride !== undefined ? tonKhoListOverride : tonKhoListRaw;
  const { data: dinhMucMap, isLoading: loadingDinhMuc } = useDinhMucTonKho();
  const { data: hangHoaList = [] } = useHangHoaRefQuery();
  const byProduct = useMemo(() => {
    const map = new Map<string, number>();
    tonKhoList.forEach((r) => {
      map.set(r.id_hang_hoa, (map.get(r.id_hang_hoa) ?? 0) + r.so_luong);
    });
    return map;
  }, [tonKhoList]);
  const hangHoaMap = useMemo(() => {
    const m: Record<string, HangHoaRefLite> = {};
    hangHoaList.forEach((h) => { m[h.id] = h; });
    return m;
  }, [hangHoaList]);
  const rows: RowProduct[] = useMemo(() => {
    const ids = new Set(byProduct.keys());
    const map = dinhMucMap ?? new Map<string, number>();
    return Array.from(ids)
      .map((id_hang_hoa) => {
        const h = hangHoaMap[id_hang_hoa];
        const tong_so_luong = byProduct.get(id_hang_hoa) ?? 0;
        const tonByKho = tonKhoList.filter((r) => r.id_hang_hoa === id_hang_hoa);
        let ton_toi_thieu: number | null = null;
        let canh_bao = false;
        tonByKho.forEach((r) => {
          const dm = map.get(dinhMucKey(r.id_kho, id_hang_hoa));
          if (dm != null) {
            if (ton_toi_thieu == null || dm < ton_toi_thieu) ton_toi_thieu = dm;
            if (r.so_luong < dm) canh_bao = true;
          }
        });
        return {
          id_hang_hoa,
          ma_hang: h?.ma_hang ?? id_hang_hoa,
          ten_hang: h?.ten_hang ?? '—',
          ten_danh_muc: h?.ten_danh_muc ?? undefined,
          don_vi_tinh: h?.don_vi_tinh ?? '—',
          tong_so_luong,
          ton_toi_thieu: ton_toi_thieu ?? undefined,
          canh_bao,
        };
      })
      .filter((r) => r.tong_so_luong !== 0)
      .sort((a, b) => b.tong_so_luong - a.tong_so_luong);
  }, [byProduct, hangHoaMap, tonKhoList, dinhMucMap]);
  return {
    rows,
    isLoading: tonLoading || loadingDinhMuc,
    isFetchingOverlay: tonFetching && !loadingDinhMuc,
  };
}

function ProductDetailDrawer({
  row,
  onClose,
}: {
  row: RowProduct;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { id_hang_hoa, ma_hang, ten_hang, tong_so_luong, ton_toi_thieu, canh_bao } = row;
  const { data: byKho = [], isLoading: loadingTonKho } = useTonKhoTheoHangHoa(id_hang_hoa);
  const { data: lichSu = [], isLoading: loadingLichSu } = useLichSuNhapXuatByHangHoa(id_hang_hoa);
  const [selectedKhoId, setSelectedKhoId] = useState<string | null>(null);
  useEffect(() => {
    setSelectedKhoId(null);
  }, [id_hang_hoa]);
  const lichSuFiltered = useMemo(() => {
    if (!selectedKhoId) return lichSu;
    return lichSu.filter((r) => lichSuRowTouchesKho(r, selectedKhoId));
  }, [lichSu, selectedKhoId]);
  const { data: khoList = [] } = useQuery({ queryKey: ['kho'], queryFn: getKhoList });
  const khoMap = useMemo(() => {
    const m: Record<string, string> = {};
    khoList.forEach((k) => { m[k.id] = k.ten_kho; });
    return m;
  }, [khoList]);
  const loading = loadingTonKho || loadingLichSu;

  return (
    <GenericDrawer
      title={t('tonKho.byProduct.detailTitle')}
      subtitle={`${ma_hang} - ${ten_hang}`}
      icon={<Package size={18} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={
        <div className="flex justify-start w-full">
          <Button variant="outline" onClick={onClose} className="border-border">
            {BTN_CLOSE()}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/80 bg-gradient-to-br from-muted/40 to-muted/20 p-4 shadow-sm transition-shadow hover:shadow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Package size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('tonKho.byProduct.detailMinStock')}
                </p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                  {ton_toi_thieu != null ? ton_toi_thieu.toLocaleString() : '—'}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border/80 bg-gradient-to-br from-muted/40 to-muted/20 p-4 shadow-sm transition-shadow hover:shadow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Warehouse size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('tonKho.byProduct.detailCurrentStock')}
                </p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                  {tong_so_luong.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className={cn(
            'rounded-xl border p-4 shadow-sm transition-shadow hover:shadow',
            canh_bao
              ? 'border-amber-300/80 bg-gradient-to-br from-amber-50/80 to-amber-100/40 dark:from-amber-950/30 dark:to-amber-900/20'
              : 'border-border/80 bg-gradient-to-br from-muted/40 to-muted/20'
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                canh_bao ? 'bg-amber-500/15' : 'bg-muted'
              )}>
                <AlertTriangle size={18} className={canh_bao ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('tonKho.byProduct.detailAlert')}
                </p>
                <p className="mt-1">
                  {canh_bao ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30 text-xs font-semibold">
                      <AlertTriangle size={12} />
                      {t('tonKho.byProduct.filterBelowMin')}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">—</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        {ton_toi_thieu != null && ton_toi_thieu > 0 && (
          <div className="rounded-xl border border-border/80 bg-card/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {t('tonKho.byProduct.detailMinStock')} / {t('tonKho.byProduct.detailCurrentStock')}
            </p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  canh_bao ? 'bg-amber-500' : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, (tong_so_luong / ton_toi_thieu) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
              {tong_so_luong.toLocaleString()} / {ton_toi_thieu.toLocaleString()}
              {canh_bao && (
                <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                  ({(Math.max(0, ton_toi_thieu - tong_so_luong)).toLocaleString()} {t('tonKho.byProduct.detailShort')})
                </span>
              )}
            </p>
          </div>
        )}
        <GenericSubTableSection
          title={t('tonKho.byProduct.sectionStockByLocation')}
          icon={<Warehouse size={14} className="text-primary" />}
          count={byKho.length}
          emptyTitle={t('tonKho.byProduct.empty')}
          loading={loading}
          loadingText={t('tonKho.loading')}
          maxTableHeight="240px"
        >
          {byKho.length > 0 && (
            <>
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[180px]">{t('tonKho.byProduct.warehouse')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px] text-right">{t('tonKho.byProduct.quantity')}</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {byKho.map((r, idx) => (
                  <tr
                    key={r.id_kho}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'transition-colors cursor-pointer',
                      selectedKhoId === r.id_kho
                        ? 'bg-primary/10 ring-1 ring-inset ring-primary/25'
                        : 'hover:bg-muted/60'
                    )}
                    onClick={() => setSelectedKhoId((prev) => (prev === r.id_kho ? null : r.id_kho))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedKhoId((prev) => (prev === r.id_kho ? null : r.id_kho));
                      }
                    }}
                  >
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-2.5 flex items-center gap-2">
                      <Warehouse size={14} className="text-muted-foreground shrink-0" />
                      {khoMap[r.id_kho] ?? r.id_kho}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">{r.so_luong.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </GenericSubTableSection>

        <GenericSubTableSection
          title={t('tonKho.byProduct.sectionHistory')}
          icon={<History size={14} className="text-primary" />}
          count={lichSuFiltered.length}
          emptyTitle={lichSu.length === 0 ? t('tonKho.byProduct.emptyHistory') : t('tonKho.byProduct.historyFilteredEmpty')}
          loading={loading}
          loadingText={t('tonKho.loading')}
          maxTableHeight="280px"
        >
          {lichSu.length > 0 && lichSuFiltered.length > 0 ? (
            <>
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">{t('tonKho.history.dateTime')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('tonKho.history.voucherNo')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[80px]">{t('tonKho.history.type')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[120px]">{t('tonKho.history.warehouseFrom')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[120px]">{t('tonKho.history.warehouseTo')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[72px] text-right">{t('tonKho.history.quantity')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[56px]">{t('tonKho.history.unit')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs text-left min-w-[min(420px,38vw)] w-[38%]">{t('tonKho.history.note')}</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {lichSuFiltered.map((histRow) => (
                  <tr key={histRow.id_chi_tiet} className="hover:bg-muted/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm tabular-nums">
                      {formatDateTime(histRow.tg_tao ?? histRow.ngay) || '—'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{histRow.so_phieu}</td>
                    <td className="px-4 py-2.5">
                      <TonKhoLoaiBadge loai={histRow.loai} />
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{histRow.ten_kho ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{histRow.ten_kho_den ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">{histRow.so_luong.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{histRow.don_vi_tinh ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground align-top min-w-[min(420px,38vw)] w-[38%] max-w-[min(560px,42vw)] whitespace-normal break-words">
                      {histRow.ghi_chu ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : null}
        </GenericSubTableSection>
      </div>
    </GenericDrawer>
  );
}

const TonKhoTheoSanPhamTab: React.FC = () => {
  const { t } = useTranslation();
  const [detailProduct, setDetailProduct] = useState<RowProduct | null>(null);
  const searchTerm = useTonKhoByProductStore((s) => s.searchTerm);
  const commitSearchTerm = useTonKhoByProductStore((s) => s.commitSearchTerm);
  const filters = useTonKhoByProductStore((s) => s.filters);
  const setFilter = useTonKhoByProductStore((s) => s.setFilter);
  const resetFilters = useTonKhoByProductStore((s) => s.resetFilters);
  const columns = useTonKhoByProductStore((s) => s.columns);
  const toggleColumn = useTonKhoByProductStore((s) => s.toggleColumn);
  const reorderColumns = useTonKhoByProductStore((s) => s.reorderColumns);
  const resetColumns = useTonKhoByProductStore((s) => s.resetColumns);
  const pagination = useTonKhoByProductStore((s) => s.pagination);
  const setPage = useTonKhoByProductStore((s) => s.setPage);
  const setPageSize = useTonKhoByProductStore((s) => s.setPageSize);
  const resetState = useTonKhoByProductStore((s) => s.resetState);

  const { inputValue: searchInput, setInputValue: setSearchInput } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });

  const { rows, isLoading, isFetchingOverlay } = useProductRows();

  const filterFn = useCallback((item: RowProduct, term: string, f: TonKhoFilters) => {
    if (term.trim()) {
      const s = term.toLowerCase();
      if (!item.ma_hang.toLowerCase().includes(s) && !item.ten_hang.toLowerCase().includes(s)) return false;
    }
    if (f.belowMinStock?.includes('Yes') && !item.canh_bao) return false;
    if ((f.categoryIds?.length ?? 0) > 0) {
      const cat = item.ten_danh_muc ?? '';
      if (!f.categoryIds!.includes(cat)) return false;
    }
    return true;
  }, []);

  const filteredList = useListWithFilter(rows, searchTerm, filters, filterFn);

  const belowMinCount = useMemo(() => rows.filter((r) => r.canh_bao).length, [rows]);
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
  const activeFilterCount = (filters.belowMinStock?.length ?? 0) + (filters.categoryIds?.length ?? 0);
  const handleClearAllFilters = useCallback(() => {
    setFilter('belowMinStock', []);
    setFilter('categoryIds', []);
  }, [setFilter]);
  const belowMinOptions = useMemo(
    () => [{ label: t('tonKho.byProduct.filterBelowMin'), value: 'Yes', count: belowMinCount }],
    [t, belowMinCount]
  );
  const renderFilters = (
    <div className="flex flex-wrap items-center gap-2">
      <FilterChipMultiSelect
        options={belowMinOptions}
        value={filters.belowMinStock ?? []}
        onChange={(val) => setFilter('belowMinStock', val)}
        placeholder={t('tonKho.byProduct.filterBelowMin')}
        className="w-full sm:w-[150px]"
      />
      <FilterChipMultiSelect
        options={categoryOptions}
        value={filters.categoryIds ?? []}
        onChange={(val) => setFilter('categoryIds', val)}
        placeholder={t('tonKho.byProduct.category')}
        className="w-full sm:w-[160px]"
      />
    </div>
  );
  const filterGroups = useMemo(
    () => [
      {
        key: 'belowMinStock',
        label: t('tonKho.byProduct.alert'),
        icon: AlertTriangle,
        options: belowMinOptions,
        value: filters.belowMinStock ?? [],
        onChange: (val: string[]) => setFilter('belowMinStock', val),
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
    [t, belowMinOptions, categoryOptions, filters.belowMinStock, filters.categoryIds, setFilter]
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
  const paginatedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return filteredList.slice(start, start + pagination.pageSize);
  }, [filteredList, pagination.page, pagination.pageSize]);

  const renderCell = (item: RowProduct, col: ColumnConfig) => {
    switch (col.id) {
      case 'ma_hang':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
              {item.ma_hang}
            </span>
          </td>
        );
      case 'ten_hang':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="font-medium text-foreground">{item.ten_hang}</span>
          </td>
        );
      case 'tong_so_luong':
        return (
          <td key={col.id} className="px-4 py-3 text-right" style={getColumnCellStyle(col)}>
            <span className="font-medium">{item.tong_so_luong.toLocaleString()}</span>
          </td>
        );
      case 'ten_danh_muc':
        return (
          <td key={col.id} className="px-4 py-3 text-muted-foreground" style={getColumnCellStyle(col)}>
            {item.ten_danh_muc ?? '—'}
          </td>
        );
      case 'ton_toi_thieu':
        return (
          <td key={col.id} className="px-4 py-3 text-right tabular-nums" style={getColumnCellStyle(col)}>
            {item.ton_toi_thieu != null ? item.ton_toi_thieu.toLocaleString() : '—'}
          </td>
        );
      case 'canh_bao':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            {item.canh_bao ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-medium">
                {t('tonKho.byProduct.filterBelowMin')}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </td>
        );
      case 'don_vi_tinh':
        return (
          <td key={col.id} className="px-4 py-3 text-muted-foreground" style={getColumnCellStyle(col)}>
            {item.don_vi_tinh}
          </td>
        );
      default:
        return <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)} />;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <TonKhoToolbar
          searchTerm={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder={t('tonKho.byProduct.searchPlaceholder')}
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
          {isFetchingOverlay && !isLoading ? (
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
          {isLoading ? (
            <ListPageSkeleton
              loadingText={t('tonKho.loading')}
              tableColumns={visibleColumns.length}
              tableRowCount={8}
              tableColumnWithSubline={0}
              cardCount={0}
            />
          ) : filteredList.length === 0 ? (
            <div className="flex-1 min-h-0 flex items-center justify-center p-4">
              <EmptyState
                icon={<Package size={40} className="text-muted-foreground opacity-20" />}
                title={t('tonKho.byProduct.empty')}
                description={t('tonKho.emptyHint')}
              />
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-muted/95 border-b border-border">
                    <tr>
                      {visibleColumns.map((col) => {
                        const isNumeric = col.id === 'tong_so_luong' || col.id === 'ton_toi_thieu';
                        return (
                          <th
                            key={col.id}
                            className={cn(
                              'px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap',
                              isNumeric && 'text-right'
                            )}
                            style={getColumnCellStyle(col)}
                          >
                            {col.label}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border">
                    {paginatedData.map((item) => (
                      <tr
                        key={item.id_hang_hoa}
                        className={cn('group hover:bg-muted/50 transition-colors cursor-pointer')}
                        onClick={() => setDetailProduct(item)}
                        onKeyDown={(e) => e.key === 'Enter' && setDetailProduct(item)}
                        role="button"
                        tabIndex={0}
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

      {detailProduct && (
        <ProductDetailDrawer row={detailProduct} onClose={() => setDetailProduct(null)} />
      )}
    </div>
  );
};

export default TonKhoTheoSanPhamTab;
