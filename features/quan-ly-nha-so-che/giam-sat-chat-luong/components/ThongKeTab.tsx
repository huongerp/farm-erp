import React, { lazy, Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Ban,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Package,
  Timer,
  TrendingUp,
  User,
  XCircle,
} from 'lucide-react';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { MobileFilterField } from '../../../../components/ui/MobileFilterSheet';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import { StatsKpiGrid, type StatsKpiCardItem } from '../../../../components/shared/stats';
import { formatNumberVN, formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { tinhThongKeGscl, type NhomThongKe } from '../core/thong-ke';
import { KY_PRESET_THONG_KE, khoangTheoPreset } from '../core/ky-loc';
import type { GsclThongKeParams } from '../services/giam-sat-chat-luong-service';
import { useGiamSatChatLuongThongKe } from '../hooks/use-giam-sat-chat-luong';
import { useGiamSatChatLuongViewScope } from '../hooks/use-giam-sat-chat-luong-view-scope';
import BangThongKe, { type CotBang } from './stats/BangThongKe';
import BangNgayFarm from './stats/BangNgayFarm';

const ThongKeCharts = lazy(() => import('./stats/ThongKeCharts'));

/** Mặc định khoảng thời gian = tháng này. */
const PRESET_MAC_DINH = 'thisMonth';

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const viewScope = useGiamSatChatLuongViewScope();
  const { data: branches = [] } = useBranches();

  const [range, setRange] = useState({ preset: PRESET_MAC_DINH, customStart: '', customEnd: '' });
  const [idChiNhanh, setIdChiNhanh] = useState<string[]>([]);

  const { from, to } = khoangTheoPreset(range.preset, getTodayISO(), range.customStart, range.customEnd);

  const params = useMemo<GsclThongKeParams>(
    () => ({
      viewAll: viewScope.viewAll,
      allowedBranchIds: viewScope.allowedBranchIds,
      idChiNhanh,
      ngayFrom: from || undefined,
      ngayTo: to || undefined,
    }),
    [viewScope.viewAll, viewScope.allowedBranchIds, idChiNhanh, from, to]
  );

  const { data, isLoading, isFetching, isError } = useGiamSatChatLuongThongKe(params, !viewScope.isLoading);

  const tk = useMemo(() => tinhThongKeGscl(data ?? []), [data]);

  const branchOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.ten_chi_nhanh, subLabel: b.ma_chi_nhanh })),
    [branches]
  );

  const presets = KY_PRESET_THONG_KE.map((id) => ({ id, label: t(`giamSatChatLuong.preset.${id}`) }));
  const displayLabel =
    range.preset === 'custom' && (from || to)
      ? `${from ? formatYmdToDisplay(from) : '…'} – ${to ? formatYmdToDisplay(to) : '…'}`
      : undefined;

  const handleRangeChange = (v: DateRangeValue) =>
    setRange({ preset: v.preset, customStart: v.customStart, customEnd: v.customEnd });
  const rangeActive = range.preset !== PRESET_MAC_DINH;

  const activeFilterCount = idChiNhanh.length + (rangeActive ? 1 : 0);
  const clearFilters = () => {
    setIdChiNhanh([]);
    setRange({ preset: PRESET_MAC_DINH, customStart: '', customEnd: '' });
  };

  const filterGroups = [
    {
      key: 'farm',
      label: t('giamSatChatLuong.col.farm'),
      icon: Building2,
      options: branchOptions,
      value: idChiNhanh,
      onChange: setIdChiNhanh,
    },
  ];

  const renderFilters = (
    <>
      <DateRangePicker presets={presets} value={range} onChange={handleRangeChange} displayLabel={displayLabel} />
      <FilterChipMultiSelect
        options={branchOptions}
        value={idChiNhanh}
        onChange={setIdChiNhanh}
        placeholder={t('giamSatChatLuong.col.farm')}
        icon={Building2}
        className="w-full sm:w-[170px]"
        size="md"
      />
    </>
  );

  const tiLeText = (v: number | null) => (v == null ? '—' : `${formatNumberVN(v)}%`);

  const k = tk.kpi;
  const kpiItems: StatsKpiCardItem[] = [
    {
      id: 'tong',
      label: t('giamSatChatLuong.thongKe.kpi.tongPhieu'),
      value: formatNumberVN(k.tong),
      icon: ClipboardList,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      id: 'tb',
      label: t('giamSatChatLuong.thongKe.kpi.tbPhieuNgay'),
      value: formatNumberVN(k.tbPhieuNgay),
      icon: Timer,
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
    },
    {
      id: 'soNgay',
      label: t('giamSatChatLuong.thongKe.kpi.soNgay'),
      value: formatNumberVN(k.soNgay),
      icon: Calendar,
      color: 'text-sky-600',
      bg: 'bg-sky-500/10',
    },
    {
      id: 'dat',
      label: t('giamSatChatLuong.thongKe.kpi.dat'),
      value: formatNumberVN(k.dat),
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'khongDat',
      label: t('giamSatChatLuong.thongKe.kpi.khongDat'),
      value: formatNumberVN(k.khongDat),
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-500/10',
    },
    {
      id: 'tiLe',
      label: t('giamSatChatLuong.thongKe.kpi.tiLeDat'),
      value: tiLeText(k.tiLeDat),
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      id: 'dangKiem',
      label: t('giamSatChatLuong.thongKe.kpi.dangKiem'),
      value: formatNumberVN(k.dangKiem),
      icon: Clock,
      color: 'text-sky-600',
      bg: 'bg-sky-500/10',
    },
    {
      id: 'huy',
      label: t('giamSatChatLuong.thongKe.kpi.daHuy'),
      value: formatNumberVN(k.huy),
      icon: Ban,
      color: 'text-rose-600',
      bg: 'bg-rose-500/10',
    },
  ];

  const cotNhom = (labelKey: string): CotBang<NhomThongKe>[] => [
    { key: 'k', label: t(labelKey), render: (r) => r.ten },
    {
      key: 'tong',
      label: t('giamSatChatLuong.thongKe.colSoPhieu'),
      align: 'right',
      render: (r) => formatNumberVN(r.tong),
    },
    { key: 'dat', label: t('giamSatChatLuong.thongKe.colDat'), align: 'right', render: (r) => formatNumberVN(r.dat) },
    {
      key: 'kd',
      label: t('giamSatChatLuong.thongKe.colKhongDat'),
      align: 'right',
      render: (r) => formatNumberVN(r.khongDat),
    },
    {
      key: 'tl',
      label: t('giamSatChatLuong.thongKe.colTiLeDat'),
      align: 'right',
      render: (r) => tiLeText(r.tiLeDat),
    },
    {
      key: 'ngay',
      label: t('giamSatChatLuong.thongKe.colSoNgay'),
      align: 'right',
      render: (r) => formatNumberVN(r.soNgay),
    },
    {
      key: 'tb',
      label: t('giamSatChatLuong.thongKe.colTbPhieuNgay'),
      align: 'right',
      render: (r) => formatNumberVN(r.tbPhieuNgay),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <DashboardToolbar
        className="static z-auto"
        filters={renderFilters}
        filterGroups={filterGroups}
        mobileFilterExtra={
          <MobileFilterField label={t('giamSatChatLuong.thongKe.khoangThoiGian')} icon={Calendar} active={rangeActive}>
            <DateRangePicker inline presets={presets} value={range} onChange={handleRangeChange} />
          </MobileFilterField>
        }
        mobileFilterExtraCount={rangeActive ? 1 : 0}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {isError ? (
            <p className="text-sm text-destructive">{t('giamSatChatLuong.thongKe.loadError')}</p>
          ) : isLoading || viewScope.isLoading ? (
            <LoadingSpinnerWithText text={t('giamSatChatLuong.loading')} centered className="py-10" />
          ) : (
            <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
              <div className="space-y-4">
                <StatsKpiGrid items={kpiItems} columns={4} />

                <BangNgayFarm theoNgay={tk.theoNgay} farms={tk.farms} />

                <Suspense fallback={<LoadingSpinnerWithText text={t('common.loading')} className="py-8" centered />}>
                  <ThongKeCharts tk={tk} />
                </Suspense>

                <div className="space-y-4">
                  <BangThongKe
                    title={t('giamSatChatLuong.thongKe.theoFarm')}
                    icon={Building2}
                    rows={tk.theoFarm}
                    columns={cotNhom('giamSatChatLuong.thongKe.colFarm')}
                    rowKey={(r) => r.key}
                  />
                  <BangThongKe
                    title={t('giamSatChatLuong.thongKe.theoThanhPham')}
                    icon={Package}
                    rows={tk.theoThanhPham}
                    columns={cotNhom('giamSatChatLuong.thongKe.colThanhPham')}
                    rowKey={(r) => r.key}
                  />
                  <BangThongKe
                    title={t('giamSatChatLuong.thongKe.theoNguoiTao')}
                    icon={User}
                    rows={tk.theoNguoiTao}
                    columns={cotNhom('giamSatChatLuong.thongKe.colNguoiTao')}
                    rowKey={(r) => r.key}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
