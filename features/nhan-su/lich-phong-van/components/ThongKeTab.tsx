import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';
import { useLichPhongVans } from '../hooks/use-lich-phong-van';
import { exportToExcel } from '../../../../lib/utils';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import { useLichPhongVanStats } from './stats/useLichPhongVanStats';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
import StatsCharts from './stats/StatsCharts';
import StatsTables from './stats/StatsTables';
import type { LichPhongVan } from '../core/types';
import { TRANG_THAI_LICH_PV_KEYS } from '../core/constants';

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const [ngayTu, setNgayTu] = useState('');
  const [ngayDen, setNgayDen] = useState('');

  const { data: list = [], isLoading, isError } = useLichPhongVans();

  const filteredList = useMemo(() => {
    return list.filter((item: LichPhongVan) => {
      if (ngayTu && item.ngay < ngayTu) return false;
      if (ngayDen && item.ngay > ngayDen) return false;
      return true;
    });
  }, [list, ngayTu, ngayDen]);

  const stats = useLichPhongVanStats(filteredList);

  const chartData = useMemo(
    () => ({
      chartByTrangThai: stats.byTrangThai.map((r) => ({
        name: t(r.labelKey),
        value: r.count,
      })),
      chartByHinhThuc: stats.byHinhThuc.map((r) => ({
        name: t(r.labelKey),
        value: r.count,
      })),
      chartByTrangThaiDanhGia: stats.byTrangThaiDanhGia.map((r) => ({
        name: t(r.labelKey),
        value: r.count,
      })),
    }),
    [stats.byTrangThai, stats.byHinhThuc, stats.byTrangThaiDanhGia, t]
  );

  const hasDateFilter = !!ngayTu || !!ngayDen;
  const activeFilterCount = hasDateFilter ? 1 : 0;
  const handleClearFilters = () => {
    setNgayTu('');
    setNgayDen('');
  };

  const renderFilters = (
    <>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={ngayTu}
          onChange={(e) => setNgayTu(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('lichPhongVan.filterFromDate', { date: '' })}
        />
      </div>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={ngayDen}
          onChange={(e) => setNgayDen(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('lichPhongVan.filterToDate', { date: '' })}
        />
      </div>
    </>
  );

  const handleExportReport = () => {
    if (filteredList.length === 0) {
      toast.info(t('lichPhongVan.stats.noData'));
      return;
    }
    const rows = filteredList.map((item: LichPhongVan) => ({
      [t('lichPhongVan.store.ungVienCol')]: item.ten_ung_vien ?? '',
      [t('lichPhongVan.store.soVongCol')]: item.so_vong,
      [t('lichPhongVan.store.ngayCol')]: item.ngay,
      [t('lichPhongVan.store.gioCol')]: item.gio,
      [t('lichPhongVan.store.hinhThucCol')]: item.hinh_thuc,
      [t('lichPhongVan.store.trangThaiCol')]: t(TRANG_THAI_LICH_PV_KEYS[item.trang_thai]),
      [t('lichPhongVan.store.ketQuaCol')]: item.ket_qua ?? '',
    }));
    exportToExcel(rows, 'bao_cao_lich_phong_van');
    toast.success(t('lichPhongVan.stats.exportReport'));
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{t('lichPhongVan.stats.errorLoad')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText
            text={t('lichPhongVan.stats.loading')}
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
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        onExportReport={handleExportReport}
        onPrintReport={handlePrintReport}
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {isEmpty ? (
            <EmptyState
              title={t('lichPhongVan.stats.noData')}
              description={
                activeFilterCount > 0
                  ? t('lichPhongVan.stats.noDataHint')
                  : t('lichPhongVan.stats.noDataHint')
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
              <h3 className="text-sm font-semibold text-primary">
                {t('lichPhongVan.stats.title')}
              </h3>
              <StatsCards summary={stats.summary} />
              <p className="text-xs text-muted-foreground">
                {t('lichPhongVan.stats.totalCount', { count: filteredList.length })}
                {hasDateFilter ? ` (${t('lichPhongVan.stats.filteredHint')})` : ''}
              </p>
              <StatsCharts
                chartByTrangThai={chartData.chartByTrangThai}
                chartByHinhThuc={chartData.chartByHinhThuc}
                chartByTrangThaiDanhGia={chartData.chartByTrangThaiDanhGia}
              />
              <StatsTables
                byTrangThai={stats.byTrangThai}
                byHinhThuc={stats.byHinhThuc}
                byTrangThaiDanhGia={stats.byTrangThaiDanhGia}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
