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
  thuongQl: 0,
  thuongNhomTia: 0,
  thuongNhomCp: 0,
  tienThuongNet: 0,
  nhomNgayDat: { kpi: 200000, duong: 200000, am: 0, ql: 0, nhomTia: 0, nhomCp: 0, net: 200000 },
  nhomNgayKhongDat: { kpi: -50000, duong: 0, am: -50000, ql: 0, nhomTia: 0, nhomCp: 0, net: -50000 },
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

  it('3 nhóm thưởng hiện riêng; cột Tiền thưởng chỉ là phần KPI, net gồm cả 4 nhóm', () => {
    const [dat] = buildKpiRows({
      ...base,
      nhomNgayDat: { kpi: 46747, duong: 46747, am: 0, ql: 49500, nhomTia: 50000, nhomCp: 50000, net: 196247 },
      tienThuongTrenNgayDat: 196247,
    });
    expect(dat.tienThuong).toBe('46.747');
    expect(dat.thuongQl).toBe('49.500');
    expect(dat.thuongNhomTia).toBe('50.000');
    expect(dat.thuongNhomCp).toBe('50.000');
    expect(dat.net).toBe('+196.247');
  });

  it('nhóm ngày vừa có thưởng vừa có phạt KPI: tách theo từng dòng, không bù trừ', () => {
    const [, khongDat] = buildKpiRows({
      ...base,
      nhomNgayKhongDat: { kpi: 10000, duong: 30000, am: -20000, ql: 0, nhomTia: 0, nhomCp: 0, net: 10000 },
      tienPhatTrenNgayKhongDat: 10000,
    });
    expect(khongDat.tienThuong).toBe('30.000');
    expect(khongDat.tienPhat).toBe('20.000');
    expect(khongDat.net).toBe('+10.000');
  });

  it('chưa có BCSC nào: tỷ lệ là "—"', () => {
    const [dat, khongDat] = buildKpiRows({ ...base, tongNgayCoBcsc: 0 });
    expect(dat.pct).toBe('—');
    expect(khongDat.pct).toBe('—');
  });
});
