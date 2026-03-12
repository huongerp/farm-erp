/** Trạng thái phiếu kiểm kê – text trong DB (không dùng CHECK). */
export const TRANG_THAI_KIEM_KE = ['Nháp', 'Đang kiểm', 'Chờ duyệt', 'Hoàn thành', 'Đã duyệt', 'Không duyệt'] as const;
export type TrangThaiPhieuKiemKe = (typeof TRANG_THAI_KIEM_KE)[number];

export const DEFAULT_TRANG_THAI: TrangThaiPhieuKiemKe = 'Nháp';

/** Trạng thái cho flow duyệt (như đề xuất vật tư) */
export const TRANG_THAI_CHO_DUYET = 'Chờ duyệt';
export const TRANG_THAI_DA_DUYET = 'Đã duyệt';
export const TRANG_THAI_KHONG_DUYET = 'Không duyệt';
