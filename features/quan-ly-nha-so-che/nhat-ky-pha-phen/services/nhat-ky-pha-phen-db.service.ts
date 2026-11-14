/**
 * Nhật ký pha phèn — DB: fp_farm_pp_nhat_ky (phiếu ngày) + fp_farm_pp_nhat_ky_lan (5 lần pha, embed cùng
 * request) + fp_farm_pp_ho (hồ của NSC, cơ sở tính định mức). Lưu không qua RPC: tạo = insert cha rồi
 * insert con (lỗi con → xoá cha vừa tạo); sửa = update cha, xoá con, insert lại.
 */
import { db, fetchAllRows, fetchTablePage, throwDbError, type PaginatedTableResult } from '../../../../lib/db';
import { applyPostgrestSearch, dieuKienKyTheoNgay } from '../../../../lib/postgrest-search';
import i18n from '../../../../lib/i18n';
import { formatYmdToDisplay } from '../../../../lib/utils';
import { tongHopLan } from '../core/dinh-muc';
import { epSo, parseSo } from '../core/so';
import type { HoFormValues, NhatKyFormValues } from '../core/schema';
import type { HoPhen, LanPha, NhatKyPhaPhen } from '../core/types';
import {
  NKPP_SORTABLE_DB_COLUMNS,
  NKPP_SORT_MAC_DINH,
  type NhatKyPhaPhenListServerQuery,
} from './nhat-ky-pha-phen-list-query';

const TABLE = 'fp_farm_pp_nhat_ky';
const TABLE_LAN = 'fp_farm_pp_nhat_ky_lan';
const TABLE_HO = 'fp_farm_pp_ho';

const MA_TRUNG = '23505';

const ROW_COLUMNS =
  'id,ngay,id_chi_nhanh,so_buong_du_thu,so_be_so_che,id_nhan_vien_phu_trach,ghi_chu,id_nguoi_tao,tg_tao,tg_cap_nhat,' +
  'cn:fp_var_chi_nhanh!id_chi_nhanh(id,ten_chi_nhanh),' +
  'nv:fp_var_nhan_vien!id_nhan_vien_phu_trach(id,ho_va_ten),' +
  `lan:${TABLE_LAN}(lan,gio,so_kg,dinh_muc_kg)`;

const HO_COLUMNS =
  'id,id_chi_nhanh,ten_ho,the_tich_xan_m3,the_tich_tia_m3,bo_sung_xan_kg,bo_sung_tia_kg,ty_le_g_lit,ty_le_dau_ca,' +
  'dang_dung,thu_tu,ghi_chu,cn:fp_var_chi_nhanh!id_chi_nhanh(id,ten_chi_nhanh)';

interface DbLan {
  lan: number;
  gio: string | null;
  so_kg: string | number | null;
  dinh_muc_kg: string | number | null;
}

interface DbRow {
  id: number;
  ngay: string;
  id_chi_nhanh: number;
  so_buong_du_thu: number | null;
  so_be_so_che: number | null;
  id_nhan_vien_phu_trach: number | null;
  ghi_chu: string | null;
  id_nguoi_tao: number | null;
  tg_tao: string;
  tg_cap_nhat: string;
  cn?: { ten_chi_nhanh: string | null } | null;
  nv?: { ho_va_ten: string | null } | null;
  lan?: DbLan[] | null;
}

interface DbHo {
  id: number;
  id_chi_nhanh: number;
  ten_ho: string;
  the_tich_xan_m3: string | number | null;
  the_tich_tia_m3: string | number | null;
  bo_sung_xan_kg: string | number | null;
  bo_sung_tia_kg: string | number | null;
  ty_le_g_lit: string | number | null;
  ty_le_dau_ca: string | number | null;
  dang_dung: boolean;
  thu_tu: number | null;
  ghi_chu: string | null;
  cn?: { ten_chi_nhanh: string | null } | null;
}

const idStr = (v: number | null | undefined) => (v != null ? String(v) : null);

function toIntId(id: string): number {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error('Invalid id');
  return n;
}

const blank = (v: string | null | undefined) => {
  const s = (v ?? '').trim();
  return s === '' ? null : s;
};

