/**
 * Bảo dưỡng thiết bị — DB: fp_farm_bd_thiet_bi, fp_farm_bd_viec, fp_farm_bd_nhat_ky
 * (migration 073). `lan_gan_nhat` / `han_ke_tiep` do trigger tính — app chỉ ghi
 * `han_ke_tiep` khi việc chưa làm lần nào (ngày bắt đầu).
 */
import { db, fetchAllRows, throwDbError } from '../../../../lib/db';
import i18n from '../../../../lib/i18n';
import type { KetQuaBaoDuong, NhatKyBaoDuong, ThietBi, ViecBaoDuong } from '../core/types';
import type { ThietBiFormValues } from '../core/schema';

const TABLE_TB = 'fp_farm_bd_thiet_bi';
const TABLE_VIEC = 'fp_farm_bd_viec';
const TABLE_NK = 'fp_farm_bd_nhat_ky';
const TABLE_TS = 'fp_ts_tai_san';

const TB_COLUMNS =
  'id,id_chi_nhanh,ten,ma_ts,so_luong,khu_vuc,id_tai_san,ghi_chu,dang_dung,thu_tu,id_nguoi_tao,tg_tao,tg_cap_nhat';
const VIEC_COLUMNS = 'id,id_thiet_bi,noi_dung,chu_ky_ngay,lan_gan_nhat,han_ke_tiep,ghi_chu,dang_dung,thu_tu,kq_gan_nhat';
const NK_COLUMNS = 'id,id_viec,ngay_thuc_hien,ket_qua,noi_dung,hinh_anh,id_nguoi_thuc_hien,id_nguoi_tao,tg_tao';

interface DbThietBiRow {
  id: number;
  id_chi_nhanh: number;
  ten: string;
  ma_ts: string | null;
  so_luong: string | null;
  khu_vuc: string | null;
  id_tai_san: number | null;
  ghi_chu: string | null;
  dang_dung: boolean;
  thu_tu: number;
  id_nguoi_tao: number | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

interface DbViecRow {
  id: number;
  id_thiet_bi: number;
  noi_dung: string;
  chu_ky_ngay: number | null;
  lan_gan_nhat: string | null;
  han_ke_tiep: string | null;
  ghi_chu: string | null;
  dang_dung: boolean;
  thu_tu: number;
  kq_gan_nhat: KetQuaBaoDuong | null;
}

interface DbNhatKyRow {
  id: number;
  id_viec: number;
  ngay_thuc_hien: string;
  ket_qua: KetQuaBaoDuong;
  noi_dung: string | null;
  hinh_anh: unknown;
  id_nguoi_thuc_hien: number | null;
  id_nguoi_tao: number | null;
  tg_tao: string;
}

interface DbTaiSanRow {
  id: number;
  ma_tai_san: string;
  ten_tai_san: string;
}

export interface TaiSanRef {
  id: string;
  ma_tai_san: string;
  ten_tai_san: string;
}

const idStr = (v: number | null | undefined) => (v != null ? String(v) : null);

const toIntId = (id: string): number => {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error('Invalid id');
  return n;
};

const blank = (v: string | null | undefined) => {
  const s = (v ?? '').trim();
  return s === '' ? null : s;
};

const idArr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);

function thietBiToModel(row: DbThietBiRow): ThietBi {
  return {
    id: String(row.id),
    id_chi_nhanh: String(row.id_chi_nhanh),
    ten: row.ten,
    ma_ts: row.ma_ts,
    so_luong: row.so_luong,
    khu_vuc: row.khu_vuc,
    id_tai_san: idStr(row.id_tai_san),
    ghi_chu: row.ghi_chu,
    dang_dung: row.dang_dung,
    thu_tu: row.thu_tu,
    id_nguoi_tao: idStr(row.id_nguoi_tao),
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
  };
}

function viecToModel(row: DbViecRow): ViecBaoDuong {
  return {
    id: String(row.id),
    id_thiet_bi: String(row.id_thiet_bi),
    noi_dung: row.noi_dung,
    chu_ky_ngay: row.chu_ky_ngay,
    lan_gan_nhat: row.lan_gan_nhat,
    han_ke_tiep: row.han_ke_tiep,
    ghi_chu: row.ghi_chu,
    dang_dung: row.dang_dung,
    thu_tu: row.thu_tu,
    kq_gan_nhat: row.kq_gan_nhat ?? null,
  };
}

