/**
 * Chip dây (nền theo màu 1 / màu 2 như tiêu đề cột lưới) + chấm màu cho option Combobox chọn màu / chọn dây.
 * Dùng chung cho form phiếu, bảng Chi tiết đánh giá, drawer lô / dòng, nhập theo lô.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../lib/utils';
import type { FarmDgdvCot, VarMauDay } from '../core/types';
import { nhanCotDay } from '../core/bang-tinh';
import { styleTieuDeCot } from '../utils/mau-day';

type CotMau = Pick<FarmDgdvCot, 'id_mau_1' | 'id_mau_2' | 'xe_doi'>;

interface ChipDayProps {
  /** null = dòng «Đứt dây». */
  cot: CotMau | null;
  mauTheoId: ReadonlyMap<string, VarMauDay>;
  className?: string;
}

/** Chip tên dây tô màu; đứt dây = chip xám. */
export const ChipDay: React.FC<ChipDayProps> = ({ cot, mauTheoId, className }) => {
  const { t } = useTranslation();
  if (!cot || !cot.id_mau_1) {
    return (
      <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground whitespace-nowrap', className)}>
        {cot ? '—' : t('danhGiaDauVao.luoi.dutDay')}
      </span>
    );
  }
  const m1 = mauTheoId.get(cot.id_mau_1)?.ma_mau ?? null;
  const m2 = cot.id_mau_2 ? (mauTheoId.get(cot.id_mau_2)?.ma_mau ?? null) : null;
  return (
    <span
      className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap', className)}
      style={styleTieuDeCot(m1, m2)}
    >
      {nhanCotDay(cot, mauTheoId, t('danhGiaDauVao.luoi.xeDoi'))}
    </span>
  );
};

/** Chấm tròn màu (option Combobox chọn màu). `maMau` null = viền rỗng. */
export const ChamMau: React.FC<{ maMau: string | null | undefined }> = ({ maMau }) => (
  <span
    className={cn('inline-block h-3 w-3 shrink-0 rounded-full border border-border', !maMau && 'bg-transparent')}
    style={maMau ? { background: maMau } : undefined}
    aria-hidden
  />
);

/** Nhãn option kèm chấm màu — `renderOption` / `renderValue` của Combobox chọn màu. */
export const nhanKemChamMau = (label: string, maMau: string | null | undefined) => (
  <span className="inline-flex items-center gap-2 min-w-0">
    <ChamMau maMau={maMau} />
    <span className="truncate">{label}</span>
  </span>
);
