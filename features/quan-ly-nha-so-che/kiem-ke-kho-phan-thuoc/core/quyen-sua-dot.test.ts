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
  ['chuyển trạng thái', coTheChuyenTrangThaiDotPT],
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

  it('chuyển trạng thái xét trạng thái HIỆN TẠI, không xét đích đến', () => {
    // Người thường không được đưa đợt đã chốt về Đang kiểm kê để lách chốt sổ.
    expect(coTheChuyenTrangThaiDotPT('hoan_thanh', false)).toBe(false);
    // Nhưng vẫn được chốt sổ một đợt đang kiểm kê.
    expect(coTheChuyenTrangThaiDotPT('dang_kiem_ke', false)).toBe(true);
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
