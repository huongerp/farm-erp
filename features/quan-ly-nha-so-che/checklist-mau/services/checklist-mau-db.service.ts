/**
 * Mẫu checklist — DB: fp_farm_cl_mau, fp_farm_cl_mau_muc, fp_farm_cl_mau_hang_muc,
 * tham chiếu thiết bị fp_farm_bd_thiet_bi (migration 073).
 */
import { db, fetchAllRows, throwDbError } from '../../../../lib/db';
import i18n from '../../../../lib/i18n';
import type { HangMucMauChecklist, LoaiMauCl, MauChecklist, MucMauChecklist } from '../core/types';
import type { MauChecklistListItem, ThietBiBaoDuong } from '../core/list-types';
import type { ChecklistMauFormValues } from '../core/schema';

const TABLE = 'fp_farm_cl_mau';
const TABLE_MUC = 'fp_farm_cl_mau_muc';
const TABLE_HM = 'fp_farm_cl_mau_hang_muc';
const TABLE_TB = 'fp_farm_bd_thiet_bi';

const MAU_COLUMNS =
  'id,ma,ten,mo_ta,loai,ten_ben_thuc_hien,ten_ben_kiem_tra,chuc_vu_thuc_hien_ids,chuc_vu_kiem_tra_ids,' +
  'co_ket_luan_van_hanh,ghi_chu_cuoi,dang_dung,thu_tu,id_nguoi_tao,tg_tao,tg_cap_nhat';

const MUC_COLUMNS = 'id,id_mau,ten,thu_tu';
const HM_COLUMNS = 'id,id_mau,id_muc,doi_tuong,tieu_chuan,phuong_phap,quan_trong,id_thiet_bi,dang_dung,thu_tu';
const TB_COLUMNS = 'id,ten,ma_ts,so_luong,khu_vuc,dang_dung,thu_tu';

interface DbMauRow {
  id: number;
  ma: string | null;
  ten: string;
  mo_ta: string | null;
  loai: LoaiMauCl;
  ten_ben_thuc_hien: string;
  ten_ben_kiem_tra: string;
  chuc_vu_thuc_hien_ids: unknown;
  chuc_vu_kiem_tra_ids: unknown;
  co_ket_luan_van_hanh: boolean;
  ghi_chu_cuoi: string | null;
  dang_dung: boolean;
  thu_tu: number;
  id_nguoi_tao: number | null;
  tg_tao: string;
  tg_cap_nhat: string;
  muc?: { id: number }[] | null;
  hang_muc?: { id: number }[] | null;
}

interface DbMucRow {
  id: number;
  id_mau: number;
  ten: string;
  thu_tu: number;
}

interface DbHangMucRow {
  id: number;
  id_mau: number;
  id_muc: number | null;
  doi_tuong: string;
  tieu_chuan: string | null;
  phuong_phap: string | null;
  quan_trong: boolean;
  id_thiet_bi: number | null;
  dang_dung: boolean;
  thu_tu: number;
}

interface DbThietBiRow {
  id: number;
  ten: string;
  ma_ts: string | null;
  so_luong: string | null;
  khu_vuc: string | null;
  dang_dung: boolean;
  thu_tu: number;
}

const idStr = (v: number | null | undefined) => (v != null ? String(v) : null);
const idArr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);

function toIntId(id: string): number {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error('Invalid id');
  return n;
}

const nums = (ids: string[]) => ids.map(Number).filter(Number.isFinite);

const blank = (v: string | null | undefined) => {
  const s = (v ?? '').trim();
  return s === '' ? null : s;
};

function rowToModel(row: DbMauRow): MauChecklist {
  return {
    id: String(row.id),
    ma: row.ma,
    ten: row.ten,
    mo_ta: row.mo_ta,
    loai: row.loai,
    ten_ben_thuc_hien: row.ten_ben_thuc_hien,
    ten_ben_kiem_tra: row.ten_ben_kiem_tra,
    chuc_vu_thuc_hien_ids: idArr(row.chuc_vu_thuc_hien_ids),
    chuc_vu_kiem_tra_ids: idArr(row.chuc_vu_kiem_tra_ids),
    co_ket_luan_van_hanh: row.co_ket_luan_van_hanh,
    ghi_chu_cuoi: row.ghi_chu_cuoi,
    dang_dung: row.dang_dung,
    thu_tu: row.thu_tu,
    id_nguoi_tao: idStr(row.id_nguoi_tao),
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
  };
}

function mucToModel(row: DbMucRow): MucMauChecklist {
  return { id: String(row.id), id_mau: String(row.id_mau), ten: row.ten, thu_tu: row.thu_tu };
}

