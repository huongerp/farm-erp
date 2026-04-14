import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useDotKiemKeList } from '../hooks/use-kiem-ke-tai-san';
import { useKiemKeTaiSanViewScope } from '../hooks/use-kiem-ke-tai-san-view-scope';
import { useAuthStore } from '../../../../store/useStore';
import { useEmployeesRefQuery } from '@/lib/hooks/use-supabase-ref-queries';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useKiemKeStats } from './stats/useKiemKeStats';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
import StatsTables from './stats/StatsTables';
import type { DotKiemKe } from '../core/types';
import { TRANG_THAI_DOT_OPTIONS } from '../core/constants';

/** Đếm theo trạng thái và người phụ trách từ list (chuẩn như tab Danh sách / useKiemKeFilterCounts). */
function useStatsFilterCounts(items: DotKiemKe[]) {
  return useMemo(() => {
    const trangThaiCounts: Record<string, number> = {};
    const nguoiPhuTrachCounts: Record<string, number> = {};
    items.forEach((d) => {
      trangThaiCounts[d.trang_thai] = (trangThaiCounts[d.trang_thai] ?? 0) + 1;
      const key = d.id_nguoi_phu_trach ?? '';
      nguoiPhuTrachCounts[key] = (nguoiPhuTrachCounts[key] ?? 0) + 1;
    });
    return { trangThaiCounts, nguoiPhuTrachCounts };
  }, [items]);
}

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { viewAll } = useKiemKeTaiSanViewScope();
  const { data: list = [], isLoading, isError } = useDotKiemKeList({});
  const { data: employees = [] } = useEmployeesRefQuery();

  const viewableList = useMemo(() => {
    if (viewAll) return list;
    const myId = user?.id ?? '';
    return list.filter((d) => String(d.id_nguoi_phu_trach) === String(myId));
  }, [list, viewAll, user?.id]);

  const { trangThaiCounts, nguoiPhuTrachCounts } = useStatsFilterCounts(viewableList);

  const [filterTrangThai, setFilterTrangThai] = useState<string[]>([]);
  const [filterNguoiPhuTrach, setFilterNguoiPhuTrach] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredList = useMemo(() => {
    return viewableList.filter((d: DotKiemKe) => {
      const matchTrangThai = filterTrangThai.length === 0 || filterTrangThai.includes(d.trang_thai);
      const matchNguoi = filterNguoiPhuTrach.length === 0 || (d.id_nguoi_phu_trach && filterNguoiPhuTrach.includes(d.id_nguoi_phu_trach));
      const matchFrom = !dateFrom || (d.ngay_bat_dau && d.ngay_bat_dau >= dateFrom);
      const matchTo = !dateTo || (d.ngay_ket_thuc && d.ngay_ket_thuc <= dateTo);
      return matchTrangThai && matchNguoi && matchFrom && matchTo;
    });
  }, [viewableList, filterTrangThai, filterNguoiPhuTrach, dateFrom, dateTo]);

  const stats = useKiemKeStats(filteredList);

  const statusOptions = useMemo(
    () =>
      TRANG_THAI_DOT_OPTIONS.map((o) => ({
        label: o.label,
        value: o.value,
        subLabel: undefined as string | undefined,
        count: trangThaiCounts[o.value] ?? 0,
      })),
    [trangThaiCounts]
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

  const activeFilterCount =
    filterTrangThai.length +
    filterNguoiPhuTrach.length +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);
  const handleClearFilters = () => {
    setFilterTrangThai([]);
    setFilterNguoiPhuTrach([]);
    setDateFrom('');
    setDateTo('');
  };

  const filterGroups = useMemo(
    () => [
      { key: 'trang_thai', label: t('kiemKeTaiSan.store.trangThaiCol'), icon: Calendar, options: statusOptions, value: filterTrangThai, onChange: setFilterTrangThai },
      { key: 'id_nguoi_phu_trach', label: t('kiemKeTaiSan.store.nguoiPhuTrachCol'), icon: User, options: nguoiPhuTrachOptions, value: filterNguoiPhuTrach, onChange: setFilterNguoiPhuTrach },
    ],
    [statusOptions, nguoiPhuTrachOptions, filterTrangThai, filterNguoiPhuTrach, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filterTrangThai}
        onChange={setFilterTrangThai}
        placeholder={t('kiemKeTaiSan.store.trangThaiCol')}
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
          placeholder={t('kiemKeTaiSan.filter.dateFrom')}
        />
      </div>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('kiemKeTaiSan.filter.dateTo')}
        />
      </div>
      <FilterChipMultiSelect
        options={nguoiPhuTrachOptions}
        value={filterNguoiPhuTrach}
        onChange={setFilterNguoiPhuTrach}
        placeholder={t('kiemKeTaiSan.store.nguoiPhuTrachCol')}
        icon={User}
        className="w-full sm:w-[180px]"
        size="md"
      />
    </>
  );

  const handleExportReport = () => {
    toast.info(t('kiemKeTaiSan.stats.exportReport') + ' – Đang phát triển');
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">
          {t('kiemKeTaiSan.stats.loadError')}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText
            text={t('kiemKeTaiSan.stats.loading')}
            centered
          />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card rounded-lg border border-border p-2.5 animate-pulse"
              >
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
              title={t('kiemKeTaiSan.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('kiemKeTaiSan.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('kiemKeTaiSan.stats.noDataHint')
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
              <h3 className="text-sm font-semibold text-primary">
                {t('kiemKeTaiSan.stats.title')}
              </h3>
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
