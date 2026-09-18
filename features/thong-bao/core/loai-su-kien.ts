/**
 * Bảng tra loại sự kiện → cách hiển thị.
 *
 * Nội dung câu chữ do service notify sinh và lưu sẵn trong DB; phía app chỉ cần
 * biết chọn icon nào và màu gì.
 */

import type { NotificationType } from '../../../types';
import { PERMISSION_FUNCTIONS } from '../../he-thong/phan-quyen/core/permission-modules-config';

/** Mọi loại sự kiện đang phát sinh, nhóm theo module để dựng ma trận cài đặt. */
export const LOAI_SU_KIEN_THEO_MODULE: Record<string, readonly string[]> = {
  'kho-van/phieu-kho': [
    'phieu.cho_duyet', 'phieu.doi_duyet', 'phieu.da_duyet', 'phieu.khong_duyet', 'phieu.sua_sau_duyet',
  ],
  'mua-hang/phieu-de-xuat-vat-tu': [
    'phieu.cho_duyet', 'phieu.doi_duyet', 'phieu.da_duyet', 'phieu.khong_duyet', 'phieu.sua_sau_duyet',
  ],
  'quan-ly-farm/de-xuat-mua-hang': [
    'phieu.cho_duyet', 'phieu.doi_duyet', 'phieu.da_duyet', 'phieu.khong_duyet', 'phieu.sua_sau_duyet',
  ],
  'quan-ly-farm/phieu-kho-phan-thuoc': [
    'phieu.cho_duyet', 'phieu.da_duyet', 'phieu.khong_duyet', 'phieu.sua_sau_duyet',
  ],
  'hanh-chinh/cong-viec': [
    'cong_viec.duoc_giao', 'cong_viec.them_ho_tro', 'cong_viec.trao_doi_moi',
    'cong_viec.cho_bao_cao', 'cong_viec.hoan_thanh', 'cong_viec.huy',
  ],
  'hanh-chinh/phieu-hanh-chinh': [
    'hanh_chinh.cho_duyet', 'hanh_chinh.da_duyet', 'hanh_chinh.tu_choi', 'hanh_chinh.da_huy',
  ],
  'mua-hang/don-dat-hang': [
    'don_hang.cho_duyet', 'don_hang.da_xac_nhan', 'don_hang.dang_giao',
    'don_hang.da_nhan_du', 'don_hang.huy',
  ],
};

/** Module đã đấu thông báo, theo thứ tự hiện trên hàng chip lọc. */
export const MODULE_CO_THONG_BAO: readonly string[] = Object.keys(LOAI_SU_KIEN_THEO_MODULE);

const KIEU_THEO_LOAI: Record<string, NotificationType> = {
  'phieu.cho_duyet': 'info',
  'phieu.doi_duyet': 'info',
  'phieu.da_duyet': 'success',
  'phieu.khong_duyet': 'error',
  'phieu.sua_sau_duyet': 'warning',

  'cong_viec.duoc_giao': 'info',
  'cong_viec.them_ho_tro': 'info',
  'cong_viec.trao_doi_moi': 'info',
  'cong_viec.cho_bao_cao': 'warning',
  'cong_viec.hoan_thanh': 'success',
  'cong_viec.huy': 'warning',

  'hanh_chinh.cho_duyet': 'info',
  'hanh_chinh.da_duyet': 'success',
  'hanh_chinh.tu_choi': 'error',
  'hanh_chinh.da_huy': 'warning',

  'don_hang.cho_duyet': 'info',
  'don_hang.da_xac_nhan': 'success',
  'don_hang.dang_giao': 'info',
  'don_hang.da_nhan_du': 'success',
  'don_hang.huy': 'error',
};

export function kieuHienThi(loaiSuKien: string): NotificationType {
  return KIEU_THEO_LOAI[loaiSuKien] ?? 'info';
}

/** Khoá i18n cho tên loại sự kiện, dùng trong ma trận cài đặt. */
export function khoaI18nLoaiSuKien(loaiSuKien: string): string {
  return `notification.event.${loaiSuKien.replace(/\./g, '_')}`;
}

/**
 * Khoá i18n cho tên module, lấy từ chính cấu hình phân quyền để chip lọc và
 * trang phân quyền luôn gọi cùng một tên.
 */
export function khoaI18nTenModule(moduleId: string): string | null {
  for (const chucNang of PERMISSION_FUNCTIONS) {
    for (const nhom of chucNang.groups) {
      const m = nhom.modules.find((x) => x.id === moduleId);
      if (m) return m.nameKey;
    }
  }
  return null;
}
