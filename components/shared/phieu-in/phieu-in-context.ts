import { createContext, useContext } from 'react';
import type { HuongGiayIn, KhoGiayIn } from '../../../lib/phieu-in/xuat-phieu';

/** Khổ giấy đang in — mẫu phiếu đọc để tự co bố cục (vd A5 thì `compact`). */
export interface PhieuInCtx {
  kho: KhoGiayIn;
  huong: HuongGiayIn;
  wMm: number;
  hMm: number;
  leMm: number;
  /** Khổ nhỏ (A5) — chữ và header thu gọn. */
  compact: boolean;
}

export const PhieuInContext = createContext<PhieuInCtx>({
  kho: 'a4',
  huong: 'doc',
  wMm: 210,
  hMm: 297,
  leMm: 12,
  compact: false,
});

export const usePhieuIn = () => useContext(PhieuInContext);
