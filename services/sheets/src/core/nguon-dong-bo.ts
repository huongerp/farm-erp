/**
 * Module nào được đồng bộ tự động, đọc từ view nào. Server tra theo `moduleId` — client
 * KHÔNG tự đặt tên bảng/view, nên không thể trỏ lịch vào bảng nhạy cảm.
 *
 * Đấu thêm module:
 *   1. View `v_xuat_<module>` (security_invoker) có tên cột = key xuất trong
 *      `features/.../utils/export-*-danh-sach.ts`, cột `id` bắt buộc.
 *   2. CREATE TRIGGER trg_dong_bo_sheet_danh_dau trên từng bảng trong `bangGoc`.
 *   3. Thêm một mục ở đây + truyền `dongBo={{ moduleId }}` vào <ExportDialog> của module.
 */
export interface NguonDongBo {
  nguon: string;
  /** Mọi bảng nền ảnh hưởng số liệu của view — phải có trigger đánh dấu. */
  bangGoc: string[];
}

export const NGUON_DONG_BO: Readonly<Record<string, NguonDongBo>> = {
  'mua-hang/don-dat-hang': {
    nguon: 'v_xuat_don_dat_hang',
    bangGoc: ['fp_mh_don_dat_hang'],
  },
  'quan-ly-nha-so-che/phieu-kho-phan-thuoc': {
    nguon: 'v_xuat_phieu_kho_phan_thuoc',
    bangGoc: ['fp_farm_phieu_kho_phan_thuoc', 'fp_farm_phieu_kho_phan_thuoc_chi_tiet'],
  },
};
