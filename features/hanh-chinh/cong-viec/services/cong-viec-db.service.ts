/**
 * Service công việc – đọc/ghi DB (fp_hc_cong_viec).
 */
import { db, fetchAllRows, throwDbError } from '../../../../lib/db';
import type { CongViec, TraoDoiEntry } from '../core/types';
import type { CongViecFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { writeEachImportRow } from '../../../../lib/import-bulk';

const TABLE = 'fp_hc_cong_viec';

const ROW_COLUMNS =
  'id,tieu_de,mo_ta,id_cha,id_nguoi_giao,trach_nhiem,nguoi_ho_tro,uu_tien,trang_thai,tg_tao,tg_cap_nhat,trao_doi,ket_qua,link_ket_qua';

interface DbRow {
  id: number;
  tieu_de: string;
  mo_ta: string | null;
  id_cha: number | null;
  id_nguoi_giao: number;
  trach_nhiem: number | null;
  nguoi_ho_tro: number[];
  uu_tien: string;
  trang_thai: string;
  tg_tao: string;
  tg_cap_nhat: string;
  trao_doi: unknown;
  ket_qua: string | null;
  link_ket_qua: string | null;
}

function parseTraoDoi(raw: unknown): TraoDoiEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    const o = x && typeof x === 'object' ? (x as Record<string, unknown>) : {};
    return {
      id: String(o.id ?? ''),
      noi_dung: String(o.noi_dung ?? ''),
      nguoi_gui_id: String(o.nguoi_gui_id ?? ''),
      ten_nguoi_gui: o.ten_nguoi_gui != null ? String(o.ten_nguoi_gui) : undefined,
      tg_gui: String(o.tg_gui ?? ''),
    };
  });
}

function rowToCongViec(row: DbRow): CongViec {
  return {
    id: Number(row.id),
    tieu_de: row.tieu_de,
    mo_ta: row.mo_ta ?? '',
    id_cha: row.id_cha ?? null,
    id_nguoi_giao: Number(row.id_nguoi_giao),
    trach_nhiem: row.trach_nhiem ?? null,
    nguoi_ho_tro: Array.isArray(row.nguoi_ho_tro) ? row.nguoi_ho_tro.map(Number) : [],
    uu_tien: (row.uu_tien as CongViec['uu_tien']) || 'trung_binh',
    trang_thai: (row.trang_thai as CongViec['trang_thai']) || 'draft',
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    trao_doi: parseTraoDoi(row.trao_doi),
    ket_qua: row.ket_qua ?? null,
    link_ket_qua: row.link_ket_qua ?? null,
  };
}

function toNumericId(v: number | string): number {
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isNaN(n) ? 0 : n;
}

export async function getCongViecList(): Promise<CongViec[]> {
  const rows = await fetchAllRows<DbRow>((from, to) =>
    db
      .from(TABLE)
      .select(ROW_COLUMNS)
      .order('tg_tao', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to)
  );
  return rows.map(rowToCongViec);
}

export async function getCongViecById(id: number | string): Promise<CongViec | null> {
  const n = toNumericId(id);
  const { data, error } = await db.from(TABLE).select(ROW_COLUMNS).eq('id', n).single();
  if (error) {
    if ((error as { code?: string }).code === 'PGRST116') return null;
    throwDbError(error);
  }
  return data ? rowToCongViec(data as DbRow) : null;
}

export async function createCongViec(
  data: CongViecFormValues,
  id_nguoi_giao: number | string
): Promise<CongViec> {
  const nguoiGiao = toNumericId(id_nguoi_giao);
  const payload = {
    tieu_de: data.tieu_de,
    mo_ta: data.mo_ta ?? null,
    id_cha: data.id_cha ?? null,
    id_nguoi_giao: nguoiGiao,
    trach_nhiem: data.trach_nhiem ?? null,
    nguoi_ho_tro: data.nguoi_ho_tro ?? [],
    uu_tien: data.uu_tien ?? 'trung_binh',
    trang_thai: data.trang_thai ?? 'draft',
  };
  const { data: inserted, error } = await db.from(TABLE).insert(payload).select(ROW_COLUMNS).single();
  if (error) throwDbError(error);
  return rowToCongViec(inserted as DbRow);
}

