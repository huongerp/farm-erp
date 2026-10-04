import { describe, expect, it } from 'vitest';
import { gopKhoangXoa, nenGhiLaiToanBo, soKhopDong } from './so-khop-dong.ts';

describe('soKhopDong', () => {
  it('không đổi gì → kế hoạch rỗng (ô trống cuối dòng bị API bỏ vẫn coi là bằng)', () => {
    const k = soKhopDong([[1, 'A', ''], [2, 'B']], [[1, 'A', ''], [2, 'B', '']], 3);
    expect(k).toEqual({ capNhat: [], them: [], xoa: [] });
  });

  it('sửa đúng dòng theo id, không theo vị trí', () => {
    const k = soKhopDong([[2, 'B'], [1, 'A']], [[1, 'A2'], [2, 'B']], 2);
    expect(k.capNhat).toEqual([{ dong: 3, values: [1, 'A2'] }]);
  });

  it('thêm id mới, xoá id đã mất — xoá từ dưới lên', () => {
    const k = soKhopDong([[1, 'A'], [2, 'B'], [3, 'C']], [[1, 'A'], [4, 'D']], 2);
    expect(k.them).toEqual([[4, 'D']]);
    expect(k.xoa).toEqual([4, 3]);
  });

  it('id dạng chữ trên Sheet vẫn khớp id số — không thêm/xoá, chỉ ghi lại ô cho đúng kiểu một lần', () => {
    const k = soKhopDong([['12', 'A']], [[12, 'A']], 2);
    expect(k.them).toEqual([]);
    expect(k.xoa).toEqual([]);
    expect(k.capNhat).toEqual([{ dong: 2, values: [12, 'A'] }]);
  });

  it('dòng trống / id trùng trên Sheet bị dọn', () => {
    const k = soKhopDong([[1, 'A'], ['', ''], [1, 'A-trùng']], [[1, 'A']], 2);
    expect(k.capNhat).toEqual([]);
    expect(k.xoa).toEqual([4, 3]);
  });

  it('serial ngày lệch sai số dấu phẩy động vẫn coi là bằng', () => {
    const k = soKhopDong([[1, 46299.427083333336]], [[1, 46299.42708333333]], 2);
    expect(k.capNhat).toEqual([]);
  });

  it('cột người dùng thêm bên phải không được so', () => {
    const k = soKhopDong([[1, 'A', 'ghi chú tay']], [[1, 'A']], 2);
    expect(k.capNhat).toEqual([]);
  });
});

describe('gopKhoangXoa / nenGhiLaiToanBo', () => {
  it('gộp dòng liền nhau thành khoảng chỉ số 0, giảm dần', () => {
    expect(gopKhoangXoa([10, 9, 8, 5, 3, 2])).toEqual([
      { batDau: 7, ketThuc: 10 },
      { batDau: 4, ketThuc: 5 },
      { batDau: 1, ketThuc: 3 },
    ]);
  });

  it('thay đổi > 30% bảng lớn thì ghi lại toàn bộ', () => {
    const it = (n: number) => ({ capNhat: Array.from({ length: n }, (_, i) => ({ dong: i + 2, values: [] })), them: [], xoa: [] });
    expect(nenGhiLaiToanBo(it(31), 100)).toBe(true);
    expect(nenGhiLaiToanBo(it(30), 100)).toBe(false);
    expect(nenGhiLaiToanBo(it(10), 20)).toBe(false);
  });
});
