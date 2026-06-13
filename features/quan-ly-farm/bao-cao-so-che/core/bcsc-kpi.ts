import type { FarmBaoCaoNhanCong } from '../../bao-cao-nhan-cong/core/types';
import type { FarmDuBaoSlDongThung } from '../../du-bao-sl-dong-thung/core/types';
import { computeDuBaoSlDongThungKpiFromFarm } from '../../du-bao-sl-dong-thung/core/kpi';
import type { FarmBaoCaoKpiThuongRow } from '../../shared/kpi-thuong/types';
import { computeKpiPhanTram } from '../../shared/kpi-thuong/types';
import { sumTongGioQuyDoiRowIVFromRows } from '../../bao-cao-nhan-cong/core/ct-sub';
import {
  normalizeChiTietForDisplay,
  sumChiTietNumericPart,
  sumTongCongQuyDoiTuChiTiet,
  sumTongGioTangCaTichTuChiTiet,
  chuyenTtLabelByThuTu,
} from '../../bao-cao-nhan-cong/core/types';

const EPS = 1e-9;

/** Phiếu nhân công cùng chi nhánh + ngày (đầu tiên nếu có trùng — DB unique nên tối đa một). */
export function findBaoCaoNhanCongByBranchAndDate(
  list: FarmBaoCaoNhanCong[],
  ngay: string,
  idChiNhanh: string | null | undefined
): FarmBaoCaoNhanCong | null {
  if (!ngay || !idChiNhanh || String(idChiNhanh).trim() === '') return null;
  const idStr = String(idChiNhanh);
  const row = list.find(
    (r) => r.ngay === ngay && r.id_chi_nhanh != null && String(r.id_chi_nhanh) === idStr
  );
  return row ?? null;
}

/** Phiếu dự báo SL đóng thùng cùng chi nhánh + ngày. */
export function findDuBaoSlDongThungByBranchAndDate(
  list: FarmDuBaoSlDongThung[],
  ngay: string,
  idChiNhanh: string | null | undefined
): FarmDuBaoSlDongThung | null {
  if (!ngay || !idChiNhanh || String(idChiNhanh).trim() === '') return null;
  const idStr = String(idChiNhanh);
  const row = list.find(
    (r) => r.ngay === ngay && r.id_chi_nhanh != null && String(r.id_chi_nhanh) === idStr
  );
  return row ?? null;
}

/** Thực tế KPI hàng 3 (Tỷ lệ thu hồi) = dòng 15 ĐBĐT: Tổng số thùng dự kiến (TT). */
export function extractTyLeThuHoiThucTeFromDbdt(
  dbdt: FarmDuBaoSlDongThung | null
): number | null {
  if (!dbdt) return null;
  const thung = computeDuBaoSlDongThungKpiFromFarm(dbdt).tong_so_thung_thuc_te;
  return Number.isFinite(thung) ? thung : null;
}

/** Cột % KPI hàng 3 = dòng 12 ĐBĐT: Tỷ lệ thu hồi (TT), thang 0–100. */
export function extractTyLeThuHoiPhanTramFromDbdt(
  dbdt: FarmDuBaoSlDongThung | null
): number | null {
  if (!dbdt) return null;
  const r = Number(dbdt.ty_le_thu_hoi_thuc_te);
  if (!Number.isFinite(r)) return null;
  return Math.min(100, Math.max(0, r * 100));
}

/** Đánh giá hàng 3: thực tế (thùng ĐBĐT) < tổng Số thùng (Loại thùng) phẩm cấp → Đạt. */
export function computeTyLeThuHoiDanhGia(
  thucTeThung: number | null,
  phamCapTongSoThung: number | null
): string | null {
  if (thucTeThung == null || phamCapTongSoThung == null || !Number.isFinite(phamCapTongSoThung)) {
    return null;
  }
  return thucTeThung < phamCapTongSoThung ? 'Đạt' : 'Không đạt';
}

/**
 * Ghi chú 4 dòng bảng chỉ số BCNC trên báo cáo sơ chế — từ ghi chú phiếu + ghi chú từng chuyền (I.1…III).
 * Dòng 1–2: cùng nội dung (phiếu + các chuyền có ghi chú). Dòng 3–4: '—' (dòng IV là tổng tính toán, không có ghi chú riêng).
 */
