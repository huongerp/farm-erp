import { describe, it, expect } from 'vitest';
import { buildTaiSanChiNhanhMap, filterPhieuChiPhi } from './filter-phieu-chi-phi';
import type { BaoTriSuaChuaFilters } from '../store/useBaoTriSuaChuaStore';
import type { PhieuBaoTriSuaChua } from '../core/types';

const emptyFilters: BaoTriSuaChuaFilters = {
  hang_muc: [],
  dateFrom: '',
  dateTo: '',
  id_tai_san: [],
  id_chi_nhanh: [],
  trang_thai: [],
  id_nguoi_tao: [],
};

const phieu = (over: Partial<PhieuBaoTriSuaChua>): PhieuBaoTriSuaChua => ({
  id: over.id ?? '1',
  ma_phieu: 'CPTS-0001',
  ngay: '2026-03-10',
  id_tai_san: 'TS1',
  id_hang_muc: 'HM1',
  mo_ta: '',
  so_tien: 0,
  trang_thai: 'cho_duyet',
  id_nguoi_tao: 'NV1',
  tg_tao: '',
  tg_cap_nhat: '',
  ...over,
});

const assets = [
  { id: 'TS1', id_chi_nhanh: '1' },
  { id: 'TS2', id_chi_nhanh: '2' },
  { id: 'TS3', id_chi_nhanh: null },
];
const branchMap = buildTaiSanChiNhanhMap(assets);

describe('filterPhieuChiPhi', () => {
  const list = [
    phieu({ id: '1', id_tai_san: 'TS1', trang_thai: 'cho_duyet', id_nguoi_tao: 'NV1' }),
    phieu({ id: '2', id_tai_san: 'TS2', trang_thai: 'da_duyet', id_nguoi_tao: 'NV2' }),
    phieu({ id: '3', id_tai_san: 'TS3', trang_thai: 'da_duyet', id_nguoi_tao: 'NV1' }),
  ];

  it('không filter thì trả về đủ danh sách', () => {
    expect(filterPhieuChiPhi(list, emptyFilters, branchMap)).toHaveLength(3);
  });

  it('lọc theo chi nhánh lấy từ tài sản của phiếu', () => {
    const got = filterPhieuChiPhi(list, { ...emptyFilters, id_chi_nhanh: ['1'] }, branchMap);
    expect(got.map((p) => p.id)).toEqual(['1']);
  });

  it('phiếu của tài sản chưa gán chi nhánh bị loại khi lọc chi nhánh', () => {
    const got = filterPhieuChiPhi(list, { ...emptyFilters, id_chi_nhanh: ['1', '2'] }, branchMap);
    expect(got.map((p) => p.id)).toEqual(['1', '2']);
  });

  it('lọc theo trạng thái phiếu', () => {
    const got = filterPhieuChiPhi(list, { ...emptyFilters, trang_thai: ['da_duyet'] }, branchMap);
    expect(got.map((p) => p.id)).toEqual(['2', '3']);
  });

  it('lọc theo người tạo', () => {
    const got = filterPhieuChiPhi(list, { ...emptyFilters, id_nguoi_tao: ['NV1'] }, branchMap);
    expect(got.map((p) => p.id)).toEqual(['1', '3']);
  });

  it('nhiều filter kết hợp theo AND', () => {
    const got = filterPhieuChiPhi(
      list,
      { ...emptyFilters, trang_thai: ['da_duyet'], id_nguoi_tao: ['NV1'] },
      branchMap
    );
    expect(got.map((p) => p.id)).toEqual(['3']);
  });

  it('lọc theo khoảng ngày', () => {
    const byDate = [
      phieu({ id: 'a', ngay: '2026-01-05' }),
      phieu({ id: 'b', ngay: '2026-02-15' }),
      phieu({ id: 'c', ngay: '2026-03-01' }),
    ];
    const got = filterPhieuChiPhi(
      byDate,
      { ...emptyFilters, dateFrom: '2026-02-01', dateTo: '2026-02-28' },
      branchMap
    );
    expect(got.map((p) => p.id)).toEqual(['b']);
  });
});
