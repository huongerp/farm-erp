/**
 * Mã mẫu phản hồi (Mẫu phản hồi – Thiết lập tuyển dụng) cho thư từ chối và thư mời nhận việc.
 */
export const TEMPLATE_MA_TU_CHOI = 'TU_CHOI';
export const TEMPLATE_MA_MOI_NHAN_VIEC = 'MOI_NHAN_VIEC';

/** Loại thư dùng trong URL preview: tu-choi | moi-nhan-viec */
export type LoaiThuSlug = 'tu-choi' | 'moi-nhan-viec';

const LOAI_THU_TO_MA: Record<LoaiThuSlug, string> = {
  'tu-choi': TEMPLATE_MA_TU_CHOI,
  'moi-nhan-viec': TEMPLATE_MA_MOI_NHAN_VIEC,
};

const MA_TO_LOAI_THU: Record<string, LoaiThuSlug> = {
  [TEMPLATE_MA_TU_CHOI]: 'tu-choi',
  [TEMPLATE_MA_MOI_NHAN_VIEC]: 'moi-nhan-viec',
};

export function getMaFromLoaiThu(loaiThu: string): string | undefined {
  return LOAI_THU_TO_MA[loaiThu as LoaiThuSlug];
}

export function getLoaiThuFromMa(ma: string): LoaiThuSlug | undefined {
  return MA_TO_LOAI_THU[ma];
}

export function isValidLoaiThu(loaiThu: string): loaiThu is LoaiThuSlug {
  return loaiThu === 'tu-choi' || loaiThu === 'moi-nhan-viec';
}

export function getLoaiThuLabel(loaiThu: LoaiThuSlug, t: (key: string) => string): string {
  return loaiThu === 'tu-choi' ? t('thuGuiUngVien.letterReject') : t('thuGuiUngVien.letterJobOffer');
}

/** CSS class badge loại phiếu: từ chối (rose), mời nhận việc (emerald) */
export function getLoaiThuBadgeClass(loaiThu: LoaiThuSlug): string {
  return loaiThu === 'tu-choi'
    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
}
