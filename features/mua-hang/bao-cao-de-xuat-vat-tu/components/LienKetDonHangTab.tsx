import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2 } from 'lucide-react';
import { useLienKetDonHang } from '../hooks/use-bao-cao-de-xuat-vat-tu';
import type { BaoCaoDeXuatVatTuFilters } from '../core/types';
import type { LienKetDonHangRow } from '../core/types';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import { cn } from '../../../../lib/utils';

function getTrangThaiLabel(trang_thai: 0 | 1 | 2, t: (k: string) => string): string {
  return trang_thai === 0 ? t('baoCaodeXuatVatTu.trangThaiChoDuyet') : trang_thai === 1 ? t('baoCaodeXuatVatTu.trangThaiDaDuyet') : t('baoCaodeXuatVatTu.trangThaiKhongDuyet');
}

type LienKetFilter = 'all' | 'daChuyen' | 'chuaChuyen';

interface LienKetDonHangTabProps {
  filters: BaoCaoDeXuatVatTuFilters | null;
  onClearFilters?: () => void;
}

const LienKetDonHangTab: React.FC<LienKetDonHangTabProps> = ({ filters, onClearFilters }) => {
  const { t } = useTranslation();
  const { data: list = [], isLoading, isError } = useLienKetDonHang(filters);
  const [linkFilter, setLinkFilter] = useState<LienKetFilter>('all');

  const filteredList = useMemo(() => {
    if (linkFilter === 'all') return list;
    if (linkFilter === 'daChuyen') return list.filter((r: LienKetDonHangRow) => r.da_chuyen_don);
    return list.filter((r: LienKetDonHangRow) => !r.da_chuyen_don);
  }, [list, linkFilter]);

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-destructive">{t('common.error')}</p>
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

  if (list.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <EmptyState
          title={t('baoCaodeXuatVatTu.empty')}
          description={t('baoCaodeXuatVatTu.emptyHint')}
          icon={<Link2 size={48} className="text-muted-foreground/30" />}
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

  const filterButtons: { value: LienKetFilter; labelKey: string }[] = [
    { value: 'all', labelKey: 'baoCaodeXuatVatTu.lienKet.filterAll' },
    { value: 'daChuyen', labelKey: 'baoCaodeXuatVatTu.lienKet.daChuyen' },
    { value: 'chuaChuyen', labelKey: 'baoCaodeXuatVatTu.lienKet.chuaChuyen' },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div className="p-3 sm:p-4 space-y-4">
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
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      {t('baoCaodeXuatVatTu.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredList.map((row: LienKetDonHangRow, idx: number) => (
                    <tr key={row.id_phieu} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{row.so_phieu}</td>
                      <td className="px-4 py-3">{row.ngay}</td>
                      <td className="px-4 py-3">{row.ten_noi_de_xuat ?? '—'}</td>
                      <td className="px-4 py-3">{row.ten_nguoi_de_xuat ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                            row.trang_thai === 0 ? 'bg-amber-500/10 text-amber-600' : row.trang_thai === 1 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                          )}
                        >
                          {getTrangThaiLabel(row.trang_thai, t)}
                        </span>
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
    </div>
  );
};

export default LienKetDonHangTab;
