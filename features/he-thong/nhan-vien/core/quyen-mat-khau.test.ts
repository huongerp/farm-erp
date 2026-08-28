import { describe, it, expect } from 'vitest';
import { coQuyenDatMatKhau } from './quyen-mat-khau';

describe('coQuyenDatMatKhau', () => {
  it('tự đổi mật khẩu của chính mình thì luôn được, kể cả không có quyền gì', () => {
    expect(
      coQuyenDatMatKhau({ nhanVienDangNhapId: 12, nhanVienMucTieuId: '12', capBac: 5 })
    ).toBe(true);
  });

  it('không phải chính mình và không có quyền thì bị chặn', () => {
    expect(
      coQuyenDatMatKhau({ nhanVienDangNhapId: 12, nhanVienMucTieuId: 34, capBac: 5 })
    ).toBe(false);
  });

  it('cấp bậc 1 đặt được cho người khác', () => {
    expect(
      coQuyenDatMatKhau({ nhanVienDangNhapId: 12, nhanVienMucTieuId: 34, capBac: 1 })
    ).toBe(true);
  });

  it('quyền admin/all trên module nhân viên đặt được cho người khác', () => {
    expect(
      coQuyenDatMatKhau({ nhanVienDangNhapId: 12, nhanVienMucTieuId: 34, capBac: 4, canAdmin: true })
    ).toBe(true);
  });

  it('chưa có phiên thì không rơi vào nhánh "chính mình" khi id mục tiêu cũng rỗng', () => {
    expect(coQuyenDatMatKhau({ nhanVienDangNhapId: null, nhanVienMucTieuId: null })).toBe(false);
  });

  it('cap_bac null/undefined không được hiểu là cấp 1', () => {
    expect(
      coQuyenDatMatKhau({ nhanVienDangNhapId: 12, nhanVienMucTieuId: 34, capBac: null })
    ).toBe(false);
  });
});
