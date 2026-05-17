/** Chi tiết từng ô trên dòng chuyền — bảng fp_farm_bao_cao_nhan_cong_ct_sub */

export const LOAI_CHI_TIEU_CODES = ['CN_NGAY', 'CN_NUA', 'TANG_CA'] as const;
export type LoaiChiTieu = (typeof LOAI_CHI_TIEU_CODES)[number];

export interface FarmBaoCaoNhanCongCtSub {
  id: string;
  id_bcnc_ct: string;
  loai_chi_tieu: LoaiChiTieu;
  thu_tu: number;
  sl_cong: number;
  so_gio: number;
  ghi_chu: string | null;
}

export type ChiTietSubByLoai = Record<LoaiChiTieu, FarmBaoCaoNhanCongCtSub[]>;

export interface CtSubFormRow {
  sl_cong: number;
  so_gio: number;
  ghi_chu?: string | null;
}

/** Chuẩn hoá sub từ form (zod có thể thiếu ghi_chu) sang ChiTietSubFormByLoai */
export function normalizeChiTietSubFormByLoai(sub: Partial<ChiTietSubFormByLoai> | undefined): ChiTietSubFormByLoai {
  const row = (r: CtSubFormRow): CtSubFormRow => ({
    sl_cong: num(r.sl_cong),
    so_gio: num(r.so_gio),
    ghi_chu: r.ghi_chu ?? null,
  });
  const s = sub ?? emptySubFormByLoai();
  return {
    CN_NGAY: (s.CN_NGAY ?? []).map(row),
    CN_NUA: (s.CN_NUA ?? []).map(row),
    TANG_CA: (s.TANG_CA ?? []).map(row),
  };
}

export type ChiTietSubFormByLoai = Record<LoaiChiTieu, CtSubFormRow[]>;

export function emptySubFormByLoai(): ChiTietSubFormByLoai {
  return { CN_NGAY: [], CN_NUA: [], TANG_CA: [] };
}

