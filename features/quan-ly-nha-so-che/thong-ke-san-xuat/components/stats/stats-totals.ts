import type { ByChiNhanhRow } from './useThongKeSanXuatStats';

/** Dòng "Tổng cộng" của bảng Tổng hợp theo chi nhánh. */
export function tongHopChiNhanh(rows: ByChiNhanhRow[]) {
  const tongNgay = rows.reduce((s, r) => s + r.tongNgay, 0);
  const tongCongQD = rows.reduce((s, r) => s + r.tongCongQuyDoi, 0);
  const tongGioTC = rows.reduce((s, r) => s + r.tongGioTangCaTich, 0);
  const ngayDat = rows.reduce((s, r) => s + r.ngayDatKpi, 0);
  const ngayCoBcsc = rows.reduce((s, r) => s + r.ngayCoBcsc, 0);
  const tienThuongDuong = rows.reduce((s, r) => s + r.tienThuongDuong, 0);
  const tienThuongAm = rows.reduce((s, r) => s + r.tienThuongAm, 0);
  return {
    tongNgay,
    tongCongQD,
    tongGioTC,
    ngayDat,
    ngayCoBcsc,
    /** % KPI đạt trên tổng ngày có BCSC; null khi chưa có ngày nào có BCSC. */
    kpiRate: ngayCoBcsc > 0 ? (ngayDat / ngayCoBcsc) * 100 : null,
    tienThuongDuong,
    tienThuongAm,
    net: tienThuongDuong + tienThuongAm,
  };
}

/** Dòng "Tổng cộng" của bảng Sơ chế & Đóng thùng. */
export function tongHopSoCheThung(rows: ByChiNhanhRow[]) {
  const tongBuongSoChe = rows.reduce((s, r) => s + r.tongBuongSoChe, 0);
  const tongThungKH = rows.reduce((s, r) => s + r.tongThungKH, 0);
  const tongThungTT = rows.reduce((s, r) => s + r.tongThungTT, 0);
  return {
    tongBuongSoChe,
    tongThungKH,
    tongThungTT,
    /** Thực tế / kế hoạch (%); null khi không có kế hoạch. */
    tyLeTTKH: tongThungKH > 0 ? (tongThungTT / tongThungKH) * 100 : null,
  };
}
