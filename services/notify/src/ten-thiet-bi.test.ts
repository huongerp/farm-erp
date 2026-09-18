import { describe, it, expect } from 'vitest';
import { doanTenThietBi } from './ten-thiet-bi.ts';

describe('doanTenThietBi', () => {
  it('không có user agent thì trả null', () => {
    expect(doanTenThietBi(null)).toBeNull();
  });

  it('nhận đúng Chrome trên Windows', () => {
    expect(
      doanTenThietBi('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36')
    ).toBe('Chrome trên Windows');
  });

  it('Edge không bị nhận nhầm thành Chrome', () => {
    expect(
      doanTenThietBi('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/140.0 Safari/537.36 Edg/140.0')
    ).toBe('Edge trên Windows');
  });

  it('Safari trên iPhone — trường hợp quan trọng nhất vì iOS mới hỗ trợ push', () => {
    expect(
      doanTenThietBi('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1')
    ).toBe('Safari trên iPhone');
  });

  it('Firefox trên Android', () => {
    expect(doanTenThietBi('Mozilla/5.0 (Android 14; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0')).toBe(
      'Firefox trên Android'
    );
  });

  it('chuỗi lạ vẫn ra nhãn đọc được, không ném lỗi', () => {
    expect(doanTenThietBi('curl/8.0')).toBe('Trình duyệt trên thiết bị không rõ');
  });
});
