import { describe, expect, it } from 'vitest';
import { conCotDaBo, locCotGia } from './cot-gia.ts';

const COT = [
  { key: 'id', label: 'ID' },
  { key: 'so_phieu', label: 'Số phiếu' },
  { key: 'don_gia', label: 'Đơn giá' },
  { key: 'thanh_tien', label: 'Thành tiền' },
  { key: 'tong_tien', label: 'Tổng tiền' },
];
const PT = 'phan-thuoc/phieu-kho-phan-thuoc';

describe('locCotGia', () => {
  it('bỏ cột giá khi chủ lịch không toàn quyền', () => {
    expect(locCotGia(COT, PT, false).map((c) => c.key)).toEqual(['id', 'so_phieu']);
  });

  it('giữ nguyên khi toàn quyền', () => {
    expect(locCotGia(COT, PT, true)).toEqual(COT);
  });

  it('module không ẩn giá nhập (đơn đặt hàng) thì giữ nguyên', () => {
    expect(locCotGia(COT, 'mua-hang/don-dat-hang', false)).toEqual(COT);
  });
});

describe('conCotDaBo', () => {
  it('phát hiện cột đã bỏ còn nằm bên phải bảng mới', () => {
    expect(conCotDaBo(['ID', 'Số phiếu', 'Tổng tiền '], 2, ['Tổng tiền'])).toBe(true);
    expect(conCotDaBo(['ID', 'Số phiếu', 'Ghi chú tay'], 2, ['Tổng tiền'])).toBe(false);
    expect(conCotDaBo(['ID', 'Số phiếu', 'Tổng tiền'], 2, [])).toBe(false);
  });
});
