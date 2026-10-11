import { describe, expect, it } from 'vitest';
import type { FarmThuHoach } from './types';
import { traiPhangNgay } from './ngay-thu-hoach';
import { pivotThongKe, tinhTrangDatKh } from './stats-pivot';

function banGhi(p: Partial<FarmThuHoach>): FarmThuHoach {
  return { nam: 2026, tuan: 18, id_chi_nhanh: '1', ten_chi_nhanh: 'NSC fp1', ...p } as FarmThuHoach;
}

// Tuần 18/2026 = 27/04 (T2) … 03/05 (CN): T2–T5 thuộc tháng 4, T6–CN thuộc tháng 5.
const dong = traiPhangNgay([
  banGhi({ ke_hoach_t2: 10, thuc_te_t2: 12, ke_hoach_t5: 20, thuc_te_t5: 15, ke_hoach_cn: 5, thuc_te_cn: 5 }),
  banGhi({ tuan: 19, id_chi_nhanh: '2', ten_chi_nhanh: 'NSC fp2', ke_hoach_t3: 7, thuc_te_t3: 9 }),
]);

describe('pivotThongKe', () => {
  it('theo tháng: tuần vắt tháng tách đúng theo ngày lịch', () => {
    const p = pivotThongKe(dong, 'thang');
    expect(p.cot.map((c) => c.key)).toEqual(['2026-04', '2026-05']);
    expect(p.matrix.get('1')!.get('2026-04')).toEqual({ keHoach: 30, thucTe: 27 });
    expect(p.matrix.get('1')!.get('2026-05')).toEqual({ keHoach: 5, thucTe: 5 });
    expect(p.matrix.get('2')!.get('2026-05')).toEqual({ keHoach: 7, thucTe: 9 });
  });

  it('ba chế độ cho cùng tổng hàng / cột / toàn bảng', () => {
    for (const cheDo of ['thu', 'tuan', 'thang'] as const) {
      const p = pivotThongKe(dong, cheDo);
      expect(p.grandTotal).toEqual({ keHoach: 42, thucTe: 41 });
      expect(p.rowTotals.get('1')).toEqual({ keHoach: 35, thucTe: 32 });
      const tongCot = [...p.colTotals.values()].reduce((s, o) => s + o.keHoach, 0);
      expect(tongCot).toBe(42);
    }
  });

  it('theo thứ luôn đủ 7 cột; theo tuần sắp tăng', () => {
    expect(pivotThongKe([], 'thu').cot).toHaveLength(7);
    expect(pivotThongKe(dong, 'tuan').cot.map((c) => c.key)).toEqual(['2026-W18', '2026-W19']);
    expect(pivotThongKe(dong, 'thu').farmKeys).toEqual(['1', '2']);
  });
});

describe('tinhTrangDatKh', () => {
  it('phân loại', () => {
    expect(tinhTrangDatKh({ keHoach: 0, thucTe: 0 })).toBeNull();
    expect(tinhTrangDatKh({ keHoach: 10, thucTe: 0 })).toBe('chua_nhap');
    expect(tinhTrangDatKh({ keHoach: 10, thucTe: 11 })).toBe('vuot');
    expect(tinhTrangDatKh({ keHoach: 10, thucTe: 10 })).toBe('dat');
    expect(tinhTrangDatKh({ keHoach: 10, thucTe: 9 })).toBe('thieu');
    expect(tinhTrangDatKh({ keHoach: 0, thucTe: 3 })).toBe('vuot');
  });
});
