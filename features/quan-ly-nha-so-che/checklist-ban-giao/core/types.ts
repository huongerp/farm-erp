/**
 * Phiếu checklist công đoạn — DB: fp_farm_cl_phieu, fp_farm_cl_phieu_dong, fp_farm_cl_phieu_lich_su
 * (migration 073). Đổi trạng thái CHỈ qua RPC rpc_cl_chuyen / rpc_cl_nhan / rpc_cl_tra_lai /
 * rpc_cl_huy / rpc_cl_mo_lai — trigger DB chặn `.update({ trang_thai })`.
 */

import type { LoaiMauCl, TanSuatVeSinh } from '../../checklist-mau/core/types';
import type { KqNgay } from '../../checklist-mau/core/ve-sinh-tuan';

export const TRANG_THAI_CL = ['nhap', 'cho_kiem_tra', 'tra_lai', 'hoan_thanh', 'huy'] as const;
export type TrangThaiCl = (typeof TRANG_THAI_CL)[number];

/** Kết quả một ô tích: Đạt / Không đạt / chưa tích (null). */
export const KET_QUA_CL = ['dat', 'khong_dat'] as const;
export type KetQuaCl = (typeof KET_QUA_CL)[number];

/** Kết luận tình trạng vận hành (mẫu có `co_ket_luan_van_hanh`). */
export const KET_LUAN_VAN_HANH = ['du_dieu_kien', 'co_dieu_kien', 'tam_dung'] as const;
export type KetLuanVanHanh = (typeof KET_LUAN_VAN_HANH)[number];

export const HANH_DONG_CL = ['tao', 'chuyen', 'nhan', 'tra_lai', 'mo_lai', 'huy'] as const;
export type HanhDongCl = (typeof HANH_DONG_CL)[number];

export interface PhieuChecklist {
  id: string;
  so_phieu: string;
  id_mau: string;
  /** Ảnh chụp từ mẫu lúc tạo phiếu */
  ten_mau: string;
  ma_mau: string | null;
  ten_ben_thuc_hien: string;
  ten_ben_kiem_tra: string;
  chuc_vu_thuc_hien_ids: string[];
  chuc_vu_kiem_tra_ids: string[];
  co_ket_luan_van_hanh: boolean;
  /** Ảnh chụp loai của mẫu. ve_sinh_tuan: `ngay` = thứ Hai đầu tuần (migration 080). */
  loai: LoaiMauCl;
  /** YYYY-MM-DD */
  ngay: string;
  ca: string | null;
  khu_vuc: string | null;
  day_chuyen: string | null;
  id_chi_nhanh: string | null;
  ghi_chu: string | null;
  trang_thai: TrangThaiCl;
  so_lan_tra_lai: number;
  ly_do_tra_lai: string | null;
  id_nguoi_chuyen: string | null;
  tg_chuyen: string | null;
  /** Người khâu sau bấm Nhận — chịu trách nhiệm toàn bộ phiếu */
  id_nguoi_nhan: string | null;
  tg_nhan: string | null;
  ket_luan: KetLuanVanHanh | null;
  y_kien: string | null;
  id_nguoi_tao: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface DongPhieuChecklist {
  id: string;
  id_phieu: string;
  id_hang_muc: string | null;
  ten_muc: string | null;
  thu_tu_muc: number;
  stt: number;
  doi_tuong: string;
  tieu_chuan: string | null;
  phuong_phap: string | null;
  quan_trong: boolean;
  ma_ts: string | null;
  so_luong: string | null;
  tan_suat_bao_duong: string | null;
  /** Cột khâu làm */
  kq_thuc_hien: KetQuaCl | null;
  tinh_trang_khac_phuc: string | null;
  nguoi_xu_ly: string | null;
  ghi_chu: string | null;
  /** Cột khâu kiểm tra lại (xoá trắng mỗi lần khâu trước Chuyển lại) */
  kq_kiem_tra: KetQuaCl | null;
  ghi_chu_kiem_tra: string | null;
  /** Khâu làm / khâu kiểm tra từng tích Không đạt (trigger DB bật, không tắt — migration 076) */
  qlx_tung_khong_dat: boolean;
  gs_tung_khong_dat: boolean;
  /** Phiếu vệ sinh tuần (080): tần suất chụp từ mẫu */
  tan_suat: TanSuatVeSinh | null;
  /** Phiếu vệ sinh tuần: các thứ có lịch (2..8). null = phiếu bàn giao thường */
  ngay_lich: number[] | null;
  /** Phiếu vệ sinh tuần: kết quả từng ngày — kq_thuc_hien do trigger DB tính từ đây */
  kq_ngay: KqNgay;
}

export interface LichSuPhieuChecklist {
  id: string;
  id_phieu: string;
  hanh_dong: HanhDongCl;
  tu_trang_thai: TrangThaiCl | null;
  den_trang_thai: TrangThaiCl | null;
  ly_do: string | null;
  id_nguoi: string | null;
  ten_nguoi: string | null;
  tg: string;
}
