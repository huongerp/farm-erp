import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmBaoCaoNhanCongCt } from '../core/types';
import {
  type LoaiChiTieu,
  hasSubLinesOnCt,
  subAlignedRowCount,
  isSubFormRowEmpty,
  combinedRowGhiChuAtIndex,
  subByLoaiForCtDisplay,
} from '../core/ct-sub';
import { formatNumberVN } from '../../../../lib/utils';
import {
  bcncTrSub,
  bcncTdSubLabel,
  bcncTdSubNum,
  bcncTdGhiChu,
  bcncTdSubDash,
  bcncTdSubHighlightDash,
} from '../core/bcnc-detail-table';

interface Props {
  row: FarmBaoCaoNhanCongCt;
}

const EMPTY = '—';

function pairCells(line: { sl_cong: number; so_gio: number } | undefined) {
  const filled = line != null && !isSubFormRowEmpty(line);
  const sl = Number(line?.sl_cong ?? 0);
  const gio = Number(line?.so_gio ?? 0);
  return (
    <>
      <td className={bcncTdSubNum}>{filled ? formatNumberVN(sl) : EMPTY}</td>
      <td className={bcncTdSubNum}>{filled ? formatNumberVN(gio) : EMPTY}</td>
    </>
  );
}

const BaoCaoNhanCongCtSubBreakdown: React.FC<Props> = ({ row }) => {
  const { t } = useTranslation();
  if (!hasSubLinesOnCt(row)) return null;
  const sub = subByLoaiForCtDisplay(row);
  const rowCount = subAlignedRowCount(sub);

  return (
    <>
      {Array.from({ length: rowCount }, (_, i) => {
        const ghiChu = combinedRowGhiChuAtIndex(sub, i);
        return (
          <tr key={`detail-${i}`} className={bcncTrSub}>
            <td className={`${bcncTdSubNum} text-center text-muted-foreground/50`}>·</td>
            <td className={bcncTdSubLabel}>{t('baoCaoNhanCong.sub.detailRow', { index: i + 1 })}</td>
            {pairCells(sub.CN_NGAY[i])}
            {pairCells(sub.CN_NUA[i])}
            <td className={bcncTdSubDash}>{EMPTY}</td>
            <td className={bcncTdSubHighlightDash}>{EMPTY}</td>
            {pairCells(sub.TANG_CA[i])}
            <td className={bcncTdSubHighlightDash}>{EMPTY}</td>
            <td className={`${bcncTdGhiChu} text-sm`}>
              {ghiChu ? <p className="whitespace-pre-wrap leading-snug m-0">{ghiChu}</p> : EMPTY}
            </td>
          </tr>
        );
      })}
    </>
  );
};

export default BaoCaoNhanCongCtSubBreakdown;
