import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award } from 'lucide-react';
import DetailSection from '../../../../components/shared/DetailSection';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { useIsMobile } from '../../../../lib/hooks/use-is-mobile';
import type { FarmBaoCaoKpiThuongRow } from './types';
import { sumTienThuongKpiThuong } from './types';
import { DanhGiaKpiBadge } from '../../bao-cao-so-che/components/BaoCaoSoCheKpiThuongFormSection';

interface Props {
  rows: FarmBaoCaoKpiThuongRow[];
  /** Tiền tố i18n, ví dụ `baoCaoSoChe.kpiThuong` */
  i18nPrefix: string;
}

const BaoCaoKpiThuongDetailSection: React.FC<Props> = ({ rows, i18nPrefix }) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const k = (suffix: string) => t(`${i18nPrefix}.${suffix}`);
  /** Nhãn đầy đủ cho điện thoại; thiếu key thì dùng nhãn viết tắt của bảng desktop. */
  const kFull = (suffix: string, fallbackSuffix: string) =>
    t(`${i18nPrefix}.${suffix}`, { defaultValue: k(fallbackSuffix) });
  const sorted = [...(rows ?? [])].sort((a, b) => a.thu_tu - b.thu_tu);
  const tongThuong = sumTienThuongKpiThuong(sorted);
  const tienColor = (n: number) =>
    n > 0 ? 'text-emerald-600 dark:text-emerald-400' : n < 0 ? 'text-rose-600 dark:text-rose-400' : '';

  return (
    <DetailSection title={k('sectionTitle')} icon={<Award size={14} />} variant="primary">
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">{k('emptyDetail')}</p>
      ) : isMobile ? (
        <div className="space-y-2">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-primary">{k('rowTongThuong')}</span>
            <span className="text-base font-bold text-primary tabular-nums">{formatNumberVN(tongThuong)}</span>
          </div>
          {sorted.map((row, idx) => {
            const phanTram =
              row.phan_tram == null || !Number.isFinite(Number(row.phan_tram))
                ? null
                : `${formatNumberVN(Number(row.phan_tram))}%`;
            const fields: { key: string; label: string; value: React.ReactNode; className?: string }[] = [];
            if (row.don_vi_tinh?.trim()) fields.push({ key: 'dvt', label: kFull('colDvtFull', 'colDvt'), value: row.don_vi_tinh });
            if (row.muc_tieu?.trim()) fields.push({ key: 'mt', label: k('colMucTieu'), value: row.muc_tieu });
            if (row.thuc_te?.trim()) fields.push({ key: 'tt', label: k('colThucTe'), value: row.thuc_te });
            if (phanTram) fields.push({ key: 'pt', label: kFull('colPhanTramFull', 'colPhanTram'), value: phanTram });
            fields.push({
              key: 'tien',
              label: k('colTienThuong'),
              value: formatNumberVN(row.tien_thuong),
              className: tienColor(row.tien_thuong),
            });
            return (
              <div
                key={row.id || `${row.thu_tu}-${idx}`}
                className="rounded-xl border border-border bg-card p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    <span className="mr-1.5 text-xs font-normal text-muted-foreground tabular-nums">{idx + 1}.</span>
                    {row.ten_hang_muc?.trim() ? row.ten_hang_muc : '—'}
                  </p>
                  {row.danh_gia?.trim() ? (
                    <span className="shrink-0">
                      <DanhGiaKpiBadge value={row.danh_gia} />
                    </span>
                  ) : null}
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {fields.map((f) => (
                    <div key={f.key} className="min-w-0">
                      <dt className="text-xs text-muted-foreground leading-tight">{f.label}</dt>
                      <dd className={cn('mt-0.5 text-sm font-semibold tabular-nums whitespace-pre-wrap break-words', f.className)}>
                        {f.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {row.ghi_chu?.trim() ? (
                  <p className="border-t border-border/60 pt-2 text-xs text-muted-foreground leading-snug whitespace-pre-wrap">
                    {row.ghi_chu}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm min-w-[48rem]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-center px-2 py-2 font-medium w-12">{k('colTt')}</th>
                <th className="text-left px-2 py-2 font-medium min-w-[9rem]">{k('colHangMuc')}</th>
                <th className="text-left px-2 py-2 font-medium w-20">{k('colDvt')}</th>
                <th className="text-left px-2 py-2 font-medium min-w-[5rem]">{k('colMucTieu')}</th>
                <th className="text-left px-2 py-2 font-medium min-w-[5rem]">{k('colThucTe')}</th>
                <th className="text-right px-2 py-2 font-medium w-24">{k('colPhanTram')}</th>
                <th className="text-left px-2 py-2 font-medium min-w-[5rem]">{k('colDanhGia')}</th>
                <th className="text-right px-2 py-2 font-medium w-28">{k('colTienThuong')}</th>
                <th className="text-left px-2 py-2 font-medium min-w-[8rem]">{k('colGhiChu')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => (
                <tr key={row.id || `${row.thu_tu}-${idx}`} className="border-b border-border/80 last:border-0">
                  <td className="px-2 py-2 text-center text-muted-foreground tabular-nums">{idx + 1}</td>
                  <td className="px-2 py-2 text-sm">{row.ten_hang_muc?.trim() ? row.ten_hang_muc : '—'}</td>
                  <td className="px-2 py-2 text-sm text-muted-foreground">{row.don_vi_tinh?.trim() ? row.don_vi_tinh : '—'}</td>
                  <td className="px-2 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                    {row.muc_tieu?.trim() ? row.muc_tieu : '—'}
                  </td>
                  <td className="px-2 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                    {row.thuc_te?.trim() ? row.thuc_te : '—'}
                  </td>
                  <td className="px-2 py-2 text-right text-sm tabular-nums">
                    {row.phan_tram == null || !Number.isFinite(Number(row.phan_tram))
                      ? '—'
                      : `${formatNumberVN(Number(row.phan_tram))}%`}
                  </td>
                  <td className="px-2 py-2 text-sm"><DanhGiaKpiBadge value={row.danh_gia} /></td>
                  <td className={cn(
                    'px-2 py-2 text-right text-sm tabular-nums font-medium',
                    row.tien_thuong > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : row.tien_thuong < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : ''
                  )}>
                    {formatNumberVN(row.tien_thuong)}
                  </td>
                  <td className="px-2 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                    {row.ghi_chu?.trim() ? row.ghi_chu : '—'}
                  </td>
                </tr>
              ))}
              <tr className="bg-primary/10 dark:bg-primary/15 border-t border-border">
                <td colSpan={7} className="px-3 py-2 text-right font-bold text-primary text-sm">
                  {k('rowTongThuong')}
                </td>
                <td className="px-2 py-2 text-right font-bold text-primary text-sm tabular-nums">
                  {formatNumberVN(tongThuong)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </DetailSection>
  );
};

export default BaoCaoKpiThuongDetailSection;
