/**
 * Máy trạng thái phiếu giám sát chất lượng:
 *
 *   dang_kiem ──đủ N thùng──▶ hoan_thanh ──nộp──▶ da_nop
 *      │  ▲                      │  ▲                │
 *      │  └── tăng thùng mẫu ────┘  └── mở phiếu ────┘ (cấp cao)
 *      └──huỷ──▶ huy ──khôi phục──▶ dang_kiem
 *
 * Trước khi nộp, người kiểm (có quyền sửa) chấm lại / sửa phiếu thoải mái. Đã nộp thì khoá:
 * chỉ cấp cao sửa, xoá, chấm lại hoặc mở phiếu. DB khoá y hệt (migration 018).
 * `capCao` = cấp bậc 1 hoặc quyền admin/all trên module.
 */
import type { StatusBadgeSemantic } from '../../../../lib/status-badge';
import type { KetLuanGscl, TrangThaiGscl } from './types';

export const TRANG_THAI_GSCL_SEMANTIC: Record<TrangThaiGscl, StatusBadgeSemantic> = {
  dang_kiem: 'pending',
  hoan_thanh: 'info',
  da_nop: 'success',
  huy: 'neutral',
};

export const KET_LUAN_GSCL_SEMANTIC: Record<KetLuanGscl, StatusBadgeSemantic> = {
  dat: 'success',
  khong_dat: 'rejected',
};

/** Trạng thái sau khi lưu kết quả thùng / đổi số thùng mẫu. Phiếu huỷ và phiếu đã nộp giữ nguyên. */
export function trangThaiTheoSoThung(tt: TrangThaiGscl, soDaKiem: number, soThungMau: number): TrangThaiGscl {
  if (tt === 'huy' || tt === 'da_nop') return tt;
  return soThungMau > 0 && soDaKiem >= soThungMau ? 'hoan_thanh' : 'dang_kiem';
}

/** Phiếu đã đủ thùng — được ghi kết luận (cả khi đã nộp). */
export function coKetLuan(tt: TrangThaiGscl): boolean {
  return tt === 'hoan_thanh' || tt === 'da_nop';
}

/** Quét tem / nhập kết quả thùng. */
export function coTheKiemThung(tt: TrangThaiGscl, capCao: boolean): boolean {
  if (tt === 'dang_kiem' || tt === 'hoan_thanh') return true;
  return tt === 'da_nop' && capCao;
}

export function coTheSuaPhieu(tt: TrangThaiGscl, capCao: boolean): boolean {
  if (tt === 'dang_kiem' || tt === 'hoan_thanh') return true;
  return capCao;
}

/** Xoá: đã nộp → chỉ cấp cao; còn lại: chưa kiểm thùng nào, hoặc cấp cao. */
export function coTheXoaPhieu(tt: TrangThaiGscl, soDaKiem: number, capCao: boolean): boolean {
  if (capCao) return true;
  if (tt === 'da_nop') return false;
  return soDaKiem === 0;
}

/** Nộp: chỉ khi đã kiểm đủ thùng (hoàn thành). */
export function coTheNop(tt: TrangThaiGscl): boolean {
  return tt === 'hoan_thanh';
}

export function coTheMoPhieu(tt: TrangThaiGscl, capCao: boolean): boolean {
  return tt === 'da_nop' && capCao;
}

export function coTheHuy(tt: TrangThaiGscl): boolean {
  return tt === 'dang_kiem';
}

export function coTheKhoiPhuc(tt: TrangThaiGscl): boolean {
  return tt === 'huy';
}
