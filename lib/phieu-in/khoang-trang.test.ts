import { describe, expect, it } from 'vitest';
import { docKhoangTrang } from './khoang-trang';

describe('docKhoangTrang', () => {
  it('rỗng → tất cả', () => {
    expect(docKhoangTrang('  ', 5)).toEqual({ trang: null });
  });

  it('khoảng + trang lẻ, bỏ trùng, sắp xếp', () => {
    expect(docKhoangTrang('2-3,5', 6)).toEqual({ trang: [2, 3, 5] });
    expect(docKhoangTrang('5, 1-2; 2', 6)).toEqual({ trang: [1, 2, 5] });
  });

  it('khoảng hở hai đầu', () => {
    expect(docKhoangTrang('4-', 6)).toEqual({ trang: [4, 5, 6] });
    expect(docKhoangTrang('-2', 6)).toEqual({ trang: [1, 2] });
  });

  it('cắt phần vượt quá tổng số trang', () => {
    expect(docKhoangTrang('2-9', 3)).toEqual({ trang: [2, 3] });
  });

  it('sai cú pháp → báo phần sai', () => {
    expect(docKhoangTrang('2-a', 5)).toEqual({ loi: 'cu-phap', phan: '2-a' });
    expect(docKhoangTrang('3-1', 5)).toEqual({ loi: 'cu-phap', phan: '3-1' });
    expect(docKhoangTrang('0', 5)).toEqual({ loi: 'cu-phap', phan: '0' });
    expect(docKhoangTrang('2 3', 5)).toEqual({ loi: 'cu-phap', phan: '2 3' });
    expect(docKhoangTrang('-', 5)).toEqual({ loi: 'cu-phap', phan: '-' });
  });

  it('không trang nào trong tài liệu', () => {
    expect(docKhoangTrang('7-9', 3)).toEqual({ loi: 'ngoai-pham-vi', tong: 3 });
  });
});
