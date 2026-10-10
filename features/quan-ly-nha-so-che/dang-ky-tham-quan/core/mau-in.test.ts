import { describe, expect, it } from 'vitest';
import { tachGioPhutNgay, taoUrlPreview, tenFileIn } from './mau-in';

describe('mẫu in phiếu tham quan', () => {
  it('tách giờ / phút / ngày theo giờ Việt Nam', () => {
    expect(tachGioPhutNgay('2026-09-27T02:00:00Z')).toEqual({ gio: '09', phut: '00', ngay: '27/09/2026' });
    expect(tachGioPhutNgay('2026-09-27T16:30:00Z')).toEqual({ gio: '23', phut: '30', ngay: '27/09/2026' });
    expect(tachGioPhutNgay(null)).toBeNull();
  });

  it('URL preview + tên file', () => {
    expect(taoUrlPreview('12')).toBe('/quan-ly-nha-so-che/dang-ky-tham-quan/preview/12');
    expect(tenFileIn({ id: '12', ngay_dang_ky: '2026-09-27' })).toBe('phieu-tham-quan-12-20260927');
    expect(tenFileIn(null)).toBe('phieu-tham-quan-trang');
  });
});
