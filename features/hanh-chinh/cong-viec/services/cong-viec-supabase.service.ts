/**
 * Service công việc – đọc/ghi Supabase (fp_hc_cong_viec).
 */
import { supabase, fetchAllRows, throwSupabaseError } from '../../../../lib/supabase';
import type { CongViec, TraoDoiEntry } from '../core/types';
import type { CongViecFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

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
    supabase
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
  const { data, error } = await supabase.from(TABLE).select(ROW_COLUMNS).eq('id', n).single();
  if (error) {
    if ((error as { code?: string }).code === 'PGRST116') return null;
    throwSupabaseError(error);
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
  const { data: inserted, error } = await supabase.from(TABLE).insert(payload).select(ROW_COLUMNS).single();
  if (error) throwSupabaseError(error);
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
  const { error } = await supabase.from(TABLE).update(payload).eq('id', n);
  if (error) throwSupabaseError(error);
  const updated = await getCongViecById(n);
  if (!updated) throw new Error(i18n.t('congViec.service.notFound'));
  return updated;
}

export async function deleteCongViecList(ids: (number | string)[]): Promise<void> {
  const numIds = ids.map((x) => toNumericId(x)).filter((n) => n > 0);
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}

export async function getBinhLuanByCongViecId(id_cong_viec: number | string): Promise<TraoDoiEntry[]> {
  const cv = await getCongViecById(id_cong_viec);
  const traoDoi = cv?.trao_doi ?? [];
  return [...traoDoi].reverse();
}

export async function createBinhLuan(
  id_cong_viec: number | string,
  noi_dung: string,
  nguoi_gui_id: string,
  ten_nguoi_gui?: string
): Promise<TraoDoiEntry> {
  const cv = await getCongViecById(id_cong_viec);
  if (!cv) throw new Error(i18n.t('congViec.service.notFound'));
  const now = new Date().toISOString();
  const newEntry: TraoDoiEntry = {
    id: `bl-${Date.now()}`,
    noi_dung,
    nguoi_gui_id,
    ten_nguoi_gui: ten_nguoi_gui ?? undefined,
    tg_gui: now,
  };
  const traoDoi = [...(cv.trao_doi ?? []), newEntry];
  await updateCongViec(id_cong_viec, { trao_doi: traoDoi });
  return newEntry;
}

export async function importCongViecList(
  rows: Array<{
    tieu_de: string;
    mo_ta?: string;
    uu_tien?: string;
    trang_thai?: string;
    trach_nhiem?: string;
    nguoi_ho_tro?: string;
  }>,
  id_nguoi_giao: number | string
): Promise<{ created: number; errors: string[] }> {
  const nguoiGiao = toNumericId(id_nguoi_giao);
  const errors: string[] = [];
  let created = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      const ten = String(row.tieu_de ?? '').trim();
      if (!ten) {
        errors.push(`Dòng ${i + 2}: Thiếu tiêu đề công việc`);
        continue;
      }
      const uuTien = (['cao', 'trung_binh', 'thap'].includes(row.uu_tien ?? '') ? row.uu_tien : 'trung_binh') as CongViec['uu_tien'];
      const trangThai = (['draft', 'dang_thuc_hien', 'cho_bao_cao', 'hoan_thanh', 'huy'].includes(row.trang_thai ?? '') ? row.trang_thai : 'draft') as CongViec['trang_thai'];
      const trachNhiem = row.trach_nhiem != null ? Number(String(row.trach_nhiem).trim()) : null;
      const nguoiHoTroStr = row.nguoi_ho_tro != null ? String(row.nguoi_ho_tro).trim() : '';
      const nguoiHoTro = nguoiHoTroStr ? nguoiHoTroStr.split(/[,;]/).map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n)) : [];
      const data: CongViecFormValues = {
        tieu_de: ten,
        mo_ta: row.mo_ta != null ? String(row.mo_ta).trim() : undefined,
        id_cha: null,
        trach_nhiem: trachNhiem ?? null,
        nguoi_ho_tro: nguoiHoTro,
        uu_tien: uuTien,
        trang_thai: trangThai,
      };
      await createCongViec(data, nguoiGiao);
      created++;
    } catch (e: unknown) {
      errors.push(`Dòng ${i + 2}: ${(e as Error).message || 'Lỗi'}`);
    }
  }
  return { created, errors };
}
