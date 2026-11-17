/**
 * Tình hình QC một ngày + farm — kết quả RPC `fn_gscl_qc_ngay` (migration 081).
 * Farm kiểm chưa đủ `toi_thieu` thùng trong ngày (từ ngày áp dụng) → `ti_le` null = «Chưa đạt kiểm tra».
 */
export interface QcNgay {
  /** Số thùng đã kiểm (có tổng nhánh) của farm trong ngày, phiếu chưa huỷ. */
  so_thung: number;
  /** Số thùng tối thiểu theo Cài đặt GSCL. */
  toi_thieu: number;
  /** Ngày này có áp luật tối thiểu (≥ ngày áp dụng) hay không. */
  ap_dung: boolean;
  /** % nải lỗi; null = chưa đạt kiểm tra (thiếu thùng). */
  ti_le: number | null;
}

const soNguyen = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
};

/** jsonb RPC → QcNgay; numeric trong jsonb có thể về chuỗi. Dữ liệu hỏng → coi như chưa có thùng. */
export function docQcNgay(raw: unknown): QcNgay {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const tl = o.ti_le == null || o.ti_le === '' ? null : Number(o.ti_le);
  return {
    so_thung: soNguyen(o.so_thung),
    toi_thieu: soNguyen(o.toi_thieu),
    ap_dung: o.ap_dung === true,
    ti_le: tl != null && Number.isFinite(tl) ? tl : null,
  };
}
