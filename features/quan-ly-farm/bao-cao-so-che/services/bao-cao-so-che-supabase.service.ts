/**
 * Báo cáo sơ chế — Supabase fp_farm_bao_cao_so_che + fp_farm_bao_cao_so_che_ct + fp_farm_bao_cao_so_che_pham_cap + fp_farm_bao_cao_so_che_kpi
 */
import { supabase, throwSupabaseError, formatSupabaseError } from '../../../../lib/supabase';
import i18n from '../../../../lib/i18n';
import type { FarmBaoCaoSoChe, FarmBaoCaoKpiThuongRow, TrangThaiBaoCaoSoChePhieu } from '../core/types';
import { computeKpiPhanTram } from '../../shared/kpi-thuong/types';
import { TRANG_THAI_BAO_CAO_SO_CHE } from '../core/types';
import { defaultPhamCapModelRows, inferSoThamChieuKgPerThung, type FarmBaoCaoSoChePhamCapRow } from '../core/pham-cap';
import type { BaoCaoSoCheFormValues } from '../core/schema';
import {
  SO_LIEU_BUONG_ROW_DEFS,
  SO_LIEU_ROW_DVT_DEFAULT,
  SO_LIEU_ROW_KEYS,
  deriveDonViTinhSlipFromSoLieuMeta,
  mergeSoLieuMetaToForm,
  type SoLieuRowKey,
  type SoLieuRowMeta,
  type SoLieuRowMetaForm,
} from '../core/so-lieu-row-meta';

const TABLE_CHA = 'fp_farm_bao_cao_so_che';
const TABLE_CT = 'fp_farm_bao_cao_so_che_ct';
const TABLE_PCAP = 'fp_farm_bao_cao_so_che_pham_cap';
const TABLE_KPI = 'fp_farm_bao_cao_so_che_kpi';

const ROW_CHA = 'id,ngay,id_chi_nhanh,ten_chi_nhanh,ghi_chu,id_nguoi_tao,trang_thai,tg_tao,tg_cap_nhat';

const ROW_CT = 'id,id_bao_cao,ma_chi_tieu,gia_tri,don_vi_tinh,ghi_chu,thu_tu';

const ROW_PCAP =
  'id,id_bao_cao,ten_pham_cap,so_tham_chieu,so_thung,so_thung_quy_doi,thu_tu';

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
    return new Error(i18n.t('baoCaoSoChe.validation.duplicateNgayChiNhanh'));
  }
  return new Error(formatSupabaseError(err, { resource: TABLE_CHA }));
}

