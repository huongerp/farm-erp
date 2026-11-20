/**
 * Công thức tự tính 3 cột Thưởng QL / nhóm tỉa / nhóm CP cho 3 dòng KPI preset của báo cáo sơ chế.
 *
 * Nguồn: quy chế «Cách tính thưởng KPI» (QL NSC, CP, Tỉa) — mức/ngày = mức tháng ÷ 28 công
 * (số khách đã làm tròn). Dòng preset: 0 Năng suất sơ chế, 1 Tỷ lệ nải chuỗi lỗi, 2 Tỷ lệ thu hồi.
 *
 * - Ngưỡng đạt: dòng Năng suất 90% (trước 20/11/2026 là 85%), dòng lỗi và thu hồi giữ 85% (chốt 20/11/2026).
 *   Tỷ lệ đạt ≥ ngưỡng → min(tỷ lệ, 100%) × mức; dưới ngưỡng = 0 (không trừ âm).
 * - Dòng lỗi (càng thấp càng tốt): tỷ lệ đạt = mục tiêu ÷ thực tế × 100, trần 100% (tính ở `resolveBcscPresetKpiDerivedFields`).
 */

export const BCSC_MUC_THUONG_NGAY = {
  /** KPI QL NSC: 1.700.000đ/28 công — NS 60%, lỗi 20%, thu hồi 20% */
  ql: { nangSuat: 36_429, loi: 12_143, thuHoi: 12_143 },
  /** KPI Tỉa: 900.000đ/28 công — thu hồi 60%, NS 30% */
  tia: { nangSuat: 10_714, thuHoi: 21_429 },
  /** KPI CP: 900.000đ/28 công — lỗi 60%, NS 30% */
  cp: { nangSuat: 10_714, loi: 21_429 },
} as const;

/** Ngưỡng tỷ lệ đạt theo dòng preset: 0 Năng suất, 1 Lỗi, 2 Thu hồi. */
export const BCSC_NGUONG_DAT = { nangSuat: 90, loi: 85, thuHoi: 85 } as const;

export type BcscCotThuongCongThuc = 'thuong_ql' | 'thuong_nhom_tia' | 'thuong_nhom_cp';
export type BcscThuongCongThuc = Partial<Record<BcscCotThuongCongThuc, number>>;

/** Tỷ lệ đạt (thang 0–100+) ≥ ngưỡng → min(tỷ lệ, 100)% × mức; ngược lại / thiếu số = 0. */
export function thuongTheoNguong(tyLeDat: number | null | undefined, muc: number, nguong: number): number {
  if (tyLeDat == null || !Number.isFinite(tyLeDat) || tyLeDat < nguong) return 0;
  return Math.round((Math.min(tyLeDat, 100) / 100) * muc);
}

/**
 * Các cột thưởng do công thức quyết định cho dòng preset `index` (0–2).
 * `tyLeDat` = thực tế ÷ mục tiêu × 100, dòng lỗi thì mục tiêu ÷ thực tế × 100
 * (KHÔNG phải % chênh lệch đang hiện ở dòng thu hồi).
 * Cột không có trong kết quả = nhập tay. Dòng ngoài preset → {}.
 */
export function computeBcscThuongTheoCongThuc(
  index: number,
  tyLeDat: number | null | undefined
): BcscThuongCongThuc {
  const m = BCSC_MUC_THUONG_NGAY;
  const n = BCSC_NGUONG_DAT;
  switch (index) {
    case 0:
      return {
        thuong_ql: thuongTheoNguong(tyLeDat, m.ql.nangSuat, n.nangSuat),
        thuong_nhom_tia: thuongTheoNguong(tyLeDat, m.tia.nangSuat, n.nangSuat),
        thuong_nhom_cp: thuongTheoNguong(tyLeDat, m.cp.nangSuat, n.nangSuat),
      };
    case 1:
      // Tỉa không có KPI lỗi.
      return {
        thuong_ql: thuongTheoNguong(tyLeDat, m.ql.loi, n.loi),
        thuong_nhom_tia: 0,
        thuong_nhom_cp: thuongTheoNguong(tyLeDat, m.cp.loi, n.loi),
      };
    case 2:
      // CP không có KPI thu hồi.
      return {
        thuong_ql: thuongTheoNguong(tyLeDat, m.ql.thuHoi, n.thuHoi),
        thuong_nhom_tia: thuongTheoNguong(tyLeDat, m.tia.thuHoi, n.thuHoi),
        thuong_nhom_cp: 0,
      };
    default:
      return {};
  }
}
