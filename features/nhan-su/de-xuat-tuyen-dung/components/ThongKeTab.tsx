import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Briefcase, Tag } from 'lucide-react';
import { useDeXuatTuyenDungWithCounts } from '../hooks/use-de-xuat-tuyen-dung-with-counts';
import { usePositions } from '@/features/he-thong/chuc-vu/hooks/use-chuc-vu';
import { exportToExcel } from '../../../../lib/utils';
import { deXuatTuyenDungToExportRow, DE_XUAT_TUYEN_DUNG_EXPORT_FILENAME } from '../utils/export-thong-ke';
import { useDeXuatTuyenDungStats } from './stats/useDeXuatTuyenDungStats';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
import StatsCharts from './stats/StatsCharts';
import StatsTables from './stats/StatsTables';
import type { DeXuatTuyenDungWithCounts } from '../core/types';

const STATUS_KEYS: Record<number, string> = {
  0: 'deXuatTuyenDung.status.nhap',
  1: 'deXuatTuyenDung.status.choDuyet',
  2: 'deXuatTuyenDung.status.daDuyet',
  3: 'deXuatTuyenDung.status.tuChoi',
};

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterChucVu, setFilterChucVu] = useState<string[]>([]);

  const { data: list = [], isLoading, isError } = useDeXuatTuyenDungWithCounts();
  const { data: positions = [] } = usePositions();

  const positionMap = useMemo(() => {
    const m = new Map<string, string>();
    positions.forEach((p) => m.set(p.id, p.ten_chuc_vu));
    return m;
  }, [positions]);

  const filteredList = useMemo(() => {
    return list.filter((item: DeXuatTuyenDungWithCounts) => {
      const matchStatus =
        filterStatus.length === 0 || filterStatus.includes(String(item.trang_thai));
      const matchChucVu =
        filterChucVu.length === 0 || (item.id_chuc_vu && filterChucVu.includes(item.id_chuc_vu));
      return matchStatus && matchChucVu;
    });
  }, [list, filterStatus, filterChucVu]);

  const stats = useDeXuatTuyenDungStats(filteredList, positionMap);

  const countByStatus = useMemo(() => {
    const m: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0 };
    list.forEach((item) => {
      const k = String(item.trang_thai);
      if (k in m) m[k]++;
    });
    return m;
  }, [list]);
  const countByChucVu = useMemo(() => {
    const m: Record<string, number> = {};
    list.forEach((item) => {
      if (item.id_chuc_vu) m[item.id_chuc_vu] = (m[item.id_chuc_vu] ?? 0) + 1;
    });
    return m;
  }, [list]);

  const statusOptions = useMemo(
    () =>
      ([0, 1, 2, 3] as const).map((s) => ({
        label: t(STATUS_KEYS[s]),
        value: String(s),
        count: countByStatus[String(s)] ?? 0,
      })),
    [t, countByStatus]
  );
  const chucVuOptions = useMemo(
    () =>
      positions.map((p) => ({
        label: p.ten_chuc_vu,
        value: p.id,
        subLabel: p.ma_chuc_vu,
        count: countByChucVu[p.id] ?? 0,
      })),
    [positions, countByChucVu]
  );

  const activeFilterCount = filterStatus.length + filterChucVu.length;
  const handleClearFilters = () => {
    setFilterStatus([]);
    setFilterChucVu([]);
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('deXuatTuyenDung.stats.statusLabel'),
        icon: Tag,
        options: statusOptions,
        value: filterStatus,
        onChange: setFilterStatus,
      },
      {
        key: 'id_chuc_vu',
        label: t('deXuatTuyenDung.stats.chucVu'),
        icon: Briefcase,
        options: chucVuOptions,
        value: filterChucVu,
        onChange: setFilterChucVu,
      },
    ],
    [statusOptions, chucVuOptions, filterStatus, filterChucVu, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filterStatus}
        onChange={setFilterStatus}
        placeholder={t('deXuatTuyenDung.stats.statusLabel')}
        icon={Tag}
        className="w-full sm:w-[140px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={chucVuOptions}
        value={filterChucVu}
        onChange={setFilterChucVu}
        placeholder={t('deXuatTuyenDung.filterChucVu')}
        icon={Briefcase}
        className="w-full sm:w-[160px]"
        size="md"
      />
    </>
  );

  const handleExportReport = () => {
    if (filteredList.length === 0) {
      toast.info(t('deXuatTuyenDung.stats.noData'));
      return;
    }
    const rows = filteredList.map(deXuatTuyenDungToExportRow);
    exportToExcel(rows, DE_XUAT_TUYEN_DUNG_EXPORT_FILENAME);
    toast.success(t('deXuatTuyenDung.stats.exportReport'));
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
            text={t('deXuatTuyenDung.stats.loading')}
            centered
          />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
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
              title={t('deXuatTuyenDung.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('deXuatTuyenDung.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('deXuatTuyenDung.stats.noDataHint')
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
                chartByStatus={stats.chartByStatus}
                chartByChucVu={stats.chartByChucVu}
              />
              <StatsTables
                byStatus={stats.byStatusList}
                byChucVu={stats.byChucVu}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
