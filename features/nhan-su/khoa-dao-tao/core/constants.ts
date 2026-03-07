import type { TrangThaiKhoaDaoTao } from './types';

const TRANG_THAI_LABEL_KEYS: Record<TrangThaiKhoaDaoTao, string> = {
  0: 'khoaDaoTao.trangThai.duKien',
  1: 'khoaDaoTao.trangThai.moDangKy',
  2: 'khoaDaoTao.trangThai.daDong',
  3: 'khoaDaoTao.trangThai.dangDienRa',
  4: 'khoaDaoTao.trangThai.hoanThanh',
  5: 'khoaDaoTao.trangThai.huy',
};

export function getTrangThaiKhoaDaoTaoLabel(
  trangThai: TrangThaiKhoaDaoTao,
  t: (key: string) => string
): string {
  return t(TRANG_THAI_LABEL_KEYS[trangThai] ?? 'khoaDaoTao.trangThai.duKien');
}

const TRANG_THAI_BADGE_CLASS: Record<TrangThaiKhoaDaoTao, string> = {
  0: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
  1: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  2: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  3: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  4: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20',
  5: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
};

export function getTrangThaiKhoaDaoTaoBadgeClass(trangThai: TrangThaiKhoaDaoTao): string {
  return TRANG_THAI_BADGE_CLASS[trangThai] ?? TRANG_THAI_BADGE_CLASS[0];
}

export const TRANG_THAI_KHOA_VALUES: TrangThaiKhoaDaoTao[] = [0, 1, 2, 3, 4, 5];

/** Màu badge theo id loại khóa học (lkh-1 Kỹ năng, lkh-2 Văn hóa, lkh-3 Quy trình/Quy định; id khác dùng màu mặc định). */
const LOAI_KHOA_HOC_BADGE_CLASS: Record<string, string> = {
  'lkh-1': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  'lkh-2': 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
  'lkh-3': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
};

const DEFAULT_LOAI_KHOA_HOC_BADGE =
  'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';

export function getLoaiKhoaHocBadgeClass(idLoaiKhoaHoc: string): string {
  return LOAI_KHOA_HOC_BADGE_CLASS[idLoaiKhoaHoc] ?? DEFAULT_LOAI_KHOA_HOC_BADGE;
}
