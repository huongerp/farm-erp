/**
 * Danh mục Đánh giá đầu vào (dialog Cài đặt ⚙): màu dây, lô thu hoạch, lý do.
 * Số dòng nhỏ → tải cả bảng. Đọc: ai có quyền module; ghi: cấp cao / admin module (RLS migration 052).
 */
import { db, throwDbError } from '../../../../lib/db';
import type { LoaiLyDoDgdv, VarDgdvLyDo, VarLoThuHoach, VarMauDay } from '../core/types';
import type { DgdvLyDoFormValues, LoThuHoachFormValues, MauDayFormValues } from '../core/schema';

const T_MAU = 'fp_var_mau_day';
const T_LO = 'fp_var_lo_thu_hoach';
const T_LY_DO = 'fp_var_dgdv_ly_do';

type Id = number | string;

const toInt8 = (id: string | null | undefined): number | null => {
  if (id == null || id === '') return null;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
};

// ---- Màu dây ---------------------------------------------------------------------

/** Tải ĐỦ màu kể cả `dang_dung = false` — phiếu cũ vẫn trỏ tới màu đã ngừng dùng. */
export async function getMauDayDb(): Promise<VarMauDay[]> {
  const { data, error } = await db
    .from(T_MAU)
    .select('id,ten,ma_mau,thu_tu,dang_dung,tg_tao,tg_cap_nhat')
    .order('thu_tu')
    .order('id');
  if (error) throwDbError(error, { resource: T_MAU });
  return ((data ?? []) as (Omit<VarMauDay, 'id'> & { id: Id })[]).map((r) => ({ ...r, id: String(r.id) }));
}

export async function luuMauDayDb(id: string | null, v: MauDayFormValues): Promise<void> {
  const body = { ten: v.ten.trim(), ma_mau: v.ma_mau.toUpperCase(), thu_tu: v.thu_tu, dang_dung: v.dang_dung };
  const { error } = id
    ? await db.from(T_MAU).update(body).eq('id', toInt8(id) ?? -1)
    : await db.from(T_MAU).insert(body);
  if (error) throwDbError(error, { resource: T_MAU });
}

export async function xoaMauDayDb(id: string): Promise<void> {
  const { error } = await db.from(T_MAU).delete().eq('id', toInt8(id) ?? -1);
  if (error) throwDbError(error, { resource: `${T_MAU}.delete` });
}

// ---- Lô thu hoạch ------------------------------------------------------------------

interface DbLoRow {
  id: Id;
  ten_lo: string;
  id_chi_nhanh: Id;
  to_truong: string | null;
  ghi_chu: string | null;
  dang_dung: boolean;
  thu_tu: number;
  tg_tao: string;
  tg_cap_nhat: string;
  chi_nhanh?: { ten_chi_nhanh: string | null } | null;
}

export async function getLoThuHoachDb(): Promise<VarLoThuHoach[]> {
  const { data, error } = await db
    .from(T_LO)
    .select('id,ten_lo,id_chi_nhanh,to_truong,ghi_chu,dang_dung,thu_tu,tg_tao,tg_cap_nhat,chi_nhanh:fp_var_chi_nhanh(ten_chi_nhanh)')
    .order('id_chi_nhanh')
    .order('thu_tu')
    .order('ten_lo');
  if (error) throwDbError(error, { resource: T_LO });
  return ((data ?? []) as unknown as DbLoRow[]).map((r) => ({
    id: String(r.id),
    ten_lo: r.ten_lo,
    id_chi_nhanh: String(r.id_chi_nhanh),
    ten_chi_nhanh: r.chi_nhanh?.ten_chi_nhanh ?? null,
    to_truong: r.to_truong ?? null,
    ghi_chu: r.ghi_chu ?? null,
    dang_dung: r.dang_dung,
    thu_tu: Number(r.thu_tu) || 0,
    tg_tao: r.tg_tao,
    tg_cap_nhat: r.tg_cap_nhat,
  }));
}

export async function luuLoThuHoachDb(id: string | null, v: LoThuHoachFormValues): Promise<void> {
  const body = {
    ten_lo: v.ten_lo.trim(),
    id_chi_nhanh: toInt8(v.id_chi_nhanh),
    to_truong: v.to_truong?.trim() || null,
    ghi_chu: v.ghi_chu?.trim() || null,
    thu_tu: v.thu_tu,
    dang_dung: v.dang_dung,
  };
  const { error } = id
    ? await db.from(T_LO).update(body).eq('id', toInt8(id) ?? -1)
    : await db.from(T_LO).insert(body);
  if (error) throwDbError(error, { resource: T_LO });
}

export async function xoaLoThuHoachDb(id: string): Promise<void> {
  const { error } = await db.from(T_LO).delete().eq('id', toInt8(id) ?? -1);
  if (error) throwDbError(error, { resource: `${T_LO}.delete` });
}

// ---- Lý do -------------------------------------------------------------------------

export async function getLyDoDb(): Promise<VarDgdvLyDo[]> {
  const { data, error } = await db
    .from(T_LY_DO)
    .select('id,ten,loai,thu_tu,tg_tao,tg_cap_nhat')
    .order('loai')
    .order('thu_tu')
    .order('ten');
  if (error) throwDbError(error, { resource: T_LY_DO });
  return ((data ?? []) as (Omit<VarDgdvLyDo, 'id' | 'loai'> & { id: Id; loai: string })[]).map((r) => ({
    ...r,
    id: String(r.id),
    loai: (r.loai === 'loi' ? 'loi' : 'danh_gia') as LoaiLyDoDgdv,
  }));
}

/**
 * Thêm lý do gõ mới ở lưới vào danh sách chọn nhanh. Trùng (UNIQUE loai, ten — người khác vừa thêm)
 * thì coi như xong: mục đích chỉ là lần sau có gợi ý.
 */
export async function themLyDoNeuChuaCoDb(ten: string, loai: LoaiLyDoDgdv): Promise<void> {
  const { error } = await db.from(T_LY_DO).insert({ ten: ten.trim(), loai, thu_tu: 0 });
  if (error && error.code !== '23505') throwDbError(error, { resource: T_LY_DO });
}

export async function luuLyDoDb(id: string | null, v: DgdvLyDoFormValues): Promise<void> {
  const body = { ten: v.ten.trim(), loai: v.loai, thu_tu: v.thu_tu };
  const { error } = id
    ? await db.from(T_LY_DO).update(body).eq('id', toInt8(id) ?? -1)
    : await db.from(T_LY_DO).insert(body);
  if (error) throwDbError(error, { resource: T_LY_DO });
}

export async function xoaLyDoDb(id: string): Promise<void> {
  const { error } = await db.from(T_LY_DO).delete().eq('id', toInt8(id) ?? -1);
  if (error) throwDbError(error, { resource: `${T_LY_DO}.delete` });
}
