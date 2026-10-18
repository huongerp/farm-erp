import { describe, expect, it } from 'vitest';
import { tenFileAnToan } from './ten-file';

describe('tenFileAnToan', () => {
  it('bỏ dấu đầy đủ, đ → d, khoảng trắng → _', () => {
    expect(tenFileAnToan('FXK-0349 xuất')).toBe('FXK-0349_xuat');
    expect(tenFileAnToan('Đợt kiểm kê  tháng 10')).toBe('Dot_kiem_ke_thang_10');
  });

  it('bỏ ký tự không hợp lệ cho tên file', () => {
    expect(tenFileAnToan('PO/2026:01*?')).toBe('PO202601');
  });
});
