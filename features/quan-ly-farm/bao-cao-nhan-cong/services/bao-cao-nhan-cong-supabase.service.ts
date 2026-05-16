/**
 * Báo cáo nhân công — Supabase fp_farm_bao_cao_nhan_cong + fp_farm_bao_cao_nhan_cong_ct + fp_farm_bao_cao_nhan_cong_kpi
 */
import { supabase, throwSupabaseError, formatSupabaseError } from '../../../../lib/supabase';
import i18n from '../../../../lib/i18n';
import type {
  FarmBaoCaoNhanCong,
  FarmBaoCaoNhanCongCt,
  FarmBaoCaoNhanCongKpi,
  TrangThaiBaoCaoNhanCongPhieu,
} from '../core/types';
import { TRANG_THAI_BAO_CAO_NHAN_CONG } from '../core/types';
import type { BaoCaoNhanCongFormValues } from '../core/schema';

const TABLE_CHA = 'fp_farm_bao_cao_nhan_cong';
const TABLE_CT = 'fp_farm_bao_cao_nhan_cong_ct';
const TABLE_KPI = 'fp_farm_bao_cao_nhan_cong_kpi';

const ROW_CHA =
  'id,ngay,id_chi_nhanh,ten_chi_nhanh,ghi_chu,hinh_anh_urls,id_nguoi_tao,trang_thai,tg_tao,tg_cap_nhat';

const ROW_CT =
  'id,id_bao_cao,loai_chuyen,sl_cong_ngay,sl_cong_nua,sl_tang_ca,so_gio_tc,ghi_chu,thu_tu';

const ROW_KPI =
  'id,id_bao_cao,thu_tu,ten_hang_muc,don_vi_tinh,muc_tieu,thuc_te,phan_tram,danh_gia,tien_thuong,ghi_chu';

