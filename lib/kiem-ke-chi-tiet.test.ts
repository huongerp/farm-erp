import { describe, it, expect } from 'vitest';
import { locChiTietKiemKe, timDongChuaKiemTiepTheo, type DongKiemKeTimLoc } from './kiem-ke-chi-tiet';

const ROWS: DongKiemKeTimLoc[] = [
  { id: '1', ket_qua: 'khop', ten_hang: 'Phân bón NPK', ma_hang: 'PB01', ten_kho: 'Kho Đà Lạt' },
  { id: '2', ket_qua: 'chua_kiem', ten_hang: 'Thuốc trừ sâu', ma_hang: 'TS02', ten_kho: 'Kho Đà Lạt' },
  { id: '3', ket_qua: 'thieu', ten_hang: 'Phân hữu cơ', ma_hang: 'PB03', ten_kho: 'Kho Bảo Lộc' },
  { id: '4', ket_qua: 'chua_kiem', ten_hang: 'Vôi bột', ma_hang: 'VB04', ten_kho: 'Kho Bảo Lộc' },
];

describe('locChiTietKiemKe', () => {
  it('không có điều kiện thì trả nguyên danh sách', () => {
    expect(locChiTietKiemKe(ROWS, { q: '  ', ketQua: null })).toBe(ROWS);
  });

  it('tìm bỏ dấu, mọi từ phải khớp dù nằm ở hai cột khác nhau', () => {
    expect(locChiTietKiemKe(ROWS, { q: 'phan bao loc', ketQua: null }).map((r) => r.id)).toEqual(['3']);
    expect(locChiTietKiemKe(ROWS, { q: 'ts02', ketQua: null }).map((r) => r.id)).toEqual(['2']);
  });

  it('lọc theo kết quả kết hợp với từ khoá', () => {
    expect(locChiTietKiemKe(ROWS, { q: '', ketQua: 'chua_kiem' }).map((r) => r.id)).toEqual(['2', '4']);
    expect(locChiTietKiemKe(ROWS, { q: 'da lat', ketQua: 'chua_kiem' }).map((r) => r.id)).toEqual(['2']);
  });
});

describe('timDongChuaKiemTiepTheo', () => {
  it('bỏ qua dòng đã kiểm, lấy dòng chưa kiểm kế tiếp', () => {
    expect(timDongChuaKiemTiepTheo(ROWS, '1')?.id).toBe('2');
    expect(timDongChuaKiemTiepTheo(ROWS, '2')?.id).toBe('4');
  });

  it('hết phía dưới thì vòng lên đầu', () => {
    expect(timDongChuaKiemTiepTheo(ROWS, '4')?.id).toBe('2');
  });

  it('không bao giờ trả lại chính dòng vừa lưu', () => {
    const chiMotDong = ROWS.filter((r) => r.id === '2');
    expect(timDongChuaKiemTiepTheo(chiMotDong, '2')).toBeNull();
  });

  it('dòng hiện tại đã bị lọc khỏi danh sách thì bắt đầu từ đầu', () => {
    expect(timDongChuaKiemTiepTheo(ROWS, 'x')?.id).toBe('2');
  });

  it('không còn dòng chưa kiểm thì null', () => {
    expect(timDongChuaKiemTiepTheo(ROWS.filter((r) => r.ket_qua !== 'chua_kiem'), '1')).toBeNull();
  });
});