/** `07:00:00` → `07:00`. */
const gioHHmm = (g: string | null) => (g ? g.slice(0, 5) : null);

function rowToModel(row: DbRow): NhatKyPhaPhen {
  const lan: LanPha[] = [...(row.lan ?? [])]
    .map((l) => ({
      lan: Number(l.lan),
      gio: gioHHmm(l.gio),
      so_kg: epSo(l.so_kg),
      dinh_muc_kg: epSo(l.dinh_muc_kg),
    }))
    .sort((a, b) => a.lan - b.lan);
  const tong = tongHopLan(lan);
  return {
    id: String(row.id),
    ngay: row.ngay,
    id_chi_nhanh: String(row.id_chi_nhanh),
    ten_chi_nhanh: row.cn?.ten_chi_nhanh ?? null,
    so_buong_du_thu: row.so_buong_du_thu != null ? Number(row.so_buong_du_thu) : null,
    so_be_so_che: row.so_be_so_che != null ? Number(row.so_be_so_che) : null,
    id_nhan_vien_phu_trach: idStr(row.id_nhan_vien_phu_trach),
    ten_nhan_vien_phu_trach: row.nv?.ho_va_ten ?? null,
    ghi_chu: row.ghi_chu,
    id_nguoi_tao: idStr(row.id_nguoi_tao),
    ten_nguoi_tao: null,
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
    lan,
    tong_thuc_te: tong.tongThucTe,
    tong_dinh_muc: tong.tongDinhMuc,
    chenh_lech: tong.chenhLech,
  };
}

function hoToModel(r: DbHo): HoPhen {
  return {
    id: String(r.id),
    id_chi_nhanh: String(r.id_chi_nhanh),
    ten_chi_nhanh: r.cn?.ten_chi_nhanh ?? null,
    ten_ho: r.ten_ho,
    the_tich_xan_m3: epSo(r.the_tich_xan_m3),
    the_tich_tia_m3: epSo(r.the_tich_tia_m3),
    bo_sung_xan_kg: epSo(r.bo_sung_xan_kg),
    bo_sung_tia_kg: epSo(r.bo_sung_tia_kg),
    ty_le_g_lit: epSo(r.ty_le_g_lit),
    ty_le_dau_ca: epSo(r.ty_le_dau_ca),
    dang_dung: r.dang_dung,
    thu_tu: r.thu_tu ?? 0,
    ghi_chu: r.ghi_chu,
  };
}

/** Cột tham gia ô tìm kiếm ở server (ghi chú, ngày dd/mm/yyyy). */
const NKPP_SEARCH_SPEC = { text: ['ghi_chu'], dates: ['ngay'] };

/** Lọc + sắp xếp dùng chung cho trang danh sách và xuất file. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyNkppListQuery(q: any, query: NhatKyPhaPhenListServerQuery): any {
  let sel = q;
  if (!query.viewAll) {
    const ids = query.allowedBranchIds.map(Number).filter(Number.isFinite);
    sel = ids.length === 0 ? sel.eq('id', -1) : sel.in('id_chi_nhanh', ids);
  }
  if (query.idChiNhanh.length > 0) {
    sel = sel.in('id_chi_nhanh', query.idChiNhanh.map(Number).filter(Number.isFinite));
  }
  const ky = dieuKienKyTheoNgay(query.nam, query.thang, 'ngay');
  if (ky.length) sel = sel.or(ky.join(','));
  sel = applyPostgrestSearch(sel, query.searchTerm, NKPP_SEARCH_SPEC);

  const dbSortable = query.sortColumn != null && NKPP_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : NKPP_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : NKPP_SORT_MAC_DINH.ascending;
  return sel.order(sortCol, { ascending, nullsFirst: false }).order('id', { ascending: false });
}

export async function getNkppPageDb(query: NhatKyPhaPhenListServerQuery): Promise<PaginatedTableResult<NhatKyPhaPhen>> {
  const result = await fetchTablePage<DbRow>(query.page, query.pageSize, async (from, to) => {
    const res = await applyNkppListQuery(db.from(TABLE).select(ROW_COLUMNS, { count: 'exact' }), query).range(from, to);
    return { data: (res.data as DbRow[] | null) ?? null, error: res.error, count: res.count };
  });
  return { ...result, data: result.data.map(rowToModel) };
}

/** Toàn bộ nhật ký khớp bộ lọc — chỉ khi Xuất file. */
export async function fetchAllNkppForListQuery(query: NhatKyPhaPhenListServerQuery): Promise<NhatKyPhaPhen[]> {
  const rows = await fetchAllRows<DbRow>((from, to) =>
    applyNkppListQuery(db.from(TABLE).select(ROW_COLUMNS), query).range(from, to)
  );
  return rows.map(rowToModel);
}

