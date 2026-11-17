/** Trạng thái phiếu — DB: fp_farm_giam_sat_chat_luong.trang_thai */
export const TRANG_THAI_GSCL = ['dang_kiem', 'hoan_thanh', 'da_nop', 'da_xuat', 'huy'] as const;
export type TrangThaiGscl = (typeof TRANG_THAI_GSCL)[number];

/** Kết luận cây hàng — DB: fp_farm_giam_sat_chat_luong.ket_luan */
export const KET_LUAN_GSCL = ['dat', 'khong_dat'] as const;
export type KetLuanGscl = (typeof KET_LUAN_GSCL)[number];

/** Bộ lọc «Lỗi» của danh sách — theo bộ đếm so_loi / tong_nhanh_kiem (migration 081). */
export const CO_LOI_GSCL = ['co_loi', 'khong_loi'] as const;
export type CoLoiGscl = (typeof CO_LOI_GSCL)[number];

/**
 * Loại tiêu chí:
 * - `dem_loi`: đếm số trái lỗi mỗi thùng; ngưỡng = tổng tối đa cho 10 thùng mẫu.
 * - `do_luong`: số đo (số trái/nhánh, kg/nải); ngưỡng = khoảng min–max của trung bình.
 * - `dat_khong`: Đạt / Không mỗi thùng; ngưỡng = số thùng "Không" tối đa (trống = 0).
 */
export const LOAI_TIEU_CHI = ['dem_loi', 'do_luong', 'dat_khong'] as const;
export type LoaiTieuChi = (typeof LOAI_TIEU_CHI)[number];

/** Một tiêu chí như đã chụp vào phiếu (cột `tieu_chi` jsonb). */
export interface TieuChi {
  ma: string;
  ten: string;
  loai: LoaiTieuChi;
  don_vi: string | null;
  nguong_min: number | null;
  nguong_max: number | null;
}

/** Dòng danh mục fp_farm_gscl_tieu_chi. */
export interface TieuChiDanhMuc extends TieuChi {
  id: string;
  thu_tu: number;
  dang_dung: boolean;
}

export type GiaTriKetQua = number | boolean | null;
/** `{ma_tieu_chi: giá trị}` của một thùng. */
export type KetQuaThung = Record<string, GiaTriKetQua>;

export interface GiamSatChatLuong {
  id: string;
  so_phieu: string;
  /** YYYY-MM-DD */
  ngay: string;
  id_chi_nhanh: string;
  ten_chi_nhanh: string | null;
  id_hang_hoa: string | null;
  ma_hang_hoa: string | null;
  ten_hang_hoa: string | null;
  ma_cay_hang: string | null;
  so_thung_cay: number;
  so_thung_mau: number;
  tieu_chi: TieuChi[];
  trang_thai: TrangThaiGscl;
  ket_luan: KetLuanGscl | null;
  ghi_chu: string | null;
  id_nguoi_tao: string | null;
  ten_nguoi_tao: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Thời điểm nộp phiếu (ISO); null khi chưa nộp / đã mở lại. */
  tg_nop: string | null;
  id_nguoi_nop: string | null;
  ten_nguoi_nop: string | null;
  /** Thời điểm xuất (ISO); null khi chưa xuất / đã huỷ xuất. */
  tg_xuat: string | null;
  id_nguoi_xuat: string | null;
  ten_nguoi_xuat: string | null;
  /** Số thùng mẫu đã kiểm (đếm từ bảng thùng). */
  so_thung_da_kiem: number;
  /** Tổng nải lỗi (tiêu chí `dem_loi`) của các thùng đã kiểm — DB giữ bằng trigger (migration 081). */
  so_loi: number;
  /** Tổng nhánh/nải của các thùng đã kiểm (mẫu số % lỗi). */
  tong_nhanh_kiem: number;
  /** % lỗi = so_loi ÷ tong_nhanh_kiem × 100; null khi chưa có thùng nào. */
  ti_le_loi: number | null;
  /** Tiêu chí đếm lỗi có lỗi, cộng các thùng đã kiểm — cho tooltip cột «Lỗi». */
  loi_theo_tieu_chi: LoiTieuChi[];
}

export interface LoiTieuChi {
  ten: string;
  so_loi: number;
}

/** Một thùng mẫu — fp_farm_giam_sat_chat_luong_ct. */
export interface ThungMau {
  id: string;
  id_phieu: string;
  stt_thung: number;
  ma_tem: string;
  ket_qua: KetQuaThung;
  /** Tổng số nhánh/nải trong thùng (mẫu số tỉ lệ lỗi); null = thùng kiểm trước khi có cột này. */
  tong_nhanh: number | null;
  da_kiem: boolean;
  tg_kiem: string | null;
  id_nguoi_kiem: string | null;
  ten_nguoi_kiem: string | null;
  ghi_chu: string | null;
  /** Đường dẫn ảnh chụp thùng (`/media/f/...`, kho ảnh trên VPS). */
  hinh_anh_urls: string[];
}

/** Phiếu QC rút gọn — Đăng ký nhận hàng tra khi quét tem / chọn tay để xếp cây hàng lên xe. */
export interface PhieuQcTomTat {
  id: string;
  so_phieu: string;
  /** YYYY-MM-DD */
  ngay: string;
  id_chi_nhanh: string;
  trang_thai: TrangThaiGscl;
  ket_luan: KetLuanGscl | null;
  so_thung_cay: number;
  ma_cay_hang: string | null;
  ten_hang_hoa: string | null;
}

/**
 * Thông tin công khai của một tem thùng mẫu (trang quét QR không cần đăng nhập).
 * CỐ Ý chỉ 3 trường — không trả kết luận QC, người tạo hay id.
 */
export interface ThongTinTemCongKhai {
  ten_hang_hoa: string | null;
  ma_hang_hoa: string | null;
  ma_cay_hang: string | null;
}

/** Một xe (phiếu Đăng ký nhận hàng) đã xếp cây hàng này. */
export interface XeDaXepCayHang {
  id_phieu_xe: string;
  so_xe: string | null;
  so_cont: string | null;
  /** YYYY-MM-DD */
  ngay_dang_ky: string;
}