export function defaultCtSubFormRow(): CtSubFormRow {
  return { sl_cong: 0, so_gio: 0, ghi_chu: null };
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Tổng SL công nhân theo chỉ tiêu */
export function sumSlCongFromSubRows(rows: CtSubFormRow[]): number {
  return rows.reduce((s, r) => s + num(r.sl_cong), 0);
}

/** Tổng giờ công = Σ(sl × giờ) */
export function sumGioCongFromSubRows(rows: CtSubFormRow[]): number {
  return rows.reduce((s, r) => s + num(r.sl_cong) * num(r.so_gio), 0);
}

export function sumGioCongFromSubModels(rows: FarmBaoCaoNhanCongCtSub[]): number {
  return rows.reduce((s, r) => s + num(r.sl_cong) * num(r.so_gio), 0);
}

/** Giờ×SL tăng ca: ưu tiên Σ(sl×giờ) từ sub; không có sub thì sl_tang_ca × so_gio_tc */
export function tongGioTangCaTichFromCt(
  slTangCa: number,
  soGioTc: number,
  subTangCa: CtSubFormRow[] | FarmBaoCaoNhanCongCtSub[] | undefined
): number {
  if (subTangCa && subTangCa.length > 0) {
    return sumGioCongFromSubRows(subTangCa as CtSubFormRow[]);
  }
  return num(slTangCa) * num(soGioTc);
}

export function syncChiTietTotalsFromSub(
  sub: Partial<ChiTietSubFormByLoai> | ChiTietSubFormByLoai
): {
  sl_cong_ngay: number;
  sl_cong_nua: number;
  sl_tang_ca: number;
  so_gio_tc: number;
} {
  return syncChiTietTotalsFromSubNormalized(normalizeChiTietSubFormByLoai(sub));
}

function syncChiTietTotalsFromSubNormalized(sub: ChiTietSubFormByLoai): {
  sl_cong_ngay: number;
  sl_cong_nua: number;
  sl_tang_ca: number;
  so_gio_tc: number;
} {
  const tangCa = sub.TANG_CA;
  const sumSlTc = sumSlCongFromSubRows(tangCa);
  const sumGioTc = sumGioCongFromSubRows(tangCa);
  return {
    sl_cong_ngay: sumSlCongFromSubRows(sub.CN_NGAY),
    sl_cong_nua: sumSlCongFromSubRows(sub.CN_NUA),
    sl_tang_ca: sumSlTc,
    so_gio_tc: sumSlTc > 0 ? sumGioTc / sumSlTc : 0,
  };
}

/** Chuyển ChiTietSubByLoai (model) sang form rows */
export function subByLoaiModelsToForm(sub: ChiTietSubByLoai): ChiTietSubFormByLoai {
  const out = emptySubFormByLoai();
  for (const k of LOAI_CHI_TIEU_CODES) {
    out[k] = (sub[k] ?? []).map((r) => ({
      sl_cong: num(r.sl_cong),
      so_gio: num(r.so_gio),
      ghi_chu: r.ghi_chu ?? null,
    }));
  }
  return out;
}

export function groupSubModelsByLoai(rows: FarmBaoCaoNhanCongCtSub[]): ChiTietSubByLoai {
  const out: ChiTietSubByLoai = { CN_NGAY: [], CN_NUA: [], TANG_CA: [] };
  for (const r of [...rows].sort((a, b) => a.thu_tu - b.thu_tu)) {
    if (LOAI_CHI_TIEU_CODES.includes(r.loai_chi_tieu)) {
      out[r.loai_chi_tieu].push(r);
    }
  }
  return out;
}

/** Dữ liệu cũ không có sub: tạo 1 dòng mirror để sửa tiếp trên form */
export function legacyMirrorSubFromCtTotals(row: {
  sl_cong_ngay: number;
  sl_cong_nua: number;
  sl_tang_ca: number;
  so_gio_tc: number;
}): ChiTietSubFormByLoai {
  const sub = emptySubFormByLoai();
  if (num(row.sl_cong_ngay) > 0) {
    sub.CN_NGAY.push({ sl_cong: num(row.sl_cong_ngay), so_gio: 0, ghi_chu: null });
  }
  if (num(row.sl_cong_nua) > 0) {
    sub.CN_NUA.push({ sl_cong: num(row.sl_cong_nua), so_gio: 0, ghi_chu: null });
  }
  if (num(row.sl_tang_ca) > 0 || num(row.so_gio_tc) > 0) {
    sub.TANG_CA.push({
      sl_cong: num(row.sl_tang_ca),
      so_gio: num(row.so_gio_tc),
      ghi_chu: null,
    });
  }
  return sub;
}

export function hasAnySubRow(sub: ChiTietSubFormByLoai): boolean {
  return LOAI_CHI_TIEU_CODES.some((k) => (sub[k]?.length ?? 0) > 0);
}

export function countSubLines(sub: ChiTietSubFormByLoai): number {
  return LOAI_CHI_TIEU_CODES.reduce((n, k) => n + (sub[k]?.length ?? 0), 0);
}

/** Chỉ sửa nhanh trên bảng khi mỗi chỉ tiêu có tối đa 1 dòng con */
export function canQuickEditSub(sub: ChiTietSubFormByLoai): boolean {
  return LOAI_CHI_TIEU_CODES.every((k) => (sub[k]?.length ?? 0) <= 1);
}

export function needsMultiLineEditor(sub: ChiTietSubFormByLoai): boolean {
  return !canQuickEditSub(sub);
}

export function hasSubLinesOnCt(row: { sub_by_loai?: ChiTietSubByLoai }): boolean {
  const s = row.sub_by_loai;
  if (!s) return false;
  return LOAI_CHI_TIEU_CODES.some((k) => (s[k]?.length ?? 0) > 0);
}

export function countSubLinesOnCt(row: { sub_by_loai?: ChiTietSubByLoai }): number {
  const s = row.sub_by_loai;
  if (!s) return 0;
  return LOAI_CHI_TIEU_CODES.reduce((n, k) => n + (s[k]?.length ?? 0), 0);
}

/** Giờ dòng đầu của chỉ tiêu (nhập nhanh trên bảng) */
export function getSubLoaiQuickGio(sub: ChiTietSubFormByLoai, loai: LoaiChiTieu): number {
  return num(sub[loai]?.[0]?.so_gio);
}

/** Gán SL + giờ cho một chỉ tiêu (1 dòng) — dùng nhập nhanh trên bảng */
export function setSubLoaiQuickValue(
  sub: ChiTietSubFormByLoai,
  loai: LoaiChiTieu,
  sl: number,
  soGio?: number
): ChiTietSubFormByLoai {
  const next = { ...sub, CN_NGAY: [...sub.CN_NGAY], CN_NUA: [...sub.CN_NUA], TANG_CA: [...sub.TANG_CA] };
  const ghiChu = next[loai][0]?.ghi_chu ?? null;
  const gioVal = soGio !== undefined ? num(soGio) : num(next[loai][0]?.so_gio);
  if (num(sl) <= 0 && gioVal <= 0) {
    next[loai] = [];
    return next;
  }
  next[loai] = [{ sl_cong: num(sl), so_gio: gioVal, ghi_chu: ghiChu }];
  return next;
}
