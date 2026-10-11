/**
 * Máy trạng thái phiếu giám sát chất lượng:
 *
 *   dang_kiem ──đủ N thùng──▶ hoan_thanh ──nộp──▶ da_nop ──xuất──▶ da_xuat
 *      │  ▲                      │  ▲                │  ▲              │
 *      │  └── tăng thùng mẫu ────┘  └── mở phiếu ────┘  └─ huỷ xuất ───┘ (cấp cao)
 *      └──huỷ──▶ huy ──khôi phục──▶ dang_kiem
 *
 * Trước khi nộp, người kiểm (có quyền sửa) chấm lại / sửa phiếu thoải mái. Đã nộp / đã xuất thì
 * khoá: chỉ cấp cao sửa, xoá, chấm lại, mở phiếu hoặc huỷ xuất. DB khoá y hệt (migration 018, 034).
 * `capCao` = cấp bậc 1 hoặc quyền admin/all trên module.
 */
import type { StatusBadgeSemantic } from '../../../../lib/status-badge';
import type { KetLuanGscl, TrangThaiGscl } from './types';

export const TRANG_THAI_GSCL_SEMANTIC: Record<TrangThaiGscl, StatusBadgeSemantic> = {
  dang_kiem: 'pending',
  hoan_thanh: 'info',
  da_nop: 'success',
  da_xuat: 'waiting',
  huy: 'neutral',
};

export const KET_LUAN_GSCL_SEMANTIC: Record<KetLuanGscl, StatusBadgeSemantic> = {
  dat: 'success',
  khong_dat: 'rejected',
};

/** Đã nộp hoặc đã xuất — phiếu khoá với người thường. */
function daKhoa(tt: TrangThaiGscl): boolean {
  return tt === 'da_nop' || tt === 'da_xuat';
}

/** Trạng thái sau khi lưu kết quả thùng / đổi số thùng mẫu. Phiếu huỷ và phiếu đã nộp / đã xuất giữ nguyên. */
export function trangThaiTheoSoThung(tt: TrangThaiGscl, soDaKiem: number, soThungMau: number): TrangThaiGscl {
  if (tt === 'huy' || daKhoa(tt)) return tt;
  return soThungMau > 0 && soDaKiem >= soThungMau ? 'hoan_thanh' : 'dang_kiem';
}

/** Phiếu đã đủ thùng — được ghi kết luận (cả khi đã nộp / đã xuất). */
export function coKetLuan(tt: TrangThaiGscl): boolean {
  return tt === 'hoan_thanh' || daKhoa(tt);
}

/** Quét tem / nhập kết quả thùng. */
export function coTheKiemThung(tt: TrangThaiGscl, capCao: boolean): boolean {
  if (tt === 'dang_kiem' || tt === 'hoan_thanh') return true;
  return daKhoa(tt) && capCao;
}

export function coTheSuaPhieu(tt: TrangThaiGscl, capCao: boolean): boolean {
  if (tt === 'dang_kiem' || tt === 'hoan_thanh') return true;
  return capCao;
}

/** Xoá: đã nộp / đã xuất → chỉ cấp cao; còn lại: chưa kiểm thùng nào, hoặc cấp cao. */
export function coTheXoaPhieu(tt: TrangThaiGscl, soDaKiem: number, capCao: boolean): boolean {
  if (capCao) return true;
  if (daKhoa(tt)) return false;
  return soDaKiem === 0;
}

/** Nộp: chỉ khi đã kiểm đủ thùng (hoàn thành). */
export function coTheNop(tt: TrangThaiGscl): boolean {
  return tt === 'hoan_thanh';
}

/** Mở phiếu chỉ từ đã nộp — phiếu đã xuất phải huỷ xuất trước. */
export function coTheMoPhieu(tt: TrangThaiGscl, capCao: boolean): boolean {
  return tt === 'da_nop' && capCao;
}

/** Xuất: chỉ phiếu đã nộp; ai có quyền sửa module cũng xuất được. */
export function coTheXuat(tt: TrangThaiGscl): boolean {
  return tt === 'da_nop';
}

/** Huỷ xuất (về đã nộp): chỉ cấp cao. */
export function coTheHuyXuat(tt: TrangThaiGscl, capCao: boolean): boolean {
  return tt === 'da_xuat' && capCao;
}

export function coTheHuy(tt: TrangThaiGscl): boolean {
  return tt === 'dang_kiem';
}

export function coTheKhoiPhuc(tt: TrangThaiGscl): boolean {
  return tt === 'huy';
}
