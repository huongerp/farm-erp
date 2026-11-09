import { describe, it, expect } from 'vitest';
import { apTiLeLoiGsclVaoBcscForm, defaultFormValues } from './form-mappers';

describe('apTiLeLoiGsclVaoBcscForm', () => {
  it('ghép % nải lỗi QC vào đúng chỉ tiêu danh_gia_loi_qc_pct', () => {
    const values = { ...defaultFormValues(), danh_gia_loi_qc_pct: 1.5 };
    const out = apTiLeLoiGsclVaoBcscForm(values, 12.34);
    expect(out.danh_gia_loi_qc_pct).toBe(12.34);
  });

  it('không đụng các chỉ tiêu khác', () => {
    const values = { ...defaultFormValues(), tong_buong_so_che: 7, tong_luong: 1250 };
    const out = apTiLeLoiGsclVaoBcscForm(values, 5);
    expect(out.tong_buong_so_che).toBe(7);
    expect(out.tong_luong).toBe(1250);
    expect(out.so_lieu_row_meta).toBe(values.so_lieu_row_meta);
  });

  it('số GSCL undefined/null (đang tải) → giữ nguyên giá trị cũ của form', () => {
    const values = { ...defaultFormValues(), danh_gia_loi_qc_pct: 3.21 };
    expect(apTiLeLoiGsclVaoBcscForm(values, undefined).danh_gia_loi_qc_pct).toBe(3.21);
    expect(apTiLeLoiGsclVaoBcscForm(values, null)).toBe(values);
  });
});
