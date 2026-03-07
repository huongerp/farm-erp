import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Download, Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowRightLeft } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import ExportDialog from '../../../../components/shared/ExportDialog';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import { useTaiKhoan } from '../hooks/use-tai-khoan';
import { useSoDuTheoKy } from '../hooks/use-so-du-theo-ky';
import { formatCurrency, formatDate } from '../../../../lib/utils';
import type { SoDuKyRow } from '../core/types';
import { getCurrencyAmountClass } from '../utils/currencyColors';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import { cn } from '../../../../lib/utils';
import type { FilterGroup } from '../../../../components/ui/MobileFilterSheet';

function getMonthStartEnd(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function getQuarterStartEnd(year: number, quarter: number): { start: string; end: string } {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;
  const start = new Date(year, startMonth - 1, 1);
  const end = new Date(year, endMonth, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

const PRESETS = [
  {
    id: 'thang_nay',
    getRange: () => {
      const d = new Date();
      return getMonthStartEnd(d.getFullYear(), d.getMonth() + 1);
    },
  },
  {
    id: 'thang_truoc',
    getRange: () => {
      const d = new Date();
      return getMonthStartEnd(d.getFullYear(), d.getMonth());
    },
  },
  {
    id: 'quy_nay',
    getRange: () => {
      const d = new Date();
      const q = Math.floor(d.getMonth() / 3) + 1;
      return getQuarterStartEnd(d.getFullYear(), q);
    },
  },
  {
    id: 'quy_truoc',
    getRange: () => {
      const d = new Date();
      const q = Math.floor(d.getMonth() / 3) + 1;
      const prevQ = q === 1 ? 4 : q - 1;
      const year = q === 1 ? d.getFullYear() - 1 : d.getFullYear();
      return getQuarterStartEnd(year, prevQ);
    },
  },
  { id: 'tuy_chon', getRange: () => ({ start: '', end: '' }) },
] as const;

/** Format ky_label (ISO range) to display format dd/MM/yyyy – dd/MM/yyyy */
function formatKyLabel(kyLabel: string): string {
  const parts = kyLabel.split(/\s*–\s*/);
  if (parts.length !== 2) return kyLabel;
  return `${formatDate(parts[0].trim())} – ${formatDate(parts[1].trim())}`;
}

interface TraCuuTheoKyTabProps {
  /** Gọi khi bấm nút Back (vd. quay lại tab Danh sách) */
  onBack?: () => void;
}

const TraCuuTheoKyTab: React.FC<TraCuuTheoKyTabProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const now = new Date();
  const [preset, setPreset] = useState<string>('thang_nay');
  const [tuNgay, setTuNgay] = useState(() => {
    const r = getMonthStartEnd(now.getFullYear(), now.getMonth() + 1);
    return r.start;
  });
  const [denNgay, setDenNgay] = useState(() => {
    const r = getMonthStartEnd(now.getFullYear(), now.getMonth() + 1);
    return r.end;
  });
  const [filterAccountIds, setFilterAccountIds] = useState<string[]>([]);
  const [showExport, setShowExport] = useState(false);

  const { data: accounts = [] } = useTaiKhoan();
  const params = useMemo(() => {
    if (!tuNgay || !denNgay) return null;
    return {
      tuNgay,
      denNgay,
      id_tai_khoan: filterAccountIds.length > 0 ? filterAccountIds : undefined,
    };
  }, [tuNgay, denNgay, filterAccountIds]);

  const { data: soDuRows = [], isLoading, isError } = useSoDuTheoKy(params);

  const accountOptions = useMemo(
    () =>
      accounts.map((a) => ({
        label: a.ten_tai_khoan,
        value: a.id,
        count: 1,
      })),
    [accounts]
  );

  useEffect(() => {
    if (accounts.length === 0) return;
    const validIds = new Set(accounts.map((a) => a.id));
    setFilterAccountIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [accounts]);

  const handlePresetChange = useCallback((id: string) => {
    setPreset(id);
    const p = PRESETS.find((x) => x.id === id);
    if (p && p.id !== 'tuy_chon') {
      const { start, end } = p.getRange();
      setTuNgay(start);
      setDenNgay(end);
    }
  }, []);

  const presetOptions = useMemo(
    () => [
      { label: t('taiKhoan.traCuu.presetThangNay'), value: 'thang_nay' },
      { label: t('taiKhoan.traCuu.presetThangTruoc'), value: 'thang_truoc' },
      { label: t('taiKhoan.traCuu.presetQuyNay'), value: 'quy_nay' },
      { label: t('taiKhoan.traCuu.presetQuyTruoc'), value: 'quy_truoc' },
      { label: t('taiKhoan.traCuu.presetTuyChon'), value: 'tuy_chon' },
    ],
    [t]
  );

  const activeFilterCount =
    (preset !== 'thang_nay' ? 1 : 0) + (filterAccountIds.length > 0 ? 1 : 0);

  const handleClearFilters = useCallback(() => {
    handlePresetChange('thang_nay');
    setFilterAccountIds([]);
  }, [handlePresetChange]);

  /** Preset là single-select: khi user chọn option khác trong sheet, chỉ giữ 1 giá trị mới. */
  const handlePresetGroupChange = useCallback(
    (v: string[]) => {
      if (v.length === 0) {
        handlePresetChange('thang_nay');
        return;
      }
      const newPreset = v.find((x) => x !== preset) ?? v[v.length - 1];
      handlePresetChange(newPreset);
    },
    [preset, handlePresetChange]
  );

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'preset',
        label: t('taiKhoan.traCuu.presetLabel'),
        icon: Calendar,
        options: presetOptions,
        value: [preset],
        onChange: handlePresetGroupChange,
      },
      {
        key: 'tai_khoan',
        label: t('taiKhoan.traCuu.taiKhoan'),
        icon: Wallet,
        options: accountOptions,
        value: filterAccountIds,
        onChange: setFilterAccountIds,
      },
    ],
    [t, presetOptions, accountOptions, preset, filterAccountIds, handlePresetGroupChange]
  );

  const summary = useMemo(() => {
    let tonDau = 0;
    let tongThu = 0;
    let tongChi = 0;
    let duCuoi = 0;
    for (const r of soDuRows) {
      tonDau += r.so_du_dau_ky;
      tongThu += r.tong_thu;
      tongChi += r.tong_chi;
      duCuoi += r.so_du_cuoi_ky;
    }
    return { tonDau, tongThu, tongChi, duCuoi };
  }, [soDuRows]);

  const exportColumns = useMemo(
    () => [
      { key: 'ky_label', label: t('taiKhoan.traCuu.ky') },
      { key: 'ten_tai_khoan', label: t('taiKhoan.columns.tenTaiKhoan') },
      { key: 'loai_tai_khoan_text', label: t('taiKhoan.columns.loai') },
      { key: 'so_du_dau_ky', label: t('taiKhoan.columns.tonDau') },
      { key: 'tong_thu', label: t('taiKhoan.columns.tongThu') },
      { key: 'tong_chi', label: t('taiKhoan.columns.tongChi') },
      { key: 'so_du_cuoi_ky', label: t('taiKhoan.columns.duCuoi') },
    ],
    [t]
  );

  const exportData = useMemo(
    () =>
      soDuRows.map((r: SoDuKyRow) => ({
        ky_label: formatKyLabel(r.ky_label),
        ten_tai_khoan: r.ten_tai_khoan,
        loai_tai_khoan_text:
          r.loai_tai_khoan === 'ngan_hang'
            ? t('taiKhoan.loaiNganHang')
            : t('taiKhoan.loaiTienMat'),
        so_du_dau_ky: formatCurrency(r.so_du_dau_ky),
        tong_thu: formatCurrency(r.tong_thu),
        tong_chi: formatCurrency(r.tong_chi),
        so_du_cuoi_ky: formatCurrency(r.so_du_cuoi_ky),
      })),
    [soDuRows, t]
  );

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{t('common.errorLoadData')}</p>
      </div>
    );
  }

  const dateInputClass = cn(
    'h-9 pl-8 pr-2 w-full min-w-[120px] max-w-[140px] bg-background border border-border rounded-lg text-sm text-foreground',
    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40'
  );

  const renderFilters = (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={preset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className={cn(
            'h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground min-w-[140px]',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40'
          )}
        >
          {presetOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="relative flex items-center">
          <Calendar className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            value={tuNgay}
            onChange={(e) => setTuNgay(e.target.value)}
            className={dateInputClass}
            aria-label={t('taiKhoan.traCuu.tuNgay')}
          />
        </div>
        <div className="relative flex items-center">
          <Calendar className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            value={denNgay}
            onChange={(e) => setDenNgay(e.target.value)}
            className={dateInputClass}
            aria-label={t('taiKhoan.traCuu.denNgay')}
          />
        </div>
        <FilterChipMultiSelect
          options={accountOptions}
          value={filterAccountIds}
          onChange={setFilterAccountIds}
          placeholder={t('taiKhoan.traCuu.tatCa')}
          icon={Wallet}
          className="w-full sm:w-[200px]"
        />
      </div>
    </>
  );

  const renderActions = (
    <Button
      size="sm"
      variant="default"
      onClick={() => setShowExport(true)}
      disabled={soDuRows.length === 0}
      className="h-9"
    >
      <Download className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('taiKhoan.traCuu.xuatBaoCao')}</span>
    </Button>
  );

  const mobileRow2Content = (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1 min-w-0">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={tuNgay}
          onChange={(e) => setTuNgay(e.target.value)}
          className="w-full h-9 pl-8 pr-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={t('taiKhoan.traCuu.tuNgay')}
        />
      </div>
      <div className="relative flex-1 min-w-0">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={denNgay}
          onChange={(e) => setDenNgay(e.target.value)}
          className="w-full h-9 pl-8 pr-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={t('taiKhoan.traCuu.denNgay')}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <DashboardToolbar
        hideBack={!onBack}
        onBack={onBack}
        filters={renderFilters}
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        actions={renderActions}
        mobileRow2Content={mobileRow2Content}
        className="!top-0 z-30"
      />

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4">
        {isLoading ? (
          <LoadingSpinnerWithText text={t('taiKhoan.loading')} centered />
        ) : soDuRows.length === 0 ? (
          <EmptyState
            title={t('taiKhoan.traCuu.empty')}
            description={t('taiKhoan.traCuu.emptyHint')}
            action={
              activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t('taiKhoan.traCuu.clearFilters')}
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {/* Summary cards */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {t('taiKhoan.traCuu.summaryTitle')}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <PiggyBank className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xs text-muted-foreground truncate">
                      {t('taiKhoan.traCuu.summaryTonDau')}
                    </p>
                    <p className={cn('text-base font-semibold tabular-nums truncate', getCurrencyAmountClass(summary.tonDau, 'balance'))}>
                      {formatCurrency(summary.tonDau)}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xs text-muted-foreground truncate">
                      {t('taiKhoan.traCuu.summaryTongThu')}
                    </p>
                    <p className="text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 truncate">
                      {formatCurrency(summary.tongThu)}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xs text-muted-foreground truncate">
                      {t('taiKhoan.traCuu.summaryTongChi')}
                    </p>
                    <p className="text-base font-semibold tabular-nums text-rose-600 dark:text-rose-400 truncate">
                      {formatCurrency(summary.tongChi)}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ArrowRightLeft className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xs text-muted-foreground truncate">
                      {t('taiKhoan.traCuu.summaryDuCuoi')}
                    </p>
                    <p className={cn('text-base font-semibold tabular-nums truncate', getCurrencyAmountClass(summary.duCuoi, 'balance'))}>
                      {formatCurrency(summary.duCuoi)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div>
              <p className="text-2xs text-muted-foreground mb-2">
                {t('taiKhoan.traCuu.recordCount', { count: soDuRows.length })}
              </p>
              <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-[640px]">
                    <thead>
                      <tr className="bg-muted/60 border-b border-border sticky top-0 z-10">
                        <th className="text-left font-medium px-3 py-3 whitespace-nowrap">
                          {t('taiKhoan.traCuu.ky')}
                        </th>
                        <th className="text-left font-medium px-3 py-3 whitespace-nowrap">
                          {t('taiKhoan.columns.tenTaiKhoan')}
                        </th>
                        <th className="text-left font-medium px-3 py-3 whitespace-nowrap">
                          {t('taiKhoan.columns.loai')}
                        </th>
                        <th className="text-right font-medium px-3 py-3 whitespace-nowrap">
                          {t('taiKhoan.columns.tonDau')}
                        </th>
                        <th className="text-right font-medium px-3 py-3 whitespace-nowrap">
                          {t('taiKhoan.columns.tongThu')}
                        </th>
                        <th className="text-right font-medium px-3 py-3 whitespace-nowrap">
                          {t('taiKhoan.columns.tongChi')}
                        </th>
                        <th className="text-right font-medium px-3 py-3 whitespace-nowrap">
                          {t('taiKhoan.columns.duCuoi')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {soDuRows.map((row) => (
                        <tr
                          key={`${row.ky}_${row.id_tai_khoan}`}
                          className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                            {formatKyLabel(row.ky_label)}
                          </td>
                          <td className="px-3 py-2.5 font-medium">{row.ten_tai_khoan}</td>
                          <td className="px-3 py-2.5">
                            {row.loai_tai_khoan === 'ngan_hang'
                              ? t('taiKhoan.loaiNganHang')
                              : t('taiKhoan.loaiTienMat')}
                          </td>
                          <td className={cn('px-3 py-2.5 text-right tabular-nums font-medium', getCurrencyAmountClass(row.so_du_dau_ky, 'balance'))}>
                            {formatCurrency(row.so_du_dau_ky)}
                          </td>
                          <td className={cn('px-3 py-2.5 text-right tabular-nums', getCurrencyAmountClass(row.tong_thu, 'income'))}>
                            {formatCurrency(row.tong_thu)}
                          </td>
                          <td className={cn('px-3 py-2.5 text-right tabular-nums', getCurrencyAmountClass(0, 'expense'))}>
                            {formatCurrency(row.tong_chi)}
                          </td>
                          <td className={cn('px-3 py-2.5 text-right tabular-nums font-semibold', getCurrencyAmountClass(row.so_du_cuoi_ky, 'balance'))}>
                            {formatCurrency(row.so_du_cuoi_ky)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/40 border-t-2 border-border font-medium">
                        <td
                          colSpan={3}
                          className="px-3 py-2.5 text-foreground"
                        >
                          {t('taiKhoan.traCuu.tableFooter')}
                        </td>
                        <td className={cn('px-3 py-2.5 text-right tabular-nums font-medium', getCurrencyAmountClass(summary.tonDau, 'balance'))}>
                          {formatCurrency(summary.tonDau)}
                        </td>
                        <td className={cn('px-3 py-2.5 text-right tabular-nums', getCurrencyAmountClass(summary.tongThu, 'income'))}>
                          {formatCurrency(summary.tongThu)}
                        </td>
                        <td className={cn('px-3 py-2.5 text-right tabular-nums', getCurrencyAmountClass(0, 'expense'))}>
                          {formatCurrency(summary.tongChi)}
                        </td>
                        <td className={cn('px-3 py-2.5 text-right tabular-nums font-semibold', getCurrencyAmountClass(summary.duCuoi, 'balance'))}>
                          {formatCurrency(summary.duCuoi)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        columns={exportColumns}
        data={exportData}
        selectedData={[]}
        paginatedData={exportData}
        fileName={t('taiKhoan.traCuu.exportFileName')}
        visibleColumnKeys={exportColumns.map((c) => c.key)}
      />
    </div>
  );
};

export default TraCuuTheoKyTab;
