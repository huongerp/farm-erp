import { describe, it, expect } from 'vitest';
import { buildHeSoGoiY, parseHeSo } from './he-so-quy-doi';

describe('parseHeSo', () => {
  it('nhận dấu phẩy và dấu chấm thập phân', () => {
    expect(parseHeSo('1,25')).toBe(1.25);
    expect(parseHeSo(' 0.85 ')).toBe(0.85);
    expect(parseHeSo('1')).toBe(1);
    expect(parseHeSo(1.2)).toBe(1.2);
  });

  it('trống / chữ / âm / nhiều dấu → null', () => {
    for (const v of ['', '   ', 'abc', '-1', '1,2,3', '1.2.3', null, undefined, -0.5, Number.NaN]) {
      expect(parseHeSo(v)).toBeNull();
    }
  });

  it('làm tròn 4 chữ số thập phân', () => {
    expect(parseHeSo('0,123456')).toBe(0.1235);
  });
});

describe('buildHeSoGoiY', () => {
  it('khử trùng, sắp tăng dần; lấy hệ số lần gần nhất theo tên (không phân biệt hoa / khoảng trắng)', () => {
    const out = buildHeSoGoiY([
      { ten_pham_cap: ' CP ', he_so_quy_doi: '1.2000' },
      { ten_pham_cap: 'Nội địa', he_so_quy_doi: 0.85 },
      { ten_pham_cap: 'cp', he_so_quy_doi: 1.25 },
      { ten_pham_cap: 'Nải', he_so_quy_doi: 1 },
      { ten_pham_cap: 'Nải', he_so_quy_doi: null },
    ]);
    expect(out.options).toEqual([0.85, 1, 1.2, 1.25]);
    expect(out.ganNhatTheoPhamCap).toEqual({ cp: 1.2, 'nội địa': 0.85, 'nải': 1 });
  });

  it('lịch sử rỗng', () => {
    expect(buildHeSoGoiY([])).toEqual({ options: [], ganNhatTheoPhamCap: {} });
  });
});
