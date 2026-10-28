import { describe, expect, it } from 'vitest';
import { apDutDayVaoPhieu, apOVaoPhieu, apVaoDuLieuCache, laORong, soNguyenKhongAm } from './cap-nhat-luoi';
import { tongPhieuNgay } from '../core/bang-tinh';
import type { DgdvPhieuDayDu, FarmDgdvDong } from '../core/types';

const NGAY = '2026-10-21';
const dong = (id: string, so_luong: number, stt_dong = 1): FarmDgdvDong => ({
  id,
  id_phieu_lo: 'l1',
  id_cot: 'c1',
  ngay: NGAY,
  stt_dong,
  so_luong,
  danh_gia: null,
  so_luong_loi: 0,
  ly_do_loi: null,
});

const phieu: DgdvPhieuDayDu = {
  id: 'p1',
  nam: 2026,
  tuan: 43,
  id_chi_nhanh: '1',
  ghi_chu: null,
  trang_thai: 'mo',
  id_nguoi_tao: null,
  tg_tao: '',
  tg_cap_nhat: '',
  cot: [],
  lo: [
    { id: 'l1', id_phieu: 'p1', id_lo: 'x', to_truong: null, ghi_chu: null, stt: 1, ten_lo: 'A', lo_ngay: [], dong: [dong('d1', 10)] },
  ],
};
const khoa = { id_phieu_lo: 'l1', id_cot: 'c1', ngay: NGAY, stt_dong: 1 };

describe('cập nhật lưới sau khi tự lưu', () => {
  it('ô trống hết mới coi là rỗng', () => {
    expect(laORong({ so_luong: 0, danh_gia: ' ', so_luong_loi: 0, ly_do_loi: null })).toBe(true);
    expect(laORong({ so_luong: 0, danh_gia: 'Thiếu lá', so_luong_loi: 0, ly_do_loi: null })).toBe(false);
    expect(laORong({ so_luong: 0, danh_gia: null, so_luong_loi: 2, ly_do_loi: null })).toBe(false);
  });

  it('ô số: chỉ nhận số nguyên không âm', () => {
    expect(soNguyenKhongAm('')).toBe(0);
    expect(soNguyenKhongAm('12')).toBe(12);
    expect(soNguyenKhongAm('1.234')).toBe(1234);
    expect(soNguyenKhongAm('-5')).toBe(5);
    expect(soNguyenKhongAm('abc')).toBe(0);
  });

  it('ghi đè ô cùng khoá, tổng ngày cộng lại đúng; xoá ô thì mất khỏi tổng', () => {
    const sua = apOVaoPhieu(phieu, khoa, dong('d1', 25));
    expect(sua.lo[0].dong).toHaveLength(1);
    expect(tongPhieuNgay(sua, NGAY).tongThu).toBe(25);
    const them = apOVaoPhieu(sua, { ...khoa, stt_dong: 2 }, dong('d2', 5, 2));
    expect(tongPhieuNgay(them, NGAY).tongThu).toBe(30);
    expect(tongPhieuNgay(apOVaoPhieu(them, khoa, null), NGAY).tongThu).toBe(5);
    expect(phieu.lo[0].dong[0].so_luong).toBe(10);
  });

  it('đứt dây cộng vào tổng thu; 0 → xoá', () => {
    const p = apDutDayVaoPhieu(phieu, 'l1', NGAY, { id: 'n1', id_phieu_lo: 'l1', ngay: NGAY, dut_day: 3 });
    expect(tongPhieuNgay(p, NGAY).tongThu).toBe(13);
    expect(tongPhieuNgay(apDutDayVaoPhieu(p, 'l1', NGAY, null), NGAY).tongThu).toBe(10);
  });

  it('áp lên cache: phiếu đơn, mảng phiếu; dữ liệu khác giữ nguyên', () => {
    const fn = (p: DgdvPhieuDayDu) => ({ ...p, ghi_chu: 'x' });
    expect((apVaoDuLieuCache(phieu, fn) as DgdvPhieuDayDu).ghi_chu).toBe('x');
    expect((apVaoDuLieuCache([phieu], fn) as DgdvPhieuDayDu[])[0].ghi_chu).toBe('x');
    const trang = { data: [], totalCount: 0 };
    expect(apVaoDuLieuCache(trang, fn)).toBe(trang);
  });
});
