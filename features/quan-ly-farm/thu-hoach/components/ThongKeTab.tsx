import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Hash, Building2 } from 'lucide-react';
import { useThuHoachList } from '../hooks/use-thu-hoach';
import { useThuHoachViewScope } from '../hooks/use-thu-hoach-view-scope';
import { filterThuHoachListByViewScope } from '../utils/thu-hoach-view-scope-filter';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { cn, formatNumberVN } from '../../../../lib/utils';
import type { FarmThuHoach } from '../core/types';
import { THU_HOACH_DAY_SUFFIXES } from '../core/types';
import { DAY_FORM_LABEL_KEY } from '../core/form-mappers';
import { aggregateFarmByWeekday, type FarmDayAgg } from '../core/stats-pivot';

const DEFAULT_AGG: FarmDayAgg = { keHoach: 0, thucTe: 0 };
const DEFAULT_METRIC_LABELS = { kh: 'KH', tt: 'TT', cl: 'CL' };

function chenhLech(agg: FarmDayAgg): number {
  return agg.thucTe - agg.keHoach;
}

function AggCell({
  agg,
  className,
  labels,
}: {
  agg?: FarmDayAgg | null;
  className?: string;
  labels?: { kh: string; tt: string; cl: string } | null;
}) {
  const a = agg ?? DEFAULT_AGG;
  const L = labels ?? DEFAULT_METRIC_LABELS;
  const cl = chenhLech(a);
  return (
    <div className={cn('text-right text-caption leading-snug tabular-nums space-y-0.5', className)}>
      <div>
        <span className="text-muted-foreground">{L.kh} </span>
        {formatNumberVN(a.keHoach)}
      </div>
      <div>
        <span className="text-muted-foreground">{L.tt} </span>
        {formatNumberVN(a.thucTe)}
      </div>
      <div
        className={cn(
          'font-medium',
          cl > 0 && 'text-emerald-600 dark:text-emerald-500',
          cl < 0 && 'text-destructive'
        )}
      >
        <span className="text-muted-foreground font-normal">{L.cl} </span>
        {formatNumberVN(cl)}
      </div>
    </div>
  );
}

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: rawList = [], isLoading, isError } = useThuHoachList();
  const viewScope = useThuHoachViewScope();
  const list = useMemo(
    () => filterThuHoachListByViewScope(rawList, viewScope),
    [rawList, viewScope]
  );
  const { data: branches = [] } = useBranches();
  const [filterNam, setFilterNam] = useState<string[]>([]);
  const [filterTuan, setFilterTuan] = useState<string[]>([]);
  const [filterFarm, setFilterFarm] = useState<string[]>([]);

  const branchLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    branches.forEach((b) => m.set(String(b.id), b.ten_chi_nhanh));
    return m;
  }, [branches]);

  const namOptions = useMemo(() => {
    const set = new Set<number>();
    list.forEach((r) => set.add(r.nam));
    return [...set]
      .sort((a, b) => b - a)
      .map((n) => ({
        value: String(n),
        label: String(n),
        count: list.filter((d) => d.nam === n).length,
      }));
  }, [list]);

  const tuanOptions = useMemo(() => {
    const set = new Set<number>();
    list.forEach((r) => set.add(r.tuan));
    return [...set]
      .sort((a, b) => a - b)
      .map((w) => ({
        value: String(w),
        label: `${t('thuHoach.stats.colWeek')} ${w}`,
        count: list.filter((d) => d.tuan === w).length,
      }));
  }, [list, t]);

  const farmOptions = useMemo(
    () =>
      branches.map((b) => ({
        value: b.id,
        label: b.ten_chi_nhanh,
        subLabel: b.ma_chi_nhanh,
        count: list.filter((d) => String(d.id_chi_nhanh) === String(b.id)).length,
      })),
    [branches, list]
  );

  const filteredList = useMemo(() => {
    return list.filter((r: FarmThuHoach) => {
      if (filterNam.length && !filterNam.includes(String(r.nam))) return false;
      if (filterTuan.length && !filterTuan.includes(String(r.tuan))) return false;
      if (filterFarm.length) {
        const id = r.id_chi_nhanh != null ? String(r.id_chi_nhanh) : '';
        if (!id || !filterFarm.includes(id)) return false;
      }
      return true;
    });
  }, [list, filterNam, filterTuan, filterFarm]);

  const table = useMemo(() => aggregateFarmByWeekday(filteredList), [filteredList]);

  const farmDisplay = (fk: string, fallback: string) => {
    if (fk === '__none__') return t('thuHoach.stats.noBranch');
    return branchLabelMap.get(fk) ?? fallback ?? fk;
  };

  const metricLabels = useMemo(
    () => ({
      kh: t('thuHoach.stats.abbrKH') || DEFAULT_METRIC_LABELS.kh,
      tt: t('thuHoach.stats.abbrTT') || DEFAULT_METRIC_LABELS.tt,
      cl: t('thuHoach.stats.abbrCL') || DEFAULT_METRIC_LABELS.cl,
    }),
    [t]
  );

  if (isError) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{t('common.noData')}</p>
      </div>
    );
  }

  if (isLoading || viewScope.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <LoadingSpinnerWithText text={t('thuHoach.loading')} />
      </div>
    );
  }

  if (rawList.length === 0) {
    return (
      <div className="p-6">
        <EmptyState title={t('thuHoach.stats.empty')} />
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="p-6">
        <EmptyState title={t('thuHoach.stats.emptyScoped')} />
      </div>
    );
  }

  if (filteredList.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex flex-col p-4 gap-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
          <FilterChipMultiSelect
            options={namOptions}
            value={filterNam}
            onChange={setFilterNam}
            placeholder={t('thuHoach.stats.filterNam')}
            icon={Calendar}
            className="w-full sm:w-[160px]"
            size="md"
          />
          <FilterChipMultiSelect
            options={tuanOptions}
            value={filterTuan}
            onChange={setFilterTuan}
            placeholder={t('thuHoach.stats.filterTuan')}
            icon={Hash}
            className="w-full sm:w-[200px]"
            size="md"
          />
          <FilterChipMultiSelect
            options={farmOptions}
            value={filterFarm}
            onChange={setFilterFarm}
            placeholder={t('thuHoach.stats.filterFarm')}
            icon={Building2}
            className="w-full sm:w-[200px]"
            size="md"
          />
        </div>
        <EmptyState title={t('thuHoach.stats.emptyFiltered')} />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col p-4 gap-4 overflow-auto">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
        <FilterChipMultiSelect
          options={namOptions}
          value={filterNam}
          onChange={setFilterNam}
          placeholder={t('thuHoach.stats.filterNam')}
          icon={Calendar}
          className="w-full sm:w-[160px]"
          size="md"
        />
        <FilterChipMultiSelect
          options={tuanOptions}
          value={filterTuan}
          onChange={setFilterTuan}
          placeholder={t('thuHoach.stats.filterTuan')}
          icon={Hash}
          className="w-full sm:w-[200px]"
          size="md"
        />
        <FilterChipMultiSelect
          options={farmOptions}
          value={filterFarm}
          onChange={setFilterFarm}
          placeholder={t('thuHoach.stats.filterFarm')}
          icon={Building2}
          className="w-full sm:w-[200px]"
          size="md"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[920px]">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">
            <tr>
              <th className="text-left p-2.5 font-semibold border-r border-border whitespace-nowrap min-w-[140px]">
                {t('thuHoach.stats.colFarm')}
              </th>
              {THU_HOACH_DAY_SUFFIXES.map((d) => (
                <th
                  key={d}
                  className="text-right p-2.5 font-semibold border-r border-border whitespace-nowrap min-w-[100px]"
                >
                  {t(DAY_FORM_LABEL_KEY[d])}
                </th>
              ))}
              <th className="text-right p-2.5 font-semibold whitespace-nowrap min-w-[108px] bg-muted/50">
                {t('thuHoach.stats.colTotalWeek')}
              </th>
            </tr>
          </thead>
          <tbody>
            {table.farmKeys.map((fk) => {
              const line = table.matrix.get(fk)!;
              const rowTot = table.rowTotals.get(fk)!;
              const label = farmDisplay(fk, table.farmLabels.get(fk) ?? fk);
              return (
                <tr key={fk} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="p-2.5 border-r border-border font-medium align-top">{label}</td>
                  {THU_HOACH_DAY_SUFFIXES.map((d) => (
                    <td key={d} className="p-2 border-r border-border align-top">
                      <AggCell agg={line.get(d) ?? { keHoach: 0, thucTe: 0 }} labels={metricLabels} />
                    </td>
                  ))}
                  <td className="p-2 align-top bg-muted/20">
                    <AggCell agg={rowTot} labels={metricLabels} />
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-border bg-muted/30 font-medium">
              <td className="p-2.5 border-r border-border whitespace-nowrap">
                {t('thuHoach.stats.rowTotalByDay')}
              </td>
              {THU_HOACH_DAY_SUFFIXES.map((d) => {
                const col = table.colTotals.get(d)!;
                return (
                  <td key={d} className="p-2 border-r border-border align-top">
                    <AggCell agg={col} className="text-caption" labels={metricLabels} />
                  </td>
                );
              })}
              <td className="p-2 align-top bg-muted/40">
                <AggCell agg={table.grandTotal} labels={metricLabels} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ThongKeTab;
