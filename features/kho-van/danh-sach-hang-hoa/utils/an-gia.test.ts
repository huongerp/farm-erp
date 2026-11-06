import { describe, expect, it } from 'vitest';
import { locCotTheoQuyenXemGia } from './an-gia';
import { hangHoaSchema, hangHoaSchemaAnGia } from '../core/schema';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

describe('locCotTheoQuyenXemGia', () => {
  const cols = [{ id: 'ma_hang_hoa' }, { id: 'don_gia' }, { id: 'dvt' }];

  it('xem được giá → giữ nguyên toàn bộ cột', () => {
    expect(locCotTheoQuyenXemGia(cols, true, (c) => c.id)).toHaveLength(3);
  });

  it('không xem được giá → bỏ cột don_gia', () => {
    expect(locCotTheoQuyenXemGia(cols, false, (c) => c.id).map((c) => c.id)).toEqual(['ma_hang_hoa', 'dvt']);
  });

  it('cột xuất dùng key', () => {
    const ex = [{ key: 'don_gia' }, { key: 'dvt' }];
    expect(locCotTheoQuyenXemGia(ex, false, (c) => c.key)).toEqual([{ key: 'dvt' }]);
  });
});

describe('schema form khi ô giá bị ẩn', () => {
  const co = {
    ma_hang_hoa: 'SP-1',
    ten_hang_hoa: 'Phân',
    id_danh_muc_cap2: '5',
    dvt: 'Bao',
    trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
    thu_tu: 1,
  };

  it('schema thường vẫn bắt buộc giá', () => {
    expect(hangHoaSchema.safeParse({ ...co, don_gia: undefined }).success).toBe(false);
  });

  it('schema ẩn giá: thiếu giá → 0, có giá cũ → giữ nguyên', () => {
    const moi = hangHoaSchemaAnGia.safeParse({ ...co, don_gia: undefined });
    expect(moi.success && moi.data.don_gia).toBe(0);
    const sua = hangHoaSchemaAnGia.safeParse({ ...co, don_gia: 125000 });
    expect(sua.success && sua.data.don_gia).toBe(125000);
  });
});
