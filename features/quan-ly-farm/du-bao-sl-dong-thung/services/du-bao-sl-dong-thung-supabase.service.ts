/**
 * Dự báo SL đóng thùng — Supabase fp_farm_du_bao_sl_dong_thung
 */
import { supabase, throwSupabaseError, formatSupabaseError } from '../../../../lib/supabase';
import type { FarmDuBaoSlDongThung, TrangThaiDuBaoSlDongThungPhieu } from '../core/types';
import { TRANG_THAI_DU_BAO_SL_DONG_THUNG } from '../core/types';
import type { DuBaoSlDongThungFormValues } from '../core/schema';

const TABLE = 'fp_farm_du_bao_sl_dong_thung';

const ROW_SELECT =
  'id,ngay,id_chi_nhanh,ten_chi_nhanh,so_buong_can_mau,tong_can_nang_mau,tong_buong_nhap_ke_hoach,ty_le_thu_hoi_ke_hoach,quy_cach_dong_thung_ke_hoach,tong_buong_nhap_thuc_te,ty_le_thu_hoi_thuc_te,quy_cach_dong_thung_thuc_te,ghi_chu,id_nguoi_tao,trang_thai,tg_tao,tg_cap_nhat';

function parseIdToInt8(id: string | null | undefined): number | null {
  if (id == null || id === '') return null;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function mapInsertUpdateError(err: unknown): Error {
  return new Error(formatSupabaseError(err, { resource: TABLE }));
}

function num(v: string | number | null | undefined): number {
  if (v == null || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeTrangThaiDb(v: string | null | undefined): TrangThaiDuBaoSlDongThungPhieu {
  return v === TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA ? TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA : TRANG_THAI_DU_BAO_SL_DONG_THUNG.MO;
}

interface DbRow {
  id: number;
  ngay: string;
  id_chi_nhanh: number | null;
  ten_chi_nhanh: string | null;
  so_buong_can_mau: number | null;
  tong_can_nang_mau: string | number | null;
  tong_buong_nhap_ke_hoach: number | null;
  ty_le_thu_hoi_ke_hoach: string | number | null;
  quy_cach_dong_thung_ke_hoach: string | number | null;
  tong_buong_nhap_thuc_te: number | null;
  ty_le_thu_hoi_thuc_te: string | number | null;
  quy_cach_dong_thung_thuc_te: string | number | null;
  ghi_chu: string | null;
  id_nguoi_tao: number | null;
  trang_thai: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToModel(row: DbRow): FarmDuBaoSlDongThung {
  return {
    id: String(row.id),
    ngay: typeof row.ngay === 'string' ? row.ngay.slice(0, 10) : String(row.ngay),
    id_chi_nhanh: row.id_chi_nhanh != null ? String(row.id_chi_nhanh) : null,
    ten_chi_nhanh: row.ten_chi_nhanh ?? null,
    so_buong_can_mau: Math.max(0, Math.floor(num(row.so_buong_can_mau))),
    tong_can_nang_mau: num(row.tong_can_nang_mau),
    tong_buong_nhap_ke_hoach: Math.max(0, Math.floor(num(row.tong_buong_nhap_ke_hoach))),
    ty_le_thu_hoi_ke_hoach: num(row.ty_le_thu_hoi_ke_hoach),
    quy_cach_dong_thung_ke_hoach: num(row.quy_cach_dong_thung_ke_hoach),
    tong_buong_nhap_thuc_te: Math.max(0, Math.floor(num(row.tong_buong_nhap_thuc_te))),
    ty_le_thu_hoi_thuc_te: num(row.ty_le_thu_hoi_thuc_te),
    quy_cach_dong_thung_thuc_te: num(row.quy_cach_dong_thung_thuc_te),
    ghi_chu: row.ghi_chu ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: null,
    trang_thai: normalizeTrangThaiDb(row.trang_thai),
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function pctToFraction(pct: number): number {
  return Math.min(1, Math.max(0, (Number(pct) || 0) / 100));
}

function bodyFromForm(values: DuBaoSlDongThungFormValues, trangThai: TrangThaiDuBaoSlDongThungPhieu) {
  return {
    ngay: values.ngay,
    id_chi_nhanh: parseIdToInt8(values.id_chi_nhanh),
    ten_chi_nhanh: values.ten_chi_nhanh?.trim() || null,
    so_buong_can_mau: Math.max(0, Math.floor(Number(values.so_buong_can_mau) || 0)),
    tong_can_nang_mau: Number(values.tong_can_nang_mau) || 0,
    tong_buong_nhap_ke_hoach: Math.max(0, Math.floor(Number(values.tong_buong_nhap_ke_hoach) || 0)),
    ty_le_thu_hoi_ke_hoach: pctToFraction(values.ty_le_thu_hoi_ke_hoach_pct),
    quy_cach_dong_thung_ke_hoach: Number(values.quy_cach_dong_thung_ke_hoach) || 0,
    tong_buong_nhap_thuc_te: Math.max(0, Math.floor(Number(values.tong_buong_nhap_thuc_te) || 0)),
    ty_le_thu_hoi_thuc_te: pctToFraction(values.ty_le_thu_hoi_thuc_te_pct),
    quy_cach_dong_thung_thuc_te: Number(values.quy_cach_dong_thung_thuc_te) || 0,
    ghi_chu: values.ghi_chu?.trim() || null,
    trang_thai: trangThai,
    tg_cap_nhat: new Date().toISOString(),
  };
}

export async function getAllDuBaoSlDongThungSupabase(): Promise<FarmDuBaoSlDongThung[]> {
  const { data, error } = await supabase.from(TABLE).select(ROW_SELECT).order('ngay', { ascending: false });
  if (error) throwSupabaseError(error, { resource: `${TABLE}.list` });
  return ((data ?? []) as DbRow[]).map(rowToModel);
}

export async function getDuBaoSlDongThungByIdSupabase(id: string): Promise<FarmDuBaoSlDongThung | null> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return null;
  const { data, error } = await supabase.from(TABLE).select(ROW_SELECT).eq('id', numId).maybeSingle();
  if (error) throwSupabaseError(error, { resource: `${TABLE}.byId` });
  if (!data) return null;
  return rowToModel(data as DbRow);
}

export async function createDuBaoSlDongThungSupabase(
  values: DuBaoSlDongThungFormValues,
  idNguoiTao: string | null
): Promise<FarmDuBaoSlDongThung> {
  const payload = {
    ...bodyFromForm(values, TRANG_THAI_DU_BAO_SL_DONG_THUNG.MO),
    id_nguoi_tao: parseIdToInt8(idNguoiTao),
    tg_tao: new Date().toISOString(),
  };
  const { data: inserted, error } = await supabase.from(TABLE).insert(payload).select(ROW_SELECT).single();
  if (error) throw mapInsertUpdateError(error);
  return rowToModel(inserted as DbRow);
}

export async function updateDuBaoSlDongThungSupabase(id: string, values: DuBaoSlDongThungFormValues): Promise<FarmDuBaoSlDongThung> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error('Invalid id');
  const { data: existing, error: e0 } = await supabase.from(TABLE).select('trang_thai').eq('id', numId).maybeSingle();
  if (e0) throwSupabaseError(e0, { resource: `${TABLE}.readTrangThai` });
  const trangThai = normalizeTrangThaiDb((existing as { trang_thai?: string } | null)?.trang_thai);
  const updateBody = bodyFromForm(values, trangThai);
  const { data, error } = await supabase.from(TABLE).update(updateBody).eq('id', numId).select(ROW_SELECT).single();
  if (error) throw mapInsertUpdateError(error);
  return rowToModel(data as DbRow);
}

export async function deleteDuBaoSlDongThungSupabase(id: string): Promise<void> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return;
  const { error } = await supabase.from(TABLE).delete().eq('id', numId);
  if (error) throwSupabaseError(error, { resource: `${TABLE}.delete` });
}

export async function deleteDuBaoSlDongThungManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', numIds);
  if (error) throwSupabaseError(error, { resource: `${TABLE}.deleteMany` });
}

export async function updateDuBaoSlDongThungTrangThaiSupabase(
  id: string,
  trang_thai: TrangThaiDuBaoSlDongThungPhieu
): Promise<FarmDuBaoSlDongThung> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error('Invalid id');
  const next =
    trang_thai === TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA ? TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA : TRANG_THAI_DU_BAO_SL_DONG_THUNG.MO;
  const { error } = await supabase
    .from(TABLE)
    .update({ trang_thai: next, tg_cap_nhat: new Date().toISOString() })
    .eq('id', numId);
  if (error) throwSupabaseError(error, { resource: `${TABLE}.updateTrangThai` });
  return (await getDuBaoSlDongThungByIdSupabase(id))!;
}
