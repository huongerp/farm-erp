import { describe, expect, it } from 'vitest';
import { soTuanIso } from '../../../../lib/am-lich';
import { THU_HOACH_DAY_SUFFIXES } from './types';
import { khoangNgayTuan, ngayCuaThu, traiPhangNgay } from './ngay-thu-hoach';
import type { FarmThuHoach } from './types';

describe('ngayCuaThu', () => {
  it('tuần 41/2026: T2 = 05/10, CN = 11/10', () => {
    expect(ngayCuaThu(2026, 41, 't2')).toBe('2026-10-05');
    expect(ngayCuaThu(2026, 41, 'cn')).toBe('2026-10-11');
  });

  it('tuần 1/2026 bắt đầu từ 29/12/2025', () => {
    expect(ngayCuaThu(2026, 1, 't2')).toBe('2025-12-29');
    expect(ngayCuaThu(2026, 1, 't5')).toBe('2026-01-01');
  });

  it('2026 có tuần 53 (28/12/2026 – 03/01/2027)', () => {
    expect(ngayCuaThu(2026, 53, 't2')).toBe('2026-12-28');
    expect(ngayCuaThu(2026, 53, 'cn')).toBe('2027-01-03');
  });

  it('khớp ngược với soTuanIso cho mọi ngày của vài tuần', () => {
    for (const [nam, tuan] of [[2025, 1], [2026, 18], [2027, 52], [2020, 53]]) {
      for (const thu of THU_HOACH_DAY_SUFFIXES) {
        const [y, m, d] = ngayCuaThu(nam, tuan, thu).split('-').map(Number);
        expect(soTuanIso(y, m, d)).toEqual({ nam, tuan });
      }
    }
  });
});

describe('traiPhangNgay', () => {
  it('tuần vắt tháng: ngày lịch và tháng theo từng ô', () => {
    const row = {
      nam: 2026,
      tuan: 18,
      id_chi_nhanh: '3',
      ten_chi_nhanh: 'NSC fp3',
      ke_hoach_t2: 10,
      thuc_te_t2: 8,
      ke_hoach_cn: 5,
      thuc_te_cn: 6,
    } as unknown as FarmThuHoach;
    const dong = traiPhangNgay([row]);
    expect(dong).toHaveLength(7);
    expect(dong[0]).toMatchObject({ ngay: '2026-04-27', thang: 4, keHoach: 10, thucTe: 8, farmKey: '3' });
    expect(dong[6]).toMatchObject({ ngay: '2026-05-03', thang: 5, keHoach: 5, thucTe: 6 });
    expect(dong[1]).toMatchObject({ keHoach: 0, thucTe: 0 });
  });
});

describe('khoangNgayTuan', () => {
  it('tuần 41/2026 = 05/10 – 11/10', () => {
    expect(khoangNgayTuan(2026, 41)).toBe('05/10 – 11/10');
  });
  it('tuần vắt qua năm vẫn ra đúng ngày/tháng', () => {
    expect(khoangNgayTuan(2026, 1)).toBe('29/12 – 04/01');
    expect(khoangNgayTuan(2026, 53)).toBe('28/12 – 03/01');
  });
});
