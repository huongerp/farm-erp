import { describe, expect, it } from 'vitest';
import { hanKeTiep, soSanhTheoHan, tinhTrangHan } from './han';

describe('hanKeTiep (khớp trigger fn_farm_bd_tinh_han)', () => {
  it('đã làm → lần gần nhất + chu kỳ, qua tháng', () => {
    expect(hanKeTiep('2026-11-01', 7, null)).toBe('2026-11-08');
    expect(hanKeTiep('2026-10-31', 30, '2026-01-01')).toBe('2026-11-30');
  });

  it('chưa làm lần nào giữ ngày bắt đầu; không chu kỳ thì không hạn', () => {
    expect(hanKeTiep(null, 7, '2026-11-20')).toBe('2026-11-20');
    expect(hanKeTiep('2026-11-01', null, '2026-11-20')).toBeNull();
  });
});

describe('tinhTrangHan', () => {
  it('quá hạn / sắp tới (≤7 ngày, gồm đúng ngày hạn) / còn hạn / chưa lên lịch', () => {
    expect(tinhTrangHan('2026-11-08', '2026-11-09')).toBe('qua_han');
    expect(tinhTrangHan('2026-11-09', '2026-11-09')).toBe('sap_toi');
    expect(tinhTrangHan('2026-11-16', '2026-11-09')).toBe('sap_toi');
    expect(tinhTrangHan('2026-11-17', '2026-11-09')).toBe('con_han');
    expect(tinhTrangHan(null, '2026-11-09')).toBe('chua_len_lich');
  });

  it('sắp xếp: hạn sớm trước, chưa lên lịch cuối', () => {
    const ds = [{ han_ke_tiep: null }, { han_ke_tiep: '2026-12-01' }, { han_ke_tiep: '2026-11-01' }];
    expect(ds.sort(soSanhTheoHan).map((x) => x.han_ke_tiep)).toEqual(['2026-11-01', '2026-12-01', null]);
  });
});
