/** Loại chỉ số: xuôi = càng cao càng tốt, ngược = càng thấp càng tốt */
export type KpiLoaiChiSo = 'xuoi' | 'nguoc';

/** Giao KPI theo chức vụ: mỗi chức vụ có danh sách chỉ số KPI với tỷ trọng */
export interface KpiTheoChucVu {
  id: string;
  id_chuc_vu: string;
  id_chi_so: string; // KpiIndicator.id từ Chức năng nhiệm vụ
  ty_trong: number; // % (0-100), tổng theo chức vụ nên = 100
  thu_tu: number;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Loại chỉ số (xuôi/ngược) – mặc định khi chấm */
  loai?: KpiLoaiChiSo;
  /** Mục tiêu số (ví dụ 95 cho %, 2 cho số lỗi tối đa) – mặc định khi chấm */
  muc_tieu?: number;
  /** Populated */
  ten_chi_so?: string;
  don_vi?: string;
  chi_tieu_nguong?: string;
}

/** Chi tiết chấm điểm từng KPI (một dòng trong bảng con) */
export interface ChamDiemKpiChiTietItem {
  id: string;
  id_cham_diem_kpi: string;
  id_chi_so: string;
  ty_trong: number;
  /** Loại: xuôi (cao tốt) / ngược (thấp tốt) */
  loai?: KpiLoaiChiSo;
  /** Mục tiêu (số) */
  muc_tieu?: number;
  /** Thực đạt (số) */
  thuc_dat?: number;
  /** Tỷ lệ % (tính từ mục tiêu & thực đạt theo loại) */
  ty_le?: number;
  diem: number; // điểm đạt 0-100 (tính từ ty_le hoặc nhập tay)
  thu_tu: number;
  /** Populated */
  ten_chi_so?: string;
  don_vi?: string;
  chi_tieu_nguong?: string;
}

/** Đánh giá: Đạt (>= 85) / Không đạt */
export type DanhGiaKpi = 'dat' | 'khong_dat';

/** Bản ghi chấm điểm KPI theo nhân viên + kỳ (tháng) */
export interface ChamDiemKpiRecord {
  id: string;
  id_nhan_vien: string;
  ten_nhan_vien?: string;
  ma_nhan_vien?: string;
  id_chuc_vu?: string;
  ten_chuc_vu?: string;
  id_phong_ban?: string;
  ten_phong_ban?: string;
  nam: number;
  thang: number;
  /** Tổng điểm KPI (theo tỷ trọng các chỉ số) */
  diem_kpi: number;
  /** Điểm cộng trừ ròng (từ module Điểm cộng trừ: + cộng, - trừ) */
  diem_cong_tru_net: number;
  /** Tổng KPI = diem_kpi + diem_cong_tru_net */
  tong_kpi: number;
  /** Đạt nếu tong_kpi >= 85 */
  danh_gia: DanhGiaKpi;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Chi tiết từng KPI (populated) */
  chi_tiet?: ChamDiemKpiChiTietItem[];
  /** Bảng con điểm cộng trừ (populated từ module Điểm cộng trừ) */
  diem_cong_tru_list?: DiemCongTruLienKet[];
}

/** Một dòng điểm cộng/trừ liên kết từ module Điểm cộng trừ */
export interface DiemCongTruLienKet {
  id: string;
  loai: 'cong' | 'tru';
  ten_hang_muc?: string;
  ma_hang_muc?: string;
  diem: number;
  mo_ta?: string;
}
