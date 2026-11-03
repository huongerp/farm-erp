/** Bản ghi thanh toán đối tác – liên kết đối tác (NCC), đơn vị (phòng ban), trạng thái thanh toán. */
export interface ThanhToanDoiTac {
  id: string;
  /** Mã phiếu / số chứng từ thanh toán */
  so_phieu: string;
  /** Hạng mục thanh toán (VD: DNTT tiền cơm bếp ăn tuần 9) */
  hang_muc_thanh_toan: string;
  /** Nội dung chi tiết / diễn giải (nhiều dòng) */
  noi_dung_chi_tiet?: string | null;
  /** Ngày lập */
  ngay: string;
  /** Đơn vị – FK phòng ban */
  id_don_vi: string | null;
  ten_don_vi?: string | null;
  /** Đối tác – FK nhà cung cấp (Mua hàng) */
  id_doi_tac: string;
  ten_doi_tac?: string;
  ma_doi_tac?: string;
  /** Nhóm đối tác – enrich từ đối tác (id_nhom) */
  ten_nhom?: string;
  /** Tài khoản nhận tiền của đối tác – enrich từ đối tác (in phiếu / chi tiết) */
  ngan_hang_bin?: string | null;
  so_tai_khoan?: string | null;
  chu_tai_khoan?: string | null;
  /** Trạng thái thanh toán – FK TrangThaiThanhToanDoiTac */
  id_trang_thai_thanh_toan: string;
  ten_trang_thai?: string;
  ma_trang_thai?: string;
  /** Màu trạng thái (từ thiết lập) – dùng để tô màu hiển thị */
  mau_trang_thai?: string;
  /** Số tiền (VNĐ) */
  so_tien: number;
  /** Ngày xử lý */
  ngay_xu_ly?: string | null;
  ghi_chu?: string | null;
  /** Người tạo – FK nhân viên */
  id_nguoi_tao: string;
  ten_nguoi_tao?: string;
  ma_nguoi_tao?: string;
  tg_tao: string;
  tg_cap_nhat: string;
}
