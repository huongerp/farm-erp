/** Chi tiết từng ô trên dòng chuyền — bảng fp_farm_bao_cao_nhan_cong_ct_sub */

import { formatNumberVN } from '../../../../lib/utils';

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
  ghi_chu: string | null;
}

/** Dòng sub khi chỉ cần sl/gio (display, export) — ghi_chu có thể thiếu. */
export type CtSubFormRowInput = Pick<CtSubFormRow, 'sl_cong' | 'so_gio'> & Partial<Pick<CtSubFormRow, 'ghi_chu'>>;

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

export function isSubFormRowEmpty(r: CtSubFormRowInput | undefined): boolean {
  if (!r) return true;
  return num(r.sl_cong) <= 0 && num(r.so_gio) <= 0 && !(r.ghi_chu?.trim());
}

/** SL và giờ phải cùng trống hoặc cùng có giá trị > 0. */
export function isSubFormRowSlGioPaired(r: CtSubFormRowInput | undefined): boolean {
  if (!r) return true;
  const sl = num(r.sl_cong);
  const gio = num(r.so_gio);
  if (sl <= 0 && gio <= 0) return true;
  return sl > 0 && gio > 0;
}

export function findSubSlGioPairIssues(
  sub: Partial<ChiTietSubFormByLoai> | undefined
): Array<{ loai: LoaiChiTieu; index: number }> {
  const normalized = normalizeChiTietSubFormByLoai(sub);
  const n = subAlignedRowCount(normalized);
  const issues: Array<{ loai: LoaiChiTieu; index: number }> = [];
  for (let i = 0; i < n; i++) {
    for (const loai of LOAI_CHI_TIEU_CODES) {
      if (!isSubFormRowSlGioPaired(normalized[loai][i])) {
        issues.push({ loai, index: i });
      }
    }
  }
  return issues;
}

/** Số dòng chi tiết căn theo max(CN ngày, CN nửa, tăng ca). */
export function subAlignedRowCount(
  sub: Partial<ChiTietSubFormByLoai> | Partial<ChiTietSubByLoai> | undefined
): number {
  if (!sub) return 0;
  return Math.max(0, ...LOAI_CHI_TIEU_CODES.map((k) => (sub[k]?.length ?? 0)));
}

/** Căn độ dài 3 mảng sub theo cùng số dòng. */
export function padSubToRowCount(sub: ChiTietSubFormByLoai, rowCount: number): ChiTietSubFormByLoai {
  const n = Math.max(0, rowCount);
  const out = emptySubFormByLoai();
  for (const loai of LOAI_CHI_TIEU_CODES) {
    const arr = [...(sub[loai] ?? [])];
    while (arr.length < n) arr.push(defaultCtSubFormRow());
    out[loai] = arr.slice(0, n);
  }
  return out;
}

export function ensureSubFormMinRows(sub: Partial<ChiTietSubFormByLoai>, minRows = 1): ChiTietSubFormByLoai {
  const normalized = normalizeChiTietSubFormByLoai(sub);
  const n = Math.max(subAlignedRowCount(normalized), minRows);
  return padSubToRowCount(normalized, n);
}

/** Bỏ dòng trống ở cuối (giữ ít nhất 1 dòng nếu còn dữ liệu phía trên). */
export function trimSubEmptyTrailingRows(sub: ChiTietSubFormByLoai): ChiTietSubFormByLoai {
  const normalized = normalizeChiTietSubFormByLoai(sub);
  let max = subAlignedRowCount(normalized);
  while (max > 1) {
    const i = max - 1;
    const rowEmpty = LOAI_CHI_TIEU_CODES.every((loai) => isSubFormRowEmpty(normalized[loai][i]));
    if (!rowEmpty) break;
    max -= 1;
  }
  if (max === 0) return emptySubFormByLoai();
  return padSubToRowCount(normalized, max);
}

export function getSubLineAtIndex(
  sub: ChiTietSubByLoai | ChiTietSubFormByLoai,
  loai: LoaiChiTieu,
  index: number
): CtSubFormRow | FarmBaoCaoNhanCongCtSub | undefined {
  return sub[loai]?.[index];
}

