/**
 * Service chi phí tài sản – đọc/ghi Supabase.
 * Bảng: fp_ts_chi_phi_tai_san (phiếu), fp_ts_trang_thai_chi_phi_tai_san (thiết lập trạng thái).
 * Map: id_trang_thai + ten_trang_thai (DB) <-> trang_thai enum (app: cho_duyet | da_duyet | khong_duyet).
 */
import { supabase } from '../../../../lib/supabase';
import type { PhieuBaoTriSuaChua, PhieuBaoTriSuaChuaCreate } from '../core/types';
import type { TrangThaiPhieu } from '../core/types';
import i18n from '../../../../lib/i18n';

const TABLE_PHIEU = 'fp_ts_chi_phi_tai_san';
const TABLE_TRANG_THAI = 'fp_ts_trang_thai_chi_phi_tai_san';

/** Map id_trang_thai (DB) -> TrangThaiPhieu (app). Seed order: 1=CHO_DUYET, 2=DA_DUYET, 3=KHONG_DUYET */
const ID_TO_TRANG_THAI: Record<number, TrangThaiPhieu> = {
  1: 'cho_duyet',
  2: 'da_duyet',
  3: 'khong_duyet',
};

const TRANG_THAI_TO_ID: Record<TrangThaiPhieu, number> = {
  cho_duyet: 1,
  da_duyet: 2,
  khong_duyet: 3,
};

function idTrangThaiToEnum(id: number): TrangThaiPhieu {
  return ID_TO_TRANG_THAI[id] ?? 'cho_duyet';
}

