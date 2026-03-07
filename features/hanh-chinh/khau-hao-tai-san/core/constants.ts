import type { TrangThaiKyKhauHao } from './types';

export const TRANG_THAI_KY_OPTIONS: { value: TrangThaiKyKhauHao; labelKey: string }[] = [
  { value: 'draft', labelKey: 'khauHaoTaiSan.status.draft' },
  { value: 'chot', labelKey: 'khauHaoTaiSan.status.chot' },
];

export const THANG_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));

export function getTrangThaiKyLabel(status: TrangThaiKyKhauHao, t: (key: string) => string): string {
  const opt = TRANG_THAI_KY_OPTIONS.find((o) => o.value === status);
  return opt ? t(opt.labelKey) : status;
}
