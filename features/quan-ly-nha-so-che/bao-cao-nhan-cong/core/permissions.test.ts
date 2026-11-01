import { describe, it, expect } from 'vitest';
import { canMutateBaoCaoNhanCong } from './permissions';
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
