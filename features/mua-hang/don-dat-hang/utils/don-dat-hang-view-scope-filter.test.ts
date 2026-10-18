import { describe, it, expect } from 'vitest';
import { donDatHangTrongPhamVi, locKhoTheoPhamVi } from './don-dat-hang-view-scope-filter';
import { buildEmployeeBranchScopeForServer } from '../../../../lib/branch-scope-query';

// Kho 2 = Farm fp1 (chi nhánh 1), kho 3 = Farm fp2 (chi nhánh 2), kho 9 + 10 = NSC fp2 (chi nhánh 11)
const khoList = [
  { id: '2', id_chi_nhanh: '1' },
  { id: '3', id_chi_nhanh: '2' },
  { id: '9', id_chi_nhanh: '11' },
  { id: '10', id_chi_nhanh: '11' },
];

const scopeFarm = (branchIds: string[], nhanVienId: string | null = '50') =>
  buildEmployeeBranchScopeForServer(false, true, branchIds, nhanVienId, khoList);

describe('donDatHangTrongPhamVi', () => {
  it('xem hết (admin / cấp bậc 1) thấy mọi đơn', () => {
    const scope = buildEmployeeBranchScopeForServer(true, false, [], '50', khoList);
    expect(donDatHangTrongPhamVi({ id_kho_nhan: '3', id_nguoi_dat: '7' }, scope)).toBe(true);
  });

  it('chỉ thấy đơn có kho nhận thuộc farm mình', () => {
    const scope = scopeFarm(['1']);
    expect(donDatHangTrongPhamVi({ id_kho_nhan: '2', id_nguoi_dat: '7' }, scope)).toBe(true);
    expect(donDatHangTrongPhamVi({ id_kho_nhan: '3', id_nguoi_dat: '7' }, scope)).toBe(false);
  });

  it('một chi nhánh nhiều kho thì thấy đơn của mọi kho đó', () => {
    const scope = scopeFarm(['11']);
    expect(donDatHangTrongPhamVi({ id_kho_nhan: '9', id_nguoi_dat: '7' }, scope)).toBe(true);
    expect(donDatHangTrongPhamVi({ id_kho_nhan: '10', id_nguoi_dat: '7' }, scope)).toBe(true);
  });

  it('đơn do chính mình đặt vẫn thấy dù kho nhận ở farm khác', () => {
    expect(donDatHangTrongPhamVi({ id_kho_nhan: '3', id_nguoi_dat: '50' }, scopeFarm(['1']))).toBe(true);
  });

  it('nhân viên chưa gán chi nhánh: chỉ thấy đơn của mình (fail-closed)', () => {
    const scope = scopeFarm([]);
    expect(donDatHangTrongPhamVi({ id_kho_nhan: '2', id_nguoi_dat: '7' }, scope)).toBe(false);
    expect(donDatHangTrongPhamVi({ id_kho_nhan: '2', id_nguoi_dat: '50' }, scope)).toBe(true);
  });

  it('đơn chưa có kho nhận thì không lộ cho người khác', () => {
    expect(donDatHangTrongPhamVi({ id_kho_nhan: null, id_nguoi_dat: '7' }, scopeFarm(['1']))).toBe(false);
  });
});

describe('locKhoTheoPhamVi', () => {
  it('xem hết giữ nguyên danh sách kho', () => {
    const scope = buildEmployeeBranchScopeForServer(true, false, [], '50', khoList);
    expect(locKhoTheoPhamVi(khoList, scope)).toHaveLength(4);
  });

  it('bị giới hạn chỉ còn kho thuộc farm mình', () => {
    expect(locKhoTheoPhamVi(khoList, scopeFarm(['11'])).map((k) => k.id)).toEqual(['9', '10']);
    expect(locKhoTheoPhamVi(khoList, scopeFarm([]))).toEqual([]);
  });
});
