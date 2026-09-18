import { db, fetchAllRows, fetchTablePage, type PaginatedTableResult } from '../../../../lib/db';
import { applyPostgrestSearch } from '../../../../lib/postgrest-search';
import {
  HANG_HOA_SORTABLE_DB_COLUMNS,
  HANG_HOA_SORT_MAC_DINH,
  type HangHoaListServerQuery,
} from './hang-hoa-list-query';
import { getCachedRef, REF_CACHE_KEYS } from '../../../../lib/ref-cache';
import type { HangHoa } from '../core/types';
import type { HangHoaFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import {
  getAllDanhMucHangHoa,
  getDanhMucHangHoaRefRows,
} from '../../danh-muc-hang-hoa/services/danh-muc-hang-hoa-service';
import { bulkInsert, bulkUpdateById, bulkUpsert } from '../../../../lib/import-bulk';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import type { ImportErrorRow, ImportMode } from '../../../../lib/import-types';
import { matchKey, normalizeText, parseImportNumber } from '../../../../lib/import-common';

const TABLE = 'fp_mh_danh_sach_hang_hoa';

/** Danh sách — có mo_ta, hinh_anh (URL Cloudinary ngắn) cho cột ảnh trên list. */
const HANG_HOA_LIST_COLUMNS =
  'id,danh_muc_id,danh_muc_cha_id,ma_hang_hoa,ten_hang_hoa,dvt,pham_cap,thu_tu,trang_thai,don_gia,mo_ta,hinh_anh,tg_tao,tg_cap_nhat';

/** Chi tiết form/preview — đủ mo_ta, hinh_anh. */
const HANG_HOA_DETAIL_COLUMNS =
  'id,danh_muc_id,danh_muc_cha_id,ma_hang_hoa,ten_hang_hoa,dvt,pham_cap,thu_tu,trang_thai,don_gia,mo_ta,hinh_anh,tg_tao,tg_cap_nhat';

/** Row từ Supabase fp_mh_danh_sach_hang_hoa */
interface HangHoaRow {
  id: number;
  danh_muc_id: number | null;
  danh_muc_cha_id: number | null;
  ma_hang_hoa: string | null;
  ten_hang_hoa: string | null;
  dvt: string | null;
  pham_cap: string | null;
  thu_tu: number | null;
  trang_thai: string | null;
  don_gia: string | number | null;
  mo_ta: string | null;
  hinh_anh: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

/** Chuẩn hóa trang_thai từ DB: chỉ "Ngừng hoạt động" coi là ngừng, còn lại coi là Đang hoạt động (tránh lỗi không chọn được hàng khi DB null/khác chuỗi). */
function normalizeTrangThaiHangHoa(raw: string | null): HangHoa['trang_thai'] {
  const s = raw?.trim();
  return s === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

function rowToHangHoa(row: HangHoaRow, danhMuc?: { ten_danh_muc?: string; ten_danh_muc_cap1?: string; ten_danh_muc_cap2?: string }): HangHoa {
  const donGia = row.don_gia != null ? Number(row.don_gia) : null;
  const ma = row.ma_hang_hoa ?? '';
  const ten = row.ten_hang_hoa ?? '';
  const unit = row.dvt ?? null;
  return {
    id: String(row.id),
    danh_muc_id: row.danh_muc_id != null ? String(row.danh_muc_id) : null,
    danh_muc_cha_id: row.danh_muc_cha_id != null ? String(row.danh_muc_cha_id) : null,
    ma_hang_hoa: ma,
    ten_hang_hoa: ten,
    dvt: unit,
    thu_tu: row.thu_tu != null ? Math.max(1, row.thu_tu) : 1,
    trang_thai: normalizeTrangThaiHangHoa(row.trang_thai),
    don_gia: Number.isNaN(donGia) ? null : donGia,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    ten_danh_muc: danhMuc?.ten_danh_muc,
    ten_danh_muc_cap1: danhMuc?.ten_danh_muc_cap1,
    ten_danh_muc_cap2: danhMuc?.ten_danh_muc_cap2,
    ma_hang: ma,
    ten_hang: ten,
    don_vi_tinh: unit,
    pham_cap: row.pham_cap ?? null,
    mo_ta: row.mo_ta ?? null,
    hinh_anh: row.hinh_anh ?? null,
  };
}

function buildDanhMucNames(
  danhMucList: { id: string; ten_danh_muc: string; id_cha: string | null }[],
  danh_muc_id: string | null,
  danh_muc_cha_id: string | null
): { ten_danh_muc?: string; ten_danh_muc_cap1?: string; ten_danh_muc_cap2?: string } {
  if (!danh_muc_id) return {};
  const cap2 = danhMucList.find((d) => d.id === danh_muc_id);
  if (!cap2) return {};
  const cap1 = danh_muc_cha_id ? danhMucList.find((d) => d.id === danh_muc_cha_id) : null;
  return {
    ten_danh_muc: cap1 ? `${cap1.ten_danh_muc} / ${cap2.ten_danh_muc}` : cap2.ten_danh_muc,
    ten_danh_muc_cap1: cap1?.ten_danh_muc,
    ten_danh_muc_cap2: cap2.ten_danh_muc,
  };
}

async function enrichWithTenDanhMuc(rows: HangHoaRow[]): Promise<HangHoa[]> {
  let dmList: Awaited<ReturnType<typeof getAllDanhMucHangHoa>> = [];
  try {
    dmList = await getAllDanhMucHangHoa();
  } catch (e) {
    console.warn('[hang-hoa-service] Không tải được danh mục hàng hóa – bỏ qua enrich:', e);
  }
  return rows.map((row) => {
    const danh_muc_id = row.danh_muc_id != null ? String(row.danh_muc_id) : null;
    const danh_muc_cha_id = row.danh_muc_cha_id != null ? String(row.danh_muc_cha_id) : null;
    const danhMuc = buildDanhMucNames(dmList, danh_muc_id, danh_muc_cha_id);
    return rowToHangHoa(row, danhMuc);
  });
}

/** Cột tham gia ô tìm kiếm ở server. */
const HANG_HOA_SEARCH_SPEC = {
  text: ['ma_hang_hoa', 'ten_hang_hoa', 'dvt', 'pham_cap', 'mo_ta', 'trang_thai'],
  numeric: ['id', 'don_gia'],
} as const;

/** Lọc + sắp xếp dùng chung cho trang danh sách và cho lượt tải phục vụ xuất file. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyHangHoaListQuery(q: any, query: HangHoaListServerQuery): any {
  let sel = q;

  if (query.status.length === 1) {
    sel = sel.eq('trang_thai', query.status[0] === 'Active' ? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG : TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG);
  }
  if (query.idDanhMucCha.length > 0) {
    sel = sel.in('danh_muc_cha_id', query.idDanhMucCha.map(Number).filter(Number.isFinite));
  }
  if (query.idDanhMuc.length > 0) {
    sel = sel.in('danh_muc_id', query.idDanhMuc.map(Number).filter(Number.isFinite));
  }
  if (query.dvt.length > 0) sel = sel.in('dvt', query.dvt);

  sel = applyPostgrestSearch(sel, query.searchTerm, HANG_HOA_SEARCH_SPEC);

  const dbSortable = query.sortColumn != null && HANG_HOA_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : HANG_HOA_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : HANG_HOA_SORT_MAC_DINH.ascending;

  sel = sel.order(sortCol, { ascending });
  if (sortCol === 'thu_tu') sel = sel.order('ma_hang_hoa', { ascending: true });
  return sel.order('id', { ascending: false });
}

export async function getHangHoaPage(
  query: HangHoaListServerQuery
): Promise<PaginatedTableResult<HangHoa>> {
  const result = await fetchTablePage<HangHoaRow>(query.page, query.pageSize, async (from, to) => {
    const res = await applyHangHoaListQuery(
      db.from(TABLE).select(HANG_HOA_LIST_COLUMNS, { count: 'exact' }),
      query
    ).range(from, to);
    return { data: (res.data as unknown as HangHoaRow[] | null) ?? null, error: res.error, count: res.count };
  });
  return { ...result, data: await enrichWithTenDanhMuc(result.data) };
}

/** Toàn bộ bản ghi khớp bộ lọc — chỉ gọi khi mở hộp thoại Xuất file. */
export async function fetchAllHangHoaForListQuery(
  query: HangHoaListServerQuery
): Promise<HangHoa[]> {
  const rows = await fetchAllRows<HangHoaRow>((from, to) =>
    applyHangHoaListQuery(db.from(TABLE).select(HANG_HOA_LIST_COLUMNS), query).range(from, to)
  );
  return enrichWithTenDanhMuc(rows);
}

/**
 * Tóm tắt toàn bộ hàng hoá (4 cột) — đủ cho số thứ tự kế tiếp khi thêm mới và
 * gợi ý đơn vị tính / phẩm cấp, mà không phải tải cả danh mục như trước.
 */
export interface HangHoaTomTat {
  id: string;
  thu_tu: number;
  dvt: string | null;
  pham_cap: string | null;
  danh_muc_id: string | null;
  danh_muc_cha_id: string | null;
  trang_thai: string | null;
}

export async function getHangHoaTomTat(): Promise<HangHoaTomTat[]> {
  const rows = await fetchAllRows<{
    id: number;
    thu_tu: number | null;
    dvt: string | null;
    pham_cap: string | null;
    danh_muc_id: number | null;
    danh_muc_cha_id: number | null;
    trang_thai: string | null;
  }>((from, to) =>
    db
      .from(TABLE)
      .select('id,thu_tu,dvt,pham_cap,danh_muc_id,danh_muc_cha_id,trang_thai')
      .order('thu_tu', { ascending: true })
      .range(from, to)
  );
  return rows.map((r) => ({
    id: String(r.id),
    thu_tu: r.thu_tu ?? 0,
    dvt: r.dvt,
    pham_cap: r.pham_cap,
    danh_muc_id: r.danh_muc_id != null ? String(r.danh_muc_id) : null,
    danh_muc_cha_id: r.danh_muc_cha_id != null ? String(r.danh_muc_cha_id) : null,
    trang_thai: r.trang_thai,
  }));
}

export const getAllHangHoa = async (): Promise<HangHoa[]> => {
  const rows = await fetchAllRows<HangHoaRow>((from, to) =>
    db
      .from(TABLE)
      .select(HANG_HOA_LIST_COLUMNS)
      .order('thu_tu', { ascending: true })
      .order('ma_hang_hoa', { ascending: true })
      .range(from, to)
  );
  return enrichWithTenDanhMuc(rows);
};

/** Danh sách hàng hóa tối thiểu (không gọi danh mục enrich) — dùng map ma/ten/dvt trong phiếu kho, PO, kiểm kê. */
export type HangHoaRefLite = {
  id: string;
  ma_hang: string;
  ma_hang_hoa: string;
  ten_hang: string;
  ten_hang_hoa: string;
  don_vi_tinh: string | undefined;
  dvt: string | null;
  danh_muc_id: string | null;
  danh_muc_cha_id: string | null;
  ten_danh_muc?: string;
  ten_danh_muc_cap1?: string;
  ten_danh_muc_cap2?: string;
  /** Đơn giá mặc định (phiếu kho / đơn đặt hàng). */
  don_gia: number | null;
  /** Phẩm cấp mặc định từ danh mục hàng hóa. */
  pham_cap?: string | null;
  /** Chuẩn hóa giống HangHoa — dùng lọc tạo danh sách kiểm kê kho. */
  trang_thai: HangHoa['trang_thai'];
};

export const getHangHoaRef = async (): Promise<HangHoaRefLite[]> => {
  return getCachedRef(REF_CACHE_KEYS.hangHoa, async () => {
    const [rows, dmList] = await Promise.all([
      fetchAllRows<HangHoaRow>((from, to) =>
        db
          .from(TABLE)
          .select('id, ma_hang_hoa, ten_hang_hoa, dvt, pham_cap, danh_muc_id, danh_muc_cha_id, thu_tu, trang_thai, don_gia')
          .order('thu_tu', { ascending: true })
          .order('ma_hang_hoa', { ascending: true })
          .range(from, to)
      ),
      getDanhMucHangHoaRefRows().catch((e) => {
        console.warn('[hang-hoa-service] getHangHoaRef: không tải được danh mục hàng hóa – cột Danh mục có thể trống:', e);
        return [] as Awaited<ReturnType<typeof getDanhMucHangHoaRefRows>>;
      }),
    ]);
    return rows.map((row) => {
      const ma = row.ma_hang_hoa ?? '';
      const ten = row.ten_hang_hoa ?? '';
      const unit = row.dvt ?? undefined;
      const donGiaRaw = row.don_gia;
      const donGia =
        donGiaRaw != null && donGiaRaw !== ''
          ? Number(donGiaRaw)
          : null;
      const danh_muc_id = row.danh_muc_id != null ? String(row.danh_muc_id) : null;
      const danh_muc_cha_id = row.danh_muc_cha_id != null ? String(row.danh_muc_cha_id) : null;
      const danhMuc = dmList.length ? buildDanhMucNames(dmList, danh_muc_id, danh_muc_cha_id) : {};
      return {
        id: String(row.id),
        ma_hang: ma,
        ma_hang_hoa: ma,
        ten_hang: ten,
        ten_hang_hoa: ten,
        don_vi_tinh: unit,
        dvt: row.dvt ?? null,
        danh_muc_id,
        danh_muc_cha_id,
        ten_danh_muc: danhMuc.ten_danh_muc,
        ten_danh_muc_cap1: danhMuc.ten_danh_muc_cap1,
        ten_danh_muc_cap2: danhMuc.ten_danh_muc_cap2,
        don_gia: Number.isFinite(donGia) ? donGia : null,
        pham_cap: row.pham_cap ?? null,
        trang_thai: normalizeTrangThaiHangHoa(row.trang_thai),
      };
    });
  });
};

export const getHangHoaById = async (id: string): Promise<HangHoa | null> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await db
    .from(TABLE)
    .select(HANG_HOA_DETAIL_COLUMNS)
    .eq('id', idNum)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  const [enriched] = await enrichWithTenDanhMuc([row as HangHoaRow]);
  return enriched;
};

/** Chi tiết đủ mo_ta, hinh_anh — form/preview; danh sách getAllHangHoa có mo_ta, không hinh_anh. */
export const getHangHoaDetail = getHangHoaById;

/** Thứ tự mới khi tạo: max(thu_tu) + 1, tối thiểu 1. */
export const getNextThuTu = async (): Promise<number> => {
  const { data, error } = await db.from(TABLE).select('thu_tu').order('thu_tu', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  const max = data?.thu_tu != null ? Number(data.thu_tu) : 0;
  return Math.max(1, max + 1);
};

export const createHangHoa = async (data: HangHoaFormValues): Promise<HangHoa> => {
  const dmList = await getAllDanhMucHangHoa();
  const cap2 = data.id_danh_muc_cap2 && data.id_danh_muc_cap2.trim() ? dmList.find((d) => d.id === data.id_danh_muc_cap2) : null;
  const danh_muc_id = cap2 ? Number(cap2.id) : null;
  const danh_muc_cha_id = cap2?.id_cha ? Number(cap2.id_cha) : null;

  const { data: existing } = await db
    .from(TABLE)
    .select('id')
    .eq('ma_hang_hoa', data.ma_hang_hoa.trim().toUpperCase())
    .limit(1);
  if (existing && existing.length > 0) throw new Error(i18n.t('hangHoa.service.duplicateCode'));

  const nextThuTu = await getNextThuTu();
  const payload = {
    danh_muc_id,
    danh_muc_cha_id,
    ma_hang_hoa: data.ma_hang_hoa.trim().toUpperCase(),
    ten_hang_hoa: data.ten_hang_hoa.trim(),
    dvt: data.dvt?.trim() || null,
    thu_tu: data.thu_tu != null ? Math.max(1, data.thu_tu) : nextThuTu,
    trang_thai: data.trang_thai,
    don_gia: data.don_gia != null && !Number.isNaN(Number(data.don_gia)) ? Number(data.don_gia) : null,
    pham_cap: data.pham_cap?.trim() || null,
    mo_ta: data.mo_ta?.trim() || null,
    hinh_anh: data.hinh_anh?.trim() || null,
  };

  const { data: inserted, error } = await db.from(TABLE).insert(payload).select(HANG_HOA_DETAIL_COLUMNS).single();
  if (error) throw new Error(error.message);
  const [enriched] = await enrichWithTenDanhMuc([inserted as HangHoaRow]);
  return enriched;
};

export const updateHangHoa = async (id: string, data: HangHoaFormValues): Promise<HangHoa> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('hangHoa.service.notFound'));

  const dmList = await getAllDanhMucHangHoa();
  const cap2 = data.id_danh_muc_cap2 && data.id_danh_muc_cap2.trim() ? dmList.find((d) => d.id === data.id_danh_muc_cap2) : null;
  const danh_muc_id = cap2 ? Number(cap2.id) : null;
  const danh_muc_cha_id = cap2?.id_cha ? Number(cap2.id_cha) : null;

  const { data: duplicate } = await db
    .from(TABLE)
    .select('id')
    .eq('ma_hang_hoa', data.ma_hang_hoa.trim().toUpperCase())
    .neq('id', idNum)
    .limit(1);
  if (duplicate && duplicate.length > 0) throw new Error(i18n.t('hangHoa.service.duplicateCode'));

  const payload = {
    danh_muc_id,
    danh_muc_cha_id,
    ma_hang_hoa: data.ma_hang_hoa.trim().toUpperCase(),
    ten_hang_hoa: data.ten_hang_hoa.trim(),
    dvt: data.dvt?.trim() || null,
    thu_tu: Math.max(1, data.thu_tu ?? 1),
    trang_thai: data.trang_thai,
    don_gia: data.don_gia != null && !Number.isNaN(Number(data.don_gia)) ? Number(data.don_gia) : null,
    pham_cap: data.pham_cap?.trim() || null,
    mo_ta: data.mo_ta?.trim() || null,
    hinh_anh: data.hinh_anh?.trim() || null,
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: updated, error } = await db
    .from(TABLE)
    .update(payload)
    .eq('id', idNum)
    .select(HANG_HOA_DETAIL_COLUMNS)
    .single();
  if (error) throw new Error(error.message ?? i18n.t('hangHoa.service.notFound'));
  const [enriched] = await enrichWithTenDanhMuc([updated as HangHoaRow]);
  return enriched;
};

export const updateHangHoaStatus = async (id: string, status: HangHoa['trang_thai']): Promise<HangHoa> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('hangHoa.service.notFound'));
  const { data: updated, error } = await db
    .from(TABLE)
    .update({ trang_thai: status, tg_cap_nhat: new Date().toISOString() })
    .eq('id', idNum)
    .select(HANG_HOA_DETAIL_COLUMNS)
    .single();
  if (error) throw new Error(error.message ?? i18n.t('hangHoa.service.notFound'));
  const [enriched] = await enrichWithTenDanhMuc([updated as HangHoaRow]);
  return enriched;
};

