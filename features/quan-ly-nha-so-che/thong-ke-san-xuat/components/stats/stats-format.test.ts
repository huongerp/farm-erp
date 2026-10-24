import { describe, it, expect } from 'vitest';
import type { KpiAnalysis } from './useThongKeSanXuatStats';
import { buildKpiRows } from './stats-format';

const base: KpiAnalysis = {
  tongNgayCoBcsc: 4,
  ngayDatKpi: 3,
  ngayKhongDatKpi: 1,
  ngayKhongCoBcsc: 2,
  tienThuongDuong: 0,
  tienThuongAm: 0,
  tienThuongNet: 0,
  tienThuongTrenNgayDat: 200000,
  tienPhatTrenNgayKhongDat: -50000,
};

describe('buildKpiRows', () => {
  it('tỷ lệ tính trên ngày có BCSC; tiền phạt hiển thị trị tuyệt đối, net có dấu', () => {
    const [dat, khongDat, khongBc] = buildKpiRows(base);
    expect(dat.pct).toBe('75%');
    expect(dat.net).toBe('+200.000');
    expect(khongDat.pct).toBe('25%');
    expect(khongDat.tienPhat).toBe('50.000');
    expect(khongDat.net).toBe('-50.000');
    expect(khongBc.count).toBe(2);
  });

  it('chưa có BCSC nào: tỷ lệ là "—"', () => {
    const [dat, khongDat] = buildKpiRows({ ...base, tongNgayCoBcsc: 0 });
    expect(dat.pct).toBe('—');
    expect(khongDat.pct).toBe('—');
  });
});
