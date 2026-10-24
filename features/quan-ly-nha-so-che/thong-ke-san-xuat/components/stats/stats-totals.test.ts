import { describe, it, expect } from 'vitest';
import type { ByChiNhanhRow } from './useThongKeSanXuatStats';
import { tongHopChiNhanh, tongHopSoCheThung } from './stats-totals';

const r = (o: Partial<ByChiNhanhRow>): ByChiNhanhRow => ({
  id: 'x',
  ten: 'x',
  tongNgay: 0,
  ngayCoBcnc: 0,
  ngayCoBcsc: 0,
  ngayCoDbdt: 0,
  tongCongQuyDoi: 0,
  tbCongQuyDoiNgay: null,
  tongGioTangCaTich: 0,
  ngayDatKpi: 0,
  kpiRate: null,
  tongTienThuong: 0,
  tienThuongDuong: 0,
  tienThuongAm: 0,
  tongBuongSoChe: 0,
  tongThungKH: 0,
  tongThungTT: 0,
  ...o,
});

describe('tongHopChiNhanh', () => {
  it('cộng dồn, % KPI tính trên tổng ngày có BCSC, net = thưởng + phạt', () => {
    const t = tongHopChiNhanh([
      r({ tongNgay: 10, ngayCoBcsc: 8, ngayDatKpi: 6, tienThuongDuong: 300000, tienThuongAm: -100000 }),
      r({ tongNgay: 5, ngayCoBcsc: 2, ngayDatKpi: 2, tienThuongDuong: 100000, tienThuongAm: 0 }),
    ]);
    expect(t.tongNgay).toBe(15);
    expect(t.kpiRate).toBe(80);
    expect(t.net).toBe(300000);
  });

  it('chưa có BCSC nào: kpiRate null', () => {
    expect(tongHopChiNhanh([r({ tongNgay: 3 })]).kpiRate).toBeNull();
  });
});

describe('tongHopSoCheThung', () => {
  it('tỷ lệ TT/KH null khi không có kế hoạch', () => {
    expect(tongHopSoCheThung([r({ tongThungTT: 5 })]).tyLeTTKH).toBeNull();
    expect(tongHopSoCheThung([r({ tongThungKH: 10, tongThungTT: 5 })]).tyLeTTKH).toBe(50);
  });
});
