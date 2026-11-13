import { describe, expect, it } from 'vitest';
import { tinhChenhLech, tinhDinhMucPhen, type HoPhenDinhMuc } from './dinh-muc';

/** Số liệu lấy từ file mẫu «NHẬT KÝ TD PHA PHÈN.xlsx» (bảng định mức dưới cùng). */
function ho(
  xan: number,
  tia: number,
  boSung: number,
  dangDung = true
): HoPhenDinhMuc {
  return {
    the_tich_xan_m3: xan,
    the_tich_tia_m3: tia,
    bo_sung_xan_kg: boSung,
    bo_sung_tia_kg: boSung,
    ty_le_g_lit: 0.5,
    ty_le_dau_ca: 0.8,
    dang_dung: dangDung,
  };
}

describe('tinhDinhMucPhen', () => {
  it('FP1 một hồ: đầu ca 8 + 12,8; mỗi lần sau 2 kg; tổng ngày 28,8', () => {
    const kq = tinhDinhMucPhen([ho(20, 32, 4)]);
    expect(kq.lan1).toBeCloseTo(20.8, 3);
    expect(kq.moiLanSau).toBeCloseTo(2, 3);
    expect(kq.tongNgay).toBeCloseTo(28.8, 3);
  });

  it('FP3 hai hồ cộng dồn: tổng ngày 26,2 + 31,4 = 57,6', () => {
    const kq = tinhDinhMucPhen([ho(17.5, 28, 4), ho(22.5, 36, 4)]);
    expect(kq.lan1).toBeCloseTo(41.6, 3);
    expect(kq.moiLanSau).toBeCloseTo(4, 3);
    expect(kq.tongNgay).toBeCloseTo(57.6, 3);
  });

  it('FP6 hồ nhỏ, bổ sung 2 kg: tổng ngày 2 × 9,408 = 18,816', () => {
    const kq = tinhDinhMucPhen([ho(6.1, 7.42, 2), ho(6.1, 7.42, 2)]);
    expect(kq.lan1).toBeCloseTo(10.816, 3);
    expect(kq.moiLanSau).toBeCloseTo(2, 3);
    expect(kq.tongNgay).toBeCloseTo(18.816, 3);
  });

  it('bỏ qua hồ ngừng dùng; không có hồ nào → toàn 0', () => {
    const kq = tinhDinhMucPhen([ho(20, 32, 4), ho(100, 100, 50, false)]);
    expect(kq.tongNgay).toBeCloseTo(28.8, 3);
    expect(tinhDinhMucPhen([])).toEqual({ lan1: 0, moiLanSau: 0, tongNgay: 0 });
  });

  it('số lần pha sau tuỳ chỉnh: bổ sung 8 kg chia 2 lần = 4 kg/lần', () => {
    const kq = tinhDinhMucPhen([ho(20, 32, 4)], 2);
    expect(kq.moiLanSau).toBeCloseTo(4, 3);
    expect(kq.tongNgay).toBeCloseTo(28.8, 3);
  });
});

describe('tinhChenhLech', () => {
  it('thực tế trừ định mức, làm tròn 3 số lẻ', () => {
    expect(tinhChenhLech(30, 28.8)).toBeCloseTo(1.2, 3);
    expect(tinhChenhLech(20, 28.8)).toBeCloseTo(-8.8, 3);
    expect(tinhChenhLech(28.8, 28.8)).toBe(0);
  });
});
