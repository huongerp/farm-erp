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

const khongTon = { ton_dau: 0, ton_cuoi: 0 };

describe('apTongThuDgdvVaoDuBaoForm', () => {
  it('dòng 10 = tồn đầu + Tổng thu ĐGĐV − tồn cuối, dòng 11/13/15 tính lại theo số này', () => {
    const v = apTongThuDgdvVaoDuBaoForm(base, 90, { ton_dau: 20, ton_cuoi: 10 });
    expect(v.tong_buong_nhap_thuc_te).toBe(100);
    const kpi = computeKpiFromForm(v);
    expect(kpi.tong_khoi_luong_thuc_te).toBe(2500);
    expect(kpi.khoi_luong_dong_thung_thuc_te).toBe(2000);
    expect(kpi.tong_so_thung_thuc_te).toBe(154); // 2000 / 13 = 153,8 → 154
  });

  it('số thật: fp1 29/10 = 55 + 506 − 0 = 561; fp3 29/10 = 105 + 814 − 231 = 688', () => {
    expect(apTongThuDgdvVaoDuBaoForm(base, 506, { ton_dau: 55, ton_cuoi: 0 }).tong_buong_nhap_thuc_te).toBe(561);
    expect(apTongThuDgdvVaoDuBaoForm(base, 814, { ton_dau: 105, ton_cuoi: 231 }).tong_buong_nhap_thuc_te).toBe(688);
  });

  it('chưa có Báo cáo sơ chế (tồn 0) → bằng Tổng thu; Tổng thu 0 vẫn ghi đè số cũ', () => {
    expect(apTongThuDgdvVaoDuBaoForm(base, 506, khongTon).tong_buong_nhap_thuc_te).toBe(506);
    expect(apTongThuDgdvVaoDuBaoForm(base, 0, khongTon).tong_buong_nhap_thuc_te).toBe(0);
  });

  it('tồn cuối lớn hơn tồn đầu + thu → 0, không âm', () => {
    expect(apTongThuDgdvVaoDuBaoForm(base, 10, { ton_dau: 0, ton_cuoi: 30 }).tong_buong_nhap_thuc_te).toBe(0);
  });

  it('thiếu Tổng thu hoặc tồn (null/undefined) → giữ số đã lưu', () => {
    expect(apTongThuDgdvVaoDuBaoForm(base, null, khongTon)).toBe(base);
    expect(apTongThuDgdvVaoDuBaoForm(base, undefined, khongTon)).toBe(base);
    expect(apTongThuDgdvVaoDuBaoForm(base, 100, null)).toBe(base);
    expect(apTongThuDgdvVaoDuBaoForm(base, 100, undefined)).toBe(base);
  });
});
