/**
 * Service Nơi lưu / Nơi quản lý – đọc/ghi Supabase bảng fp_hc_noi_quan_ly.
 * Map sang AssetStorageLocation (ma → ma_noi_luu, ten → ten_noi_luu) cho tương thích UI.
 */
import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { AssetStorageLocation } from '../core/types';
import type { AssetStorageLocationFormValues } from '../core/schema';
import type { TrangThaiHoatDong } from '../../../../lib/constants';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import i18n from '../../../../lib/i18n';

const TABLE = 'fp_hc_noi_quan_ly';

const ROW_COLUMNS =
  'id,id_chi_nhanh,ten_chi_nhanh,ma,ten,thu_tu,ghi_chu,trang_thai,tg_tao,tg_cap_nhat';

interface DbRow {
  id: number;
  id_chi_nhanh: number;
  ten_chi_nhanh: string | null;
  ma: string;
  ten: string;
  thu_tu: number;
  ghi_chu: string | null;
  trang_thai: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function normalizeTrangThai(val: unknown): TrangThaiHoatDong {
  if (val === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
  if (val === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
  return typeof val === 'string' && val.trim() === 'Ngừng hoạt động'
    ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
    : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

function rowToAssetStorageLocation(row: DbRow): AssetStorageLocation {
  return {
    id: String(row.id),
    id_chi_nhanh: String(row.id_chi_nhanh),
    ten_chi_nhanh: row.ten_chi_nhanh ?? undefined,
    ma_noi_luu: row.ma,
    ten_noi_luu: row.ten,
    ghi_chu: row.ghi_chu ?? undefined,
    trang_thai: normalizeTrangThai(row.trang_thai),
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

export async function getAssetStorageLocationsSupabase(): Promise<AssetStorageLocation[]> {
  const data = await fetchAllRows<DbRow>((from, to) =>
    supabase
      .from(TABLE)
      .select(ROW_COLUMNS)
      .order('thu_tu', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)
  );
  return data.map(rowToAssetStorageLocation);
}

export async function createAssetStorageLocationSupabase(
  data: AssetStorageLocationFormValues
): Promise<AssetStorageLocation> {
  const payload = {
    id_chi_nhanh: Number(data.id_chi_nhanh),
    ma: data.ma_noi_luu.trim(),
    ten: data.ten_noi_luu.trim(),
    thu_tu: 1,
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai ?? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
  };
  const { data: inserted, error } = await supabase.from(TABLE).insert(payload).select(ROW_COLUMNS).single();
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  return rowToAssetStorageLocation(inserted as DbRow);
}

export async function updateAssetStorageLocationSupabase(
  id: string,
  data: AssetStorageLocationFormValues
): Promise<AssetStorageLocation> {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error(i18n.t('thietLapTaiSan.noiLuu.service.notFound'));
  const payload = {
    id_chi_nhanh: Number(data.id_chi_nhanh),
    ma: data.ma_noi_luu.trim(),
    ten: data.ten_noi_luu.trim(),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai ?? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
  };
  const { error } = await supabase.from(TABLE).update(payload).eq('id', numId);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  const { data: updated, error: err2 } = await supabase.from(TABLE).select(ROW_COLUMNS).eq('id', numId).single();
  if (err2 || !updated) throw new Error(i18n.t('thietLapTaiSan.noiLuu.service.notFound'));
  return rowToAssetStorageLocation(updated as DbRow);
}

export async function updateAssetStorageLocationStatusSupabase(
  ids: string[],
  status: TrangThaiHoatDong
): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE).update({ trang_thai: status }).in('id', numIds);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
}

export async function deleteAssetStorageLocationsSupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', numIds);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
}
