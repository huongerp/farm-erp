import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Calendar, CalendarRange, Hash, Building2, Target } from 'lucide-react';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import StatsToolbar from '../../../../components/shared/StatsToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import { MobileFilterField } from '../../../../components/ui/MobileFilterSheet';
import TabGroup from '../../../../components/ui/TabGroup';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { CHE_DO_THONG_KE, TINH_TRANG_DAT_KH, type CheDoThongKe, type FarmDayAgg } from '../core/stats-pivot';
import { LOC_TRONG, demBoLoc, ghiThamSo, type ThongKeLoc } from '../core/thong-ke-loc';
import { useThongKeThuHoach } from '../hooks/use-thong-ke-thu-hoach';
import { useKyChip } from '../hooks/use-ky-chip';
import { taiXlsxThongKe } from '../utils/export-thong-ke';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const cdUrl = searchParams.get('cd');
  const cheDo: CheDoThongKe = CHE_DO_THONG_KE.includes(cdUrl as CheDoThongKe) ? (cdUrl as CheDoThongKe) : 'thu';
  const setCheDo = (id: string) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('cd', id);
        return next;
      },
      { replace: true }
    );

  const [boLoc, setBoLoc] = useState<Omit<ThongKeLoc, 'cheDo'>>(LOC_TRONG);
  const loc = useMemo<ThongKeLoc>(() => ({ ...boLoc, cheDo }), [boLoc, cheDo]);
  const datLoc = <K extends keyof typeof boLoc>(key: K) => (v: (typeof boLoc)[K]) =>
    setBoLoc((s) => ({ ...s, [key]: v }));

  const { list, rawList, branches, pivot, tenFarm, nhanCot, tieuDe, moTaLoc, isLoading, isError } =
    useThongKeThuHoach(loc);
  const ky = useKyChip(boLoc.tuNgay, boLoc.denNgay, (tuNgay, denNgay) =>
    setBoLoc((s) => ({ ...s, tuNgay, denNgay }))
  );

  const namOptions = useMemo(() => {
    const dem = new Map<number, number>();
    list.forEach((r) => dem.set(r.nam, (dem.get(r.nam) ?? 0) + 1));
    return [...dem]
      .sort((a, b) => b[0] - a[0])
      .map(([n, count]) => ({ value: String(n), label: String(n), count }));
  }, [list]);

  // Danh sách tuần thu hẹp theo năm đang chọn.
  const tuanOptions = useMemo(() => {
    const dem = new Map<number, number>();
    list
      .filter((r) => !boLoc.nam.length || boLoc.nam.includes(String(r.nam)))
      .forEach((r) => dem.set(r.tuan, (dem.get(r.tuan) ?? 0) + 1));
    return [...dem]
      .sort((a, b) => a[0] - b[0])
      .map(([w, count]) => ({ value: String(w), label: `${t('thuHoach.stats.colWeek')} ${w}`, count }));
  }, [list, boLoc.nam, t]);

  const farmOptions = useMemo(
    () =>
      branches.map((b) => ({
        value: String(b.id),
        label: b.ten_chi_nhanh,
        count: list.filter((d) => String(d.id_chi_nhanh) === String(b.id)).length,
      })),
    [branches, list]
  );

  const tinhTrangOptions = useMemo(
    () => TINH_TRANG_DAT_KH.map((s) => ({ value: s, label: t(`thuHoach.stats.tinhTrang.${s}`) })),
    [t]
  );

  const filterGroups = [
    { key: 'nam', label: t('thuHoach.stats.filterNam'), icon: Calendar, options: namOptions, value: boLoc.nam, onChange: datLoc('nam') },
    { key: 'tuan', label: t('thuHoach.stats.filterTuan'), icon: Hash, options: tuanOptions, value: boLoc.tuan, onChange: datLoc('tuan') },
    { key: 'farm', label: t('thuHoach.stats.filterFarm'), icon: Building2, options: farmOptions, value: boLoc.farm, onChange: datLoc('farm') },
    {
      key: 'tinhTrang',
      label: t('thuHoach.stats.filterTinhTrang'),
      icon: Target,
      options: tinhTrangOptions,
      value: boLoc.tinhTrang,
      onChange: datLoc('tinhTrang'),
    },
  ];

  const filterItems: FilterChipItem[] = [
    {
      kind: 'custom',
      key: 'ky',
      node: (
        <DateRangePicker
          presets={ky.presets}
          value={ky.value}
          onChange={ky.onChange}
          displayLabel={ky.displayLabel}
          placeholder={t('thuHoach.stats.filterKy')}
        />
      ),
    },
    { kind: 'group', group: filterGroups[0], className: 'w-full sm:w-[130px]' },
    { kind: 'group', group: filterGroups[1], className: 'w-full sm:w-[150px]' },
    { kind: 'group', group: filterGroups[2], className: 'w-full sm:w-[170px]' },
    { kind: 'group', group: filterGroups[3], className: 'w-full sm:w-[170px]' },
  ];

  const kyActive = !!(boLoc.tuNgay || boLoc.denNgay);
  const mobileFilterExtra = (
    <MobileFilterField label={t('thuHoach.stats.filterKy')} icon={CalendarRange} active={kyActive}>
      <DateRangePicker inline presets={ky.presets} value={ky.value} onChange={ky.onChange} />
    </MobileFilterField>
  );

  const activeFilterCount = demBoLoc(loc);
  const clearFilters = () => setBoLoc(LOC_TRONG);

  const nhan = pivot.cot.map(nhanCot);
  const coSoLieu = pivot.farmKeys.length > 0;
  const xuatExcel = () => void taiXlsxThongKe(pivot, cheDo, nhan, tenFarm, tieuDe, moTaLoc, t);
  const moTrangIn = () =>
    void window.open(`/quan-ly-nha-so-che/thu-hoach/in-thong-ke?${ghiThamSo(loc)}`, '_blank', 'noopener,noreferrer');

  const metricLabels = useMemo(
    () => ({
      kh: t('thuHoach.stats.abbrKH') || DEFAULT_METRIC_LABELS.kh,
      tt: t('thuHoach.stats.abbrTT') || DEFAULT_METRIC_LABELS.tt,
      cl: t('thuHoach.stats.abbrCL') || DEFAULT_METRIC_LABELS.cl,
    }),
    [t]
  );

  const cheDoTabs = useMemo(
    () => CHE_DO_THONG_KE.map((id) => ({ id, label: t(`thuHoach.stats.cheDo.${id}`) })),
    [t]
  );

  if (isError) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{t('common.noData')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <LoadingSpinnerWithText text={t('thuHoach.loading')} />
      </div>
    );
  }

  const thongBaoTrong =
    rawList.length === 0
      ? t('thuHoach.stats.empty')
      : list.length === 0
        ? t('thuHoach.stats.emptyScoped')
        : !coSoLieu
          ? t('thuHoach.stats.emptyFiltered')
          : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <StatsToolbar
        className="static z-auto"
        filters={<ResponsiveFilterChips items={filterItems} />}
        filterGroups={filterGroups}
        mobileFilterExtra={mobileFilterExtra}
        mobileFilterExtraCount={kyActive ? 1 : 0}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        actionsLabel={t('thuHoach.stats.actions')}
        exportLabel={t('thuHoach.stats.exportReport')}
        onExportReport={coSoLieu ? xuatExcel : undefined}
        printLabel={t('thuHoach.stats.printReport')}
        onPrintReport={moTrangIn}
      />

      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar p-3 sm:p-4 space-y-3">
        <TabGroup tabs={cheDoTabs} activeTab={cheDo} onChange={setCheDo} />

        {thongBaoTrong ? (
          <EmptyState
            title={thongBaoTrong}
            action={
              activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t('common.clearFilters', { count: activeFilterCount })}
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/80 border-b border-border">
                <tr>
                  <th className="sticky left-0 z-10 bg-muted text-left p-2.5 font-semibold border-r border-border whitespace-nowrap min-w-[140px]">
                    {t('thuHoach.stats.colFarm')}
                  </th>
                  {pivot.cot.map((c, i) => (
                    <th
                      key={c.key}
                      className="text-right p-2.5 font-semibold border-r border-border whitespace-nowrap min-w-[100px]"
                    >
                      {nhan[i]}
                    </th>
                  ))}
                  <th className="text-right p-2.5 font-semibold whitespace-nowrap min-w-[108px] bg-muted/50">
                    {t('thuHoach.stats.colTotalKy')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pivot.farmKeys.map((fk) => {
                  const line = pivot.matrix.get(fk)!;
                  return (
                    <tr key={fk} className="border-b border-border/60 hover:bg-muted/20">
                      <td className="sticky left-0 z-[1] bg-card p-2.5 border-r border-border font-medium align-top">
                        {tenFarm(fk)}
                      </td>
                      {pivot.cot.map((c) => (
                        <td key={c.key} className="p-2 border-r border-border align-top">
                          <AggCell agg={line.get(c.key)} labels={metricLabels} />
                        </td>
                      ))}
                      <td className="p-2 align-top bg-muted/20">
                        <AggCell agg={pivot.rowTotals.get(fk)} labels={metricLabels} />
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-border bg-muted/30 font-medium">
                  <td className="sticky left-0 z-[1] bg-muted p-2.5 border-r border-border whitespace-nowrap">
                    {t(`thuHoach.stats.rowTotal.${cheDo}`)}
                  </td>
                  {pivot.cot.map((c) => (
                    <td key={c.key} className="p-2 border-r border-border align-top">
                      <AggCell agg={pivot.colTotals.get(c.key)} labels={metricLabels} />
                    </td>
                  ))}
                  <td className="p-2 align-top bg-muted/40">
                    <AggCell agg={pivot.grandTotal} labels={metricLabels} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThongKeTab;
