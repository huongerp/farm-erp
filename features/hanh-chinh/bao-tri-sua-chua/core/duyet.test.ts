import { describe, it, expect } from 'vitest';
import { thongTinDuyet } from './duyet';

const nv = { id: '12', hoTen: ' Lê Minh Công ' };
const now = new Date('2026-10-04T09:30:00Z');

describe('thongTinDuyet', () => {
  it('chờ duyệt → đã duyệt: ghi người bấm và thời điểm', () => {
    expect(thongTinDuyet('cho_duyet', 'da_duyet', nv, now)).toEqual({
      id_nguoi_duyet: '12',
      nguoi_duyet: 'Lê Minh Công',
      tg_duyet: '2026-10-04T09:30:00.000Z',
    });
  });

  it('không duyệt cũng ghi người từ chối', () => {
    expect(thongTinDuyet('cho_duyet', 'khong_duyet', nv, now)?.nguoi_duyet).toBe('Lê Minh Công');
  });

  it('đổi từ đã duyệt sang không duyệt: ghi người mới', () => {
    expect(thongTinDuyet('da_duyet', 'khong_duyet', { id: '7', hoTen: 'Trần B' }, now)?.id_nguoi_duyet).toBe('7');
  });

  it('quay về chờ duyệt: xoá thông tin duyệt', () => {
    expect(thongTinDuyet('da_duyet', 'cho_duyet', nv, now)).toEqual({
      id_nguoi_duyet: null,
      nguoi_duyet: null,
      tg_duyet: null,
    });
  });

  it('trạng thái không đổi hoặc không có: giữ nguyên (null)', () => {
    expect(thongTinDuyet('da_duyet', 'da_duyet', nv, now)).toBeNull();
    expect(thongTinDuyet('cho_duyet', undefined, nv, now)).toBeNull();
  });

  it('người dùng thiếu họ tên → tên null, vẫn ghi id', () => {
    expect(thongTinDuyet('cho_duyet', 'da_duyet', { id: '3', hoTen: '  ' }, now)).toMatchObject({
      id_nguoi_duyet: '3',
      nguoi_duyet: null,
    });
  });
});
