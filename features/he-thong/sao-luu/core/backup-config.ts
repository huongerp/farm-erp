/**
 * Cấu hình sao lưu/khôi phục: ánh xạ collection → bảng Supabase, thứ tự FK, cột ngoại.
 */

/** Collection id (UI) → tên bảng Supabase */
export const COLLECTION_TO_TABLE: Record<string, string> = {
  chi_nhanh: 'fp_var_chi_nhanh',
  phong_ban: 'fp_var_phong_ban',
  cap_bac: 'fp_var_cap_bac',
  cau_hinh: 'fp_var_tt_cong_ty',
  chuc_vu: 'fp_var_chuc_vu',
  nhan_vien: 'fp_var_nhan_vien',
  phan_quyen: 'fp_var_phan_quyen',
};

/** Thứ tự insert khi khôi phục (bảng cha trước, bảng con sau theo FK) */
export const RESTORE_ORDER: string[] = [
  'chi_nhanh',
  'phong_ban',
  'cap_bac',
  'cau_hinh',
  'chuc_vu',
  'nhan_vien',
  'phan_quyen',
];

/** Thứ tự xóa khi replace (ngược RESTORE_ORDER để tránh vi phạm FK) */
export const DELETE_ORDER = [...RESTORE_ORDER].reverse();

/**
 * Với mỗi bảng, cột FK → collection id (bảng cha).
 * Dùng để map id cũ → id mới khi restore chế độ replace (insert không gửi id).
 */
export const FK_BY_COLLECTION: Record<string, Record<string, string>> = {
  chuc_vu: { phong_ban_id: 'phong_ban', cap_bac_id: 'cap_bac' },
  nhan_vien: {
    phong_ban_id: 'phong_ban',
    chuc_vu_id: 'chuc_vu',
    chi_nhanh_id: 'chi_nhanh',
    cap_bac_id: 'cap_bac',
  },
  phan_quyen: { chuc_vu_id: 'chuc_vu' },
};

/** Collections được hỗ trợ sao lưu/khôi phục thật (có bảng Supabase) */
export const SUPPORTED_COLLECTIONS = Object.keys(COLLECTION_TO_TABLE);

export function isSupportedCollection(collectionId: string): boolean {
  return collectionId in COLLECTION_TO_TABLE;
}
