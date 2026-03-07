/** Trạng thái báo cáo kết quả KPI */
export type TrangThaiBaoCaoKpi = 'nhap' | 'da_gui' | 'da_danh_gia';

/** Kết quả báo cáo KPI – một lần báo cáo giá trị thực tế cho 1 tiêu chí + 1 phòng ban + 1 kỳ */
export interface KetQuaBaoCaoKpi {
  id: string;
  id_tieu_chi: string;
  id_phong_ban: string;
  ky_nam: number;
  ky_quy?: number | null;
  ky_thang?: number | null;
  gia_tri_thuc_te: number;
  diem_tinh?: number | null;
  trang_thai: TrangThaiBaoCaoKpi;
  ghi_chu?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}
