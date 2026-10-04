/**
 * Phân loại lỗi khi chạy lịch:
 * - `LoiVinhVien`: chạy lại cũng hỏng (mất quyền file, người tạo nghỉ việc, cột không còn) →
 *   tắt lịch ngay và báo người tạo.
 * - Còn lại coi là tạm thời (mạng, Google 5xx, quota) → thử lại lùi dần, quá 10 lần mới tắt.
 */
export class LoiVinhVien extends Error {}
