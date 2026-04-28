import React, { useMemo, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Package, MapPin } from 'lucide-react';
import { useAllTonKho } from '../hooks/use-ton-kho';
import { getKhoList } from '../../danh-sach-kho/services/kho-service';
import { useQuery } from '@tanstack/react-query';
import { useHangHoaRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
const StatsCharts = lazy(() => import('./stats/StatsCharts'));
import StatsTables from './stats/StatsTables';
import { computeTonKhoStats } from './stats/useTonKhoStats';
import type { Kho } from '../../danh-sach-kho/core/types';

const TonKhoThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: tonKhoListRaw = [], isLoading, isError } = useAllTonKho();
  const { data: khoList = [] } = useQuery<Kho[]>({
    queryKey: ['kho'],
    queryFn: getKhoList,
    staleTime: 1000 * 60 * 30,
  });
  const { data: hangHoaList = [] } = useHangHoaRefQuery();

  const [filterWarehouseIds, setFilterWarehouseIds] = useState<string[]>([]);

  const filteredTonKho = useMemo(() => {
    if ((filterWarehouseIds?.length ?? 0) === 0) return tonKhoListRaw;
    const set = new Set(filterWarehouseIds);
    return tonKhoListRaw.filter((r) => set.has(r.id_kho));
  }, [tonKhoListRaw, filterWarehouseIds]);

  const stats = useMemo(
    () => computeTonKhoStats(filteredTonKho, khoList, hangHoaList),
    [filteredTonKho, khoList, hangHoaList]
  );

  const warehouseOptions = useMemo(() => {
    const countByKho: Record<string, number> = {};
    tonKhoListRaw.forEach((r) => {
      countByKho[r.id_kho] = (countByKho[r.id_kho] ?? 0) + 1;
    });
    return khoList.map((k) => ({
      label: k.ten_kho,
      value: k.id,
      count: countByKho[k.id] ?? 0,
    }));
  }, [tonKhoListRaw, khoList]);

  const activeFilterCount = filterWarehouseIds?.length ?? 0;
  const handleClearFilters = () => setFilterWarehouseIds([]);

  const filterGroups = useMemo(
    () => [
      {
        key: 'warehouseIds',
        label: t('tonKho.byLocation.warehouse'),
        icon: MapPin,
        options: warehouseOptions,
        value: filterWarehouseIds ?? [],
        onChange: (val: string[]) => setFilterWarehouseIds(val),
      },
    ],
    [t, warehouseOptions, filterWarehouseIds]
  );

  const renderFilters = (
    <FilterChipMultiSelect
      options={warehouseOptions}
      value={filterWarehouseIds ?? []}
      onChange={setFilterWarehouseIds}
      placeholder={t('tonKho.byLocation.warehouse')}
      icon={MapPin}
      className="w-full sm:w-[180px]"
      size="md"
    />
  );

  const handleExportReport = () => {
    if (!stats || (stats.byWarehouse.length === 0 && stats.topProducts.length === 0)) {
      toast.info(t('tonKho.stats.noData'));
      return;
    }
    toast.info(t('tonKho.stats.exportReport') + ' – Đang phát triển');
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">
          {t('common.error') || 'Có lỗi khi tải dữ liệu.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText
            text={t('tonKho.stats.loading')}
            centered
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-4 animate-pulse"
              >
                <div className="h-10 w-10 rounded-lg bg-muted/60 mb-3" />
                <div className="h-4 bg-muted/60 rounded w-2/3 mb-2" />
                <div className="h-6 bg-muted/60 rounded w-1/2" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border border-border p-4 h-[260px] animate-pulse">
              <div className="h-4 bg-muted/60 rounded w-1/3 mb-3" />
              <div className="h-[200px] bg-muted/30 rounded" />
            </div>
            <div className="bg-card rounded-xl border border-border p-4 h-[260px] animate-pulse">
              <div className="h-4 bg-muted/60 rounded w-1/3 mb-3" />
              <div className="h-[200px] bg-muted/30 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !stats || (stats.summary.totalStock === 0 && stats.byWarehouse.length === 0 && stats.topProducts.length === 0);

  return (
    <div className="flex flex-col h-full min-h-0">
      <StatsToolbar
        className="static z-auto"
        filters={renderFilters}
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        onExportReport={handleExportReport}
        onPrintReport={handlePrintReport}
      />
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {isEmpty ? (
            <EmptyState
              title={t('tonKho.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('tonKho.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('tonKho.stats.noDataHint')
              }
              icon={<Package size={40} className="text-muted-foreground opacity-20" />}
              action={
                activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {t('common.clearFilters', { count: activeFilterCount })}
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <StatsCards summary={stats.summary} />
              <Suspense fallback={<LoadingSpinnerWithText text={t('common.loading')} className="py-8" centered />}>
                <StatsCharts byWarehouse={stats.byWarehouse} topProducts={stats.topProducts} />
              </Suspense>
              <StatsTables byWarehouse={stats.byWarehouse} topProducts={stats.topProducts} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TonKhoThongKeTab;
