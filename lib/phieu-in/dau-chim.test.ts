import { describe, expect, it } from 'vitest';
import { loaiDauChim, loaiDauChimNhieu } from './dau-chim';

describe('loaiDauChim', () => {
  it('nhận mã và nhãn tiếng Việt', () => {
    expect(loaiDauChim('draft')).toBe('nhap');
    expect(loaiDauChim('Nháp')).toBe('nhap');
    expect(loaiDauChim('cho_duyet')).toBe('choDuyet');
    expect(loaiDauChim('Chờ duyệt')).toBe('choDuyet');
    expect(loaiDauChim('Đợi duyệt')).toBe('choDuyet');
    expect(loaiDauChim('cho_quan_ly_duyet')).toBe('choDuyet');
    expect(loaiDauChim('pending')).toBe('choDuyet');
    expect(loaiDauChim('Đã hủy')).toBe('daHuy');
    expect(loaiDauChim('huy')).toBe('daHuy');
    expect(loaiDauChim('cancelled')).toBe('daHuy');
    expect(loaiDauChim('Không duyệt')).toBe('khongDuyet');
    expect(loaiDauChim('rejected')).toBe('khongDuyet');
    expect(loaiDauChim('Từ chối')).toBe('khongDuyet');
  });

  it('bản chính thức / lạ / rỗng → null', () => {
    expect(loaiDauChim('Đã duyệt')).toBeNull();
    expect(loaiDauChim('approved')).toBeNull();
    expect(loaiDauChim('hoan_thanh')).toBeNull();
    expect(loaiDauChim('')).toBeNull();
    expect(loaiDauChim(null)).toBeNull();
  });
});

describe('loaiDauChimNhieu', () => {
  it('lấy loại nặng nhất', () => {
    expect(loaiDauChimNhieu('approved', 'pending')).toBe('choDuyet');
    expect(loaiDauChimNhieu('pending', 'rejected')).toBe('khongDuyet');
    expect(loaiDauChimNhieu('huy', 'draft')).toBe('daHuy');
    expect(loaiDauChimNhieu('approved', null)).toBeNull();
  });
});
