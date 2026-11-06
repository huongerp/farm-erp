import { describe, expect, it } from 'vitest';
import { kieuAnh, laUrlLogoDuocPhep } from './logo.ts';

describe('laUrlLogoDuocPhep', () => {
  const ds = [' https://cdn.vd.com/logo.png ', null, 'data:image/png;base64,AAA'];

  it('chỉ nhận đúng URL logo đang lưu (bỏ khoảng trắng)', () => {
    expect(laUrlLogoDuocPhep('https://cdn.vd.com/logo.png', ds)).toBe(true);
    expect(laUrlLogoDuocPhep('https://cdn.vd.com/logo.png?x=1', ds)).toBe(false);
  });

  it('từ chối URL tuỳ ý / nội bộ / không phải http(s)', () => {
    expect(laUrlLogoDuocPhep('http://postgrest:3000/', ds)).toBe(false);
    expect(laUrlLogoDuocPhep('file:///etc/passwd', ['file:///etc/passwd'])).toBe(false);
    expect(laUrlLogoDuocPhep('data:image/png;base64,AAA', ds)).toBe(false);
    expect(laUrlLogoDuocPhep('', [''])).toBe(false);
  });
});

describe('kieuAnh', () => {
  it('chỉ nhận image/*', () => {
    expect(kieuAnh('image/png; charset=binary')).toBe('image/png');
    expect(kieuAnh('IMAGE/SVG+XML')).toBe('image/svg+xml');
    expect(kieuAnh('text/html')).toBeNull();
    expect(kieuAnh(null)).toBeNull();
  });
});
