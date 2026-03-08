import type { DoiTac, LoaiDoiTac, NhomDoiTac, Tag } from '../core/types';
import { TRANG_THAI_DOI_TAC } from '../core/types';
import type { DoiTacFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

const seedNhom: NhomDoiTac[] = [
  { id: 'nhom-1', ma_nhom: 'VT', ten_nhom: 'Vật tư', thu_tu: 0, trang_thai: 1 },
  { id: 'nhom-2', ma_nhom: 'NL', ten_nhom: 'Nguyên liệu', thu_tu: 1, trang_thai: 1 },
  { id: 'nhom-3', ma_nhom: 'DV', ten_nhom: 'Dịch vụ', thu_tu: 2, trang_thai: 1 },
];

const seedTag: Tag[] = [
  { id: 'tag-1', ten_tag: 'Ưu tiên' },
  { id: 'tag-2', ten_tag: 'Nội địa' },
  { id: 'tag-3', ten_tag: 'Nhập khẩu' },
  { id: 'tag-4', ten_tag: 'Chính hãng' },
  { id: 'tag-5', ten_tag: 'Giá tốt' },
];

type DoiTacRow = Omit<DoiTac, 'ten_nhom' | 'ten_tags'> & { ten_nhom?: string; ten_tags?: string[] };

const seedDoiTac: DoiTacRow[] = [
  { id: 'dt-1', ma_ncc: 'NCC-001', ten_ncc: 'Công ty Vật tư ABC', loai_doi_tac: 'nha_cung_cap', id_nhom: 'nhom-1', dia_chi: '123 Đường X', dien_thoai: '0281234567', email: 'abc@vt.vn', tag_ids: ['tag-1', 'tag-2'], thu_tu: 0, trang_thai: TRANG_THAI_DOI_TAC.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dt-2', ma_ncc: 'NCC-002', ten_ncc: 'Nguyên liệu XYZ', loai_doi_tac: 'nha_cung_cap', id_nhom: 'nhom-2', dien_thoai: '0287654321', tag_ids: ['tag-2', 'tag-5'], thu_tu: 1, trang_thai: TRANG_THAI_DOI_TAC.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dt-3', ma_ncc: 'NCC-003', ten_ncc: 'Dịch vụ Logistics 24h', loai_doi_tac: 'nha_cung_cap', id_nhom: 'nhom-3', dia_chi: '456 Đường Y', tag_ids: ['tag-1'], thu_tu: 2, trang_thai: TRANG_THAI_DOI_TAC.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dt-4', ma_ncc: 'NCC-004', ten_ncc: 'Nhập khẩu Thiết bị', loai_doi_tac: 'nha_cung_cap', id_nhom: 'nhom-1', dien_thoai: '0908123456', tag_ids: ['tag-3', 'tag-4'], thu_tu: 3, trang_thai: TRANG_THAI_DOI_TAC.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dt-5', ma_ncc: 'NCC-005', ten_ncc: 'Vật tư văn phòng Miền Nam', loai_doi_tac: 'nha_cung_cap', id_nhom: 'nhom-1', tag_ids: [], thu_tu: 4, trang_thai: TRANG_THAI_DOI_TAC.DANG_HOAT_DONG, mo_ta: 'Chuyên văn phòng phẩm', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dt-6', ma_ncc: 'NCC-006', ten_ncc: 'NCC ngừng hợp tác', loai_doi_tac: 'nha_cung_cap', id_nhom: null, tag_ids: [], thu_tu: 5, trang_thai: TRANG_THAI_DOI_TAC.NGUNG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dt-7', ma_ncc: 'KH-001', ten_ncc: 'Công ty Thương mại Đại Dương', loai_doi_tac: 'khach_hang', id_nhom: 'nhom-1', dia_chi: '78 Nguyễn Huệ', dien_thoai: '0289876543', email: 'contact@daiduong.vn', tag_ids: ['tag-1'], thu_tu: 0, trang_thai: TRANG_THAI_DOI_TAC.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dt-8', ma_ncc: 'KH-002', ten_ncc: 'Siêu thị Điện máy Xanh', loai_doi_tac: 'khach_hang', id_nhom: 'nhom-2', dien_thoai: '1900xxxx', tag_ids: ['tag-2', 'tag-5'], thu_tu: 1, trang_thai: TRANG_THAI_DOI_TAC.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'dt-9', ma_ncc: 'KH-003', ten_ncc: 'Cửa hàng Văn phòng phẩm Sài Gòn', loai_doi_tac: 'khach_hang', id_nhom: 'nhom-1', tag_ids: [], thu_tu: 2, trang_thai: TRANG_THAI_DOI_TAC.DANG_HOAT_DONG, tg_tao: ts(), tg_cap_nhat: ts() },
];

let dbNhom: NhomDoiTac[] = JSON.parse(JSON.stringify(seedNhom));
let dbTag: Tag[] = JSON.parse(JSON.stringify(seedTag));
let dbDoiTac: DoiTacRow[] = JSON.parse(JSON.stringify(seedDoiTac));

function enrichDoiTac<T extends DoiTacRow>(items: T[]): (T & { ten_nhom?: string; ten_tags?: string[] })[] {
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
  if (!name) throw new Error(i18n.t('doiTac.validation.tagNameRequired'));
  const existing = dbTag.find((t) => t.ten_tag.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  const id = `tag-${Date.now()}`;
  const tag: Tag = { id, ten_tag: name };
  dbTag = [...dbTag, tag];
  return tag;
};

export const getAllDoiTac = async (loai?: LoaiDoiTac): Promise<DoiTac[]> => {
  await delay(400);
  let list = [...dbDoiTac];
  if (loai) list = list.filter((d) => d.loai_doi_tac === loai);
  const sorted = list.sort((a, b) => a.thu_tu - b.thu_tu || a.ma_ncc.localeCompare(b.ma_ncc));
  return enrichDoiTac(sorted) as DoiTac[];
};

export const getDoiTacById = async (id: string): Promise<DoiTac | null> => {
  await delay(200);
  const row = dbDoiTac.find((n) => n.id === id) ?? null;
  if (!row) return null;
  const [enriched] = enrichDoiTac([row]);
  return enriched as DoiTac;
};

export const createDoiTac = async (data: DoiTacFormValues): Promise<DoiTac> => {
  await delay(500);
  const code = data.ma_ncc.trim().toUpperCase();
  const existing = dbDoiTac.some((n) => n.ma_ncc === code);
  if (existing) throw new Error(i18n.t('doiTac.service.duplicateCode'));

  const id = `dt-${Date.now()}`;
  const row: DoiTacRow = {
    id,
    ma_ncc: code,
    ten_ncc: data.ten_ncc.trim(),
    loai_doi_tac: data.loai_doi_tac,
    id_nhom: data.id_nhom && data.id_nhom.trim() ? data.id_nhom : null,
    dia_chi: data.dia_chi?.trim() || undefined,
    dien_thoai: data.dien_thoai?.trim() || undefined,
    email: data.email?.trim() || undefined,
    mo_ta: data.mo_ta?.trim() || undefined,
    tag_ids: Array.isArray(data.tag_ids) ? data.tag_ids : [],
    trang_thai: data.trang_thai,
    thu_tu: data.thu_tu ?? 0,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  };
  dbDoiTac = [...dbDoiTac, row];
  const [enriched] = enrichDoiTac([row]);
  return enriched as DoiTac;
};

export const updateDoiTac = async (id: string, data: DoiTacFormValues): Promise<DoiTac> => {
  await delay(500);
  const index = dbDoiTac.findIndex((n) => n.id === id);
  if (index === -1) throw new Error(i18n.t('doiTac.service.notFound'));

  const code = data.ma_ncc.trim().toUpperCase();
  const other = dbDoiTac.find((n) => n.id !== id && n.ma_ncc === code);
  if (other) throw new Error(i18n.t('doiTac.service.duplicateCode'));

  const row: DoiTacRow = {
    ...dbDoiTac[index],
    ma_ncc: code,
    ten_ncc: data.ten_ncc.trim(),
    loai_doi_tac: data.loai_doi_tac,
    id_nhom: data.id_nhom && data.id_nhom.trim() ? data.id_nhom : null,
    dia_chi: data.dia_chi?.trim() || undefined,
    dien_thoai: data.dien_thoai?.trim() || undefined,
    email: data.email?.trim() || undefined,
    mo_ta: data.mo_ta?.trim() || undefined,
    tag_ids: Array.isArray(data.tag_ids) ? data.tag_ids : [],
    trang_thai: data.trang_thai,
    thu_tu: data.thu_tu ?? dbDoiTac[index].thu_tu,
    tg_cap_nhat: ts(),
  };
  dbDoiTac[index] = row;
  const [enriched] = enrichDoiTac([row]);
  return enriched as DoiTac;
};

export const deleteDoiTac = async (id: string): Promise<void> => {
  await delay(400);
  const index = dbDoiTac.findIndex((n) => n.id === id);
  if (index === -1) throw new Error(i18n.t('doiTac.service.notFound'));
  dbDoiTac = dbDoiTac.filter((n) => n.id !== id);
};

export const deleteDoiTacMany = async (ids: string[]): Promise<void> => {
  await delay(500);
  dbDoiTac = dbDoiTac.filter((n) => !ids.includes(n.id));
};