export async function updateCongViec(
  id: number | string,
  data: Partial<CongViecFormValues> & {
    trao_doi?: TraoDoiEntry[];
    ket_qua?: string | null;
    link_ket_qua?: string | null;
  }
): Promise<CongViec> {
  const n = toNumericId(id);
  const payload: Record<string, unknown> = {};
  if (data.tieu_de !== undefined) payload.tieu_de = data.tieu_de;
  if (data.mo_ta !== undefined) payload.mo_ta = data.mo_ta;
  if (data.id_cha !== undefined) payload.id_cha = data.id_cha;
  if (data.trach_nhiem !== undefined) payload.trach_nhiem = data.trach_nhiem;
  if (data.nguoi_ho_tro !== undefined) payload.nguoi_ho_tro = data.nguoi_ho_tro;
  if (data.uu_tien !== undefined) payload.uu_tien = data.uu_tien;
  if (data.trang_thai !== undefined) payload.trang_thai = data.trang_thai;
  if (data.trao_doi !== undefined) payload.trao_doi = data.trao_doi;
  if (data.ket_qua !== undefined) payload.ket_qua = data.ket_qua;
  if (data.link_ket_qua !== undefined) payload.link_ket_qua = data.link_ket_qua;
  if (Object.keys(payload).length === 0) {
    const existing = await getCongViecById(n);
    if (!existing) throw new Error(i18n.t('congViec.service.notFound'));
    return existing;
  }
  const { error } = await db.from(TABLE).update(payload).eq('id', n);
  if (error) throwDbError(error);
  const updated = await getCongViecById(n);
  if (!updated) throw new Error(i18n.t('congViec.service.notFound'));
  return updated;
}

/**
 * Đổi trạng thái hoặc giao lại người phụ trách cho nhiều công việc — một lệnh UPDATE.
 * Trigger thông báo chạy FOR EACH ROW nên mỗi công việc vẫn sinh đúng một sự kiện
 * (vd. "được giao" tới người mới). Không cascade cha/con.
 */
export async function updateCongViecMany(
  ids: (number | string)[],
  patch: { trang_thai: CongViecFormValues['trang_thai'] } | { trach_nhiem: number }
): Promise<number> {
  const numIds = ids.map((x) => toNumericId(x)).filter((n) => n > 0);
  if (numIds.length === 0) return 0;
  const { data, error } = await db.from(TABLE).update(patch).in('id', numIds).select('id');
  if (error) throwDbError(error);
  return data?.length ?? 0;
}

export async function deleteCongViecList(ids: (number | string)[]): Promise<void> {
  const numIds = ids.map((x) => toNumericId(x)).filter((n) => n > 0);
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', numIds);
  if (error) throwDbError(error);
}

export async function getBinhLuanByCongViecId(id_cong_viec: number | string): Promise<TraoDoiEntry[]> {
  const cv = await getCongViecById(id_cong_viec);
  const traoDoi = cv?.trao_doi ?? [];
  return [...traoDoi].reverse();
}

/**
 * Bình luận đi qua RPC (migration 028): ai xem được công việc cũng bình luận được, kể cả
 * không có quyền sửa — RLS UPDATE của bảng đã siết theo quyền module. RPC lấy người gửi
 * từ JWT và nối nguyên tử vào trao_doi.
 */
export async function createBinhLuan(id_cong_viec: number | string, noi_dung: string): Promise<TraoDoiEntry> {
  const { data, error } = await db.rpc('rpc_cong_viec_them_binh_luan', {
    p_id_cong_viec: toNumericId(id_cong_viec),
    p_noi_dung: noi_dung,
  });
  if (error) throwDbError(error);
  return data as TraoDoiEntry;
}

/** Ghi các dòng đã validate ở `planCongViecImport`; lỗi DB gắn lại đúng dòng Excel. */
export async function importCongViecList(
  items: { row: number; values: Record<string, unknown>; data: CongViecFormValues }[],
  id_nguoi_giao: number | string
) {
  return writeEachImportRow(items, (data) => createCongViec(data, id_nguoi_giao));
}
