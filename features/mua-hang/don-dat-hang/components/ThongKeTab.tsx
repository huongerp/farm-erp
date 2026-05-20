import React, { useMemo, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { User, Calendar, Building2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useDoiTacRefQuery, useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { getAllDonDatHangSupabase, fetchDonDatHangThongKeFromRpc, fetchChiTietForCategoryStatsSupabase } from '../services/don-dat-hang-supabase.service';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { computeDonDatHangStats, computeDonDatHangCategoryStats } from './stats/useDonDatHangStats';
import { TRANG_THAI_DON_DAT_HANG, TRANG_THAI_KEY } from '../core/constants';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
const StatsCharts = lazy(() => import('./stats/StatsCharts'));
import StatsTables from './stats/StatsTables';
import type { DonDatHang } from '../core/types';

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: supplierList = [] } = useDoiTacRefQuery('nha_cung_cap');
  const { data: employees = [] } = useEmployeesRefQuery();

  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSupplier, setFilterSupplier] = useState<string[]>([]);
  const [filterBuyer, setFilterBuyer] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: thongKe, isLoading, isError } = useQuery({
    queryKey: ['donDatHang', 'thongKe', filterStatus, filterSupplier, filterBuyer, dateFrom, dateTo],
    queryFn: async () => {
      const rpc = await fetchDonDatHangThongKeFromRpc({
        dateFrom,
        dateTo,
        filterStatus,
        filterSupplier,
        filterBuyer,
      });
      if (rpc) return { kind: 'rpc' as const, rpc };
      const list = await getAllDonDatHangSupabase();
      const filteredList = list.filter((d: DonDatHang) => {
        const matchStatus = filterStatus.length === 0 || filterStatus.includes(String(d.trang_thai));
        const matchSupplier = filterSupplier.length === 0 || filterSupplier.includes(d.id_nha_cung_cap);
        const matchBuyer = filterBuyer.length === 0 || filterBuyer.includes(d.id_nguoi_dat);
        const matchFrom = !dateFrom || (d.ngay_dat && d.ngay_dat >= dateFrom);
        const matchTo = !dateTo || (d.ngay_dat && d.ngay_dat <= dateTo);
        return matchStatus && matchSupplier && matchBuyer && matchFrom && matchTo;
      });
      return { kind: 'fallback' as const, list, filteredList };
    },
    staleTime: 60_000,
  });

  const { data: categoryRows } = useQuery({
    queryKey: ['donDatHang', 'categoryStats', filterStatus, filterSupplier, filterBuyer, dateFrom, dateTo],
    queryFn: () =>
      fetchChiTietForCategoryStatsSupabase({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        filterStatus: filterStatus.length ? filterStatus : undefined,
        filterSupplier: filterSupplier.length ? filterSupplier : undefined,
        filterBuyer: filterBuyer.length ? filterBuyer : undefined,
      }),
    staleTime: 60_000,
  });

  const categoryStats = useMemo(
    () => (categoryRows ? computeDonDatHangCategoryStats(categoryRows) : null),
    [categoryRows]
  );

  const stats = useMemo(() => {
    if (!thongKe) return null;
    if (thongKe.kind === 'rpc') {
      const r = thongKe.rpc;
      return {
        summary: r.summary,
        byTrangThai: r.byTrangThai,
        bySupplier: r.bySupplier,
        byBuyer: r.byBuyer,
        byMonth: r.byMonth,
      };
    }
    return computeDonDatHangStats(thongKe.filteredList);
  }, [thongKe]);

  const statusCounts = useMemo(() => {
    if (!thongKe) return {} as Record<string, number>;
    if (thongKe.kind === 'rpc') return thongKe.rpc.chipByTrangThai;
    const m: Record<string, number> = {};
    thongKe.list.forEach((d) => {
      m[String(d.trang_thai)] = (m[String(d.trang_thai)] ?? 0) + 1;
    });
    return m;
  }, [thongKe]);

  const supplierCounts = useMemo(() => {
    if (!thongKe) return {} as Record<string, number>;
    if (thongKe.kind === 'rpc') {
      const o = thongKe.rpc.chipBySupplierId;
      const m: Record<string, number> = {};
      Object.entries(o).forEach(([k, v]) => { m[String(k)] = Number(v) || 0; });
      return m;
    }
    const m: Record<string, number> = {};
    thongKe.list.forEach((d) => {
      m[d.id_nha_cung_cap] = (m[d.id_nha_cung_cap] ?? 0) + 1;
    });
    return m;
  }, [thongKe]);

  const buyerCounts = useMemo(() => {
    if (!thongKe) return {} as Record<string, number>;
    if (thongKe.kind === 'rpc') {
      const o = thongKe.rpc.chipByBuyerId;
      const m: Record<string, number> = {};
      Object.entries(o).forEach(([k, v]) => { m[String(k)] = Number(v) || 0; });
      return m;
    }
    const m: Record<string, number> = {};
    thongKe.list.forEach((d) => {
      m[d.id_nguoi_dat] = (m[d.id_nguoi_dat] ?? 0) + 1;
    });
    return m;
  }, [thongKe]);

  const statusOptions = useMemo(
    () =>
      TRANG_THAI_DON_DAT_HANG.map((s) => ({
        label: t(`donDatHang.status.${TRANG_THAI_KEY[s]}`),
        value: s,
        subLabel: undefined as string | undefined,
        count: statusCounts[s] ?? 0,
      })),
    [t, statusCounts]
  );
  const supplierOptions = useMemo(
    () =>
      supplierList.map((d) => ({
        label: d.ten_ncc,
        value: d.id,
        subLabel: d.ma_ncc,
        count: supplierCounts[d.id] ?? 0,
      })),
    [supplierList, supplierCounts]
  );
  const buyerOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
        count: buyerCounts[e.id] ?? 0,
      })),
    [employees, buyerCounts]
  );

  const activeFilterCount =
    filterStatus.length +
    filterSupplier.length +
    filterBuyer.length +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);
  const handleClearFilters = () => {
    setFilterStatus([]);
    setFilterSupplier([]);
    setFilterBuyer([]);
    setDateFrom('');
    setDateTo('');
  };

  const filterGroups = useMemo(
    () => [
      { key: 'status', label: t('common.status'), icon: Tag, options: statusOptions, value: filterStatus, onChange: setFilterStatus },
      { key: 'supplier', label: t('donDatHang.form.supplier'), icon: Building2, options: supplierOptions, value: filterSupplier, onChange: setFilterSupplier },
      { key: 'buyer', label: t('donDatHang.form.buyer'), icon: User, options: buyerOptions, value: filterBuyer, onChange: setFilterBuyer },
    ],
    [t, statusOptions, supplierOptions, buyerOptions, filterStatus, filterSupplier, filterBuyer]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filterStatus}
        onChange={setFilterStatus}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('donDatHang.stats.dateFrom')}
        />
      </div>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('donDatHang.stats.dateTo')}
        />
      </div>
      <FilterChipMultiSelect
        options={supplierOptions}
        value={filterSupplier}
        onChange={setFilterSupplier}
        placeholder={t('donDatHang.form.supplier')}
        icon={Building2}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={buyerOptions}
        value={filterBuyer}
        onChange={setFilterBuyer}
        placeholder={t('donDatHang.form.buyer')}
        icon={User}
        className="w-full sm:w-[180px]"
        size="md"
      />
    </>
  );

  const handleExportReport = () => {
    toast.info(t('donDatHang.stats.exportReport') + ' – Đang phát triển');
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{t('donDatHang.stats.loadError')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText text={t('donDatHang.stats.loading')} centered />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-2.5 animate-pulse">
                <div className="h-12 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !stats || stats.summary.total === 0;

  return (
    <div className="flex flex-col h-full">
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
              title={t('donDatHang.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('donDatHang.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('donDatHang.stats.noDataHint')
              }
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
              <h3 className="text-sm font-semibold text-primary">{t('donDatHang.stats.title')}</h3>
              <StatsCards summary={stats!.summary} />
              <Suspense fallback={<LoadingSpinnerWithText text={t('common.loading')} className="py-8" centered />}>
                <StatsCharts
                  byTrangThai={stats!.byTrangThai}
                  bySupplier={stats!.bySupplier}
                  byBuyer={stats!.byBuyer}
                  byMonth={stats!.byMonth}
                  byDanhMucCap1={categoryStats?.byDanhMucCap1}
                  byDanhMucCap2={categoryStats?.byDanhMucCap2}
                  byPhanLoai={categoryStats?.byPhanLoai}
                />
              </Suspense>
              <StatsTables
                byTrangThai={stats!.byTrangThai}
                bySupplier={stats!.bySupplier}
                byBuyer={stats!.byBuyer}
                byDanhMucCap1={categoryStats?.byDanhMucCap1}
                byDanhMucCap2={categoryStats?.byDanhMucCap2}
                byPhanLoai={categoryStats?.byPhanLoai}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
