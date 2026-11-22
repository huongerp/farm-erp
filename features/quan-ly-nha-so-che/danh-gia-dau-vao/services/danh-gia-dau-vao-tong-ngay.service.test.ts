import { describe, expect, it, vi } from 'vitest';

// Service gọi db thật — chỉ test phần đọc/kiểm tham số thuần, không dựng PostgREST client.
vi.mock('../../../../lib/db', () => ({ db: {}, fetchAllRows: vi.fn(), throwDbError: vi.fn() }));

import { docDgdvCanMauNgay, docDgdvTongNgay, idChiNhanhChoRpc } from './danh-gia-dau-vao-tong-ngay.service';

describe('docDgdvTongNgay', () => {
  it('đọc mảng 1 dòng, bigint dạng chuỗi', () => {
    expect(docDgdvTongNgay([{ tong_thu: '1250', ksc: '17' }])).toEqual({ tong_thu: 1250, ksc: 17 });
  });

  it('đọc object đơn', () => {
    expect(docDgdvTongNgay({ tong_thu: 8, ksc: 0 })).toEqual({ tong_thu: 8, ksc: 0 });
  });

  it('không có dòng / null / rác → 0', () => {
    expect(docDgdvTongNgay([])).toEqual({ tong_thu: 0, ksc: 0 });
    expect(docDgdvTongNgay(null)).toEqual({ tong_thu: 0, ksc: 0 });
    expect(docDgdvTongNgay([{ tong_thu: 'abc', ksc: null }])).toEqual({ tong_thu: 0, ksc: 0 });
  });
});

describe('docDgdvCanMauNgay', () => {
  it('mảng rỗng → 0, 0, không áp dụng', () => {
    expect(docDgdvCanMauNgay([])).toEqual({ so_buong: 0, tong_kg: 0, ap_dung: false });
  });

  it('đọc 1 dòng, bigint / numeric dạng chuỗi', () => {
    expect(docDgdvCanMauNgay([{ so_buong: '12', tong_kg: '218.4', ap_dung: true }])).toEqual({
      so_buong: 12,
      tong_kg: 218.4,
      ap_dung: true,
    });
  });

  it('null → 0, 0, không áp dụng', () => {
    expect(docDgdvCanMauNgay(null)).toEqual({ so_buong: 0, tong_kg: 0, ap_dung: false });
  });
});

describe('idChiNhanhChoRpc', () => {
  it('nhận id số dương', () => {
    expect(idChiNhanhChoRpc('12')).toBe(12);
    expect(idChiNhanhChoRpc(3)).toBe(3);
  });

  it('rỗng / không phải số nguyên dương → null (không gọi RPC)', () => {
    expect(idChiNhanhChoRpc('')).toBeNull();
    expect(idChiNhanhChoRpc('  ')).toBeNull();
    expect(idChiNhanhChoRpc(null)).toBeNull();
    expect(idChiNhanhChoRpc(undefined)).toBeNull();
    expect(idChiNhanhChoRpc('abc')).toBeNull();
    expect(idChiNhanhChoRpc('0')).toBeNull();
    expect(idChiNhanhChoRpc('1.5')).toBeNull();
  });
});
