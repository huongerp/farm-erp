/**
 * Service danh mục tài sản – đọc/ghi Supabase (bảng fp_ts_tai_san).
 * Map: DB id_nhan_vien/ten_nhan_vien ↔ App id_nhan_vien_dang_giu/ten_nhan_vien_dang_giu.
 */
import { supabase } from '../../../../lib/supabase';
import type { TaiSan } from '../core/types';
import type { TaiSanFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getAssetGroups } from '../../thiet-lap-tai-san/services/nhom-tai-san-service';
import { getAssetStorageLocations } from '../../thiet-lap-tai-san/services/noi-luu-service';
import { getAssetStatuses } from '../../thiet-lap-tai-san/services/trang-thai-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { generateAssetBarcode } from '../utils/barcode';

const TABLE = 'fp_ts_tai_san';

export interface DbTaiSanRow {
  id: number;
  ma_tai_san: string;
  ten_tai_san: string;
  id_nhom: number;
  ten_nhom: string | null;
  id_noi_luu: number;
  ten_noi_luu: string | null;
  id_chi_nhanh: number | null;
  ten_chi_nhanh: string | null;
  id_trang_thai: number;
  ten_trang_thai: string | null;
  id_nhan_vien: number | null;
  ten_nhan_vien: string | null;
  thuong_hieu: string | null;
  model: string | null;
  serial: string | null;
  xuat_xu: string | null;
  ma_barcode: string | null;
  ten_nha_cung_cap: string | null;
  id_nguoi_tao: number | null;
  ten_nguoi_tao: string | null;
  ngay_nhap: string;
  nguyen_gia: number | null;
  ngay_bat_dau_trich_khau_hao: string | null;
  gia_tri_con_lai: number | null;
  khau_hao_luy_ke: number | null;
  hinh_anh: string | null;
  ghi_chu: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToTaiSan(row: DbTaiSanRow): TaiSan {
  return {
    id: String(row.id),
    ma_tai_san: row.ma_tai_san,
    ten_tai_san: row.ten_tai_san,
    id_nhom: String(row.id_nhom),
    ten_nhom: row.ten_nhom ?? undefined,
    id_noi_luu: String(row.id_noi_luu),
    ten_noi_luu: row.ten_noi_luu ?? undefined,
    id_chi_nhanh: row.id_chi_nhanh != null ? String(row.id_chi_nhanh) : null,
    ten_chi_nhanh: row.ten_chi_nhanh ?? null,
    id_trang_thai: String(row.id_trang_thai),
    ten_trang_thai: row.ten_trang_thai ?? undefined,
    id_nhan_vien_dang_giu: row.id_nhan_vien != null ? String(row.id_nhan_vien) : null,
    ten_nhan_vien_dang_giu: row.ten_nhan_vien ?? null,
    ma_nhan_vien_dang_giu: null,
    thuong_hieu: row.thuong_hieu ?? null,
    model: row.model ?? null,
    serial: row.serial ?? null,
    xuat_xu: row.xuat_xu ?? null,
    ma_barcode: row.ma_barcode ?? null,
    id_nha_cung_cap: null,
    ten_nha_cung_cap: row.ten_nha_cung_cap ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
    ngay_nhap: row.ngay_nhap,
    nguyen_gia: row.nguyen_gia ?? null,
    ngay_bat_dau_trich_khau_hao: row.ngay_bat_dau_trich_khau_hao ?? null,
    gia_tri_con_lai: row.gia_tri_con_lai ?? null,
    khau_hao_luy_ke: row.khau_hao_luy_ke ?? null,
    hinh_anh: row.hinh_anh ?? null,
    ghi_chu: row.ghi_chu ?? null,
    trang_thai: 1,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function toNum(val: string | undefined | null): number | null {
  if (val == null || val === '') return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

export async function getTaiSanListSupabase(): Promise<TaiSan[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('tg_cap_nhat', { ascending: false });
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  return (data ?? []).map((row) => rowToTaiSan(row as DbTaiSanRow));
}

export async function createTaiSanSupabase(data: TaiSanFormValues): Promise<TaiSan> {
  const [groups, locations, statuses, employees] = await Promise.all([
    getAssetGroups(),
    getAssetStorageLocations(),
    getAssetStatuses(),
    getEmployees(),
  ]);
  const ten_nhom = groups.find((g) => g.id === data.id_nhom)?.ten ?? null;
  const loc = locations.find((l) => l.id === data.id_noi_luu);
  const ten_noi_luu = loc?.ten_noi_luu ?? null;
  const id_chi_nhanh = loc?.id_chi_nhanh != null ? toNum(loc.id_chi_nhanh) : null;
  const ten_chi_nhanh = loc?.ten_chi_nhanh ?? null;
  const ten_trang_thai = statuses.find((s) => s.id === data.id_trang_thai)?.ten ?? null;
  const id_nhan_vien = toNum(data.id_nhan_vien_dang_giu ?? null);
  let ten_nhan_vien: string | null = null;
  if (data.id_nhan_vien_dang_giu) {
    ten_nhan_vien = employees.find((e) => e.id === data.id_nhan_vien_dang_giu)?.ho_ten ?? null;
  }
  const ngay_bat_dau = (data.ngay_bat_dau_trich_khau_hao?.trim() || data.ngay_nhap) || null;
  const ma_barcode = (data.ma_barcode?.trim() || generateAssetBarcode(data.ma_tai_san)) || null;

  const payload = {
    ma_tai_san: data.ma_tai_san.trim(),
    ten_tai_san: data.ten_tai_san.trim(),
    id_nhom: Number(data.id_nhom),
    ten_nhom,
    id_noi_luu: Number(data.id_noi_luu),
    ten_noi_luu,
    id_chi_nhanh,
    ten_chi_nhanh,
    id_trang_thai: Number(data.id_trang_thai),
    ten_trang_thai,
    id_nhan_vien,
    ten_nhan_vien,
    thuong_hieu: data.thuong_hieu?.trim() || null,
    model: data.model?.trim() || null,
    serial: data.serial?.trim() || null,
    xuat_xu: data.xuat_xu?.trim() || null,
    ma_barcode,
    ten_nha_cung_cap: data.ten_nha_cung_cap?.trim() || null,
    id_nguoi_tao: null,
    ten_nguoi_tao: null,
    ngay_nhap: data.ngay_nhap,
    nguyen_gia: data.nguyen_gia ?? null,
    ngay_bat_dau_trich_khau_hao: ngay_bat_dau,
    gia_tri_con_lai: data.nguyen_gia ?? null,
    khau_hao_luy_ke: 0,
    hinh_anh: data.hinh_anh?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || null,
  };

  const { data: inserted, error } = await supabase.from(TABLE).insert(payload).select('*').single();
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  return rowToTaiSan(inserted as DbTaiSanRow);
}

export async function updateTaiSanSupabase(id: string, data: TaiSanFormValues): Promise<TaiSan> {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));

  const [groups, locations, statuses, employees] = await Promise.all([
    getAssetGroups(),
    getAssetStorageLocations(),
    getAssetStatuses(),
    getEmployees(),
  ]);
  const ten_nhom = groups.find((g) => g.id === data.id_nhom)?.ten ?? null;
  const loc = locations.find((l) => l.id === data.id_noi_luu);
  const ten_noi_luu = loc?.ten_noi_luu ?? null;
  const id_chi_nhanh = loc?.id_chi_nhanh != null ? toNum(loc.id_chi_nhanh) : null;
  const ten_chi_nhanh = loc?.ten_chi_nhanh ?? null;
  const ten_trang_thai = statuses.find((s) => s.id === data.id_trang_thai)?.ten ?? null;
  const id_nhan_vien = toNum(data.id_nhan_vien_dang_giu ?? null);
  let ten_nhan_vien: string | null = null;
  if (data.id_nhan_vien_dang_giu) {
    ten_nhan_vien = employees.find((e) => e.id === data.id_nhan_vien_dang_giu)?.ho_ten ?? null;
  }
  const ngay_bat_dau = (data.ngay_bat_dau_trich_khau_hao?.trim() || data.ngay_nhap) || null;
  const ma_barcode = (data.ma_barcode?.trim() || generateAssetBarcode(data.ma_tai_san, id)) || null;

  const payload = {
    ma_tai_san: data.ma_tai_san.trim(),
    ten_tai_san: data.ten_tai_san.trim(),
    id_nhom: Number(data.id_nhom),
    ten_nhom,
    id_noi_luu: Number(data.id_noi_luu),
    ten_noi_luu,
    id_chi_nhanh,
    ten_chi_nhanh,
    id_trang_thai: Number(data.id_trang_thai),
    ten_trang_thai,
    id_nhan_vien,
    ten_nhan_vien,
    thuong_hieu: data.thuong_hieu?.trim() || null,
    model: data.model?.trim() || null,
    serial: data.serial?.trim() || null,
    xuat_xu: data.xuat_xu?.trim() || null,
    ma_barcode,
    ten_nha_cung_cap: data.ten_nha_cung_cap?.trim() || null,
    ngay_nhap: data.ngay_nhap,
    nguyen_gia: data.nguyen_gia ?? null,
    ngay_bat_dau_trich_khau_hao: ngay_bat_dau,
    hinh_anh: data.hinh_anh?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || null,
  };

  const { error } = await supabase.from(TABLE).update(payload).eq('id', numId);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  const { data: updated, error: err2 } = await supabase.from(TABLE).select('*').eq('id', numId).single();
  if (err2 || !updated) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));
  return rowToTaiSan(updated as DbTaiSanRow);
}

