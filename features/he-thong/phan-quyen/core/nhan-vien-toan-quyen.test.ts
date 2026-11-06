import { describe, expect, it } from 'vitest';
import { laNhanVienToanQuyen } from './cap-bac-toan-quyen';

describe('laNhanVienToanQuyen — cap_bac = 1 HOẶC is_super_admin', () => {
  it('cấp bậc 1 → toàn quyền', () => {
    expect(laNhanVienToanQuyen({ cap_bac: 1, is_super_admin: false })).toBe(true);
  });

  it('is_super_admin = true dù cấp bậc khác 1 hoặc trống → toàn quyền', () => {
    expect(laNhanVienToanQuyen({ cap_bac: 3, is_super_admin: true })).toBe(true);
    expect(laNhanVienToanQuyen({ cap_bac: null, is_super_admin: true })).toBe(true);
  });

  it('không cấp bậc 1, không super admin → không toàn quyền', () => {
    expect(laNhanVienToanQuyen({ cap_bac: 2, is_super_admin: false })).toBe(false);
    expect(laNhanVienToanQuyen({ cap_bac: 2 })).toBe(false);
  });

  it('chỉ true thật mới tính là super admin (chuỗi/số không được hiểu nhầm)', () => {
    expect(laNhanVienToanQuyen({ cap_bac: 2, is_super_admin: 'true' as unknown as boolean })).toBe(false);
    expect(laNhanVienToanQuyen({ cap_bac: 2, is_super_admin: 1 as unknown as boolean })).toBe(false);
  });

  it('nhân viên null/undefined → không toàn quyền', () => {
    expect(laNhanVienToanQuyen(null)).toBe(false);
    expect(laNhanVienToanQuyen(undefined)).toBe(false);
  });
});
