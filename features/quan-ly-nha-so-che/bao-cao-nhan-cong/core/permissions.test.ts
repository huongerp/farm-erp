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
  it('quyền admin hoặc all trên module → được thêm', () => {
    expect(coQuyenThemViTri({ actions: ['view', 'admin'] })).toBe(true);
    expect(coQuyenThemViTri({ actions: ['all'] })).toBe(true);
  });

  it('cap_bac = 1 (số hoặc chuỗi) → được thêm dù không có quyền module', () => {
    expect(coQuyenThemViTri({ capBac: 1, actions: [] })).toBe(true);
    expect(coQuyenThemViTri({ capBac: '1' })).toBe(true);
  });

  it('cap_bac 2 chỉ có Thêm/Sửa phiếu → không được thêm vị trí', () => {
    expect(coQuyenThemViTri({ capBac: 2, actions: ['view', 'create', 'update'], canAdmin: false })).toBe(false);
  });

  it('thiếu dữ liệu → không được (không hiểu nhầm là cấp cao)', () => {
    expect(coQuyenThemViTri(null)).toBe(false);
    expect(coQuyenThemViTri({})).toBe(false);
    expect(coQuyenThemViTri({ capBac: '', actions: null })).toBe(false);
  });
});
