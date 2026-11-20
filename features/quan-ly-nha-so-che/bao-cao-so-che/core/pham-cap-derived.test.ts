import { describe, it, expect } from 'vitest';
import { phamCapTongQuyDoiRow, sumPhamCapDisplayTotals } from './pham-cap-derived';
import type { PhamCapRowFormValues } from './pham-cap';

const row = (p: Partial<PhamCapRowFormValues>): PhamCapRowFormValues => ({
  ten_pham_cap: 'X',
  so_tham_chieu: 13,
  so_thung: 0,
  so_thung_quy_doi: 0,
  he_so_quy_doi: null,
  ghi_chu: '',
  ...p,
});

describe('phamCapTongQuyDoiRow', () => {
  it('có hệ số → số thùng × hệ số (bỏ qua số đã lưu)', () => {
    expect(phamCapTongQuyDoiRow(row({ so_thung: 151, he_so_quy_doi: 1.2, so_thung_quy_doi: 151 }))).toBe(181.2);
    expect(phamCapTongQuyDoiRow(row({ so_thung: 78, he_so_quy_doi: 0.85 }))).toBe(66.3);
    expect(phamCapTongQuyDoiRow(row({ so_thung: 45, he_so_quy_doi: 0 }))).toBe(0);
  });

  it('hệ số trống (phiếu cũ) → giữ tổng quy đổi đã nhập tay', () => {
    expect(phamCapTongQuyDoiRow(row({ so_thung: 151, so_thung_quy_doi: 160 }))).toBe(160);
    expect(phamCapTongQuyDoiRow({ so_thung: 10, so_thung_quy_doi: 7 })).toBe(7);
  });
});

describe('sumPhamCapDisplayTotals', () => {
  it('cộng tổng quy đổi theo công thức, trộn dòng có / không hệ số', () => {
    const totals = sumPhamCapDisplayTotals([
      row({ so_thung: 240, he_so_quy_doi: 1 }),
      row({ so_thung: 151, he_so_quy_doi: 1.2 }),
      row({ so_thung: 78, he_so_quy_doi: 0.85 }),
      row({ so_thung: 45, he_so_quy_doi: 0.5 }),
      row({ so_thung: 10, so_thung_quy_doi: 9 }),
    ]);
    expect(totals.so_thung_quy_doi).toBe(240 + 181.2 + 66.3 + 22.5 + 9);
    expect(totals.so_thung).toBe(524);
  });
});
