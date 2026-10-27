import { describe, expect, it } from 'vitest';
import { docThamSoPreview, getDgdvPreviewUrl } from './preview-url';

const doc = (url: string) => docThamSoPreview(new URL(url, 'http://x').searchParams);

describe('tham số trang in Đánh giá đầu vào', () => {
  it('tạo URL rồi đọc lại được', () => {
    expect(doc(getDgdvPreviewUrl('2026-10-19', '2026-10-25', '3'))).toEqual({ tu: '2026-10-19', den: '2026-10-25', idChiNhanh: '3' });
  });

  it('thiếu đến = in một ngày; chi nhánh không phải số bị bỏ', () => {
    expect(doc('/p?tu=2026-10-21&cn=abc')).toEqual({ tu: '2026-10-21', den: '2026-10-21', idChiNhanh: null });
  });

  it('ngày sai → null', () => {
    expect(doc('/p?tu=21/10/2026')).toBeNull();
    expect(doc('/p')).toBeNull();
  });
});
