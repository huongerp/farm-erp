/** Loại phiếu quỹ: thu (tiền vào) / chi (tiền ra). */
export type LoaiThuChi = 'thu' | 'chi';

/**
 * Trạng thái duyệt của một phiếu quỹ:
 * - `cho_duyet`   — mới lập, chưa xét; sửa/xoá theo quyền module.
 * - `da_duyet`    — cấp cao đã duyệt; người thường hết sửa/xoá.
 * - `khong_duyet` — cấp cao không duyệt (vd mua hàng mà không nhập kho): KHÔNG tính
 *   vào tồn quỹ / thống kê, không quyết toán; người thường hết sửa/xoá.
 */
export type TrangThaiThuChiQuy = 'cho_duyet' | 'da_duyet' | 'khong_duyet';

export const TRANG_THAI_THU_CHI_QUY = {
  CHO_DUYET: 'cho_duyet',
  DA_DUYET: 'da_duyet',
  KHONG_DUYET: 'khong_duyet',
} as const satisfies Record<string, TrangThaiThuChiQuy>;

/** Nguồn chứng từ liên kết với phiếu quỹ (đa hình: mỗi nguồn một bảng). */
export type ThuChiNguon =
  | 'don_dat_hang'
  | 'phieu_de_xuat_vat_tu'
  | 'de_xuat_mua_hang'
  | 'pt_de_xuat_mua_hang'
  | 'chi_phi_tai_san';

/** Một phiếu thu/chi trong sổ quỹ (fp_tc_quy_thu_chi). */
export interface ThuChiQuy {
  id: string;
  so_phieu: string;
  ngay: string;
  id_chi_nhanh: string;
  /** Snapshot tên chi nhánh lúc lập phiếu */
  ten_chi_nhanh?: string;
  loai: LoaiThuChi;
  so_tien: number;
  so_luong?: number | null;
  don_gia?: number | null;
  id_hang_muc?: string | null;
  /** Snapshot tên hạng mục lúc lập phiếu */
  ten_hang_muc?: string;
  dien_giai: string;
  ghi_chu?: string;
  loai_chung_tu?: ThuChiNguon | null;
  id_chung_tu?: string | null;
  so_chung_tu?: string | null;
  id_nguoi_tao?: string | null;
  ten_nguoi_tao?: string;
  trang_thai: TrangThaiThuChiQuy;
  /** Người duyệt / không duyệt gần nhất (cấp cao) */
  id_nguoi_duyet?: string | null;
  ten_nguoi_duyet?: string | null;
  tg_duyet?: string | null;
  /** Lý do không duyệt — bắt buộc khi chuyển sang khong_duyet */
  ly_do_khong_duyet?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

/**
 * Dòng đọc từ view v_tc_quy_thu_chi_summary: có thêm cột thu/chi tách đôi,
 * tồn quỹ lũy kế và tên tham chiếu hiện tại (ref_*).
 */
export interface ThuChiQuyRow extends ThuChiQuy {
  thu: number;
  chi: number;
  /** Tồn quỹ lũy kế của chi nhánh tính đến dòng này (không phụ thuộc filter/phân trang) */
  ton_quy: number;
  ref_ten_chi_nhanh?: string;
  ref_ten_hang_muc?: string;
  ref_ten_nguoi_tao?: string;
}

/** Số dư quỹ hiện tại của một chi nhánh (view v_tc_quy_so_du). */
export interface QuySoDu {
  id_chi_nhanh: string;
  ten_chi_nhanh?: string;
  so_phieu: number;
  tong_thu: number;
  tong_chi: number;
  ton_quy_hien_tai: number;
  ngay_dau?: string | null;
  ngay_cuoi?: string | null;
}
