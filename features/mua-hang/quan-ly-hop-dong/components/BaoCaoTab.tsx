import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tag, Building2 } from 'lucide-react';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import type { DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { getDateRangeFromPreset, getPresetFromDates } from '../core/datePresets';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import { useHopDongList, useHopDongChiTietAllList } from '../hooks/use-hop-dong';
import { useDoiTacRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { TRANG_THAI_HOP_DONG } from '../core/constants';
import type { BaoCaoFilters, HopDong, HopDongChiTietEnriched } from '../core/types';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import HopDongExportDropdown from './HopDongExportDropdown';
import type { BaoCaoHopDongExportSnapshot } from '../utils/export-hop-dong-bao-cao';

function inDateRange(ngay: string | null | undefined, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (!ngay) return false;
  if (from && ngay < from) return false;
  if (to && ngay > to) return false;
  return true;
}

const CUSTOM_PRESET_ID = 'custom';

function monthKey(ngay: string | null | undefined): string | null {
  if (!ngay || ngay.length < 7) return null;
  return ngay.slice(0, 7);
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-');
  return `${m}/${y}`;
}

interface KpiCardProps {
  label: string;
  value: string;
  className?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, className }) => (
  <div className={cn('bg-card rounded-lg border border-border p-3 shadow-sm', className)}>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
  </div>
);

const BaoCaoTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: hopDongList = [], isLoading: loadingHd } = useHopDongList();
  const { data: chiTietList = [], isLoading: loadingCt } = useHopDongChiTietAllList();
  const { data: doiTacList = [] } = useDoiTacRefQuery('nha_cung_cap');

  const [filters, setFilters] = useState<BaoCaoFilters>(() => {
    const { dateFrom, dateTo } = getDateRangeFromPreset('thisMonth');
    return { trangThai: [], nccIds: [], dateFrom, dateTo };
  });

  const isLoading = loadingHd || loadingCt;

  const baseHopDong = useMemo(() => {
    return hopDongList.filter((h: HopDong) => {
      const matchesTt =
        filters.trangThai.length === 0 || filters.trangThai.includes(h.trang_thai);
      const matchesNcc = filters.nccIds.length === 0 || filters.nccIds.includes(h.id_nha_cung_cap);
      return matchesTt && matchesNcc;
    });
  }, [hopDongList, filters.trangThai, filters.nccIds]);

  const baseHopDongIds = useMemo(() => new Set(baseHopDong.map((h) => h.id)), [baseHopDong]);

  const filteredHopDong = useMemo(() => {
    return baseHopDong.filter((h) => inDateRange(h.ngay, filters.dateFrom, filters.dateTo));
  }, [baseHopDong, filters.dateFrom, filters.dateTo]);

  const filteredChiTiet = useMemo(() => {
    return chiTietList.filter((ct: HopDongChiTietEnriched) => {
      if (!baseHopDongIds.has(ct.id_hop_dong)) return false;
      return inDateRange(ct.ngay, filters.dateFrom, filters.dateTo);
    });
  }, [chiTietList, baseHopDongIds, filters.dateFrom, filters.dateTo]);

  const monthBounds = useMemo(() => {
    const { dateFrom, dateTo } = getDateRangeFromPreset('thisMonth');
    return { from: dateFrom, to: dateTo };
  }, []);

  const hopDongThangNay = useMemo(
    () => baseHopDong.filter((h) => inDateRange(h.ngay, monthBounds.from, monthBounds.to)),
    [baseHopDong, monthBounds]
  );

  const chiTietThangNay = useMemo(
    () =>
      chiTietList.filter(
        (ct: HopDongChiTietEnriched) =>
          baseHopDongIds.has(ct.id_hop_dong) &&
          inDateRange(ct.ngay, monthBounds.from, monthBounds.to)
      ),
    [chiTietList, baseHopDongIds, monthBounds]
  );

  const dateRangePresets = useMemo(
    () => [
      { id: 'all', label: t('hopDong.baoCao.preset.all') },
      { id: 'thisMonth', label: t('hopDong.baoCao.preset.thisMonth') },
      { id: 'lastMonth', label: t('hopDong.baoCao.preset.lastMonth') },
      { id: 'thisQuarter', label: t('hopDong.baoCao.preset.thisQuarter') },
      { id: 'thisYear', label: t('hopDong.baoCao.preset.thisYear') },
    ],
    [t]
  );

  const dateRangeValue: DateRangeValue = useMemo(
    () => ({
      preset: getPresetFromDates(filters.dateFrom, filters.dateTo),
      customStart: filters.dateFrom,
      customEnd: filters.dateTo,
    }),
    [filters.dateFrom, filters.dateTo]
  );

  const handleDateRangeChange = (value: DateRangeValue) => {
    if (value.preset === CUSTOM_PRESET_ID) {
      setFilters((f) => ({ ...f, dateFrom: value.customStart, dateTo: value.customEnd }));
    } else {
      const { dateFrom, dateTo } = getDateRangeFromPreset(value.preset);
      setFilters((f) => ({ ...f, dateFrom, dateTo }));
    }
  };

  const kpiThangNay = useMemo(() => {
    let tongTien = 0;
    let tongCay = 0;
    chiTietThangNay.forEach((ct) => {
      tongTien += Number(ct.so_tien) || 0;
      tongCay += Number(ct.so_cay_thuc_nhan) || 0;
    });
    return {
      soHopDong: hopDongThangNay.length,
      soDot: chiTietThangNay.length,
      tongTien,
      tongCay,
    };
  }, [hopDongThangNay, chiTietThangNay]);

  const kpiTrongKy = useMemo(() => {
    let tongTien = 0;
    let tongCay = 0;
    filteredChiTiet.forEach((ct) => {
      tongTien += Number(ct.so_tien) || 0;
      tongCay += Number(ct.so_cay_thuc_nhan) || 0;
    });
    return {
      soHopDong: filteredHopDong.length,
      soDot: filteredChiTiet.length,
      tongTien,
      tongCay,
    };
  }, [filteredHopDong, filteredChiTiet]);

  const kpi = useMemo(() => {
    let tongGiaTri = 0;
    let daTT = 0;
    let tongCay = 0;
    let daGiao = 0;
    let dangThucHien = 0;
    let daThanhLy = 0;

    filteredHopDong.forEach((h) => {
      tongGiaTri += Number(h.thanh_tien) || 0;
      daTT += Number(h.tong_da_thanh_toan) || 0;
      tongCay += Number(h.so_luong_cay) || 0;
      daGiao += Number(h.tong_cay_da_giao) || 0;
      if (h.trang_thai === TRANG_THAI_HOP_DONG[0]) dangThucHien += 1;
      else if (h.trang_thai === TRANG_THAI_HOP_DONG[1]) daThanhLy += 1;
    });

    return {
      tongHopDong: filteredHopDong.length,
      dangThucHien,
      daThanhLy,
      tongGiaTri,
      daTT,
      conPhaiTT: tongGiaTri - daTT,
      tongCay,
      daGiao,
      conGiao: tongCay - daGiao,
    };
  }, [filteredHopDong]);

  const byNcc = useMemo(() => {
    const map = new Map<
      string,
      {
        tenNcc: string;
        soHd: number;
        tongGiaTri: number;
        daTT: number;
        tongCay: number;
        daGiao: number;
      }
    >();
    filteredHopDong.forEach((h) => {
      const id = h.id_nha_cung_cap;
      const cur = map.get(id) ?? {
        tenNcc: h.ten_nha_cung_cap ?? id,
        soHd: 0,
        tongGiaTri: 0,
        daTT: 0,
        tongCay: 0,
        daGiao: 0,
      };
      cur.soHd += 1;
      cur.tongGiaTri += Number(h.thanh_tien) || 0;
      cur.daTT += Number(h.tong_da_thanh_toan) || 0;
      cur.tongCay += Number(h.so_luong_cay) || 0;
      cur.daGiao += Number(h.tong_cay_da_giao) || 0;
      map.set(id, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.tongGiaTri - a.tongGiaTri);
  }, [filteredHopDong]);

  const byMonth = useMemo(() => {
    const map = new Map<string, { soDot: number; tongTien: number; tongCay: number; soHd: number }>();
    filteredChiTiet.forEach((ct) => {
      const key = monthKey(ct.ngay);
      if (!key) return;
      const cur = map.get(key) ?? { soDot: 0, tongTien: 0, tongCay: 0, soHd: 0 };
      cur.soDot += 1;
      cur.tongTien += Number(ct.so_tien) || 0;
      cur.tongCay += Number(ct.so_cay_thuc_nhan) || 0;
      map.set(key, cur);
    });
    filteredHopDong.forEach((h) => {
      const key = monthKey(h.ngay);
      if (!key) return;
      const cur = map.get(key) ?? { soDot: 0, tongTien: 0, tongCay: 0, soHd: 0 };
      cur.soHd += 1;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, v]) => ({ key, label: formatMonthLabel(key), ...v }));
  }, [filteredChiTiet, filteredHopDong]);

  const periodLabel = useMemo(() => {
    const { dateFrom, dateTo } = filters;
    if (!dateFrom && !dateTo) return t('hopDong.baoCao.preset.all');
    const preset = getPresetFromDates(dateFrom, dateTo);
    const presetOpt = dateRangePresets.find((p) => p.id === preset);
    if (presetOpt && preset !== CUSTOM_PRESET_ID) return presetOpt.label;
    if (dateFrom && dateTo) {
      return `${formatDateShort(dateFrom)} – ${formatDateShort(dateTo)}`;
    }
    if (dateFrom) return `${t('hopDong.baoCao.filterDateFrom')}: ${formatDateShort(dateFrom)}`;
    if (dateTo) return `${t('hopDong.baoCao.filterDateTo')}: ${formatDateShort(dateTo)}`;
    return t('hopDong.baoCao.preset.all');
  }, [filters.dateFrom, filters.dateTo, dateRangePresets, t]);

  const exportSnapshot = useMemo((): BaoCaoHopDongExportSnapshot => {
    const num = (v: number) => formatNumberVN(v) ?? String(v);
    return {
      periodLabel,
      kpiRows: [
        { label: t('hopDong.baoCao.kpi.tongHopDong'), value: String(kpi.tongHopDong) },
        { label: t('hopDong.baoCao.kpi.dangThucHien'), value: String(kpi.dangThucHien) },
        { label: t('hopDong.baoCao.kpi.daThanhLy'), value: String(kpi.daThanhLy) },
        { label: t('hopDong.baoCao.kpi.tongGiaTriHd'), value: num(kpi.tongGiaTri) },
        { label: t('hopDong.baoCao.kpi.daThanhToan'), value: num(kpi.daTT) },
        { label: t('hopDong.baoCao.kpi.conPhaiTT'), value: num(kpi.conPhaiTT) },
        { label: t('hopDong.baoCao.kpi.tongCayHd'), value: num(kpi.tongCay) },
        { label: t('hopDong.baoCao.kpi.daGiao'), value: num(kpi.daGiao) },
        { label: t('hopDong.baoCao.kpi.conGiao'), value: num(kpi.conGiao) },
      ],
      kpiThangNayRows: [
        { label: t('hopDong.baoCao.kpi.hopDongThangNay'), value: String(kpiThangNay.soHopDong) },
        { label: t('hopDong.baoCao.kpi.soDotThangNay'), value: String(kpiThangNay.soDot) },
        { label: t('hopDong.baoCao.kpi.tongTienThangNay'), value: num(kpiThangNay.tongTien) },
        { label: t('hopDong.baoCao.kpi.cayNhanThangNay'), value: num(kpiThangNay.tongCay) },
      ],
      kpiTrongKyRows: [
        { label: t('hopDong.baoCao.kpi.hopDongTrongKy'), value: String(kpiTrongKy.soHopDong) },
        { label: t('hopDong.baoCao.kpi.thanhToanTrongKy'), value: String(kpiTrongKy.soDot) },
        { label: t('hopDong.baoCao.kpi.tongTienTrongKy'), value: num(kpiTrongKy.tongTien) },
        { label: t('hopDong.baoCao.kpi.cayNhanTrongKy'), value: num(kpiTrongKy.tongCay) },
      ],
      byNcc,
      byMonth: byMonth.map((r) => ({
        label: r.label,
        soHd: r.soHd,
        soDot: r.soDot,
        tongTien: r.tongTien,
        tongCay: r.tongCay,
      })),
    };
  }, [periodLabel, kpi, kpiThangNay, kpiTrongKy, byNcc, byMonth, t]);

  const handleExport = useCallback(
    async (format: 'excel' | 'pdf') => {
      try {
        if (format === 'excel') {
          const { exportBaoCaoHopDongToExcel } = await import('../utils/export-hop-dong-bao-cao');
          await exportBaoCaoHopDongToExcel(exportSnapshot, t);
        } else {
          const { exportBaoCaoHopDongToPdf } = await import('../utils/export-hop-dong-bao-cao');
          await exportBaoCaoHopDongToPdf(exportSnapshot, t);
        }
        toast.success(t('hopDong.export.success'));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Export failed');
      }
    },
    [exportSnapshot, t]
  );

  const statusOptions = useMemo(
    () =>
      TRANG_THAI_HOP_DONG.map((s) => ({
        value: s,
        label: s === 'Đang thực hiện' ? t('hopDong.trangThai.dangThucHien') : t('hopDong.trangThai.daThanhLy'),
        count: hopDongList.filter((x: HopDong) => x.trang_thai === s).length,
      })),
    [hopDongList, t]
  );

  const nccOptions = useMemo(
    () =>
      doiTacList.map((d) => ({
        value: d.id,
        label: `${d.ma_ncc} - ${d.ten_ncc}`,
        count: hopDongList.filter((x: HopDong) => x.id_nha_cung_cap === d.id).length,
      })),
    [doiTacList, hopDongList]
  );

  const activeFilterCount =
    filters.trangThai.length +
    filters.nccIds.length +
    (filters.dateFrom || filters.dateTo ? 1 : 0);

  const handleClearFilters = () => {
    setFilters({ trangThai: [], nccIds: [], dateFrom: '', dateTo: '' });
  };

  const renderFilters = (
    <>
      <DateRangePicker
        presets={dateRangePresets}
        value={dateRangeValue}
        onChange={handleDateRangeChange}
        placeholder={t('hopDong.baoCao.filterPeriod')}
        customPresetId={CUSTOM_PRESET_ID}
        className="shrink-0"
      />
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.trangThai}
        onChange={(v) => setFilters((f) => ({ ...f, trangThai: v }))}
        placeholder={t('hopDong.baoCao.filterStatus')}
        icon={Tag}
        className="w-full sm:w-[150px]"
      />
      <FilterChipMultiSelect
        options={nccOptions}
        value={filters.nccIds}
        onChange={(v) => setFilters((f) => ({ ...f, nccIds: v }))}
        placeholder={t('hopDong.baoCao.filterNcc')}
        icon={Building2}
        className="w-full sm:w-[170px]"
      />
    </>
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center rounded-xl border border-border bg-card">
        <LoadingSpinnerWithText text={t('hopDong.baoCao.loading')} centered />
      </div>
    );
  }

  const isEmpty = filteredHopDong.length === 0 && filteredChiTiet.length === 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DashboardToolbar
        onBack={() => navigate(-1)}
        filters={renderFilters}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        actions={<HopDongExportDropdown onExport={handleExport} compact />}
        className="static z-auto border-b border-border"
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {isEmpty ? (
          <EmptyState
            title={t('hopDong.baoCao.noData')}
            description={
              activeFilterCount > 0 ? t('hopDong.baoCao.noDataHint') : t('hopDong.emptyHint')
            }
          />
        ) : (
          <>
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2">{t('hopDong.baoCao.sectionThangNay')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <KpiCard label={t('hopDong.baoCao.kpi.hopDongThangNay')} value={String(kpiThangNay.soHopDong)} />
                <KpiCard label={t('hopDong.baoCao.kpi.soDotThangNay')} value={String(kpiThangNay.soDot)} />
                <KpiCard
                  label={t('hopDong.baoCao.kpi.tongTienThangNay')}
                  value={formatNumberVN(kpiThangNay.tongTien) ?? '0'}
                />
                <KpiCard
                  label={t('hopDong.baoCao.kpi.cayNhanThangNay')}
                  value={formatNumberVN(kpiThangNay.tongCay) ?? '0'}
                />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2">{t('hopDong.baoCao.sectionTrongKy')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <KpiCard label={t('hopDong.baoCao.kpi.hopDongTrongKy')} value={String(kpiTrongKy.soHopDong)} />
                <KpiCard label={t('hopDong.baoCao.kpi.thanhToanTrongKy')} value={String(kpiTrongKy.soDot)} />
                <KpiCard
                  label={t('hopDong.baoCao.kpi.tongTienTrongKy')}
                  value={formatNumberVN(kpiTrongKy.tongTien) ?? '0'}
                />
                <KpiCard
                  label={t('hopDong.baoCao.kpi.cayNhanTrongKy')}
                  value={formatNumberVN(kpiTrongKy.tongCay) ?? '0'}
                />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2">{t('hopDong.baoCao.sectionTongHop')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <KpiCard label={t('hopDong.baoCao.kpi.tongHopDong')} value={String(kpi.tongHopDong)} />
                <KpiCard label={t('hopDong.baoCao.kpi.dangThucHien')} value={String(kpi.dangThucHien)} />
                <KpiCard label={t('hopDong.baoCao.kpi.daThanhLy')} value={String(kpi.daThanhLy)} />
                <KpiCard
                  label={t('hopDong.baoCao.kpi.tongGiaTriHd')}
                  value={formatNumberVN(kpi.tongGiaTri) ?? '0'}
                />
                <KpiCard
                  label={t('hopDong.baoCao.kpi.daThanhToan')}
                  value={formatNumberVN(kpi.daTT) ?? '0'}
                />
                <KpiCard
                  label={t('hopDong.baoCao.kpi.conPhaiTT')}
                  value={formatNumberVN(kpi.conPhaiTT) ?? '0'}
                  className={cn(kpi.conPhaiTT < 0 && '[&_p:last-child]:text-rose-600')}
                />
                <KpiCard
                  label={t('hopDong.baoCao.kpi.tongCayHd')}
                  value={formatNumberVN(kpi.tongCay) ?? '0'}
                />
                <KpiCard label={t('hopDong.baoCao.kpi.daGiao')} value={formatNumberVN(kpi.daGiao) ?? '0'} />
                <KpiCard
                  label={t('hopDong.baoCao.kpi.conGiao')}
                  value={formatNumberVN(kpi.conGiao) ?? '0'}
                  className={cn(kpi.conGiao < 0 && '[&_p:last-child]:text-rose-600')}
                />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2">{t('hopDong.baoCao.sectionByNcc')}</h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                        {t('hopDong.baoCao.col.tenNcc')}
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                        {t('hopDong.baoCao.col.soHd')}
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                        {t('hopDong.baoCao.col.tongGiaTri')}
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                        {t('hopDong.baoCao.col.daTT')}
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                        {t('hopDong.baoCao.col.conLai')}
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                        {t('hopDong.baoCao.col.tongCay')}
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                        {t('hopDong.baoCao.col.daGiao')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {byNcc.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-muted-foreground">
                          —
                        </td>
                      </tr>
                    ) : (
                      byNcc.map((row) => (
                        <tr key={row.tenNcc} className="border-b border-border/60">
                          <td className="py-2 px-3">{row.tenNcc}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{row.soHd}</td>
                          <td className="py-2 px-3 text-right tabular-nums">
                            {formatNumberVN(row.tongGiaTri)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">{formatNumberVN(row.daTT)}</td>
                          <td
                            className={cn(
                              'py-2 px-3 text-right tabular-nums',
                              row.tongGiaTri - row.daTT < 0 && 'text-rose-600'
                            )}
                          >
                            {formatNumberVN(row.tongGiaTri - row.daTT)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">{formatNumberVN(row.tongCay)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{formatNumberVN(row.daGiao)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2">{t('hopDong.baoCao.sectionByMonth')}</h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                        {t('hopDong.baoCao.col.thang')}
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                        {t('hopDong.baoCao.col.soHdKy')}
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                        {t('hopDong.baoCao.col.soDot')}
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                        {t('hopDong.baoCao.col.tongTien')}
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                        {t('hopDong.baoCao.col.tongCayNhan')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {byMonth.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-muted-foreground">
                          —
                        </td>
                      </tr>
                    ) : (
                      byMonth.map((row) => (
                        <tr key={row.key} className="border-b border-border/60">
                          <td className="py-2 px-3">{row.label}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{row.soHd}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{row.soDot}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{formatNumberVN(row.tongTien)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{formatNumberVN(row.tongCay)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default BaoCaoTab;
