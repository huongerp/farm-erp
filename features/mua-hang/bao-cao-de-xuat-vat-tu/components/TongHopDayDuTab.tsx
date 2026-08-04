import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, FileText, Link2, Clock, Hourglass, CheckCircle, XCircle, User, Percent, Send } from 'lucide-react';
import { getBaoCaoTrangThaiBadgeClass, getBaoCaoTrangThaiLabel } from '../core/trang-thai-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useTongHopDeXuatKy, usePhieuDeXuatInPeriod, useLienKetDonHang } from '../hooks/use-bao-cao-de-xuat-vat-tu';
import { usePhieuDeXuatVatTuById } from '../../../kho-van/phieu-de-xuat-vat-tu/hooks/use-phieu-de-xuat-vat-tu';
import type { BaoCaoDeXuatVatTuFilters } from '../core/types';
import type { ChiTietPhieuRow, LienKetDonHangRow } from '../core/types';
import FormSection from '../../../../components/shared/FormSection';
import ChartTooltip from '../../../../components/ui/ChartTooltip';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import { BTN_CLOSE } from '../../../../lib/button-labels';
import { cn } from '../../../../lib/utils';

function formatDateDisplay(ymd: string): string {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

/** Màu chart: dễ nhìn, rõ ràng */
const STATUS_CHART_COLORS = ['#f59e0b', '#0ea5e9', '#10b981', '#ef4444'];
const BAR_MONTH_COLOR = '#6366f1';
const LIEN_KET_COLORS = ['#10b981', '#94a3b8'];

function getTrangThaiLabel(trang_thai: string, t: (k: string) => string): string {
  return getBaoCaoTrangThaiLabel(trang_thai, t);
}

function TrangThaiBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const label = getTrangThaiLabel(status, t);
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', getBaoCaoTrangThaiBadgeClass(status))}>
      {label}
    </span>
  );
}

