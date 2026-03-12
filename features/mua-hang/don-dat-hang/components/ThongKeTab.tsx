import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Calendar, Building2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useDonDatHangList } from '../hooks/use-don-dat-hang';
import { useDoiTacList } from '../../../kho-van/danh-sach-doi-tac/hooks/use-doi-tac';
import { useEmployees } from '../../../he-thong/nhan-vien/hooks/use-nhan-vien';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useDonDatHangStats } from './stats/useDonDatHangStats';
import { TRANG_THAI_DON_DAT_HANG, TRANG_THAI_KEY } from '../core/constants';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
import StatsCharts from './stats/StatsCharts';
import StatsTables from './stats/StatsTables';
import type { DonDatHang } from '../core/types';

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: list = [], isLoading, isError } = useDonDatHangList();
  const { data: supplierList = [] } = useDoiTacList('nha_cung_cap');
  const { data: employees = [] } = useEmployees();

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    list.forEach((d) => {
      m[String(d.trang_thai)] = (m[String(d.trang_thai)] ?? 0) + 1;
    });
    return m;
  }, [list]);
  const supplierCounts = useMemo(() => {
    const m: Record<string, number> = {};
    list.forEach((d) => {
      m[d.id_nha_cung_cap] = (m[d.id_nha_cung_cap] ?? 0) + 1;
    });
    return m;
  }, [list]);
  const buyerCounts = useMemo(() => {
    const m: Record<string, number> = {};
    list.forEach((d) => {
      m[d.id_nguoi_dat] = (m[d.id_nguoi_dat] ?? 0) + 1;
    });
    return m;
  }, [list]);

  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSupplier, setFilterSupplier] = useState<string[]>([]);
  const [filterBuyer, setFilterBuyer] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredList = useMemo(() => {
    return list.filter((d: DonDatHang) => {
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(String(d.trang_thai));
      const matchSupplier = filterSupplier.length === 0 || filterSupplier.includes(d.id_nha_cung_cap);
      const matchBuyer = filterBuyer.length === 0 || filterBuyer.includes(d.id_nguoi_dat);
      const matchFrom = !dateFrom || (d.ngay_dat && d.ngay_dat >= dateFrom);
      const matchTo = !dateTo || (d.ngay_dat && d.ngay_dat <= dateTo);
      return matchStatus && matchSupplier && matchBuyer && matchFrom && matchTo;
    });
  }, [list, filterStatus, filterSupplier, filterBuyer, dateFrom, dateTo]);

  const stats = useDonDatHangStats(filteredList);

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

  const isEmpty = filteredList.length === 0;

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
              <StatsCards summary={stats.summary} />
              <StatsCharts
                byTrangThai={stats.byTrangThai}
                bySupplier={stats.bySupplier}
                byBuyer={stats.byBuyer}
                byMonth={stats.byMonth}
              />
              <StatsTables
                byTrangThai={stats.byTrangThai}
                bySupplier={stats.bySupplier}
                byBuyer={stats.byBuyer}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
