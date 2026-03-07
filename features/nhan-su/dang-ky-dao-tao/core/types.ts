/** Loại đăng ký: tự đăng ký hoặc được giao */
export type LoaiDangKy = 'tu_dang_ky' | 'duoc_giao';

/** Trạng thái đăng ký: 0=Chờ duyệt, 1=Đã duyệt, 2=Đang học, 3=Hoàn thành, 4=Hủy */
export type TrangThaiDangKy = 0 | 1 | 2 | 3 | 4;

/** Đăng ký tham gia khóa đào tạo */
export interface DangKyThamGia {
  id: string;
  id_khoa_hoc: string;
  id_nhan_vien: string;
  loai_dang_ky: LoaiDangKy;
  id_nguoi_giao?: string | null;
  trang_thai: TrangThaiDangKy;
  tg_dang_ky: string;
  tg_cap_nhat: string;
  /** Enrich: tên khóa học */
  ten_khoa_hoc?: string;
  /** Enrich: mã khóa */
  ma_khoa_hoc?: string;
  /** Enrich: tên nhân viên */
  ten_nhan_vien?: string;
  /** Enrich: id_loai_khoa_hoc (để filter) */
  id_loai_khoa_hoc?: string;
  /** Enrich: số chương đã pass, số chương tổng (từ progress) */
  so_chuong_da_pass?: number;
  so_chuong_tong?: number;
  /** Enrich: số bài đã xem, tổng bài */
  so_bai_da_xem?: number;
  so_bai_tong?: number;
}

/** Tiến độ xem bài học */
export interface TienDoBaiHoc {
  id: string;
  id_dang_ky: string;
  id_bai_hoc: string;
  da_xem: boolean;
  tg_xem_xong: string | null;
}

/** Kết quả bài test (chương) */
export interface KetQuaBaiTest {
  id: string;
  id_dang_ky: string;
  id_bai_test: string;
  diem: number;
  dat: boolean;
  tg_lam: string;
}
