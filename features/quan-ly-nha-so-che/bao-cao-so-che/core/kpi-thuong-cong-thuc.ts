/**
 * Công thức tự tính 3 cột Thưởng QL / nhóm tỉa / nhóm CP cho 3 dòng KPI preset của báo cáo sơ chế.
 *
 * Nguồn: quy chế «Cách tính thưởng KPI» (QL NSC, CP, Tỉa) — mức/ngày = mức tháng ÷ 28 công
 * (số khách đã làm tròn). Dòng preset: 0 Năng suất sơ chế, 1 Tỷ lệ nải chuỗi lỗi, 2 Tỷ lệ thu hồi.
 *
 * - Quy tắc ngưỡng 85%: tỷ lệ đạt ≥ 85% → min(tỷ lệ, 100%) × mức; dưới 85% = 0.
 * - Quy tắc lỗi (QL): tỷ lệ lỗi ≤ 100% mục tiêu → +mức; > 100% → −(tỷ lệ − 100%) × mức.
 * - Thưởng nhóm CP dòng lỗi: tạm KHÔNG chạy công thức (giữ nhập tay) — không trả về key đó.
 */

export const BCSC_MUC_THUONG_NGAY = {
  /** KPI QL NSC: 1.700.000đ/28 công — NS 60%, lỗi 20%, thu hồi 20% */
  ql: { nangSuat: 36_429, loi: 12_143, thuHoi: 12_143 },
  /** KPI Tỉa: 900.000đ/28 công — thu hồi 60%, NS 30% */
  tia: { nangSuat: 10_714, thuHoi: 21_429 },
  /** KPI CP: 900.000đ/28 công — lỗi 60% (chưa chạy), NS 30% */
  cp: { nangSuat: 10_714 },
} as const;

const NGUONG_DAT = 85;

export type BcscCotThuongCongThuc = 'thuong_ql' | 'thuong_nhom_tia' | 'thuong_nhom_cp';
export type BcscThuongCongThuc = Partial<Record<BcscCotThuongCongThuc, number>>;

/** Tỷ lệ đạt (thang 0–100+) ≥ 85 → min(tỷ lệ, 100)% × mức; ngược lại / thiếu số = 0. */
export function thuongNguong85(tyLeDat: number | null | undefined, muc: number): number {
  if (tyLeDat == null || !Number.isFinite(tyLeDat) || tyLeDat < NGUONG_DAT) return 0;
  return Math.round((Math.min(tyLeDat, 100) / 100) * muc);
}

/** Tỷ lệ lỗi so mục tiêu ≤ 100 → +mức; > 100 → −(tỷ lệ − 100)% × mức; thiếu số = 0. */
export function thuongLoiQl(tyLeLoi: number | null | undefined, muc: number): number {
  if (tyLeLoi == null || !Number.isFinite(tyLeLoi)) return 0;
  if (tyLeLoi <= 100) return muc;
  return -Math.round(((tyLeLoi - 100) / 100) * muc);
}

/**
 * Các cột thưởng do công thức quyết định cho dòng preset `index` (0–2).
 * `tyLeDat` = thực tế ÷ mục tiêu × 100 (KHÔNG phải % chênh lệch đang hiện ở dòng thu hồi).
 * Cột không có trong kết quả = nhập tay. Dòng ngoài preset → {}.
 */
export function computeBcscThuongTheoCongThuc(
  index: number,
  tyLeDat: number | null | undefined
): BcscThuongCongThuc {
  const m = BCSC_MUC_THUONG_NGAY;
  switch (index) {
    case 0:
      return {
        thuong_ql: thuongNguong85(tyLeDat, m.ql.nangSuat),
        thuong_nhom_tia: thuongNguong85(tyLeDat, m.tia.nangSuat),
        thuong_nhom_cp: thuongNguong85(tyLeDat, m.cp.nangSuat),
      };
    case 1:
      // Tỉa không có KPI lỗi; CP lỗi tạm nhập tay.
      return { thuong_ql: thuongLoiQl(tyLeDat, m.ql.loi), thuong_nhom_tia: 0 };
    case 2:
      // CP không có KPI thu hồi.
      return {
        thuong_ql: thuongNguong85(tyLeDat, m.ql.thuHoi),
        thuong_nhom_tia: thuongNguong85(tyLeDat, m.tia.thuHoi),
        thuong_nhom_cp: 0,
      };
    default:
      return {};
  }
}
