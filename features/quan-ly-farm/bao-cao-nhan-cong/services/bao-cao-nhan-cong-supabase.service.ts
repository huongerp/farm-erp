/**
 * Báo cáo nhân công — Supabase fp_farm_bao_cao_nhan_cong + _ct + _ct_sub
 */
import { supabase, throwSupabaseError, formatSupabaseError } from '../../../../lib/supabase';
import i18n from '../../../../lib/i18n';
import type {
  FarmBaoCaoNhanCong,
  FarmBaoCaoNhanCongCt,
  TrangThaiBaoCaoNhanCongPhieu,
} from '../core/types';
import { TRANG_THAI_BAO_CAO_NHAN_CONG } from '../core/types';
import type { BaoCaoNhanCongFormValues } from '../core/schema';
import type { FarmBaoCaoNhanCongCtSub, LoaiChiTieu } from '../core/ct-sub';
import { LOAI_CHI_TIEU_CODES, groupSubModelsByLoai } from '../core/ct-sub';
import { applySubTotalsToChiTietForm } from '../core/form-mappers';

const TABLE_CHA = 'fp_farm_bao_cao_nhan_cong';
const TABLE_CT = 'fp_farm_bao_cao_nhan_cong_ct';
const TABLE_CT_SUB = 'fp_farm_bao_cao_nhan_cong_ct_sub';

/** List — bỏ hinh_anh_urls (~1.8MB/dòng base64). Ảnh chỉ load khi mở chi tiết (ROW_CHA_DETAIL). */
const ROW_CHA_LIST =
  'id,ngay,id_chi_nhanh,ten_chi_nhanh,ghi_chu,id_nguoi_tao,trang_thai,tg_tao,tg_cap_nhat';

/** Chi tiết / insert / update */
const ROW_CHA_DETAIL =
  'id,ngay,id_chi_nhanh,ten_chi_nhanh,ghi_chu,hinh_anh_urls,id_nguoi_tao,trang_thai,tg_tao,tg_cap_nhat';

const ROW_CT =
  'id,id_bao_cao,loai_chuyen,sl_cong_ngay,sl_cong_nua,sl_tang_ca,so_gio_tc,ghi_chu,thu_tu';

const ROW_CT_SUB =
  'id,id_bcnc_ct,loai_chi_tieu,thu_tu,sl_cong,so_gio,ghi_chu';

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

interface DbRowCtSub {
  id: number;
  id_bcnc_ct: number;
  loai_chi_tieu: string;
  thu_tu: number | null;
  sl_cong: string | number | null;
  so_gio: string | number | null;
  ghi_chu: string | null;
}

function subRowToModel(row: DbRowCtSub): FarmBaoCaoNhanCongCtSub {
  return {
    id: String(row.id),
    id_bcnc_ct: String(row.id_bcnc_ct),
    loai_chi_tieu: row.loai_chi_tieu as LoaiChiTieu,
    thu_tu: row.thu_tu ?? 0,
    sl_cong: num(row.sl_cong),
    so_gio: num(row.so_gio),
    ghi_chu: row.ghi_chu ?? null,
  };
}

function ctRowToModel(row: DbRowCt, subs: FarmBaoCaoNhanCongCtSub[]): FarmBaoCaoNhanCongCt {
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
    sub_by_loai: groupSubModelsByLoai(subs),
  };
}

function normalizeTrangThaiDb(v: string | null | undefined): TrangThaiBaoCaoNhanCongPhieu {
  return v === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA ? TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA : TRANG_THAI_BAO_CAO_NHAN_CONG.MO;
}

function chaRowToModel(row: DbRowCha, chi: FarmBaoCaoNhanCongCt[], includeHinhAnh = true): FarmBaoCaoNhanCong {
  return {
    id: String(row.id),
    ngay: typeof row.ngay === 'string' ? row.ngay.slice(0, 10) : String(row.ngay),
    id_chi_nhanh: row.id_chi_nhanh != null ? String(row.id_chi_nhanh) : null,
    ten_chi_nhanh: row.ten_chi_nhanh ?? null,
    ghi_chu: row.ghi_chu ?? null,
    hinh_anh_urls: includeHinhAnh ? parseHinhAnhUrls(row.hinh_anh_urls) : [],
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: null,
    trang_thai: normalizeTrangThaiDb(row.trang_thai),
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    chi_tiet: chi.sort((a, b) => a.thu_tu - b.thu_tu),
  };
}

async function fetchSubForCtIds(ctIds: number[]): Promise<Map<string, FarmBaoCaoNhanCongCtSub[]>> {
  const map = new Map<string, FarmBaoCaoNhanCongCtSub[]>();
  if (ctIds.length === 0) return map;
  const { data, error } = await supabase.from(TABLE_CT_SUB).select(ROW_CT_SUB).in('id_bcnc_ct', ctIds);
  if (error) throwSupabaseError(error, { resource: `${TABLE_CT_SUB}.select` });
  for (const row of (data ?? []) as DbRowCtSub[]) {
    const key = String(row.id_bcnc_ct);
    const list = map.get(key) ?? [];
    list.push(subRowToModel(row));
    map.set(key, list);
  }
  return map;
}