function PhieuDetailDrawer({ phieuId, onClose }: { phieuId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: phieu, isLoading } = usePhieuDeXuatVatTuById(phieuId);

  return (
    <GenericDrawer
      title={t('baoCaodeXuatVatTu.chiTiet.viewDetail')}
      subtitle={phieu?.so_phieu ?? ''}
      icon={<FileText size={18} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={
        <div className="flex justify-start w-full">
          <Button variant="outline" size="sm" onClick={onClose} className="border-border">
            {BTN_CLOSE()}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <LoadingSpinnerWithText text={t('baoCaodeXuatVatTu.loading')} />
      ) : !phieu ? (
        <p className="text-sm text-muted-foreground">{t('common.error')}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.soPhieu')}</p>
              <p className="font-medium">{phieu.so_phieu}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.ngay')}</p>
              <p className="font-medium">{phieu.ngay}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.ngayCan')}</p>
              <p className="font-medium">{phieu.ngay_can}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.trangThai')}</p>
              <TrangThaiBadge status={phieu.trang_thai} />
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.noiDeXuat')}</p>
              <p className="font-medium">{phieu.ten_noi_de_xuat ?? phieu.id_noi_de_xuat ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.nguoiDeXuat')}</p>
              <p className="font-medium">{phieu.ten_nguoi_de_xuat ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.nguoiDuyet')}</p>
              <p className="font-medium">{phieu.ten_nguoi_duyet ?? '—'}</p>
            </div>
            {phieu.ghi_chu && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.ghiChu')}</p>
                <p className="font-medium">{phieu.ghi_chu}</p>
              </div>
            )}
          </div>
          {phieu.chi_tiet && phieu.chi_tiet.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('baoCaodeXuatVatTu.chiTiet.danhSachHang')}</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.maHang')}</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.tenHang')}</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.soLuong')}</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('baoCaodeXuatVatTu.chiTiet.dvt')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {phieu.chi_tiet.map((ct) => (
                        <tr key={ct.id} className="border-b border-border/60">
                          <td className="px-3 py-2 font-mono">{ct.ma_hang ?? '—'}</td>
                          <td className="px-3 py-2">{ct.ten_hang ?? '—'}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{ct.so_luong}</td>
                          <td className="px-3 py-2 text-center text-muted-foreground">{ct.don_vi_tinh ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </GenericDrawer>
  );
}

type LienKetFilter = 'all' | 'daChuyen' | 'chuaChuyen';

const CARD_CLASS = 'bg-card rounded-xl border border-border p-3 sm:p-4 transition-all hover:shadow-md';
const ICON_WRAP = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0';

interface TongHopDayDuTabProps {
  filters: BaoCaoDeXuatVatTuFilters | null;
  onClearFilters?: () => void;
}

const TongHopDayDuTab: React.FC<TongHopDayDuTabProps> = ({ filters, onClearFilters }) => {
  const { t } = useTranslation();
  const [selectedPhieuId, setSelectedPhieuId] = useState<string | null>(null);
  const [linkFilter, setLinkFilter] = useState<LienKetFilter>('all');

  const { data: tongHopData, isLoading: loadingTongHop, isError: errorTongHop } = useTongHopDeXuatKy(filters);
  const { data: phieuList = [], isLoading: loadingPhieu, isError: errorPhieu } = usePhieuDeXuatInPeriod(filters);
  const { data: lienKetList = [], isLoading: loadingLienKet, isError: errorLienKet } = useLienKetDonHang(filters);

  const isLoading = loadingTongHop || loadingPhieu || loadingLienKet;
  const isError = errorTongHop || errorPhieu || errorLienKet;

  const filteredLienKet = useMemo(() => {
    if (linkFilter === 'all') return lienKetList;
    if (linkFilter === 'daChuyen') return lienKetList.filter((r: LienKetDonHangRow) => r.da_chuyen_don);
    return lienKetList.filter((r: LienKetDonHangRow) => !r.da_chuyen_don);
  }, [lienKetList, linkFilter]);

  const total = tongHopData?.total ?? 0;
  const choDuyet = tongHopData?.choDuyet ?? 0;
  const doiDuyet = tongHopData?.doiDuyet ?? 0;
  const daDuyet = tongHopData?.daDuyet ?? 0;
  const khongDuyet = tongHopData?.khongDuyet ?? 0;
  const byTrangThai = tongHopData?.byTrangThai ?? [];
  const byNoiDeXuat = tongHopData?.byNoiDeXuat ?? [];
  const byMonth = tongHopData?.byMonth ?? [];
  const hasAnyData = total > 0 || phieuList.length > 0 || lienKetList.length > 0;

  const daChuyenCount = useMemo(() => lienKetList.filter((r: LienKetDonHangRow) => r.da_chuyen_don).length, [lienKetList]);
  const chuaChuyenCount = useMemo(() => lienKetList.filter((r: LienKetDonHangRow) => !r.da_chuyen_don).length, [lienKetList]);
  const tyLeDuyetPct = total > 0 ? Math.round((daDuyet / total) * 100) : 0;

  const byNguoiDeXuat = useMemo(() => {
    const m = new Map<string, { count: number; ten?: string }>();
    phieuList.forEach((p: ChiTietPhieuRow) => {
      const id = p.id_nguoi_de_xuat || '';
      const cur = m.get(id);
      if (cur) {
        cur.count += 1;
      } else {
        m.set(id, { count: 1, ten: p.ten_nguoi_de_xuat });
      }
    });
    return Array.from(m.entries())
      .map(([id, v]) => ({ id, ten: v.ten ?? id, count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [phieuList]);

  const pieTrangThaiData = useMemo(
    () =>
      byTrangThai
        .filter((r) => r.count > 0)
        .map((r) => ({ name: getTrangThaiLabel(r.trang_thai, t), value: r.count })),
    [byTrangThai, t]
  );

  const pieLienKetData = useMemo(
    () =>
      [
        { name: t('baoCaodeXuatVatTu.kpi.daChuyenDon'), value: daChuyenCount },
        { name: t('baoCaodeXuatVatTu.kpi.chuaChuyenDon'), value: chuaChuyenCount },
      ].filter((d) => d.value > 0),
    [daChuyenCount, chuaChuyenCount, t]
  );

  const periodLabel =
    filters?.dateFrom && filters?.dateTo
      ? t('baoCaodeXuatVatTu.periodLabel', {
          from: formatDateDisplay(filters.dateFrom),
          to: formatDateDisplay(filters.dateTo),
        })
      : null;

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-destructive">{t('common.error') || 'Có lỗi khi tải dữ liệu.'}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 py-6 px-4">
          <LoadingSpinnerWithText text={t('baoCaodeXuatVatTu.loading')} centered />
        </div>
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <EmptyState
          title={t('baoCaodeXuatVatTu.empty')}
          description={t('baoCaodeXuatVatTu.emptyHint')}
          icon={<BarChart3 size={48} className="text-muted-foreground/30" />}
          action={
            onClearFilters ? (
              <button type="button" onClick={onClearFilters} className="text-sm font-medium text-primary hover:underline">
                {t('common.clearFilters', { count: 1 })}
              </button>
            ) : undefined
          }
        />
      </div>
    );
  }

  const cards = [
    { labelKey: 'baoCaodeXuatVatTu.tongHop.totalPhieu', value: total, icon: FileText, iconClass: 'bg-primary/10 text-primary' },
    { labelKey: 'baoCaodeXuatVatTu.tongHop.choDuyet', value: choDuyet, icon: Clock, iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { labelKey: 'baoCaodeXuatVatTu.tongHop.doiDuyet', value: doiDuyet, icon: Hourglass, iconClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
    { labelKey: 'baoCaodeXuatVatTu.tongHop.daDuyet', value: daDuyet, icon: CheckCircle, iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { labelKey: 'baoCaodeXuatVatTu.tongHop.khongDuyet', value: khongDuyet, icon: XCircle, iconClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
    { labelKey: 'baoCaodeXuatVatTu.kpi.tyLeDuyet', value: `${tyLeDuyetPct}%`, icon: Percent, iconClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
    { labelKey: 'baoCaodeXuatVatTu.kpi.daChuyenDon', value: daChuyenCount, icon: Send, iconClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
    { labelKey: 'baoCaodeXuatVatTu.kpi.chuaChuyenDon', value: chuaChuyenCount, icon: Link2, iconClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  ];

  const filterButtons: { value: LienKetFilter; labelKey: string }[] = [
    { value: 'all', labelKey: 'baoCaodeXuatVatTu.lienKet.filterAll' },
    { value: 'daChuyen', labelKey: 'baoCaodeXuatVatTu.lienKet.daChuyen' },
    { value: 'chuaChuyen', labelKey: 'baoCaodeXuatVatTu.lienKet.chuaChuyen' },
  ];

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 space-y-6 print:overflow-visible">
          {periodLabel && (
            <p className="text-sm text-muted-foreground font-medium print:text-foreground" aria-label="Kỳ báo cáo">
              {periodLabel}
            </p>
          )}

          {/* KPI thẻ tổng quan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {cards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.labelKey} className={CARD_CLASS}>
                  <div className="flex items-center gap-3">
                    <div className={cn(ICON_WRAP, item.iconClass)}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{t(item.labelKey)}</p>
                      <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Biểu đồ: Theo tháng + Pie trạng thái + Pie liên kết đơn */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {byMonth.length > 0 && (
              <FormSection title={t('baoCaodeXuatVatTu.tongHop.byMonth')} icon={<BarChart3 size={16} />} variant="muted">
                <div className="rounded-xl border border-border bg-card p-4 overflow-hidden shadow-sm">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byMonth} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name={t('baoCaodeXuatVatTu.tongHop.countCol')} radius={[6, 6, 0, 0]} fill={BAR_MONTH_COLOR} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </FormSection>
            )}
            {pieTrangThaiData.length > 0 && (
              <FormSection title={t('baoCaodeXuatVatTu.tongHop.phanBoTrangThai')} icon={<FileText size={16} />} variant="muted">
                <div className="rounded-xl border border-border bg-card p-4 overflow-hidden shadow-sm">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieTrangThaiData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {pieTrangThaiData.map((_, i) => (
                          <Cell key={i} fill={STATUS_CHART_COLORS[i % STATUS_CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} formatter={(v: number | undefined) => [v ?? 0, t('baoCaodeXuatVatTu.tongHop.countCol')]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </FormSection>
            )}
            {pieLienKetData.length > 0 && (
              <FormSection title={t('baoCaodeXuatVatTu.tabs.lienKetDonHang')} icon={<Link2 size={16} />} variant="muted">
                <div className="rounded-xl border border-border bg-card p-4 overflow-hidden shadow-sm">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieLienKetData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {pieLienKetData.map((_, i) => (
                          <Cell key={i} fill={LIEN_KET_COLORS[i % LIEN_KET_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} formatter={(v: number | undefined) => [v ?? 0, t('baoCaodeXuatVatTu.tongHop.countCol')]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </FormSection>
            )}
          </div>

          {/* Bảng theo trạng thái + Theo nơi đề xuất + Theo người đề xuất */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <FormSection title={t('baoCaodeXuatVatTu.tongHop.byStatus')} icon={<FileText size={16} />} variant="muted">
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.tongHop.statusCol')}</th>
                        <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.tongHop.countCol')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byTrangThai.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground text-sm">
                            —
                          </td>
                        </tr>
                      ) : (
                        byTrangThai.map((row) => (
                          <tr key={row.trang_thai} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3 font-medium">{getTrangThaiLabel(row.trang_thai, t)}</td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold">{row.count}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </FormSection>

            <FormSection title={t('baoCaodeXuatVatTu.tongHop.byNoiDeXuat')} icon={<FileText size={16} />} variant="muted">
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm max-h-[320px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-[1] bg-muted/95 backdrop-blur">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.noiDeXuat')}</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.tongHop.countCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byNoiDeXuat.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground text-sm">
                          —
                        </td>
                      </tr>
                    ) : (
                      byNoiDeXuat.map((row, idx) => (
                        <tr key={row.id_noi_de_xuat} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground tabular-nums">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium">{row.ten_noi_de_xuat ?? row.id_noi_de_xuat}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold">{row.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </FormSection>

            <FormSection title={t('baoCaodeXuatVatTu.tongHop.byNguoiDeXuat')} icon={<User size={16} />} variant="muted">
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm max-h-[320px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-[1] bg-muted/95 backdrop-blur">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.nguoiDeXuat')}</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.tongHop.countCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byNguoiDeXuat.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground text-sm">—</td>
                      </tr>
                    ) : (
                      byNguoiDeXuat.map((row, idx) => (
                        <tr key={row.id} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground tabular-nums">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium">{row.ten || '—'}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold">{row.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </FormSection>
          </div>

          {/* Chi tiết phiếu */}
          <FormSection title={t('baoCaodeXuatVatTu.tabs.chiTietPhieu')} icon={<FileText size={16} />} variant="primary">
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.soPhieu')}</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.ngay')}</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.ngayCan')}</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.noiDeXuat')}</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.nguoiDeXuat')}</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.nguoiDuyet')}</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.trangThai')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phieuList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                          {t('baoCaodeXuatVatTu.empty')}
                        </td>
                      </tr>
                    ) : (
                      phieuList.map((row: ChiTietPhieuRow, idx: number) => (
                        <tr
                          key={row.id}
                          className="border-b border-border/60 hover:bg-muted/40 transition-colors cursor-pointer"
                          onClick={() => setSelectedPhieuId(row.id)}
                        >
                          <td className="px-4 py-3 text-muted-foreground tabular-nums">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium">{row.so_phieu}</td>
                          <td className="px-4 py-3">{row.ngay}</td>
                          <td className="px-4 py-3">{row.ngay_can}</td>
                          <td className="px-4 py-3">{row.ten_noi_de_xuat ?? '—'}</td>
                          <td className="px-4 py-3">{row.ten_nguoi_de_xuat ?? '—'}</td>
                          <td className="px-4 py-3">{row.ten_nguoi_duyet ?? '—'}</td>
                          <td className="px-4 py-3">
                            <TrangThaiBadge status={row.trang_thai} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </FormSection>

          {/* Liên kết đơn hàng */}
          <FormSection title={t('baoCaodeXuatVatTu.tabs.lienKetDonHang')} icon={<Link2 size={16} />} variant="primary">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {filterButtons.map(({ value, labelKey }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLinkFilter(value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      linkFilter === value
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">#</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.lienKet.soPhieu')}</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.ngay')}</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.noiDeXuat')}</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.nguoiDeXuat')}</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.trangThai')}</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.lienKet.daChuyenDon')}</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.lienKet.soDonHang')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLienKet.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                            {t('baoCaodeXuatVatTu.empty')}
                          </td>
                        </tr>
                      ) : (
                        filteredLienKet.map((row: LienKetDonHangRow, idx: number) => (
                          <tr key={row.id_phieu} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground tabular-nums">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium">{row.so_phieu}</td>
                            <td className="px-4 py-3">{row.ngay}</td>
                            <td className="px-4 py-3">{row.ten_noi_de_xuat ?? '—'}</td>
                            <td className="px-4 py-3">{row.ten_nguoi_de_xuat ?? '—'}</td>
                            <td className="px-4 py-3">
                              <TrangThaiBadge status={row.trang_thai} />
                            </td>
                            <td className="px-4 py-3">
                              {row.da_chuyen_don ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t('baoCaodeXuatVatTu.lienKet.daChuyen')}</span>
                              ) : (
                                <span className="text-muted-foreground">{t('baoCaodeXuatVatTu.lienKet.chuaChuyen')}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium">{row.so_phieu_don ?? '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </FormSection>
        </div>
      </div>

      {selectedPhieuId && <PhieuDetailDrawer phieuId={selectedPhieuId} onClose={() => setSelectedPhieuId(null)} />}
    </>
  );
};

export default TongHopDayDuTab;
