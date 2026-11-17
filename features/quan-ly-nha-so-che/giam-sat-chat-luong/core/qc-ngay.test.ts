import { describe, it, expect } from 'vitest';
import { docQcNgay } from './qc-ngay';

describe('docQcNgay', () => {
  it('đủ thùng: giữ % (numeric dạng chuỗi cũng đọc được)', () => {
    expect(docQcNgay({ so_thung: 55, toi_thieu: 50, ap_dung: true, ti_le: '0.93' })).toEqual({
      so_thung: 55,
      toi_thieu: 50,
      ap_dung: true,
      ti_le: 0.93,
    });
  });

  it('thiếu thùng: ti_le null giữ null, KHÔNG thành 0', () => {
    expect(docQcNgay({ so_thung: 30, toi_thieu: 50, ap_dung: true, ti_le: null }).ti_le).toBeNull();
  });

  it('ti_le 0 hợp lệ (đủ thùng, không lỗi) vẫn là 0', () => {
    expect(docQcNgay({ so_thung: 60, toi_thieu: 50, ap_dung: true, ti_le: 0 }).ti_le).toBe(0);
  });

  it('dữ liệu hỏng → chưa có thùng, ti_le null', () => {
    expect(docQcNgay(null)).toEqual({ so_thung: 0, toi_thieu: 0, ap_dung: false, ti_le: null });
  });
});
