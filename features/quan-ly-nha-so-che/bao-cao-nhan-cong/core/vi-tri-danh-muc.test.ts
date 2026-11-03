import { describe, expect, it } from 'vitest';
import { gopViTriOptions } from './vi-tri-danh-muc';
import type { VarViTriSoChe } from './types';

const vt = (ten: string, thu_tu: number, dang_dung = true): VarViTriSoChe => ({
  id: String(thu_tu),
  ten,
  dang_dung,
  thu_tu,
});

describe('gopViTriOptions', () => {
  it('giữ đúng thứ tự danh mục, bỏ vị trí ngừng dùng', () => {
    expect(gopViTriOptions([vt('Cân', 1), vt('Tỉa nải', 2, false), vt('Đóng thùng', 3)], [])).toEqual([
      'Cân',
      'Đóng thùng',
    ]);
  });

  it('nối vị trí còn dùng trong danh mục nhân viên nhưng chưa có trong danh mục', () => {
    expect(gopViTriOptions([vt('Cân', 1)], ['Kho', 'Tỉa nải'])).toEqual(['Cân', 'Kho', 'Tỉa nải']);
  });

  it('không trùng hoa thường / khoảng trắng, giữ cách viết của danh mục', () => {
    expect(gopViTriOptions([vt('NT TỈA', 1)], ['nt  tỉa', 'Kho'])).toEqual(['NT TỈA', 'Kho']);
  });

  it('bỏ tên rỗng và vị trí trùng nhau trong danh sách phụ', () => {
    expect(gopViTriOptions([], [null, '  ', 'Kho', 'kho'])).toEqual(['Kho']);
  });
});
