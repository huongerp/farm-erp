import { describe, it, expect } from 'vitest';
import { buildPhieuKhoPTPhamVi, phamViOrFilter } from './phieu-kho-pt-list-query';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';

const khoList = [
  { id: '1', ma_kho: 'K1', ten_kho: 'Kho fp1', id_chi_nhanh: '10' },
  { id: '2', ma_kho: 'K2', ten_kho: 'Kho fp5', id_chi_nhanh: '20' },
  { id: '3', ma_kho: 'K3', ten_kho: 'Kho fp1 phụ', id_chi_nhanh: '10' },
] as unknown as Kho[];

const scope = (over: Partial<Parameters<typeof buildPhieuKhoPTPhamVi>[0]> = {}) => ({
  viewAll: false,
  viewByBranch: true,
  allowedBranchIds: ['10'],
  currentEmployeeId: '7',
  ...over,
});

describe('phạm vi xem phiếu kho phân thuốc', () => {
  it('cấp cao → không thêm điều kiện', () => {
    const pv = buildPhieuKhoPTPhamVi(scope({ viewAll: true }), khoList);
    expect(phamViOrFilter(pv, 'nguoi_tao_id')).toBeNull();
  });

  it('chỉ kho thuộc chi nhánh của mình, xét cả kho đi lẫn kho đến, cộng phiếu mình lập', () => {
    const pv = buildPhieuKhoPTPhamVi(scope(), khoList);
    expect(pv.allowedKhoIds).toEqual([1, 3]);
    expect(phamViOrFilter(pv, 'nguoi_tao_id')).toBe('kho_id.in.(1,3),kho_den_id.in.(1,3),nguoi_tao_id.eq.7');
  });

  it('bảng phẳng dùng cột người tạo của phiếu', () => {
    const pv = buildPhieuKhoPTPhamVi(scope(), khoList);
    expect(phamViOrFilter(pv, 'phieu_nguoi_tao_id')).toContain('phieu_nguoi_tao_id.eq.7');
  });

  it('không được phân chi nhánh → chỉ còn phiếu mình lập', () => {
    const pv = buildPhieuKhoPTPhamVi(scope({ allowedBranchIds: [] }), khoList);
    expect(phamViOrFilter(pv, 'nguoi_tao_id')).toBe('nguoi_tao_id.eq.7');
  });

  it('không chi nhánh, không người dùng → rỗng = không thấy gì, KHÔNG phải thấy tất cả', () => {
    const pv = buildPhieuKhoPTPhamVi(scope({ allowedBranchIds: [], currentEmployeeId: null }), khoList);
    expect(phamViOrFilter(pv, 'nguoi_tao_id')).toBe('');
  });
});