interface DbPhieuRow {
  id: number;
  ngay: string;
  id_tai_san: number;
  ma_tai_san: string | null;
  ten_tai_san: string | null;
  id_hang_muc: string;
  ten_hang_muc: string | null;
  mo_ta: string;
  so_tien: number;
  ghi_chu: string | null;
  id_trang_thai: number;
  ten_trang_thai: string | null;
  nguoi_duyet: string | null;
  id_nguoi_tao: number | null;
  ten_nguoi_tao: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToPhieu(row: DbPhieuRow): PhieuBaoTriSuaChua {
  return {
    id: String(row.id),
    ngay: row.ngay,
    id_tai_san: String(row.id_tai_san),
    ma_tai_san: row.ma_tai_san ?? undefined,
    ten_tai_san: row.ten_tai_san ?? undefined,
    id_hang_muc: row.id_hang_muc as 'bao_tri' | 'sua_chua',
    ten_hang_muc: row.ten_hang_muc ?? undefined,
    mo_ta: row.mo_ta,
    so_tien: Number(row.so_tien),
    ghi_chu: row.ghi_chu ?? null,
    trang_thai: idTrangThaiToEnum(row.id_trang_thai),
    nguoi_duyet: row.nguoi_duyet ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : '',
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

export interface GetPhieuChiPhiListParams {
  q?: string;
  hang_muc?: string[];
  dateFrom?: string;
  dateTo?: string;
  id_tai_san?: string | string[];
}

export async function getPhieuChiPhiListSupabase(
  params: GetPhieuChiPhiListParams = {}
): Promise<PhieuBaoTriSuaChua[]> {
  let query = supabase
    .from(TABLE_PHIEU)
    .select('*')
    .order('ngay', { ascending: false })
    .order('id', { ascending: false });

  if (params.id_tai_san !== undefined) {
    const ids = Array.isArray(params.id_tai_san) ? params.id_tai_san : [params.id_tai_san];
    const numIds = ids.map((x) => parseInt(x, 10)).filter((n) => !Number.isNaN(n));
    if (numIds.length > 0) query = query.in('id_tai_san', numIds);
  }
  if (params.hang_muc && params.hang_muc.length > 0) {
    query = query.in('id_hang_muc', params.hang_muc);
  }
  if (params.dateFrom) {
    query = query.gte('ngay', params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte('ngay', params.dateTo);
  }

  const { data, error } = await query;
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  let list = (data ?? []).map((r) => rowToPhieu(r as DbPhieuRow));

  if (params.q?.trim()) {
    const q = params.q.trim().toLowerCase();
    list = list.filter(
      (p) =>
        (p.ma_tai_san && p.ma_tai_san.toLowerCase().includes(q)) ||
        (p.ten_tai_san && p.ten_tai_san.toLowerCase().includes(q)) ||
        (p.mo_ta && p.mo_ta.toLowerCase().includes(q)) ||
        (p.ten_nguoi_tao && p.ten_nguoi_tao.toLowerCase().includes(q)) ||
        (p.nguoi_duyet && p.nguoi_duyet.toLowerCase().includes(q))
    );
  }

  return list;
}

export async function getPhieuChiPhiByIdSupabase(id: string): Promise<PhieuBaoTriSuaChua | null> {
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return null;
  const { data, error } = await supabase.from(TABLE_PHIEU).select('*').eq('id', numId).single();
  if (error || !data) return null;
  return rowToPhieu(data as DbPhieuRow);
}

export async function createPhieuChiPhiSupabase(
  data: PhieuBaoTriSuaChuaCreate,
  id_nguoi_tao: string
): Promise<PhieuBaoTriSuaChua> {
  const idTrangThai = data.trang_thai ? TRANG_THAI_TO_ID[data.trang_thai] : 1;
  const payload = {
    ngay: data.ngay,
    id_tai_san: parseInt(data.id_tai_san, 10),
    ma_tai_san: null,
    ten_tai_san: null,
    id_hang_muc: data.id_hang_muc,
    ten_hang_muc: null,
    mo_ta: data.mo_ta.trim(),
    so_tien: data.so_tien,
    ghi_chu: data.ghi_chu?.trim() ?? null,
    id_trang_thai: idTrangThai,
    ten_trang_thai: null,
    nguoi_duyet: data.nguoi_duyet?.trim() ?? null,
    id_nguoi_tao: id_nguoi_tao ? parseInt(id_nguoi_tao, 10) : null,
    ten_nguoi_tao: null,
  };
  const { data: inserted, error } = await supabase.from(TABLE_PHIEU).insert(payload).select('*').single();
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  return rowToPhieu(inserted as DbPhieuRow);
}

export async function updatePhieuChiPhiSupabase(
  id: string,
  data: PhieuBaoTriSuaChuaCreate
): Promise<PhieuBaoTriSuaChua> {
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) throw new Error(i18n.t('baoTriSuaChua.service.notFound', { defaultValue: 'Phiếu không tồn tại' }));
  const idTrangThai = data.trang_thai != null ? TRANG_THAI_TO_ID[data.trang_thai] : undefined;
  const payload: Record<string, unknown> = {
    ngay: data.ngay,
    id_tai_san: parseInt(data.id_tai_san, 10),
    id_hang_muc: data.id_hang_muc,
    mo_ta: data.mo_ta.trim(),
    so_tien: data.so_tien,
    ghi_chu: data.ghi_chu?.trim() ?? null,
    nguoi_duyet: data.nguoi_duyet?.trim() ?? null,
  };
  if (idTrangThai !== undefined) payload.id_trang_thai = idTrangThai;

  const { error } = await supabase.from(TABLE_PHIEU).update(payload).eq('id', numId);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  const { data: updated, error: err2 } = await supabase.from(TABLE_PHIEU).select('*').eq('id', numId).single();
  if (err2 || !updated) throw new Error(i18n.t('baoTriSuaChua.service.notFound', { defaultValue: 'Phiếu không tồn tại' }));
  return rowToPhieu(updated as DbPhieuRow);
}

export async function deletePhieuChiPhiSupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((x) => parseInt(x, 10)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_PHIEU).delete().in('id', numIds);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
}

/** Lấy danh sách trạng thái phiếu từ bảng thiết lập (để combobox, v.v.) */
export async function getTrangThaiChiPhiListSupabase(): Promise<{ id: number; ma: string; ten: string }[]> {
  const { data, error } = await supabase
    .from(TABLE_TRANG_THAI)
    .select('id, ma, ten')
    .order('thu_tu', { ascending: true });
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  return (data ?? []).map((r: { id: number; ma: string; ten: string }) => ({ id: r.id, ma: r.ma, ten: r.ten }));
}
