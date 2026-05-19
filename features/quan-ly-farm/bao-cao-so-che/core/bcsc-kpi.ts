import type { FarmBaoCaoNhanCong } from '../../bao-cao-nhan-cong/core/types';
import {
  normalizeChiTietForDisplay,
  sumTongCongQuyDoiPhieu,
  sumTongCongQuyDoiTuChiTiet,
  sumTongGioTangCaTichPhieu,
  sumTongGioTangCaTichTuChiTiet,
  chuyenTtLabelByThuTu,
} from '../../bao-cao-nhan-cong/core/types';
import { sumDisplayLoaiTotalsOnRows } from '../../bao-cao-nhan-cong/core/ct-sub';

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
  /** Tổng công quy đổi toàn phiếu — map nhãn "Tổng số công nhân làm việc" */
  tongCongQuyDoiPhieu: number;
  /** Σ giờ CN ngày toàn phiếu (Σ sl×giờ, loại CN_NGAY) */
  tongGioCnNgay: number;
  /** Công QĐ dòng IV — tổng công quy đổi 5 chuyền sản xuất */
  congQdRowIV: number;
  /** Tổng giờ TC dòng IV — tổng giờ tăng ca tích 5 chuyền sản xuất */
  tongGioTcRowIV: number;
}

export function extractLaborSnapshotFromBcnc(bcnc: FarmBaoCaoNhanCong): BcscLaborFromBcncSnapshot {
  const { production } = normalizeChiTietForDisplay(bcnc.chi_tiet ?? []);
  const tongCongQuyDoiPhieu = sumTongCongQuyDoiPhieu(bcnc);
  const cnNgayPhieu = sumDisplayLoaiTotalsOnRows(bcnc.chi_tiet ?? [], 'CN_NGAY');
  return {
    tongCongQuyDoiPhieu,
    tongGioCnNgay: cnNgayPhieu.tongGio,
    congQdRowIV: sumTongCongQuyDoiTuChiTiet(production),
    tongGioTcRowIV: sumTongGioTangCaTichTuChiTiet(production),
  };
}

export interface BcscKpiComputed {
  /** Tổng số thùng quy đổi từ bảng phẩm cấp */
  thungThanhPham: number | null;
  nsThungCongNgay: number | null;
  nsThungGioCong: number | null;
  /** TODO: thay khi có định nghĩa chính xác người × giờ */
  nsBinhQuanNguoiGio: number | null;
  tongLuong: null;
  chiPhiNhanCongPerKg: null;
}

export function computeBaoCaoSoCheKpis(
  tongThungQD: number,
  bcnc: FarmBaoCaoNhanCong | null
): BcscKpiComputed {
  const thung =
    Number.isFinite(tongThungQD) && tongThungQD >= 0 ? tongThungQD : null;

  if (!bcnc || thung == null) {
    return {
      thungThanhPham: thung,
      nsThungCongNgay: null,
      nsThungGioCong: null,
      nsBinhQuanNguoiGio: null,
      tongLuong: null,
      chiPhiNhanCongPerKg: null,
    };
  }

  const snap = extractLaborSnapshotFromBcnc(bcnc);
  const congQuyDoi = snap.tongCongQuyDoiPhieu;
  const gioCnNgay = snap.tongGioCnNgay;
  const tongGioLam = gioCnNgay + sumTongGioTangCaTichPhieu(bcnc);

  const nsThungCongNgay = congQuyDoi > EPS ? thung / congQuyDoi : null;
  const nsThungGioCong = tongGioLam > EPS ? thung / tongGioLam : null;
  const denomNguoiGio = congQuyDoi * 8;
  const nsBinhQuanNguoiGio = denomNguoiGio > EPS ? thung / denomNguoiGio : null;

  return {
    thungThanhPham: thung,
    nsThungCongNgay,
    nsThungGioCong,
    nsBinhQuanNguoiGio,
    tongLuong: null,
    chiPhiNhanCongPerKg: null,
  };
}
