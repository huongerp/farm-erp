import { describe, expect, it } from 'vitest';
import type { DiemCongTruRecord } from './types';
import { coTheDoiKhoa, coTheSua, coTheXoa, laBanGhiKhoa } from './quyen-khoa';

const quyen = (over: Partial<{ canAdmin: boolean; canUpdate: boolean; canDelete: boolean }> = {}) => ({
  canAdmin: false,
  canUpdate: false,
  canDelete: false,
  ...over,
});

const banGhi = (trang_thai: 'mo' | 'khoa') =>
  ({ id: '1', trang_thai } as Pick<DiemCongTruRecord, 'id' | 'trang_thai'>);

describe('quyền khoá Điểm cộng trừ', () => {
  it('nhận diện bản ghi đang khoá', () => {
    expect(laBanGhiKhoa(banGhi('khoa'))).toBe(true);
    expect(laBanGhiKhoa(banGhi('mo'))).toBe(false);
  });

  it('chỉ quản trị module hoặc cấp bậc 1 được khoá/mở khoá', () => {
    expect(coTheDoiKhoa(quyen({ canUpdate: true }), false)).toBe(false);
    expect(coTheDoiKhoa(quyen({ canAdmin: true }), false)).toBe(true);
    expect(coTheDoiKhoa(quyen(), true)).toBe(true);
  });

  it('bản ghi đã khoá: người thường không được sửa dù có quyền cập nhật', () => {
    expect(coTheSua(banGhi('khoa'), quyen({ canUpdate: true }), false)).toBe(false);
  });

  it('bản ghi đã khoá: quản trị hoặc cấp bậc 1 vẫn sửa được', () => {
    expect(coTheSua(banGhi('khoa'), quyen({ canAdmin: true }), false)).toBe(true);
    expect(coTheSua(banGhi('khoa'), quyen(), true)).toBe(true);
  });

  it('bản ghi đang mở: sửa/xoá theo quyền module', () => {
    expect(coTheSua(banGhi('mo'), quyen({ canUpdate: true }), false)).toBe(true);
    expect(coTheSua(banGhi('mo'), quyen(), false)).toBe(false);
    expect(coTheXoa(banGhi('mo'), quyen({ canDelete: true }), false)).toBe(true);
    expect(coTheXoa(banGhi('mo'), quyen(), false)).toBe(false);
  });

  it('bản ghi đã khoá: người thường không được xoá', () => {
    expect(coTheXoa(banGhi('khoa'), quyen({ canDelete: true }), false)).toBe(false);
    expect(coTheXoa(banGhi('khoa'), quyen({ canAdmin: true }), false)).toBe(true);
    expect(coTheXoa(banGhi('khoa'), quyen(), true)).toBe(true);
  });
});
