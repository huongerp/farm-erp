import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import type { FarmBaoCaoNhanCongCt } from '../core/types';
import type { LoaiChuyen } from '../core/types';
import { chuyenTtLabelByThuTu, tongCongQuyDoiNgayVaNua, tongGioTangCaTichMotDong } from '../core/types';
import { cn, formatNumberVN } from '../../../../lib/utils';
import {
  countSubLinesOnCt,
  displayLoaiTotalsOnCt,
  formatGioTbVN,
  hasSubLinesOnCt,
  tongGioCongNgayVaNua,
} from '../core/ct-sub';
import {
  bcncTrMain,
  bcncTdTt,
  bcncTdChuyen,
  bcncTdMainNum,
  bcncTdQuyDoi,
  bcncTdTongGio,
  bcncTdTongGioTc,
  bcncTdGhiChu,
} from '../core/bcnc-detail-table';
import BaoCaoNhanCongCtSubBreakdown from './BaoCaoNhanCongCtSubBreakdown';

interface Props {
  row: FarmBaoCaoNhanCongCt;
  tt?: string;
  idx?: number;
}

function LoaiPairCells({ row, loai }: { row: FarmBaoCaoNhanCongCt; loai: 'CN_NGAY' | 'CN_NUA' | 'TANG_CA' }) {
  const { nhanSu, tongGio } = displayLoaiTotalsOnCt(row, loai);
  return (
    <>
      <td className={bcncTdMainNum}>{formatNumberVN(nhanSu)}</td>
      <td className={bcncTdMainNum}>{formatGioTbVN(nhanSu, tongGio)}</td>
    </>
  );
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
  const cnNgay = displayLoaiTotalsOnCt(row, 'CN_NGAY');
  const cnNua = displayLoaiTotalsOnCt(row, 'CN_NUA');

  return (
    <React.Fragment>
      <tr className={bcncTrMain}>
        <td className={`${bcncTdTt} text-muted-foreground tabular-nums`}>{displayTt}</td>
        <td className={`${bcncTdChuyen} text-muted-foreground`}>
          <div className="flex items-center gap-2">
            <span className="text-sm leading-snug flex-1 min-w-0">{t(labelKey)}</span>
            {hasSub && (
              <button
                type="button"
                onClick={() => setSubOpen((v) => !v)}
                aria-expanded={subOpen}
                aria-label={
                  subOpen
                    ? t('baoCaoNhanCong.sub.collapse')
                    : `${t('baoCaoNhanCong.sub.viewBreakdown')} (${subCount})`
                }
                title={`${subOpen ? t('baoCaoNhanCong.sub.collapse') : t('baoCaoNhanCong.sub.viewBreakdown')} (${subCount})`}
                className={cn(
                  'shrink-0 size-7 inline-flex items-center justify-center rounded-md border transition-colors',
                  subOpen
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:text-primary'
                )}
              >
                <ChevronDown size={15} className={cn('transition-transform', subOpen && 'rotate-180')} />
              </button>
            )}
          </div>
        </td>
        <LoaiPairCells row={row} loai="CN_NGAY" />
        <LoaiPairCells row={row} loai="CN_NUA" />
        <td className={bcncTdQuyDoi}>{formatNumberVN(tongCongQuyDoiNgayVaNua(row))}</td>
        <td className={bcncTdTongGio}>{formatNumberVN(tongGioCongNgayVaNua(cnNgay, cnNua))}</td>
        <LoaiPairCells row={row} loai="TANG_CA" />
        <td className={bcncTdTongGioTc}>{formatNumberVN(tongGioTangCaTichMotDong(row))}</td>
        <td className={`${bcncTdGhiChu} text-muted-foreground font-normal`}>
          {row.ghi_chu?.trim() ? (
            <p className="whitespace-pre-wrap text-sm leading-snug m-0">{row.ghi_chu}</p>
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
