import { describe, it, expect } from 'vitest';
import { nhomNgayCua, nhomTheoNgay, nhanThoiGian } from './nhom-theo-ngay';
import type { ThongBao } from './types';

/** 18/09/2026 lúc 10:00 giờ địa phương. */
const BAY_GIO = new Date(2026, 8, 18, 10, 0, 0);

function tb(id: string, tgTao: Date): ThongBao {
  return {
    id,
    moduleId: 'kho-van/phieu-kho',
    loaiSuKien: 'phieu.cho_duyet',
    muc: 'thuong',
    tieuDe: 'x',
    noiDung: null,
    link: null,
    daDoc: false,
    soLan: 1,
    tgTao: tgTao.toISOString(),
  };
}

describe('nhomNgayCua', () => {
  it('cùng ngày là hôm nay, kể cả lúc rạng sáng', () => {
    expect(nhomNgayCua(new Date(2026, 8, 18, 9, 0).toISOString(), BAY_GIO)).toBe('homNay');
    expect(nhomNgayCua(new Date(2026, 8, 18, 0, 5).toISOString(), BAY_GIO)).toBe('homNay');
  });

  it('23h hôm qua là hôm qua dù chỉ cách 11 tiếng', () => {
    expect(nhomNgayCua(new Date(2026, 8, 17, 23, 0).toISOString(), BAY_GIO)).toBe('homQua');
  });

  it('cách hai ngày trở lên là trước đó', () => {
    expect(nhomNgayCua(new Date(2026, 8, 16, 23, 59).toISOString(), BAY_GIO)).toBe('truocDo');
  });

  it('vắt qua đầu tháng vẫn đúng', () => {
    const mocDauThang = new Date(2026, 8, 1, 8, 0);
    expect(nhomNgayCua(new Date(2026, 7, 31, 22, 0).toISOString(), mocDauThang)).toBe('homQua');
  });

  it('mốc tương lai do lệch đồng hồ vẫn xếp vào hôm nay, không văng ra trước đó', () => {
    expect(nhomNgayCua(new Date(2026, 8, 18, 23, 0).toISOString(), BAY_GIO)).toBe('homNay');
  });

  it('chuỗi ngày hỏng thì xếp cuối thay vì ném lỗi', () => {
    expect(nhomNgayCua('không-phải-ngày', BAY_GIO)).toBe('truocDo');
  });
});

describe('nhomTheoNgay', () => {
  it('giữ nguyên thứ tự đầu vào trong từng nhóm', () => {
    const ds = [
      tb('1', new Date(2026, 8, 18, 9, 0)),
      tb('2', new Date(2026, 8, 18, 8, 0)),
      tb('3', new Date(2026, 8, 17, 15, 0)),
    ];
    const kq = nhomTheoNgay(ds, BAY_GIO);
    expect(kq[0]!.nhom).toBe('homNay');
    expect(kq[0]!.items.map((x) => x.id)).toEqual(['1', '2']);
    expect(kq[1]!.nhom).toBe('homQua');
  });

  it('bỏ nhóm rỗng', () => {
    const kq = nhomTheoNgay([tb('1', new Date(2026, 8, 10, 9, 0))], BAY_GIO);
    expect(kq).toHaveLength(1);
    expect(kq[0]!.nhom).toBe('truocDo');
  });

  it('danh sách rỗng trả mảng rỗng', () => {
    expect(nhomTheoNgay([], BAY_GIO)).toEqual([]);
  });
});

describe('nhanThoiGian', () => {
  const t = (key: string, opts?: Record<string, unknown>) =>
    opts && 'count' in opts ? `${key}:${opts['count']}` : key;

  it('dưới một phút thì nói vừa xong', () => {
    expect(nhanThoiGian(new Date(BAY_GIO.getTime() - 30_000).toISOString(), t, BAY_GIO)).toBe(
      'notification.time.justNow'
    );
  });

  it('đếm phút, giờ, ngày đúng mốc', () => {
    expect(nhanThoiGian(new Date(BAY_GIO.getTime() - 5 * 60_000).toISOString(), t, BAY_GIO)).toBe(
      'notification.time.minutes:5'
    );
    expect(nhanThoiGian(new Date(BAY_GIO.getTime() - 3 * 3_600_000).toISOString(), t, BAY_GIO)).toBe(
      'notification.time.hours:3'
    );
    expect(nhanThoiGian(new Date(BAY_GIO.getTime() - 2 * 86_400_000).toISOString(), t, BAY_GIO)).toBe(
      'notification.time.days:2'
    );
  });

  it('ngày hỏng thì trả chuỗi rỗng', () => {
    expect(nhanThoiGian('xxx', t, BAY_GIO)).toBe('');
  });
});
