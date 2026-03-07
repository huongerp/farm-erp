/** Hình thức phỏng vấn */
export type HinhThucPhongVan = 'online' | 'offline';

/** Trạng thái buổi PV: 0 = Chờ, 1 = Đã diễn ra, 2 = Hoãn, 3 = Hủy */
export type TrangThaiLichPV = 0 | 1 | 2 | 3;

/** Kết quả PV (optional) */
export type KetQuaPV = string;

/** Trạng thái đánh giá: 0 = Chưa đánh giá, 1 = Đạt, 2 = Không đạt */
export type TrangThaiDanhGia = 0 | 1 | 2;

/** Lịch phỏng vấn: một buổi/vòng PV gắn với ứng viên */
export interface LichPhongVan {
  id: string;
  id_ung_vien: string;
  so_vong: number;
  ngay: string;
  gio: string;
  hinh_thuc: HinhThucPhongVan;
  dia_diem: string;
  /** 0: Chờ, 1: Đã diễn ra, 2: Hoãn, 3: Hủy */
  trang_thai: TrangThaiLichPV;
  /** 0: Chưa đánh giá, 1: Đạt, 2: Không đạt */
  trang_thai_danh_gia?: TrangThaiDanhGia | null;
  danh_gia_diem_so?: string | null;
  danh_gia_nhan_xet?: string | null;
  ket_qua?: string | null;
  ghi_chu?: string | null;
  /** JSON đánh giá chi tiết (form chuyên nghiệp): DanhGiaChiTiet */
  danh_gia_chi_tiet?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Enrich từ UngVien */
  ten_ung_vien?: string;
  ma_de_xuat?: string;
}
