import { describe, expect, it } from 'vitest';
import type { DangKyNhanHangCt } from './types';
import {
  coTheTaoPhieuXuat,
  khoaBoiPhieuXuat,
  khoCuaChiNhanh,
  soLechPhieuXuat,
  tinhTrangPhieuXuat,
  type PhieuXuatCuaXe,
} from './phieu-xuat';

const cay = (id_hang_hoa: string | null, so_luong: number, ten = `TP ${id_hang_hoa}`): DangKyNhanHangCt =>
  ({ id_hang_hoa, ten_hang_hoa: id_hang_hoa ? ten : null, ma_hang_hoa: null, so_luong }) as DangKyNhanHangCt;

const phieu = (p: Partial<PhieuXuatCuaXe> = {}): PhieuXuatCuaXe => ({
  id: '1',
  so_phieu: 'FXK-0001',
  ngay: '2026-10-13',
  trang_thai: 'Chờ duyệt',
  kho_id: '8',
  ten_kho: 'NSC fp1',
  trang_thai_sua: null,
  id_nguoi_xin_sua: null,
  dong: [
    { id_hang_hoa: '1', ten_hang_hoa: 'TP 1', so_luong: 120 },
    { id_hang_hoa: '2', ten_hang_hoa: 'TP 2', so_luong: 50 },
  ],
  ...p,
});

describe('soLechPhieuXuat — so tổng thùng theo thành phẩm', () => {
  it('nhiều cây cùng thành phẩm gộp lại → khớp phiếu', () => {
    expect(soLechPhieuXuat([cay('1', 60), cay('1', 60), cay('2', 50)], phieu().dong)).toEqual([]);
  });

  it('quét thêm cây, sửa số thùng, bỏ cây → liệt kê đúng chênh lệch', () => {
    const lech = soLechPhieuXuat([cay('1', 60), cay('1', 60), cay('1', 60), cay('3', 40)], phieu().dong);
    expect(lech).toEqual([
      { id_hang_hoa: '1', ten_hang_hoa: 'TP 1', so_luong_phieu: 120, so_luong_xe: 180 },
      { id_hang_hoa: '2', ten_hang_hoa: 'TP 2', so_luong_phieu: 50, so_luong_xe: 0 },
      { id_hang_hoa: '3', ten_hang_hoa: 'TP 3', so_luong_phieu: 0, so_luong_xe: 40 },
    ]);
  });

  it('quét rồi bỏ đúng cây đó → tổng như cũ → khớp', () => {
    expect(soLechPhieuXuat([cay('1', 120), cay('2', 50)], phieu().dong)).toEqual([]);
  });

  it('cây chưa chọn thành phẩm luôn tính là lệch', () => {
    expect(soLechPhieuXuat([cay('1', 120), cay('2', 50), cay(null, 10)], phieu().dong)).toHaveLength(1);
  });
});

describe('tinhTrangPhieuXuat — cùng luật cột DB', () => {
  it('chưa có cây, chưa có phiếu → null; có cây → chưa tạo', () => {
    expect(tinhTrangPhieuXuat([], null)).toBeNull();
    expect(tinhTrangPhieuXuat([cay('1', 60)], null)).toBe('chua_tao');
  });

  it('khớp → đã tạo / đã duyệt theo trạng thái phiếu; lệch → cần cập nhật', () => {
    const ds = [cay('1', 120), cay('2', 50)];
    expect(tinhTrangPhieuXuat(ds, phieu())).toBe('da_tao');
    expect(tinhTrangPhieuXuat(ds, phieu({ trang_thai: 'Đã duyệt' }))).toBe('da_duyet');
    expect(tinhTrangPhieuXuat([cay('1', 120)], phieu({ trang_thai: 'Đã duyệt' }))).toBe('can_cap_nhat');
  });
});

describe('khoaBoiPhieuXuat', () => {
  it('phiếu chờ duyệt / chưa có phiếu → không khoá', () => {
    expect(khoaBoiPhieuXuat(null, false, '5')).toBe(false);
    expect(khoaBoiPhieuXuat(phieu(), false, '5')).toBe(false);
  });

  it('phiếu đã duyệt → khoá người thường, cấp cao và người được cấp xin sửa vẫn sửa', () => {
    const duyet = phieu({ trang_thai: 'Đã duyệt' });
    expect(khoaBoiPhieuXuat(duyet, false, '5')).toBe(true);
    expect(khoaBoiPhieuXuat(duyet, true, '5')).toBe(false);
    expect(khoaBoiPhieuXuat({ ...duyet, trang_thai_sua: 'da_cap', id_nguoi_xin_sua: '5' }, false, '5')).toBe(false);
    expect(khoaBoiPhieuXuat({ ...duyet, trang_thai_sua: 'da_cap', id_nguoi_xin_sua: '7' }, false, '5')).toBe(true);
    expect(khoaBoiPhieuXuat({ ...duyet, trang_thai_sua: 'cho_cap', id_nguoi_xin_sua: '5' }, false, '5')).toBe(true);
  });
});

it('khoCuaChiNhanh — chỉ kho thuộc chi nhánh của xe', () => {
  const ds = [
    { id: '8', ten_kho: 'NSC fp1', id_chi_nhanh: '10' },
    { id: '9', ten_kho: 'NSC fp2A', id_chi_nhanh: '11' },
    { id: '10', ten_kho: 'NSC fp2B', id_chi_nhanh: '11' },
  ];
  expect(khoCuaChiNhanh(ds, '11').map((k) => k.id)).toEqual(['9', '10']);
  expect(khoCuaChiNhanh(ds, '99')).toEqual([]);
});

it('coTheTaoPhieuXuat — xe đã vào / đã ra, có cây, phiếu không bị khoá', () => {
  expect(coTheTaoPhieuXuat('da_vao', 2, false)).toBe(true);
  expect(coTheTaoPhieuXuat('da_ra', 2, false)).toBe(true);
  expect(coTheTaoPhieuXuat('cho_vao', 2, false)).toBe(false);
  expect(coTheTaoPhieuXuat('huy', 2, false)).toBe(false);
  expect(coTheTaoPhieuXuat('da_ra', 0, false)).toBe(false);
  expect(coTheTaoPhieuXuat('da_ra', 2, true)).toBe(false);
});
