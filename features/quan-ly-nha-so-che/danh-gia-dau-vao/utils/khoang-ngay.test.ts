import { describe, expect, it } from 'vitest';
import { cacTuanTrongKhoang, chuanHoaKhoang, khoangNhanh, kieuCuaKhoang, SO_NGAY_TOI_DA } from './khoang-ngay';
import { mauChuTuongPhan } from './mau-day';

// 2026-10-21 là thứ Tư tuần farm 43/2026 (19/10 – 25/10).
const HOM_NAY = '2026-10-21';

describe('khoảng ngày Bảng đánh giá', () => {
  it('chọn nhanh: hôm nay / tuần này / tuần trước (T2 → CN)', () => {
    expect(khoangNhanh('hom-nay', HOM_NAY)).toEqual({ tu: HOM_NAY, den: HOM_NAY });
    expect(khoangNhanh('tuan-nay', HOM_NAY)).toEqual({ tu: '2026-10-19', den: '2026-10-25' });
    expect(khoangNhanh('tuan-truoc', HOM_NAY)).toEqual({ tu: '2026-10-12', den: '2026-10-18' });
    expect(kieuCuaKhoang('2026-10-19', '2026-10-25', HOM_NAY)).toBe('tuan-nay');
    expect(kieuCuaKhoang('2026-10-19', '2026-10-20', HOM_NAY)).toBeNull();
  });

  it('tuần trước qua năm', () => {
    expect(khoangNhanh('tuan-truoc', '2027-01-06')).toEqual({ tu: '2026-12-28', den: '2027-01-03' });
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
