import { describe, expect, it } from 'vitest';
import { cacTuanTrongKhoang, chuanHoaKhoang, khoangTheoKy, kyCuaKhoang, soNgayCuaKhoang, SO_NGAY_TOI_DA } from './khoang-ngay';
import { mauChuTuongPhan } from './mau-day';

// 2026-10-21 là thứ Tư tuần farm 43/2026 (19/10 – 25/10).
const HOM_NAY = '2026-10-21';

describe('khoảng ngày Bảng đánh giá', () => {
  it('kỳ ngày / tuần farm (T2 → CN) / tháng / quý / năm; Tất cả = không giới hạn', () => {
    expect(khoangTheoKy('all', HOM_NAY)).toEqual({ tu: '', den: '' });
    expect(khoangTheoKy('today', HOM_NAY)).toEqual({ tu: HOM_NAY, den: HOM_NAY });
    expect(khoangTheoKy('yesterday', HOM_NAY)).toEqual({ tu: '2026-10-20', den: '2026-10-20' });
    expect(khoangTheoKy('7days', HOM_NAY)).toEqual({ tu: '2026-10-15', den: HOM_NAY });
    expect(khoangTheoKy('thisWeek', HOM_NAY)).toEqual({ tu: '2026-10-19', den: '2026-10-25' });
    expect(khoangTheoKy('lastWeek', HOM_NAY)).toEqual({ tu: '2026-10-12', den: '2026-10-18' });
    expect(khoangTheoKy('thisMonth', HOM_NAY)).toEqual({ tu: '2026-10-01', den: HOM_NAY });
    expect(khoangTheoKy('lastMonth', HOM_NAY)).toEqual({ tu: '2026-09-01', den: '2026-09-30' });
    expect(khoangTheoKy('thisQuarter', HOM_NAY)).toEqual({ tu: '2026-10-01', den: HOM_NAY });
    expect(khoangTheoKy('thisYear', HOM_NAY)).toEqual({ tu: '2026-01-01', den: HOM_NAY });
    expect(khoangTheoKy('custom', HOM_NAY, '2026-10-02', '2026-10-05')).toEqual({ tu: '2026-10-02', den: '2026-10-05' });
  });

  it('qua năm: tuần trước, tháng trước, quý', () => {
    expect(khoangTheoKy('lastWeek', '2027-01-06')).toEqual({ tu: '2026-12-28', den: '2027-01-03' });
    expect(khoangTheoKy('lastMonth', '2027-01-06')).toEqual({ tu: '2026-12-01', den: '2026-12-31' });
    expect(khoangTheoKy('thisQuarter', '2027-05-06')).toEqual({ tu: '2027-04-01', den: '2027-05-06' });
  });

  it('kỳ của khoảng + số ngày', () => {
    expect(kyCuaKhoang('', '', HOM_NAY)).toBe('all');
    expect(kyCuaKhoang('2026-10-19', '2026-10-25', HOM_NAY)).toBe('thisWeek');
    expect(kyCuaKhoang('2026-10-19', '2026-10-20', HOM_NAY)).toBe('custom');
    expect(soNgayCuaKhoang('2026-10-19', '2026-10-25')).toBe(7);
    expect(soNgayCuaKhoang('', '')).toBe(Infinity);
  });

  it('đảo khoảng ngược và cắt quá dài', () => {
    expect(chuanHoaKhoang('2026-10-25', '2026-10-19')).toEqual({ tu: '2026-10-19', den: '2026-10-25', biCat: false });
    const x = chuanHoaKhoang('2026-01-01', '2026-12-31');
    expect(x.biCat).toBe(true);
    expect(SO_NGAY_TOI_DA).toBe(31);
    expect(x.den).toBe('2026-01-31');
  });

  it('các tuần farm phủ khoảng, không trùng', () => {
    expect(cacTuanTrongKhoang('2026-10-24', '2026-10-27')).toEqual([
      { nam: 2026, tuan: 43 },
      { nam: 2026, tuan: 44 },
    ]);
    expect(cacTuanTrongKhoang('2026-12-27', '2027-01-01')).toEqual([
      { nam: 2026, tuan: 52 },
      { nam: 2027, tuan: 1 },
    ]);
  });
});

describe('màu chữ tiêu đề cột dây', () => {
  it('nền tối → chữ trắng, nền sáng → chữ đen, mã sai → đen', () => {
    expect(mauChuTuongPhan('#000000')).toBe('#FFFFFF');
    expect(mauChuTuongPhan('#FFFFFF')).toBe('#000000');
    expect(mauChuTuongPhan('#FDD835')).toBe('#000000');
    expect(mauChuTuongPhan('#556B2F')).toBe('#FFFFFF');
    expect(mauChuTuongPhan('xanh')).toBe('#000000');
  });

  it('dây 2 màu: theo trung bình độ sáng hai nửa', () => {
    expect(mauChuTuongPhan('#000000', '#6D4C41')).toBe('#FFFFFF');
    expect(mauChuTuongPhan('#FFFFFF', '#FDD835')).toBe('#000000');
  });
});