export async function updateTaiSanKhauHaoSupabase(
  id: string,
  payload: { gia_tri_con_lai: number | null; khau_hao_luy_ke: number }
): Promise<TaiSan> {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));
  const { error } = await supabase
    .from(TABLE)
    .update({
      gia_tri_con_lai: payload.gia_tri_con_lai,
      khau_hao_luy_ke: payload.khau_hao_luy_ke,
    })
    .eq('id', numId);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  const { data: updated, error: err2 } = await supabase.from(TABLE).select('*').eq('id', numId).single();
  if (err2 || !updated) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));
  return rowToTaiSan(updated as DbTaiSanRow);
}

export async function updateTaiSanLocationAndHolderSupabase(
  id: string,
  payload: { id_noi_luu?: string; id_nhan_vien_dang_giu?: string | null }
): Promise<TaiSan> {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));

  const updates: Record<string, unknown> = {};
  if (payload.id_noi_luu != null) {
    const locations = await getAssetStorageLocations();
    const loc = locations.find((l) => l.id === payload.id_noi_luu);
    updates.id_noi_luu = Number(payload.id_noi_luu);
    updates.ten_noi_luu = loc?.ten_noi_luu ?? null;
    updates.id_chi_nhanh = loc?.id_chi_nhanh != null ? toNum(loc.id_chi_nhanh) : null;
    updates.ten_chi_nhanh = loc?.ten_chi_nhanh ?? null;
  }
  if (payload.id_nhan_vien_dang_giu !== undefined) {
    updates.id_nhan_vien = toNum(payload.id_nhan_vien_dang_giu);
    if (payload.id_nhan_vien_dang_giu) {
      const employees = await getEmployees();
      const emp = employees.find((e) => e.id === payload.id_nhan_vien_dang_giu);
      updates.ten_nhan_vien = emp?.ho_ten ?? null;
    } else {
      updates.ten_nhan_vien = null;
    }
  }
  if (Object.keys(updates).length === 0) {
    const { data: row } = await supabase.from(TABLE).select('*').eq('id', numId).single();
    if (!row) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));
    return rowToTaiSan(row as DbTaiSanRow);
  }
  const { error } = await supabase.from(TABLE).update(updates).eq('id', numId);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  const { data: updated, error: err2 } = await supabase.from(TABLE).select('*').eq('id', numId).single();
  if (err2 || !updated) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));
  return rowToTaiSan(updated as DbTaiSanRow);
}

