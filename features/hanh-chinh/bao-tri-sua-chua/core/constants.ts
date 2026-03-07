import type { HangMuc } from './types';
import type { TFunction } from 'i18next';

export function getHangMucLabel(hangMuc: HangMuc, t: TFunction): string {
  return t(`baoTriSuaChua.hangMuc.${hangMuc}`);
}

export const HANG_MUC_OPTIONS: { value: HangMuc; labelKey: string }[] = [
  { value: 'bao_tri', labelKey: 'baoTriSuaChua.hangMuc.bao_tri' },
  { value: 'sua_chua', labelKey: 'baoTriSuaChua.hangMuc.sua_chua' },
];
