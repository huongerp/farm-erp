import { describe, it, expect } from 'vitest';
import { deXuatMuaHangToPhieuKhoPTPrefill, mapDeXuatChiTietToPhieuKhoPTLines } from './phieu-kho-pt-to-form-values';
import type { DeXuatMuaHang } from '../../de-xuat-mua-hang/core/types';

const phieu: DeXuatMuaHang = {
  id: '7',
  so_phieu: 'FDX-0007',
  ngay: '2026-09-01',
  ngay_can: '2026-09-08',
  id_noi_de_xuat: '3',
  id_nguoi_de_xuat: '10',
  trang_thai: 'Đã duyệt',
  ghi_chu: 'Mua bù phân bón vụ mới',
  tg_tao: '2026-09-01T00:00:00Z',
  tg_cap_nhat: '2026-09-02T00:00:00Z',
  chi_tiet: [
    { id: '1', id_de_xuat_mua_hang: '7', id_hang_hoa: '11', so_luong: 5, ghi_chu: 'gấp' },
    { id: '2', id_de_xuat_mua_hang: '7', id_hang_hoa: '12', so_luong: 2.5 },
  ],
};

describe('mapDeXuatChiTietToPhieuKhoPTLines', () => {
  it('giữ nguyên hàng hóa + số lượng, đơn giá để 0 cho người lập điền', () => {
    const lines = mapDeXuatChiTietToPhieuKhoPTLines(phieu.chi_tiet);
    expect(lines).toEqual([
      { id_hang_hoa: '11', so_luong: 5, don_gia: 0, so_lot: '', ghi_chu: 'gấp' },
      { id_hang_hoa: '12', so_luong: 2.5, don_gia: 0, so_lot: '', ghi_chu: '' },
    ]);
  });

  it('bỏ dòng số lượng <= 0 và dòng thiếu hàng hóa (DB có CHECK so_luong > 0)', () => {
    const lines = mapDeXuatChiTietToPhieuKhoPTLines([
      { id: '1', id_de_xuat_mua_hang: '7', id_hang_hoa: '11', so_luong: 0 },
      { id: '2', id_de_xuat_mua_hang: '7', id_hang_hoa: '12', so_luong: -3 },
      { id: '3', id_de_xuat_mua_hang: '7', id_hang_hoa: '  ', so_luong: 4 },
      { id: '4', id_de_xuat_mua_hang: '7', id_hang_hoa: '13', so_luong: 1 },
    ]);
    expect(lines.map((l) => l.id_hang_hoa)).toEqual(['13']);
  });

  it('phiếu không có dòng chi tiết → mảng rỗng', () => {
    expect(mapDeXuatChiTietToPhieuKhoPTLines(undefined)).toEqual([]);
  });
});

describe('deXuatMuaHangToPhieuKhoPTPrefill', () => {
  it('sinh phiếu kho NHẬP vào đúng kho nơi đề xuất, trạng thái Chờ duyệt', () => {
    const prefill = deXuatMuaHangToPhieuKhoPTPrefill(phieu);
    expect(prefill.loai).toBe('nhập');
    expect(prefill.kho_id).toBe('3');
    expect(prefill.kho_den_id).toBeNull();
    expect(prefill.trang_thai).toBe('Chờ duyệt');
    expect(prefill.ngay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('lưu liên kết về phiếu đề xuất để chặn tạo trùng', () => {
    const prefill = deXuatMuaHangToPhieuKhoPTPrefill(phieu);
    expect(prefill.id_de_xuat_mua_hang).toBe('7');
    expect(prefill.so_phieu_de_xuat).toBe('FDX-0007');
  });

  it('mô tả ghi kèm số phiếu đề xuất và ghi chú gốc', () => {
    expect(deXuatMuaHangToPhieuKhoPTPrefill(phieu).mo_ta).toBe(
      'Theo đề xuất FDX-0007 — Mua bù phân bón vụ mới'
    );
  });

  it('đề xuất không có ghi chú → mô tả chỉ có số phiếu', () => {
    expect(deXuatMuaHangToPhieuKhoPTPrefill({ ...phieu, ghi_chu: '   ' }).mo_ta).toBe(
      'Theo đề xuất FDX-0007'
    );
  });

  it('số dòng chi tiết khớp phiếu đề xuất', () => {
    expect(deXuatMuaHangToPhieuKhoPTPrefill(phieu).chi_tiet).toHaveLength(2);
  });
});
