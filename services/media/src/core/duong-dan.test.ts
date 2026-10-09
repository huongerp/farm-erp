import { describe, expect, it } from 'vitest';
import { chonDinhDang, docDuongDanPhucVu, laThuMucHopLe, taoDuongDanLuu, urlCongKhai } from './duong-dan.ts';

const MA = '0123456789abcdef0123456789abcdef';

describe('laThuMucHopLe', () => {
  it('chỉ nhận thư mục trong danh sách', () => {
    expect(laThuMucHopLe('hang-hoa')).toBe(true);
    expect(laThuMucHopLe('giam-sat-chat-luong')).toBe(true);
    expect(laThuMucHopLe('../etc')).toBe(false);
    expect(laThuMucHopLe('')).toBe(false);
    expect(laThuMucHopLe(undefined)).toBe(false);
  });
});

describe('taoDuongDanLuu', () => {
  it('xếp theo thư mục / năm / tháng (UTC)', () => {
    expect(taoDuongDanLuu('tai-san', new Date('2026-03-05T10:00:00Z'), MA, 'jpg')).toBe(`tai-san/2026/03/${MA}.jpg`);
  });

  it('từ chối mã không phải 32 hex', () => {
    expect(() => taoDuongDanLuu('tai-san', new Date(), 'abc', 'jpg')).toThrow();
  });
});

describe('docDuongDanPhucVu', () => {
  it('nhận đúng khuôn và suy Content-Type', () => {
    expect(docDuongDanPhucVu(`hang-hoa/2026/10/${MA}.jpg`)?.contentType).toBe('image/jpeg');
    expect(docDuongDanPhucVu(`cong-ty/2026/10/${MA}.png`)?.contentType).toBe('image/png');
  });

  it('chặn traversal, thư mục lạ, đuôi lạ', () => {
    for (const p of [
      `../hang-hoa/2026/10/${MA}.jpg`,
      `hang-hoa/2026/10/../../${MA}.jpg`,
      `hang-hoa//2026/10/${MA}.jpg`,
      `khac/2026/10/${MA}.jpg`,
      `hang-hoa/2026/10/${MA}.svg`,
      `hang-hoa/2026/10/${MA}.jpg/`,
      '',
    ]) {
      expect(docDuongDanPhucVu(p)).toBeNull();
    }
  });
});

describe('chonDinhDang / urlCongKhai', () => {
  it('ảnh trong suốt giữ PNG, còn lại JPEG', () => {
    expect(chonDinhDang(true)).toBe('png');
    expect(chonDinhDang(false)).toBe('jpg');
  });

  it('URL tương đối dưới /media/f/', () => {
    expect(urlCongKhai(`hang-hoa/2026/10/${MA}.jpg`)).toBe(`/media/f/hang-hoa/2026/10/${MA}.jpg`);
  });
});