function hangMucToModel(row: DbHangMucRow): HangMucMauChecklist {
  return {
    id: String(row.id),
    id_mau: String(row.id_mau),
    id_muc: idStr(row.id_muc),
    doi_tuong: row.doi_tuong,
    tieu_chuan: row.tieu_chuan,
    phuong_phap: row.phuong_phap,
    quan_trong: row.quan_trong,
    id_thiet_bi: idStr(row.id_thiet_bi),
    tan_suat: null,
    dang_dung: row.dang_dung,
    thu_tu: row.thu_tu,
  };
}

function thietBiToModel(row: DbThietBiRow): ThietBiBaoDuong {
  return {
    id: String(row.id),
    ten: row.ten,
    ma_ts: row.ma_ts,
    so_luong: row.so_luong,
    khu_vuc: row.khu_vuc,
    dang_dung: row.dang_dung,
    thu_tu: row.thu_tu,
  };
}

// ── Mẫu ───────────────────────────────────────────────────────────────────────

/** Toàn bộ mẫu (danh sách ít dòng) kèm số mục / hạng mục qua embed đếm id. */
export async function getMauListDb(): Promise<MauChecklistListItem[]> {
  const rows = await fetchAllRows<DbMauRow>((from, to) =>
    db
      .from(TABLE)
      .select(`${MAU_COLUMNS},muc:${TABLE_MUC}(id),hang_muc:${TABLE_HM}(id)`)
      .order('thu_tu', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)
  );
  return rows.map((row) => ({ ...rowToModel(row), so_muc: row.muc?.length ?? 0, so_hang_muc: row.hang_muc?.length ?? 0 }));
}

export async function getMauByIdDb(id: string): Promise<MauChecklist | null> {
  const { data, error } = await db.from(TABLE).select(MAU_COLUMNS).eq('id', toIntId(id)).maybeSingle();
  if (error) throwDbError(error);
  return data ? rowToModel(data as unknown as DbMauRow) : null;
}

export interface MauChiTiet {
  mau: MauChecklist;
  muc: MucMauChecklist[];
  hangMuc: HangMucMauChecklist[];
}

/** Chi tiết mẫu kèm toàn bộ mục & hạng mục. */
export async function getMauChiTietDb(id: string): Promise<MauChiTiet | null> {
  const mau = await getMauByIdDb(id);
  if (!mau) return null;
  const [muc, hangMuc] = await Promise.all([getMucDb(id), getHangMucDb(id)]);
  return { mau, muc, hangMuc };
}

function mauPayload(v: ChecklistMauFormValues): Record<string, unknown> {
  return {
    ma: blank(v.ma),
    ten: v.ten.trim(),
    mo_ta: blank(v.mo_ta),
    loai: v.loai,
    ten_ben_thuc_hien: (v.ten_ben_thuc_hien ?? '').trim() || i18n.t('checklistMau.defaults.tenBenThucHien'),
    ten_ben_kiem_tra: (v.ten_ben_kiem_tra ?? '').trim() || i18n.t('checklistMau.defaults.tenBenKiemTra'),
    chuc_vu_thuc_hien_ids: nums(v.chuc_vu_thuc_hien_ids),
    chuc_vu_kiem_tra_ids: nums(v.chuc_vu_kiem_tra_ids),
    co_ket_luan_van_hanh: v.co_ket_luan_van_hanh,
    ghi_chu_cuoi: blank(v.ghi_chu_cuoi),
    dang_dung: v.dang_dung,
    thu_tu: v.thu_tu,
  };
}

export async function createMauDb(values: ChecklistMauFormValues): Promise<MauChecklist> {
  const { data, error } = await db.from(TABLE).insert(mauPayload(values)).select('id').single();
  if (error) throwDbError(error);
  const row = await getMauByIdDb(String((data as { id: number }).id));
  if (!row) throw new Error(i18n.t('checklistMau.service.notFound'));
  return row;
}

export async function updateMauDb(id: string, values: ChecklistMauFormValues): Promise<MauChecklist> {
  const { error } = await db.from(TABLE).update(mauPayload(values)).eq('id', toIntId(id));
  if (error) throwDbError(error);
  const row = await getMauByIdDb(id);
  if (!row) throw new Error(i18n.t('checklistMau.service.notFound'));
  return row;
}

export async function deleteMauDb(id: string): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq('id', toIntId(id));
  if (error) throwDbError(error);
}

// ── Mục ───────────────────────────────────────────────────────────────────────

