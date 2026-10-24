/** Trạng thái hợp đồng (text DB + app) */
export const TRANG_THAI_HOP_DONG = ['Đang thực hiện', 'Đã thanh lý'] as const;
export type TrangThaiHopDong = (typeof TRANG_THAI_HOP_DONG)[number];

/** Loại đợt thanh toán (cột loai_dot, migration 051) */
export const LOAI_DOT = { COC: 'coc', THANH_TOAN: 'thanh_toan' } as const;
export const LOAI_DOT_VALUES = [LOAI_DOT.COC, LOAI_DOT.THANH_TOAN] as const;
export type LoaiDot = (typeof LOAI_DOT_VALUES)[number];
