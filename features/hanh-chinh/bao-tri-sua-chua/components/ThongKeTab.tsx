import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, Calendar, Package } from 'lucide-react';
import { toast } from 'sonner';
import { usePhieuBaoTriList } from '../hooks/use-bao-tri-sua-chua';
import { HANG_MUC_OPTIONS } from '../core/constants';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
import StatsCharts from './stats/StatsCharts';
import StatsTables from './stats/StatsTables';
import { usePhieuBaoTriStats } from './stats/usePhieuBaoTriStats';
import { exportToExcel } from '../../../../lib/utils';
import type { PhieuBaoTriSuaChua } from '../core/types';
import type { HangMuc } from '../core/types';

function phieuToExportRow(p: PhieuBaoTriSuaChua, t: (k: string) => string): Record<string, string> {
  const hangMucLabel = p.hang_muc === 'bao_tri' ? t('baoTriSuaChua.hangMuc.bao_tri') : t('baoTriSuaChua.hangMuc.sua_chua');
  return {
    hang_muc: hangMucLabel,
    tai_san: p.ten_tai_san || p.ma_tai_san || '',
    ngay_yeu_cau: p.ngay_yeu_cau,
    ngay_hen: p.ngay_hen,
    nguoi_phu_trach: p.ten_nguoi_phu_trach || '',
    trang_thai: p.trang_thai === 1 ? t('baoTriSuaChua.statusCompleted') : t('baoTriSuaChua.statusPending'),
    mo_ta: p.mo_ta || '',
  };
}

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: list = [], isLoading, isError } = usePhieuBaoTriList({});

  const [filterHangMuc, setFilterHangMuc] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const filteredList = useMemo(() => {
    return list.filter((p: PhieuBaoTriSuaChua) => {
      if (filterHangMuc.length > 0 && !filterHangMuc.includes(p.hang_muc)) return false;
      if (filterDateFrom && p.ngay_yeu_cau < filterDateFrom) return false;
      if (filterDateTo && p.ngay_yeu_cau > filterDateTo) return false;
      return true;
    });
  }, [list, filterHangMuc, filterDateFrom, filterDateTo]);

  const stats = usePhieuBaoTriStats(filteredList);

  const countByHangMuc = useMemo(() => {
    const m: Record<string, number> = {};
    list.forEach((p) => { m[p.hang_muc] = (m[p.hang_muc] ?? 0) + 1; });
    return m;
  }, [list]);

  const hangMucOptions = useMemo(
    () => HANG_MUC_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value, count: countByHangMuc[o.value] ?? 0 })),
    [t, countByHangMuc]
  );

  const activeFilterCount =
    filterHangMuc.length + (filterDateFrom ? 1 : 0) + (filterDateTo ? 1 : 0);
  const handleClearFilters = () => {
    setFilterHangMuc([]);
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const filterGroups = useMemo(
    () => [
      { key: 'hang_muc', label: t('baoTriSuaChua.store.hangMucCol'), icon: Wrench, options: hangMucOptions, value: filterHangMuc, onChange: setFilterHangMuc },
    ],
    [hangMucOptions, filterHangMuc, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect<HangMuc>
        options={hangMucOptions}
        value={filterHangMuc}
        onChange={setFilterHangMuc}
        placeholder={t('baoTriSuaChua.store.hangMucCol')}
        icon={Wrench}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm"
          placeholder={t('baoTriSuaChua.filter.dateFrom')}
        />
      </div>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm"
          placeholder={t('baoTriSuaChua.filter.dateTo')}
        />
      </div>
    </>
  );

  const handleExportReport = () => {
    if (filteredList.length === 0) {
      toast.info(t('baoTriSuaChua.stats.noData'));
      return;
    }
    const headers = {
      hang_muc: t('baoTriSuaChua.store.hangMucCol'),
      tai_san: t('baoTriSuaChua.store.taiSanCol'),
      ngay_yeu_cau: t('baoTriSuaChua.store.ngayYeuCauCol'),
      ngay_hen: t('baoTriSuaChua.store.ngayHenCol'),
      nguoi_phu_trach: t('baoTriSuaChua.store.nguoiPhuTrachCol'),
      trang_thai: t('baoTriSuaChua.store.trangThaiCol'),
      mo_ta: t('baoTriSuaChua.store.moTaCol'),
    };
    const dataForExport = filteredList.map((p) => {
      const row = phieuToExportRow(p, t);
      const out: Record<string, string> = {};
      Object.keys(headers).forEach((k) => { out[headers[k as keyof typeof headers]] = String(row[k] ?? ''); });
      return out;
    });
    exportToExcel(dataForExport, t('baoTriSuaChua.export.fileName'));
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
            text={t('baoTriSuaChua.stats.loading')}
            centered
          />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
              title={t('baoTriSuaChua.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('danhSachTaiSan.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('baoTriSuaChua.stats.noDataHint')
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
                chartByHangMuc={stats.chartByHangMuc}
                chartByMonth={stats.chartByMonth}
                chartByTaiSan={stats.chartByTaiSan}
              />
              <StatsTables
                byHangMuc={stats.byHangMuc}
                byTaiSan={stats.byTaiSan}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
