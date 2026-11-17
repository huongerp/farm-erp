import { describe, expect, it } from 'vitest';
import { docTongNhanh, tiLeLoi, tomTatLoiPhieu } from './ti-le';
import type { TieuChi } from './types';

const tc = (loai: TieuChi['loai']): TieuChi => ({ ma: 'x', ten: 'X', loai, don_vi: null, nguong_min: null, nguong_max: 4 });

describe('tiLeLoi', () => {
  it('lỗi ÷ tổng nhánh, làm tròn 1 chữ số', () => {
    expect(tiLeLoi(tc('dem_loi'), 2, 33)).toBe(6.1);
    expect(tiLeLoi(tc('dem_loi'), 1, 3)).toBe(33.3);
  });

  it('ô trống tính 0 lỗi', () => {
    expect(tiLeLoi(tc('dem_loi'), undefined, 30)).toBe(0);
    expect(tiLeLoi(tc('dem_loi'), null, 30)).toBe(0);
  });

  it('chưa có tổng nhánh → null', () => {
    expect(tiLeLoi(tc('dem_loi'), 2, null)).toBeNull();
    expect(tiLeLoi(tc('dem_loi'), 2, 0)).toBeNull();
  });

  it('tiêu chí không đếm lỗi → null', () => {
    expect(tiLeLoi(tc('do_luong'), 2, 30)).toBeNull();
    expect(tiLeLoi(tc('dat_khong'), false, 30)).toBeNull();
  });
});

describe('docTongNhanh', () => {
  it('nhận số nguyên dương', () => {
    expect(docTongNhanh(' 33 ')).toBe(33);
  });

  it('từ chối rỗng, 0, âm, thập phân', () => {
    expect(docTongNhanh('')).toBeNull();
    expect(docTongNhanh('0')).toBeNull();
    expect(docTongNhanh('-3')).toBeNull();
    expect(docTongNhanh('3,5')).toBeNull();
  });
});

describe('tomTatLoiPhieu', () => {
  const tieuChi: TieuChi[] = [
    { ma: 'dap', ten: 'Dập', loai: 'dem_loi', don_vi: null, nguong_min: null, nguong_max: 4 },
    { ma: 'seo', ten: 'Sẹo', loai: 'dem_loi', don_vi: null, nguong_min: null, nguong_max: 4 },
    { ma: 'kg', ten: 'Kg/nải', loai: 'do_luong', don_vi: 'kg', nguong_min: 1, nguong_max: 2 },
  ];

  it('cộng lỗi theo tiêu chí trên thùng đã kiểm có tổng nhánh, nhiều lỗi trước, bỏ tiêu chí 0 lỗi', () => {
    const out = tomTatLoiPhieu(tieuChi, [
      { da_kiem: true, ket_qua: { dap: 1, seo: 2, kg: 1.5 }, tong_nhanh: 30 },
      { da_kiem: true, ket_qua: { seo: 1 }, tong_nhanh: 30 },
      // chưa kiểm / thiếu tổng nhánh → không tính (khớp so_loi trên DB)
      { da_kiem: false, ket_qua: { dap: 9 }, tong_nhanh: 30 },
      { da_kiem: true, ket_qua: { dap: 9 }, tong_nhanh: null },
    ]);
    expect(out).toEqual([
      { ten: 'Sẹo', so_loi: 3 },
      { ten: 'Dập', so_loi: 1 },
    ]);
  });

  it('không có lỗi → mảng rỗng; ô không phải số tính 0', () => {
    expect(tomTatLoiPhieu(tieuChi, [{ da_kiem: true, ket_qua: { dap: null, seo: true }, tong_nhanh: 20 }])).toEqual([]);
  });
});
