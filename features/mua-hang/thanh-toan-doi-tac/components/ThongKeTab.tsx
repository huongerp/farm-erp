import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Building2, Building, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useThanhToanDoiTacList } from '../hooks/use-thanh-toan-doi-tac';
import { useThanhToanDoiTacViewScope } from '../hooks/use-thanh-toan-doi-tac-view-scope';
import { filterThanhToanDoiTacListByViewScope } from '../utils/thanh-toan-doi-tac-view-scope-filter';
import { useDoiTacList } from '../../../kho-van/danh-sach-doi-tac/hooks/use-doi-tac';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useTrangThaiThanhToanDoiTacList } from '../../thiet-lap-de-xuat-vat-tu/hooks/use-trang-thai-thanh-toan-doi-tac';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useThanhToanDoiTacStats } from './stats/useThanhToanDoiTacStats';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
import StatsCharts from './stats/StatsCharts';
import StatsTables from './stats/StatsTables';
import type { ThanhToanDoiTac } from '../core/types';

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: list = [], isLoading, isError } = useThanhToanDoiTacList();
  const { data: doiTacList = [] } = useDoiTacList('nha_cung_cap');
  const { data: chiNhanhList = [] } = useBranches();
  const { data: statusList = [] } = useTrangThaiThanhToanDoiTacList();
  const viewScope = useThanhToanDoiTacViewScope();

  const viewableList = useMemo(
    () => filterThanhToanDoiTacListByViewScope(list, viewScope),
    [list, viewScope]
  );

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    viewableList.forEach((d) => {
      m[d.id_trang_thai_thanh_toan] = (m[d.id_trang_thai_thanh_toan] ?? 0) + 1;
    });
    return m;
  }, [viewableList]);
  const doiTacCounts = useMemo(() => {
    const m: Record<string, number> = {};
    viewableList.forEach((d) => {
      m[d.id_doi_tac] = (m[d.id_doi_tac] ?? 0) + 1;
    });
    return m;
  }, [viewableList]);
  const donViCounts = useMemo(() => {
    const m: Record<string, number> = {};
    viewableList.forEach((d) => {
      const key = d.id_don_vi ?? '__null__';
      m[key] = (m[key] ?? 0) + 1;
    });
    return m;
  }, [viewableList]);

  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDoiTac, setFilterDoiTac] = useState<string[]>([]);
  const [filterDonVi, setFilterDonVi] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredList = useMemo(() => {
    return viewableList.filter((d: ThanhToanDoiTac) => {
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(d.id_trang_thai_thanh_toan);
      const matchDoiTac = filterDoiTac.length === 0 || filterDoiTac.includes(d.id_doi_tac);
      const keyDonVi = d.id_don_vi ?? '__null__';
      const matchDonVi = filterDonVi.length === 0 || filterDonVi.includes(keyDonVi);
      const matchFrom = !dateFrom || (d.ngay && d.ngay >= dateFrom);
      const matchTo = !dateTo || (d.ngay && d.ngay <= dateTo);
      return matchStatus && matchDoiTac && matchDonVi && matchFrom && matchTo;
    });
  }, [viewableList, filterStatus, filterDoiTac, filterDonVi, dateFrom, dateTo]);

  const stats = useThanhToanDoiTacStats(filteredList);

  const statusOptions = useMemo(
    () =>
      statusList.map((s) => ({
        label: s.ten,
        value: s.id,
        subLabel: s.ma,
        count: statusCounts[s.id] ?? 0,
      })),
    [statusList, statusCounts]
  );
  const doiTacOptions = useMemo(
    () =>
      doiTacList.map((d) => ({
        label: d.ten_ncc,
        value: d.id,
        subLabel: d.ma_ncc,
        count: doiTacCounts[d.id] ?? 0,
      })),
    [doiTacList, doiTacCounts]
  );
  const donViOptions = useMemo(
    () => [
      ...chiNhanhList.map((b) => ({
        label: b.ten_chi_nhanh,
        value: b.id,
        subLabel: undefined as string | undefined,
        count: donViCounts[b.id] ?? 0,
      })),
      { label: '—', value: '__null__', subLabel: undefined as string | undefined, count: donViCounts['__null__'] ?? 0 },
    ],
    [chiNhanhList, donViCounts]
  );

  const activeFilterCount =
    filterStatus.length +
    filterDoiTac.length +
    filterDonVi.length +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);
  const handleClearFilters = () => {
    setFilterStatus([]);
    setFilterDoiTac([]);
    setFilterDonVi([]);
    setDateFrom('');
    setDateTo('');
  };

  const filterGroups = useMemo(
    () => [
      { key: 'status', label: t('common.status'), icon: Tag, options: statusOptions, value: filterStatus, onChange: setFilterStatus },
      { key: 'doiTac', label: t('thanhToanDoiTac.form.doiTac'), icon: Building2, options: doiTacOptions, value: filterDoiTac, onChange: setFilterDoiTac },
      { key: 'donVi', label: t('thanhToanDoiTac.form.donVi'), icon: Building, options: donViOptions, value: filterDonVi, onChange: setFilterDonVi },
    ],
    [t, statusOptions, doiTacOptions, donViOptions, filterStatus, filterDoiTac, filterDonVi]
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
          placeholder={t('thanhToanDoiTac.stats.dateFrom')}
        />
      </div>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('thanhToanDoiTac.stats.dateTo')}
        />
      </div>
      <FilterChipMultiSelect
        options={doiTacOptions}
        value={filterDoiTac}
        onChange={setFilterDoiTac}
        placeholder={t('thanhToanDoiTac.form.doiTac')}
        icon={Building2}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={donViOptions}
        value={filterDonVi}
        onChange={setFilterDonVi}
        placeholder={t('thanhToanDoiTac.form.donVi')}
        icon={Building}
        className="w-full sm:w-[160px]"
        size="md"
      />
    </>
  );

  const handleExportReport = () => {
    toast.info(t('thanhToanDoiTac.stats.exportReport') + ' – Đang phát triển');
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{t('thanhToanDoiTac.stats.loadError')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText text={t('thanhToanDoiTac.stats.loading')} centered />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
              title={t('thanhToanDoiTac.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('thanhToanDoiTac.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('thanhToanDoiTac.stats.noDataHint')
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
              <h3 className="text-sm font-semibold text-primary">{t('thanhToanDoiTac.stats.title')}</h3>
              <StatsCards summary={stats.summary} />
              <StatsCharts
                byTrangThai={stats.byTrangThai}
                byDoiTac={stats.byDoiTac}
                byDonVi={stats.byDonVi}
                byMonth={stats.byMonth}
                byMonthAmount={stats.byMonthAmount}
              />
              <StatsTables byTrangThai={stats.byTrangThai} byDoiTac={stats.byDoiTac} byDonVi={stats.byDonVi} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
