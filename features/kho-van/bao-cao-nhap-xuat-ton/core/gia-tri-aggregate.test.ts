import { describe, expect, it } from 'vitest';
import { normalizeNXTGiaTri } from './gia-tri-aggregate';

describe('normalizeNXTGiaTri', () => {
  it('ép numeric dạng chuỗi thành number', () => {
    const res = normalizeNXTGiaTri({
      tong: { tien_xuat: '123.5', tien_chuyen: '0', so_dong_chua_gia: '7' },
      theoPhamCap: [{ pham_cap: 'Loại A', tien_xuat: '10', tien_chuyen: '5', so_dong: '2' }],
      theoKho: [],
      luanChuyen: [{ id_kho_di: 'a', ten_kho_di: 'A', id_kho_den: 'b', ten_kho_den: 'B', tien: '100', so_dong: '1' }],
      chuaCoGia: [{ id_hang_hoa: 'h', ma_hang: 'M', ten_hang: 'T', so_dong: '3', so_luong: '4.5' }],
    });

    expect(res.tong.tien_xuat).toBe(123.5);
    expect(res.tong.tien_chuyen).toBe(0);
    expect(res.tong.so_dong_chua_gia).toBe(7);
    expect(res.theoPhamCap[0].tien_xuat).toBe(10);
    expect(res.theoPhamCap[0].tien_chuyen).toBe(5);
    expect(res.theoPhamCap[0].so_dong).toBe(2);
    expect(res.luanChuyen[0].tien).toBe(100);
    expect(res.chuaCoGia[0].so_luong).toBe(4.5);
  });

  it('pham_cap null/trống → chuaPhanLoai = true và pham_cap = null', () => {
    const res = normalizeNXTGiaTri({
      tong: { tien_xuat: 0, tien_chuyen: 0, so_dong_chua_gia: 0 },
      theoPhamCap: [
        { pham_cap: null, tien_xuat: '1', tien_chuyen: '0', so_dong: '1' },
        { pham_cap: '  ', tien_xuat: '2', tien_chuyen: '0', so_dong: '1' },
        { pham_cap: 'Loại B', tien_xuat: '3', tien_chuyen: '0', so_dong: '1' },
      ],
      theoKho: [],
      luanChuyen: [],
      chuaCoGia: [],
    });

    expect(res.theoPhamCap).toHaveLength(3);
    const chua = res.theoPhamCap.filter((r) => r.chuaPhanLoai);
    expect(chua).toHaveLength(2);
    expect(chua.every((r) => r.pham_cap === null)).toBe(true);
    const da = res.theoPhamCap.find((r) => !r.chuaPhanLoai);
    expect(da?.pham_cap).toBe('Loại B');
  });

  it('tổng tiền = 0 → mọi tyLe = 0', () => {
    const res = normalizeNXTGiaTri({
      tong: { tien_xuat: 0, tien_chuyen: 0, so_dong_chua_gia: 0 },
      theoPhamCap: [
        { pham_cap: 'A', tien_xuat: '0', tien_chuyen: '0', so_dong: '1' },
        { pham_cap: 'B', tien_xuat: '0', tien_chuyen: '0', so_dong: '1' },
      ],
      theoKho: [],
      luanChuyen: [],
      chuaCoGia: [],
    });

    expect(res.theoPhamCap.every((r) => r.tyLe === 0)).toBe(true);
  });

  it('chenh_lech = tien_nhan_ve − tien_chuyen_di', () => {
    const res = normalizeNXTGiaTri({
      tong: { tien_xuat: 0, tien_chuyen: 0, so_dong_chua_gia: 0 },
      theoPhamCap: [],
      theoKho: [{ id_kho: 'k', ten_kho: 'Kho', ten_chi_nhanh: 'CN', tien_xuat: '1', tien_chuyen_di: '30', tien_nhan_ve: '50' }],
      luanChuyen: [],
      chuaCoGia: [],
    });

    expect(res.theoKho[0].chenh_lech).toBe(20);
  });

  it('sort theoKho theo tên (localeCompare vi) và theoPhamCap giảm dần theo tổng tiền', () => {
    const res = normalizeNXTGiaTri({
      tong: { tien_xuat: 0, tien_chuyen: 0, so_dong_chua_gia: 0 },
      theoPhamCap: [
        { pham_cap: 'Thấp', tien_xuat: '1', tien_chuyen: '1', so_dong: '1' },
        { pham_cap: 'Cao', tien_xuat: '9', tien_chuyen: '1', so_dong: '1' },
        { pham_cap: 'Giữa', tien_xuat: '4', tien_chuyen: '1', so_dong: '1' },
      ],
      theoKho: [
        { id_kho: '1', ten_kho: 'Zeta', ten_chi_nhanh: '', tien_xuat: '0', tien_chuyen_di: '0', tien_nhan_ve: '0' },
        { id_kho: '2', ten_kho: 'alpha', ten_chi_nhanh: '', tien_xuat: '0', tien_chuyen_di: '0', tien_nhan_ve: '0' },
        { id_kho: '3', ten_kho: 'Beta', ten_chi_nhanh: '', tien_xuat: '0', tien_chuyen_di: '0', tien_nhan_ve: '0' },
      ],
      luanChuyen: [],
      chuaCoGia: [],
    });

    expect(res.theoPhamCap.map((r) => r.pham_cap)).toEqual(['Cao', 'Giữa', 'Thấp']);
    expect(res.theoKho.map((r) => r.ten_kho)).toEqual(['alpha', 'Beta', 'Zeta']);
  });

  it('raw null / không phải object → cấu trúc rỗng an toàn', () => {
    const fromNull = normalizeNXTGiaTri(null);
    const fromString = normalizeNXTGiaTri('abc');

    expect(fromNull).toEqual(fromString);
    expect(fromNull.tong).toEqual({ tien_xuat: 0, tien_chuyen: 0, so_dong_chua_gia: 0 });
    expect(fromNull.theoPhamCap).toEqual([]);
    expect(fromNull.theoKho).toEqual([]);
    expect(fromNull.luanChuyen).toEqual([]);
    expect(fromNull.chuaCoGia).toEqual([]);
  });
});
