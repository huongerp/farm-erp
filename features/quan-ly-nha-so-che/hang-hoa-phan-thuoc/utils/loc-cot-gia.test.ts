import { describe, expect, it } from 'vitest';
import { anhXaChiSoSapXep, locCotTheoXemGia } from './loc-cot-gia';

describe('hàng hoá phân thuốc — ẩn cột giá', () => {
  const all = [
    { id: 'ma_hang_hoa', order: 0 },
    { id: 'don_gia', order: 1 },
    { id: 'dvt', order: 2 },
    { id: 'mo_ta', order: 3 },
  ];

  it('bỏ don_gia khi không xem được giá, giữ nguyên khi xem được', () => {
    expect(locCotTheoXemGia(all, false).map((c) => c.id)).toEqual(['ma_hang_hoa', 'dvt', 'mo_ta']);
    expect(locCotTheoXemGia(all, true)).toBe(all);
  });

  it('kéo thả khi đã lọc: đổi chỉ số rút gọn sang chỉ số đầy đủ', () => {
    const loc = locCotTheoXemGia(all, false);
    expect(anhXaChiSoSapXep(all, loc, 2, 1)).toEqual([3, 2]);
    expect(anhXaChiSoSapXep(all, loc, 0, 9)).toBeNull();
  });
});
