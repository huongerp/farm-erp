import React, { useMemo, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { User, UserCheck, Calendar, Warehouse, Tag } from 'lucide-react';
import { useDeXuatMuaHangViewScope } from '../hooks/use-de-xuat-mua-hang-view-scope';
import { fetchDeXuatMuaHangStatsFromRpc } from '../services/de-xuat-mua-hang-db.service';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import { MobileFilterField } from '../../../../components/ui/MobileFilterSheet';
import StatsToolbar from '../../../../components/shared/StatsToolbar';
import StatsCards from './stats/StatsCards';
const StatsCharts = lazy(() => import('./stats/StatsCharts'));
import StatsTables from './stats/StatsTables';
/** Hằng rỗng dùng chung — tránh tạo `{}` mới mỗi render làm deps của useMemo luôn đổi. */
const EMPTY_COUNTS: Record<string, number> = {};

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: khoList = [] } = useKhoList();
  const viewScope = useDeXuatMuaHangViewScope();

  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterNoiDeXuat, setFilterNoiDeXuat] = useState<string[]>([]);
  const [filterNguoiDeXuat, setFilterNguoiDeXuat] = useState<string[]>([]);
  const [filterNguoiDuyet, setFilterNguoiDuyet] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const scopeNoiDeXuatIds = useMemo(() => {
    if (viewScope.viewAll) return undefined;
    if (!viewScope.viewByBranch) return [] as number[];
    return khoList
      .filter((k) => k.id_chi_nhanh != null && viewScope.allowedBranchIds.includes(k.id_chi_nhanh))
      .map((k) => Number(k.id))
      .filter((n) => !Number.isNaN(n));
  }, [viewScope, khoList]);

  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      'deXuatMuaHang',
      'thongKe',
      filterStatus,
      filterNoiDeXuat,
      filterNguoiDeXuat,
      filterNguoiDuyet,
      dateFrom,
      dateTo,
      scopeNoiDeXuatIds,
    ],
    queryFn: async () => {
      const rpc = await fetchDeXuatMuaHangStatsFromRpc({
        dateFrom,
        dateTo,
        filterStatus,
        filterNoiDeXuat,
        filterNguoiDeXuat,
        filterNguoiDuyet,
        scopeNoiDeXuatIds,
      });
      if (!rpc) throw new Error('RPC rpc_farm_de_xuat_mua_hang_stats unavailable');
      return rpc;
    },
    staleTime: 60_000,
  });

  const statusCounts = stats?.chipByStatusKey ?? EMPTY_COUNTS;
  const noiDeXuatCounts = stats?.chipByNoiDeXuatId ?? EMPTY_COUNTS;
  const nguoiDeXuatCounts = stats?.chipByNguoiDeXuatId ?? EMPTY_COUNTS;
  const nguoiDuyetCounts = stats?.chipByNguoiDuyetId ?? EMPTY_COUNTS;

  const statusOptions = useMemo(
    () => [
      { label: t('deXuatMuaHang.status.pending'), value: 'Pending', subLabel: undefined as string | undefined, count: statusCounts['Pending'] ?? 0 },
      { label: t('deXuatMuaHang.status.waiting'), value: 'Waiting', subLabel: undefined, count: statusCounts['Waiting'] ?? 0 },
      { label: t('deXuatMuaHang.status.approved'), value: 'Approved', subLabel: undefined, count: statusCounts['Approved'] ?? 0 },
      { label: t('deXuatMuaHang.status.rejected'), value: 'Rejected', subLabel: undefined, count: statusCounts['Rejected'] ?? 0 },
    ],
    [t, statusCounts]
  );
  const noiDeXuatOptions = useMemo(
    () =>
      khoList.map((k) => ({
        label: k.ten_kho,
        value: k.id,
        subLabel: k.ma_kho,
        count: noiDeXuatCounts[k.id] ?? 0,
      })),
    [khoList, noiDeXuatCounts]
  );
  const nguoiDeXuatOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
        count: nguoiDeXuatCounts[e.id] ?? 0,
      })),
    [employees, nguoiDeXuatCounts]
  );
  const nguoiDuyetOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
        count: nguoiDuyetCounts[e.id] ?? 0,
      })),
    [employees, nguoiDuyetCounts]
  );

  const activeFilterCount =
    filterStatus.length +
    filterNoiDeXuat.length +
    filterNguoiDeXuat.length +
    filterNguoiDuyet.length +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);
  const handleClearFilters = () => {
    setFilterStatus([]);
    setFilterNoiDeXuat([]);
    setFilterNguoiDeXuat([]);
    setFilterNguoiDuyet([]);
    setDateFrom('');
    setDateTo('');
  };

  const filterGroups = useMemo(
    () => [
      { key: 'status', label: t('common.status'), icon: Tag, options: statusOptions, value: filterStatus, onChange: setFilterStatus },
      { key: 'noiDeXuat', label: t('deXuatMuaHang.form.place'), icon: Warehouse, options: noiDeXuatOptions, value: filterNoiDeXuat, onChange: setFilterNoiDeXuat },
      { key: 'nguoiDeXuat', label: t('deXuatMuaHang.form.requester'), icon: User, options: nguoiDeXuatOptions, value: filterNguoiDeXuat, onChange: setFilterNguoiDeXuat },
      { key: 'nguoiDuyet', label: t('deXuatMuaHang.form.approver'), icon: UserCheck, options: nguoiDuyetOptions, value: filterNguoiDuyet, onChange: setFilterNguoiDuyet },
    ],
    [t, statusOptions, noiDeXuatOptions, nguoiDeXuatOptions, nguoiDuyetOptions, filterStatus, filterNoiDeXuat, filterNguoiDeXuat, filterNguoiDuyet]
  );

  const filterItems: FilterChipItem[] = [
    { kind: 'group', group: filterGroups[0], className: 'w-full sm:w-[160px]' },
    {
      kind: 'custom',
      key: 'dateFrom',
      node: (
        <div className="relative w-full sm:w-[140px]">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            placeholder={t('deXuatMuaHang.stats.dateFrom')}
          />
        </div>
      ),
    },
    {
      kind: 'custom',
      key: 'dateTo',
      node: (
        <div className="relative w-full sm:w-[140px]">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            placeholder={t('deXuatMuaHang.stats.dateTo')}
          />
        </div>
      ),
    },
    { kind: 'group', group: filterGroups[1], className: 'w-full sm:w-[160px]' },
    { kind: 'group', group: filterGroups[2], className: 'w-full sm:w-[180px]' },
    { kind: 'group', group: filterGroups[3], className: 'w-full sm:w-[180px]' },
  ];

  // Bảng lọc mobile chỉ có các nhóm chọn — bù ô Từ ngày / Đến ngày của desktop.
  const mobileDateInputClass = 'w-full h-10 rounded-lg border border-border bg-background px-2 text-sm';
  const mobileFilterExtra = (
    <MobileFilterField label={t('deXuatMuaHang.filters.datePhieu')} icon={Calendar} active={!!(dateFrom || dateTo)}>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className={mobileDateInputClass}
          aria-label={t('deXuatMuaHang.stats.dateFrom')}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className={mobileDateInputClass}
          aria-label={t('deXuatMuaHang.stats.dateTo')}
        />
      </div>
    </MobileFilterField>
  );


  const handlePrintReport = () => {
    window.print();
  };

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{t('deXuatMuaHang.stats.loadError')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText text={t('deXuatMuaHang.stats.loading')} centered />
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

  const isEmpty = !stats || stats.summary.total === 0;

  return (
    <div className="flex flex-col h-full">
      <StatsToolbar
        className="static z-auto"
        filters={<ResponsiveFilterChips items={filterItems} />}
        filterGroups={filterGroups}
        mobileFilterExtra={mobileFilterExtra}
        mobileFilterExtraCount={dateFrom || dateTo ? 1 : 0}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        actionsLabel={t('deXuatMuaHang.stats.actions')}
        exportLabel={t('deXuatMuaHang.stats.exportReport')}
        printLabel={t('deXuatMuaHang.stats.printReport')}
        onPrintReport={handlePrintReport}
      />

      <div className="de-xuat-mua-hang-stats-content flex-1 min-h-0 overflow-y-auto custom-scrollbar print:overflow-visible">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {isEmpty ? (
            <EmptyState
              title={t('deXuatMuaHang.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('deXuatMuaHang.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('deXuatMuaHang.stats.noDataHint')
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
          ) : stats ? (
            <>
              <h3 className="text-sm font-semibold text-primary">{t('deXuatMuaHang.stats.title')}</h3>
              <StatsCards summary={stats.summary} />
              <Suspense fallback={<LoadingSpinnerWithText text={t('common.loading')} className="py-8" centered />}>
                <StatsCharts
                  byTrangThai={stats.byTrangThai}
                  byNoiDeXuat={stats.byNoiDeXuat}
                  byNguoiDeXuat={stats.byNguoiDeXuat}
                  byNguoiDuyet={stats.byNguoiDuyet}
                  byMonth={stats.byMonth}
                />
              </Suspense>
              <StatsTables
                byTrangThai={stats.byTrangThai}
                byNoiDeXuat={stats.byNoiDeXuat}
                byNguoiDeXuat={stats.byNguoiDeXuat}
                byNguoiDuyet={stats.byNguoiDuyet}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
