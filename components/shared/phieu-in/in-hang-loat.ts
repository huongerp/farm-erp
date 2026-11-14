/**
 * Danh mục mẫu cho IN HÀNG LOẠT (`/in-hang-loat?mau=<khoá>&ids=1,2,3`).
 *
 * Mỗi mẫu nạp động (không kéo code mọi module vào một chunk) kèm locale của module. Module khai
 * trong file `in-hang-loat.ts` của nó (default export `MauInHangLoat`):
 *  - `taiNhieu(ids)`: tải dữ liệu đủ dựng nội dung (qua RLS của người in, giữ thứ tự `ids`);
 *  - `NoiDung`: component MỘT chứng từ — CÙNG component với trang in đơn lẻ;
 *  - `mauKey` / `macDinh` TRÙNG trang đơn lẻ → khổ / lề / cột người dùng đã chỉnh vẫn dùng chung;
 *  - `trangThai(d)`: trạng thái → dấu chìm riêng từng chứng từ (cùng luật `useDauChim`).
 * Thêm mẫu: một dòng ở `DANH_MUC_IN_HANG_LOAT` + file `in-hang-loat.ts` trong module + nút
 * `NutInHangLoat` ở slot `bulkActions` của toolbar.
 */
import type React from 'react';
import type { KhoGiayIn, MacDinhMau } from '../../../lib/phieu-in/cai-dat-in';
import { loadFeatureI18n, type FeatureI18nKey } from '../../../lib/feature-i18n';

export interface MauInHangLoat<T = unknown> {
  mauKey: string;
  /** Khoá i18n tiêu đề (vd `phieuKho.preview.title`). */
  tieuDeKey: string;
  macDinh: MacDinhMau;
  coChuGocPt?: number | ((kho: KhoGiayIn) => number);
  nhanLien?: string[];
  /** Module cần quyền xem (bọc `ModulePermissionGuard`), nếu trang đơn lẻ cũng chặn. */
  moduleId?: string;
  duongDanVe: string;
  taiNhieu: (ids: string[]) => Promise<T[]>;
  khoa: (d: T) => string;
  /** Trạng thái chứng từ → dấu chìm (loại nặng nhất nếu nhiều). */
  trangThai?: (d: T) => (string | null | undefined)[];
  /**
   * Hook lọc chứng từ người in được xem (khi bảng chưa có RLS theo người — vd phiếu hành chính).
   * Trả `null` khi đang tải phạm vi.
   */
  useLoc?: () => ((d: T) => boolean) | null;
  NoiDung: React.FC<{ duLieu: T }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mỗi mẫu một kiểu dữ liệu
type BatKy = MauInHangLoat<any>;

/** Loader một mẫu: nạp locale của module song song với file `in-hang-loat.ts`. */
export const napMau =
  (i18n: FeatureI18nKey, imp: () => Promise<{ default: unknown }>) =>
  async (): Promise<BatKy> => {
    const [, m] = await Promise.all([loadFeatureI18n(i18n), imp()]);
    return m.default as BatKy;
  };

/** Khoá URL (= `mauKey` của trang đơn lẻ) → loader của mẫu. Ví dụ:
 *  'phieu-kho': napMau('phieu-kho', () => import('../../../features/kho-van/phieu-kho/in-hang-loat')), */
export const DANH_MUC_IN_HANG_LOAT: Record<string, () => Promise<BatKy>> = {
  'phieu-kho': napMau('phieu-kho', () => import('../../../features/kho-van/phieu-kho/in-hang-loat')),
  'phieu-de-xuat-vat-tu': napMau('phieu-de-xuat-vat-tu', () => import('../../../features/kho-van/phieu-de-xuat-vat-tu/in-hang-loat')),
  'don-dat-hang': napMau('don-dat-hang', () => import('../../../features/mua-hang/don-dat-hang/in-hang-loat')),
  'thanh-toan-doi-tac': napMau('thanh-toan-doi-tac', () => import('../../../features/mua-hang/thanh-toan-doi-tac/in-hang-loat')),
  // Hai biến thể kho: cùng `mauKey` (cài đặt in dùng chung) nhưng khác khoá danh mục.
  'de-xuat-mua-hang': napMau('de-xuat-mua-hang', () => import('../../../features/quan-ly-nha-so-che/de-xuat-mua-hang/in-hang-loat')),
  'de-xuat-mua-hang-phan-thuoc': napMau('de-xuat-mua-hang', () => import('../../../features/quan-ly-nha-so-che/de-xuat-mua-hang/in-hang-loat-phan-thuoc')),
  'phieu-kho-pt': napMau('phieu-kho-phan-thuoc', () => import('../../../features/quan-ly-nha-so-che/phieu-kho-phan-thuoc/in-hang-loat')),
  'phieu-kho-pt-phan-thuoc': napMau('phieu-kho-phan-thuoc', () => import('../../../features/quan-ly-nha-so-che/phieu-kho-phan-thuoc/in-hang-loat-phan-thuoc')),
  // Phiếu hành chính không có locale riêng theo feature (adminForm.* nằm ở locales/vi) → không qua napMau.
  'phieu-hanh-chinh': async () => (await import('../../../features/hanh-chinh/phieu-hanh-chinh/in-hang-loat')).default,
  'phieu-bao-tri': napMau('bao-tri-sua-chua', () => import('../../../features/hanh-chinh/bao-tri-sua-chua/in-hang-loat')),
  'cap-phat-thu-hoi': napMau('cap-phat-thu-hoi', () => import('../../../features/hanh-chinh/cap-phat-thu-hoi/in-hang-loat')),
  'nhat-ky-pha-phen': napMau('nhat-ky-pha-phen', () => import('../../../features/quan-ly-nha-so-che/nhat-ky-pha-phen/in-hang-loat')),
};

/** Đường dẫn trang in hàng loạt. */
export function duongDanInHangLoat(mau: string, ids: readonly (string | number)[]): string {
  return `/in-hang-loat?mau=${encodeURIComponent(mau)}&ids=${ids.map((x) => encodeURIComponent(String(x))).join(',')}`;
}
