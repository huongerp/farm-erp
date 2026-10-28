import { describe, expect, it } from 'vitest';
import {
  cacNgayCuaTuanFarm,
  cacNgayTrongKhoang,
  cacTuanQuanh,
  docKhoaTuanFarm,
  khoangTuanFarm,
  khoaTuanFarm,
  ngayDauTuanFarm,
  nhanTuanFarm,
  soTuanTrongNamFarm,
  tuanChichBapTuThuHoach,
  tuanFarmCuaNgay,
  tuanKeTiep,
  tuanThuHoachTuChichBap,
} from './tuan';

describe('tuần farm', () => {
  it('các mốc bắt buộc', () => {
    expect(tuanFarmCuaNgay('2025-12-29')).toEqual({ nam: 2026, tuan: 1 });
    expect(tuanFarmCuaNgay('2026-08-24')).toEqual({ nam: 2026, tuan: 35 });
    expect(tuanFarmCuaNgay('2026-10-26')).toEqual({ nam: 2026, tuan: 44 });
    expect(tuanFarmCuaNgay('2026-12-27')).toEqual({ nam: 2026, tuan: 52 });
    expect(tuanFarmCuaNgay('2026-12-28')).toEqual({ nam: 2027, tuan: 1 });
    expect(tuanFarmCuaNgay('2027-01-03')).toEqual({ nam: 2027, tuan: 1 });
    expect(tuanFarmCuaNgay('2027-01-04')).toEqual({ nam: 2027, tuan: 2 });
  });

  it('thứ Hai đầu tuần + 7 ngày của tuần, khớp ngược với tuanFarmCuaNgay', () => {
    expect(ngayDauTuanFarm(2026, 1)).toBe('2025-12-29');
    expect(ngayDauTuanFarm(2026, 35)).toBe('2026-08-24');
    expect(ngayDauTuanFarm(2027, 1)).toBe('2026-12-28');
    expect(cacNgayCuaTuanFarm(2027, 1)).toEqual([
      '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03',
    ]);
    for (const ngay of cacNgayTrongKhoang('2025-12-20', '2027-01-10')) {
      const t = tuanFarmCuaNgay(ngay);
      expect(cacNgayCuaTuanFarm(t.nam, t.tuan)).toContain(ngay);
    }
  });

  it('số tuần trong năm: 2026 có 52, 2028 có 53 (01/01/2029 là thứ Hai)', () => {
    expect(soTuanTrongNamFarm(2026)).toBe(52);
    expect(soTuanTrongNamFarm(2028)).toBe(53);
    expect(tuanFarmCuaNgay('2028-12-31')).toEqual({ nam: 2028, tuan: 53 });
  });

  it('tuần kế tiếp qua năm; lùi được', () => {
    expect(tuanKeTiep({ nam: 2026, tuan: 52 })).toEqual({ nam: 2027, tuan: 1 });
    expect(tuanKeTiep({ nam: 2027, tuan: 1 }, -1)).toEqual({ nam: 2026, tuan: 52 });
  });

  it('chích bắp +9 tuần = thu hoạch, −9 ngược lại, qua năm', () => {
    expect(tuanThuHoachTuChichBap({ nam: 2026, tuan: 35 })).toEqual({ nam: 2026, tuan: 44 });
    expect(tuanThuHoachTuChichBap({ nam: 2026, tuan: 43 })).toEqual({ nam: 2026, tuan: 52 });
    expect(tuanThuHoachTuChichBap({ nam: 2026, tuan: 44 })).toEqual({ nam: 2027, tuan: 1 });
    expect(tuanChichBapTuThuHoach({ nam: 2027, tuan: 1 })).toEqual({ nam: 2026, tuan: 44 });
    expect(tuanChichBapTuThuHoach({ nam: 2026, tuan: 44 })).toEqual({ nam: 2026, tuan: 35 });
  });

  it('nhãn tuần', () => {
    expect(khoangTuanFarm({ nam: 2026, tuan: 35 })).toBe('24/08 – 30/08');
    expect(nhanTuanFarm({ nam: 2026, tuan: 35 })).toBe('Tuần 35 (24/08 – 30/08)');
  });

  it('dải tuần quanh một tuần (−4 … +2) qua năm', () => {
    expect(cacTuanQuanh({ nam: 2027, tuan: 2 }, 4, 2)).toEqual([
      { nam: 2026, tuan: 50 },
      { nam: 2026, tuan: 51 },
      { nam: 2026, tuan: 52 },
      { nam: 2027, tuan: 1 },
      { nam: 2027, tuan: 2 },
      { nam: 2027, tuan: 3 },
      { nam: 2027, tuan: 4 },
    ]);
  });

  it('khoá tuần cho bộ lọc: ghi ↔ đọc, sai dạng / tuần không có → null', () => {
    expect(khoaTuanFarm({ nam: 2026, tuan: 4 })).toBe('2026-04');
    expect(docKhoaTuanFarm('2026-04')).toEqual({ nam: 2026, tuan: 4 });
    expect(docKhoaTuanFarm('2028-53')).toEqual({ nam: 2028, tuan: 53 });
    expect(docKhoaTuanFarm('2026-53')).toBeNull();
    expect(docKhoaTuanFarm('44')).toBeNull();
  });

  it('khoảng ngày gồm cả hai đầu, ngược chiều → rỗng', () => {
    expect(cacNgayTrongKhoang('2026-02-27', '2026-03-01')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
    expect(cacNgayTrongKhoang('2026-03-02', '2026-03-01')).toEqual([]);
  });
});
