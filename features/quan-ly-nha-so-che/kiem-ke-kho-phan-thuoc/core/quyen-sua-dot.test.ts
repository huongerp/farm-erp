import { describe, it, expect } from 'vitest';
import {
  coTheSuaDotPT,
  coTheXoaDotPT,
  coTheSuaChiTietPT,
  coTheChuyenTrangThaiDotPT,
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
