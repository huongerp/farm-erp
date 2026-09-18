import { describe, it, expect } from 'vitest';
import { buildThuChiQuyListServerQuery } from './thu-chi-quy-list-query';
import { IMPOSSIBLE_NUM_ID } from '../utils/quy-view-scope';
import type { ThuChiQuyFilters } from '../store/useThuChiQuyStore';

const emptyFilters: ThuChiQuyFilters = {
  loai: [],
  hangMucIds: [],
  nguonChungTu: [],
  nguoiTaoIds: [],
  datePreset: 'all',
  customDateFrom: '',
  customDateEnd: '',
};

const call = (over: Partial<Parameters<typeof buildThuChiQuyListServerQuery>[0]> = {}) =>
  buildThuChiQuyListServerQuery({
    searchTerm: '',
    filters: emptyFilters,
    ngayFrom: '',
    ngayTo: '',
    chiNhanhDangXem: [],
    viewScope: { viewAll: false, allowedBranchIds: ['1', '2'] },
    ...over,
  });

describe('buildThuChiQuyListServerQuery', () => {
  it('viewAll + không chọn chi nhánh → không lọc chi nhánh', () => {
    const q = call({ viewScope: { viewAll: true, allowedBranchIds: [] } });
    expect(q.chiNhanhIds).toBeNull();
  });

  it('theo phạm vi: chỉ các chi nhánh được phân', () => {
    expect(call().chiNhanhIds).toEqual([1, 2]);
  });

  it('chọn một farm trong phạm vi → lọc đúng farm đó', () => {
    expect(call({ chiNhanhDangXem: ['2'] }).chiNhanhIds).toEqual([2]);
  });

  it('chọn nhiều farm trong phạm vi → lọc đúng các farm đó', () => {
    expect(call({ viewScope: { viewAll: false, allowedBranchIds: ['1', '2', '3'] }, chiNhanhDangXem: ['3', '1'] }).chiNhanhIds).toEqual([1, 3]);
  });

  it('chọn farm NGOÀI phạm vi → chỉ giữ farm hợp lệ, không rò dữ liệu', () => {
    expect(call({ chiNhanhDangXem: ['9'] }).chiNhanhIds).toEqual([1, 2]);
    expect(call({ chiNhanhDangXem: ['2', '9'] }).chiNhanhIds).toEqual([2]);
  });

  it('viewAll chọn farm bất kỳ → lọc đúng farm đó', () => {
    const q = call({ viewScope: { viewAll: true, allowedBranchIds: [] }, chiNhanhDangXem: ['7'] });
    expect(q.chiNhanhIds).toEqual([7]);
  });

  it('không được phân chi nhánh nào → fail-closed', () => {
    const q = call({ viewScope: { viewAll: false, allowedBranchIds: [] } });
    expect(q.chiNhanhIds).toEqual([IMPOSSIBLE_NUM_ID]);
  });

  it('lọc theo người lập phiếu (chip "Của tôi")', () => {
    const q = call({ filters: { ...emptyFilters, nguoiTaoIds: ['7', '3', '7'] } });
    expect(q.nguoiTaoIds).toEqual([3, 7]);
  });

  it('chuẩn hóa filter: loại, hạng mục, nguồn chứng từ, search', () => {
    const q = call({
      searchTerm: '  mũi khoan  ',
      filters: {
        ...emptyFilters,
        loai: ['chi', 'thu', 'chi', 'xxx' as never],
        hangMucIds: ['5', '2', '5', 'abc'],
        nguonChungTu: ['don_dat_hang', 'sai' as never],
      },
      ngayFrom: '2026-07-01',
      ngayTo: '2026-07-31',
    });
    expect(q.searchTerm).toBe('mũi khoan');
    expect(q.loai).toEqual(['chi', 'thu']);
    expect(q.hangMucIds).toEqual([2, 5]);
    expect(q.nguonChungTu).toEqual(['don_dat_hang']);
    expect(q.nguoiTaoIds).toEqual([]);
    expect(q.ngayFrom).toBe('2026-07-01');
    expect(q.ngayTo).toBe('2026-07-31');
  });
});
