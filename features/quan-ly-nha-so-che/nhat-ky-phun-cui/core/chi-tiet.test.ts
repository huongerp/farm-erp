import { describe, expect, it } from 'vitest';
import { dongChiTietTuDb, type DbLanChiTiet } from './chi-tiet';

const nk = { ngay: '2026-11-02', id_chi_nhanh: 7, cn: { ten_chi_nhanh: 'NSC 1' }, nv: { ho_va_ten: 'An' } };
const base = {
  id: 5,
  id_nhat_ky: 9,
  thu_tu: 1,
  gio: null,
  id_hang_hoa: 3,
  nong_do: null,
  don_vi: null,
  luong_nuoc_lit: null,
  luong_thuoc: null,
  ghi_chu: null,
  nk,
} satisfies DbLanChiTiet;

describe('dongChiTietTuDb', () => {
  it('numeric dạng chuỗi → số, giờ HH:mm, nhúng phiếu cha và thuốc', () => {
    const r = dongChiTietTuDb({
      ...base,
      thu_tu: '2',
      gio: '09:30:00',
      nong_do: '1.5000',
      don_vi: 'g/lít',
      luong_nuoc_lit: '200.000',
      luong_thuoc: '300.000',
      hh: { ma_hang_hoa: 'T01', ten_hang_hoa: 'Thuốc A' },
    });
    expect(r).toMatchObject({
      id: '5',
      id_nhat_ky: '9',
      ngay: '2026-11-02',
      id_chi_nhanh: '7',
      ten_chi_nhanh: 'NSC 1',
      ten_nhan_vien_phu_trach: 'An',
      thu_tu: 2,
      gio: '09:30',
      id_hang_hoa: '3',
      ma_hang_hoa: 'T01',
      ten_hang_hoa: 'Thuốc A',
      nong_do: 1.5,
      don_vi: 'g/lít',
      luong_nuoc_lit: 200,
      luong_thuoc: 300,
    });
  });

  it('ô trống / null → null, không thành 0', () => {
    const r = dongChiTietTuDb({ ...base, nong_do: '', luong_nuoc_lit: ' ', luong_thuoc: null });
    expect(r.nong_do).toBeNull();
    expect(r.luong_nuoc_lit).toBeNull();
    expect(r.luong_thuoc).toBeNull();
    expect(r.gio).toBeNull();
  });

  it('đơn vị lạ hoặc thiếu → đơn vị mặc định', () => {
    expect(dongChiTietTuDb({ ...base, don_vi: 'kg/lít' }).don_vi).toBe('ml/lít');
    expect(dongChiTietTuDb({ ...base, don_vi: null }).don_vi).toBe('ml/lít');
  });

  it('thiếu phiếu cha / thuốc → chuỗi rỗng hoặc null', () => {
    const r = dongChiTietTuDb({ ...base, nk: null, id_hang_hoa: null });
    expect(r).toMatchObject({
      ngay: '',
      id_chi_nhanh: '',
      ten_chi_nhanh: null,
      ten_nhan_vien_phu_trach: null,
      id_hang_hoa: null,
      ten_hang_hoa: null,
    });
  });
});
