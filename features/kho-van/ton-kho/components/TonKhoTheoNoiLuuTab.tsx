import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Package, Warehouse, Layers, History, FolderOpen } from 'lucide-react';
import { useAllTonKho, useLichSuNhapXuatByKho } from '../hooks/use-ton-kho';
import { useTonKhoTheoKho } from '../../phieu-kho/hooks/use-phieu-kho';
import { getKhoList } from '../../danh-sach-kho/services/kho-service';
import type { TonKhoRecord } from '../../phieu-kho/services/ton-kho-service';
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
import { useTonKhoByLocationStore } from '../store/useTonKhoStore';
import type { TonKhoFilters } from '../store/useTonKhoStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { getColumnCellStyle } from '../../../../store/createGenericStore';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { HangHoaRefLite } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import { BTN_CLOSE } from '../../../../lib/button-labels';
import { cn, formatDateTime } from '../../../../lib/utils';
import { TonKhoLoaiBadge } from './TonKhoLoaiBadge';

export type RowKho = {
  id_kho: string;
  ma_kho: string;
  ten_kho: string;
  so_mat_hang: number;
  tong_so_luong: number;
};

function useKhoRows(tonKhoListOverride?: TonKhoRecord[]) {
  const { data: tonKhoListRaw = [], isLoading, isFetchingOverlay } = useAllTonKho();
  const tonKhoList = tonKhoListOverride !== undefined ? tonKhoListOverride : tonKhoListRaw;
  const { data: khoList = [] } = useQuery<Kho[]>({
    queryKey: ['kho'],
    queryFn: getKhoList,
    staleTime: 1000 * 60 * 30,
  });
  const byKho = useMemo(() => {
    const totalByKho = new Map<string, number>();
    const idHangHoaByKho = new Map<string, Set<string>>();
    tonKhoList.forEach((r) => {
      totalByKho.set(r.id_kho, (totalByKho.get(r.id_kho) ?? 0) + r.so_luong);
      if (!idHangHoaByKho.has(r.id_kho)) idHangHoaByKho.set(r.id_kho, new Set());
      idHangHoaByKho.get(r.id_kho)!.add(r.id_hang_hoa);
    });
    const countByKho = new Map<string, number>();
    idHangHoaByKho.forEach((set, id_kho) => countByKho.set(id_kho, set.size));
    return { countByKho, totalByKho };
  }, [tonKhoList]);
  const khoMap = useMemo(() => {
    const m: Record<string, Kho> = {};
    khoList.forEach((k) => { m[k.id] = k; });
    return m;
  }, [khoList]);
  const rows: RowKho[] = useMemo(() => {
    const ids = new Set(tonKhoList.map((r) => r.id_kho));
    return Array.from(ids)
      .map((id_kho) => {
        const k = khoMap[id_kho];
        const count = byKho.countByKho.get(id_kho) ?? 0;
        const total = byKho.totalByKho.get(id_kho) ?? 0;
        return {
          id_kho,
          ma_kho: k?.ma_kho ?? id_kho,
          ten_kho: k?.ten_kho ?? id_kho,
          so_mat_hang: count,
          tong_so_luong: total,
        };
      })
      .sort((a, b) => b.tong_so_luong - a.tong_so_luong);
  }, [tonKhoList, khoMap, byKho]);
  return { rows, isLoading, isFetchingOverlay };
}

