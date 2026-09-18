import React, { lazy, Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Link2, PiggyBank, Tags, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import ErrorState from '../../../../components/shared/ErrorState';
import { StatsKpiGrid, StatsTableCard } from '../../../../components/shared/stats';
import type { StatsKpiCardItem, StatsTableRow } from '../../../../components/shared/stats';
import { formatNumberVN } from '../../../../lib/utils';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useThuChiQuyViewScope } from '../../thu-chi-quy/hooks/use-thu-chi-quy-view-scope';
import { resolveAllowedChiNhanhIds } from '../../thu-chi-quy/utils/quy-view-scope';
import { nguonChungTuToI18nKey } from '../../thu-chi-quy/core/constants';
import type { ThuChiNguon } from '../../thu-chi-quy/core/types';
import { useThongKeQuyStats } from '../hooks/use-thong-ke-quy';
import { tyTrongChiTheoHangMuc } from '../utils/thong-ke-quy-aggregate';
import ThongKeToolbar, { DEFAULT_THONG_KE_FILTER, resolveDateRange, type ThongKeToolbarValue } from './ThongKeToolbar';

const StatsCharts = lazy(() => import('./StatsCharts'));

const money = (v: number) => formatNumberVN(v, { maxFractionDigits: 0 });

const TongQuanTab: React.FC = () => {
  const { t } = useTranslation();
  const viewScope = useThuChiQuyViewScope();
  const { data: branches = [] } = useBranches();
  const [filter, setFilter] = useState<ThongKeToolbarValue>(DEFAULT_THONG_KE_FILTER);

  const allowedBranches = useMemo(() => {
    if (viewScope.viewAll) return branches;
    const allowed = new Set(viewScope.allowedBranchIds.map(String));
    return branches.filter((b) => allowed.has(String(b.id)));
  }, [branches, viewScope.viewAll, viewScope.allowedBranchIds]);

  const chiNhanhIds = useMemo(() => {
    if (filter.chiNhanhId) return [Number(filter.chiNhanhId)];
    return resolveAllowedChiNhanhIds(viewScope);
  }, [filter.chiNhanhId, viewScope]);

  const range = useMemo(() => resolveDateRange(filter), [filter]);

  const statsQuery = useThongKeQuyStats(
    {
      tuNgay: range.tuNgay,
      denNgay: range.denNgay,
      chiNhanhIds,
      loai: filter.loai || null,
      hangMucIds: [],
    },
    !viewScope.isLoading
  );
  const stats = statsQuery.data;

  const kpis: StatsKpiCardItem[] = useMemo(
    () => [
      {
        id: 'tonDauKy',
        label: t('thongKeQuy.cards.tonDauKy'),
        value: money(stats?.ton_dau_ky ?? 0),
        icon: PiggyBank,
        color: 'text-sky-600 dark:text-sky-400',
        bg: 'bg-sky-500/10',
      },
      {
        id: 'tongThu',
        label: t('thongKeQuy.cards.tongThu'),
        value: money(stats?.tong_thu ?? 0),
        icon: TrendingUp,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10',
      },
      {
        id: 'tongChi',
        label: t('thongKeQuy.cards.tongChi'),
        value: money(stats?.tong_chi ?? 0),
        icon: TrendingDown,
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-500/10',
      },
      {
        id: 'tonCuoiKy',
        label: t('thongKeQuy.cards.tonCuoiKy'),
        value: money(stats?.ton_cuoi_ky ?? 0),
        icon: Wallet,
        color: 'text-primary',
        bg: 'bg-primary/10',
        pct: t('thongKeQuy.cards.soPhieu', { count: stats?.so_phieu ?? 0 }),
      },
    ],
    [t, stats]
  );

  const chiTheoHangMuc = useMemo(() => tyTrongChiTheoHangMuc(stats?.theo_hang_muc ?? []), [stats]);

  const rowsHangMuc: StatsTableRow[] = useMemo(
    () =>
      chiTheoHangMuc.map((r) => ({
        id: r.ten,
        label: r.ten,
        value: `${money(r.chi)}  (${(r.tyLe * 100).toFixed(1)}%)`,
      })),
    [chiTheoHangMuc]
  );

  const rowsChiNhanh: StatsTableRow[] = useMemo(
    () =>
      (stats?.theo_chi_nhanh ?? []).map((r) => ({
        id: r.id ?? r.ten,
        label: r.ten ?? '—',
        value: `${money(r.thu)} / ${money(r.chi)}`,
      })),
    [stats]
  );

  const rowsNguon: StatsTableRow[] = useMemo(
    () =>
      (stats?.theo_nguon_chung_tu ?? []).map((r) => ({
        id: r.nguon,
        label:
          r.nguon && r.nguon !== 'khong_lien_ket'
            ? t(nguonChungTuToI18nKey(r.nguon as ThuChiNguon))
            : t('thongKeQuy.tables.khongLienKet'),
        value: money(r.chi),
      })),
    [stats, t]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ThongKeToolbar
        branches={allowedBranches.map((b) => ({ id: String(b.id), ten_chi_nhanh: b.ten_chi_nhanh }))}
        allowAllBranches={viewScope.viewAll}
        value={filter}
        onChange={setFilter}
      />

      <div className="flex-1 min-h-0 overflow-auto p-3 space-y-3">
        {statsQuery.isPending ? (
          <LoadingSpinnerWithText text={t('common.loading')} />
        ) : statsQuery.isError ? (
          <ErrorState onRetry={() => statsQuery.refetch()} />
        ) : (
          <>
            <StatsKpiGrid items={kpis} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Suspense fallback={<LoadingSpinnerWithText text={t('common.loading')} />}>
                <StatsCharts theoThang={stats?.theo_thang ?? []} chiTheoHangMuc={chiTheoHangMuc} />
              </Suspense>

              <StatsTableCard
                title={t('thongKeQuy.tables.theoHangMuc')}
                icon={Tags}
                rows={rowsHangMuc}
                columnLabelKey="thuChiQuy.store.hangMucCol"
                columnValueKey="thuChiQuy.store.chiCol"
              />

              {viewScope.viewAll && (
                <StatsTableCard
                  title={t('thongKeQuy.tables.theoChiNhanh')}
                  icon={Building2}
                  rows={rowsChiNhanh}
                  columnLabelKey="thuChiQuy.store.chiNhanhCol"
                  columnValueKey="thongKeQuy.tables.thuChiCol"
                />
              )}

              <StatsTableCard
                title={t('thongKeQuy.tables.theoNguon')}
                icon={Link2}
                rows={rowsNguon}
                columnLabelKey="thuChiQuy.store.nguonCol"
                columnValueKey="thuChiQuy.store.chiCol"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TongQuanTab;
