import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { DoiTac, LoaiDoiTac, NhomDoiTac, Tag } from '../core/types';
import { TRANG_THAI_DOI_TAC } from '../core/types';
import type { DoiTacFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const TABLE_NHOM = 'fp_mh_nhom_doi_tac';
const TABLE_TAG = 'fp_mh_tag_doi_tac';
const TABLE_DOI_TAC = 'fp_mh_danh_sach_doi_tac';

/** Row từ Supabase fp_mh_nhom_doi_tac */
interface NhomRow {
  id: number;
  ma_nhom: string;
  ten_nhom: string;
  loai: string | null;
  thu_tu: number | null;
  trang_thai: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

/** Row từ Supabase fp_mh_tag_doi_tac */
interface TagRow {
  id: number;
  ten_tag: string;
}

/** Row từ Supabase fp_mh_danh_sach_doi_tac */
interface DoiTacRow {
  id: number;
  ma_doi_tac: string;
  ten_doi_tac: string;
  loai_doi_tac: string;
  id_nhom: number | null;
  dia_chi: string | null;
  dien_thoai: string | null;
  email: string | null;
  mo_ta: string | null;
  tag_ids: number[] | null;
  trang_thai: string | null;
  thu_tu: number | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToNhom(row: NhomRow): NhomDoiTac {
  const loai = row.loai === 'nha_cung_cap' || row.loai === 'khach_hang' ? row.loai : null;
  return {
    id: String(row.id),
    ma_nhom: row.ma_nhom ?? '',
    ten_nhom: row.ten_nhom ?? '',
    loai: loai ?? undefined,
    thu_tu: row.thu_tu ?? 0,
    trang_thai: (row.trang_thai as NhomDoiTac['trang_thai']) ?? TRANG_THAI_DOI_TAC.DANG_HOAT_DONG,
    tg_tao: row.tg_tao ?? undefined,
    tg_cap_nhat: row.tg_cap_nhat ?? undefined,
  };
}

function rowToTag(row: TagRow): Tag {
  return {
    id: String(row.id),
    ten_tag: row.ten_tag ?? '',
  };
}

function rowToDoiTac(row: DoiTacRow, tenNhom?: string, tenTags?: string[]): DoiTac {
  return {
    id: String(row.id),
    ma_ncc: row.ma_doi_tac ?? '',
    ten_ncc: row.ten_doi_tac ?? '',
    loai_doi_tac: row.loai_doi_tac as LoaiDoiTac,
    id_nhom: row.id_nhom != null ? String(row.id_nhom) : null,
    ten_nhom: tenNhom,
    dia_chi: row.dia_chi ?? undefined,
    dien_thoai: row.dien_thoai ?? undefined,
    email: row.email ?? undefined,
    mo_ta: row.mo_ta ?? undefined,
    tag_ids: (row.tag_ids ?? []).map(String),
    ten_tags: tenTags,
    trang_thai: (row.trang_thai as DoiTac['trang_thai']) ?? TRANG_THAI_DOI_TAC.DANG_HOAT_DONG,
    thu_tu: row.thu_tu ?? 0,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

/** Enrich danh sách đối tác với ten_nhom, ten_tags từ nhom + tag */
function enrichDoiTacList(
  rows: DoiTacRow[],
  nhomList: NhomDoiTac[],
  tagList: Tag[]
): DoiTac[] {
  const nhomMap: Record<string, string> = {};
  nhomList.forEach((n) => { nhomMap[n.id] = n.ten_nhom; });
  const tagMap: Record<string, string> = {};
  tagList.forEach((t) => { tagMap[t.id] = t.ten_tag; });
  return rows.map((row) => {
    const tenNhom = row.id_nhom != null ? nhomMap[String(row.id_nhom)] : undefined;
    const tenTags = (row.tag_ids ?? []).map((id) => tagMap[String(id)]).filter(Boolean);
    return rowToDoiTac(row, tenNhom, tenTags);
  });
}

// ============ Nhóm đối tác ============

export const getAllNhomDoiTac = async (): Promise<NhomDoiTac[]> => {
  const data = await fetchAllRows<NhomRow>((from, to) =>
    supabase.from(TABLE_NHOM).select('*').order('thu_tu', { ascending: true }).range(from, to)
  );
  return data.map(rowToNhom);
};

export type NhomDoiTacFormValues = {
  ma_nhom: string;
  ten_nhom: string;
  /** Bắt buộc: nha_cung_cap | khach_hang */
  loai: LoaiDoiTac;
  thu_tu?: number;
  trang_thai: string;
};

export const createNhomDoiTac = async (data: NhomDoiTacFormValues): Promise<NhomDoiTac> => {
  const ma = data.ma_nhom.trim().toUpperCase();
  const { data: existing } = await supabase.from(TABLE_NHOM).select('id').eq('ma_nhom', ma).maybeSingle();
  if (existing) throw new Error(i18n.t('doiTac.service.duplicateCode'));

  const row = {
    ma_nhom: ma,
    ten_nhom: data.ten_nhom.trim(),
    loai: data.loai,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
    trang_thai: data.trang_thai || null,
  };

  const { data: inserted, error } = await supabase.from(TABLE_NHOM).insert(row).select().single();
  if (error) throw new Error(error.message);
  return rowToNhom(inserted as NhomRow);
};

export const updateNhomDoiTac = async (id: string, data: NhomDoiTacFormValues): Promise<NhomDoiTac> => {
  const ma = data.ma_nhom.trim().toUpperCase();
  const { data: other } = await supabase.from(TABLE_NHOM).select('id').eq('ma_nhom', ma).neq('id', Number(id)).maybeSingle();
  if (other) throw new Error(i18n.t('doiTac.service.duplicateCode'));

  const row = {
    ma_nhom: ma,
    ten_nhom: data.ten_nhom.trim(),
    loai: data.loai,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
    trang_thai: data.trang_thai || null,
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from(TABLE_NHOM)
    .update(row)
    .eq('id', Number(id))
    .select()
    .single();
  if (error) throw new Error(error.message ?? i18n.t('doiTac.service.nhomNotFound'));
  return rowToNhom(updated as NhomRow);
};

export const deleteNhomDoiTac = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE_NHOM).delete().eq('id', Number(id));
  if (error) throw new Error(error.message ?? i18n.t('doiTac.service.nhomNotFound'));
};

export const deleteNhomDoiTacMany = async (ids: string[]): Promise<void> => {
  const numIds = ids.map(Number);
  const { error } = await supabase.from(TABLE_NHOM).delete().in('id', numIds);
  if (error) throw new Error(error.message);
};

// ============ Tag đối tác ============

export const getAllTag = async (): Promise<Tag[]> => {
  const data = await fetchAllRows<TagRow>((from, to) =>
    supabase.from(TABLE_TAG).select('*').range(from, to)
  );
  return data.map(rowToTag);
};

export const createTag = async (ten_tag: string): Promise<Tag> => {
  const name = ten_tag.trim();
  if (!name) throw new Error(i18n.t('doiTac.validation.tagNameRequired'));
  const { data: existing } = await supabase
    .from(TABLE_TAG)
    .select('*')
    .ilike('ten_tag', name)
    .maybeSingle();
  if (existing) return rowToTag(existing as TagRow);

  const { data: inserted, error } = await supabase.from(TABLE_TAG).insert({ ten_tag: name }).select().single();
  if (error) throw new Error(error.message);
  return rowToTag(inserted as TagRow);
};

export const updateTag = async (id: string, ten_tag: string): Promise<Tag> => {
  const name = ten_tag.trim();
  if (!name) throw new Error(i18n.t('doiTac.validation.tagNameRequired'));
  const { data: updated, error } = await supabase
    .from(TABLE_TAG)
    .update({ ten_tag: name })
    .eq('id', Number(id))
    .select()
    .single();
  if (error) throw new Error(error.message ?? i18n.t('doiTac.service.tagNotFound'));
  return rowToTag(updated as TagRow);
};

export const deleteTag = async (id: string): Promise<void> => {
  const numId = Number(id);
  const { data: partners } = await supabase.from(TABLE_DOI_TAC).select('id, tag_ids').not('tag_ids', 'is', null);
  const toUpdate = (partners ?? []).filter((p: { tag_ids: number[] }) => (p.tag_ids ?? []).includes(numId));
  for (const p of toUpdate) {
    const newIds = ((p as { tag_ids: number[] }).tag_ids ?? []).filter((tid) => tid !== numId);
    await supabase.from(TABLE_DOI_TAC).update({ tag_ids: newIds }).eq('id', (p as { id: number }).id);
  }
  const { error } = await supabase.from(TABLE_TAG).delete().eq('id', numId);
  if (error) throw new Error(error.message);
};

export const deleteTagMany = async (ids: string[]): Promise<void> => {
  const numIds = ids.map(Number);
  const { data: partners } = await supabase.from(TABLE_DOI_TAC).select('id, tag_ids').not('tag_ids', 'is', null);
  const setNum = new Set(numIds);
  for (const p of partners ?? []) {
    const row = p as { id: number; tag_ids: number[] };
    const newIds = (row.tag_ids ?? []).filter((tid) => !setNum.has(tid));
    if (newIds.length !== (row.tag_ids ?? []).length) {
      await supabase.from(TABLE_DOI_TAC).update({ tag_ids: newIds }).eq('id', row.id);
    }
  }
  const { error } = await supabase.from(TABLE_TAG).delete().in('id', numIds);
  if (error) throw new Error(error.message);
};

// ============ Danh sách đối tác ============

export const getAllDoiTac = async (loai?: LoaiDoiTac): Promise<DoiTac[]> => {
  const [nhomList, tagList] = await Promise.all([getAllNhomDoiTac(), getAllTag()]);
  const list = await fetchAllRows<DoiTacRow>((from, to) => {
    let q = supabase
      .from(TABLE_DOI_TAC)
      .select('*')
      .order('thu_tu', { ascending: true })
      .order('ma_doi_tac', { ascending: true })
      .range(from, to);
    if (loai) q = q.eq('loai_doi_tac', loai);
    return q;
  });
  return enrichDoiTacList(list, nhomList, tagList);
};

export const getDoiTacById = async (id: string): Promise<DoiTac | null> => {
  const { data: row, error } = await supabase
    .from(TABLE_DOI_TAC)
    .select('*')
    .eq('id', Number(id))
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  const [nhomList, tagList] = await Promise.all([getAllNhomDoiTac(), getAllTag()]);
  const [enriched] = enrichDoiTacList([row as DoiTacRow], nhomList, tagList);
  return enriched;
};

export const createDoiTac = async (data: DoiTacFormValues): Promise<DoiTac> => {
  const code = data.ma_ncc.trim().toUpperCase();
  const { data: existing } = await supabase.from(TABLE_DOI_TAC).select('id').eq('ma_doi_tac', code).maybeSingle();
  if (existing) throw new Error(i18n.t('doiTac.service.duplicateCode'));

  const row = {
    ma_doi_tac: code,
    ten_doi_tac: data.ten_ncc.trim(),
    loai_doi_tac: data.loai_doi_tac,
    id_nhom: data.id_nhom && data.id_nhom.trim() ? Number(data.id_nhom) : null,
    dia_chi: data.dia_chi?.trim() || null,
    dien_thoai: data.dien_thoai?.trim() || null,
    email: data.email?.trim() || null,
    mo_ta: data.mo_ta?.trim() || null,
    tag_ids: Array.isArray(data.tag_ids) ? data.tag_ids.map(Number).filter((n) => !Number.isNaN(n)) : [],
    trang_thai: data.trang_thai || null,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
  };

  const { data: inserted, error } = await supabase.from(TABLE_DOI_TAC).insert(row).select().single();
  if (error) throw new Error(error.message);
  const [nhomList, tagList] = await Promise.all([getAllNhomDoiTac(), getAllTag()]);
  const [enriched] = enrichDoiTacList([inserted as DoiTacRow], nhomList, tagList);
  return enriched;
};

export const updateDoiTac = async (id: string, data: DoiTacFormValues): Promise<DoiTac> => {
  const code = data.ma_ncc.trim().toUpperCase();
  const numId = Number(id);
  const { data: other } = await supabase
    .from(TABLE_DOI_TAC)
    .select('id')
    .eq('ma_doi_tac', code)
    .neq('id', numId)
    .maybeSingle();
  if (other) throw new Error(i18n.t('doiTac.service.duplicateCode'));

  const row = {
    ma_doi_tac: code,
    ten_doi_tac: data.ten_ncc.trim(),
    loai_doi_tac: data.loai_doi_tac,
    id_nhom: data.id_nhom && data.id_nhom.trim() ? Number(data.id_nhom) : null,
    dia_chi: data.dia_chi?.trim() || null,
    dien_thoai: data.dien_thoai?.trim() || null,
    email: data.email?.trim() || null,
    mo_ta: data.mo_ta?.trim() || null,
    tag_ids: Array.isArray(data.tag_ids) ? data.tag_ids.map(Number).filter((n) => !Number.isNaN(n)) : [],
    trang_thai: data.trang_thai || null,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from(TABLE_DOI_TAC)
    .update(row)
    .eq('id', numId)
    .select()
    .single();
  if (error) throw new Error(error.message ?? i18n.t('doiTac.service.notFound'));
  const [nhomList, tagList] = await Promise.all([getAllNhomDoiTac(), getAllTag()]);
  const [enriched] = enrichDoiTacList([updated as DoiTacRow], nhomList, tagList);
  return enriched;
};

export const deleteDoiTac = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE_DOI_TAC).delete().eq('id', Number(id));
  if (error) throw new Error(error.message ?? i18n.t('doiTac.service.notFound'));
};

export const deleteDoiTacMany = async (ids: string[]): Promise<void> => {
  const numIds = ids.map(Number);
  const { error } = await supabase.from(TABLE_DOI_TAC).delete().in('id', numIds);
  if (error) throw new Error(error.message);
};
