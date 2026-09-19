import { describe, it, expect } from 'vitest';
import {
  buildDotKiemKePTListServerQuery,
  khoChoPhepTheoPhamVi,
  KKPT_SORT_MAC_DINH,
  type BuildKKPTQueryParams,
} from './kiem-ke-pt-list-query';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';

const khoList = [
  { id: '1', ma_kho: 'K1', ten_kho: 'Kho A', id_chi_nhanh: '10' },
  { id: '2', ma_kho: 'K2', ten_kho: 'Kho B', id_chi_nhanh: '20' },
  { id: '3', ma_kho: 'K3', ten_kho: 'Kho C', id_chi_nhanh: null },
] as unknown as Kho[];

const baseParams: BuildKKPTQueryParams = {
  searchTerm: '',
  filters: { trang_thai: [], id_nguoi_phu_trach: [], id_kho: [], dateFrom: '', dateTo: '' },
  pagination: { page: 1, pageSize: 25 },
  sort: { column: null, direction: null },
  viewScope: { viewAll: false, viewByBranch: true, allowedBranchIds: ['10'], currentEmployeeId: '5' },
  khoList,
};

describe('khoChoPhepTheoPhamVi', () => {
  it('map chi nhánh được phép → danh sách kho', () => {
    expect(khoChoPhepTheoPhamVi(baseParams.viewScope, khoList)).toEqual(['1']);
  });

  it('xem toàn phạm vi → rỗng (service bỏ qua điều kiện kho)', () => {
    expect(
      khoChoPhepTheoPhamVi(
        { viewAll: true, viewByBranch: true, allowedBranchIds: ['10'], currentEmployeeId: '5' },
        khoList
      )
    ).toEqual([]);
  });

  it('không viewByBranch → rỗng: chỉ thấy đợt của mình, KHÔNG phải thấy tất cả', () => {
    expect(
      khoChoPhepTheoPhamVi(
        { viewAll: false, viewByBranch: false, allowedBranchIds: ['10'], currentEmployeeId: '5' },
        khoList
      )
    ).toEqual([]);
  });

  it('chi nhánh được phép rỗng → không kho nào', () => {
    expect(
      khoChoPhepTheoPhamVi(
        { viewAll: false, viewByBranch: true, allowedBranchIds: [], currentEmployeeId: '5' },
        khoList
      )
    ).toEqual([]);
  });
});

describe('buildDotKiemKePTListServerQuery', () => {
  it('page về 0-based và không âm', () => {
    expect(buildDotKiemKePTListServerQuery(baseParams).page).toBe(0);
    expect(
      buildDotKiemKePTListServerQuery({ ...baseParams, pagination: { page: 3, pageSize: 25 } }).page
    ).toBe(2);
    expect(
      buildDotKiemKePTListServerQuery({ ...baseParams, pagination: { page: 0, pageSize: 25 } }).page
    ).toBe(0);
  });

  it('sort ngoài whitelist rơi về mặc định', () => {
    const q = buildDotKiemKePTListServerQuery({
      ...baseParams,
      sort: { column: 'so_lech', direction: 'asc' },
    });
    expect(q.sortColumn).toBe(KKPT_SORT_MAC_DINH.column);
    expect(q.sortDirection).toBe('desc');
  });

  it('sort trong whitelist được giữ nguyên', () => {
    const q = buildDotKiemKePTListServerQuery({
      ...baseParams,
      sort: { column: 'ma_dot', direction: 'asc' },
    });
    expect(q.sortColumn).toBe('ma_dot');
    expect(q.sortDirection).toBe('asc');
  });

  it('mang theo phạm vi xem và bộ lọc kỳ', () => {
    const q = buildDotKiemKePTListServerQuery({
      ...baseParams,
      filters: { ...baseParams.filters, dateFrom: '2026-09-01', dateTo: '2026-09-30' },
    });
    expect(q.viewAll).toBe(false);
    expect(q.allowedKhoIds).toEqual(['1']);
    expect(q.currentEmployeeId).toBe('5');
    expect(q.ngayFrom).toBe('2026-09-01');
    expect(q.ngayTo).toBe('2026-09-30');
  });

  it('cắt khoảng trắng của từ khoá tìm kiếm', () => {
    expect(buildDotKiemKePTListServerQuery({ ...baseParams, searchTerm: '  KKPT-2026  ' }).searchTerm).toBe(
      'KKPT-2026'
    );
  });
});
