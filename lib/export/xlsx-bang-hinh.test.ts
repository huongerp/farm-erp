import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { caoDongTheoAnh, dichSheetXuong, viTriAnh } from './xlsx-bang-hinh';

describe('dichSheetXuong', () => {
  const taoSheet = () => {
    const ws = XLSX.utils.aoa_to_sheet([['Công ty'], [], ['Tiêu đề', null, 1250]]);
    ws['C3'].z = '#,##0';
    ws['!cols'] = [{ wch: 20 }, { wch: 10 }];
    ws['!merges'] = [{ s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }];
    ws['!rows'] = [{ hpt: 20 }];
    return ws;
  };

  it('dời ô, merge, chiều cao dòng xuống n dòng; giữ định dạng số và độ rộng cột', () => {
    const goc = taoSheet();
    const ws = dichSheetXuong(XLSX, goc, 1);
    expect(ws['A1']).toBeUndefined();
    expect(ws['A2'].v).toBe('Công ty');
    expect(ws['A4'].v).toBe('Tiêu đề');
    expect(ws['C4'].v).toBe(1250);
    expect(ws['C4'].z).toBe('#,##0');
    expect(ws['!ref']).toBe('A1:C4');
    expect(ws['!merges']).toEqual([{ s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }]);
    expect(ws['!rows']).toEqual([{}, { hpt: 20 }]);
    expect(ws['!cols']).toEqual([{ wch: 20 }, { wch: 10 }]);
  });

  it('không sửa sheet gốc (dùng lại khi phải ghi file dự phòng không ảnh)', () => {
    const goc = taoSheet();
    dichSheetXuong(XLSX, goc, 2);
    expect(goc['A1'].v).toBe('Công ty');
    expect(goc['!ref']).toBe('A1:C3');
    expect(goc['!merges']).toEqual([{ s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }]);
  });

  it('dời cả vùng lọc', () => {
    const goc = XLSX.utils.aoa_to_sheet([['a', 'b'], [1, 2]]);
    goc['!autofilter'] = { ref: 'A1:B2' };
    expect(dichSheetXuong(XLSX, goc, 1)['!autofilter']).toEqual({ ref: 'A2:B3' });
  });

  it('sheet rỗng vẫn có !ref hợp lệ', () => {
    expect(dichSheetXuong(XLSX, {}, 1)['!ref']).toBe('A1');
  });
});

describe('viTriAnh', () => {
  it('căn giữa theo tổng độ rộng cột', () => {
    // tổng 500px, ảnh 300px → lệch 100px: rơi vào cột 1 (cột 0 rộng 80px), lệch 20px
    expect(viTriAnh([80, 200, 220], 300, 40)).toEqual({ cot: 1, lechPx: 20, rong: 300, cao: 40 });
  });

  it('ảnh rộng hơn các cột thì thu nhỏ giữ tỉ lệ, đặt sát trái', () => {
    expect(viTriAnh([100, 100], 400, 40)).toEqual({ cot: 0, lechPx: 0, rong: 200, cao: 20 });
  });
});

describe('caoDongTheoAnh', () => {
  it('dòng chứa ảnh cao bằng ảnh cộng lề trên và dưới', () => {
    expect(caoDongTheoAnh(98, 4)).toBe(106);
  });
});
