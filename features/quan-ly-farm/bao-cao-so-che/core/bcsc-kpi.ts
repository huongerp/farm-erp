import type { FarmBaoCaoNhanCong } from '../../bao-cao-nhan-cong/core/types';
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
  /** Tổng giờ QĐ dòng IV = sl_cong_ngay×8 + sl_cong_nua×4 (5 chuyền sản xuất) */
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
  // Row 2: Tổng giờ QĐ dòng IV = sl_cong_ngay×8 + sl_cong_nua×4
  const tongGioCnNgay = prodTotals.sl_cong_ngay * 8 + prodTotals.sl_cong_nua * 4;
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
  /** Tổng số thùng quy đổi / (Tổng giờ QĐ IV + Tổng giờ TC IV) — bằng nsThungGioCong */
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

  if (!bcnc || thung == null) {
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
  const nsThungCongNgay = tongGioLam > EPS ? (thung * 8) / tongGioLam : null;
  // 12: NS thùng/giờ công = thung / tongGioLam
  const nsThungGioCong = tongGioLam > EPS ? thung / tongGioLam : null;
  // 13: NS bình quân người /giờ = thung / tongGioLam  (cùng công thức với 12)
  const nsBinhQuanNguoiGio = tongGioLam > EPS ? thung / tongGioLam : null;

  return {
    thungThanhPham: thung,
    nsThungCongNgay,
    nsThungGioCong,
    nsBinhQuanNguoiGio,
    tongLuong: salary,
    chiPhiNhanCongPerKg,
  };
}
