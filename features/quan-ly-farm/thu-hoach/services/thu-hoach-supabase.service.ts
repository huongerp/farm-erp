/**
 * Thu hoạch — Supabase fp_farm_thu_hoach
 */
import { supabase, fetchAllRows } from '../../../../lib/supabase';
import i18n from '../../../../lib/i18n';
import type { FarmThuHoach } from '../core/types';
import { THU_HOACH_DAY_SUFFIXES } from '../core/types';
import type { ThuHoachKeHoachFormValues, ThuHoachThucTeFormValues } from '../core/schema';
import { parseIdToInt8 } from '../core/utils';

const TABLE = 'fp_farm_thu_hoach';

interface DbRow {
  id: number;
  nam: number;
  tuan: number;
  id_chi_nhanh: number | null;
  ten_chi_nhanh: string | null;
  ke_hoach_t2: string | number | null;
  ke_hoach_t3: string | number | null;
  ke_hoach_t4: string | number | null;
  ke_hoach_t5: string | number | null;
  ke_hoach_t6: string | number | null;
  ke_hoach_t7: string | number | null;
  ke_hoach_cn: string | number | null;
  thuc_te_t2: string | number | null;
  thuc_te_t3: string | number | null;
  thuc_te_t4: string | number | null;
  thuc_te_t5: string | number | null;
  thuc_te_t6: string | number | null;
  thuc_te_t7: string | number | null;
  thuc_te_cn: string | number | null;
  ghi_chu: string | null;
  id_nguoi_tao: number | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
  trao_doi: string | null;
}

function num(v: string | number | null | undefined): number {
  if (v == null || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function rowToModel(row: DbRow): FarmThuHoach {
  return {
    id: String(row.id),
    nam: Number(row.nam),
    tuan: Number(row.tuan),
    id_chi_nhanh: row.id_chi_nhanh != null ? String(row.id_chi_nhanh) : null,
    ten_chi_nhanh: row.ten_chi_nhanh ?? null,
    ke_hoach_t2: num(row.ke_hoach_t2),
    ke_hoach_t3: num(row.ke_hoach_t3),
    ke_hoach_t4: num(row.ke_hoach_t4),
    ke_hoach_t5: num(row.ke_hoach_t5),
    ke_hoach_t6: num(row.ke_hoach_t6),
    ke_hoach_t7: num(row.ke_hoach_t7),
    ke_hoach_cn: num(row.ke_hoach_cn),
    thuc_te_t2: num(row.thuc_te_t2),
    thuc_te_t3: num(row.thuc_te_t3),
    thuc_te_t4: num(row.thuc_te_t4),
    thuc_te_t5: num(row.thuc_te_t5),
    thuc_te_t6: num(row.thuc_te_t6),
    thuc_te_t7: num(row.thuc_te_t7),
    thuc_te_cn: num(row.thuc_te_cn),
    ghi_chu: row.ghi_chu ?? null,
    trao_doi: row.trao_doi ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: null,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function keHoachPayload(values: ThuHoachKeHoachFormValues): Record<string, unknown> {
  const p: Record<string, unknown> = {
    nam: values.nam,
    tuan: values.tuan,
    id_chi_nhanh: parseIdToInt8(values.id_chi_nhanh),
    ten_chi_nhanh: values.ten_chi_nhanh ?? null,
    ghi_chu: values.ghi_chu ?? null,
    trao_doi: values.trao_doi ?? null,
  };
  for (const s of THU_HOACH_DAY_SUFFIXES) {
    p[`ke_hoach_${s}`] = values[`ke_hoach_${s}` as keyof ThuHoachKeHoachFormValues] ?? 0;
  }
  return p;
}

function thucTePayload(values: ThuHoachThucTeFormValues): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  for (const s of THU_HOACH_DAY_SUFFIXES) {
    p[`thuc_te_${s}`] = values[`thuc_te_${s}` as keyof ThuHoachThucTeFormValues] ?? 0;
  }
  return p;
}

/** Cùng định dạng dòng trao đổi phiếu kho: dd/mm/yyyy hh:mm:ss (24h). */
function formatThuHoachTraoDoiTimestamp(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Nối thêm một dòng trao đổi (không ghi đè lịch sử). */
export async function appendThuHoachTraoDoiSupabase(
  id: string,
  noiDung: string,
  tenNguoiGhi: string
): Promise<FarmThuHoach> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error('Invalid id');
  const text = noiDung.trim();
  if (!text) throw new Error(i18n.t('thuHoach.validation.traoDoiNoiDungRequired'));

  const { data: rowCur, error: eSel } = await supabase.from(TABLE).select('trao_doi').eq('id', numId).maybeSingle();
  if (eSel) throw new Error(eSel.message);
  if (rowCur == null) throw new Error(i18n.t('thuHoach.service.notFound'));

  const existing = String((rowCur as { trao_doi?: string | null }).trao_doi ?? '').trim();
  const ts = formatThuHoachTraoDoiTimestamp();
  const who = tenNguoiGhi.trim() || 'Người dùng';
  const entry = `${ts} — ${who}: ${text}`;
  const newTraoDoi = existing ? `${existing}\n${entry}` : entry;

  const { data, error } = await supabase
    .from(TABLE)
    .update({ trao_doi: newTraoDoi })
    .eq('id', numId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return rowToModel(data as DbRow);
}

export async function getAllThuHoachSupabase(): Promise<FarmThuHoach[]> {
  const rows = await fetchAllRows<DbRow>((from, to) =>
    supabase
      .from(TABLE)
      .select('*')
      .order('nam', { ascending: false })
      .order('tuan', { ascending: false })
      .order('tg_cap_nhat', { ascending: false })
      .range(from, to)
  );
  return rows.map(rowToModel);
}

export async function getThuHoachByIdSupabase(id: string): Promise<FarmThuHoach | null> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return null;
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', numId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return rowToModel(data as DbRow);
}

export async function createThuHoachSupabase(
  values: ThuHoachKeHoachFormValues,
  idNguoiTao: string | null
): Promise<FarmThuHoach> {
  const payload = {
    ...keHoachPayload(values),
    id_nguoi_tao: parseIdToInt8(idNguoiTao),
  };
  const { data, error } = await supabase.from(TABLE).insert(payload).select('*').single();
  if (error) throw new Error(error.message);
  return rowToModel(data as DbRow);
}

export async function updateThuHoachKeHoachSupabase(
  id: string,
  values: ThuHoachKeHoachFormValues
): Promise<FarmThuHoach> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error('Invalid id');
  const payload = keHoachPayload(values);
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', numId).select('*').single();
  if (error) throw new Error(error.message);
  return rowToModel(data as DbRow);
}

export async function updateThuHoachThucTeSupabase(
  id: string,
  values: ThuHoachThucTeFormValues
): Promise<FarmThuHoach> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error('Invalid id');
  const payload = thucTePayload(values);
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', numId).select('*').single();
  if (error) throw new Error(error.message);
  return rowToModel(data as DbRow);
}

export async function deleteThuHoachSupabase(id: string): Promise<void> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new Error('Invalid id');
  const { error } = await supabase.from(TABLE).delete().eq('id', numId);
  if (error) throw new Error(error.message);
}

export async function deleteThuHoachManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((id) => Number(id)).filter((n) => Number.isFinite(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', numIds);
  if (error) throw new Error(error.message);
}
