/**
 * Kế hoạch bảo dưỡng thiết bị — DB: fp_farm_bd_thiet_bi, fp_farm_bd_viec, fp_farm_bd_nhat_ky
 * (migration 073). `han_ke_tiep` / `lan_gan_nhat` do trigger DB tính — app chỉ đọc
 * (lúc tạo việc mới có thể nhập `han_ke_tiep` làm ngày bắt đầu).
 */

export interface ThietBi {
  id: string;
  /** Farm (fp_var_chi_nhanh) — migration 077; mỗi farm một danh sách thiết bị riêng */
  id_chi_nhanh: string;
  ten: string;
  /** Mã tài sản / mã máy, có thể nhiều mã: "MX-01, MX-02" */
  ma_ts: string | null;
  so_luong: string | null;
  khu_vuc: string | null;
  /** Liên kết tuỳ chọn fp_ts_tai_san (hành chính) */
  id_tai_san: string | null;
  ghi_chu: string | null;
  dang_dung: boolean;
  thu_tu: number;
  id_nguoi_tao: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface ViecBaoDuong {
  id: string;
  id_thiet_bi: string;
  noi_dung: string;
  /** null = không theo lịch ngày (vd theo giờ chạy) → không có hạn */
  chu_ky_ngay: number | null;
  /** YYYY-MM-DD */
  lan_gan_nhat: string | null;
  /** YYYY-MM-DD */
  han_ke_tiep: string | null;
  ghi_chu: string | null;
  dang_dung: boolean;
  thu_tu: number;
  /** Kết quả lần ghi nhật ký mới nhất (trigger ghi, migration 076); null = chưa ghi lần nào */
  kq_gan_nhat: KetQuaBaoDuong | null;
}

export const KET_QUA_BAO_DUONG = ['hoan_thanh', 'can_theo_doi', 'can_sua_chua'] as const;
export type KetQuaBaoDuong = (typeof KET_QUA_BAO_DUONG)[number];

export interface NhatKyBaoDuong {
  id: string;
  id_viec: string;
  /** YYYY-MM-DD */
  ngay_thuc_hien: string;
  ket_qua: KetQuaBaoDuong;
  noi_dung: string | null;
  /** Đường dẫn /media/f/... (uploadAnh) */
  hinh_anh: string[];
  id_nguoi_thuc_hien: string | null;
  id_nguoi_tao: string | null;
  tg_tao: string;
}
