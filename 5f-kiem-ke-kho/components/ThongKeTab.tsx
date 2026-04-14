import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Calendar, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { useDotKiemKeKhoList } from '../hooks/use-kiem-ke-kho';
import { useEmployeesRefQuery } from '@/lib/hooks/use-supabase-ref-queries';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useKiemKeKhoStats } from './stats/useKiemKeKhoStats';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
import StatsTables from './stats/StatsTables';
import type { DotKiemKeKho } from '../core/types';

const TRANG_THAI_OPTIONS = [
  { value: 'draft', labelKey: 'kiemKeKho.trangThaiDot.draft' },
  { value: 'dang_kiem_ke', labelKey: 'kiemKeKho.trangThaiDot.dang_kiem_ke' },
  { value: 'hoan_thanh', labelKey: 'kiemKeKho.trangThaiDot.hoan_thanh' },
];

function useStatsFilterCounts(items: DotKiemKeKho[]) {
  return useMemo(() => {
    const trangThaiCounts: Record<string, number> = {};
    const nguoiPhuTrachCounts: Record<string, number> = {};
    const idKhoCounts: Record<string, number> = {};
    items.forEach((d) => {
      trangThaiCounts[d.trang_thai] = (trangThaiCounts[d.trang_thai] ?? 0) + 1;
      nguoiPhuTrachCounts[d.id_nguoi_phu_trach] = (nguoiPhuTrachCounts[d.id_nguoi_phu_trach] ?? 0) + 1;
      (d.id_kho ?? []).forEach((k) => {
        idKhoCounts[k] = (idKhoCounts[k] ?? 0) + 1;
      });
    });
    return { trangThaiCounts, nguoiPhuTrachCounts, idKhoCounts };
  }, [items]);
}

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: list = [], isLoading, isError } = useDotKiemKeKhoList({});
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: khoList = [] } = useKhoList();
  const { trangThaiCounts, nguoiPhuTrachCounts, idKhoCounts } = useStatsFilterCounts(list);

  const [filterTrangThai, setFilterTrangThai] = useState<string[]>([]);
  const [filterNguoiPhuTrach, setFilterNguoiPhuTrach] = useState<string[]>([]);
  const [filterIdKho, setFilterIdKho] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredList = useMemo(() => {
    return list.filter((d: DotKiemKeKho) => {
      const matchTrangThai = filterTrangThai.length === 0 || filterTrangThai.includes(d.trang_thai);
      const matchNguoi = filterNguoiPhuTrach.length === 0 || (d.id_nguoi_phu_trach && filterNguoiPhuTrach.includes(d.id_nguoi_phu_trach));
      const matchKho = filterIdKho.length === 0 || (d.id_kho && d.id_kho.some((k) => filterIdKho.includes(k)));
      const matchFrom = !dateFrom || (d.ngay_bat_dau && d.ngay_bat_dau >= dateFrom);
      const matchTo = !dateTo || (d.ngay_ket_thuc && d.ngay_ket_thuc <= dateTo);
      return matchTrangThai && matchNguoi && matchKho && matchFrom && matchTo;
    });
  }, [list, filterTrangThai, filterNguoiPhuTrach, filterIdKho, dateFrom, dateTo]);

  const stats = useKiemKeKhoStats(filteredList);

  const statusOptions = useMemo(
    () =>
      TRANG_THAI_OPTIONS.map((o) => ({
        label: t(o.labelKey),
        value: o.value,
        subLabel: undefined as string | undefined,
        count: trangThaiCounts[o.value] ?? 0,
      })),
    [t, trangThaiCounts]
  );
  const nguoiPhuTrachOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
        count: nguoiPhuTrachCounts[e.id] ?? 0,
      })),
    [employees, nguoiPhuTrachCounts]
  );
  const idKhoOptions = useMemo(
    () =>
      khoList
        .filter((k) => k.trang_thai === 1)
        .map((k) => ({
          label: k.ten_kho,
          value: k.id,
          subLabel: k.ma_kho,
          count: idKhoCounts[k.id] ?? 0,
        })),
    [khoList, idKhoCounts]
  );

  const activeFilterCount =
    filterTrangThai.length +
    filterNguoiPhuTrach.length +
    filterIdKho.length +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);
  const handleClearFilters = () => {
    setFilterTrangThai([]);
    setFilterNguoiPhuTrach([]);
    setFilterIdKho([]);
    setDateFrom('');
    setDateTo('');
  };

  const filterGroups = useMemo(
    () => [
      { key: 'trang_thai', label: t('kiemKeKho.store.trangThaiCol'), icon: Calendar, options: statusOptions, value: filterTrangThai, onChange: setFilterTrangThai },
      { key: 'id_kho', label: t('kiemKeKho.store.khoCol'), icon: Warehouse, options: idKhoOptions, value: filterIdKho, onChange: setFilterIdKho },
      { key: 'id_nguoi_phu_trach', label: t('kiemKeKho.store.nguoiPhuTrachCol'), icon: User, options: nguoiPhuTrachOptions, value: filterNguoiPhuTrach, onChange: setFilterNguoiPhuTrach },
    ],
    [statusOptions, idKhoOptions, nguoiPhuTrachOptions, filterTrangThai, filterIdKho, filterNguoiPhuTrach, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filterTrangThai}
        onChange={setFilterTrangThai}
        placeholder={t('kiemKeKho.store.trangThaiCol')}
        icon={Calendar}
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
          placeholder={t('kiemKeKho.filter.dateFrom')}
        />
      </div>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('kiemKeKho.filter.dateTo')}
        />
      </div>
      <FilterChipMultiSelect
        options={idKhoOptions}
        value={filterIdKho}
        onChange={setFilterIdKho}
        placeholder={t('kiemKeKho.store.khoCol')}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={nguoiPhuTrachOptions}
        value={filterNguoiPhuTrach}
        onChange={setFilterNguoiPhuTrach}
        placeholder={t('kiemKeKho.store.nguoiPhuTrachCol')}
        icon={User}
        className="w-full sm:w-[180px]"
        size="md"
      />
    </>
  );

  const handleExportReport = () => {
    toast.info(t('kiemKeKho.stats.exportReport') + ' – Đang phát triển');
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{t('kiemKeKho.stats.loadError')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText text={t('kiemKeKho.stats.loading')} centered />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
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
              title={t('kiemKeKho.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('kiemKeKho.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('kiemKeKho.stats.noDataHint')
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
              <h3 className="text-sm font-semibold text-primary">{t('kiemKeKho.stats.title')}</h3>
              <StatsCards summary={stats.summary} />
              <StatsTables byTrangThai={stats.byTrangThai} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
