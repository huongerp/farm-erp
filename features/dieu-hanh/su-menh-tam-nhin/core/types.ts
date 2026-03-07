/** Giá trị cốt lõi */
export interface CoreValue {
  id: string;
  ten: string;
  mo_ta: string;
  thu_tu: number;
  /** Mục đích của giá trị này */
  mo_dich?: string;
  /** Hành vi nên làm (có thể nhiều) */
  hanh_vi_nen_lam?: string[];
  /** Hành vi không nên làm (có thể nhiều) */
  hanh_vi_khong_nen_lam?: string[];
}

/** Loại biểu đồ cho chỉ tiêu quy mô */
export type LoaiBieuDoQuyMo = 'bar_vertical' | 'bar_horizontal';

/** Chỉ tiêu quy mô (doanh số, cửa hàng, hàng hóa...) – tầm nhìn quy mô */
export interface ChiTieuQuyMo {
  id: string;
  ten: string;
  don_vi: string;
  thu_tu: number;
  /** Thanh dọc hoặc thanh ngang. Mặc định bar_vertical */
  loai_bieu_do?: LoaiBieuDoQuyMo;
}

/** Giá trị chỉ tiêu quy mô theo năm */
export interface GiaTriQuyMoTheoNam {
  id_chi_tieu: string;
  nam: number;
  gia_tri: number;
}

/** Loại biểu đồ cho tầm nhìn thị phần – chỉ tròn hoặc donut */
export type LoaiBieuDoThiPhan = 'pie' | 'donut';

/** Phân khúc thị phần (vd. Ngành A, Ngành B) */
export interface PhanKhucThiPhan {
  id: string;
  ten: string;
  thu_tu: number;
  /** Tròn hoặc donut. Mặc định pie */
  loai_bieu_do?: LoaiBieuDoThiPhan;
}

/** Chỉ tiêu thị phần theo năm, theo phân khúc – gia_tri là % */
export interface TamNhinThiPhanItem {
  nam: number;
  id_phan_khuc: string;
  gia_tri: number;
}

/** Định vị: bảng 3 hàng (phân khúc, khách hàng, sản phẩm) × 2 cột (hiện tại, tương lai) */
export interface DinhVi {
  phan_khuc_hien_tai?: string;
  phan_khuc_tuong_lai?: string;
  khach_hang_hien_tai?: string;
  khach_hang_tuong_lai?: string;
  san_pham_hien_tai?: string;
  san_pham_tuong_lai?: string;
}

/** Dữ liệu Sứ mệnh & Tầm nhìn cấp công ty (một bộ) */
export interface SuMenhTamNhin {
  id: string;
  su_menh: string;
  tam_nhin: string;
  /** Định vị phân khúc, khách hàng, sản phẩm (hiện tại / tương lai) */
  dinh_vi?: DinhVi;
  gia_tri: CoreValue[];
  /** Tầm nhìn quy mô: danh sách chỉ tiêu (doanh số, cửa hàng, hàng hóa...) */
  chi_tieu_quy_mo: ChiTieuQuyMo[];
  /** Giá trị từng chỉ tiêu quy mô theo năm */
  gia_tri_quy_mo_theo_nam: GiaTriQuyMoTheoNam[];
  phan_khuc_thi_phan: PhanKhucThiPhan[];
  tam_nhin_thi_phan: TamNhinThiPhanItem[];
  /** Ngày có hiệu lực / lần duyệt gần nhất */
  ngay_hieu_luc?: string;
  /** Tên người/đơn vị phê duyệt */
  nguoi_duyet?: string;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}
