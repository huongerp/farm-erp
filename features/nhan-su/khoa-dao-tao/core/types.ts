/** Trạng thái khóa: 0=Dự kiến, 1=Mở đăng ký, 2=Đã đóng, 3=Đang diễn ra, 4=Hoàn thành, 5=Hủy */
export type TrangThaiKhoaDaoTao = 0 | 1 | 2 | 3 | 4 | 5;

/** Khóa đào tạo */
export interface KhoaDaoTao {
  id: string;
  ma: string;
  ten: string;
  id_loai_khoa_hoc: string;
  mo_ta?: string | null;
  thoi_luong: number;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  dia_diem?: string | null;
  link_online?: string | null;
  /** 0=Dự kiến, 1=Mở đăng ký, 2=Đã đóng, 3=Đang diễn ra, 4=Hoàn thành, 5=Hủy */
  trang_thai: TrangThaiKhoaDaoTao;
  so_luong_toi_da?: number | null;
  giang_vien?: string | null;
  ghi_chu?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Enrich từ LoaiKhoaHoc */
  ten_loai_khoa_hoc?: string;
  /** Chức vụ được xem (phân quyền) */
  id_chuc_vu_xem?: string[];
  /** Enrich từ thiết lập: số chương / bài học / bài test */
  so_chuong?: number;
  so_bai_hoc?: number;
  so_bai_test?: number;
}
