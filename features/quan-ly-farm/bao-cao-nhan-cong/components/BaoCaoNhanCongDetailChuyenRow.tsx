import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ListTree } from 'lucide-react';
import type { FarmBaoCaoNhanCongCt } from '../core/types';
import type { LoaiChuyen } from '../core/types';
import { chuyenTtLabelByThuTu, tongCongQuyDoiNgayVaNua, tongGioTangCaTichMotDong } from '../core/types';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { countSubLinesOnCt, hasSubLinesOnCt } from '../core/ct-sub';
import BaoCaoNhanCongCtSubBreakdown from './BaoCaoNhanCongCtSubBreakdown';

interface Props {
  row: FarmBaoCaoNhanCongCt;
  tt?: string;
  idx?: number;
}

const BaoCaoNhanCongDetailChuyenRow: React.FC<Props> = ({ row, tt, idx }) => {
  const { t } = useTranslation();
  const [subOpen, setSubOpen] = useState(false);
  const code = row.loai_chuyen as LoaiChuyen;
  const labelKey = `baoCaoNhanCong.chuyen.${code}` as const;
  const displayTt =
    tt ?? chuyenTtLabelByThuTu(row.thu_tu && row.thu_tu > 0 ? row.thu_tu : (idx ?? 0) + 1);
  const hasSub = hasSubLinesOnCt(row);
  const subCount = countSubLinesOnCt(row);

  return (
    <React.Fragment>
      <tr className="border-b border-border/80">
        <td className="px-2 py-2 text-center font-medium text-muted-foreground tabular-nums align-top">
          {displayTt}
        </td>
        <td className="px-3 py-2 text-muted-foreground align-top">
          <div>{t(labelKey)}</div>
          {hasSub && (
            <button
              type="button"
              onClick={() => setSubOpen((v) => !v)}
              className={cn(
                'mt-1.5 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                subOpen
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:text-primary'
              )}
            >
              <ListTree size={13} />
              {subOpen ? t('baoCaoNhanCong.sub.collapse') : t('baoCaoNhanCong.sub.viewBreakdown')}
              <span className="tabular-nums opacity-80">({subCount})</span>
              <ChevronDown size={13} className={cn('transition-transform', subOpen && 'rotate-180')} />
            </button>
          )}
        </td>
        <td className="px-2 py-2 text-right text-sm tabular-nums">{formatNumberVN(row.sl_cong_ngay)}</td>
        <td className="px-2 py-2 text-right text-sm tabular-nums">{formatNumberVN(row.sl_cong_nua)}</td>
        <td className="px-2 py-2 text-right text-sm tabular-nums bg-primary/[0.06] dark:bg-primary/10 font-bold text-primary">
          {formatNumberVN(tongCongQuyDoiNgayVaNua(row))}
        </td>
        <td className="px-2 py-2 text-right text-sm tabular-nums">{formatNumberVN(row.sl_tang_ca)}</td>
        <td className="px-2 py-2 text-right text-sm tabular-nums">{formatNumberVN(row.so_gio_tc)}</td>
        <td className="px-2 py-2 text-right text-sm tabular-nums bg-primary/[0.06] dark:bg-primary/10 font-bold text-primary">
          {formatNumberVN(tongGioTangCaTichMotDong(row))}
        </td>
        <td className="px-2 py-2 text-muted-foreground min-w-[20rem] max-w-[32rem] align-top">
          {row.ghi_chu?.trim() ? (
            <div className="whitespace-pre-wrap text-sm leading-snug">{row.ghi_chu}</div>
          ) : (
            '—'
          )}
        </td>
      </tr>
      {subOpen && hasSub && <BaoCaoNhanCongCtSubBreakdown row={row} />}
    </React.Fragment>
  );
};

export default BaoCaoNhanCongDetailChuyenRow;
