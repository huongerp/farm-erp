import type { FarmBaoCaoSoChe } from './types';
import type { BaoCaoSoCheFormValues } from './schema';
import {
  deriveDonViTinhSlipFromSoLieuMeta,
  emptySoLieuRowMetaForm,
  mergeSoLieuMetaToForm,
} from './so-lieu-row-meta';
import { emptyPhamCapRows, normalizePhamCapFromDb } from './pham-cap';

export function defaultFormValues(): BaoCaoSoCheFormValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    ngay: today,
    id_chi_nhanh: '',
    ten_chi_nhanh: null,
    don_vi_tinh: 'Buồng',
    sl_buong_ton_dau_ngay: 0,
    tong_buong_thu_hoach: 0,
    tong_buong_khong_so_che: 0,
    tong_buong_so_che: 0,
    sl_buong_ton_cuoi_ngay: 0,
    so_lieu_row_meta: emptySoLieuRowMetaForm(),
    pham_cap: emptyPhamCapRows(),
    ghi_chu: null,
  };
}

export function farmBaoCaoSoCheToForm(row: FarmBaoCaoSoChe): BaoCaoSoCheFormValues {
  const soMeta = mergeSoLieuMetaToForm(row.so_lieu_row_meta);
  return {
    ngay: row.ngay,
    id_chi_nhanh: row.id_chi_nhanh != null && String(row.id_chi_nhanh).trim() !== '' ? String(row.id_chi_nhanh) : '',
    ten_chi_nhanh: row.ten_chi_nhanh,
    don_vi_tinh: deriveDonViTinhSlipFromSoLieuMeta(soMeta),
    sl_buong_ton_dau_ngay: Number(row.sl_buong_ton_dau_ngay) || 0,
    tong_buong_thu_hoach: Number(row.tong_buong_thu_hoach) || 0,
    tong_buong_khong_so_che: Number(row.tong_buong_khong_so_che) || 0,
    tong_buong_so_che: Number(row.tong_buong_so_che) || 0,
    sl_buong_ton_cuoi_ngay: Number(row.sl_buong_ton_cuoi_ngay) || 0,
    so_lieu_row_meta: soMeta,
    pham_cap: normalizePhamCapFromDb(row.pham_cap),
    ghi_chu: row.ghi_chu,
  };
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

export function farmBaoCaoSoCheToFormNextDay(row: FarmBaoCaoSoChe): BaoCaoSoCheFormValues {
  const base = farmBaoCaoSoCheToForm(row);
  return { ...base, ngay: addCalendarDaysIso(row.ngay, 1) };
}

export function findBaoCaoSoCheDuplicateByBranchAndDate(
  items: FarmBaoCaoSoChe[],
  ngay: string,
  idChiNhanh: string | null | undefined,
  excludeId?: string | null
): FarmBaoCaoSoChe | undefined {
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
  items: FarmBaoCaoSoChe[],
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
