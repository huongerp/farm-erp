import { describe, expect, it } from 'vitest';
import {
  chuanHoaGio,
  formatThoiLuong,
  fromDateTimeLocalValue,
  soPhutDangOTrongFarm,
  soPhutRaQuaGio,
  soPhutTrongFarm,
  soPhutVaoTre,
  toDateTimeLocalValue,
} from './thoi-gian';

// 30/09/2026 13:00 giờ VN = 06:00Z
const VN = (hhmm: string, ngay = '2026-09-30') => {
  const [h, m] = hhmm.split(':').map(Number);
  const [y, mo, d] = ngay.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - 7, m)).toISOString();
};

describe('thời gian vào/ra', () => {
  it('chuẩn hoá giờ Postgres', () => {
    expect(chuanHoaGio('13:05:00')).toBe('13:05');
    expect(chuanHoaGio('7:30')).toBe('07:30');
    expect(chuanHoaGio('25:00')).toBeNull();
    expect(chuanHoaGio('')).toBeNull();
    expect(chuanHoaGio(null)).toBeNull();
  });

  it('số phút trong farm', () => {
    expect(soPhutTrongFarm(VN('13:35'), VN('15:50'))).toBe(135);
    expect(soPhutTrongFarm(VN('13:35'), null)).toBeNull();
    expect(soPhutTrongFarm(VN('15:00'), VN('13:00'))).toBeNull();
    // qua đêm
    expect(soPhutTrongFarm(VN('22:00'), VN('02:00', '2026-10-01'))).toBe(240);
  });

  it('đang ở trong farm tính tới bây giờ', () => {
    expect(soPhutDangOTrongFarm(VN('13:00'), new Date(VN('13:45')).getTime())).toBe(45);
    expect(soPhutDangOTrongFarm(null)).toBeNull();
  });

  it('vào trễ / sớm so với "từ giờ" theo giờ VN', () => {
    expect(soPhutVaoTre('2026-09-30', '13:00', VN('13:35'))).toBe(35);
    expect(soPhutVaoTre('2026-09-30', '13:00:00', VN('12:50'))).toBe(-10);
    expect(soPhutVaoTre('2026-09-30', null, VN('12:50'))).toBeNull();
    expect(soPhutVaoTre('2026-09-30', '13:00', null)).toBeNull();
  });

  it('ra quá "đến giờ", kể cả khung giờ vắt qua nửa đêm', () => {
    expect(soPhutRaQuaGio('2026-09-30', '13:00', '17:00', VN('17:30'))).toBe(30);
    expect(soPhutRaQuaGio('2026-09-30', '13:00', '17:00', VN('16:00'))).toBe(-60);
    expect(soPhutRaQuaGio('2026-09-30', '22:00', '02:00', VN('02:20', '2026-10-01'))).toBe(20);
    expect(soPhutRaQuaGio('2026-09-30', null, '17:00', VN('17:10'))).toBe(10);
  });

  it('định dạng thời lượng', () => {
    expect(formatThoiLuong(135)).toBe('2 giờ 15 phút');
    expect(formatThoiLuong(45)).toBe('45 phút');
    expect(formatThoiLuong(120)).toBe('2 giờ');
    expect(formatThoiLuong(0)).toBe('0 phút');
    expect(formatThoiLuong(1500)).toBe('1 ngày 1 giờ');
    expect(formatThoiLuong(null)).toBe('—');
  });

  it('datetime-local qua lại theo giờ VN', () => {
    expect(toDateTimeLocalValue(VN('13:39'))).toBe('2026-09-30T13:39');
    expect(fromDateTimeLocalValue('2026-09-30T13:39')).toBe(VN('13:39'));
    expect(fromDateTimeLocalValue('')).toBeNull();
  });
});
