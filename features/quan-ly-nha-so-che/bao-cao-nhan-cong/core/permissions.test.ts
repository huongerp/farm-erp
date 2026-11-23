import { describe, it, expect } from 'vitest';
import { canMutateBaoCaoNhanCong, coQuyenThemViTri } from './permissions';
import type { FarmBaoCaoNhanCong } from './types';

const phieu = (trang_thai: 'mo' | 'khoa') =>
  ({ trang_thai, id_nguoi_tao: '999' }) as FarmBaoCaoNhanCong;

describe('canMutateBaoCaoNhanCong', () => {
  it('có quyền Sửa/Xóa → được sửa/xóa phiếu chưa khóa do người khác tạo', () => {
    expect(canMutateBaoCaoNhanCong(phieu('mo'), true, false)).toBe(true);
  });

  it('có quyền Sửa/Xóa nhưng phiếu đã khóa → không được', () => {
    expect(canMutateBaoCaoNhanCong(phieu('khoa'), true, false)).toBe(false);
  });

  it('không có quyền và không quản trị → không được', () => {
    expect(canMutateBaoCaoNhanCong(phieu('mo'), false, false)).toBe(false);
  });

  it('quản trị → được cả phiếu đã khóa', () => {
    expect(canMutateBaoCaoNhanCong(phieu('khoa'), false, true)).toBe(true);
  });
});

describe('coQuyenThemViTri', () => {
  it('super admin (is_super_admin = true) → được thêm', () => {
    expect(coQuyenThemViTri({ isSuperAdmin: true })).toBe(true);
  });

  it('không phải super admin → không được (quyền admin/all module hay cap_bac 1 không còn tác dụng)', () => {
    expect(coQuyenThemViTri({ isSuperAdmin: false })).toBe(false);
    expect(coQuyenThemViTri({})).toBe(false);
  });

  it('thiếu dữ liệu → không được', () => {
    expect(coQuyenThemViTri(null)).toBe(false);
    expect(coQuyenThemViTri(undefined)).toBe(false);
  });
});