export const deleteHangHoa = async (id: string): Promise<void> => {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('hangHoa.service.notFound'));
  const { error } = await db.from(TABLE).delete().eq('id', idNum);
  if (error) throw new Error(error.message ?? i18n.t('hangHoa.service.notFound'));
};

export const deleteHangHoaMany = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const idNums = ids.map(Number).filter((n) => !Number.isNaN(n));
  if (idNums.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', idNums);
  if (error) throw new Error(error.message ?? i18n.t('hangHoa.service.notFound'));
};

export type { ImportMode };

export interface ImportHangHoaResult {
  created: number;
  updated: number;
  errors: ImportErrorRow[];
}

/**
 * Resolve danh mục cấp 2 từ giá trị người dùng nhập (mã hoặc tên).
 * Thử match: ma_danh_muc (exact uppercase) → ten_danh_muc (case-insensitive).
 */
function resolveDanhMucCap2(
  input: string,
  dmByMa: Map<string, { id: string; id_cha: string | null }>,
  dmByTen: Map<string, { id: string; id_cha: string | null }>,
): { danh_muc_id: number; danh_muc_cha_id: number | null } | null {
  const s = input.trim();
  if (!s) return null;
  const byMa = dmByMa.get(s.toUpperCase());
  if (byMa) return { danh_muc_id: Number(byMa.id), danh_muc_cha_id: byMa.id_cha ? Number(byMa.id_cha) : null };
  const byTen = dmByTen.get(s.toLowerCase());
  if (byTen) return { danh_muc_id: Number(byTen.id), danh_muc_cha_id: byTen.id_cha ? Number(byTen.id_cha) : null };
  return null;
}

