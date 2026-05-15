import type { FarmBaoCaoNhanCong } from '../../bao-cao-nhan-cong/core/types';
import {
  normalizeChiTietForDisplay,
  sumTongCongQuyDoiPhieu,
  sumTongGioTangCaTichPhieu,
  tongCongQuyDoiNgayVaNua,
  tongGioTangCaTichMotDong,
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
 * Ghi chú 4 dòng bảng chỉ số BCNC trên báo cáo sơ chế — từ ghi chú phiếu + ghi chú từng chuyền (I.1…III) và dòng V.
 * Dòng 1–2: cùng nội dung (phiếu + các chuyền có ghi chú). Dòng 3–4: ghi chú dòng V (định biên).
 */
export function extractBcncTableGhiChuRows(bcnc: FarmBaoCaoNhanCong | null): [string, string, string, string] {
  if (!bcnc) return ['—', '—', '—', '—'];
  const { production, vRow } = normalizeChiTietForDisplay(bcnc.chi_tiet ?? []);
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
  const vNote = vRow.ghi_chu?.trim() || '—';
  return [merged, merged, vNote, vNote];
}

/** Bốn chỉ số đọc từ báo cáo nhân công (theo plan). */
export interface BcscLaborFromBcncSnapshot {
  /** Tổng công quy đổi toàn phiếu — map nhãn "Tổng số công nhân làm việc" */
  tongCongQuyDoiPhieu: number;
  /** Công × 8 giờ */
  tongGio8TiepTheoCong: number;
  /** Công quy đổi dòng V (định biên) */
  congQuyDoiDinhBien: number;
  /** Giờ TC tích dòng V */
  gioTangCaTichDinhBien: number;
}

export function extractLaborSnapshotFromBcnc(bcnc: FarmBaoCaoNhanCong): BcscLaborFromBcncSnapshot {
  const { production, vRow } = normalizeChiTietForDisplay(bcnc.chi_tiet ?? []);
  void production;
  const tongCongQuyDoiPhieu = sumTongCongQuyDoiPhieu(bcnc);
  return {
    tongCongQuyDoiPhieu,
    tongGio8TiepTheoCong: tongCongQuyDoiPhieu * 8,
    congQuyDoiDinhBien: tongCongQuyDoiNgayVaNua(vRow),
    gioTangCaTichDinhBien: tongGioTangCaTichMotDong(vRow),
  };
}

export interface BcscKpiComputed {
  /** Tạm = số buồng sơ chế (cùng đơn vị buồng; có thể đổi công thức sau) */
  thungThanhPham: number | null;
  nsThungCongNgay: number | null;
  nsThungGioCong: number | null;
  /** TODO: thay khi có định nghĩa chính xác người × giờ */
  nsBinhQuanNguoiGio: number | null;
  tongLuong: null;
  chiPhiNhanCongPerKg: null;
}

export function computeBaoCaoSoCheKpis(
  tongBuongSoChe: number,
  bcnc: FarmBaoCaoNhanCong | null
): BcscKpiComputed {
  const thung =
    Number.isFinite(tongBuongSoChe) && tongBuongSoChe >= 0 ? tongBuongSoChe : null;

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
  const gio8 = snap.tongGio8TiepTheoCong;
  const tongGioLam = gio8 + sumTongGioTangCaTichPhieu(bcnc);

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
