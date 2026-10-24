import { describe, expect, it } from 'vitest';
import { docLoaiIn, taoUrlPreview } from './mau-in';

describe('mẫu in báo cáo sơ chế', () => {
  it('URL preview ⇄ loại', () => {
    const url = taoUrlPreview('12', 'pham-cap-kpi');
    expect(url).toBe('/quan-ly-nha-so-che/bao-cao-so-che/preview/12?loai=pham-cap-kpi');
    expect(docLoaiIn(new URL(url, 'http://x').searchParams)).toBe('pham-cap-kpi');
  });

  it('thiếu hoặc lạ → tổng hợp', () => {
    expect(docLoaiIn(new URLSearchParams())).toBe('tong-hop');
    expect(docLoaiIn(new URLSearchParams('loai=xyz'))).toBe('tong-hop');
  });
});
