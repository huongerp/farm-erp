import { describe, expect, it } from 'vitest';
import { apTongThuDgdvVaoDuBaoForm, computeKpiFromForm, defaultFormValues } from './form-mappers';

const base = {
  ...defaultFormValues(),
  ngay: '2026-10-27',
  id_chi_nhanh: '1',
  so_buong_can_mau: 10,
  tong_can_nang_mau: 250, // 25 kg/buồng
  tong_buong_nhap_thuc_te: 40, // số cũ đã lưu
  ty_le_thu_hoi_thuc_te_pct: 80,
  quy_cach_dong_thung_thuc_te: 13,
};

describe('apTongThuDgdvVaoDuBaoForm', () => {
  it('dòng 10 = Tổng thu Đánh giá đầu vào, dòng 11/13/15 tính lại theo số này', () => {
    const v = apTongThuDgdvVaoDuBaoForm(base, 100);
    expect(v.tong_buong_nhap_thuc_te).toBe(100);
    const kpi = computeKpiFromForm(v);
    expect(kpi.tong_khoi_luong_thuc_te).toBe(2500);
    expect(kpi.khoi_luong_dong_thung_thuc_te).toBe(2000);
    expect(kpi.tong_so_thung_thuc_te).toBe(154); // 2000 / 13 = 153,8 → 154
  });

  it('Tổng thu = 0 (không có phiếu) vẫn ghi đè số cũ', () => {
    expect(apTongThuDgdvVaoDuBaoForm(base, 0).tong_buong_nhap_thuc_te).toBe(0);
  });

  it('chưa có số (null/undefined) → giữ số đã lưu', () => {
    expect(apTongThuDgdvVaoDuBaoForm(base, null)).toBe(base);
    expect(apTongThuDgdvVaoDuBaoForm(base, undefined)).toBe(base);
  });
});
