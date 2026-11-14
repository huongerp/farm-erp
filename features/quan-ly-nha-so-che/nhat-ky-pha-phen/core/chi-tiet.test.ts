import { describe, expect, it } from 'vitest';
import { dongChiTietTuDb, type DbLanChiTiet } from './chi-tiet';

const nk = { ngay: '2026-11-02', id_chi_nhanh: 7, cn: { ten_chi_nhanh: 'NSC 1' }, nv: { ho_va_ten: 'An' } };

describe('dongChiTietTuDb', () => {
  it('numeric dạng chuỗi → số, giờ HH:mm, chênh lệch làm tròn 3 số lẻ', () => {
    const r = dongChiTietTuDb({ id: 5, id_nhat_ky: 9, lan: '2', gio: '09:00:00', so_kg: '1.1', dinh_muc_kg: '0.3', nk });
    expect(r).toMatchObject({
      id: '5',
      id_nhat_ky: '9',
      ngay: '2026-11-02',
      id_chi_nhanh: '7',
      ten_chi_nhanh: 'NSC 1',
      ten_nhan_vien_phu_trach: 'An',
      lan: 2,
      gio: '09:00',
      so_kg: 1.1,
      dinh_muc_kg: 0.3,
      chenh_lech: 0.8,
    });
  });

  it('ô trống / null → null, không thành 0; chênh lệch null khi thiếu một vế', () => {
    const r = dongChiTietTuDb({ id: 1, id_nhat_ky: 1, lan: 1, gio: null, so_kg: '', dinh_muc_kg: 4, nk });
    expect(r.so_kg).toBeNull();
    expect(r.gio).toBeNull();
    expect(r.chenh_lech).toBeNull();
    expect(dongChiTietTuDb({ id: 1, id_nhat_ky: 1, lan: 1, gio: null, so_kg: 4, dinh_muc_kg: null, nk }).chenh_lech).toBeNull();
  });

  it('chênh lệch âm khi pha thiếu định mức', () => {
    expect(dongChiTietTuDb({ id: 1, id_nhat_ky: 1, lan: 1, gio: null, so_kg: 3, dinh_muc_kg: '11.8', nk }).chenh_lech).toBe(-8.8);
  });

  it('thiếu phiếu cha / chi nhánh / nhân sự → chuỗi rỗng hoặc null', () => {
    const r = dongChiTietTuDb({ id: 1, id_nhat_ky: 1, lan: 1, gio: null, so_kg: 0, dinh_muc_kg: 0, nk: null } as DbLanChiTiet);
    expect(r).toMatchObject({ ngay: '', id_chi_nhanh: '', ten_chi_nhanh: null, ten_nhan_vien_phu_trach: null, chenh_lech: 0 });
  });
});