function parseIdToInt8(id: string | null | undefined): number | null {
  if (id == null || id === '') return null;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function isUniqueViolation(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === '23505') {
    return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /23505|duplicate key|unique constraint/i.test(msg);
}

function mapChaInsertUpdateError(err: unknown): Error {
  if (isUniqueViolation(err)) {
    return new Error(i18n.t('baoCaoNhanCong.validation.duplicateNgayChiNhanh'));
  }
  return new Error(formatSupabaseError(err, { resource: TABLE_CHA }));
}

function num(v: string | number | null | undefined): number {
  if (v == null || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numNullable(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseHinhAnhUrls(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  }
  return [];
}

interface DbRowCha {
  id: number;
  ngay: string;
  id_chi_nhanh: number | null;
  ten_chi_nhanh: string | null;
  ghi_chu: string | null;
  hinh_anh_urls?: unknown;
  id_nguoi_tao: number | null;
  trang_thai: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface DbRowCt {
  id: number;
  id_bao_cao: number;
  loai_chuyen: string;
  sl_cong_ngay: string | number | null;
  sl_cong_nua: string | number | null;
  sl_tang_ca: string | number | null;
  so_gio_tc: string | number | null;
  ghi_chu: string | null;
  thu_tu: number | null;
}

interface DbRowKpi {
  id: number;
  id_bao_cao: number;
  thu_tu: number | null;
  ten_hang_muc: string;
  don_vi_tinh: string | null;
  muc_tieu: string | null;
  thuc_te: string | null;
  phan_tram: string | number | null;
  danh_gia: string | null;
  tien_thuong: string | number | null;
  ghi_chu: string | null;
}

function ctRowToModel(row: DbRowCt): FarmBaoCaoNhanCongCt {
  return {
    id: String(row.id),
    id_bao_cao: String(row.id_bao_cao),
    loai_chuyen: row.loai_chuyen as FarmBaoCaoNhanCongCt['loai_chuyen'],
    sl_cong_ngay: num(row.sl_cong_ngay),
    sl_cong_nua: num(row.sl_cong_nua),
    sl_tang_ca: num(row.sl_tang_ca),
    so_gio_tc: num(row.so_gio_tc),
    ghi_chu: row.ghi_chu ?? null,
    thu_tu: row.thu_tu ?? 0,
  };
}

function kpiRowToModel(row: DbRowKpi): FarmBaoCaoNhanCongKpi {
  return {
    id: String(row.id),
    id_bao_cao: String(row.id_bao_cao),
    thu_tu: row.thu_tu ?? 0,
    ten_hang_muc: row.ten_hang_muc ?? '',
    don_vi_tinh: row.don_vi_tinh ?? null,
    muc_tieu: row.muc_tieu ?? null,
    thuc_te: row.thuc_te ?? null,
    phan_tram: numNullable(row.phan_tram),
    danh_gia: row.danh_gia ?? null,
    tien_thuong: num(row.tien_thuong),
    ghi_chu: row.ghi_chu ?? null,
  };
}

function normalizeTrangThaiDb(v: string | null | undefined): TrangThaiBaoCaoNhanCongPhieu {
  return v === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA ? TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA : TRANG_THAI_BAO_CAO_NHAN_CONG.MO;
}

function chaRowToModel(
  row: DbRowCha,
  chi: FarmBaoCaoNhanCongCt[],
  kpi: FarmBaoCaoNhanCongKpi[]
): FarmBaoCaoNhanCong {
  return {
    id: String(row.id),
    ngay: typeof row.ngay === 'string' ? row.ngay.slice(0, 10) : String(row.ngay),
    id_chi_nhanh: row.id_chi_nhanh != null ? String(row.id_chi_nhanh) : null,
    ten_chi_nhanh: row.ten_chi_nhanh ?? null,
    ghi_chu: row.ghi_chu ?? null,
    hinh_anh_urls: parseHinhAnhUrls(row.hinh_anh_urls),
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: null,
    trang_thai: normalizeTrangThaiDb(row.trang_thai),
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    chi_tiet: chi.sort((a, b) => a.thu_tu - b.thu_tu),
    kpi: kpi.sort((a, b) => a.thu_tu - b.thu_tu),
  };
}

async function fetchChiTietAndKpiForIds(ids: string[]): Promise<{
  ct: Map<string, FarmBaoCaoNhanCongCt[]>;
  kpi: Map<string, FarmBaoCaoNhanCongKpi[]>;
}> {
  const ctMap = new Map<string, FarmBaoCaoNhanCongCt[]>();
  const kpiMap = new Map<string, FarmBaoCaoNhanCongKpi[]>();
  if (ids.length === 0) return { ct: ctMap, kpi: kpiMap };
  const numIds = ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  const [ctRes, kpiRes] = await Promise.all([
    supabase.from(TABLE_CT).select(ROW_CT).in('id_bao_cao', numIds),
    supabase.from(TABLE_KPI).select(ROW_KPI).in('id_bao_cao', numIds),
  ]);
  if (ctRes.error) throwSupabaseError(ctRes.error, { resource: `${TABLE_CT}.select` });
  if (kpiRes.error) throwSupabaseError(kpiRes.error, { resource: `${TABLE_KPI}.select` });
  for (const row of (ctRes.data ?? []) as DbRowCt[]) {
    const id = String(row.id_bao_cao);
    const list = ctMap.get(id) ?? [];
    list.push(ctRowToModel(row));
    ctMap.set(id, list);
  }
  for (const row of (kpiRes.data ?? []) as DbRowKpi[]) {
    const id = String(row.id_bao_cao);
    const list = kpiMap.get(id) ?? [];
    list.push(kpiRowToModel(row));
    kpiMap.set(id, list);
  }
  return { ct: ctMap, kpi: kpiMap };
}

export async function getAllBaoCaoNhanCongSupabase(): Promise<FarmBaoCaoNhanCong[]> {
  const { data, error } = await supabase.from(TABLE_CHA).select(ROW_CHA).order('ngay', { ascending: false });
  if (error) throwSupabaseError(error, { resource: `${TABLE_CHA}.list` });
  const rows = (data ?? []) as DbRowCha[];
  const ids = rows.map((r) => String(r.id));
  const { ct: ctMap, kpi: kpiMap } = await fetchChiTietAndKpiForIds(ids);
  return rows.map((r) =>
    chaRowToModel(r, ctMap.get(String(r.id)) ?? [], kpiMap.get(String(r.id)) ?? [])
  );
}

export async function getBaoCaoNhanCongByIdSupabase(id: string): Promise<FarmBaoCaoNhanCong | null> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return null;
  const { data, error } = await supabase.from(TABLE_CHA).select(ROW_CHA).eq('id', numId).maybeSingle();
  if (error) throwSupabaseError(error, { resource: `${TABLE_CHA}.byId` });
  if (!data) return null;
  const row = data as DbRowCha;
  const { ct: ctMap, kpi: kpiMap } = await fetchChiTietAndKpiForIds([String(row.id)]);
  return chaRowToModel(row, ctMap.get(String(row.id)) ?? [], kpiMap.get(String(row.id)) ?? []);
}

function kpiPayloadRows(
  idBaoCao: number,
  values: BaoCaoNhanCongFormValues
): {
  id_bao_cao: number;
  thu_tu: number;
  ten_hang_muc: string;
  don_vi_tinh: string | null;
  muc_tieu: string | null;
  thuc_te: string | null;
  phan_tram: number | null;
  danh_gia: string | null;
  tien_thuong: number;
  ghi_chu: string | null;
}[] {
  const filtered = (values.kpi ?? []).filter((r) => String(r.ten_hang_muc ?? '').trim().length > 0);
  return filtered.map((r, i) => ({
    id_bao_cao: idBaoCao,
    thu_tu: i + 1,
    ten_hang_muc: String(r.ten_hang_muc).trim(),
    don_vi_tinh: r.don_vi_tinh?.trim() || null,
    muc_tieu: r.muc_tieu?.trim() || null,
    thuc_te: r.thuc_te?.trim() || null,
    phan_tram: r.phan_tram == null || Number.isNaN(Number(r.phan_tram)) ? null : Number(r.phan_tram),
    danh_gia: r.danh_gia?.trim() || null,
    tien_thuong: Number(r.tien_thuong ?? 0),
    ghi_chu: r.ghi_chu?.trim() || null,
  }));
}

function chaPayloadCreate(values: BaoCaoNhanCongFormValues, idNguoiTao: string | null) {
  return {
    ngay: values.ngay,
    id_chi_nhanh: parseIdToInt8(values.id_chi_nhanh),
    ten_chi_nhanh: values.ten_chi_nhanh?.trim() || null,
    ghi_chu: values.ghi_chu?.trim() || null,
    hinh_anh_urls: values.hinh_anh_urls ?? [],
    id_nguoi_tao: parseIdToInt8(idNguoiTao),
    trang_thai: TRANG_THAI_BAO_CAO_NHAN_CONG.MO,
    tg_cap_nhat: new Date().toISOString(),
  };
}

function chaPayloadUpdate(values: BaoCaoNhanCongFormValues) {
  return {
    ngay: values.ngay,
    id_chi_nhanh: parseIdToInt8(values.id_chi_nhanh),
    ten_chi_nhanh: values.ten_chi_nhanh?.trim() || null,
    ghi_chu: values.ghi_chu?.trim() || null,
    hinh_anh_urls: values.hinh_anh_urls ?? [],
    tg_cap_nhat: new Date().toISOString(),
  };
}

export async function createBaoCaoNhanCongSupabase(
  values: BaoCaoNhanCongFormValues,
  idNguoiTao: string | null
): Promise<FarmBaoCaoNhanCong> {
  const payload = { ...chaPayloadCreate(values, idNguoiTao), tg_tao: new Date().toISOString() };
  const { data: inserted, error } = await supabase.from(TABLE_CHA).insert(payload).select(ROW_CHA).single();
  if (error) throw mapChaInsertUpdateError(error);
  const parent = inserted as DbRowCha;
  const pid = parent.id;
  const ctRows = values.chi_tiet.map((r, i) => ({
    id_bao_cao: pid,
    loai_chuyen: r.loai_chuyen,
    sl_cong_ngay: r.sl_cong_ngay ?? 0,
    sl_cong_nua: r.sl_cong_nua ?? 0,
    sl_tang_ca: r.sl_tang_ca ?? 0,
    so_gio_tc: r.so_gio_tc ?? 0,
    ghi_chu: r.ghi_chu ?? null,
    thu_tu: i + 1,
  }));
  const { error: e2 } = await supabase.from(TABLE_CT).insert(ctRows);
  if (e2) throwSupabaseError(e2, { resource: `${TABLE_CT}.insert` });
  const kpiRows = kpiPayloadRows(pid, values);
  if (kpiRows.length > 0) {
    const { error: ek } = await supabase.from(TABLE_KPI).insert(kpiRows);
    if (ek) throwSupabaseError(ek, { resource: `${TABLE_KPI}.insert` });
  }
  return (await getBaoCaoNhanCongByIdSupabase(String(pid)))!;
}

export async function updateBaoCaoNhanCongSupabase(
  id: string,
  values: BaoCaoNhanCongFormValues
): Promise<FarmBaoCaoNhanCong> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error('Invalid id');
  const { error } = await supabase.from(TABLE_CHA).update(chaPayloadUpdate(values)).eq('id', numId);
  if (error) throw mapChaInsertUpdateError(error);
  const { error: delErr } = await supabase.from(TABLE_CT).delete().eq('id_bao_cao', numId);
  if (delErr) throwSupabaseError(delErr, { resource: `${TABLE_CT}.delete` });
  const { error: delKpi } = await supabase.from(TABLE_KPI).delete().eq('id_bao_cao', numId);
  if (delKpi) throwSupabaseError(delKpi, { resource: `${TABLE_KPI}.delete` });
  const ctRows = values.chi_tiet.map((r, i) => ({
    id_bao_cao: numId,
    loai_chuyen: r.loai_chuyen,
    sl_cong_ngay: r.sl_cong_ngay ?? 0,
    sl_cong_nua: r.sl_cong_nua ?? 0,
    sl_tang_ca: r.sl_tang_ca ?? 0,
    so_gio_tc: r.so_gio_tc ?? 0,
    ghi_chu: r.ghi_chu ?? null,
    thu_tu: i + 1,
  }));
  const { error: insErr } = await supabase.from(TABLE_CT).insert(ctRows);
  if (insErr) throwSupabaseError(insErr, { resource: `${TABLE_CT}.insert` });
  const kpiRows = kpiPayloadRows(numId, values);
  if (kpiRows.length > 0) {
    const { error: ek } = await supabase.from(TABLE_KPI).insert(kpiRows);
    if (ek) throwSupabaseError(ek, { resource: `${TABLE_KPI}.insert` });
  }
  return (await getBaoCaoNhanCongByIdSupabase(id))!;
}

export async function deleteBaoCaoNhanCongSupabase(id: string): Promise<void> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return;
  const { error } = await supabase.from(TABLE_CHA).delete().eq('id', numId);
  if (error) throwSupabaseError(error, { resource: `${TABLE_CHA}.delete` });
}

export async function deleteBaoCaoNhanCongManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_CHA).delete().in('id', numIds);
  if (error) throwSupabaseError(error, { resource: `${TABLE_CHA}.deleteMany` });
}

export async function updateBaoCaoNhanCongTrangThaiSupabase(
  id: string,
  trang_thai: TrangThaiBaoCaoNhanCongPhieu
): Promise<FarmBaoCaoNhanCong> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error('Invalid id');
  const next = trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA ? TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA : TRANG_THAI_BAO_CAO_NHAN_CONG.MO;
  const { error } = await supabase
    .from(TABLE_CHA)
    .update({ trang_thai: next, tg_cap_nhat: new Date().toISOString() })
    .eq('id', numId);
  if (error) throwSupabaseError(error, { resource: `${TABLE_CHA}.updateTrangThai` });
  return (await getBaoCaoNhanCongByIdSupabase(id))!;
}