/** Tránh tạo / đổi ngày-chi nhánh trùng phiếu khác (bổ sung cho unique index DB). */
async function assertBaoCaoSoCheUniqueNgayChiNhanh(
  ngay: string,
  idChiNhanh: string | null | undefined,
  excludeId: number | null
): Promise<void> {
  const bid = parseIdToInt8(idChiNhanh);
  if (bid == null || !ngay?.trim()) return;
  let q = supabase.from(TABLE_CHA).select('id').eq('ngay', ngay).eq('id_chi_nhanh', bid);
  if (excludeId != null) q = q.neq('id', excludeId);
  const { data, error } = await q.maybeSingle();
  if (error) throwSupabaseError(error, { resource: `${TABLE_CHA}.assertUnique` });
  if (data) throw mapChaInsertUpdateError({ code: '23505' });
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

function isSoLieuRowKey(s: string): s is SoLieuRowKey {
  return (SO_LIEU_ROW_KEYS as readonly string[]).includes(s);
}

interface DbRowCha {
  id: number;
  ngay: string;
  id_chi_nhanh: number | null;
  ten_chi_nhanh: string | null;
  ghi_chu: string | null;
  id_nguoi_tao: number | null;
  trang_thai: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface DbRowCt {
  id: number;
  id_bao_cao: number;
  ma_chi_tieu: string;
  gia_tri: string | number | null;
  don_vi_tinh: string | null;
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

interface DbRowPcap {
  id: number;
  id_bao_cao: number;
  ten_pham_cap: string;
  so_tham_chieu: string | number | null;
  so_thung: string | number | null;
  so_thung_quy_doi: string | number | null;
  thu_tu: number | null;
}

function pcapDbRowsToModel(rows: DbRowPcap[]): FarmBaoCaoSoChePhamCapRow[] {
  return [...rows]
    .sort((a, b) => (a.thu_tu ?? 0) - (b.thu_tu ?? 0))
    .map((r) => {
      const so_thung = num(r.so_thung);
      return {
        id: String(r.id),
        id_bao_cao: String(r.id_bao_cao),
        ten_pham_cap: typeof r.ten_pham_cap === 'string' ? r.ten_pham_cap : '',
        so_tham_chieu: inferSoThamChieuKgPerThung({
          so_tham_chieu: num(r.so_tham_chieu),
          so_thung,
        }),
        so_thung,
        so_thung_quy_doi: num(r.so_thung_quy_doi),
        thu_tu: Number(r.thu_tu) || 0,
      };
    });
}

function normalizeTrangThaiDb(v: string | null | undefined): TrangThaiBaoCaoSoChePhieu {
  return v === TRANG_THAI_BAO_CAO_SO_CHE.KHOA ? TRANG_THAI_BAO_CAO_SO_CHE.KHOA : TRANG_THAI_BAO_CAO_SO_CHE.MO;
}

function ctRowsToMetrics(
  rows: DbRowCt[]
): Pick<
  FarmBaoCaoSoChe,
  | 'don_vi_tinh'
  | 'sl_buong_ton_dau_ngay'
  | 'tong_buong_thu_hoach'
  | 'tong_buong_khong_so_che'
  | 'tong_buong_so_che'
  | 'sl_buong_ton_cuoi_ngay'
  | 'danh_gia_loi_qc_pct'
  | 'so_lieu_row_meta'
> {
  if (rows.length === 0) {
    return {
      don_vi_tinh: SO_LIEU_ROW_DVT_DEFAULT,
      sl_buong_ton_dau_ngay: 0,
      tong_buong_thu_hoach: 0,
      tong_buong_khong_so_che: 0,
      tong_buong_so_che: 0,
      sl_buong_ton_cuoi_ngay: 0,
      danh_gia_loi_qc_pct: 0,
      so_lieu_row_meta: {},
    };
  }

  const byKey = new Map<SoLieuRowKey, DbRowCt>();
  for (const row of rows) {
    if (isSoLieuRowKey(row.ma_chi_tieu)) {
      byKey.set(row.ma_chi_tieu, row);
    }
  }

  const meta: SoLieuRowMeta = {};
  for (const k of SO_LIEU_ROW_KEYS) {
    const r = byKey.get(k);
    if (!r) continue;
    const g = r.ghi_chu?.trim() ?? '';
    const d = r.don_vi_tinh?.trim() ?? '';
    if (g || (d && d !== SO_LIEU_ROW_DVT_DEFAULT)) {
      meta[k] = {
        ghi_chu: g || null,
        don_vi_tinh_phu: d ? d : null,
      };
    }
  }

  const formMeta = mergeSoLieuMetaToForm(meta);
  return {
    don_vi_tinh: deriveDonViTinhSlipFromSoLieuMeta(formMeta),
    sl_buong_ton_dau_ngay: num(byKey.get('sl_buong_ton_dau_ngay')?.gia_tri),
    tong_buong_thu_hoach: num(byKey.get('tong_buong_thu_hoach')?.gia_tri),
    tong_buong_khong_so_che: num(byKey.get('tong_buong_khong_so_che')?.gia_tri),
    tong_buong_so_che: num(byKey.get('tong_buong_so_che')?.gia_tri),
    sl_buong_ton_cuoi_ngay: num(byKey.get('sl_buong_ton_cuoi_ngay')?.gia_tri),
    danh_gia_loi_qc_pct: num(byKey.get('danh_gia_loi_qc_pct')?.gia_tri),
    so_lieu_row_meta: meta,
  };
}

function kpiRowToModel(row: DbRowKpi): FarmBaoCaoKpiThuongRow {
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

function chaRowToModel(
  row: DbRowCha,
  ctRows: DbRowCt[],
  pcapRows: DbRowPcap[],
  kpiRows: FarmBaoCaoKpiThuongRow[]
): FarmBaoCaoSoChe {
  const m = ctRowsToMetrics(ctRows);
  return {
    id: String(row.id),
    ngay: typeof row.ngay === 'string' ? row.ngay.slice(0, 10) : String(row.ngay),
    id_chi_nhanh: row.id_chi_nhanh != null ? String(row.id_chi_nhanh) : null,
    ten_chi_nhanh: row.ten_chi_nhanh ?? null,
    ...m,
    pham_cap: pcapRows.length > 0 ? pcapDbRowsToModel(pcapRows) : defaultPhamCapModelRows(),
    kpi_thuong: kpiRows.sort((a, b) => a.thu_tu - b.thu_tu),
    ghi_chu: row.ghi_chu ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: null,
    trang_thai: normalizeTrangThaiDb(row.trang_thai),
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

async function fetchCtRowsForIds(ids: string[]): Promise<Map<string, DbRowCt[]>> {
  const map = new Map<string, DbRowCt[]>();
  if (ids.length === 0) return map;
  const numIds = ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  const { data, error } = await supabase.from(TABLE_CT).select(ROW_CT).in('id_bao_cao', numIds);
  if (error) throwSupabaseError(error, { resource: `${TABLE_CT}.select` });
  for (const row of (data ?? []) as DbRowCt[]) {
    const key = String(row.id_bao_cao);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

async function fetchKpiRowsForIds(ids: string[]): Promise<Map<string, FarmBaoCaoKpiThuongRow[]>> {
  const map = new Map<string, FarmBaoCaoKpiThuongRow[]>();
  if (ids.length === 0) return map;
  const numIds = ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  const { data, error } = await supabase.from(TABLE_KPI).select(ROW_KPI).in('id_bao_cao', numIds);
  if (error) throwSupabaseError(error, { resource: `${TABLE_KPI}.select` });
  for (const row of (data ?? []) as DbRowKpi[]) {
    const key = String(row.id_bao_cao);
    const list = map.get(key) ?? [];
    list.push(kpiRowToModel(row));
    map.set(key, list);
  }
  return map;
}

async function fetchPcapRowsForIds(ids: string[]): Promise<Map<string, DbRowPcap[]>> {
  const map = new Map<string, DbRowPcap[]>();
  if (ids.length === 0) return map;
  const numIds = ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  const { data, error } = await supabase.from(TABLE_PCAP).select(ROW_PCAP).in('id_bao_cao', numIds);
  if (error) throwSupabaseError(error, { resource: `${TABLE_PCAP}.select` });
  for (const row of (data ?? []) as DbRowPcap[]) {
    const key = String(row.id_bao_cao);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

function chaPayloadCreate(values: BaoCaoSoCheFormValues, idNguoiTao: string | null) {
  return {
    ngay: values.ngay,
    id_chi_nhanh: parseIdToInt8(values.id_chi_nhanh),
    ten_chi_nhanh: values.ten_chi_nhanh?.trim() || null,
    ghi_chu: values.ghi_chu?.trim() || null,
    id_nguoi_tao: parseIdToInt8(idNguoiTao),
    trang_thai: TRANG_THAI_BAO_CAO_SO_CHE.MO,
    tg_cap_nhat: new Date().toISOString(),
  };
}

function chaPayloadUpdate(values: BaoCaoSoCheFormValues) {
  return {
    ngay: values.ngay,
    id_chi_nhanh: parseIdToInt8(values.id_chi_nhanh),
    ten_chi_nhanh: values.ten_chi_nhanh?.trim() || null,
    ghi_chu: values.ghi_chu?.trim() || null,
    tg_cap_nhat: new Date().toISOString(),
  };
}

function ctRowsFromForm(values: BaoCaoSoCheFormValues, idBaoCao: number) {
  const metaForm = values.so_lieu_row_meta as SoLieuRowMetaForm;
  const vals = values as unknown as Record<SoLieuRowKey, number>;
  return SO_LIEU_BUONG_ROW_DEFS.map((def, idx) => {
    const k = def.key;
    const e = metaForm[k];
    const dvt = e.don_vi_tinh_phu?.trim() || SO_LIEU_ROW_DVT_DEFAULT;
    const gc = e.ghi_chu?.trim();
    return {
      id_bao_cao: idBaoCao,
      ma_chi_tieu: k,
      gia_tri: vals[k] ?? 0,
      don_vi_tinh: dvt,
      ghi_chu: gc ? gc : null,
      thu_tu: idx + 1,
    };
  });
}

function kpiPayloadRows(idBaoCao: number, values: BaoCaoSoCheFormValues) {
  const filtered = (values.kpi_thuong ?? []).filter((r) => String(r.ten_hang_muc ?? '').trim().length > 0);
  return filtered.map((r, i) => ({
    id_bao_cao: idBaoCao,
    thu_tu: i + 1,
    ten_hang_muc: String(r.ten_hang_muc).trim(),
    don_vi_tinh: r.don_vi_tinh?.trim() || null,
    muc_tieu: r.muc_tieu?.trim() || null,
    thuc_te: r.thuc_te?.trim() || null,
    phan_tram: computeKpiPhanTram(r.muc_tieu, r.thuc_te),
    danh_gia: r.danh_gia?.trim() || null,
    tien_thuong: Number(r.tien_thuong ?? 0),
    ghi_chu: r.ghi_chu?.trim() || null,
  }));
}

function pcapRowsFromForm(values: BaoCaoSoCheFormValues, idBaoCao: number) {
  return (values.pham_cap ?? [])
    .filter((r) => String(r?.ten_pham_cap ?? '').trim() !== '')
    .map((r, idx) => ({
      id_bao_cao: idBaoCao,
      ten_pham_cap: String(r.ten_pham_cap).trim(),
      so_tham_chieu: r.so_tham_chieu ?? 0,
      so_thung: r.so_thung ?? 0,
      so_thung_quy_doi: r.so_thung_quy_doi ?? 0,
      thu_tu: idx + 1,
    }));
}

export async function getAllBaoCaoSoCheSupabase(): Promise<FarmBaoCaoSoChe[]> {
  const { data, error } = await supabase.from(TABLE_CHA).select(ROW_CHA).order('ngay', { ascending: false });
  if (error) throwSupabaseError(error, { resource: `${TABLE_CHA}.list` });
  const rows = (data ?? []) as DbRowCha[];
  const ids = rows.map((r) => String(r.id));
  const [ctMap, pcapMap, kpiMap] = await Promise.all([
    fetchCtRowsForIds(ids),
    fetchPcapRowsForIds(ids),
    fetchKpiRowsForIds(ids),
  ]);
  return rows.map((r) =>
    chaRowToModel(
      r,
      ctMap.get(String(r.id)) ?? [],
      pcapMap.get(String(r.id)) ?? [],
      kpiMap.get(String(r.id)) ?? []
    )
  );
}

export async function getBaoCaoSoCheByIdSupabase(id: string): Promise<FarmBaoCaoSoChe | null> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return null;
  const { data, error } = await supabase.from(TABLE_CHA).select(ROW_CHA).eq('id', numId).maybeSingle();
  if (error) throwSupabaseError(error, { resource: `${TABLE_CHA}.byId` });
  if (!data) return null;
  const row = data as DbRowCha;
  const [ctMap, pcapMap, kpiMap] = await Promise.all([
    fetchCtRowsForIds([String(row.id)]),
    fetchPcapRowsForIds([String(row.id)]),
    fetchKpiRowsForIds([String(row.id)]),
  ]);
  return chaRowToModel(
    row,
    ctMap.get(String(row.id)) ?? [],
    pcapMap.get(String(row.id)) ?? [],
    kpiMap.get(String(row.id)) ?? []
  );
}

export async function createBaoCaoSoCheSupabase(
  values: BaoCaoSoCheFormValues,
  idNguoiTao: string | null
): Promise<FarmBaoCaoSoChe> {
  await assertBaoCaoSoCheUniqueNgayChiNhanh(values.ngay, values.id_chi_nhanh, null);
  const payloadCha = { ...chaPayloadCreate(values, idNguoiTao), tg_tao: new Date().toISOString() };
  const { data: inserted, error } = await supabase.from(TABLE_CHA).insert(payloadCha).select(ROW_CHA).single();
  if (error) throw mapChaInsertUpdateError(error);
  const parent = inserted as DbRowCha;
  const pid = parent.id;
  const { error: e2 } = await supabase.from(TABLE_CT).insert(ctRowsFromForm(values, pid));
  if (e2) throwSupabaseError(e2, { resource: `${TABLE_CT}.insert` });
  const pcapIns = pcapRowsFromForm(values, pid);
  if (pcapIns.length > 0) {
    const { error: e3 } = await supabase.from(TABLE_PCAP).insert(pcapIns);
    if (e3) throwSupabaseError(e3, { resource: `${TABLE_PCAP}.insert` });
  }
  const kpiIns = kpiPayloadRows(pid, values);
  if (kpiIns.length > 0) {
    const { error: ek } = await supabase.from(TABLE_KPI).insert(kpiIns);
    if (ek) throwSupabaseError(ek, { resource: `${TABLE_KPI}.insert` });
  }
  return (await getBaoCaoSoCheByIdSupabase(String(pid)))!;
}

export async function updateBaoCaoSoCheSupabase(id: string, values: BaoCaoSoCheFormValues): Promise<FarmBaoCaoSoChe> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error('Invalid id');
  await assertBaoCaoSoCheUniqueNgayChiNhanh(values.ngay, values.id_chi_nhanh, numId);
  const { error } = await supabase.from(TABLE_CHA).update(chaPayloadUpdate(values)).eq('id', numId);
  if (error) throw mapChaInsertUpdateError(error);
  const { error: delErr } = await supabase.from(TABLE_CT).delete().eq('id_bao_cao', numId);
  if (delErr) throwSupabaseError(delErr, { resource: `${TABLE_CT}.delete` });
  const { error: insErr } = await supabase.from(TABLE_CT).insert(ctRowsFromForm(values, numId));
  if (insErr) throwSupabaseError(insErr, { resource: `${TABLE_CT}.insert` });
  const { error: delPc } = await supabase.from(TABLE_PCAP).delete().eq('id_bao_cao', numId);
  if (delPc) throwSupabaseError(delPc, { resource: `${TABLE_PCAP}.delete` });
  const pcapIns = pcapRowsFromForm(values, numId);
  if (pcapIns.length > 0) {
    const { error: insPc } = await supabase.from(TABLE_PCAP).insert(pcapIns);
    if (insPc) throwSupabaseError(insPc, { resource: `${TABLE_PCAP}.insert` });
  }
  const { error: delKpi } = await supabase.from(TABLE_KPI).delete().eq('id_bao_cao', numId);
  if (delKpi) throwSupabaseError(delKpi, { resource: `${TABLE_KPI}.delete` });
  const kpiIns = kpiPayloadRows(numId, values);
  if (kpiIns.length > 0) {
    const { error: ek } = await supabase.from(TABLE_KPI).insert(kpiIns);
    if (ek) throwSupabaseError(ek, { resource: `${TABLE_KPI}.insert` });
  }
  return (await getBaoCaoSoCheByIdSupabase(id))!;
}

export async function deleteBaoCaoSoCheSupabase(id: string): Promise<void> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return;
  const { error } = await supabase.from(TABLE_CHA).delete().eq('id', numId);
  if (error) throwSupabaseError(error, { resource: `${TABLE_CHA}.delete` });
}

export async function deleteBaoCaoSoCheManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_CHA).delete().in('id', numIds);
  if (error) throwSupabaseError(error, { resource: `${TABLE_CHA}.deleteMany` });
}

export async function updateBaoCaoSoCheTrangThaiSupabase(
  id: string,
  trang_thai: TrangThaiBaoCaoSoChePhieu
): Promise<FarmBaoCaoSoChe> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error('Invalid id');
  const next = trang_thai === TRANG_THAI_BAO_CAO_SO_CHE.KHOA ? TRANG_THAI_BAO_CAO_SO_CHE.KHOA : TRANG_THAI_BAO_CAO_SO_CHE.MO;
  const { error } = await supabase
    .from(TABLE_CHA)
    .update({ trang_thai: next, tg_cap_nhat: new Date().toISOString() })
    .eq('id', numId);
  if (error) throwSupabaseError(error, { resource: `${TABLE_CHA}.updateTrangThai` });
  return (await getBaoCaoSoCheByIdSupabase(id))!;
}
