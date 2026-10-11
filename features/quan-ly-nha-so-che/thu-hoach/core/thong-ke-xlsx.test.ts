import { describe, expect, it } from 'vitest';
import type { FarmThuHoach } from './types';
import { traiPhangNgay } from './ngay-thu-hoach';
import { pivotThongKe } from './stats-pivot';
import { taoAoaThongKe } from './thong-ke-xlsx';

const NHAN = {
  tieuDe: 'Báo cáo',
  moTaLoc: 'Kỳ: …',
  farm: 'Farm',
  chiTieu: 'Chỉ tiêu',
  kh: 'KH',
  tt: 'TT',
  cl: 'CL',
  tongCot: 'Tổng',
  tongHang: 'Tổng cộng',
};

describe('taoAoaThongKe', () => {
  it('mỗi farm 3 dòng KH/TT/CL + 3 dòng tổng, cột cuối là tổng hàng', () => {
    const pivot = pivotThongKe(
      traiPhangNgay([
        { nam: 2026, tuan: 18, id_chi_nhanh: '1', ten_chi_nhanh: 'fp1', ke_hoach_t2: 10, thuc_te_t2: 12, ke_hoach_t6: 20, thuc_te_t6: 15 },
      ] as unknown as FarmThuHoach[]),
      'thang'
    );
    const aoa = taoAoaThongKe(pivot, ['T4/2026', 'T5/2026'], (fk) => `F${fk}`, NHAN);
    expect(aoa[3]).toEqual(['Farm', 'Chỉ tiêu', 'T4/2026', 'T5/2026', 'Tổng']);
    expect(aoa.slice(4, 7)).toEqual([
      ['F1', 'KH', 10, 20, 30],
      ['', 'TT', 12, 15, 27],
      ['', 'CL', 2, -5, -3],
    ]);
    expect(aoa[7]).toEqual(['Tổng cộng', 'KH', 10, 20, 30]);
    expect(aoa).toHaveLength(10);
  });
});
