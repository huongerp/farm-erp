import { describe, expect, it } from 'vitest';
import { docBcscTonDauNgay } from './ton-dau-ngay';

describe('docBcscTonDauNgay', () => {
  it('có phiếu trước: numeric dạng chuỗi → số, giữ tồn âm', () => {
    expect(docBcscTonDauNgay([{ co_phieu_truoc: true, ton_dau: '1000.0000', ngay_truoc: '2026-11-12' }])).toEqual({
      co_phieu_truoc: true,
      ton_dau: 1000,
      ngay_truoc: '2026-11-12',
    });
    expect(docBcscTonDauNgay([{ co_phieu_truoc: true, ton_dau: -9, ngay_truoc: '2026-11-05' }]).ton_dau).toBe(-9);
  });

  it('phiếu đầu tiên / rỗng / rác → không có phiếu trước (ô nhập tay)', () => {
    const khong = { co_phieu_truoc: false, ton_dau: 0, ngay_truoc: null };
    expect(docBcscTonDauNgay([{ co_phieu_truoc: false, ton_dau: 0, ngay_truoc: null }])).toEqual(khong);
    expect(docBcscTonDauNgay([])).toEqual(khong);
    expect(docBcscTonDauNgay(null)).toEqual(khong);
    expect(docBcscTonDauNgay([{ co_phieu_truoc: true, ton_dau: 'abc', ngay_truoc: '2026-11-12' }])).toEqual(khong);
  });
});
