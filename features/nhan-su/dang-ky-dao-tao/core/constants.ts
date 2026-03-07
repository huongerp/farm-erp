import type { TrangThaiDangKy } from './types';

const TRANG_THAI_LABEL_KEYS: Record<TrangThaiDangKy, string> = {
  0: 'dangKyDaoTao.trangThai.choDuyet',
  1: 'dangKyDaoTao.trangThai.daDuyet',
  2: 'dangKyDaoTao.trangThai.dangHoc',
  3: 'dangKyDaoTao.trangThai.hoanThanh',
  4: 'dangKyDaoTao.trangThai.huy',
};

export function getTrangThaiDangKyLabel(
  trangThai: TrangThaiDangKy,
  t: (key: string) => string
): string {
  return t(TRANG_THAI_LABEL_KEYS[trangThai] ?? 'dangKyDaoTao.trangThai.choDuyet');
}

const TRANG_THAI_BADGE_CLASS: Record<TrangThaiDangKy, string> = {
  0: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  1: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  2: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  3: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20',
  4: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
};

export function getTrangThaiDangKyBadgeClass(trangThai: TrangThaiDangKy): string {
  return TRANG_THAI_BADGE_CLASS[trangThai] ?? TRANG_THAI_BADGE_CLASS[0];
}

export const TRANG_THAI_DANG_KY_VALUES: TrangThaiDangKy[] = [0, 1, 2, 3, 4];

const LOAI_DANG_KY_LABEL_KEYS: Record<'tu_dang_ky' | 'duoc_giao', string> = {
  tu_dang_ky: 'dangKyDaoTao.loaiDangKy.tuDangKy',
  duoc_giao: 'dangKyDaoTao.loaiDangKy.duocGiao',
};

export function getLoaiDangKyLabel(
  loai: 'tu_dang_ky' | 'duoc_giao',
  t: (key: string) => string
): string {
  return t(LOAI_DANG_KY_LABEL_KEYS[loai] ?? loai);
}

/** Ngưỡng điểm đạt bài test (%). Tự luận chưa chấm thì dat = false. */
export const NGUONG_DAT_TEST_PERCENT = 70;
