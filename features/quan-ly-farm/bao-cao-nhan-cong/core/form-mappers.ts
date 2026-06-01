import type { FarmBaoCaoNhanCong } from './types';
import { LOAI_CHUYEN_CODES } from './types';
import type { BaoCaoNhanCongFormValues } from './schema';
import {
  LOAI_CHI_TIEU_CODES,
  emptySubFormByLoai,
  groupSubModelsByLoai,
  hasAnySubRow,
  legacyMirrorSubFromCtTotals,
  subByLoaiModelsToForm,
  syncChiTietTotalsFromSub,
  normalizeChiTietSubFormByLoai,
  ensureSubFormMinRows,
  trimSubEmptyTrailingRows,
  padSubToRowCount,
  type ChiTietSubFormByLoai,
} from './ct-sub';

export function defaultChiTietRows(): BaoCaoNhanCongFormValues['chi_tiet'] {
  return LOAI_CHUYEN_CODES.map((loai_chuyen) => {
    const sub = padSubToRowCount(emptySubFormByLoai(), 1);
    const totals = syncChiTietTotalsFromSub(normalizeChiTietSubFormByLoai(sub));
    return {
      loai_chuyen,
      ...totals,
      ghi_chu: null,
      sub,
    };
  }) as BaoCaoNhanCongFormValues['chi_tiet'];
}

export function defaultFormValues(): BaoCaoNhanCongFormValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    ngay: today,
    id_chi_nhanh: '',
    ten_chi_nhanh: null,
    ghi_chu: null,
    hinh_anh_urls: [],
    chi_tiet: defaultChiTietRows(),
  };
}

export function farmBaoCaoNhanCongToForm(row: FarmBaoCaoNhanCong): BaoCaoNhanCongFormValues {
  const byLoai = new Map(row.chi_tiet.map((c) => [c.loai_chuyen, c]));
  const chi_tiet = LOAI_CHUYEN_CODES.map((code) => {
    const c = byLoai.get(code);
    const subByLoai = c?.sub_by_loai;
    let sub: BaoCaoNhanCongFormValues['chi_tiet'][number]['sub'] =
      subByLoai && (subByLoai.CN_NGAY.length || subByLoai.CN_NUA.length || subByLoai.TANG_CA.length)
        ? subByLoaiModelsToForm(subByLoai)
        : legacyMirrorSubFromCtTotals({
            sl_cong_ngay: c ? Number(c.sl_cong_ngay) : 0,
            sl_cong_nua: c ? Number(c.sl_cong_nua) : 0,
            sl_tang_ca: c ? Number(c.sl_tang_ca) : 0,
            so_gio_tc: c ? Number(c.so_gio_tc) : 0,
          });
    sub = ensureSubFormMinRows(sub, 1);
    const totals = syncChiTietTotalsFromSub(normalizeChiTietSubFormByLoai(sub));
    return {
      loai_chuyen: code,
      ...totals,
      ghi_chu: c?.ghi_chu ?? null,
      sub,
    };
  }) as BaoCaoNhanCongFormValues['chi_tiet'];

  return {
    ngay: row.ngay,
    id_chi_nhanh: row.id_chi_nhanh != null && String(row.id_chi_nhanh).trim() !== '' ? String(row.id_chi_nhanh) : '',
    ten_chi_nhanh: row.ten_chi_nhanh,
    ghi_chu: row.ghi_chu,
    hinh_anh_urls: Array.isArray(row.hinh_anh_urls) ? [...row.hinh_anh_urls] : [],
    chi_tiet,
  };
}

/** Đồng bộ tổng trên từng dòng chi_tiet từ sub (gọi trước submit). */
export function applySubTotalsToChiTietForm(
  chi_tiet: BaoCaoNhanCongFormValues['chi_tiet']
): BaoCaoNhanCongFormValues['chi_tiet'] {
  return chi_tiet.map((row) => {
    const sub = normalizeChiTietSubFormByLoai(trimSubEmptyTrailingRows(normalizeChiTietSubFormByLoai(row.sub)));
    const totals = syncChiTietTotalsFromSub(sub);
    return { ...row, sub, ...totals };
  });
}

/** Ngày ISO yyyy-mm-dd + số ngày (theo lịch local). */
export function addCalendarDaysIso(isoDate: string, deltaDays: number): string {
  const raw = isoDate.slice(0, 10);
  const [y, m, d] = raw.split('-').map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return raw;
  }
  const dt = new Date(y, m - 1, d + deltaDays);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function clearSubGhiChu(sub: ChiTietSubFormByLoai): ChiTietSubFormByLoai {
  const out = emptySubFormByLoai();
  for (const loai of LOAI_CHI_TIEU_CODES) {
    out[loai] = (sub[loai] ?? []).map((r) => ({ ...r, ghi_chu: null }));
  }
  return out;
}

/** Copy sang ngày kế: giữ số liệu chuyền/sub, không copy ghi chú phiếu / chuyền / ảnh. */
export function farmBaoCaoNhanCongToFormNextDay(row: FarmBaoCaoNhanCong): BaoCaoNhanCongFormValues {
  const base = farmBaoCaoNhanCongToForm(row);
  return {
    ...base,
    ngay: addCalendarDaysIso(row.ngay, 1),
    ghi_chu: null,
    hinh_anh_urls: [],
    chi_tiet: base.chi_tiet.map((ct) => ({
      ...ct,
      ghi_chu: null,
      sub: normalizeChiTietSubFormByLoai(clearSubGhiChu(normalizeChiTietSubFormByLoai(ct.sub))),
    })),
  };
}

export function findBaoCaoDuplicateByBranchAndDate(
  items: FarmBaoCaoNhanCong[],
  ngay: string,
  idChiNhanh: string | null | undefined,
  excludeId?: string | null
): FarmBaoCaoNhanCong | undefined {
  if (!idChiNhanh || String(idChiNhanh).trim() === '' || !ngay) return undefined;
  const idStr = String(idChiNhanh);
  return items.find(
    (r) =>
      r.id !== excludeId &&
      r.ngay === ngay &&
      r.id_chi_nhanh != null &&
      String(r.id_chi_nhanh) === idStr
  );
}

export function getPreferredBranchFromUserLastRecords(
  items: FarmBaoCaoNhanCong[],
  userId: string | number | undefined
): { id_chi_nhanh: string; ten_chi_nhanh: string } | null {
  if (userId == null || userId === '') return null;
  const uid = String(userId);
  const mine = items
    .filter((r) => r.id_nguoi_tao === uid && r.id_chi_nhanh && r.ten_chi_nhanh)
    .sort((a, b) => new Date(b.tg_tao).getTime() - new Date(a.tg_tao).getTime());
  const first = mine[0];
  if (!first?.id_chi_nhanh || !first.ten_chi_nhanh) return null;
  return { id_chi_nhanh: first.id_chi_nhanh, ten_chi_nhanh: first.ten_chi_nhanh };
}

export { hasAnySubRow, groupSubModelsByLoai };