/** Cột dùng để nhận diện dòng đã có trong hệ thống. */
export type HangHoaRefColumn = 'ma_hang_hoa' | 'ten_hang_hoa';

interface PlannedRow {
  row: number;
  values: Record<string, unknown>;
  payload: Record<string, unknown>;
}

function excelRowOf(row: Record<string, unknown>, fallbackIdx: number): number {
  const n = Number(row[IMPORT_ROW_KEY]);
  return Number.isFinite(n) && n > 0 ? n : fallbackIdx + 2;
}

function cleanValues(row: Record<string, unknown>): Record<string, unknown> {
  const { [IMPORT_ROW_KEY]: _ignored, ...rest } = row;
  return rest;
}

/**
 * Import hàng hóa — validate toàn bộ trước rồi ghi theo lô.
 *
 * Cột `danh_muc` nhận mã HOẶC tên danh mục cấp 2 (không phân biệt hoa thường).
 * `refColumn` quyết định lấy gì làm khóa đối chiếu với dữ liệu đã có; `mode = 'upsert'`
 * thì dòng trùng khóa sẽ được ghi đè, `'create'` thì báo lỗi.
 */
export const importHangHoa = async (
  rows: Record<string, unknown>[],
  {
    mode = 'create',
    refColumn = 'ma_hang_hoa',
  }: { mode?: ImportMode; refColumn?: HangHoaRefColumn } = {},
): Promise<ImportHangHoaResult> => {
  const errors: ImportErrorRow[] = [];
  let created = 0;
  let updated = 0;

  // Đọc dữ liệu đối chiếu: danh mục + hàng hóa đã có + thu_tu lớn nhất.
  const [dmList, existingRows, maxRowRes] = await Promise.all([
    getAllDanhMucHangHoa(),
    fetchAllRows<{ id: number; ma_hang_hoa: string | null; ten_hang_hoa: string | null }>((from, to) =>
      db.from(TABLE).select('id,ma_hang_hoa,ten_hang_hoa').order('id', { ascending: true }).range(from, to)
    ),
    db.from(TABLE).select('thu_tu').order('thu_tu', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const danhMucCap2 = dmList.filter((d) => d.id_cha != null && d.id_cha.trim() !== '');
  const dmByMa = new Map(danhMucCap2.map((d) => [d.ma_danh_muc.trim().toUpperCase(), { id: d.id, id_cha: d.id_cha }]));
  const dmByTen = new Map(danhMucCap2.map((d) => [d.ten_danh_muc.trim().toLowerCase(), { id: d.id, id_cha: d.id_cha }]));

  const refIndex = new Map<string, number | null>();
  const idByMa = new Map<string, number>();
  existingRows.forEach((r) => {
    const ma = (r.ma_hang_hoa ?? '').trim().toUpperCase();
    if (ma) idByMa.set(ma, r.id);
    const key = refColumn === 'ma_hang_hoa' ? ma : matchKey(r.ten_hang_hoa);
    if (!key) return;
    refIndex.set(key, refIndex.has(key) ? null : r.id);
  });

  const maxThuTu = maxRowRes.data?.thu_tu;
  let nextThuTu = Math.max(1, (maxThuTu != null ? Number(maxThuTu) : 0) + 1);

  const toInsert: PlannedRow[] = [];
  const toUpdate: (PlannedRow & { id: string })[] = [];
  const seenKeys = new Map<string, number>();

  rows.forEach((raw, idx) => {
    const excelRow = excelRowOf(raw, idx);
    const values = cleanValues(raw);
    const rowErrors: string[] = [];

    const ma = String(raw.ma_hang_hoa ?? '').trim().toUpperCase();
    const ten = normalizeText(raw.ten_hang_hoa);
    const danhMucInput = normalizeText(raw.danh_muc);
    const dvt = normalizeText(raw.dvt) || null;

    const rawTrangThai = normalizeText(raw.trang_thai);
    const trangThai =
      rawTrangThai === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG ||
      rawTrangThai.toLowerCase() === 'ngừng hoạt động' ||
      rawTrangThai.toLowerCase() === 'ngừng' ||
      rawTrangThai === '0'
        ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
        : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;

    if (!ma) rowErrors.push(i18n.t('hangHoa.validation.codeRequired'));
    if (!ten) rowErrors.push(i18n.t('hangHoa.validation.nameRequired'));
    if (!dvt) rowErrors.push(i18n.t('hangHoa.validation.unitRequired'));

    const dm = resolveDanhMucCap2(danhMucInput, dmByMa, dmByTen);
    if (!dm) rowErrors.push(i18n.t('hangHoa.import.categoryNotFound', { value: danhMucInput || '(trống)' }));

    // Đơn giá không parse được thì báo lỗi, không âm thầm gán 0.
    const donGia = parseImportNumber(raw.don_gia);
    if (!donGia.ok) rowErrors.push(i18n.t('hangHoa.import.priceInvalid', { value: String(raw.don_gia ?? '') }));

    const refValue = refColumn === 'ma_hang_hoa' ? ma : matchKey(ten);
    if (refValue && seenKeys.has(refValue)) {
      rowErrors.push(i18n.t('hangHoa.import.duplicateInFile'));
    }

    if (rowErrors.length > 0) {
      errors.push({ row: excelRow, ma_hang_hoa: ma, ten_hang_hoa: ten, msg: rowErrors.join('; '), values });
      return;
    }
    seenKeys.set(refValue, excelRow);

    const basePayload = {
      danh_muc_id: dm!.danh_muc_id,
      danh_muc_cha_id: dm!.danh_muc_cha_id,
      ma_hang_hoa: ma,
      ten_hang_hoa: ten,
      dvt,
      trang_thai: trangThai,
      don_gia: donGia.ok ? donGia.value ?? 0 : 0,
      pham_cap: normalizeText(raw.pham_cap) || null,
      mo_ta: normalizeText(raw.mo_ta) || null,
    };

    const existingId = refIndex.get(refValue);

    if (existingId === undefined) {
      if (refColumn === 'ten_hang_hoa' && idByMa.has(ma)) {
        errors.push({ row: excelRow, ma_hang_hoa: ma, ten_hang_hoa: ten, msg: i18n.t('hangHoa.service.duplicateCode'), values });
        return;
      }
      toInsert.push({ row: excelRow, values, payload: { ...basePayload, thu_tu: nextThuTu++ } });
      return;
    }

    if (existingId === null) {
      errors.push({ row: excelRow, ma_hang_hoa: ma, ten_hang_hoa: ten, msg: i18n.t('hangHoa.import.refAmbiguous', { value: refColumn === 'ma_hang_hoa' ? ma : ten }), values });
      return;
    }

    if (mode === 'create') {
      errors.push({ row: excelRow, ma_hang_hoa: ma, ten_hang_hoa: ten, msg: i18n.t('hangHoa.service.duplicateCode'), values });
      return;
    }

    if (refColumn === 'ten_hang_hoa') {
      const clashId = idByMa.get(ma);
      if (clashId != null && clashId !== existingId) {
        errors.push({ row: excelRow, ma_hang_hoa: ma, ten_hang_hoa: ten, msg: i18n.t('hangHoa.service.duplicateCode'), values });
        return;
      }
    }

    toUpdate.push({
      row: excelRow,
      values,
      id: String(existingId),
      payload: { ...basePayload, tg_cap_nhat: new Date().toISOString() },
    });
  });

  // Đường nhanh: một request/lô cho cả thêm mới lẫn ghi đè (cần unique index trên ma_hang_hoa).
  if (mode === 'upsert' && refColumn === 'ma_hang_hoa' && toUpdate.length > 0) {
    const now = new Date().toISOString();
    const tagged = [
      ...toInsert.map((i) => ({ ...i, isUpdate: false })),
      ...toUpdate.map((i) => ({ ...i, isUpdate: true })),
    ].map((i) => ({ ...i, payload: { ...i.payload, tg_cap_nhat: now } }));

    const res = await bulkUpsert(TABLE, tagged, 'ma_hang_hoa');
    if (!res.unsupported) {
      res.done.forEach((item) => {
        if (item.isUpdate) updated++;
        else created++;
      });
      res.failed.forEach(({ item, msg }) => errors.push({ row: item.row, msg, values: item.values }));
      return { created, updated, errors: errors.sort((a, b) => a.row - b.row) };
    }
  }

  if (toInsert.length > 0) {
    const res = await bulkInsert(TABLE, toInsert);
    created = res.done.length;
    res.failed.forEach(({ item, msg }) => errors.push({ row: item.row, msg, values: item.values }));
  }

  if (toUpdate.length > 0) {
    const res = await bulkUpdateById(TABLE, toUpdate);
    updated = res.done.length;
    res.failed.forEach(({ item, msg }) => errors.push({ row: item.row, msg, values: item.values }));
  }

  return { created, updated, errors: errors.sort((a, b) => a.row - b.row) };
};

/** Lấy danh mục cấp 2 kèm tên cha (dùng cho sheet tham chiếu trong template import). */
export const getDanhMucRefForImport = async (): Promise<Array<{ ma_danh_muc: string; ten_danh_muc: string; ten_cap1: string }>> => {
  const dmList = await getAllDanhMucHangHoa();
  const byId: Record<string, string> = {};
  dmList.forEach((d) => { byId[d.id] = d.ten_danh_muc; });
  return dmList
    .filter((d) => d.id_cha != null && d.id_cha.trim() !== '')
    .map((d) => ({
      ma_danh_muc: d.ma_danh_muc,
      ten_danh_muc: d.ten_danh_muc,
      ten_cap1: (d.id_cha && byId[d.id_cha]) ?? '',
    }));
};