export interface NkppTomTatRow {
  id: number;
  ngay: string;
  id_chi_nhanh: number | null;
}

/** Vài cột của toàn bộ nhật ký — chip lọc (đếm trên toàn bộ dữ liệu trong phạm vi xem). */
export async function getNkppTomTatDb(viewAll: boolean, allowedBranchIds: string[]): Promise<NkppTomTatRow[]> {
  return fetchAllRows<NkppTomTatRow>((from, to) => {
    let sel = db.from(TABLE).select('id,ngay,id_chi_nhanh');
    if (!viewAll) {
      const ids = allowedBranchIds.map(Number).filter(Number.isFinite);
      sel = ids.length === 0 ? sel.eq('id', -1) : sel.in('id_chi_nhanh', ids);
    }
    return sel.order('ngay', { ascending: false }).order('id', { ascending: false }).range(from, to);
  });
}

export async function getNkppByIdDb(id: string): Promise<NhatKyPhaPhen | null> {
  const { data, error } = await db.from(TABLE).select(ROW_COLUMNS).eq('id', toIntId(id)).maybeSingle();
  if (error) throwDbError(error);
  return data ? rowToModel(data as unknown as DbRow) : null;
}

/** Lỗi trùng UNIQUE(NSC, ngày) → thông báo tiếng Việt kèm ngày. */
function nemLoiLuu(error: { code?: string; message: string }, ngay: string): never {
  if (error.code === MA_TRUNG) {
    throw new Error(i18n.t('nkpp.service.trungNgay', { ngay: formatYmdToDisplay(ngay) }));
  }
  throwDbError(error);
}

function dongLan(idNhatKy: number, v: NhatKyFormValues) {
  return v.lan.map((l) => ({
    id_nhat_ky: idNhatKy,
    lan: l.lan,
    gio: l.gio || null,
    so_kg: parseSo(l.so_kg),
    dinh_muc_kg: l.dinh_muc_kg,
  }));
}

/** Tạo (id = null) hoặc sửa nhật ký + thay toàn bộ các lần pha. Trả id nhật ký. */
export async function luuNkppDb(id: string | null, v: NhatKyFormValues): Promise<string> {
  const cha = {
    ngay: v.ngay,
    id_chi_nhanh: toIntId(v.id_chi_nhanh),
    so_buong_du_thu: parseSo(v.so_buong_du_thu),
    so_be_so_che: parseSo(v.so_be_so_che),
    id_nhan_vien_phu_trach: v.id_nhan_vien_phu_trach ? toIntId(v.id_nhan_vien_phu_trach) : null,
    ghi_chu: blank(v.ghi_chu),
  };

  if (!id) {
    const { data, error } = await db.from(TABLE).insert(cha).select('id').single();
    if (error) nemLoiLuu(error, v.ngay);
    const idMoi = Number((data as { id: number }).id);
    const { error: errCon } = await db.from(TABLE_LAN).insert(dongLan(idMoi, v));
    if (errCon) {
      // Không để lại nhật ký cha mồ côi.
      await db.from(TABLE).delete().eq('id', idMoi);
      throwDbError(errCon);
    }
    return String(idMoi);
  }

  const idSo = toIntId(id);
  const { error } = await db.from(TABLE).update(cha).eq('id', idSo);
  if (error) nemLoiLuu(error, v.ngay);
  // Upsert theo UNIQUE(id_nhat_ky, lan) rồi mới xoá các lần đã bỏ — lỗi giữa chừng không làm mất lần pha cũ.
  const dong = dongLan(idSo, v);
  if (dong.length > 0) {
    const { error: errCon } = await db.from(TABLE_LAN).upsert(dong, { onConflict: 'id_nhat_ky,lan' });
    if (errCon) throwDbError(errCon);
  }
  let xoaDu = db.from(TABLE_LAN).delete().eq('id_nhat_ky', idSo);
  if (dong.length > 0) xoaDu = xoaDu.not('lan', 'in', `(${dong.map((d) => d.lan).join(',')})`);
  const { error: errXoa } = await xoaDu;
  if (errXoa) throwDbError(errXoa);
  return id;
}