export async function getMucDb(idMau: string): Promise<MucMauChecklist[]> {
  const { data, error } = await db
    .from(TABLE_MUC)
    .select(MUC_COLUMNS)
    .eq('id_mau', toIntId(idMau))
    .order('thu_tu', { ascending: true })
    .order('id', { ascending: true });
  if (error) throwDbError(error);
  return ((data as DbMucRow[] | null) ?? []).map(mucToModel);
}

export async function createMucDb(idMau: string, ten: string, thuTu: number): Promise<void> {
  const { error } = await db.from(TABLE_MUC).insert({ id_mau: toIntId(idMau), ten: ten.trim(), thu_tu: thuTu });
  if (error) throwDbError(error);
}

export async function updateMucDb(id: string, ten: string): Promise<void> {
  const { error } = await db.from(TABLE_MUC).update({ ten: ten.trim() }).eq('id', toIntId(id));
  if (error) throwDbError(error);
}

export async function deleteMucDb(id: string): Promise<void> {
  const { error } = await db.from(TABLE_MUC).delete().eq('id', toIntId(id));
  if (error) throwDbError(error);
}

/** Ghi lại thứ tự mục theo mảng id (sau khi bấm lên/xuống). */
export async function sapXepMucDb(ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += 1) {
    const { error } = await db.from(TABLE_MUC).update({ thu_tu: i + 1 }).eq('id', toIntId(ids[i]));
    if (error) throwDbError(error);
  }
}

// ── Hạng mục ──────────────────────────────────────────────────────────────────

export async function getHangMucDb(idMau: string): Promise<HangMucMauChecklist[]> {
  const { data, error } = await db
    .from(TABLE_HM)
    .select(HM_COLUMNS)
    .eq('id_mau', toIntId(idMau))
    .order('thu_tu', { ascending: true })
    .order('id', { ascending: true });
  if (error) throwDbError(error);
  return ((data as DbHangMucRow[] | null) ?? []).map(hangMucToModel);
}

export interface HangMucInput {
  id_mau: string;
  id_muc: string | null;
  doi_tuong: string;
  tieu_chuan: string | null;
  phuong_phap: string | null;
  quan_trong: boolean;
  id_thiet_bi: string | null;
  dang_dung: boolean;
}

function hangMucFields(v: Omit<HangMucInput, 'id_mau'>): Record<string, unknown> {
  return {
    id_muc: v.id_muc ? toIntId(v.id_muc) : null,
    doi_tuong: v.doi_tuong.trim(),
    tieu_chuan: blank(v.tieu_chuan),
    phuong_phap: blank(v.phuong_phap),
    quan_trong: v.quan_trong,
    id_thiet_bi: v.id_thiet_bi ? toIntId(v.id_thiet_bi) : null,
    dang_dung: v.dang_dung,
  };
}

export async function createHangMucDb(v: HangMucInput, thuTu: number): Promise<void> {
  const { error } = await db
    .from(TABLE_HM)
    .insert({ ...hangMucFields(v), id_mau: toIntId(v.id_mau), thu_tu: thuTu });
  if (error) throwDbError(error);
}

export async function updateHangMucDb(id: string, v: Omit<HangMucInput, 'id_mau'>): Promise<void> {
  const { error } = await db.from(TABLE_HM).update(hangMucFields(v)).eq('id', toIntId(id));
  if (error) throwDbError(error);
}

export async function deleteHangMucDb(id: string): Promise<void> {
  const { error } = await db.from(TABLE_HM).delete().eq('id', toIntId(id));
  if (error) throwDbError(error);
}

export async function datDangDungHangMucDb(id: string, dangDung: boolean): Promise<void> {
  const { error } = await db.from(TABLE_HM).update({ dang_dung: dangDung }).eq('id', toIntId(id));
  if (error) throwDbError(error);
}

/** Ghi lại thứ tự hạng mục theo mảng id (đổi thứ tự trong cùng một mục). */
export async function sapXepHangMucDb(ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += 1) {
    const { error } = await db.from(TABLE_HM).update({ thu_tu: i + 1 }).eq('id', toIntId(ids[i]));
    if (error) throwDbError(error);
  }
}

// ── Thiết bị (chỉ đọc) ────────────────────────────────────────────────────────

export async function getThietBiDb(): Promise<ThietBiBaoDuong[]> {
  const rows = await fetchAllRows<DbThietBiRow>((from, to) =>
    db
      .from(TABLE_TB)
      .select(TB_COLUMNS)
      .eq('dang_dung', true)
      .order('thu_tu', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)
  );
  return rows.map(thietBiToModel);
}
