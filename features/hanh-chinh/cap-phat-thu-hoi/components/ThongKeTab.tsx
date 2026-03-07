import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';
import { usePhieuList } from '../hooks/use-cap-phat-thu-hoi';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useEmployees } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
import StatsCharts from './stats/StatsCharts';
import StatsTables from './stats/StatsTables';
import { usePhieuStats } from './stats/usePhieuStats';
import { LOAI_PHIEU_OPTIONS } from '../core/constants';
import { phieuToExportRow, PHIEU_EXPORT_COLUMNS } from '../utils/export-phieu';
import { exportToExcel } from '../../../../lib/utils';
import type { PhieuCapPhatThuHoi } from '../core/types';

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: list = [], isLoading, isError } = usePhieuList({ filter: 'all' });
  const { data: locations = [] } = useAssetStorageLocations();
  const { data: employees = [] } = useEmployees();

  const [filterLoai, setFilterLoai] = useState<string[]>([]);
  const [filterNoiLuu, setFilterNoiLuu] = useState<string[]>([]);
  const [filterNguoiThucHien, setFilterNguoiThucHien] = useState<string[]>([]);

  const filteredList = useMemo(() => {
    return list.filter((p: PhieuCapPhatThuHoi) => {
      if (filterLoai.length > 0 && !filterLoai.includes(p.loai_phieu)) return false;
      if (filterNoiLuu.length > 0 && !filterNoiLuu.includes(p.id_noi_luu_sau)) return false;
      if (filterNguoiThucHien.length > 0 && !filterNguoiThucHien.includes(p.id_nguoi_thuc_hien)) return false;
      return true;
    });
  }, [list, filterLoai, filterNoiLuu, filterNguoiThucHien]);

  const stats = usePhieuStats(filteredList);

  const countByLoai = useMemo(() => {
    const m: Record<string, number> = {};
    list.forEach((p) => { m[p.loai_phieu] = (m[p.loai_phieu] ?? 0) + 1; });
    return m;
  }, [list]);
  const countByNoiLuu = useMemo(() => {
    const m: Record<string, number> = {};
    list.forEach((p) => {
      if (p.id_noi_luu_sau) m[p.id_noi_luu_sau] = (m[p.id_noi_luu_sau] ?? 0) + 1;
    });
    return m;
  }, [list]);
  const countByNguoiThucHien = useMemo(() => {
    const m: Record<string, number> = {};
    list.forEach((p) => {
      if (p.id_nguoi_thuc_hien) m[p.id_nguoi_thuc_hien] = (m[p.id_nguoi_thuc_hien] ?? 0) + 1;
    });
    return m;
  }, [list]);

  const loaiOptions = useMemo(
    () => LOAI_PHIEU_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value, count: countByLoai[o.value] ?? 0 })),
    [t, countByLoai]
  );
  const noiLuuOptions = useMemo(
    () => locations.map((l) => ({ label: l.ten_noi_luu, value: l.id, subLabel: l.ma_noi_luu, count: countByNoiLuu[l.id] ?? 0 })),
    [locations, countByNoiLuu]
  );
  const nguoiThucHienOptions = useMemo(
    () => employees.map((e) => ({ label: e.ho_ten, value: e.id, subLabel: e.ma_nhan_vien, count: countByNguoiThucHien[e.id] ?? 0 })),
    [employees, countByNguoiThucHien]
  );

  const activeFilterCount = filterLoai.length + filterNoiLuu.length + filterNguoiThucHien.length;
  const handleClearFilters = () => {
    setFilterLoai([]);
    setFilterNoiLuu([]);
    setFilterNguoiThucHien([]);
  };

  const filterGroups = useMemo(
    () => [
      { key: 'loai', label: t('capPhatThuHoi.store.loaiCol'), icon: Package, options: loaiOptions, value: filterLoai, onChange: setFilterLoai },
      { key: 'noi_luu', label: t('capPhatThuHoi.store.noiLuuSauCol'), icon: MapPin, options: noiLuuOptions, value: filterNoiLuu, onChange: setFilterNoiLuu },
      { key: 'nguoi_thuc_hien', label: t('capPhatThuHoi.store.nguoiThucHienCol'), icon: User, options: nguoiThucHienOptions, value: filterNguoiThucHien, onChange: setFilterNguoiThucHien },
    ],
    [loaiOptions, noiLuuOptions, nguoiThucHienOptions, filterLoai, filterNoiLuu, filterNguoiThucHien, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={loaiOptions}
        value={filterLoai}
        onChange={setFilterLoai}
        placeholder={t('capPhatThuHoi.store.loaiCol')}
        icon={Package}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={noiLuuOptions}
        value={filterNoiLuu}
        onChange={setFilterNoiLuu}
        placeholder={t('capPhatThuHoi.store.noiLuuSauCol')}
        icon={MapPin}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={nguoiThucHienOptions}
        value={filterNguoiThucHien}
        onChange={setFilterNguoiThucHien}
        placeholder={t('capPhatThuHoi.store.nguoiThucHienCol')}
        icon={User}
        className="w-full sm:w-[180px]"
        size="md"
      />
    </>
  );

  const handleExportReport = () => {
    const rows = filteredList.map(phieuToExportRow);
    if (rows.length === 0) {
      toast.info(t('capPhatThuHoi.stats.noData'));
      return;
    }
    const headers = PHIEU_EXPORT_COLUMNS.reduce((acc, c) => ({ ...acc, [c.key]: c.label }), {} as Record<string, string>);
    const dataForExport = rows.map((r) => {
      const out: Record<string, string> = {};
      PHIEU_EXPORT_COLUMNS.forEach((c) => { out[c.label] = String(r[c.key] ?? ''); });
      return out;
    });
    exportToExcel(dataForExport, t('capPhatThuHoi.export.fileName'));
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
            text={t('capPhatThuHoi.stats.loading')}
            centered
          />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
              title={t('capPhatThuHoi.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('danhSachTaiSan.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('capPhatThuHoi.stats.noDataHint')
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
              <StatsCharts
                chartByType={stats.chartByType}
                chartByMonth={stats.chartByMonth}
                chartByNoiLuu={stats.chartByNoiLuu}
                chartByNguoiThucHien={stats.chartByNguoiThucHien}
              />
              <StatsTables
                byType={stats.byType}
                byNoiLuu={stats.byNoiLuu}
                byNguoiThucHien={stats.byNguoiThucHien}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
