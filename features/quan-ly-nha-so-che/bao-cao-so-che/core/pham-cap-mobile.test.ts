import { describe, it, expect } from 'vitest';
import { buildPhamCapMobileCards, buildPhamCapMobileTotalFields } from './pham-cap-mobile';
import { enrichPhamCapRowsWithDerived } from './pham-cap-derived';
import type { FarmBaoCaoSoChePhamCapRow } from './pham-cap';

const rows: FarmBaoCaoSoChePhamCapRow[] = [
  { ten_pham_cap: 'Nải', so_tham_chieu: 13, so_thung: 10, so_thung_quy_doi: 10, ghi_chu: ' lô A ', thu_tu: 1 },
  { ten_pham_cap: 'CP', so_tham_chieu: 0, so_thung: 0, so_thung_quy_doi: 0, ghi_chu: '', thu_tu: 2 },
];

describe('buildPhamCapMobileCards', () => {
  const derived = enrichPhamCapRowsWithDerived(rows);

  it('ô SL phiếu nhập chỉ có khi có dữ liệu đối chiếu; ghi chú được trim', () => {
    const cards = buildPhamCapMobileCards(rows, derived, { 'nải': 12 }, false);
    expect(cards[0].fields.map((f) => f.key)).toEqual(['soKg', 'phieuNhap', 'soThung', 'tongKg', 'tyLe', 'quyDoi']);
    expect(cards[1].fields.map((f) => f.key)).not.toContain('phieuNhap');
    expect(cards[0].ghiChu).toBe('lô A');
  });

  it('cảnh báo khi số thùng lệch phiếu nhập; không cảnh báo khi bằng hoặc bằng 0', () => {
    const lech = buildPhamCapMobileCards(rows, derived, { 'nải': 12 }, false);
    expect(lech[0].fields.find((f) => f.key === 'soThung')?.warn).toBe(true);
    const khop = buildPhamCapMobileCards(rows, derived, { 'nải': 10 }, false);
    expect(khop[0].fields.find((f) => f.key === 'soThung')?.warn).toBe(false);
  });

  it('đang tải → ô phiếu nhập value null; tổng kg và tỷ lệ lấy từ derived', () => {
    const cards = buildPhamCapMobileCards(rows, derived, undefined, true);
    expect(cards[0].fields.find((f) => f.key === 'phieuNhap')?.value).toBeNull();
    expect(cards[0].fields.find((f) => f.key === 'tongKg')?.value).toBe(130);
    expect(cards[0].fields.find((f) => f.key === 'tyLe')).toMatchObject({ value: 100, pct: true });
  });
});

describe('buildPhamCapMobileTotalFields', () => {
  it('đang tải → null, ngược lại là tổng phiếu nhập', () => {
    const totals = { so_thung: 10, tong_kg: 130, ty_le_pct: 100, so_thung_quy_doi: 10 };
    expect(buildPhamCapMobileTotalFields(totals, 12, true)[0].value).toBeNull();
    expect(buildPhamCapMobileTotalFields(totals, 12, false)[0].value).toBe(12);
  });
});
