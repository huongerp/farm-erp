import { describe, expect, it } from 'vitest';
import { hinhAnhUrlItemSchema } from './hinh-anh-url-schema';

const ok = (s: string) => hinhAnhUrlItemSchema.safeParse(s).success;

describe('hinhAnhUrlItemSchema', () => {
  it('nhận ảnh VPS và URL http(s)', () => {
    expect(ok('/media/f/bao-cao-nhan-cong/2026/10/0123456789abcdef0123456789abcdef.jpg')).toBe(true);
    expect(ok('https://res.cloudinary.com/x/image/upload/a.jpg')).toBe(true);
  });

  it('từ chối base64 và đường dẫn tương đối khác khuôn', () => {
    expect(ok('data:image/jpeg;base64,AAAA')).toBe(false);
    expect(ok('/media/f/../etc/passwd')).toBe(false);
    expect(ok('/api/abc.jpg')).toBe(false);
    expect(ok('')).toBe(false);
  });
});
