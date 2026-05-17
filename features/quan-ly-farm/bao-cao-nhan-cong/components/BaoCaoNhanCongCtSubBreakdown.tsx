import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmBaoCaoNhanCongCt } from '../core/types';
import { LOAI_CHI_TIEU_CODES, sumGioCongFromSubModels, hasSubLinesOnCt } from '../core/ct-sub';
import { formatNumberVN } from '../../../../lib/utils';

interface Props {
  row: FarmBaoCaoNhanCongCt;
}

const BaoCaoNhanCongCtSubBreakdown: React.FC<Props> = ({ row }) => {
  const { t } = useTranslation();
  if (!hasSubLinesOnCt(row)) return null;
  const sub = row.sub_by_loai!;

  return (
    <tr className="bg-muted/20 border-b border-border/60">
      <td colSpan={9} className="px-3 py-3">
        <div className="space-y-3">
          {LOAI_CHI_TIEU_CODES.map((loai) => {
            const lines = sub[loai] ?? [];
            if (lines.length === 0) return null;
            const loaiKey = `baoCaoNhanCong.sub.loai.${loai}` as const;
            const sumSl = lines.reduce((s, r) => s + Number(r.sl_cong ?? 0), 0);
            const sumGio = sumGioCongFromSubModels(lines);
            return (
              <div key={loai} className="rounded-lg border border-border/70 bg-background overflow-hidden">
                <div className="px-3 py-1.5 text-xs font-semibold bg-muted/50 border-b border-border/60">
                  {t(loaiKey)}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border/40">
                      <th className="w-10 px-2 py-1.5 text-center">#</th>
                      <th className="px-2 py-1.5 text-right w-24">{t('baoCaoNhanCong.sub.colSlCong')}</th>
                      <th className="px-2 py-1.5 text-right w-20">{t('baoCaoNhanCong.sub.colSoGio')}</th>
                      <th className="px-2 py-1.5 text-right w-24">{t('baoCaoNhanCong.sub.colGioCong')}</th>
                      <th className="px-2 py-1.5 text-left">{t('baoCaoNhanCong.sub.colGhiChu')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={line.id || `${loai}-${i}`} className="border-b border-border/30 last:border-0">
                        <td className="px-2 py-1.5 text-center tabular-nums text-muted-foreground text-xs">
                          {i + 1}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{formatNumberVN(line.sl_cong)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{formatNumberVN(line.so_gio)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums font-medium text-primary">
                          {formatNumberVN(Number(line.sl_cong) * Number(line.so_gio))}
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground text-sm whitespace-pre-wrap">
                          {line.ghi_chu?.trim() || '—'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/25 text-xs font-medium">
                      <td className="px-2 py-1.5">{t('baoCaoNhanCong.sub.sum')}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{formatNumberVN(sumSl)}</td>
                      <td className="px-2 py-1.5" />
                      <td className="px-2 py-1.5 text-right tabular-nums text-primary">{formatNumberVN(sumGio)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </td>
    </tr>
  );
};

export default BaoCaoNhanCongCtSubBreakdown;
