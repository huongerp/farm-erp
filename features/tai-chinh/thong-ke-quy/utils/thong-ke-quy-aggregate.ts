/**
 * Chuẩn hóa payload RPC thống kê quỹ (numeric của Postgres về dưới dạng chuỗi)
 * và các phép cộng phục vụ biểu đồ / bảng. Thuần, test cạnh file.
 */
import type { ThongKeQuyRow, ThongKeQuyStats } from '../core/types';

function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toRows(raw: unknown): ThongKeQuyRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => {
    const row = (r ?? {}) as Record<string, unknown>;
    return {
      id: row.id != null ? String(row.id) : undefined,
      ten: row.ten != null ? String(row.ten) : undefined,
      thang: row.thang != null ? String(row.thang) : undefined,
      nguon: row.nguon != null ? String(row.nguon) : undefined,
      thu: num(row.thu),
      chi: num(row.chi),
      so_phieu: row.so_phieu != null ? num(row.so_phieu) : undefined,
    };
  });
}

export const EMPTY_STATS: ThongKeQuyStats = {
  ton_dau_ky: 0,
  tong_thu: 0,
  tong_chi: 0,
  ton_cuoi_ky: 0,
  so_phieu: 0,
  theo_hang_muc: [],
  theo_thang: [],
  theo_chi_nhanh: [],
  theo_nguon_chung_tu: [],
};

export function normalizeThongKeQuyStats(raw: unknown): ThongKeQuyStats {
  if (!raw || typeof raw !== 'object') return EMPTY_STATS;
  const o = raw as Record<string, unknown>;
  const tonDauKy = num(o.ton_dau_ky);
  const tongThu = num(o.tong_thu);
  const tongChi = num(o.tong_chi);
  return {
    ton_dau_ky: tonDauKy,
    tong_thu: tongThu,
    tong_chi: tongChi,
    // Luôn suy lại để bảng cân: đầu kỳ + thu − chi = cuối kỳ.
    ton_cuoi_ky: tonDauKy + tongThu - tongChi,
    so_phieu: num(o.so_phieu),
    theo_hang_muc: toRows(o.theo_hang_muc),
    theo_thang: toRows(o.theo_thang),
    theo_chi_nhanh: toRows(o.theo_chi_nhanh),
    theo_nguon_chung_tu: toRows(o.theo_nguon_chung_tu),
  };
}

/** Tỷ trọng chi của từng hạng mục (phục vụ biểu đồ tròn). Tổng chi = 0 → mảng rỗng. */
export function tyTrongChiTheoHangMuc(rows: ThongKeQuyRow[]): { ten: string; chi: number; tyLe: number }[] {
  const tongChi = rows.reduce((s, r) => s + r.chi, 0);
  if (tongChi <= 0) return [];
  return rows
    .filter((r) => r.chi > 0)
    .map((r) => ({ ten: r.ten ?? '—', chi: r.chi, tyLe: r.chi / tongChi }))
    .sort((a, b) => b.chi - a.chi);
}
