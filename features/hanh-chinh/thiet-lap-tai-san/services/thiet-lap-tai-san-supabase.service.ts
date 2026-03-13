/**
 * Service thiết lập tài sản – đọc/ghi Supabase (fp_ts_nhom_tai_san, fp_ts_trang_thai_tai_san).
 */
import { supabase } from '../../../../lib/supabase';
import type { AssetGroup, AssetStatus } from '../core/types';
import type { AssetGroupFormValues, AssetStatusFormValues } from '../core/schema';
import type { TrangThaiHoatDong } from '../../../../lib/constants';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import i18n from '../../../../lib/i18n';

const TABLE_NHOM = 'fp_ts_nhom_tai_san';
const TABLE_TRANG_THAI = 'fp_ts_trang_thai_tai_san';

function normalizeTrangThai(val: unknown): TrangThaiHoatDong {
  if (val === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
  if (val === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
  return (typeof val === 'string' && val.trim() === 'Ngừng hoạt động')
    ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
    : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

// ---- Nhóm tài sản ----

interface DbNhomRow {
  id: number;
  ma: string;
  ten: string;
  thu_tu: number;
  ghi_chu: string | null;
  phuong_phap_khau_hao: string;
  ty_le_khau_hao: number | null;
  so_nam_su_dung: number | null;
  trang_thai: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToAssetGroup(row: DbNhomRow): AssetGroup {
  return {
    id: String(row.id),
    ma: row.ma,
    ten: row.ten,
    thu_tu: row.thu_tu,
    ghi_chu: row.ghi_chu ?? undefined,
    trang_thai: normalizeTrangThai(row.trang_thai),
    phuong_phap_khau_hao: (row.phuong_phap_khau_hao === 'so_du_giam_dan' ? 'so_du_giam_dan' : 'duong_thang') as AssetGroup['phuong_phap_khau_hao'],
    ty_le_khau_hao: row.ty_le_khau_hao ?? null,
    so_nam_su_dung: row.so_nam_su_dung ?? null,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

export async function getAssetGroupsSupabase(): Promise<AssetGroup[]> {
  const { data, error } = await supabase
    .from(TABLE_NHOM)
    .select('*')
    .order('thu_tu', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  return (data ?? []).map((row) => rowToAssetGroup(row as DbNhomRow));
}

export async function createAssetGroupSupabase(data: AssetGroupFormValues): Promise<AssetGroup> {
  const payload = {
    ma: data.ma,
    ten: data.ten,
    thu_tu: data.thu_tu ?? 0,
    ghi_chu: data.ghi_chu ?? null,
    phuong_phap_khau_hao: data.phuong_phap_khau_hao,
    ty_le_khau_hao: data.ty_le_khau_hao ?? null,
    so_nam_su_dung: data.so_nam_su_dung ?? null,
    trang_thai: data.trang_thai ?? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
  };
  const { data: inserted, error } = await supabase.from(TABLE_NHOM).insert(payload).select('*').single();
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  return rowToAssetGroup(inserted as DbNhomRow);
}

export async function updateAssetGroupSupabase(id: string, data: AssetGroupFormValues): Promise<AssetGroup> {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error(i18n.t('thietLapTaiSan.nhomTaiSan.service.notFound'));
  const payload = {
    ma: data.ma,
    ten: data.ten,
    thu_tu: data.thu_tu ?? 0,
    ghi_chu: data.ghi_chu ?? null,
    phuong_phap_khau_hao: data.phuong_phap_khau_hao,
    ty_le_khau_hao: data.ty_le_khau_hao ?? null,
    so_nam_su_dung: data.so_nam_su_dung ?? null,
    trang_thai: data.trang_thai ?? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
  };
  const { error } = await supabase.from(TABLE_NHOM).update(payload).eq('id', numId);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  const { data: updated, error: err2 } = await supabase.from(TABLE_NHOM).select('*').eq('id', numId).single();
  if (err2 || !updated) throw new Error(i18n.t('thietLapTaiSan.nhomTaiSan.service.notFound'));
  return rowToAssetGroup(updated as DbNhomRow);
}

export async function updateAssetGroupStatusSupabase(
  ids: string[],
  status: TrangThaiHoatDong
): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_NHOM).update({ trang_thai: status }).in('id', numIds);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
}

export async function deleteAssetGroupsSupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_NHOM).delete().in('id', numIds);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
}

// ---- Trạng thái tài sản ----

interface DbTrangThaiRow {
  id: number;
  ma: string;
  ten: string;
  thu_tu: number;
  ghi_chu: string | null;
  trang_thai: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToAssetStatus(row: DbTrangThaiRow): AssetStatus {
  return {
    id: String(row.id),
    ma: row.ma,
    ten: row.ten,
    thu_tu: row.thu_tu,
    ghi_chu: row.ghi_chu ?? undefined,
    trang_thai: normalizeTrangThai(row.trang_thai),
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

export async function getAssetStatusesSupabase(): Promise<AssetStatus[]> {
  const { data, error } = await supabase
    .from(TABLE_TRANG_THAI)
    .select('*')
    .order('thu_tu', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  return (data ?? []).map((row) => rowToAssetStatus(row as DbTrangThaiRow));
}

export async function createAssetStatusSupabase(data: AssetStatusFormValues): Promise<AssetStatus> {
  const payload = {
    ma: data.ma,
    ten: data.ten,
    thu_tu: data.thu_tu ?? 0,
    ghi_chu: data.ghi_chu ?? null,
    trang_thai: data.trang_thai ?? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
  };
  const { data: inserted, error } = await supabase.from(TABLE_TRANG_THAI).insert(payload).select('*').single();
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  return rowToAssetStatus(inserted as DbTrangThaiRow);
}

export async function updateAssetStatusSupabase(id: string, data: AssetStatusFormValues): Promise<AssetStatus> {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error(i18n.t('thietLapTaiSan.trangThai.service.notFound'));
  const payload = {
    ma: data.ma,
    ten: data.ten,
    thu_tu: data.thu_tu ?? 0,
    ghi_chu: data.ghi_chu ?? null,
    trang_thai: data.trang_thai ?? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
  };
  const { error } = await supabase.from(TABLE_TRANG_THAI).update(payload).eq('id', numId);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  const { data: updated, error: err2 } = await supabase.from(TABLE_TRANG_THAI).select('*').eq('id', numId).single();
  if (err2 || !updated) throw new Error(i18n.t('thietLapTaiSan.trangThai.service.notFound'));
  return rowToAssetStatus(updated as DbTrangThaiRow);
}

export async function updateAssetStatusStatusSupabase(
  ids: string[],
  status: TrangThaiHoatDong
): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_TRANG_THAI).update({ trang_thai: status }).in('id', numIds);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
}

export async function deleteAssetStatusesSupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_TRANG_THAI).delete().in('id', numIds);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
}
