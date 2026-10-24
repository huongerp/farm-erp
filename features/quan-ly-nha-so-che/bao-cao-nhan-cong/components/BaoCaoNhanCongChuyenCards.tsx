import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmBaoCaoNhanCongCt, LoaiChuyen } from '../core/types';
import { chuyenTtLabelByThuTu, tongCongQuyDoiNgayVaNua, tongGioTangCaTichMotDong } from '../core/types';
import {
  combinedRowGhiChuAtIndex,
  countSubLinesOnCt,
  displayLoaiTotalsOnCt,
  hasSubLinesOnCt,
  isSubFormRowEmpty,
  subAlignedRowCount,
  subByLoaiForCtDisplay,
  tongGioCongNgayVaNua,
} from '../core/ct-sub';
import { formatNumberVN } from '../../../../lib/utils';
import BaoCaoNhanCongChuyenCard, { type ChuyenCardLoaiTotals } from './BaoCaoNhanCongChuyenCard';

export interface ChuyenCardsTotals {
  cnNgay: ChuyenCardLoaiTotals;
  cnNua: ChuyenCardLoaiTotals;
  tangCa: ChuyenCardLoaiTotals;
  quyDoi: number;
  tongGio: number;
  tongGioTc: number;
}

interface Props {
  production: FarmBaoCaoNhanCongCt[];
  vRow: FarmBaoCaoNhanCongCt;
  /** Tổng nhóm IV (các chuyền sản xuất). */
  subtotal: ChuyenCardsTotals;
  /** TỔNG NGÀY của cả phiếu. */
  total: ChuyenCardsTotals;
}

/** Dòng chi tiết (sub) của một chuyền — bản thẻ của BaoCaoNhanCongCtSubBreakdown. */
const SubLines: React.FC<{ row: FarmBaoCaoNhanCongCt }> = ({ row }) => {
  const { t } = useTranslation();
  const sub = subByLoaiForCtDisplay(row);
  const count = subAlignedRowCount(sub);
  const pair = (line: { sl_cong: number; so_gio: number } | undefined) =>
    line != null && !isSubFormRowEmpty(line)
      ? `${formatNumberVN(Number(line.sl_cong ?? 0))} × ${formatNumberVN(Number(line.so_gio ?? 0))}`
      : '—';

  return (
    <div className="space-y-1.5 border-t border-border/60 pt-2.5">
      {Array.from({ length: count }, (_, i) => {
        const ghiChu = combinedRowGhiChuAtIndex(sub, i);
        return (
          <div key={i} className="rounded-lg bg-muted/40 px-2.5 py-2 space-y-1">
            <div className="text-xs font-semibold text-foreground/80">{t('baoCaoNhanCong.sub.detailRow', { index: i + 1 })}</div>
            <div className="grid grid-cols-3 gap-x-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground leading-tight">{t('baoCaoNhanCong.sub.loai.CN_NGAY')}</div>
                <div className="text-sm font-semibold tabular-nums mt-0.5">{pair(sub.CN_NGAY[i])}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground leading-tight">{t('baoCaoNhanCong.sub.loai.CN_NUA')}</div>
                <div className="text-sm font-semibold tabular-nums mt-0.5">{pair(sub.CN_NUA[i])}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground leading-tight">{t('baoCaoNhanCong.sub.loai.TANG_CA')}</div>
                <div className="text-sm font-semibold tabular-nums mt-0.5">{pair(sub.TANG_CA[i])}</div>
              </div>
            </div>
            {ghiChu ? <p className="whitespace-pre-wrap text-xs leading-snug m-0 text-muted-foreground">{ghiChu}</p> : null}
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground m-0">{t('baoCaoNhanCong.card.chiTietHint')}</p>
    </div>
  );
};

const ChuyenRowCard: React.FC<{ row: FarmBaoCaoNhanCongCt; tt: string }> = ({ row, tt }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const hasSub = hasSubLinesOnCt(row);
  const cnNgay = displayLoaiTotalsOnCt(row, 'CN_NGAY');
  const cnNua = displayLoaiTotalsOnCt(row, 'CN_NUA');
  const tangCa = displayLoaiTotalsOnCt(row, 'TANG_CA');
  const toggleLabel = `${open ? t('baoCaoNhanCong.sub.collapse') : t('baoCaoNhanCong.sub.viewBreakdown')} (${countSubLinesOnCt(row)})`;

  return (
    <BaoCaoNhanCongChuyenCard
      tt={tt}
      title={t(`baoCaoNhanCong.chuyen.${row.loai_chuyen as LoaiChuyen}`)}
      cnNgay={cnNgay}
      cnNua={cnNua}
      tangCa={tangCa}
      quyDoi={tongCongQuyDoiNgayVaNua(row)}
      tongGio={tongGioCongNgayVaNua(cnNgay, cnNua)}
      tongGioTc={tongGioTangCaTichMotDong(row)}
      ghiChu={row.ghi_chu ?? ''}
      expanded={open}
      onToggle={hasSub ? () => setOpen((v) => !v) : undefined}
      toggleLabel={toggleLabel}
    >
      {open && hasSub ? <SubLines row={row} /> : null}
    </BaoCaoNhanCongChuyenCard>
  );
};

/** Bản điện thoại của bảng "Chuyền sản xuất": tổng ngày ở trên cùng, mỗi chuyền một thẻ. */
const BaoCaoNhanCongChuyenCards: React.FC<Props> = ({ production, vRow, subtotal, total }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <BaoCaoNhanCongChuyenCard tone="total" title={t('baoCaoNhanCong.form.rowTongNgay')} {...total} />
      {production.map((row, idx) => (
        <ChuyenRowCard
          key={row.id || row.loai_chuyen}
          row={row}
          tt={chuyenTtLabelByThuTu(row.thu_tu && row.thu_tu > 0 ? row.thu_tu : idx + 1)}
        />
      ))}
      <BaoCaoNhanCongChuyenCard tone="subtotal" tt="IV" title={t('baoCaoNhanCong.form.rowCongNhanDinhBien')} {...subtotal} />
      <ChuyenRowCard row={vRow} tt="V" />
    </div>
  );
};

export default BaoCaoNhanCongChuyenCards;
