/**
 * Máy trạng thái phiếu đăng ký nhận hàng:
 *
 *   cho_vao ──check in──▶ da_vao ──check out──▶ da_ra
 *      │                    ▲  │                  │
 *      └──huỷ──▶ huy        └──┴── hoàn tác (cấp cao) ┘
 *
 * Hàng hoá xuất và ảnh là TUỲ CHỌN: có phiếu chỉ đăng ký xe + check in/out, nên
 * check out không bao giờ đòi có dòng hàng hay ảnh.
 * `capCao` = cấp bậc 1 hoặc quyền admin/all trên module.
 */
import type { TrangThaiDkNh } from './types';
import type { StatusBadgeSemantic } from '../../../../lib/status-badge';

export const TRANG_THAI_DKNH_SEMANTIC: Record<TrangThaiDkNh, StatusBadgeSemantic> = {
  cho_vao: 'waiting',
  da_vao: 'pending',
  da_ra: 'success',
  huy: 'neutral',
};

export function coTheCheckIn(tt: TrangThaiDkNh): boolean {
  return tt === 'cho_vao';
}

export function coTheCheckOut(tt: TrangThaiDkNh): boolean {
  return tt === 'da_vao';
}

/** Chỉ huỷ khi xe chưa vào; xe đã vào thì check out (kể cả không lấy hàng). */
export function coTheHuy(tt: TrangThaiDkNh): boolean {
  return tt === 'cho_vao';
}

export function coTheKhoiPhuc(tt: TrangThaiDkNh): boolean {
  return tt === 'huy';
}

/** Đưa về trạng thái trước (xoá giờ vào / giờ ra) — chỉ cấp cao, để sửa bấm nhầm. */
export function coTheHoanTacCheckIn(tt: TrangThaiDkNh, capCao: boolean): boolean {
  return capCao && tt === 'da_vao';
}

export function coTheHoanTacCheckOut(tt: TrangThaiDkNh, capCao: boolean): boolean {
  return capCao && tt === 'da_ra';
}

/** Thêm / xoá dòng hàng xuất: trong lúc xe ở trong farm; xe đã ra thì chỉ cấp cao. */
export function coTheSuaHangHoa(tt: TrangThaiDkNh, capCao: boolean): boolean {
  if (tt === 'da_vao') return true;
  return capCao && tt === 'da_ra';
}

/** Sửa thông tin đăng ký: phiếu đã xong (ra / huỷ) thì chỉ cấp cao. */
export function coTheSuaPhieu(tt: TrangThaiDkNh, capCao: boolean): boolean {
  if (tt === 'cho_vao' || tt === 'da_vao') return true;
  return capCao;
}

/** Xoá phiếu: chưa có giờ thực tế (chờ vào / huỷ); còn lại chỉ cấp cao. */
export function coTheXoaPhieu(tt: TrangThaiDkNh, capCao: boolean): boolean {
  if (tt === 'cho_vao' || tt === 'huy') return true;
  return capCao;
}

/** Thêm ảnh lúc nào cũng được (trừ phiếu huỷ). */
export function coTheThemAnh(tt: TrangThaiDkNh): boolean {
  return tt !== 'huy';
}