export async function deleteNkppDb(id: string): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq('id', toIntId(id));
  if (error) throwDbError(error);
}

export async function deleteNkppManyDb(ids: string[]): Promise<void> {
  const nums = ids.map(Number).filter(Number.isFinite);
  if (nums.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', nums);
  if (error) throwDbError(error);
}

// ---------- Hồ pha phèn ----------

/** Hồ trong phạm vi xem (kể cả ngừng dùng — để cài đặt); sắp theo NSC rồi thứ tự. */
export async function getHoListDb(viewAll: boolean, allowedBranchIds: string[]): Promise<HoPhen[]> {
  const rows = await fetchAllRows<DbHo>((from, to) => {
    let sel = db.from(TABLE_HO).select(HO_COLUMNS);
    if (!viewAll) {
      const ids = allowedBranchIds.map(Number).filter(Number.isFinite);
      sel = ids.length === 0 ? sel.eq('id', -1) : sel.in('id_chi_nhanh', ids);
    }
    return sel.order('id_chi_nhanh').order('thu_tu').order('id').range(from, to);
  });
  return rows.map(hoToModel);
}

/** Hồ đang dùng của một NSC — cơ sở điền sẵn định mức trong form. */
export async function getHoDangDungTheoChiNhanhDb(idChiNhanh: string): Promise<HoPhen[]> {
  const { data, error } = await db
    .from(TABLE_HO)
    .select(HO_COLUMNS)
    .eq('id_chi_nhanh', toIntId(idChiNhanh))
    .eq('dang_dung', true)
    .order('thu_tu')
    .order('id');
  if (error) throwDbError(error);
  return ((data as unknown as DbHo[] | null) ?? []).map(hoToModel);
}

export async function luuHoDb(id: string | null, v: HoFormValues): Promise<void> {
  const payload = {
    id_chi_nhanh: toIntId(v.id_chi_nhanh),
    ten_ho: v.ten_ho.trim(),
    the_tich_xan_m3: parseSo(v.the_tich_xan_m3),
    the_tich_tia_m3: parseSo(v.the_tich_tia_m3),
    bo_sung_xan_kg: parseSo(v.bo_sung_xan_kg),
    bo_sung_tia_kg: parseSo(v.bo_sung_tia_kg),
    ty_le_g_lit: parseSo(v.ty_le_g_lit),
    ty_le_dau_ca: parseSo(v.ty_le_dau_ca),
    dang_dung: v.dang_dung,
    ghi_chu: blank(v.ghi_chu),
  };
  const baoTrung = (error: { code?: string; message: string }): never => {
    if (error.code === MA_TRUNG) throw new Error(i18n.t('nkpp.service.trungTenHo', { ten: payload.ten_ho }));
    throwDbError(error);
  };
  if (id) {
    const { error } = await db.from(TABLE_HO).update(payload).eq('id', toIntId(id));
    if (error) baoTrung(error);
    return;
  }
  const { data: cuoi, error: errThuTu } = await db
    .from(TABLE_HO)
    .select('thu_tu')
    .eq('id_chi_nhanh', payload.id_chi_nhanh)
    .order('thu_tu', { ascending: false })
    .limit(1);
  if (errThuTu) throwDbError(errThuTu);
  const thuTuMoi = ((cuoi as { thu_tu: number | null }[] | null)?.[0]?.thu_tu ?? 0) + 1;
  const { error } = await db.from(TABLE_HO).insert({ ...payload, thu_tu: thuTuMoi });
  if (error) baoTrung(error);
}

export async function doiTrangThaiHoDb(id: string, dangDung: boolean): Promise<void> {
  const { error } = await db.from(TABLE_HO).update({ dang_dung: dangDung }).eq('id', toIntId(id));
  if (error) throwDbError(error);
}
