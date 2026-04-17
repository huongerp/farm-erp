/** Trạng thái hợp đồng (text DB + app) */
export const TRANG_THAI_HOP_DONG = ['Đang thực hiện', 'Đã thanh lý'] as const;
export type TrangThaiHopDong = (typeof TRANG_THAI_HOP_DONG)[number];