function nhatKyToModel(row: DbNhatKyRow): NhatKyBaoDuong {
  return {
    id: String(row.id),
    id_viec: String(row.id_viec),
    ngay_thuc_hien: row.ngay_thuc_hien,
    ket_qua: row.ket_qua,
    noi_dung: row.noi_dung,
    hinh_anh: idArr(row.hinh_anh),
    id_nguoi_thuc_hien: idStr(row.id_nguoi_thuc_hien),
    id_nguoi_tao: idStr(row.id_nguoi_tao),
    tg_tao: row.tg_tao,
  };
}

// ── Thiết bị ──────────────────────────────────────────────────────────────────

/** Toàn bộ thiết bị (ít dòng), xếp theo thứ tự rồi id. */
export async function getThietBiListDb(): Promise<ThietBi[]> {
  const rows = await fetchAllRows<DbThietBiRow>((from, to) =>
    db.from(TABLE_TB).select(TB_COLUMNS).order('thu_tu', { ascending: true }).order('id', { ascending: true }).range(from, to)
  );
  return rows.map(thietBiToModel);
}

export async function getThietBiByIdDb(id: string): Promise<ThietBi | null> {
  const { data, error } = await db.from(TABLE_TB).select(TB_COLUMNS).eq('id', toIntId(id)).maybeSingle();
  if (error) throwDbError(error);
  return data ? thietBiToModel(data as unknown as DbThietBiRow) : null;
}

function thietBiPayload(v: ThietBiFormValues): Record<string, unknown> {
  return {
    id_chi_nhanh: toIntId(v.id_chi_nhanh),
    ten: v.ten.trim(),
    ma_ts: blank(v.ma_ts),
    so_luong: blank(v.so_luong),
    khu_vuc: blank(v.khu_vuc),
    id_tai_san: v.id_tai_san ? toIntId(v.id_tai_san) : null,
    ghi_chu: blank(v.ghi_chu),
    dang_dung: v.dang_dung,
    thu_tu: v.thu_tu,
  };
}

export async function createThietBiDb(values: ThietBiFormValues): Promise<ThietBi> {
  const { data, error } = await db.from(TABLE_TB).insert(thietBiPayload(values)).select('id').single();
  if (error) throwDbError(error);
  const row = await getThietBiByIdDb(String((data as { id: number }).id));
  if (!row) throw new Error(i18n.t('baoDuongThietBi.service.khongTimThayThietBi'));
  return row;
}

export async function updateThietBiDb(id: string, values: ThietBiFormValues): Promise<ThietBi> {
  const { error } = await db.from(TABLE_TB).update(thietBiPayload(values)).eq('id', toIntId(id));
  if (error) throwDbError(error);
  const row = await getThietBiByIdDb(id);
  if (!row) throw new Error(i18n.t('baoDuongThietBi.service.khongTimThayThietBi'));
  return row;
}

export async function deleteThietBiDb(id: string): Promise<void> {
  const { error } = await db.from(TABLE_TB).delete().eq('id', toIntId(id));
  if (error) throwDbError(error);
}

/**
 * Sao chép thiết bị + việc đang dùng từ farm `tu` sang farm `den` (RPC migration 077).
 * Mã TS để trống, bỏ qua thiết bị trùng tên đã có ở farm đích. Trả số thiết bị đã tạo.
 */
export async function saoChepThietBiDb(tu: string, den: string): Promise<number> {
  const { data, error } = await db.rpc('rpc_bd_sao_chep_thiet_bi', { p_tu: toIntId(tu), p_den: toIntId(den) });
  if (error) throwDbError(error);
  return Number(data ?? 0);
}

// ── Việc bảo dưỡng ────────────────────────────────────────────────────────────

/** Việc đang dùng — dùng cho tab Lịch + 3 thẻ số đầu trang. */
export async function getViecDangDungDb(): Promise<ViecBaoDuong[]> {
  const rows = await fetchAllRows<DbViecRow>((from, to) =>
    db
      .from(TABLE_VIEC)
      .select(VIEC_COLUMNS)
      .eq('dang_dung', true)
      .order('thu_tu', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)
  );
  return rows.map(viecToModel);
}

/** Toàn bộ việc của một thiết bị (kể cả ngừng dùng) — hiện trong drawer. */
export async function getViecTheoThietBiDb(idThietBi: string): Promise<ViecBaoDuong[]> {
  const rows = await fetchAllRows<DbViecRow>((from, to) =>
    db
      .from(TABLE_VIEC)
      .select(VIEC_COLUMNS)
      .eq('id_thiet_bi', toIntId(idThietBi))
      .order('thu_tu', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)
  );
  return rows.map(viecToModel);
}

