import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, MapPin, Layers } from 'lucide-react';
import { useTonAtDate } from '../hooks/use-bao-cao-nxt';
import type { NXTReportFilters } from '../core/types';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';

const CARD_CLASS = 'bg-card rounded-xl border border-border p-3 sm:p-4 transition-all hover:shadow-md';
const ICON_WRAP = 'w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary';

interface TonTaiThoiDiemTabProps {
  filters: NXTReportFilters | null;
}

const TonTaiThoiDiemTab: React.FC<TonTaiThoiDiemTabProps> = ({ filters }) => {
  const { t } = useTranslation();
  const { data: rows = [], isLoading, isError } = useTonAtDate(filters);

  const summary = useMemo(() => {
    const totalQty = rows.reduce((s, r) => s + r.so_luong, 0);
    const warehouseIds = new Set(rows.map((r) => r.id_kho));
    const productIds = new Set(rows.map((r) => r.id_hang_hoa));
    return {
      totalQty,
      warehouseCount: warehouseIds.size,
      productCount: productIds.size,
    };
  }, [rows]);

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-destructive">{t('common.error') || 'Có lỗi khi tải dữ liệu.'}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <LoadingSpinnerWithText text={t('baoCaonhapXuatTon.loading')} centered />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <EmptyState
          title={t('baoCaonhapXuatTon.empty')}
          description={t('baoCaonhapXuatTon.emptyHint')}
          icon={<Package size={48} className="text-muted-foreground/30" />}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div className="p-3 sm:p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className={CARD_CLASS}>
            <div className="flex items-center gap-3">
              <div className={ICON_WRAP}>
                <Layers size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{t('baoCaonhapXuatTon.summary.tonCuoiKy')}</p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{summary.totalQty.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className={CARD_CLASS}>
            <div className="flex items-center gap-3">
              <div className={ICON_WRAP}>
                <MapPin size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{t('baoCaonhapXuatTon.byWarehouse.tenKho')}</p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{summary.warehouseCount}</p>
              </div>
            </div>
          </div>
          <div className={CARD_CLASS}>
            <div className="flex items-center gap-3">
              <div className={ICON_WRAP}>
                <Package size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{t('baoCaonhapXuatTon.summary.soMatHang')}</p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{summary.productCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.tonThoiDiem.maKho')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.tonThoiDiem.tenKho')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.tonThoiDiem.maHang')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.tonThoiDiem.tenHang')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.tonThoiDiem.danhMuc')}</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.tonThoiDiem.donViTinh')}</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground/90 whitespace-nowrap">{t('baoCaonhapXuatTon.tonThoiDiem.soLuong')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={`${row.id_kho}-${row.id_hang_hoa}-${idx}`} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.ma_kho}</td>
                    <td className="px-4 py-3 font-medium">{row.ten_kho}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.ma_hang}</td>
                    <td className="px-4 py-3 font-medium">{row.ten_hang}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.ten_danh_muc ?? '—'}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{row.don_vi_tinh}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{row.so_luong.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TonTaiThoiDiemTab;
