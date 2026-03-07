/**
 * Báo cáo đào tạo – thống kê từ Đăng ký tham gia (số đăng ký, đang học, hoàn thành, theo khóa).
 */
import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Calendar, BookOpen, ClipboardList } from 'lucide-react';
import { useDangKyList } from '@/features/nhan-su/dang-ky-dao-tao/hooks/use-dang-ky-dao-tao';
import { useBaoCaoDaoTaoStats } from './hooks/useBaoCaoDaoTaoStats';
import { getTrangThaiDangKyLabel, TRANG_THAI_DANG_KY_VALUES } from '@/features/nhan-su/dang-ky-dao-tao/core/constants';
import FilterChipMultiSelect from '../../../components/shared/FilterChipMultiSelect';
import StatsToolbar from './components/StatsToolbar';
import StatsCards from './components/StatsCards';
import StatsCharts from './components/StatsCharts';
import StatsTables from './components/StatsTables';
import { exportBaoCaoDaoTaoToExcel } from './utils/export-bao-cao-dao-tao';
import EmptyState from '../../../components/shared/EmptyState';
import LoadingSpinnerWithText from '../../../components/shared/LoadingSpinnerWithText';
import type { FilterGroup } from '../../../components/ui/MobileFilterSheet';

function inDateRange(value: string, ngayTu: string, ngayDen: string): boolean {
  if (ngayTu && value < ngayTu) return false;
  if (ngayDen && value > ngayDen) return false;
  return true;
}

const BaoCaoDaoTaoPage: React.FC = () => {
  const { t } = useTranslation();
  const [ngayTu, setNgayTu] = useState('');
  const [ngayDen, setNgayDen] = useState('');
  const [filterKhoa, setFilterKhoa] = useState<string[]>([]);
  const [filterTrangThai, setFilterTrangThai] = useState<string[]>([]);

  const { data: list = [], isLoading, isError } = useDangKyList();

  const filteredList = useMemo(() => {
    return list.filter((d) => {
      const dateStr = (d.tg_dang_ky || '').slice(0, 10);
      if (!inDateRange(dateStr, ngayTu, ngayDen)) return false;
      if (filterKhoa.length > 0 && !filterKhoa.includes(d.id_khoa_hoc)) return false;
      if (filterTrangThai.length > 0 && !filterTrangThai.includes(String(d.trang_thai))) return false;
      return true;
    });
  }, [list, ngayTu, ngayDen, filterKhoa, filterTrangThai]);

  const stats = useBaoCaoDaoTaoStats(filteredList);

  const khoaOptions = useMemo(() => {
    const byId = new Map<string, { label: string; count: number }>();
    for (const d of list) {
      const key = d.id_khoa_hoc;
      const label = d.ten_khoa_hoc ?? d.ma_khoa_hoc ?? key;
      const cur = byId.get(key);
      byId.set(key, { label, count: (cur?.count ?? 0) + 1 });
    }
    return Array.from(byId.entries()).map(([value, { label, count }]) => ({ value, label, count }));
  }, [list]);

  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_DANG_KY_VALUES.map((value) => ({
        label: getTrangThaiDangKyLabel(value, t),
        value: String(value),
        count: list.filter((i) => i.trang_thai === value).length,
      })),
    [t, list]
  );

  const activeFilterCount =
    (ngayTu ? 1 : 0) + (ngayDen ? 1 : 0) + filterKhoa.length + filterTrangThai.length;
  const handleClearFilters = useCallback(() => {
    setNgayTu('');
    setNgayDen('');
    setFilterKhoa([]);
    setFilterTrangThai([]);
  }, []);

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'khoa',
        label: t('baoCaoDaoTao.filterKhoa'),
        icon: BookOpen,
        options: khoaOptions,
        value: filterKhoa,
        onChange: (val: string[]) => setFilterKhoa(val),
      },
      {
        key: 'trangThai',
        label: t('baoCaoDaoTao.filterTrangThai'),
        icon: ClipboardList,
        options: trangThaiOptions,
        value: filterTrangThai,
        onChange: (val: string[]) => setFilterTrangThai(val),
      },
    ],
    [khoaOptions, trangThaiOptions, filterKhoa, filterTrangThai, t]
  );

  const renderFilters = (
    <>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={ngayTu}
          onChange={(e) => setNgayTu(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('baoCaoDaoTao.filterFromDate')}
        />
      </div>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={ngayDen}
          onChange={(e) => setNgayDen(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('baoCaoDaoTao.filterToDate')}
        />
      </div>
      <FilterChipMultiSelect
        options={khoaOptions}
        value={filterKhoa}
        onChange={setFilterKhoa}
        placeholder={t('baoCaoDaoTao.filterKhoa')}
        icon={BookOpen}
        className="w-full sm:w-[180px]"
      />
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={filterTrangThai}
        onChange={setFilterTrangThai}
        placeholder={t('baoCaoDaoTao.filterTrangThai')}
        icon={ClipboardList}
        className="w-full sm:w-[160px]"
      />
    </>
  );

  const hasData = filteredList.length > 0;

  const handleExportReport = useCallback(async () => {
    if (!hasData) return;
    try {
      await exportBaoCaoDaoTaoToExcel(stats, t);
      toast.success(t('baoCaoDaoTao.exportSuccess'));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [stats, t, hasData]);

  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{t('baoCaoDaoTao.errorLoad')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText text={t('baoCaoDaoTao.loading')} centered />
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

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] print:h-auto">
      <StatsToolbar
        className="static z-auto print:hidden"
        filters={renderFilters}
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        onExportReport={handleExportReport}
        onPrintReport={handlePrintReport}
        canExport={hasData}
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar print:overflow-visible">
        <div className="p-3 sm:p-4 pb-4 space-y-4 print:p-4">
          {!hasData ? (
            <EmptyState
              title={t('baoCaoDaoTao.noData')}
              description={t('baoCaoDaoTao.noDataHint')}
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
              <StatsCharts chartSummary={stats.chartSummary} chartByKhoa={stats.chartByKhoa} />
              <StatsTables byKhoa={stats.byKhoa} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaoCaoDaoTaoPage;
