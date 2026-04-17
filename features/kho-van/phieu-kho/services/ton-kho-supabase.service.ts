/**
 * Tồn kho từ view fp_mh_ton_kho (Supabase) và định mức từ bảng fp_mh_dinh_muc_ton_kho.
 */

import { supabase, fetchAllRows } from '../../../../lib/supabase';

const VIEW_TON_KHO = 'fp_mh_ton_kho';

export interface TonKhoRecord {
  id_kho: string;
  id_hang_hoa: string;
  so_luong: number;
}
const TABLE_DINH_MUC = 'fp_mh_dinh_muc_ton_kho';

interface TonKhoViewRow {
  kho_id: number;
  id_hang_hoa: number;
  so_luong: number;
}

interface DinhMucDbRow {
  id: number;
  kho_id: number;
  hang_hoa_id: number;
  ton_toi_thieu: number | null;
}

/** Bản ghi định mức tồn kho (để hiển thị list / detail). */
export interface DinhMucTonKhoRow {
  id: string;
  kho_id: string;
  hang_hoa_id: string;
  ton_toi_thieu: number;
}

function rowToTonKho(r: TonKhoViewRow): TonKhoRecord {
  return {
    id_kho: String(r.kho_id),
    id_hang_hoa: String(r.id_hang_hoa),
    so_luong: Number(r.so_luong),
  };
}

/** Phạm vi tải ma trận tồn (giảm egress khi chỉ xem một số chi nhánh). */
export type TonKhoMatrixScope =
  | { kind: 'all' }
  | { kind: 'none' }
  | { kind: 'ids'; ids: string[] };

function tonKhoMatrixFromRpcPayload(raw: unknown): TonKhoRecord[] {
  if (!Array.isArray(raw)) return [];
  const out: TonKhoRecord[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== 'object') continue;
    const o = item as { kho_id?: unknown; id_hang_hoa?: unknown; so_luong?: unknown };
    out.push({
      id_kho: String(o.kho_id),
      id_hang_hoa: String(o.id_hang_hoa),
      so_luong: Number(o.so_luong),
    });
  }
  return out;
}

/** REST fallback khi RPC chưa deploy hoặc lỗi — vẫn hỗ trợ lọc kho. */
async function fetchTonKhoMatrixViaRest(scope: TonKhoMatrixScope): Promise<TonKhoRecord[]> {
  if (scope.kind === 'none') return [];
  const idsOnly = scope.kind === 'ids' ? scope.ids : null;
  if (idsOnly !== null && idsOnly.length === 0) return [];
  const nums =
    idsOnly !== null ? idsOnly.map(Number).filter((n) => !Number.isNaN(n)) : null;
  const rows = await fetchAllRows<TonKhoViewRow>((from, to) => {
    let q = supabase.from(VIEW_TON_KHO).select('kho_id, id_hang_hoa, so_luong');
    if (nums !== null && nums.length > 0) q = q.in('kho_id', nums);
    return q.range(from, to);
  });
  return rows.map(rowToTonKho);
}

/**
 * Ma trận tồn — ưu tiên RPC `rpc_ton_kho_matrix` (một response, có lọc kho).
 * @see docs/supabase-rpc_ton_kho_matrix.sql
 */
export async function getTonKhoMatrixSupabase(scope: TonKhoMatrixScope): Promise<TonKhoRecord[]> {
  if (scope.kind === 'none') return [];
  if (scope.kind === 'ids' && scope.ids.length === 0) return [];

  const pKhoIds =
    scope.kind === 'all' ? null : scope.ids.map(Number).filter((n) => !Number.isNaN(n));

  const { data, error } = await supabase.rpc('rpc_ton_kho_matrix', {
    p_kho_ids: scope.kind === 'all' ? null : pKhoIds,
  });

  if (!error && data != null) {
    return tonKhoMatrixFromRpcPayload(data as unknown);
  }

  return fetchTonKhoMatrixViaRest(scope);
}

/** Toàn bộ tồn (báo cáo NXT, …) — không lọc kho. */
export async function getAllTonKhoSupabase(): Promise<TonKhoRecord[]> {
  return getTonKhoMatrixSupabase({ kind: 'all' });
}

/** Lấy tồn tại (kho, hàng). Trả về 0 nếu không có. */
export async function getTonKhoSupabase(id_kho: string, id_hang_hoa: string): Promise<number> {
  const khoNum = Number(id_kho);
  const hhNum = Number(id_hang_hoa);
  if (Number.isNaN(khoNum) || Number.isNaN(hhNum)) return 0;
  const { data, error } = await supabase
    .from(VIEW_TON_KHO)
    .select('so_luong')
    .eq('kho_id', khoNum)
    .eq('id_hang_hoa', hhNum)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data != null ? Number(data.so_luong) : 0;
}

