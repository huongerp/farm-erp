/**
 * Kiểu danh sách/hiển thị của module bảo dưỡng thiết bị — join client giữa việc,
 * thiết bị, tài sản và nhật ký (số dòng ít nên không cần embed ở DB).
 */
import type { NhatKyBaoDuong, ThietBi, ViecBaoDuong } from './types';

/** Dòng tab "Lịch bảo dưỡng": một việc đang dùng + thông tin thiết bị. */
export interface LichBaoDuongRow extends ViecBaoDuong {
  thiet_bi_ten: string;
  thiet_bi_ma_ts: string | null;
  thiet_bi_khu_vuc: string | null;
}

/** Thiết bị kèm nhãn tài sản liên kết (ma_tai_san — ten_tai_san). */
export interface ThietBiRow extends ThietBi {
  tai_san_ma: string | null;
  tai_san_ten: string | null;
}

/** Nhật ký kèm tên việc + tên người thực hiện (hiện ở lịch sử trong drawer). */
export interface NhatKyRow extends NhatKyBaoDuong {
  viec_noi_dung: string;
  nguoi_thuc_hien_ten: string | null;
}
