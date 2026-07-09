import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, FileText, Clock, Hourglass, CheckCircle, XCircle } from 'lucide-react';
import { useTongHopDeXuatKy } from '../hooks/use-bao-cao-de-xuat-vat-tu';
import type { BaoCaoDeXuatVatTuFilters } from '../core/types';
import { getBaoCaoTrangThaiLabel } from '../core/trang-thai-utils';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartTooltip from '../../../../components/ui/ChartTooltip';

function formatDateDisplay(ymd: string): string {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

function getTrangThaiLabel(trang_thai: string, t: (k: string) => string): string {
  return getBaoCaoTrangThaiLabel(trang_thai, t);
}

interface TongHopKyTabProps {
  filters: BaoCaoDeXuatVatTuFilters | null;
  onClearFilters?: () => void;
}

const CARD_CLASS = 'bg-card rounded-xl border border-border p-3 sm:p-4 transition-all hover:shadow-md';
const ICON_WRAP = 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0';

const TongHopKyTab: React.FC<TongHopKyTabProps> = ({ filters, onClearFilters }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useTongHopDeXuatKy(filters);

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-destructive">{t('common.error') || 'Có lỗi khi tải dữ liệu.'}</p>
      </div>
    );
  }

  if (isLoading || !filters?.dateFrom || !filters?.dateTo) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 py-6 px-4">
          <LoadingSpinnerWithText
            text={!filters?.dateFrom || !filters?.dateTo ? t('baoCaodeXuatVatTu.selectPeriod') : t('baoCaodeXuatVatTu.loading')}
            centered
          />
        </div>
      </div>
    );
  }

  const total = data?.total ?? 0;
  const choDuyet = data?.choDuyet ?? 0;
  const doiDuyet = data?.doiDuyet ?? 0;
  const daDuyet = data?.daDuyet ?? 0;
  const khongDuyet = data?.khongDuyet ?? 0;
  const byTrangThai = data?.byTrangThai ?? [];
  const byNoiDeXuat = data?.byNoiDeXuat ?? [];
  const byMonth = data?.byMonth ?? [];
  const hasData = total > 0;

  if (!hasData) {
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

  const periodLabel = t('baoCaodeXuatVatTu.periodLabel', {
    from: formatDateDisplay(filters.dateFrom),
    to: formatDateDisplay(filters.dateTo),
  });

  const cards = [
    { labelKey: 'baoCaodeXuatVatTu.tongHop.totalPhieu', value: total, icon: FileText, iconClass: 'bg-primary/10 text-primary' },
    { labelKey: 'baoCaodeXuatVatTu.tongHop.choDuyet', value: choDuyet, icon: Clock, iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { labelKey: 'baoCaodeXuatVatTu.tongHop.doiDuyet', value: doiDuyet, icon: Hourglass, iconClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
    { labelKey: 'baoCaodeXuatVatTu.tongHop.daDuyet', value: daDuyet, icon: CheckCircle, iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { labelKey: 'baoCaodeXuatVatTu.tongHop.khongDuyet', value: khongDuyet, icon: XCircle, iconClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div className="p-3 sm:p-4 space-y-4 print:overflow-visible">
        <p className="text-sm text-muted-foreground font-medium print:text-foreground" aria-label="Kỳ báo cáo">
          {periodLabel}
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {cards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.labelKey} className={CARD_CLASS}>
                <div className="flex items-center gap-3">
                  <div className={`${ICON_WRAP} ${item.iconClass}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{t(item.labelKey)}</p>
                    <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{item.value.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {byMonth.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-4 overflow-hidden shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('baoCaodeXuatVatTu.tongHop.byMonth')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMonth} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name={t('baoCaodeXuatVatTu.tongHop.countCol')} radius={[4, 4, 0, 0]} fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}

        <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <h3 className="px-4 py-3 text-sm font-semibold text-foreground border-b border-border bg-muted/30">
            {t('baoCaodeXuatVatTu.tongHop.byStatus')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.tongHop.statusCol')}</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.tongHop.countCol')}</th>
                </tr>
              </thead>
              <tbody>
                {byTrangThai.map((row) => (
                  <tr key={row.trang_thai} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-medium">{getTrangThaiLabel(row.trang_thai, t)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {byNoiDeXuat.length > 0 && (
          <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <h3 className="px-4 py-3 text-sm font-semibold text-foreground border-b border-border bg-muted/30">
              {t('baoCaodeXuatVatTu.tongHop.byNoiDeXuat')}
            </h3>
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-[1] bg-muted/95 backdrop-blur">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.chiTiet.noiDeXuat')}</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaodeXuatVatTu.tongHop.countCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {byNoiDeXuat.map((row, idx) => (
                    <tr key={row.id_noi_de_xuat} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{row.ten_noi_de_xuat ?? row.id_noi_de_xuat}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default TongHopKyTab;
