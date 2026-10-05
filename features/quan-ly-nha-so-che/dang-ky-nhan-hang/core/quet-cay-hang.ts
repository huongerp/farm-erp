/**
 * Luật xếp cây hàng lên xe bằng tem QC (Giám sát chất lượng) — quét 1 tem bất kỳ của cây
 * hàng = ghi cả cây hàng. Người dùng chốt:
 * - Phiếu QC phải ĐÃ NỘP; chưa nộp / huỷ → không ghi.
 * - Kết luận KHÔNG ĐẠT → vẫn ghi, cảnh báo.
 * - Cây hàng đã có trên XE KHÁC → vẫn ghi, cảnh báo kèm số xe.
 * - Đã có trên CHÍNH xe này → không ghi thêm (báo "đã có").
 */
import type { KetLuanGscl, TrangThaiGscl } from '../../giam-sat-chat-luong/core/types';

export type LyDoLoiQuet = 'khong_phai_tem' | 'khong_tim_thay' | 'chua_nop';
export type CanhBaoQuet = 'khong_dat' | 'xe_khac';

export type DanhGiaQuet =
  | { ghi: false; muc: 'loi'; lyDo: LyDoLoiQuet }
  | { ghi: false; muc: 'da_co' }
  | { ghi: true; muc: 'ok' | 'canh_bao'; canhBao: CanhBaoQuet[] };

export interface DauVaoQuet {
  /** false = mã quét được không phải tem QC (vd tem mã cũ GS-…, QR hàng hoá). */
  laTemQc: boolean;
  phieuQc: { trang_thai: TrangThaiGscl; ket_luan: KetLuanGscl | null } | null;
  daCoTrenXeNay: boolean;
  /** Số xe / cont của các xe KHÁC đã xếp cây hàng này. */
  xeKhac: string[];
}

export function danhGiaQuetCayHang(v: DauVaoQuet): DanhGiaQuet {
  if (!v.laTemQc) return { ghi: false, muc: 'loi', lyDo: 'khong_phai_tem' };
  if (!v.phieuQc) return { ghi: false, muc: 'loi', lyDo: 'khong_tim_thay' };
  if (v.phieuQc.trang_thai !== 'da_nop') return { ghi: false, muc: 'loi', lyDo: 'chua_nop' };
  if (v.daCoTrenXeNay) return { ghi: false, muc: 'da_co' };
  const canhBao: CanhBaoQuet[] = [];
  if (v.phieuQc.ket_luan === 'khong_dat') canhBao.push('khong_dat');
  if (v.xeKhac.length > 0) canhBao.push('xe_khac');
  return { ghi: true, muc: canhBao.length ? 'canh_bao' : 'ok', canhBao };
}