export function extractBcncTableGhiChuRows(bcnc: FarmBaoCaoNhanCong | null): [string, string, string, string] {
  if (!bcnc) return ['—', '—', '—', '—'];
  const { production } = normalizeChiTietForDisplay(bcnc.chi_tiet ?? []);
  const slip = bcnc.ghi_chu?.trim() ?? '';
  const lineParts = production
    .map((r) => {
      const g = r.ghi_chu?.trim();
      if (!g) return '';
      const tt = chuyenTtLabelByThuTu(r.thu_tu);
      return `${tt}: ${g}`;
    })
    .filter(Boolean);
  const merged = [slip, ...lineParts].filter(Boolean).join(' · ') || '—';
  return [merged, merged, '—', '—'];
}

/** Bốn chỉ số đọc từ báo cáo nhân công (theo plan). */
export interface BcscLaborFromBcncSnapshot {
  /** CN ngày + CN nửa (dòng IV, chỉ 5 chuyền sản xuất) — map nhãn "Tổng số công nhân làm việc" */
  tongCongQuyDoiPhieu: number;
  /** Tổng giờ QĐ dòng IV = Σ(sl×giờ) CN ngày + CN nửa từ sub (5 chuyền sản xuất) */
  tongGioCnNgay: number;
  /** Công QĐ dòng IV — tổng công quy đổi 5 chuyền sản xuất */
  congQdRowIV: number;
  /** Tổng giờ TC dòng IV — tổng giờ tăng ca tích 5 chuyền sản xuất */
  tongGioTcRowIV: number;
}

export function extractLaborSnapshotFromBcnc(bcnc: FarmBaoCaoNhanCong): BcscLaborFromBcncSnapshot {
  const { production } = normalizeChiTietForDisplay(bcnc.chi_tiet ?? []);
  const prodTotals = sumChiTietNumericPart(production);
  // Row 1: CN ngày + CN nửa (dòng IV) — đếm đầu người, không quy đổi
  const tongCongQuyDoiPhieu = prodTotals.sl_cong_ngay + prodTotals.sl_cong_nua;
  const tongGioCnNgay = sumTongGioQuyDoiRowIVFromRows(production);
  return {
    tongCongQuyDoiPhieu,
    tongGioCnNgay,
    congQdRowIV: sumTongCongQuyDoiTuChiTiet(production),
    tongGioTcRowIV: sumTongGioTangCaTichTuChiTiet(production),
  };
}

export interface BcscKpiComputed {
  /** Tổng số thùng quy đổi từ bảng phẩm cấp */
  thungThanhPham: number | null;
  nsThungCongNgay: number | null;
  nsThungGioCong: number | null;
  /** Tổng kg / (Tổng giờ QĐ dòng IV + Tổng giờ TC dòng IV) */
  nsBinhQuanNguoiGio: number | null;
  tongLuong: number | null;
  chiPhiNhanCongPerKg: number | null;
}

export function computeBaoCaoSoCheKpis(
  tongThungQD: number,
  bcnc: FarmBaoCaoNhanCong | null,
  tongKg = 0,
  tongLuong = 0
): BcscKpiComputed {
  const thung =
    Number.isFinite(tongThungQD) && tongThungQD >= 0 ? tongThungQD : null;
  const salary = Number.isFinite(tongLuong) && tongLuong >= 0 ? tongLuong : null;
  const kg = Number.isFinite(tongKg) && tongKg > EPS ? tongKg : null;
  const chiPhiNhanCongPerKg = salary != null && kg != null ? salary / kg : null;

  if (!bcnc) {
    return {
      thungThanhPham: thung,
      nsThungCongNgay: null,
      nsThungGioCong: null,
      nsBinhQuanNguoiGio: null,
      tongLuong: salary,
      chiPhiNhanCongPerKg,
    };
  }

  const snap = extractLaborSnapshotFromBcnc(bcnc);
  // Mẫu số chung: Tổng giờ QĐ (dòng IV) + Tổng giờ TC (dòng IV)
  const tongGioLam = snap.tongGioCnNgay + snap.tongGioTcRowIV;

  // 11: NS thùng/công ngày = thung × 8 / tongGioLam  (1 công = 8 giờ)
  const nsThungCongNgay =
    thung != null && tongGioLam > EPS ? (thung * 8) / tongGioLam : null;
  // 12: NS thùng/giờ công = thung / tongGioLam
  const nsThungGioCong = thung != null && tongGioLam > EPS ? thung / tongGioLam : null;
  // 13: NS bình quân người /giờ = Tổng kg / (Tổng giờ QĐ IV + Tổng giờ TC IV)
  const nsBinhQuanNguoiGio = kg != null && tongGioLam > EPS ? kg / tongGioLam : null;

  return {
    thungThanhPham: thung,
    nsThungCongNgay,
    nsThungGioCong,
    nsBinhQuanNguoiGio,
    tongLuong: salary,
    chiPhiNhanCongPerKg,
  };
}

