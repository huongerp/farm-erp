import { describe, expect, it } from 'vitest';
import { coTheCaiDat, coTheNhapLuoi, coTheSuaPhieu, coTheXoaPhieu, type DgdvQuyenModule } from './permissions';

const KHONG: DgdvQuyenModule = { canCreate: false, canUpdate: false, canDelete: false, canAdmin: false };
const mo = { trang_thai: 'mo' as const, id_nguoi_tao: '7' };
const khoa = { trang_thai: 'khoa' as const, id_nguoi_tao: '7' };

describe('quyền phiếu Đánh giá đầu vào', () => {
  it('sửa phiếu: cần update + chưa khoá; quản trị sửa được cả phiếu khoá', () => {
    expect(coTheSuaPhieu(mo, { ...KHONG, canUpdate: true })).toBe(true);
    expect(coTheSuaPhieu(khoa, { ...KHONG, canUpdate: true })).toBe(false);
    expect(coTheSuaPhieu(khoa, { ...KHONG, canAdmin: true })).toBe(true);
    expect(coTheSuaPhieu(mo, { ...KHONG, canCreate: true })).toBe(false);
  });

  it('xoá phiếu: chỉ người tạo (có delete, chưa khoá) hoặc quản trị', () => {
    const q = { ...KHONG, canDelete: true };
    expect(coTheXoaPhieu(mo, q, '7')).toBe(true);
    expect(coTheXoaPhieu(mo, q, '8')).toBe(false);
    expect(coTheXoaPhieu(mo, q, null)).toBe(false);
    expect(coTheXoaPhieu(khoa, q, '7')).toBe(false);
    expect(coTheXoaPhieu(khoa, { ...KHONG, canAdmin: true }, null)).toBe(true);
  });

  it('nhập lưới: phiếu khoá thì kể cả quản trị cũng chỉ xem', () => {
    expect(coTheNhapLuoi(mo, { ...KHONG, canCreate: true })).toBe(true);
    expect(coTheNhapLuoi(mo, { ...KHONG, canUpdate: true })).toBe(true);
    expect(coTheNhapLuoi(mo, KHONG)).toBe(false);
    expect(coTheNhapLuoi(khoa, { ...KHONG, canAdmin: true })).toBe(false);
  });

  it('cài đặt: cấp cao hoặc quản trị module', () => {
    expect(coTheCaiDat({ canAdmin: false }, false)).toBe(false);
    expect(coTheCaiDat({ canAdmin: false }, true)).toBe(true);
    expect(coTheCaiDat({ canAdmin: true }, false)).toBe(true);
  });
});