export async function updateTaiSanFromKiemKeSupabase(
  id: string,
  payload: { id_noi_luu?: string | null; id_nhan_vien_dang_giu?: string | null; id_trang_thai?: string | null }
): Promise<TaiSan> {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));

  const updates: Record<string, unknown> = {};
  if (payload.id_noi_luu !== undefined && payload.id_noi_luu != null && payload.id_noi_luu !== '') {
    const locations = await getAssetStorageLocations();
    const loc = locations.find((l) => l.id === payload.id_noi_luu);
    updates.id_noi_luu = Number(payload.id_noi_luu);
    updates.ten_noi_luu = loc?.ten_noi_luu ?? null;
    updates.id_chi_nhanh = loc?.id_chi_nhanh != null ? toNum(loc.id_chi_nhanh) : null;
    updates.ten_chi_nhanh = loc?.ten_chi_nhanh ?? null;
  }
  if (payload.id_nhan_vien_dang_giu !== undefined) {
    updates.id_nhan_vien = toNum(payload.id_nhan_vien_dang_giu);
    if (payload.id_nhan_vien_dang_giu) {
      const employees = await getEmployees();
      const emp = employees.find((e) => e.id === payload.id_nhan_vien_dang_giu);
      updates.ten_nhan_vien = emp?.ho_ten ?? null;
    } else {
      updates.ten_nhan_vien = null;
    }
  }
  if (payload.id_trang_thai !== undefined && payload.id_trang_thai != null && payload.id_trang_thai !== '') {
    const statuses = await getAssetStatuses();
    const st = statuses.find((s) => s.id === payload.id_trang_thai);
    updates.id_trang_thai = Number(payload.id_trang_thai);
    updates.ten_trang_thai = st?.ten ?? null;
  }
  if (Object.keys(updates).length === 0) {
    const { data: row } = await supabase.from(TABLE).select('*').eq('id', numId).single();
    if (!row) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));
    return rowToTaiSan(row as DbTaiSanRow);
  }
  const { error } = await supabase.from(TABLE).update(updates).eq('id', numId);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  const { data: updated, error: err2 } = await supabase.from(TABLE).select('*').eq('id', numId).single();
  if (err2 || !updated) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));
  return rowToTaiSan(updated as DbTaiSanRow);
}

export async function deleteTaiSanSupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', numIds);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
}
