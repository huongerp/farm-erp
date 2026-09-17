import { describe, expect, it } from 'vitest';
import { parseTraoDoiGanNhat } from './trao-doi-gan-nhat';

describe('parseTraoDoiGanNhat', () => {
  it('trả null khi log rỗng hoặc chỉ có khoảng trắng', () => {
    expect(parseTraoDoiGanNhat(null)).toBeNull();
    expect(parseTraoDoiGanNhat(undefined)).toBeNull();
    expect(parseTraoDoiGanNhat('')).toBeNull();
    expect(parseTraoDoiGanNhat('   \n\n  ')).toBeNull();
  });

  it('lấy dòng cuối cùng khi log nhiều dòng', () => {
    const log = [
      '[2026-09-10T03:00:00.000Z] Chuyển tiến độ sang: Chờ báo giá. Ghi chú: —',
      '[2026-09-17T07:30:00.000Z] Chuyển tiến độ sang: Đã đặt hàng. Ngày cần: 2026-09-20. Ghi chú: chờ NCC',
    ].join('\n');
    expect(parseTraoDoiGanNhat(log)).toEqual({
      timestamp: '2026-09-17T07:30:00.000Z',
      noiDung: 'Chuyển tiến độ sang: Đã đặt hàng. Ngày cần: 2026-09-20. Ghi chú: chờ NCC',
    });
  });

  it('bỏ qua dòng trống ở cuối log', () => {
    const log = '[2026-09-17T07:30:00.000Z] Đã đặt hàng\n\n   \n';
    expect(parseTraoDoiGanNhat(log)?.noiDung).toBe('Đã đặt hàng');
  });

  it('coi cả dòng là nội dung khi không có timestamp', () => {
    expect(parseTraoDoiGanNhat('Ghi chú tay của người duyệt')).toEqual({
      timestamp: null,
      noiDung: 'Ghi chú tay của người duyệt',
    });
  });

  it('coi cả dòng là nội dung khi ngoặc vuông không phải ngày hợp lệ', () => {
    expect(parseTraoDoiGanNhat('[quan trọng] Kiểm tra lại số lượng')).toEqual({
      timestamp: null,
      noiDung: '[quan trọng] Kiểm tra lại số lượng',
    });
  });

  it('giữ timestamp nhưng nội dung rỗng khi dòng chỉ có timestamp', () => {
    expect(parseTraoDoiGanNhat('[2026-09-17T07:30:00.000Z]')).toEqual({
      timestamp: '2026-09-17T07:30:00.000Z',
      noiDung: '',
    });
  });
});
