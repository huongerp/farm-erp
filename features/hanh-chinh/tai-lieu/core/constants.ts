import type { HuongTaiLieu } from './types';
import type { TFunction } from 'i18next';

export const HUONG_OPTIONS: { value: HuongTaiLieu; labelKey: string }[] = [
  { value: 'noi_bo', labelKey: 'taiLieu.huongNoiBo' },
  { value: 'den', labelKey: 'taiLieu.huongDen' },
  { value: 'di', labelKey: 'taiLieu.huongDi' },
];

export function getHuongLabel(huong: HuongTaiLieu, t: TFunction): string {
  const o = HUONG_OPTIONS.find((x) => x.value === huong);
  return o ? t(o.labelKey) : huong;
}
