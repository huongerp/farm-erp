import { describe, it, expect } from 'vitest';
import {
  IMPOSSIBLE_NUM_ID,
  canAccessChiNhanh,
  filterByChiNhanhScope,
  resolveAllowedChiNhanhIds,
} from './quy-view-scope';

describe('resolveAllowedChiNhanhIds', () => {
  it('viewAll → null (không lọc chi nhánh)', () => {
    expect(resolveAllowedChiNhanhIds({ viewAll: true, allowedBranchIds: [] })).toBeNull();
    expect(resolveAllowedChiNhanhIds({ viewAll: true, allowedBranchIds: ['1'] })).toBeNull();
  });

  it('theo chi nhánh → mảng id số, loại trùng, sắp xếp', () => {
    expect(resolveAllowedChiNhanhIds({ viewAll: false, allowedBranchIds: ['3', '1', '3'] })).toEqual([1, 3]);
  });

  it('không có chi nhánh hợp lệ → fail-closed', () => {
    expect(resolveAllowedChiNhanhIds({ viewAll: false, allowedBranchIds: [] })).toEqual([IMPOSSIBLE_NUM_ID]);
    expect(resolveAllowedChiNhanhIds({ viewAll: false, allowedBranchIds: ['abc'] })).toEqual([
      IMPOSSIBLE_NUM_ID,
    ]);
  });
});

describe('canAccessChiNhanh', () => {
  it('viewAll thao tác được mọi chi nhánh', () => {
    expect(canAccessChiNhanh({ viewAll: true, allowedBranchIds: [] }, '9')).toBe(true);
  });

  it('chỉ chi nhánh được phân', () => {
    const scope = { viewAll: false, allowedBranchIds: ['1', '2'] };
    expect(canAccessChiNhanh(scope, '2')).toBe(true);
    expect(canAccessChiNhanh(scope, '3')).toBe(false);
    expect(canAccessChiNhanh(scope, null)).toBe(false);
  });
});

describe('filterByChiNhanhScope', () => {
  const rows = [
    { id: '1', id_chi_nhanh: '1' },
    { id: '2', id_chi_nhanh: '2' },
  ];

  it('viewAll giữ nguyên', () => {
    expect(filterByChiNhanhScope(rows, { viewAll: true, allowedBranchIds: [] })).toHaveLength(2);
  });

  it('lọc theo chi nhánh được phân', () => {
    const res = filterByChiNhanhScope(rows, { viewAll: false, allowedBranchIds: ['2'] });
    expect(res.map((r) => r.id)).toEqual(['2']);
  });

  it('không có chi nhánh nào → rỗng', () => {
    expect(filterByChiNhanhScope(rows, { viewAll: false, allowedBranchIds: [] })).toEqual([]);
  });
});