export interface BcscKpiThuongPresetSource {
  thucTeValue: number | null;
  isHigherBetter: boolean;
  /** Cột % — nếu có thì dùng trực tiếp (vd. tỷ lệ thu hồi TT từ ĐBĐT). */
  phanTramValue?: number | null;
  /** Ngưỡng tổng Số thùng (Loại thùng) phẩm cấp — dùng đánh giá hàng Tỷ lệ thu hồi. */
  phamCapTongSoThung?: number | null;
}

export function resolveBcscPresetKpiDerivedFields(
  source: BcscKpiThuongPresetSource,
  mucTieu: string | null | undefined
): { thucTeStr: string | null; phanTram: number | null; danhGia: string | null } {
  const thucTeStr = numericKpiString(source.thucTeValue);
  if (thucTeStr == null) {
    return { thucTeStr: null, phanTram: null, danhGia: null };
  }
  const phanTram =
    source.phanTramValue != null && Number.isFinite(source.phanTramValue)
      ? source.phanTramValue
      : computeKpiPhanTram(mucTieu, thucTeStr);
  const danhGia =
    source.phamCapTongSoThung != null
      ? computeTyLeThuHoiDanhGia(source.thucTeValue, source.phamCapTongSoThung)
      : computePresetDanhGia(thucTeStr, mucTieu, source.isHigherBetter);
  return { thucTeStr, phanTram, danhGia };
}

function numericKpiString(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return String(Math.round(value * 10000) / 10000);
}

function computePresetDanhGia(
  thucTe: string | null,
  mucTieu: string | null | undefined,
  isHigherBetter: boolean
): string | null {
  if (thucTe == null) return null;
  const tt = parseFloat(thucTe.replace(',', '.'));
  const mt = parseFloat(String(mucTieu ?? '').replace(',', '.'));
  if (!Number.isFinite(tt) || !Number.isFinite(mt)) return null;
  return (isHigherBetter ? tt >= mt : tt <= mt) ? 'Đạt' : 'Không đạt';
}

export function buildBaoCaoSoCheKpiThuongPresetSources(
  kpis: BcscKpiComputed,
  danhGiaLoiQcPct: number | null,
  dbdt: FarmDuBaoSlDongThung | null,
  phamCapTongSoThung: number
): [BcscKpiThuongPresetSource, BcscKpiThuongPresetSource, BcscKpiThuongPresetSource] {
  return [
    { thucTeValue: kpis.nsThungGioCong, isHigherBetter: true },
    { thucTeValue: Number.isFinite(Number(danhGiaLoiQcPct)) ? Number(danhGiaLoiQcPct) : null, isHigherBetter: false },
    {
      thucTeValue: extractTyLeThuHoiThucTeFromDbdt(dbdt),
      isHigherBetter: true,
      phanTramValue: extractTyLeThuHoiPhanTramFromDbdt(dbdt),
      phamCapTongSoThung,
    },
  ];
}

export function enrichBaoCaoSoCheKpiThuongRows(
  rows: FarmBaoCaoKpiThuongRow[],
  presetSources: [BcscKpiThuongPresetSource, BcscKpiThuongPresetSource, BcscKpiThuongPresetSource]
): FarmBaoCaoKpiThuongRow[] {
  if (rows.length === 0) return rows;
  return rows.map((row, index) => {
    if (index >= presetSources.length) return row;
    const source = presetSources[index];
    const { thucTeStr, phanTram, danhGia } = resolveBcscPresetKpiDerivedFields(source, row.muc_tieu);
    if (thucTeStr == null) return row;
    return {
      ...row,
      thuc_te: thucTeStr,
      phan_tram: phanTram,
      danh_gia: danhGia ?? row.danh_gia,
    };
  });
}
