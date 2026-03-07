import type { HinhThucPhongVan } from './types';
import type { TFunction } from 'i18next';

/** Trạng thái: 0 Chờ, 1 Đã diễn ra, 2 Hoãn, 3 Hủy */
export const TRANG_THAI_LICH_PV_KEYS: Record<number, string> = {
  0: 'lichPhongVan.trangThai.cho',
  1: 'lichPhongVan.trangThai.daDienRa',
  2: 'lichPhongVan.trangThai.hoan',
  3: 'lichPhongVan.trangThai.huy',
};

export function getTrangThaiLichPVLabel(trangThai: number, t: TFunction): string {
  return t(TRANG_THAI_LICH_PV_KEYS[trangThai] ?? TRANG_THAI_LICH_PV_KEYS[0]);
}

export const HINH_THUC_OPTIONS: { value: HinhThucPhongVan; labelKey: string }[] = [
  { value: 'online', labelKey: 'lichPhongVan.hinhThuc.online' },
  { value: 'offline', labelKey: 'lichPhongVan.hinhThuc.offline' },
];

/** CSS class cho badge hình thức (online / offline) */
export const HINH_THUC_BADGE_CLASS: Record<HinhThucPhongVan, string> = {
  online:
    'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  offline:
    'bg-muted/80 text-foreground border-border',
};

export function getHinhThucLabel(hinhThuc: HinhThucPhongVan, t: TFunction): string {
  return t(hinhThuc === 'online' ? 'lichPhongVan.hinhThuc.online' : 'lichPhongVan.hinhThuc.offline');
}

/** Trạng thái đánh giá: 0 Chưa đánh giá, 1 Đạt, 2 Không đạt */
export const TRANG_THAI_DANH_GIA_KEYS: Record<number, string> = {
  0: 'lichPhongVan.trangThaiDanhGia.chuaDanhGia',
  1: 'lichPhongVan.trangThaiDanhGia.dat',
  2: 'lichPhongVan.trangThaiDanhGia.khongDat',
};

export function getTrangThaiDanhGiaLabel(value: number | null | undefined, t: TFunction): string {
  if (value == null) return t(TRANG_THAI_DANH_GIA_KEYS[0]);
  return t(TRANG_THAI_DANH_GIA_KEYS[value] ?? TRANG_THAI_DANH_GIA_KEYS[0]);
}

/** Badge class theo trạng thái đánh giá */
export const TRANG_THAI_DANH_GIA_BADGE_CLASS: Record<number, string> = {
  0: 'bg-muted/80 text-muted-foreground border-border',
  1: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  2: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

/** Badge class theo giá trị kết quả PV (Đạt / Không đạt / Chuyển vòng 2 / ...) */
export function getKetQuaBadgeClass(ketQua: string | null | undefined): string {
  if (!ketQua || ketQua.trim() === '') return 'bg-muted/80 text-muted-foreground border-border';
  const v = ketQua.trim().toLowerCase();
  if (v === 'đạt' || v === 'dat' || v === 'đạt yêu cầu' || v.includes('mời nhận việc') || v.includes('nhan viec')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  if (v === 'không đạt' || v === 'khong dat' || v === 'từ chối' || v === 'tu choi' || v.includes('reject')) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  if (v.includes('vòng 2') || v.includes('vong 2') || v.includes('chuyển vòng') || v.includes('round 2')) return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
  if (v.includes('lưu hồ sơ') || v.includes('luu ho so') || v.includes('cân nhắc') || v.includes('can nhac')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  return 'bg-muted/80 text-foreground border-border';
}
