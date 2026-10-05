import { describe, it, expect } from 'vitest';
import {
  coTheSuaDotPT,
  coTheXoaDotPT,
  coTheSuaChiTietPT,
  coTheChuyenTrangThaiDotPT,
  coTheSuaDongKiemKePT,
} from './quyen-sua-dot';

const HANH_DONG = [
  ['sửa đợt', coTheSuaDotPT],
  ['xoá đợt', coTheXoaDotPT],
  ['sửa chi tiết', coTheSuaChiTietPT],
] as const;

describe('quyền đụng vào đợt kiểm kê', () => {
  it.each(HANH_DONG)('%s: đợt chưa chốt thì người thường vẫn làm được', (_ten, coThe) => {
    expect(coThe('draft', false)).toBe(true);
    expect(coThe('dang_kiem_ke', false)).toBe(true);
  });

  it.each(HANH_DONG)('%s: đợt đã hoàn thành thì người thường bị chặn', (_ten, coThe) => {
    expect(coThe('hoan_thanh', false)).toBe(false);
  });

  it.each(HANH_DONG)('%s: cấp cao mở khoá được đợt đã hoàn thành', (_ten, coThe) => {
    expect(coThe('hoan_thanh', true)).toBe(true);
  });
});

describe('coTheChuyenTrangThaiDotPT — nút Chuyển trạng thái', () => {
  it('chỉ cấp cao (cấp bậc 1 / quản trị) mới được, ở mọi trạng thái', () => {
    // Không phụ thuộc trạng thái: người thường bị chặn kể cả đợt Nháp / Đang kiểm kê.
    expect(coTheChuyenTrangThaiDotPT(false)).toBe(false);
    expect(coTheChuyenTrangThaiDotPT(true)).toBe(true);
  });
});

describe('coTheSuaDongKiemKePT — sửa / xoá một dòng', () => {
  const chuaDieuChinh = { id_phieu_kho_dieu_chinh: null };
  const daDieuChinh = { id_phieu_kho_dieu_chinh: '42' };

  it('dòng chưa điều chỉnh: theo luật đợt như cũ', () => {
    expect(coTheSuaDongKiemKePT(chuaDieuChinh, 'dang_kiem_ke', false)).toBe(true);
    expect(coTheSuaDongKiemKePT(chuaDieuChinh, 'hoan_thanh', false)).toBe(false);
  });

  it('dòng đã sinh phiếu điều chỉnh: người thường bị chặn kể cả khi đợt đang kiểm kê', () => {
    expect(coTheSuaDongKiemKePT(daDieuChinh, 'dang_kiem_ke', false)).toBe(false);
  });

  it('cấp cao vẫn sửa được dòng đã điều chỉnh, kể cả đợt đã chốt', () => {
    expect(coTheSuaDongKiemKePT(daDieuChinh, 'dang_kiem_ke', true)).toBe(true);
    expect(coTheSuaDongKiemKePT(daDieuChinh, 'hoan_thanh', true)).toBe(true);
  });
});
