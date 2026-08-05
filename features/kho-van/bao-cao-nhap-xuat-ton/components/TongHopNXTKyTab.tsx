import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { useNXTByPeriod } from '../hooks/use-bao-cao-nxt';
import type { NXTReportFilters } from '../core/types';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import NXTSummaryCards from './NXTSummaryCards';
import { formatYmdToDisplay } from '../../../../lib/utils';


interface TongHopNXTKyTabProps {
  filters: NXTReportFilters | null;
  onClearFilters?: () => void;
}

const TongHopNXTKyTab: React.FC<TongHopNXTKyTabProps> = ({ filters, onClearFilters }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useNXTByPeriod(filters);

  const summary = useMemo(() => {
    const byProduct = data?.byProduct ?? [];
    return {
      tonDauKy: byProduct.reduce((s, r) => s + r.ton_dau_ky, 0),
      tongNhap: byProduct.reduce((s, r) => s + r.tong_nhap, 0),
      tongXuat: byProduct.reduce((s, r) => s + r.tong_xuat, 0),
      tonCuoiKy: byProduct.reduce((s, r) => s + r.ton_cuoi_ky, 0),
    };
  }, [data?.byProduct]);

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
            text={!filters?.dateFrom || !filters?.dateTo ? t('baoCaonhapXuatTon.selectPeriod') : t('baoCaonhapXuatTon.loading')}
            centered
          />
        </div>
      </div>
    );
  }

  const byWarehouse = data?.byWarehouse ?? [];
  const byProduct = data?.byProduct ?? [];
  const hasData = byWarehouse.length > 0 || byProduct.length > 0;

  if (!hasData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <EmptyState
          title={t('baoCaonhapXuatTon.empty')}
          description={t('baoCaonhapXuatTon.emptyHint')}
          icon={<BarChart3 size={48} className="text-muted-foreground/30" />}
          action={
            onClearFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t('common.clearFilters', { count: 1 })}
              </button>
            ) : undefined
          }
        />
      </div>
    );
  }

  const periodLabel = t('baoCaonhapXuatTon.periodLabel', {
    from: formatYmdToDisplay(filters.dateFrom),
    to: formatYmdToDisplay(filters.dateTo),
  });

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div className="p-3 sm:p-4 space-y-4 print:overflow-visible">
        <p className="text-sm text-muted-foreground font-medium print:text-foreground" aria-label="Kỳ báo cáo">
          {periodLabel}
        </p>

        {byWarehouse.length > 0 && (
          <>
            <NXTSummaryCards summary={summary} />
            <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <h3 className="px-4 py-3 text-sm font-semibold text-foreground border-b border-border bg-muted/30">
                {t('baoCaonhapXuatTon.byWarehouse.tenKho')} – {t('baoCaonhapXuatTon.tabs.tongHop')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byWarehouse.maKho')}</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byWarehouse.tenKho')}</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byWarehouse.tonDauKy')}</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byWarehouse.tongNhap')}</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byWarehouse.tongXuat')}</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byWarehouse.tonCuoiKy')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byWarehouse.map((row) => (
                      <tr key={row.id_kho} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.ma_kho}</td>
                        <td className="px-4 py-3 font-medium">{row.ten_kho}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.ton_dau_ky.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{row.tong_nhap.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400">{row.tong_xuat.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">{row.ton_cuoi_ky.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {byProduct.length > 0 && (
          <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <h3 className="px-4 py-3 text-sm font-semibold text-foreground border-b border-border bg-muted/30">
              {t('baoCaonhapXuatTon.byProduct.tenHang')} – {t('baoCaonhapXuatTon.tabs.tongHop')}
            </h3>
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-[1] bg-muted/95 backdrop-blur">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byProduct.maHang')}</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byProduct.tenHang')}</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byProduct.danhMuc')}</th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byProduct.donViTinh')}</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byProduct.tonDauKy')}</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byProduct.tongNhap')}</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byProduct.tongXuat')}</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.byProduct.tonCuoiKy')}</th>
                  </tr>
                </thead>
                <tbody>
                  {byProduct.map((row) => (
                    <tr key={row.id_hang_hoa} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.ma_hang}</td>
                      <td className="px-4 py-3 font-medium">{row.ten_hang}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.ten_danh_muc ?? '—'}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{row.don_vi_tinh}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.ton_dau_ky.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{row.tong_nhap.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400">{row.tong_xuat.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{row.ton_cuoi_ky.toLocaleString()}</td>
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

export default TongHopNXTKyTab;