async function fetchChiTietForIds(ids: string[]): Promise<Map<string, FarmBaoCaoNhanCongCt[]>> {
  const ctMap = new Map<string, FarmBaoCaoNhanCongCt[]>();
  if (ids.length === 0) return ctMap;
  const numIds = ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  const { data, error } = await supabase.from(TABLE_CT).select(ROW_CT).in('id_bao_cao', numIds);
  if (error) throwSupabaseError(error, { resource: `${TABLE_CT}.select` });
  const ctRows = (data ?? []) as DbRowCt[];
  const ctIds = ctRows.map((r) => r.id);
  const subMap = await fetchSubForCtIds(ctIds);
  for (const row of ctRows) {
    const idBaoCao = String(row.id_bao_cao);
    const subs = subMap.get(String(row.id)) ?? [];
    const list = ctMap.get(idBaoCao) ?? [];
    list.push(ctRowToModel(row, subs));
    ctMap.set(idBaoCao, list);
  }
  return ctMap;
}

function subPayloadRows(
  idBcncCt: number,
  sub: BaoCaoNhanCongFormValues['chi_tiet'][number]['sub']
): {
  id_bcnc_ct: number;
  loai_chi_tieu: LoaiChiTieu;
  thu_tu: number;
  sl_cong: number;
  so_gio: number;
  ghi_chu: string | null;
}[] {
  const rows: {
    id_bcnc_ct: number;
    loai_chi_tieu: LoaiChiTieu;
    thu_tu: number;
    sl_cong: number;
    so_gio: number;
    ghi_chu: string | null;
  }[] = [];
  for (const loai of LOAI_CHI_TIEU_CODES) {
    const list = sub?.[loai] ?? [];
    list.forEach((r, i) => {
      const sl = num(r.sl_cong);
      const gio = num(r.so_gio);
      if (sl === 0 && gio === 0 && !(r.ghi_chu?.trim())) return;
      if ((sl > 0) !== (gio > 0)) {
        throw new Error(i18n.t('baoCaoNhanCong.validation.slGioPairRequired'));
      }
      rows.push({
        id_bcnc_ct: idBcncCt,
        loai_chi_tieu: loai,
        thu_tu: i + 1,
        sl_cong: sl,
        so_gio: gio,
        ghi_chu: r.ghi_chu?.trim() || null,
      });
    });
  }
  return rows;
}

async function insertCtAndSub(
  idBaoCao: number,
  chiTiet: BaoCaoNhanCongFormValues['chi_tiet']
): Promise<void> {
  const synced = applySubTotalsToChiTietForm(chiTiet);
  for (let i = 0; i < synced.length; i++) {
    const r = synced[i]!;
    const { data: insertedCt, error: eCt } = await supabase
      .from(TABLE_CT)
      .insert({
        id_bao_cao: idBaoCao,
        loai_chuyen: r.loai_chuyen,
        sl_cong_ngay: r.sl_cong_ngay ?? 0,
        sl_cong_nua: r.sl_cong_nua ?? 0,
        sl_tang_ca: r.sl_tang_ca ?? 0,
        so_gio_tc: r.so_gio_tc ?? 0,
        ghi_chu: r.ghi_chu ?? null,
        thu_tu: i + 1,
      })
      .select('id')
      .single();
    if (eCt) throwSupabaseError(eCt, { resource: `${TABLE_CT}.insert` });
    const ctId = (insertedCt as { id: number }).id;
    const subRows = subPayloadRows(ctId, r.sub);
    if (subRows.length > 0) {
      const { error: eSub } = await supabase.from(TABLE_CT_SUB).insert(subRows);
      if (eSub) throwSupabaseError(eSub, { resource: `${TABLE_CT_SUB}.insert` });
    }
  }
}

export async function getAllBaoCaoNhanCongSupabase(): Promise<FarmBaoCaoNhanCong[]> {
  const { data, error } = await supabase.from(TABLE_CHA).select(ROW_CHA_LIST).order('ngay', { ascending: false });
  if (error) throwSupabaseError(error, { resource: `${TABLE_CHA}.list` });
  const rows = (data ?? []) as DbRowCha[];
  const ids = rows.map((r) => String(r.id));
  const ctMap = await fetchChiTietForIds(ids);
  return rows.map((r) => chaRowToModel(r, ctMap.get(String(r.id)) ?? [], false));
}

export async function getBaoCaoNhanCongByIdSupabase(id: string): Promise<FarmBaoCaoNhanCong | null> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return null;
  const { data, error } = await supabase.from(TABLE_CHA).select(ROW_CHA_DETAIL).eq('id', numId).maybeSingle();
  if (error) throwSupabaseError(error, { resource: `${TABLE_CHA}.byId` });
  if (!data) return null;
  const row = data as DbRowCha;
  const ctMap = await fetchChiTietForIds([String(row.id)]);
  return chaRowToModel(row, ctMap.get(String(row.id)) ?? []);
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
  const { data: inserted, error } = await supabase.from(TABLE_CHA).insert(payload).select(ROW_CHA_DETAIL).single();
  if (error) throw mapChaInsertUpdateError(error);
  const parent = inserted as DbRowCha;
  await insertCtAndSub(parent.id, values.chi_tiet);
  return (await getBaoCaoNhanCongByIdSupabase(String(parent.id)))!;
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
  await insertCtAndSub(numId, values.chi_tiet);
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
