import { describe, it, expect } from 'vitest';
import {
  buildPhieuKhoPTPhamVi,
  phamViOrFilter,
  buildChiTietPhieuKhoPTListServerQuery,
  giaoHangHoaIds,
  hangHoaIdsTheoPhamCap,
} from './phieu-kho-pt-list-query';
import type { ChiTietPhieuKhoPTFilters } from '../store/useChiTietPhieuKhoPTStore';
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

describe('bộ lọc hạng mục của tab Chi tiết', () => {
  const pv = buildPhieuKhoPTPhamVi(scope({ viewAll: true }), khoList);
  const filters = (hangMuc: string[]): ChiTietPhieuKhoPTFilters =>
    ({
      loai: [],
      datePreset: 'all',
      customDateFrom: '',
      customDateEnd: '',
      khoIds: [],
      khoDenIds: [],
      trangThaiKeys: [],
      nguoiTaoIds: [],
      nguoiDuyetIds: [],
      hangMuc,
    }) as unknown as ChiTietPhieuKhoPTFilters;

  it('chuyển hạng mục đã chọn vào tham số server, giữ __none__ nguyên vẹn', () => {
    const q = buildChiTietPhieuKhoPTListServerQuery({
      searchTerm: '',
      filters: filters(['Vật tư', '__none__']),
      ngayFrom: '',
      ngayTo: '',
      phamVi: pv,
    });
    expect(q.hangMuc).toEqual(['Vật tư', '__none__']);
  });

  it('không chọn hạng mục → mảng rỗng', () => {
    const q = buildChiTietPhieuKhoPTListServerQuery({
      searchTerm: '',
      filters: filters([]),
      ngayFrom: '',
      ngayTo: '',
      phamVi: pv,
    });
    expect(q.hangMuc).toEqual([]);
  });

  it('danh mục cấp 2: id chuỗi → số, bỏ trùng; filter cũ chưa có trường → rỗng', () => {
    const base = { searchTerm: '', ngayFrom: '', ngayTo: '', phamVi: pv };
    const coDm = { ...filters([]), danhMucIds: ['12', '3', '12'] } as ChiTietPhieuKhoPTFilters;
    expect(buildChiTietPhieuKhoPTListServerQuery({ ...base, filters: coDm }).danhMucIds).toEqual([3, 12]);
    expect(buildChiTietPhieuKhoPTListServerQuery({ ...base, filters: filters([]) }).danhMucIds).toEqual([]);
  });
});

describe('lọc phẩm cấp (theo danh mục hàng hoá)', () => {
  const hh = [
    { id: 1, pham_cap: 'XK' },
    { id: 2, pham_cap: ' XK ' },
    { id: 3, pham_cap: 'NĐ' },
    { id: 4, pham_cap: null },
    { id: '5', pham_cap: '  ' },
  ];

  it('khớp sau khi trim; __none__ = null hoặc rỗng; id chuỗi → số', () => {
    expect(hangHoaIdsTheoPhamCap(hh, ['XK'])).toEqual([1, 2]);
    expect(hangHoaIdsTheoPhamCap(hh, ['__none__'])).toEqual([4, 5]);
    expect(hangHoaIdsTheoPhamCap(hh, ['NĐ', '__none__'])).toEqual([3, 4, 5]);
    expect(hangHoaIdsTheoPhamCap(hh, ['Loại 1'])).toEqual([]);
  });

  it('giao id theo danh mục và phẩm cấp; null = không lọc tiêu chí đó', () => {
    expect(giaoHangHoaIds(null, null)).toBeNull();
    expect(giaoHangHoaIds([1, 2], null)).toEqual([1, 2]);
    expect(giaoHangHoaIds(null, [3])).toEqual([3]);
    expect(giaoHangHoaIds([1, 2, 3], [2, 3, 9])).toEqual([2, 3]);
    expect(giaoHangHoaIds([1], [2])).toEqual([]);
  });

  it('build query chuyển phamCap; filter cũ chưa có trường → rỗng', () => {
    const pv = buildPhieuKhoPTPhamVi(scope({ viewAll: true }), khoList);
    const base = { searchTerm: '', ngayFrom: '', ngayTo: '', phamVi: pv };
    const f = { loai: [], datePreset: 'all', hangMuc: [] } as unknown as ChiTietPhieuKhoPTFilters;
    expect(buildChiTietPhieuKhoPTListServerQuery({ ...base, filters: { ...f, phamCap: ['XK', '__none__'] } }).phamCap).toEqual([
      'XK',
      '__none__',
    ]);
    expect(buildChiTietPhieuKhoPTListServerQuery({ ...base, filters: f }).phamCap).toEqual([]);
  });
});