function KhoDetailDrawer({
  row,
  onClose,
}: {
  row: RowKho;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { id_kho, ma_kho, ten_kho, so_mat_hang, tong_so_luong } = row;
  const { data: tonRows = [], isLoading: loadingTonKho } = useTonKhoTheoKho(id_kho);
  const { data: hangHoaList = [] } = useHangHoaRefQuery();
  const { data: lichSu = [], isLoading: loadingLichSu } = useLichSuNhapXuatByKho(id_kho);
  const loading = loadingLichSu || loadingTonKho;
  const itemsAtKho = useMemo(() => {
    return tonRows.map((r) => ({ id_hang_hoa: r.id_hang_hoa, so_luong: r.so_luong }));
  }, [tonRows]);
  const hangHoaMap = useMemo(() => {
    const m: Record<string, HangHoaRefLite> = {};
    hangHoaList.forEach((h) => { m[h.id] = h; });
    return m;
  }, [hangHoaList]);

  return (
    <GenericDrawer
      title={t('tonKho.byLocation.detailTitle')}
      subtitle={`${ma_kho} - ${ten_kho}`}
      icon={<MapPin size={18} />}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/80 bg-gradient-to-br from-muted/40 to-muted/20 p-4 shadow-sm transition-shadow hover:shadow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Layers size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('tonKho.byLocation.detailItemsCount')}
                </p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                  {so_mat_hang.toLocaleString()}
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
                  {t('tonKho.byLocation.detailTotalQty')}
                </p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                  {tong_so_luong.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <GenericSubTableSection
          title={t('tonKho.byLocation.sectionProductsAtWarehouse')}
          icon={<Package size={14} className="text-primary" />}
          count={itemsAtKho.length}
          emptyTitle={t('tonKho.byLocation.empty')}
          maxTableHeight="320px"
        >
          {itemsAtKho.length > 0 && (
            <>
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">
                    {t('tonKho.byLocation.product')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px] text-right">
                    {t('tonKho.byLocation.quantity')}
                  </th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {itemsAtKho.map((r, idx) => {
                  const h = hangHoaMap[r.id_hang_hoa];
                  return (
                    <tr key={r.id_hang_hoa} className="hover:bg-muted/60 transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-2.5 flex items-center gap-2">
                        <Package size={14} className="text-muted-foreground shrink-0" />
                        {h ? `${h.ma_hang} - ${h.ten_hang}` : r.id_hang_hoa}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                        {r.so_luong.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </>
          )}
        </GenericSubTableSection>

        <GenericSubTableSection
          title={t('tonKho.byLocation.sectionHistory')}
          icon={<History size={14} className="text-primary" />}
          count={lichSu.length}
          emptyTitle={t('tonKho.byLocation.emptyHistory')}
          loading={loading}
          loadingText={t('tonKho.loading')}
          maxTableHeight="280px"
        >
          {lichSu.length > 0 && (
            <>
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">{t('tonKho.history.dateTime')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('tonKho.history.voucherNo')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[80px]">{t('tonKho.history.type')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">{t('tonKho.byLocation.product')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('tonKho.history.warehouseFrom')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('tonKho.history.warehouseTo')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[72px] text-right">{t('tonKho.history.quantity')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[56px]">{t('tonKho.history.unit')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs text-left min-w-[min(420px,38vw)] w-[38%]">{t('tonKho.history.note')}</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {lichSu.map((row) => (
                  <tr key={row.id_chi_tiet} className="hover:bg-muted/60 transition-colors">
                    <td className="px-4 py-2.5 text-sm tabular-nums">{formatDateTime(row.tg_tao ?? row.ngay) || '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{row.so_phieu}</td>
                    <td className="px-4 py-2.5">
                      <TonKhoLoaiBadge loai={row.loai} />
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">
                      {row.ma_hang && row.ten_hang ? `${row.ma_hang} - ${row.ten_hang}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{row.ten_kho ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{row.ten_kho_den ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">{row.so_luong.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.don_vi_tinh ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground align-top min-w-[min(420px,38vw)] w-[38%] max-w-[min(560px,42vw)] whitespace-normal break-words">
                      {row.ghi_chu ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </GenericSubTableSection>
      </div>
    </GenericDrawer>
  );
}

const TonKhoTheoNoiLuuTab: React.FC = () => {
  const { t } = useTranslation();
  const [detailKho, setDetailKho] = useState<RowKho | null>(null);
  const searchTerm = useTonKhoByLocationStore((s) => s.searchTerm);
  const commitSearchTerm = useTonKhoByLocationStore((s) => s.commitSearchTerm);
  const filters = useTonKhoByLocationStore((s) => s.filters);
  const setFilter = useTonKhoByLocationStore((s) => s.setFilter);
  const columns = useTonKhoByLocationStore((s) => s.columns);
  const toggleColumn = useTonKhoByLocationStore((s) => s.toggleColumn);
  const reorderColumns = useTonKhoByLocationStore((s) => s.reorderColumns);
  const resetColumns = useTonKhoByLocationStore((s) => s.resetColumns);
  const pagination = useTonKhoByLocationStore((s) => s.pagination);
  const setPage = useTonKhoByLocationStore((s) => s.setPage);
  const setPageSize = useTonKhoByLocationStore((s) => s.setPageSize);
  const resetState = useTonKhoByLocationStore((s) => s.resetState);

  const { inputValue: searchInput, setInputValue: setSearchInput } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });

  const { rows, isLoading, isFetchingOverlay } = useKhoRows();

  const filterFn = useCallback((item: RowKho, term: string, f: TonKhoFilters) => {
    if (term.trim()) {
      const s = term.toLowerCase();
      if (!item.ma_kho.toLowerCase().includes(s) && !item.ten_kho.toLowerCase().includes(s)) return false;
    }
    if ((f.warehouseIds?.length ?? 0) > 0 && !f.warehouseIds!.includes(item.id_kho)) return false;
    return true;
  }, []);

  const filteredList = useListWithFilter(rows, searchTerm, filters, filterFn);

  const warehouseOptions = useMemo(
    () =>
      rows.map((r) => ({
        label: r.ten_kho,
        value: r.id_kho,
        count: 1,
      })),
    [rows]
  );
  const activeFilterCount = filters.warehouseIds?.length ?? 0;
  const handleClearAllFilters = useCallback(() => setFilter('warehouseIds', []), [setFilter]);
  const renderFilters = (
    <FilterChipMultiSelect
      options={warehouseOptions}
      value={filters.warehouseIds ?? []}
      onChange={(val) => setFilter('warehouseIds', val)}
      placeholder={t('tonKho.byLocation.warehouse')}
      icon={FolderOpen}
      className="w-full sm:w-[180px]"
    />
  );
  const filterGroups = useMemo(
    () => [
      {
        key: 'warehouseIds',
        label: t('tonKho.byLocation.warehouse'),
        icon: FolderOpen,
        options: warehouseOptions,
        value: filters.warehouseIds ?? [],
        onChange: (val: string[]) => setFilter('warehouseIds', val),
      },
    ],
    [t, warehouseOptions, filters.warehouseIds, setFilter]
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

  const renderCell = (item: RowKho, col: ColumnConfig) => {
    switch (col.id) {
      case 'ma_kho':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
              {item.ma_kho}
            </span>
          </td>
        );
      case 'ten_kho':
        return (
          <td key={col.id} className="px-4 py-3" style={getColumnCellStyle(col)}>
            <span className="font-medium text-foreground">{item.ten_kho}</span>
          </td>
        );
      case 'so_mat_hang':
        return (
          <td key={col.id} className="px-4 py-3 text-right tabular-nums" style={getColumnCellStyle(col)}>
            {item.so_mat_hang.toLocaleString()}
          </td>
        );
      case 'tong_so_luong':
        return (
          <td key={col.id} className="px-4 py-3 text-right font-medium tabular-nums" style={getColumnCellStyle(col)}>
            {item.tong_so_luong.toLocaleString()}
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
          searchPlaceholder={t('tonKho.byLocation.searchPlaceholder')}
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
                icon={<MapPin size={40} className="text-muted-foreground opacity-20" />}
                title={t('tonKho.byLocation.empty')}
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
                        const isNumeric = col.id === 'so_mat_hang' || col.id === 'tong_so_luong';
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
                        key={item.id_kho}
                        className={cn('group hover:bg-muted/50 transition-colors cursor-pointer')}
                        onClick={() => setDetailKho(item)}
                        onKeyDown={(e) => e.key === 'Enter' && setDetailKho(item)}
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

      {detailKho && (
        <KhoDetailDrawer row={detailKho} onClose={() => setDetailKho(null)} />
      )}
    </div>
  );
};

export default TonKhoTheoNoiLuuTab;
