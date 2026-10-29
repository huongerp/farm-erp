import { describe, expect, it } from 'vitest';
import { docThamSoInTuan, docThamSoPreview, getDgdvInTuanUrl, getDgdvPreviewChuyenUrl, getDgdvPreviewUrl } from './preview-url';

const doc = (url: string) => docThamSoPreview(new URL(url, 'http://x').searchParams);

describe('tham số trang in Đánh giá đầu vào', () => {
  it('tạo URL rồi đọc lại được', () => {
    expect(doc(getDgdvPreviewUrl('2026-10-19', '2026-10-25', '3'))).toEqual({ loai: 'ngay', tu: '2026-10-19', den: '2026-10-25', idChiNhanh: '3' });
  });

  it('thiếu đến = in một ngày; chi nhánh không phải số bị bỏ', () => {
    expect(doc('/p?tu=2026-10-21&cn=abc')).toEqual({ loai: 'ngay', tu: '2026-10-21', den: '2026-10-21', idChiNhanh: null });
  });

  it('ngày sai → null', () => {
    expect(doc('/p?tu=21/10/2026')).toBeNull();
    expect(doc('/p')).toBeNull();
  });

  it('đọc đúng phiếu chuyến; id sai → null', () => {
    expect(doc(getDgdvPreviewChuyenUrl('123'))).toEqual({ loai: 'chuyen', id: '123' });
    expect(doc('/p?id=abc')).toBeNull();
  });
});

describe('tham số phiếu tuần Đánh giá đầu vào', () => {
  const docTuan = (url: string) => docThamSoInTuan(new URL(url, 'http://x').searchParams);

  it('tạo URL rồi đọc lại bộ lọc đa chọn', () => {
    expect(docTuan(getDgdvInTuanUrl(2026, 44, ['3', '4'], ['to a'], ['co']))).toEqual({
      nam: 2026,
      tuan: 44,
      idChiNhanh: ['3', '4'],
      toTruong: ['to a'],
      ksc: ['co'],
    });
  });

  it('tham số tuần hoặc bộ lọc sai → null', () => {
    expect(docTuan('/p?nam=2026&tuan=99')).toBeNull();
    expect(docTuan('/p?nam=2026&tuan=1&cn=abc')).toBeNull();
    expect(docTuan('/p?nam=2026&tuan=1&ksc=loi')).toBeNull();
  });
});
