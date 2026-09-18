import { describe, it, expect } from 'vitest';
import { filterDeXuatMuaHangListByViewScope } from './de-xuat-view-scope-filter';
import type { DeXuatMuaHang } from '../core/types';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';

function phieu(id: string, idNoiDeXuat: string, idNguoiDeXuat: string): DeXuatMuaHang {
  return {
    id,
    so_phieu: `FDX-000${id}`,
    ngay: '2026-09-01',
    ngay_can: '2026-09-08',
    id_noi_de_xuat: idNoiDeXuat,
    id_nguoi_de_xuat: idNguoiDeXuat,
    trang_thai: 'Chờ duyệt',
    tg_tao: '2026-09-01T00:00:00Z',
    tg_cap_nhat: '2026-09-01T00:00:00Z',
  };
}

function kho(id: string, idChiNhanh: string | null): Kho {
  return {
    id,
    ma_kho: `K${id}`,
    ten_kho: `Kho ${id}`,
    id_chi_nhanh: idChiNhanh,
    trang_thai: 'Đang hoạt động',
    thu_tu: 0,
  } as Kho;
}

/** kho 1 → chi nhánh A, kho 2 → chi nhánh B, kho 3 → chưa gán chi nhánh */
const khoList = [kho('1', 'A'), kho('2', 'B'), kho('3', null)];

/** nv 10 đề xuất ở kho 2 (chi nhánh B), nv 99 đề xuất ở kho 1 và kho 3 */
const list = [
  phieu('1', '1', '99'),
  phieu('2', '2', '10'),
  phieu('3', '3', '99'),
];

describe('filterDeXuatMuaHangListByViewScope', () => {
  it('cấp cao (viewAll) → thấy toàn bộ phiếu', () => {
    const out = filterDeXuatMuaHangListByViewScope(list, khoList, {
      viewAll: true,
      viewByBranch: false,
      allowedBranchIds: [],
      currentEmployeeId: '10',
    });
    expect(out).toHaveLength(3);
  });

  it('không có phạm vi chi nhánh → chỉ thấy phiếu do chính mình đề xuất', () => {
    const out = filterDeXuatMuaHangListByViewScope(list, khoList, {
      viewAll: false,
      viewByBranch: false,
      allowedBranchIds: [],
      currentEmployeeId: '10',
    });
    expect(out.map((p) => p.id)).toEqual(['2']);
  });

  it('không có phạm vi chi nhánh và không xác định được nhân viên → không thấy phiếu nào', () => {
    const out = filterDeXuatMuaHangListByViewScope(list, khoList, {
      viewAll: false,
      viewByBranch: false,
      allowedBranchIds: [],
      currentEmployeeId: null,
    });
    expect(out).toEqual([]);
  });

  it('theo chi nhánh: thấy phiếu của kho thuộc chi nhánh mình + phiếu tự đề xuất', () => {
    const out = filterDeXuatMuaHangListByViewScope(list, khoList, {
      viewAll: false,
      viewByBranch: true,
      allowedBranchIds: ['A'],
      currentEmployeeId: '10',
    });
    // phiếu 1 (kho chi nhánh A) + phiếu 2 (tự đề xuất, kho chi nhánh B)
    expect(out.map((p) => p.id).sort()).toEqual(['1', '2']);
  });

  it('kho chưa gán chi nhánh → không lọt vào phạm vi chi nhánh', () => {
    const out = filterDeXuatMuaHangListByViewScope(list, khoList, {
      viewAll: false,
      viewByBranch: true,
      allowedBranchIds: ['A', 'B'],
      currentEmployeeId: '10',
    });
    expect(out.map((p) => p.id).sort()).toEqual(['1', '2']);
  });

  it('theo chi nhánh nhưng danh sách chi nhánh rỗng → chỉ còn phiếu tự đề xuất', () => {
    const out = filterDeXuatMuaHangListByViewScope(list, khoList, {
      viewAll: false,
      viewByBranch: true,
      allowedBranchIds: [],
      currentEmployeeId: '99',
    });
    expect(out.map((p) => p.id).sort()).toEqual(['1', '3']);
  });
});
