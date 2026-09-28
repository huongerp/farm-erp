import { describe, expect, it } from 'vitest';
import { canChiNam, canChiNgay, canChiThang, duongSangAm, gioHoangDao, jdTuNgay, soTuanIso, tietKhi } from './am-lich';

describe('duongSangAm', () => {
  it('Tết Bính Ngọ 2026 và Ất Tỵ 2025', () => {
    expect(duongSangAm(17, 2, 2026)).toEqual({ ngay: 1, thang: 1, nam: 2026, nhuan: false });
    expect(duongSangAm(29, 1, 2025)).toEqual({ ngay: 1, thang: 1, nam: 2025, nhuan: false });
  });

  it('ngày trước Tết vẫn thuộc năm âm trước', () => {
    expect(duongSangAm(16, 2, 2026)).toMatchObject({ thang: 12, nam: 2025 });
  });

  it('Trung thu 2026', () => {
    expect(duongSangAm(25, 9, 2026)).toEqual({ ngay: 15, thang: 8, nam: 2026, nhuan: false });
  });

  it('tháng nhuận: 6 nhuận Ất Tỵ, 2 nhuận Quý Mão', () => {
    expect(duongSangAm(25, 7, 2025)).toEqual({ ngay: 1, thang: 6, nam: 2025, nhuan: true });
    expect(duongSangAm(24, 7, 2025)).toMatchObject({ thang: 6, nhuan: false });
    expect(duongSangAm(22, 3, 2023)).toEqual({ ngay: 1, thang: 2, nam: 2023, nhuan: true });
  });
});

describe('Can Chi', () => {
  it('năm, tháng Giêng, ngày', () => {
    expect(canChiNam(2026)).toBe('Bính Ngọ');
    expect(canChiNam(2025)).toBe('Ất Tỵ');
    expect(canChiThang(1, 2026)).toBe('Canh Dần');
    expect(canChiNgay(jdTuNgay(1, 1, 2000))).toBe('Mậu Ngọ');
  });
});

describe('tietKhi', () => {
  it('quanh Thu phân và Đông chí', () => {
    expect(tietKhi(jdTuNgay(20, 9, 2026))).toBe('Bạch lộ');
    expect(tietKhi(jdTuNgay(25, 9, 2026))).toBe('Thu phân');
    expect(tietKhi(jdTuNgay(25, 12, 2026))).toBe('Đông chí');
  });
});

describe('gioHoangDao', () => {
  it('ngày Ngọ có giờ Tý, Sửu, Mão, Ngọ, Thân, Dậu', () => {
    const gio = gioHoangDao(jdTuNgay(1, 1, 2000));
    expect(gio.map((g) => g.chi)).toEqual(['Tý', 'Sửu', 'Mão', 'Ngọ', 'Thân', 'Dậu']);
    expect(gio[0]).toMatchObject({ tu: 23, den: 1 });
  });
});

describe('soTuanIso', () => {
  it('giữa năm và biên năm', () => {
    expect(soTuanIso(2026, 9, 28)).toEqual({ tuan: 40, nam: 2026 });
    expect(soTuanIso(2025, 12, 29)).toEqual({ tuan: 1, nam: 2026 });
    expect(soTuanIso(2027, 1, 1)).toEqual({ tuan: 53, nam: 2026 });
    expect(soTuanIso(2027, 1, 4)).toEqual({ tuan: 1, nam: 2027 });
  });
});
