import React, { useMemo, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Layers, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useTaiSanList } from '../hooks/use-danh-muc-tai-san';
import { exportToExcel } from '../../../../lib/utils';
import { taiSanToExportRow, TAI_SAN_EXPORT_FILENAME } from '../utils/export-danh-sach-tai-san';
import { useTaiSanStats } from './stats/useTaiSanStats';
import { useAssetGroups } from '../../thiet-lap-tai-san/hooks/use-nhom-tai-san';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useAssetStatuses } from '../../thiet-lap-tai-san/hooks/use-trang-thai';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
const StatsCharts = lazy(() => import('./stats/StatsCharts'));
import StatsTables from './stats/StatsTables';
import type { TaiSan } from '../core/types';

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: list = [], isLoading, isError } = useTaiSanList();
  const { data: groups = [] } = useAssetGroups();
  const { data: locations = [] } = useAssetStorageLocations();
  const { data: statuses = [] } = useAssetStatuses();

  const [filterNhom, setFilterNhom] = useState<string[]>([]);
  const [filterNoiLuu, setFilterNoiLuu] = useState<string[]>([]);
  const [filterTrangThai, setFilterTrangThai] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  const filteredList = useMemo(() => {
    return list.filter((item: TaiSan) => {
      const matchNhom = filterNhom.length === 0 || (item.id_nhom && filterNhom.includes(item.id_nhom));
      const matchNoiLuu = filterNoiLuu.length === 0 || (item.id_noi_luu && filterNoiLuu.includes(item.id_noi_luu));
      const matchTrangThai = filterTrangThai.length === 0 || (item.id_trang_thai && filterTrangThai.includes(item.id_trang_thai));
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(String(item.trang_thai ?? 1));
      return matchNhom && matchNoiLuu && matchTrangThai && matchStatus;
    });
  }, [list, filterNhom, filterNoiLuu, filterTrangThai, filterStatus]);

  const stats = useTaiSanStats(filteredList);

  const countByStatus = useMemo(() => {
    const m: Record<string, number> = { '1': 0, '0': 0 };
    list.forEach((item) => {
      const k = String(item.trang_thai ?? 1);
      if (k in m) m[k]++;
    });
    return m;
  }, [list]);
  const countByNhom = useMemo(() => {
    const m: Record<string, number> = {};
    list.forEach((item) => {
      if (item.id_nhom) m[item.id_nhom] = (m[item.id_nhom] ?? 0) + 1;
    });
    return m;
  }, [list]);
  const countByNoiLuu = useMemo(() => {
    const m: Record<string, number> = {};
    list.forEach((item) => {
      if (item.id_noi_luu) m[item.id_noi_luu] = (m[item.id_noi_luu] ?? 0) + 1;
    });
    return m;
  }, [list]);
  const countByTrangThai = useMemo(() => {
    const m: Record<string, number> = {};
    list.forEach((item) => {
      if (item.id_trang_thai) m[item.id_trang_thai] = (m[item.id_trang_thai] ?? 0) + 1;
    });
    return m;
  }, [list]);

  const groupOptions = useMemo(
    () => groups.map((g) => ({ label: g.ten, value: g.id, subLabel: g.ma, count: countByNhom[g.id] ?? 0 })),
    [groups, countByNhom]
  );
  const locationOptions = useMemo(
    () => locations.map((l) => ({ label: l.ten_noi_luu, value: l.id, subLabel: l.ma_noi_luu, count: countByNoiLuu[l.id] ?? 0 })),
    [locations, countByNoiLuu]
  );
  const assetStatusOptions = useMemo(
    () => statuses.map((s) => ({ label: s.ten, value: s.id, subLabel: s.ma, count: countByTrangThai[s.id] ?? 0 })),
    [statuses, countByTrangThai]
  );
  const statusActiveInactiveOptions = useMemo(
    () => [
      { label: t('danhSachTaiSan.stats.active'), value: '1', subLabel: undefined, count: countByStatus['1'] ?? 0 },
      { label: t('danhSachTaiSan.stats.inactive'), value: '0', subLabel: undefined, count: countByStatus['0'] ?? 0 },
    ],
    [t, countByStatus]
  );

  const activeFilterCount = filterNhom.length + filterNoiLuu.length + filterTrangThai.length + filterStatus.length;
  const handleClearFilters = () => {
    setFilterNhom([]);
    setFilterNoiLuu([]);
    setFilterTrangThai([]);
    setFilterStatus([]);
  };

  const filterGroups = useMemo(
    () => [
      { key: 'status', label: t('danhSachTaiSan.stats.statusLabel'), icon: Tag, options: statusActiveInactiveOptions, value: filterStatus, onChange: setFilterStatus },
      { key: 'id_nhom', label: t('danhSachTaiSan.store.nhomCol'), icon: Layers, options: groupOptions, value: filterNhom, onChange: setFilterNhom },
      { key: 'id_noi_luu', label: t('danhSachTaiSan.store.noiLuuCol'), icon: MapPin, options: locationOptions, value: filterNoiLuu, onChange: setFilterNoiLuu },
      { key: 'id_trang_thai', label: t('danhSachTaiSan.store.trangThaiCol'), icon: Tag, options: assetStatusOptions, value: filterTrangThai, onChange: setFilterTrangThai },
    ],
    [groupOptions, locationOptions, assetStatusOptions, statusActiveInactiveOptions, filterNhom, filterNoiLuu, filterTrangThai, filterStatus, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusActiveInactiveOptions}
        value={filterStatus}
        onChange={setFilterStatus}
        placeholder={t('danhSachTaiSan.stats.statusLabel')}
        icon={Tag}
        className="w-full sm:w-[140px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={groupOptions}
        value={filterNhom}
        onChange={setFilterNhom}
        placeholder={t('danhSachTaiSan.store.nhomCol')}
        icon={Layers}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={locationOptions}
        value={filterNoiLuu}
        onChange={setFilterNoiLuu}
        placeholder={t('danhSachTaiSan.store.noiLuuCol')}
        icon={MapPin}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={assetStatusOptions}
        value={filterTrangThai}
        onChange={setFilterTrangThai}
        placeholder={t('danhSachTaiSan.store.trangThaiCol')}
        icon={Tag}
        className="w-full sm:w-[160px]"
        size="md"
      />
    </>
  );

  const handleExportReport = () => {
    if (filteredList.length === 0) {
      toast.info(t('danhSachTaiSan.stats.noData'));
      return;
    }
    const rows = filteredList.map(taiSanToExportRow);
    exportToExcel(rows, `thong_ke_tai_san_${TAI_SAN_EXPORT_FILENAME}`);
    toast.success(t('danhSachTaiSan.stats.exportReport'));
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">
          {t('common.error') || 'Có lỗi khi tải dữ liệu.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText
            text={t('danhSachTaiSan.stats.loading')}
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

      <div className="danh-muc-tai-san-stats-content flex-1 min-h-0 overflow-y-auto custom-scrollbar print:overflow-visible">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {isEmpty ? (
            <EmptyState
              title={t('danhSachTaiSan.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('danhSachTaiSan.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('danhSachTaiSan.stats.noDataHint')
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
              <StatsCards summary={stats.summary} />
              <Suspense fallback={<LoadingSpinnerWithText text={t('common.loading')} className="py-8" centered />}>
                <StatsCharts
                  chartByNhom={stats.chartByNhom}
                  chartByNoiLuu={stats.chartByNoiLuu}
                  chartByTrangThai={stats.chartByTrangThai}
                />
              </Suspense>
              <StatsTables
                byNhom={stats.byNhom}
                byNoiLuu={stats.byNoiLuu}
                byTrangThai={stats.byTrangThai}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
