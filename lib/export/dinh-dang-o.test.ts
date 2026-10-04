import { describe, expect, it } from 'vitest';
import { dinhDangOXuat, mauSoCotSheet, mauSoExcel, serialNgay, serialThoiDiem, type KieuCotXuat } from './dinh-dang-o';
import * as banServer from '../../services/sheets/src/core/dinh-dang';

describe('serial ngày', () => {
  it('khớp mốc Excel/Sheet 1899-12-30', () => {
    expect(serialNgay(1970, 1, 1)).toBe(25569);
    expect(serialNgay(2026, 10, 4)).toBe(46299);
  });

  it('thời điểm quy giờ VN và cắt tới phút', () => {
    // 2026-10-04T17:30:45Z = 05/10/2026 00:30 giờ VN
    const s = serialThoiDiem(Date.parse('2026-10-04T17:30:45Z'));
    expect(Math.floor(s)).toBe(serialNgay(2026, 10, 5));
    expect(Math.round((s % 1) * 1440)).toBe(30);
  });
});

describe('dinhDangOXuat', () => {
  it('rỗng → chuỗi rỗng ở mọi đích', () => {
    for (const gt of [null, undefined, '']) {
      expect(dinhDangOXuat(gt, 'number')).toEqual({ hienThi: '', excel: '', sheet: '' });
    }
  });

  it('ngày trần không bị lệch múi giờ', () => {
    const o = dinhDangOXuat('2026-01-01', 'date');
    expect(o.hienThi).toBe('01/01/2026');
    expect((o.excel as Date).toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(o.sheet).toBe(serialNgay(2026, 1, 1));
  });

  it('cột ngày nhận timestamptz → lấy ngày theo giờ VN', () => {
    const o = dinhDangOXuat('2026-01-01T18:00:00Z', 'date');
    expect(o.hienThi).toBe('02/01/2026');
    expect(o.sheet).toBe(serialNgay(2026, 1, 2));
  });

  it('datetime: Excel nhận giờ treo tường VN, không phải UTC', () => {
    const o = dinhDangOXuat('2026-09-05T03:00:00Z', 'datetime');
    expect(o.hienThi).toBe('05/09/2026 10:00');
    expect((o.excel as Date).toISOString()).toBe('2026-09-05T10:00:00.000Z');
  });

  it('tự suy datetime/date từ chuỗi ISO khi không khai type', () => {
    expect(dinhDangOXuat('2026-09-05T03:00:00+00:00').hienThi).toBe('05/09/2026 10:00');
    expect(dinhDangOXuat('2026-09-05').hienThi).toBe('05/09/2026');
  });

  it('số: Excel/Sheet nhận number thật, csv có phân cách nghìn', () => {
    const o = dinhDangOXuat(1234567.5, 'number');
    expect(o.excel).toBe(1234567.5);
    expect(o.sheet).toBe(1234567.5);
    expect(o.hienThi).toBe('1.234.567,5');
  });

  it('chuỗi số trần (numeric từ PostgREST) được đổi thành số', () => {
    expect(dinhDangOXuat('1500000', 'money').excel).toBe(1500000);
  });

  it('chuỗi đã format VN không bị đoán thành số sai', () => {
    expect(dinhDangOXuat('1.234,5', 'number')).toEqual({ hienThi: '1.234,5', excel: '1.234,5', sheet: '1.234,5' });
  });

  it('text giữ số 0 đầu; số khai text vẫn là ô số trên Excel', () => {
    expect(dinhDangOXuat('0123', 'text').excel).toBe('0123');
    expect(dinhDangOXuat('0123').excel).toBe('0123');
    const id = dinhDangOXuat(12345, 'text');
    expect(id.hienThi).toBe('12345');
    expect(id.excel).toBe(12345);
  });

  it('phần trăm và boolean', () => {
    expect(dinhDangOXuat(12.5, 'percent').hienThi).toBe('12,5%');
    expect(dinhDangOXuat(true).hienThi).toBe('Có');
    expect(dinhDangOXuat('false', 'boolean').hienThi).toBe('Không');
  });

  it('chuỗi ngày hỏng thì giữ nguyên chữ', () => {
    expect(dinhDangOXuat('không rõ', 'datetime').excel).toBe('không rõ');
  });

  it('mảng nối bằng dấu phẩy', () => {
    expect(dinhDangOXuat(['a', null, 'b']).hienThi).toBe('a, b');
  });
});

describe('mẫu số', () => {
  it('Excel theo kiểu ô', () => {
    expect(mauSoExcel('date', new Date())).toBe('dd/mm/yyyy');
    expect(mauSoExcel(undefined, new Date())).toBe('dd/mm/yyyy hh:mm');
    expect(mauSoExcel('money', 1000)).toBe('#,##0');
    expect(mauSoExcel('number', 3)).toBe('#,##0');
    expect(mauSoExcel('number', 3.5)).toBe('#,##0.###');
    expect(mauSoExcel('text', 3)).toBeUndefined();
  });

  it('Sheet suy theo ô có giá trị đầu tiên khi cột không khai type', () => {
    const rows = [{ a: '' }, { a: '2026-01-01' }, { a: 'x' }];
    expect(mauSoCotSheet(undefined, rows, (r) => r.a)).toBe('date');
    expect(mauSoCotSheet('text', rows, (r) => r.a)).toBeUndefined();
    expect(mauSoCotSheet(undefined, [{ a: '' }], (r) => r.a)).toBeUndefined();
  });
});

describe('parity client ↔ worker đồng bộ (services/sheets/src/core/dinh-dang.ts)', () => {
  const mau: [unknown, KieuCotXuat | undefined][] = [
    [null, 'number'],
    ['2026-01-01', 'date'],
    ['2026-01-01T18:00:00Z', 'date'],
    ['2026-09-05T03:00:00.123+00:00', 'datetime'],
    ['2026-09-05T03:00:00Z', undefined],
    [1234567.5, 'number'],
    ['1500000', 'money'],
    ['1.234,5', 'number'],
    [12.5, 'percent'],
    ['0123', 'text'],
    [42, 'text'],
    [true, undefined],
    [['a', 'b'], undefined],
    [{ x: 1 }, undefined],
  ];

  it('cùng giá trị ra cùng ô Sheet và cùng chữ hiển thị', () => {
    for (const [gt, kieu] of mau) {
      const a = dinhDangOXuat(gt, kieu);
      const b = banServer.dinhDangOXuat(gt, kieu);
      expect(b.sheet, `${String(gt)} / ${kieu}`).toEqual(a.sheet);
      expect(b.hienThi).toBe(a.hienThi);
    }
  });

  it('cùng mẫu số cột', () => {
    const rows = [{ a: '' }, { a: '2026-01-01T00:00:00Z' }];
    expect(banServer.mauSoCotSheet(undefined, rows, (r) => r.a)).toBe(mauSoCotSheet(undefined, rows, (r) => r.a));
  });
});
