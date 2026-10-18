import type { TrangThaiDotKiemKe, KetQuaKiemKe } from './types';

/** Hiển thị trạng thái đợt (giá trị lưu DB là tiếng Việt, hiển thị luôn) */
export function getTrangThaiDotLabel(status: TrangThaiDotKiemKe): string {
  return status;
}

/** Hiển thị kết quả kiểm kê (giá trị lưu DB là tiếng Việt, hiển thị luôn) */
export function getKetQuaLabel(ketQua: KetQuaKiemKe): string {
  return ketQua;
}

export const TRANG_THAI_DOT_OPTIONS: { value: TrangThaiDotKiemKe; label: string }[] = [
  { value: 'Nháp', label: 'Nháp' },
  { value: 'Đang kiểm kê', label: 'Đang kiểm kê' },
  { value: 'Hoàn thành', label: 'Hoàn thành' },
];

export const KET_QUA_OPTIONS: { value: KetQuaKiemKe; label: string }[] = [
  { value: 'Chưa kiểm', label: 'Chưa kiểm' },
  { value: 'Khớp', label: 'Khớp' },
  { value: 'Chênh nơi lưu', label: 'Chênh nơi lưu' },
  { value: 'Chênh người giữ', label: 'Chênh người giữ' },
  { value: 'Chênh trạng thái', label: 'Chênh trạng thái' },
  { value: 'Thiếu', label: 'Thiếu' },
];

/** Mã trạng thái tài sản (fp_ts_trang_thai_tai_san.ma) KHÔNG đưa vào danh sách kiểm kê */
export const MA_TRANG_THAI_KHONG_KIEM_KE = ['THANH_LY', 'MAT_HONG'] as const;

/** Id các trạng thái tài sản bị loại khỏi "Tạo danh sách" kiểm kê, tra theo mã (không phân biệt hoa thường) */
export function idTrangThaiKhongKiemKe(statuses: { id: string; ma: string }[]): Set<string> {
  const maLoaiTru = new Set<string>(MA_TRANG_THAI_KHONG_KIEM_KE);
  return new Set(statuses.filter((s) => maLoaiTru.has(s.ma.trim().toUpperCase())).map((s) => s.id));
}
