import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, MapPin, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { getTaiSanList } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { useAssetGroups } from '../../thiet-lap-tai-san/hooks/use-nhom-tai-san';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useAssetStatuses } from '../../thiet-lap-tai-san/hooks/use-trang-thai';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useKhauHaoStats } from './stats/useKhauHaoStats';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
import StatsCharts from './stats/StatsCharts';
import StatsTables from './stats/StatsTables';
import type { TaiSan } from '../../danh-muc-tai-san/core/types';

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: list = [], isLoading, isError } = useQuery({
    queryKey: ['taiSanList'],
    queryFn: getTaiSanList,
    staleTime: 1000 * 60 * 2,
  });
  const { data: groups = [] } = useAssetGroups();
  const { data: locations = [] } = useAssetStorageLocations();
  const { data: statuses = [] } = useAssetStatuses();

  const [filterNhom, setFilterNhom] = useState<string[]>([]);
  const [filterNoiLuu, setFilterNoiLuu] = useState<string[]>([]);
  const [filterTrangThai, setFilterTrangThai] = useState<string[]>([]);

  const filteredList = useMemo(() => {
    return list.filter((item: TaiSan) => {
      const matchNhom = filterNhom.length === 0 || (item.id_nhom && filterNhom.includes(item.id_nhom));
      const matchNoiLuu = filterNoiLuu.length === 0 || (item.id_noi_luu && filterNoiLuu.includes(item.id_noi_luu));
      const matchTrangThai = filterTrangThai.length === 0 || (item.id_trang_thai && filterTrangThai.includes(item.id_trang_thai));
      return matchNhom && matchNoiLuu && matchTrangThai;
    });
  }, [list, filterNhom, filterNoiLuu, filterTrangThai]);

  const stats = useKhauHaoStats(filteredList);

  const groupOptions = useMemo(
    () => groups.map((g) => ({ label: g.ten, value: g.id, subLabel: g.ma })),
    [groups]
  );
  const locationOptions = useMemo(
    () => locations.map((l) => ({ label: l.ten_noi_luu, value: l.id, subLabel: l.ma_noi_luu })),
    [locations]
  );
  const assetStatusOptions = useMemo(
    () => statuses.map((s) => ({ label: s.ten, value: s.id, subLabel: s.ma })),
    [statuses]
  );

  const activeFilterCount = filterNhom.length + filterNoiLuu.length + filterTrangThai.length;
  const handleClearFilters = () => {
    setFilterNhom([]);
    setFilterNoiLuu([]);
    setFilterTrangThai([]);
  };

  const filterGroups = useMemo(
    () => [
      { key: 'id_nhom', label: t('khauHaoTaiSan.detail.nhomCol'), icon: Layers, options: groupOptions, value: filterNhom, onChange: setFilterNhom },
      { key: 'id_noi_luu', label: t('khauHaoTaiSan.stats.noiLuuCol'), icon: MapPin, options: locationOptions, value: filterNoiLuu, onChange: setFilterNoiLuu },
      { key: 'id_trang_thai', label: t('khauHaoTaiSan.stats.trangThaiTaiSanCol'), icon: Tag, options: assetStatusOptions, value: filterTrangThai, onChange: setFilterTrangThai },
    ],
    [groupOptions, locationOptions, assetStatusOptions, filterNhom, filterNoiLuu, filterTrangThai, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={groupOptions}
        value={filterNhom}
        onChange={setFilterNhom}
        placeholder={t('khauHaoTaiSan.detail.nhomCol')}
        icon={Layers}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={locationOptions}
        value={filterNoiLuu}
        onChange={setFilterNoiLuu}
        placeholder={t('khauHaoTaiSan.stats.noiLuuCol')}
        icon={MapPin}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={assetStatusOptions}
        value={filterTrangThai}
        onChange={setFilterTrangThai}
        placeholder={t('khauHaoTaiSan.stats.trangThaiTaiSanCol')}
        icon={Tag}
        className="w-full sm:w-[160px]"
        size="md"
      />
    </>
  );

  const handleExportReport = () => {
    toast.info(t('khauHaoTaiSan.stats.exportReport') + ' – Đang phát triển');
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
            text={t('khauHaoTaiSan.stats.loading')}
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

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {isEmpty ? (
            <EmptyState
              title={t('khauHaoTaiSan.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('khauHaoTaiSan.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('khauHaoTaiSan.stats.noDataHint')
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
              <StatsCharts chartByNhom={stats.chartByNhom} />
              <StatsTables byNhom={stats.byNhom} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