export interface ViecInput {
  id_thiet_bi: string;
  noi_dung: string;
  chu_ky_ngay: number | null;
  /** Chỉ có ý nghĩa khi việc chưa làm lần nào (lan_gan_nhat null) — trigger giữ làm ngày bắt đầu. */
  han_ke_tiep: string | null;
  ghi_chu: string | null;
  dang_dung: boolean;
}

function viecFields(v: Omit<ViecInput, 'id_thiet_bi'>): Record<string, unknown> {
  return {
    noi_dung: v.noi_dung.trim(),
    chu_ky_ngay: v.chu_ky_ngay,
    han_ke_tiep: v.han_ke_tiep,
    ghi_chu: blank(v.ghi_chu),
    dang_dung: v.dang_dung,
  };
}

export async function createViecDb(v: ViecInput, thuTu: number): Promise<void> {
  const { error } = await db.from(TABLE_VIEC).insert({ ...viecFields(v), id_thiet_bi: toIntId(v.id_thiet_bi), thu_tu: thuTu });
  if (error) throwDbError(error);
}

export async function updateViecDb(id: string, v: Omit<ViecInput, 'id_thiet_bi'>): Promise<void> {
  const { error } = await db.from(TABLE_VIEC).update(viecFields(v)).eq('id', toIntId(id));
  if (error) throwDbError(error);
}

export async function deleteViecDb(id: string): Promise<void> {
  const { error } = await db.from(TABLE_VIEC).delete().eq('id', toIntId(id));
  // FK RESTRICT (migration 076): việc đã có nhật ký không xoá được — giữ lịch sử bảo dưỡng.
  if (error?.code === '23503') throw new Error(i18n.t('baoDuongThietBi.service.viecDaCoNhatKy'));
  if (error) throwDbError(error);
}

/** Ghi lại thứ tự việc theo mảng id (sau khi bấm lên/xuống). */
export async function sapXepViecDb(ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += 1) {
    const { error } = await db.from(TABLE_VIEC).update({ thu_tu: i + 1 }).eq('id', toIntId(ids[i]));
    if (error) throwDbError(error);
  }
}

// ── Nhật ký ───────────────────────────────────────────────────────────────────

/** Nhật ký của nhiều việc (mới nhất trước) — lịch sử trong drawer. */
export async function getNhatKyTheoViecDb(ids: string[]): Promise<NhatKyBaoDuong[]> {
  if (ids.length === 0) return [];
  const rows = await fetchAllRows<DbNhatKyRow>((from, to) =>
    db
      .from(TABLE_NK)
      .select(NK_COLUMNS)
      .in('id_viec', ids.map(toIntId))
      .order('ngay_thuc_hien', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to)
  );
  return rows.map(nhatKyToModel);
}

export interface NhatKyInput {
  id_viec: string;
  ngay_thuc_hien: string;
  ket_qua: KetQuaBaoDuong;
  noi_dung: string | null;
  hinh_anh: string[];
  id_nguoi_thuc_hien: string | null;
}

export async function createNhatKyDb(v: NhatKyInput): Promise<void> {
  const { error } = await db.from(TABLE_NK).insert({
    id_viec: toIntId(v.id_viec),
    ngay_thuc_hien: v.ngay_thuc_hien,
    ket_qua: v.ket_qua,
    noi_dung: blank(v.noi_dung),
    hinh_anh: v.hinh_anh,
    id_nguoi_thuc_hien: v.id_nguoi_thuc_hien ? toIntId(v.id_nguoi_thuc_hien) : null,
  });
  if (error) throwDbError(error);
}

// ── Tài sản (chỉ đọc, chọn liên kết) ──────────────────────────────────────────

export async function getTaiSanRefDb(): Promise<TaiSanRef[]> {
  const rows = await fetchAllRows<DbTaiSanRow>((from, to) =>
    db.from(TABLE_TS).select('id,ma_tai_san,ten_tai_san').order('ma_tai_san', { ascending: true }).range(from, to)
  );
  return rows.map((r) => ({ id: String(r.id), ma_tai_san: r.ma_tai_san ?? '', ten_tai_san: r.ten_tai_san ?? '' }));
}