/** Lấy toàn bộ tồn theo một kho. */
export async function getTonKhoTheoKhoSupabase(
  id_kho: string
): Promise<{ id_hang_hoa: string; so_luong: number }[]> {
  const khoNum = Number(id_kho);
  if (Number.isNaN(khoNum)) return [];
  const { data, error } = await supabase
    .from(VIEW_TON_KHO)
    .select('id_hang_hoa, so_luong')
    .eq('kho_id', khoNum);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { id_hang_hoa: number; so_luong: number }) => ({
    id_hang_hoa: String(r.id_hang_hoa),
    so_luong: Number(r.so_luong),
  }));
}

/** Lấy tồn theo từng kho cho một hàng hóa. */
export async function getTonKhoTheoHangHoaSupabase(
  id_hang_hoa: string
): Promise<{ id_kho: string; so_luong: number }[]> {
  const hhNum = Number(id_hang_hoa);
  if (Number.isNaN(hhNum)) return [];
  const { data, error } = await supabase
    .from(VIEW_TON_KHO)
    .select('kho_id, so_luong')
    .eq('id_hang_hoa', hhNum);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { kho_id: number; so_luong: number }) => ({
    id_kho: String(r.kho_id),
    so_luong: Number(r.so_luong),
  }));
}

/** Map key (kho_id, hang_hoa_id) -> ton_toi_thieu (chỉ cặp có định mức). */
export type DinhMucTonKhoMap = Map<string, number>;

const dinhMucKey = (kho_id: string, hang_hoa_id: string) => `${kho_id}|${hang_hoa_id}`;

/** Lấy toàn bộ định mức tồn kho (kho_id, hang_hoa_id, ton_toi_thieu). Trả về Map để tra nhanh. */
export async function getDinhMucTonKhoSupabase(): Promise<DinhMucTonKhoMap> {
  const rows = await fetchAllRows<DinhMucDbRow>((from, to) =>
    supabase.from(TABLE_DINH_MUC).select('kho_id, hang_hoa_id, ton_toi_thieu').range(from, to)
  );
  const map: DinhMucTonKhoMap = new Map();
  rows.forEach((r) => {
    const v = r.ton_toi_thieu != null ? Number(r.ton_toi_thieu) : null;
    if (v != null && !Number.isNaN(v)) {
      map.set(dinhMucKey(String(r.kho_id), String(r.hang_hoa_id)), v);
    }
  });
  return map;
}

function rowToDinhMuc(r: DinhMucDbRow): DinhMucTonKhoRow {
  return {
    id: String(r.id),
    kho_id: String(r.kho_id),
    hang_hoa_id: String(r.hang_hoa_id),
    ton_toi_thieu: r.ton_toi_thieu != null ? Number(r.ton_toi_thieu) : 0,
  };
}

/** Lấy danh sách định mức tồn kho (đủ cột cho tab Định mức tồn). */
export async function getDinhMucListSupabase(): Promise<DinhMucTonKhoRow[]> {
  const rows = await fetchAllRows<DinhMucDbRow>((from, to) =>
    supabase.from(TABLE_DINH_MUC).select('id, kho_id, hang_hoa_id, ton_toi_thieu').range(from, to)
  );
  return rows.map(rowToDinhMuc);
}

/** Lấy định mức theo một hàng hóa (cho detail / bảng con). */
export async function getDinhMucByHangHoaSupabase(hang_hoa_id: string): Promise<DinhMucTonKhoRow[]> {
  const num = Number(hang_hoa_id);
  if (Number.isNaN(num)) return [];
  const { data, error } = await supabase
    .from(TABLE_DINH_MUC)
    .select('id, kho_id, hang_hoa_id, ton_toi_thieu')
    .eq('hang_hoa_id', num);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: DinhMucDbRow) => rowToDinhMuc(r));
}

/** Tạo định mức tồn kho. */
export async function createDinhMucTonKhoSupabase(payload: {
  kho_id: string;
  hang_hoa_id: string;
  ton_toi_thieu: number;
}): Promise<DinhMucTonKhoRow> {
  const { data, error } = await supabase
    .from(TABLE_DINH_MUC)
    .insert({
      kho_id: Number(payload.kho_id),
      hang_hoa_id: Number(payload.hang_hoa_id),
      ton_toi_thieu: payload.ton_toi_thieu,
    })
    .select('id, kho_id, hang_hoa_id, ton_toi_thieu')
    .single();
  if (error) throw new Error(error.message);
  return rowToDinhMuc(data as DinhMucDbRow);
}

/** Cập nhật định mức tồn kho. */
export async function updateDinhMucTonKhoSupabase(
  id: string,
  payload: { ton_toi_thieu: number }
): Promise<DinhMucTonKhoRow> {
  const { data, error } = await supabase
    .from(TABLE_DINH_MUC)
    .update({ ton_toi_thieu: payload.ton_toi_thieu })
    .eq('id', Number(id))
    .select('id, kho_id, hang_hoa_id, ton_toi_thieu')
    .single();
  if (error) throw new Error(error.message);
  return rowToDinhMuc(data as DinhMucDbRow);
}

/** Xóa định mức tồn kho. */
export async function deleteDinhMucTonKhoSupabase(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE_DINH_MUC).delete().eq('id', Number(id));
  if (error) throw new Error(error.message);
}

export { dinhMucKey };
