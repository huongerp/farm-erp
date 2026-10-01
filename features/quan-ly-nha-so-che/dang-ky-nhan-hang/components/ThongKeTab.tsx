import React, { lazy, Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import {
  AlarmClock,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  Hourglass,
  Package,
  Timer,
  TimerOff,
  Truck,
  User,
  Users,
} from 'lucide-react';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import { StatsKpiGrid, type StatsKpiCardItem } from '../../../../components/shared/stats';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { getDateRangeFromPreset } from '../../../../lib/date-presets';
import { formatDateTimeShort, formatNumberVN, formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { tinhThongKeDangKyNhanHang, type PhieuThoiGian, type ThongKeNhom } from '../core/thong-ke';
import { formatThoiLuong } from '../core/thoi-gian';
import type { DangKyNhanHang } from '../core/types';
import { useDangKyNhanHangById, useDangKyNhanHangThongKe } from '../hooks/use-dang-ky-nhan-hang';
import { useDangKyNhanHangViewScope } from '../hooks/use-dang-ky-nhan-hang-view-scope';
import BangThongKe, { type CotBang } from './stats/BangThongKe';
import DangKyNhanHangDetail from './DangKyNhanHangDetail';

const ThongKeCharts = lazy(() => import('./stats/ThongKeCharts'));

/** Mặc định không giới hạn thời gian (Tất cả). */
const PRESET_MAC_DINH = 'all';
const PRESET_IDS = ['today', '7days', 'thisMonth', 'lastMonth', 'thisQuarter', 'thisYear', 'all', 'custom'] as const;

function addDaysIso(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function khoangNgay(preset: string, customStart: string, customEnd: string): { from: string; to: string } {
  const today = getTodayISO();
  if (preset === 'today') return { from: today, to: today };
  if (preset === '7days') return { from: addDaysIso(today, -6), to: today };
  if (preset === 'custom') return { from: customStart, to: customEnd };
  const r = getDateRangeFromPreset(preset);
  return { from: r.dateFrom, to: r.dateTo };
}

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { canUpdate } = useModulePermissionFromContext();
  const viewScope = useDangKyNhanHangViewScope();
  const { data: branches = [] } = useBranches();

  const [range, setRange] = useState({ preset: PRESET_MAC_DINH, customStart: '', customEnd: '' });
  const [idChiNhanh, setIdChiNhanh] = useState<string[]>([]);
  const [khachHang, setKhachHang] = useState<string[]>([]);
  const [viewing, setViewing] = useState<DangKyNhanHang | null>(null);
  // Bản mới nhất sau khi check in/out ngay trong drawer.
  const { data: viewingFull } = useDangKyNhanHangById(viewing?.id);

  const { from, to } = khoangNgay(range.preset, range.customStart, range.customEnd);

  const query = useMemo(
    () => ({
      page: 0,
      pageSize: 0,
      searchTerm: '',
      viewAll: viewScope.viewAll,
      allowedBranchIds: viewScope.allowedBranchIds,
      nam: [],
      thang: [],
      trangThai: [],
      idChiNhanh,
      ngayFrom: from || undefined,
      ngayTo: to || undefined,
      sortColumn: 'ngay_dang_ky',
      sortDirection: 'asc' as const,
    }),
    [viewScope.viewAll, viewScope.allowedBranchIds, idChiNhanh, from, to],
  );

  const { data, isLoading, isFetching, isError } = useDangKyNhanHangThongKe(query, !viewScope.isLoading);

  const phieuLoc = useMemo(() => {
    const list = data?.phieu ?? [];
    return khachHang.length ? list.filter((p) => khachHang.includes(p.khach_hang?.trim() || '—')) : list;
  }, [data, khachHang]);

  const tk = useMemo(() => tinhThongKeDangKyNhanHang(phieuLoc, data?.tong ?? []), [phieuLoc, data]);

  const khachHangOptions = useMemo(() => {
    const m = new Map<string, number>();
    (data?.phieu ?? []).forEach((p) => {
      const k = p.khach_hang?.trim() || '—';
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, count]) => ({ value: k, label: k, count }));
  }, [data]);

  const branchOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.ten_chi_nhanh, subLabel: b.ma_chi_nhanh })),
    [branches],
  );

  const presets = PRESET_IDS.map((id) => ({ id, label: t(`dangKyNhanHang.stats.preset.${id}`) }));
  const displayLabel =
    range.preset === 'custom' && (from || to)
      ? `${from ? formatYmdToDisplay(from) : '…'} – ${to ? formatYmdToDisplay(to) : '…'}`
      : undefined;

  const activeFilterCount = idChiNhanh.length + khachHang.length + (range.preset !== PRESET_MAC_DINH ? 1 : 0);
  const clearFilters = () => {
    setIdChiNhanh([]);
    setKhachHang([]);
    setRange({ preset: PRESET_MAC_DINH, customStart: '', customEnd: '' });
  };

  const filterGroups = [
    {
      key: 'chiNhanh',
      label: t('dangKyNhanHang.col.chiNhanh'),
      icon: Building2,
      options: branchOptions,
      value: idChiNhanh,
      onChange: setIdChiNhanh,
    },
    {
      key: 'khachHang',
      label: t('dangKyNhanHang.col.khachHang'),
      icon: Users,
      options: khachHangOptions,
      value: khachHang,
      onChange: setKhachHang,
    },
  ];

  const renderFilters = (
    <>
      <DateRangePicker
        presets={presets}
        value={range}
        onChange={(v) => setRange({ preset: v.preset, customStart: v.customStart, customEnd: v.customEnd })}
        displayLabel={displayLabel}
      />
      <FilterChipMultiSelect
        options={branchOptions}
        value={idChiNhanh}
        onChange={setIdChiNhanh}
        placeholder={t('dangKyNhanHang.col.chiNhanh')}
        icon={Building2}
        className="w-full sm:w-[170px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={khachHangOptions}
        value={khachHang}
        onChange={setKhachHang}
        placeholder={t('dangKyNhanHang.col.khachHang')}
        icon={Users}
        className="w-full sm:w-[160px]"
        size="md"
      />
    </>
  );

  const k = tk.kpi;
  const tongXe = k.tongPhieu - k.huy;
  const pct = (n: number) => (tongXe > 0 ? `${Math.round((n / tongXe) * 100)}%` : null);
  const kpiItems: StatsKpiCardItem[] = [
    {
      id: 'tongXe',
      label: t('dangKyNhanHang.stats.kpi.tongXe'),
      value: formatNumberVN(tongXe),
      icon: Truck,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      id: 'daRa',
      label: t('dangKyNhanHang.stats.kpi.daRa'),
      value: formatNumberVN(k.daRa),
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      pct: pct(k.daRa),
    },
    {
      id: 'dangTrong',
      label: t('dangKyNhanHang.stats.kpi.dangTrongFarm'),
      value: formatNumberVN(k.dangTrongFarm),
      icon: Hourglass,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      id: 'choVao',
      label: t('dangKyNhanHang.stats.kpi.choVao'),
      value: formatNumberVN(k.choVao),
      icon: Clock,
      color: 'text-sky-600',
      bg: 'bg-sky-500/10',
    },
    {
      id: 'tb',
      label: t('dangKyNhanHang.stats.kpi.tbTrongFarm'),
      value: formatThoiLuong(k.tbPhutTrongFarm),
      icon: Timer,
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
    },
    {
      id: 'minMax',
      label: t('dangKyNhanHang.stats.kpi.nhanhNhatLauNhat'),
      value:
        k.minPhutTrongFarm == null
          ? '—'
          : `${formatThoiLuong(k.minPhutTrongFarm)} / ${formatThoiLuong(k.maxPhutTrongFarm)}`,
      icon: TimerOff,
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
    },
    {
      id: 'thung',
      label: t('dangKyNhanHang.stats.kpi.tongThung'),
      value: formatNumberVN(k.tongSoLuong),
      icon: Package,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      pct: t('dangKyNhanHang.stats.kpi.soXeCoHang', { n: k.soPhieuCoHang }),
    },
    {
      id: 'tre',
      label: t('dangKyNhanHang.stats.kpi.treQuaGio'),
      value: `${k.soXeVaoTre} / ${k.soXeRaQuaGio}`,
      icon: AlarmClock,
      color: 'text-rose-600',
      bg: 'bg-rose-500/10',
      pct: k.huy ? t('dangKyNhanHang.stats.kpi.huy', { n: k.huy }) : null,
    },
  ];

  const xeCot = (r: PhieuThoiGian) => (
    <div className="leading-snug">
      <div className="font-mono font-medium">{r.phieu.so_xe || r.phieu.so_cont || '—'}</div>
      <div className="text-xs text-muted-foreground">
        {formatYmdToDisplay(r.phieu.ngay_dang_ky)}
        {r.phieu.khach_hang ? ` · ${r.phieu.khach_hang}` : ''}
      </div>
    </div>
  );

  const cotLauNhat: CotBang<PhieuThoiGian>[] = [
    { key: 'xe', label: t('dangKyNhanHang.col.xeCont'), render: xeCot },
    {
      key: 'vao',
      label: t('dangKyNhanHang.col.gioVao'),
      render: (r) => <span className="text-xs">{formatDateTimeShort(r.phieu.tg_vao_thuc_te)}</span>,
    },
    {
      key: 'ra',
      label: t('dangKyNhanHang.col.gioRa'),
      render: (r) => <span className="text-xs">{formatDateTimeShort(r.phieu.tg_ra_thuc_te)}</span>,
    },
    {
      key: 'tl',
      label: t('dangKyNhanHang.col.thoiLuong'),
      align: 'right',
      render: (r) => formatThoiLuong(r.phutTrongFarm),
    },
    {
      key: 'sl',
      label: t('dangKyNhanHang.stats.soThung'),
      align: 'right',
      render: (r) => (r.soLuong ? formatNumberVN(r.soLuong) : '—'),
    },
  ];

  const lech = (p: number | null) =>
    p != null && p > 0 ? <span className="text-rose-600 dark:text-rose-400">+{formatThoiLuong(p)}</span> : '—';
  const cotTre: CotBang<PhieuThoiGian>[] = [
    { key: 'xe', label: t('dangKyNhanHang.col.xeCont'), render: xeCot },
    {
      key: 'dk',
      label: t('dangKyNhanHang.col.gioDangKy'),
      render: (r) => (
        <span className="text-xs tabular-nums">{`${r.phieu.gio_dang_ky_tu ?? '…'} – ${r.phieu.gio_dang_ky_den ?? '…'}`}</span>
      ),
    },
    { key: 'tre', label: t('dangKyNhanHang.stats.vaoTre'), align: 'right', render: (r) => lech(r.phutVaoTre) },
    { key: 'qua', label: t('dangKyNhanHang.stats.raQuaGio'), align: 'right', render: (r) => lech(r.phutRaQuaGio) },
  ];

  const cotChuaRa: CotBang<PhieuThoiGian>[] = [
    { key: 'xe', label: t('dangKyNhanHang.col.xeCont'), render: xeCot },
    {
      key: 'vao',
      label: t('dangKyNhanHang.col.gioVao'),
      render: (r) => <span className="text-xs">{formatDateTimeShort(r.phieu.tg_vao_thuc_te)}</span>,
    },
    {
      key: 'tl',
      label: t('dangKyNhanHang.detail.daOTrongFarm'),
      align: 'right',
      render: (r) => (
        <span className="text-amber-600 dark:text-amber-400 font-medium">{formatThoiLuong(r.phutTrongFarm)}</span>
      ),
    },
  ];

  const cotNhom = (labelKey: string): CotBang<ThongKeNhom>[] => [
    { key: 'k', label: t(labelKey), render: (r) => r.key },
    { key: 'xe', label: t('dangKyNhanHang.stats.soXe'), align: 'right', render: (r) => formatNumberVN(r.soXe) },
    { key: 'sl', label: t('dangKyNhanHang.stats.soThung'), align: 'right', render: (r) => formatNumberVN(r.soLuong) },
    { key: 'tb', label: t('dangKyNhanHang.stats.tbPhut'), align: 'right', render: (r) => formatThoiLuong(r.tbPhut) },
  ];

  const moPhieu = (r: PhieuThoiGian) => setViewing(r.phieu);

  return (
    <div className="flex flex-col h-full">
      <DashboardToolbar
        className="static z-auto"
        filters={renderFilters}
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {isError ? (
            <p className="text-sm text-destructive">{t('dangKyNhanHang.stats.loadError')}</p>
          ) : isLoading || viewScope.isLoading ? (
            <LoadingSpinnerWithText text={t('dangKyNhanHang.loading')} centered className="py-10" />
          ) : (
            <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
              <div className="space-y-4">
                <StatsKpiGrid items={kpiItems} columns={4} />
                <Suspense fallback={<LoadingSpinnerWithText text={t('common.loading')} className="py-8" centered />}>
                  <ThongKeCharts tk={tk} from={from} to={to} />
                </Suspense>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <BangThongKe
                    title={t('dangKyNhanHang.stats.xeChuaRa')}
                    icon={Hourglass}
                    rows={tk.xeChuaRa}
                    columns={cotChuaRa}
                    rowKey={(r) => r.phieu.id}
                    onRowClick={moPhieu}
                  />
                  <BangThongKe
                    title={t('dangKyNhanHang.stats.xeLauNhat')}
                    icon={Timer}
                    rows={tk.xeLauNhat}
                    columns={cotLauNhat}
                    rowKey={(r) => r.phieu.id}
                    onRowClick={moPhieu}
                  />
                  <BangThongKe
                    title={t('dangKyNhanHang.stats.xeTreQuaGio')}
                    icon={AlarmClock}
                    rows={tk.xeTreHoacQuaGio}
                    columns={cotTre}
                    rowKey={(r) => r.phieu.id}
                    onRowClick={moPhieu}
                  />
                  <BangThongKe
                    title={t('dangKyNhanHang.stats.theoHangHoa')}
                    icon={Package}
                    rows={tk.theoHangHoa}
                    columns={[
                      {
                        key: 'hh',
                        label: t('dangKyNhanHang.hangHoa.hangHoa'),
                        render: (r) => (
                          <div className="leading-snug">
                            <div>{r.ten_hang_hoa}</div>
                            <div className="text-xs text-muted-foreground font-mono">{r.ma_hang_hoa}</div>
                          </div>
                        ),
                      },
                      {
                        key: 'xe',
                        label: t('dangKyNhanHang.stats.soXe'),
                        align: 'right',
                        render: (r) => formatNumberVN(r.soXe),
                      },
                      {
                        key: 'sl',
                        label: t('dangKyNhanHang.stats.soThung'),
                        align: 'right',
                        render: (r) => formatNumberVN(r.soLuong),
                      },
                    ]}
                    rowKey={(r) => r.id_hang_hoa}
                  />
                  <BangThongKe
                    title={t('dangKyNhanHang.stats.theoKhachHang')}
                    icon={User}
                    rows={tk.theoKhachHang}
                    columns={cotNhom('dangKyNhanHang.col.khachHang')}
                    rowKey={(r) => r.key}
                  />
                  <BangThongKe
                    title={t('dangKyNhanHang.stats.theoLoaiHang')}
                    icon={Package}
                    rows={tk.theoLoaiHang}
                    columns={cotNhom('dangKyNhanHang.col.loaiHang')}
                    rowKey={(r) => r.key}
                  />
                  <BangThongKe
                    title={t('dangKyNhanHang.stats.theoChiNhanh')}
                    icon={Building2}
                    rows={tk.theoChiNhanh}
                    columns={cotNhom('dangKyNhanHang.col.chiNhanh')}
                    rowKey={(r) => r.key}
                  />
                  {k.huy > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 lg:col-span-2">
                      <Ban size={12} /> {t('dangKyNhanHang.stats.ghiChuHuy', { n: k.huy })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {viewing && (
          <DangKyNhanHangDetail
            data={viewingFull ?? viewing}
            onClose={() => setViewing(null)}
            canUpdate={canUpdate}
            canDelete={false}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThongKeTab;
