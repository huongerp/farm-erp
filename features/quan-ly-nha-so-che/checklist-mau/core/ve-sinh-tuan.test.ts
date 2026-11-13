import { describe, expect, it } from 'vitest';
import { dauTuan, kqKeTiep, lichVeSinh, moTaTanSuat, ngayCuaThu, parseTanSuat, soOChuaTich, tinhKqVeSinh } from './ve-sinh-tuan';

describe('dauTuan', () => {
  it('trả về thứ Hai, CN thuộc tuần trước đó', () => {
    expect(dauTuan('2026-11-14')).toBe('2026-11-09'); // T7
    expect(dauTuan('2026-11-09')).toBe('2026-11-09'); // T2
    expect(dauTuan('2026-11-15')).toBe('2026-11-09'); // CN
    expect(dauTuan('2026-01-01')).toBe('2025-12-29'); // qua năm
  });

  it('ngayCuaThu: CN = thứ Hai + 6', () => {
    expect(ngayCuaThu('2026-11-09', 8)).toBe('2026-11-15');
  });
});

describe('lichVeSinh', () => {
  const tuan = '2026-11-23'; // T2 23/11 → CN 29/11

  it('không có tần suất / hằng ngày = cả 7 ngày', () => {
    expect(lichVeSinh(null, tuan)).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(lichVeSinh({ kieu: 'hang_ngay' }, tuan)).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });

  it('theo thứ: lọc trùng, ngoài khoảng, sắp xếp', () => {
    expect(lichVeSinh({ kieu: 'thu', thu: [6, 2, 4, 2, 9] }, tuan)).toEqual([2, 4, 6]);
  });

  it('cuối tháng: chỉ tuần có thứ đó là lần cuối trong tháng', () => {
    // T7 28/11/2026 là T7 cuối tháng 11
    expect(lichVeSinh({ kieu: 'cuoi_thang', thu: 7 }, '2026-11-23')).toEqual([7]);
    expect(lichVeSinh({ kieu: 'cuoi_thang', thu: 7 }, '2026-11-16')).toEqual([]);
    // Tuần 30/11–06/12: T7 05/12 không phải cuối tháng 12
    expect(lichVeSinh({ kieu: 'cuoi_thang', thu: 7 }, '2026-11-30')).toEqual([]);
    // T2 30/11 là T2 cuối tháng 11 dù tuần vắt sang tháng 12
    expect(lichVeSinh({ kieu: 'cuoi_thang', thu: 2 }, '2026-11-30')).toEqual([2]);
  });
});

describe('tinhKqVeSinh', () => {
  it('thiếu ngày có lịch → null; ngày ngoài lịch không tính', () => {
    expect(tinhKqVeSinh([2, 4], { '2': 'dat', '3': 'dat' })).toBeNull();
    expect(soOChuaTich([2, 4], { '2': 'dat' })).toBe(1);
  });

  it('đủ ngày → Đạt, có một ngày K.Đạt → K.Đạt', () => {
    expect(tinhKqVeSinh([2, 4], { '2': 'dat', '4': 'dat' })).toBe('dat');
    expect(tinhKqVeSinh([2, 4], { '2': 'khong_dat', '4': 'dat' })).toBe('khong_dat');
  });

  it('lịch rỗng → null', () => {
    expect(tinhKqVeSinh([], {})).toBeNull();
  });
});

describe('kqKeTiep / moTaTanSuat / parseTanSuat', () => {
  it('bấm vòng trống → Đạt → K.Đạt → trống', () => {
    expect(kqKeTiep(null)).toBe('dat');
    expect(kqKeTiep('dat')).toBe('khong_dat');
    expect(kqKeTiep('khong_dat')).toBeNull();
  });

  it('mô tả tần suất', () => {
    const t = (k: string, o?: Record<string, unknown>) => (o ? `${k}:${String(o.thu)}` : k);
    expect(moTaTanSuat(null, t)).toBe('checklistMau.hangMuc.tanSuatKieu.hang_ngay');
    expect(moTaTanSuat({ kieu: 'thu', thu: [8, 2] }, t)).toBe('T2, CN');
    expect(moTaTanSuat({ kieu: 'cuoi_thang', thu: 7 }, t)).toBe('checklistMau.hangMuc.cuoiThangMoTa:T7');
  });

  it('parse jsonb sai dạng → null', () => {
    expect(parseTanSuat(null)).toBeNull();
    expect(parseTanSuat({ kieu: 'abc' })).toBeNull();
    expect(parseTanSuat({ kieu: 'thu', thu: ['2', 5, 10] })).toEqual({ kieu: 'thu', thu: [2, 5] });
    expect(parseTanSuat({ kieu: 'cuoi_thang', thu: 7 })).toEqual({ kieu: 'cuoi_thang', thu: 7 });
  });
});
