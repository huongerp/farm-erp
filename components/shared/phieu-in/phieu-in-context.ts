import { createContext, createElement, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import type { HuongGiayIn, KhoGiayIn, LeTrang } from '../../../lib/phieu-in/cai-dat-in';

/** Khổ giấy đang in — mẫu phiếu đọc để tự co bố cục (vd A5 thì `compact`). */
export interface PhieuInCtx {
  kho: KhoGiayIn;
  huong: HuongGiayIn;
  wMm: number;
  hMm: number;
  le: LeTrang;
  /** Khổ nhỏ (A5) — chữ và header thu gọn. */
  compact: boolean;
  /** Logo công ty đã đổi sang data URL (null = không có / chưa có). */
  logo: string | null;
}

export const PhieuInContext = createContext<PhieuInCtx>({
  kho: 'a4',
  huong: 'doc',
  wMm: 210,
  hMm: 297,
  le: { tren: 12, phai: 12, duoi: 12, trai: 12 },
  compact: false,
  logo: null,
});

export const usePhieuIn = () => useContext(PhieuInContext);

/** Đang dựng liên thứ mấy (1-based) trên tổng số liên, kèm nhãn liên của mẫu. */
export interface LienIn {
  lien: number;
  soLien: number;
  nhan: string;
}

export const LienContext = createContext<LienIn>({ lien: 1, soLien: 1, nhan: '' });

export const useLienIn = () => useContext(LienContext);

/**
 * Dòng «Liên k: <nhãn>» — chỉ hiện khi in từ 2 liên trở lên. `KhungPhieu` tự đặt; phiếu tự dựng
 * đầu đặt ở chỗ muốn in dòng này. Nhãn liên khai theo mẫu qua prop `nhanLien` của `PhieuInPage`.
 */
export function DongLien({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { lien, soLien, nhan } = useLienIn();
  if (soLien < 2) return null;
  return createElement(
    'p',
    {
      className,
      style: className ? undefined : { textAlign: 'right', fontStyle: 'italic', fontSize: '0.85em', margin: 0 },
    },
    `${t('common.phieuIn.lienSo', { so: lien })}${nhan ? `: ${nhan}` : ''}`
  );
}
