/**
 * Máy trạng thái phiếu giám sát chất lượng:
 *
 *   dang_kiem ──đủ N thùng──▶ hoan_thanh
 *      │  ▲                      │
 *      │  └── sửa / giảm thùng ──┘ (cấp cao)
 *      └──huỷ──▶ huy ──khôi phục──▶ dang_kiem
 *
 * `capCao` = cấp bậc 1 hoặc quyền admin/all trên module.
 */
import type { StatusBadgeSemantic } from '../../../../lib/status-badge';
import type { KetLuanGscl, TrangThaiGscl } from './types';

export const TRANG_THAI_GSCL_SEMANTIC: Record<TrangThaiGscl, StatusBadgeSemantic> = {
  dang_kiem: 'pending',
  hoan_thanh: 'success',
  huy: 'neutral',
};

export const KET_LUAN_GSCL_SEMANTIC: Record<KetLuanGscl, StatusBadgeSemantic> = {
  dat: 'success',
  khong_dat: 'rejected',
};

/** Trạng thái sau khi lưu kết quả một thùng. Phiếu huỷ giữ nguyên. */
export function trangThaiTheoSoThung(tt: TrangThaiGscl, soDaKiem: number, soThungMau: number): TrangThaiGscl {
  if (tt === 'huy') return 'huy';
  return soThungMau > 0 && soDaKiem >= soThungMau ? 'hoan_thanh' : 'dang_kiem';
}

/** Quét tem / nhập kết quả: phiếu đang kiểm; phiếu đã xong chỉ cấp cao sửa. */
export function coTheKiemThung(tt: TrangThaiGscl, capCao: boolean): boolean {
  if (tt === 'dang_kiem') return true;
  return tt === 'hoan_thanh' && capCao;
}

export function coTheSuaPhieu(tt: TrangThaiGscl, capCao: boolean): boolean {
  return tt === 'dang_kiem' || capCao;
}

/** Xoá: phiếu chưa kiểm thùng nào, hoặc cấp cao. */
export function coTheXoaPhieu(soDaKiem: number, capCao: boolean): boolean {
  return soDaKiem === 0 || capCao;
}

export function coTheHuy(tt: TrangThaiGscl): boolean {
  return tt === 'dang_kiem';
}

export function coTheKhoiPhuc(tt: TrangThaiGscl): boolean {
  return tt === 'huy';
}
