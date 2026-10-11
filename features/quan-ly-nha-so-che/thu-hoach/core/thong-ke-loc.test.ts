import { describe, expect, it } from 'vitest';
import type { FarmThuHoach } from './types';
import { traiPhangNgay } from './ngay-thu-hoach';
import { LOC_TRONG, docThamSo, ghiThamSo, locDongNgay } from './thong-ke-loc';

const dong = traiPhangNgay([
  // Tuần 18/2026: 27/04 … 03/05
  { nam: 2026, tuan: 18, id_chi_nhanh: '1', ke_hoach_t2: 10, thuc_te_t2: 12, ke_hoach_t5: 20, thuc_te_t5: 15 },
  { nam: 2026, tuan: 18, id_chi_nhanh: '2', ke_hoach_t2: 10, thuc_te_t2: 0 },
  { nam: 2026, tuan: 18, id_chi_nhanh: '3', ke_hoach_t3: 5, thuc_te_t3: 8 },
] as unknown as FarmThuHoach[]);

const tong = (ds: typeof dong) => ds.reduce((s, d) => s + d.keHoach, 0);

describe('locDongNgay', () => {
  it('khoảng ngày cắt giữa tuần: chỉ lấy các ô ngày nằm trong kỳ', () => {
    const kq = locDongNgay(dong, { ...LOC_TRONG, tuNgay: '2026-05-01', denNgay: '2026-05-31' });
    expect(kq.every((d) => d.ngay >= '2026-05-01')).toBe(true);
    expect(tong(kq)).toBe(0); // T5 = 30/04 nằm ngoài tháng 5
    expect(tong(locDongNgay(dong, { ...LOC_TRONG, tuNgay: '2026-04-30', denNgay: '2026-04-30' }))).toBe(20);
  });

  it('tình trạng lọc theo tổng cả kỳ của farm', () => {
    const farm = (tt: string[]) =>
      [...new Set(locDongNgay(dong, { ...LOC_TRONG, tinhTrang: tt }).map((d) => d.farmKey))];
    expect(farm(['thieu'])).toEqual(['1']); // 30 KH / 27 TT
    expect(farm(['chua_nhap'])).toEqual(['2']);
    expect(farm(['vuot'])).toEqual(['3']);
    // Kỳ chỉ còn Thứ 2 → farm 1 thành vượt.
    expect(
      [...new Set(locDongNgay(dong, { ...LOC_TRONG, tuNgay: '2026-04-27', denNgay: '2026-04-27', tinhTrang: ['vuot'] }).map((d) => d.farmKey))]
    ).toEqual(['1']);
  });
});

describe('ghiThamSo / docThamSo', () => {
  it('round-trip', () => {
    const loc = {
      cheDo: 'thang' as const,
      tuNgay: '2026-04-01',
      denNgay: '2026-06-30',
      nam: ['2026'],
      tuan: ['17', '18'],
      farm: ['1', '5'],
      tinhTrang: ['thieu'],
    };
    expect(docThamSo(new URLSearchParams(ghiThamSo(loc)))).toEqual(loc);
    expect(ghiThamSo(LOC_TRONG)).toBe('cd=thu');
  });

  it('bỏ giá trị sai', () => {
    const loc = docThamSo(new URLSearchParams('cd=x&tu=01/04/2026&tuan=a,3&tt=khac,dat'));
    expect(loc).toMatchObject({ cheDo: 'thu', tuNgay: '', tuan: ['3'], tinhTrang: ['dat'] });
  });
});
