import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Building2, Tag, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useTaiSanList } from '../../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useNoiQuanLyViewScope } from '../hooks/use-noi-quan-ly-view-scope';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import NoiQuanLyStatsToolbar from './NoiQuanLyStatsToolbar';
import type { AssetStorageLocation } from '../../thiet-lap-tai-san/core/types';
import type { TaiSan } from '../../danh-muc-tai-san/core/types';
import { TRANG_THAI_HOAT_DONG, TRANG_THAI } from '../../../../lib/constants';

/** Số tài sản theo id_noi_luu */
function countAssetsByNoiLuu(assets: TaiSan[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const a of assets) {
    if (a.id_noi_luu) {
      map.set(a.id_noi_luu, (map.get(a.id_noi_luu) ?? 0) + 1);
    }
  }
  return map;
}

const NoiQuanLyStatsTab: React.FC = () => {
  const { t } = useTranslation();
  const { viewAll, allowedBranchIds } = useNoiQuanLyViewScope();
  const [filterIdChiNhanh, setFilterIdChiNhanh] = useState<string[]>([]);

  const { data: locations = [], isLoading: loadingLocations } = useAssetStorageLocations();
  const { data: assets = [], isLoading: loadingAssets } = useTaiSanList();
  const { data: branches = [] } = useBranches();

  const isLoading = loadingLocations || loadingAssets;

  const viewableLocations = useMemo(() => {
    if (viewAll) return locations;
    const set = new Set(allowedBranchIds);
    return locations.filter((l: AssetStorageLocation) => set.has(l.id_chi_nhanh));
  }, [locations, viewAll, allowedBranchIds]);

  const branchOptions = useMemo(
    () =>
      branches
        .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG)
        .map((b) => ({ label: b.ten_chi_nhanh, value: b.id, subLabel: b.ma_chi_nhanh })),
    [branches]
  );

  const filteredLocations = useMemo(() => {
    if (filterIdChiNhanh.length === 0) return viewableLocations;
    const set = new Set(filterIdChiNhanh);
    return viewableLocations.filter((l: AssetStorageLocation) => set.has(l.id_chi_nhanh));
  }, [viewableLocations, filterIdChiNhanh]);

  const stats = useMemo(() => {
    const active = filteredLocations.filter((l: AssetStorageLocation) => l.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG).length;
    const inactive = filteredLocations.filter((l: AssetStorageLocation) => l.trang_thai === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG).length;
    const assetCountByNoiLuu = countAssetsByNoiLuu(assets);
    let totalAssetsInLocations = 0;
    for (const loc of filteredLocations) {
      totalAssetsInLocations += assetCountByNoiLuu.get(loc.id) ?? 0;
    }
    return {
      total: filteredLocations.length,
      active,
      inactive,
      totalAssetsInLocations,
      assetCountByNoiLuu,
    };
  }, [filteredLocations, assets]);

  const tableRows = useMemo(() => {
    return filteredLocations.map((loc: AssetStorageLocation) => ({
      ...loc,
      assetCount: stats.assetCountByNoiLuu.get(loc.id) ?? 0,
    }));
  }, [filteredLocations, stats.assetCountByNoiLuu]);

  const byBranch = useMemo(() => {
    const map = new Map<string, { ten_chi_nhanh: string; count: number }>();
    for (const loc of filteredLocations) {
      const key = loc.id_chi_nhanh;
      const ten = loc.ten_chi_nhanh ?? branches.find((b) => b.id === key)?.ten_chi_nhanh ?? key;
      if (!map.has(key)) {
        map.set(key, { ten_chi_nhanh: ten, count: 0 });
      }
      map.get(key)!.count += 1;
    }
    return Array.from(map.entries()).map(([id, v]) => ({ id_chi_nhanh: id, ...v }));
  }, [filteredLocations, branches]);

  const handleExport = () => {
    toast.info(t('noiQuanLy.stats.exportReport') + ' – Đang phát triển');
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 py-2 border-b border-border/50 bg-muted/20 px-3 sm:px-4">
          <LoadingSpinnerWithText text={t('noiQuanLy.stats.loading')} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <NoiQuanLyStatsToolbar
        className="static z-auto"
        branchOptions={branchOptions}
        filterIdChiNhanh={filterIdChiNhanh}
        onFilterIdChiNhanhChange={setFilterIdChiNhanh}
        onExportReport={handleExport}
        onPrintReport={handlePrint}
      />
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4 space-y-4 print:gap-2 print:p-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 transition-all hover:shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
              <MapPin size={20} className="text-cyan-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {t('noiQuanLy.stats.totalLocations')}
              </p>
              <p className="text-xl font-bold text-foreground tabular-nums mt-0.5">
                {stats.total}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-primary/20 bg-primary/5 p-4 transition-all hover:shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Tag size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-primary truncate">
                {t('noiQuanLy.stats.activeLocations')}
              </p>
              <p className="text-xl font-bold text-primary tabular-nums mt-0.5">
                {stats.active}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 transition-all hover:shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Tag size={20} className="text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {t('noiQuanLy.stats.inactiveLocations')}
              </p>
              <p className="text-xl font-bold text-foreground tabular-nums mt-0.5">
                {stats.inactive}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-500/5 p-4 transition-all hover:shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Package size={20} className="text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 truncate">
                {t('noiQuanLy.stats.totalAssetsInLocations')}
              </p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                {stats.totalAssetsInLocations}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50">
          <h3 className="text-sm font-semibold text-foreground">
            {t('noiQuanLy.stats.assetsPerLocation')}
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto custom-scrollbar">
          {tableRows.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">{t('noiQuanLy.stats.noData')}</p>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                    {t('noiQuanLy.stats.locationCol')}
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                    {t('noiQuanLy.stats.branchCol')}
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                    {t('noiQuanLy.stats.statusCol')}
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-foreground/80 text-xs whitespace-nowrap text-right">
                    {t('noiQuanLy.stats.assetCountCol')}
                  </th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {tableRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-foreground">{row.ten_noi_luu}</span>
                      {row.ma_noi_luu && (
                        <span className="text-xs text-muted-foreground block">{row.ma_noi_luu}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{row.ten_chi_nhanh ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {row.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                      {row.assetCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Building2 size={14} />
            {t('noiQuanLy.stats.byBranch')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          {byBranch.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">{t('noiQuanLy.stats.noData')}</p>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                    {t('noiQuanLy.stats.branchNameCol')}
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-foreground/80 text-xs whitespace-nowrap text-right">
                    {t('noiQuanLy.stats.locationCountCol')}
                  </th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {byBranch.map((b) => (
                  <tr key={b.id_chi_nhanh}>
                    <td className="px-4 py-2.5 font-medium text-foreground">{b.ten_chi_nhanh}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{b.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default NoiQuanLyStatsTab;