export function combinedRowGhiChuAtIndex(
  sub: ChiTietSubByLoai | ChiTietSubFormByLoai,
  index: number
): string {
  const parts: string[] = [];
  for (const loai of LOAI_CHI_TIEU_CODES) {
    const g = sub[loai]?.[index]?.ghi_chu?.trim();
    if (g) parts.push(g);
  }
  return [...new Set(parts)].join('\n');
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

export function sumSlCongFromSubModels(rows: FarmBaoCaoNhanCongCtSub[]): number {
  return rows.reduce((s, r) => s + num(r.sl_cong), 0);
}

export function sumGioCongFromSubModels(rows: FarmBaoCaoNhanCongCtSub[]): number {
  return rows.reduce((s, r) => s + num(r.sl_cong) * num(r.so_gio), 0);
}

/** Giờ công một dòng sub */
export function gioCongMotDongSub(line: { sl_cong: number; so_gio: number }): number {
  return num(line.sl_cong) * num(line.so_gio);
}

/** Giờ trung bình = tổng giờ công (Σ sl×giờ) / nhân sự. */
export function gioTbFromTotals(nhanSu: number, tongGioSum: number): number {
  const ns = num(nhanSu);
  return ns > 0 ? num(tongGioSum) / ns : 0;
}

/** Hiển thị giờ TB — tối đa 1 chữ số thập phân (vi-VN). */
export function formatGioTbVN(nhanSu: number, tongGioSum: number): string {
  return formatNumberVN(gioTbFromTotals(nhanSu, tongGioSum), {
    maxFractionDigits: 1,
    minFractionDigits: 0,
  });
}

/** Tổng giờ công CN ngày + CN nửa (Σ sl×giờ). */
export function tongGioCongNgayVaNua(
  cnNgay: { tongGio: number },
  cnNua: { tongGio: number }
): number {
  return num(cnNgay.tongGio) + num(cnNua.tongGio);
}

export interface CtRowForDisplayLoai {
  sl_cong_ngay: number;
  sl_cong_nua: number;
  sl_tang_ca: number;
  so_gio_tc: number;
  sub_by_loai?: ChiTietSubByLoai;
}

/** Nhân sự + giờ (tổng) theo chỉ tiêu — dùng hiển thị detail */
export function displayLoaiTotalsOnCt(
  row: CtRowForDisplayLoai,
  loai: LoaiChiTieu
): { nhanSu: number; tongGio: number } {
  const subs = row.sub_by_loai?.[loai];
  if (subs && subs.length > 0) {
    return {
      nhanSu: sumSlCongFromSubModels(subs),
      tongGio: sumGioCongFromSubModels(subs),
    };
  }
  switch (loai) {
    case 'CN_NGAY':
      return { nhanSu: num(row.sl_cong_ngay), tongGio: 0 };
    case 'CN_NUA':
      return { nhanSu: num(row.sl_cong_nua), tongGio: 0 };
    case 'TANG_CA':
      return {
        nhanSu: num(row.sl_tang_ca),
        tongGio: num(row.sl_tang_ca) * num(row.so_gio_tc),
      };
    default:
      return { nhanSu: 0, tongGio: 0 };
  }
}

/** Cộng nhân sự / giờ tổng từ nhiều dòng chi_tiet form */
export function sumFormLoaiTotalsOnRows(
  rows: { sub?: Partial<ChiTietSubFormByLoai> }[],
  loai: LoaiChiTieu
): { nhanSu: number; tongGio: number } {
  return rows.reduce(
    (acc, r) => {
      const sub = normalizeChiTietSubFormByLoai(r.sub);
      return {
        nhanSu: acc.nhanSu + sumSlCongFromSubRows(sub[loai]),
        tongGio: acc.tongGio + sumGioCongFromSubRows(sub[loai]),
      };
    },
    { nhanSu: 0, tongGio: 0 }
  );
}

export function sumDisplayLoaiTotalsOnRows(
  rows: CtRowForDisplayLoai[],
  loai: LoaiChiTieu
): { nhanSu: number; tongGio: number } {
  return rows.reduce(
    (acc, r) => {
      const d = displayLoaiTotalsOnCt(r, loai);
      return { nhanSu: acc.nhanSu + d.nhanSu, tongGio: acc.tongGio + d.tongGio };
    },
    { nhanSu: 0, tongGio: 0 }
  );
}

/** Tổng giờ QĐ dòng IV (5 chuyền SX): Σ(sl×giờ) CN ngày + CN nửa — khớp cột "Tổng giờ" BCNC. */
export function sumTongGioQuyDoiRowIVFromRows(rows: CtRowForDisplayLoai[]): number {
  const cnNgay = sumDisplayLoaiTotalsOnRows(rows, 'CN_NGAY');
  const cnNua = sumDisplayLoaiTotalsOnRows(rows, 'CN_NUA');
  return tongGioCongNgayVaNua(cnNgay, cnNua);
}

/** Cùng công thức dòng IV — từ form rows (sub form, không phải sub_by_loai). */
export function sumTongGioQuyDoiRowIVFromFormRows(
  rows: { sub?: Partial<ChiTietSubFormByLoai> }[]
): number {
  const cnNgay = sumFormLoaiTotalsOnRows(rows, 'CN_NGAY');
  const cnNua = sumFormLoaiTotalsOnRows(rows, 'CN_NUA');
  return tongGioCongNgayVaNua(cnNgay, cnNua);
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
  return subAlignedRowCount(sub);
}

export function canQuickEditSub(sub: ChiTietSubFormByLoai): boolean {
  return subAlignedRowCount(sub) <= 1;
}

export function needsMultiLineEditor(sub: ChiTietSubFormByLoai): boolean {
  return subAlignedRowCount(sub) > 1;
}

export function hasSubLinesOnCt(
  row: CtRowForDisplayLoai & { sub_by_loai?: ChiTietSubByLoai }
): boolean {
  const s = row.sub_by_loai;
  if (s && subAlignedRowCount(s) > 0) {
    return LOAI_CHI_TIEU_CODES.some((loai) =>
      (s[loai] ?? []).some((line) => !isSubFormRowEmpty(line as CtSubFormRow))
    );
  }
  return (
    num(row.sl_cong_ngay) > 0 ||
    num(row.sl_cong_nua) > 0 ||
    num(row.sl_tang_ca) > 0 ||
    num(row.so_gio_tc) > 0
  );
}

/** Sub để hiển thị detail — fallback mirror từ tổng khi chưa có dòng con. */
export function subByLoaiForCtDisplay(
  row: CtRowForDisplayLoai & { sub_by_loai?: ChiTietSubByLoai }
): ChiTietSubFormByLoai {
  const s = row.sub_by_loai;
  if (s && subAlignedRowCount(s) > 0) {
    return padSubToRowCount(
      {
        CN_NGAY: (s.CN_NGAY ?? []).map((r) => ({
          sl_cong: num(r.sl_cong),
          so_gio: num(r.so_gio),
          ghi_chu: r.ghi_chu ?? null,
        })),
        CN_NUA: (s.CN_NUA ?? []).map((r) => ({
          sl_cong: num(r.sl_cong),
          so_gio: num(r.so_gio),
          ghi_chu: r.ghi_chu ?? null,
        })),
        TANG_CA: (s.TANG_CA ?? []).map((r) => ({
          sl_cong: num(r.sl_cong),
          so_gio: num(r.so_gio),
          ghi_chu: r.ghi_chu ?? null,
        })),
      },
      subAlignedRowCount(s)
    );
  }
  return padSubToRowCount(
    legacyMirrorSubFromCtTotals({
      sl_cong_ngay: row.sl_cong_ngay,
      sl_cong_nua: row.sl_cong_nua,
      sl_tang_ca: row.sl_tang_ca,
      so_gio_tc: row.so_gio_tc,
    }),
    Math.max(1, subAlignedRowCount(legacyMirrorSubFromCtTotals(row)))
  );
}

export function countSubLinesOnCt(
  row: CtRowForDisplayLoai & { sub_by_loai?: ChiTietSubByLoai }
): number {
  return subAlignedRowCount(subByLoaiForCtDisplay(row));
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
  const next = ensureSubFormMinRows(sub, 1);
  const ghiChu = next[loai][0]?.ghi_chu ?? null;
  const gioVal = soGio !== undefined ? num(soGio) : num(next[loai][0]?.so_gio);
  next[loai] = [
    {
      sl_cong: num(sl),
      so_gio: gioVal,
      ghi_chu: ghiChu,
    },
  ];
  return padSubToRowCount(next, 1);
}
