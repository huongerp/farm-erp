import type { NhaCungCap, NhomDoiTac, Tag } from '../core/types';
import type { NhaCungCapFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

const seedNhom: NhomDoiTac[] = [
  { id: 'nhom-mh-1', ma_nhom: 'VT', ten_nhom: 'Vật tư', thu_tu: 0, trang_thai: 1 },
  { id: 'nhom-mh-2', ma_nhom: 'NL', ten_nhom: 'Nguyên liệu', thu_tu: 1, trang_thai: 1 },
  { id: 'nhom-mh-3', ma_nhom: 'DV', ten_nhom: 'Dịch vụ', thu_tu: 2, trang_thai: 1 },
];

const seedTag: Tag[] = [
  { id: 'tag-mh-1', ten_tag: 'Ưu tiên' },
  { id: 'tag-mh-2', ten_tag: 'Nội địa' },
  { id: 'tag-mh-3', ten_tag: 'Nhập khẩu' },
  { id: 'tag-mh-4', ten_tag: 'Chính hãng' },
  { id: 'tag-mh-5', ten_tag: 'Giá tốt' },
];

type NhaCungCapRow = Omit<NhaCungCap, 'ten_nhom' | 'ten_tags'> & { ten_nhom?: string; ten_tags?: string[] };

const seed: NhaCungCapRow[] = [
  { id: 'ncc-mh-1', ma_ncc: 'NCC-001', ten_ncc: 'Công ty Vật tư ABC', id_nhom: 'nhom-mh-1', tag_ids: ['tag-mh-1', 'tag-mh-2'], dia_chi: '123 Đường X', dien_thoai: '0281234567', email: 'abc@vt.vn', trang_thai: 1, thu_tu: 0, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'ncc-mh-2', ma_ncc: 'NCC-002', ten_ncc: 'Nguyên liệu XYZ', id_nhom: 'nhom-mh-2', tag_ids: ['tag-mh-2', 'tag-mh-5'], dien_thoai: '0287654321', trang_thai: 1, thu_tu: 1, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'ncc-mh-3', ma_ncc: 'NCC-003', ten_ncc: 'Dịch vụ Logistics 24h', id_nhom: 'nhom-mh-3', tag_ids: ['tag-mh-1'], dia_chi: '456 Đường Y', trang_thai: 1, thu_tu: 2, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'ncc-mh-4', ma_ncc: 'NCC-004', ten_ncc: 'Nhập khẩu Thiết bị', id_nhom: 'nhom-mh-1', tag_ids: ['tag-mh-3', 'tag-mh-4'], dien_thoai: '0908123456', trang_thai: 1, thu_tu: 3, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'ncc-mh-5', ma_ncc: 'NCC-005', ten_ncc: 'Vật tư văn phòng Miền Nam', id_nhom: 'nhom-mh-1', tag_ids: [], mo_ta: 'Chuyên văn phòng phẩm', trang_thai: 1, thu_tu: 4, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'ncc-mh-6', ma_ncc: 'NCC-006', ten_ncc: 'NCC ngừng hợp tác', id_nhom: null, tag_ids: [], trang_thai: 0, thu_tu: 5, tg_tao: ts(), tg_cap_nhat: ts() },
];

let dbNhom: NhomDoiTac[] = JSON.parse(JSON.stringify(seedNhom));
let dbTag: Tag[] = JSON.parse(JSON.stringify(seedTag));
let db: NhaCungCapRow[] = JSON.parse(JSON.stringify(seed));

function enrich<T extends NhaCungCapRow>(items: T[]): (T & { ten_nhom?: string; ten_tags?: string[] })[] {
  const nhomMap: Record<string, string> = {};
  dbNhom.forEach((n) => { nhomMap[n.id] = n.ten_nhom; });
  const tagMap: Record<string, string> = {};
  dbTag.forEach((t) => { tagMap[t.id] = t.ten_tag; });
  return items.map((item) => ({
    ...item,
    ten_nhom: item.id_nhom ? nhomMap[item.id_nhom] ?? undefined : undefined,
    ten_tags: (item.tag_ids || []).map((id) => tagMap[id]).filter(Boolean),
  }));
}

export const getAllNhomDoiTac = async (): Promise<NhomDoiTac[]> => {
  await delay(200);
  return [...dbNhom].sort((a, b) => (a.thu_tu ?? 0) - (b.thu_tu ?? 0) || a.ma_nhom.localeCompare(b.ma_nhom));
};

export const getAllTag = async (): Promise<Tag[]> => {
  await delay(200);
  return [...dbTag];
};

export const createTag = async (ten_tag: string): Promise<Tag> => {
  await delay(300);
  const name = ten_tag.trim();
  if (!name) throw new Error(i18n.t('nhaCungCapMuaHang.validation.tagNameRequired'));
  const existing = dbTag.find((t) => t.ten_tag.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  const id = `tag-mh-${Date.now()}`;
  const tag: Tag = { id, ten_tag: name };
  dbTag = [...dbTag, tag];
  return tag;
};

export const getAllNhaCungCap = async (): Promise<NhaCungCap[]> => {
  await delay(400);
  const sorted = [...db].sort((a, b) => a.thu_tu - b.thu_tu || a.ma_ncc.localeCompare(b.ma_ncc));
  return enrich(sorted) as NhaCungCap[];
};

export const getNhaCungCapById = async (id: string): Promise<NhaCungCap | null> => {
  await delay(200);
  const row = db.find((n) => n.id === id) ?? null;
  if (!row) return null;
  const [enriched] = enrich([row]);
  return enriched as NhaCungCap;
};

export const createNhaCungCap = async (data: NhaCungCapFormValues): Promise<NhaCungCap> => {
  await delay(500);
  const code = data.ma_ncc.trim().toUpperCase();
  const existing = db.some((n) => n.ma_ncc === code);
  if (existing) throw new Error(i18n.t('nhaCungCapMuaHang.service.duplicateCode'));

  const id = `ncc-mh-${Date.now()}`;
  const row: NhaCungCapRow = {
    id,
    ma_ncc: code,
    ten_ncc: data.ten_ncc.trim(),
    id_nhom: data.id_nhom && data.id_nhom.trim() ? data.id_nhom : null,
    dia_chi: data.dia_chi?.trim() || undefined,
    dien_thoai: data.dien_thoai?.trim() || undefined,
    email: data.email?.trim() || undefined,
    mo_ta: data.mo_ta?.trim() || undefined,
    tag_ids: Array.isArray(data.tag_ids) ? data.tag_ids : [],
    trang_thai: data.trang_thai as 0 | 1,
    thu_tu: data.thu_tu ?? 0,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  };
  db = [...db, row];
  const [enriched] = enrich([row]);
  return enriched as NhaCungCap;
};

export const updateNhaCungCap = async (id: string, data: NhaCungCapFormValues): Promise<NhaCungCap> => {
  await delay(500);
  const index = db.findIndex((n) => n.id === id);
  if (index === -1) throw new Error(i18n.t('nhaCungCapMuaHang.service.notFound'));

  const code = data.ma_ncc.trim().toUpperCase();
  const other = db.find((n) => n.id !== id && n.ma_ncc === code);
  if (other) throw new Error(i18n.t('nhaCungCapMuaHang.service.duplicateCode'));

  const row: NhaCungCapRow = {
    ...db[index],
    ma_ncc: code,
    ten_ncc: data.ten_ncc.trim(),
    id_nhom: data.id_nhom && data.id_nhom.trim() ? data.id_nhom : null,
    dia_chi: data.dia_chi?.trim() || undefined,
    dien_thoai: data.dien_thoai?.trim() || undefined,
    email: data.email?.trim() || undefined,
    mo_ta: data.mo_ta?.trim() || undefined,
    tag_ids: Array.isArray(data.tag_ids) ? data.tag_ids : [],
    trang_thai: data.trang_thai as 0 | 1,
    thu_tu: data.thu_tu ?? db[index].thu_tu,
    tg_cap_nhat: ts(),
  };
  db[index] = row;
  const [enriched] = enrich([row]);
  return enriched as NhaCungCap;
};

export const deleteNhaCungCap = async (id: string): Promise<void> => {
  await delay(400);
  const idx = db.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error(i18n.t('nhaCungCapMuaHang.service.notFound'));
  db = db.filter((n) => n.id !== id);
};

export const deleteNhaCungCapMany = async (ids: string[]): Promise<void> => {
  await delay(500);
  const set = new Set(ids);
  db = db.filter((n) => !set.has(n.id));
};
