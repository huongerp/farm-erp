import { describe, it, expect } from 'vitest';
import { coQuyenXem, tinhCoQuyen } from './quyen-module';

describe('tinhCoQuyen', () => {
  it('admin hoặc all bao mọi quyền (khớp fn_co_quyen_module ở DB)', () => {
    for (const a of ['admin', 'all'] as const) {
      expect(tinhCoQuyen([a])).toEqual({
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canApprove: true,
        canAdmin: true,
      });
    }
  });

  it('chỉ view thì không được ghi', () => {
    expect(tinhCoQuyen(['view'])).toEqual({
      canView: true,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canApprove: false,
      canAdmin: false,
    });
  });

  it('update không kéo theo delete hay admin', () => {
    const q = tinhCoQuyen(['view', 'create', 'update']);
    expect(q.canUpdate).toBe(true);
    expect(q.canDelete).toBe(false);
    expect(q.canAdmin).toBe(false);
  });

  it('không có action nào → không có quyền gì', () => {
    expect(Object.values(tinhCoQuyen([])).some(Boolean)).toBe(false);
  });
});

describe('coQuyenXem', () => {
  it('thấy module khi có view, admin hoặc all', () => {
    expect(coQuyenXem(['view'])).toBe(true);
    expect(coQuyenXem(['admin'])).toBe(true);
    expect(coQuyenXem(['all'])).toBe(true);
  });

  it('có create/update mà thiếu view thì không thấy trên menu', () => {
    expect(coQuyenXem(['create', 'update'])).toBe(false);
  });
});
