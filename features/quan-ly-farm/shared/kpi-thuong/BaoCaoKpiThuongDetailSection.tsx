import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award } from 'lucide-react';
import DetailSection from '../../../../components/shared/DetailSection';
import { formatNumberVN } from '../../../../lib/utils';
import type { FarmBaoCaoKpiThuongRow } from './types';
import { sumTienThuongKpiThuong } from './types';

interface Props {
  rows: FarmBaoCaoKpiThuongRow[];
  /** Tiền tố i18n, ví dụ `baoCaoSoChe.kpiThuong` */
  i18nPrefix: string;
}

const BaoCaoKpiThuongDetailSection: React.FC<Props> = ({ rows, i18nPrefix }) => {
  const { t } = useTranslation();
  const k = (suffix: string) => t(`${i18nPrefix}.${suffix}`);
  const sorted = [...(rows ?? [])].sort((a, b) => a.thu_tu - b.thu_tu);

  return (
    <DetailSection title={k('sectionTitle')} icon={<Award size={14} />} variant="primary">
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">{k('emptyDetail')}</p>
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
                  <td className="px-2 py-2 text-sm">{row.danh_gia?.trim() ? row.danh_gia : '—'}</td>
                  <td className="px-2 py-2 text-right text-sm tabular-nums font-medium">
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
                  {formatNumberVN(sumTienThuongKpiThuong(sorted))}
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
