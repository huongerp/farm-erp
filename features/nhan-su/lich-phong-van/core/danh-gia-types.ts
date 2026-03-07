/**
 * Cấu trúc đánh giá phỏng vấn chuyên nghiệp (lưu dạng JSON trong LichPhongVan.danh_gia_chi_tiet).
 */
export interface DanhGiaChiTiet {
  /** 1. Thông tin cơ bản */
  nguoi_phong_van?: string | null;

  /** 2. Hard skills (1-5) */
  hard_nghiep_vu?: number | null;
  hard_kinh_nghiem?: number | null;
  hard_ky_thuat?: number | null;

  /** 3. Soft skills (1-5) */
  soft_giao_tiep?: number | null;
  soft_tu_duy?: number | null;
  soft_van_hoa?: number | null;
  soft_tac_phong?: number | null;

  /** 4. Nhận xét định tính */
  diem_manh?: string | null;
  diem_yeu?: string | null;
  ky_vong_luong?: string | null;

  /** 5. Kết luận */
  xep_hang_chung?: string | null;
  de_xuat?: string | null;

  /** Ghi chú chung (giữ tương thích) */
  ghi_chu?: string | null;
}

export const XEP_HANG_OPTIONS = [
  { value: 'rat_xuat_sac', labelKey: 'lichPhongVan.danhGia.xepHang.ratXuatSac' },
  { value: 'dat_yeu_cau', labelKey: 'lichPhongVan.danhGia.xepHang.datYeuCau' },
  { value: 'can_nhac', labelKey: 'lichPhongVan.danhGia.xepHang.canNhac' },
  { value: 'khong_dat', labelKey: 'lichPhongVan.danhGia.xepHang.khongDat' },
] as const;

export const DE_XUAT_OPTIONS = [
  { value: 'vong_2', labelKey: 'lichPhongVan.danhGia.deXuat.vong2' },
  { value: 'moi_nhan_viec', labelKey: 'lichPhongVan.danhGia.deXuat.moiNhanViec' },
  { value: 'luu_ho_so', labelKey: 'lichPhongVan.danhGia.deXuat.luuHoSo' },
  { value: 'tu_choi', labelKey: 'lichPhongVan.danhGia.deXuat.tuChoi' },
] as const;

export const SCALE_1_5 = [1, 2, 3, 4, 5] as const;

export function parseDanhGiaChiTiet(json: string | null | undefined): DanhGiaChiTiet | null {
  if (!json || json.trim() === '') return null;
  try {
    return JSON.parse(json) as DanhGiaChiTiet;
  } catch {
    return null;
  }
}

export function stringifyDanhGiaChiTiet(data: DanhGiaChiTiet): string {
  return JSON.stringify(data);
}
