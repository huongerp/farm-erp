/**
 * Giám sát chất lượng — DB: fp_farm_giam_sat_chat_luong (phiếu = cây hàng),
 * fp_farm_giam_sat_chat_luong_ct (thùng mẫu, trigger sinh sẵn theo so_thung_mau),
 * fp_farm_gscl_tieu_chi (danh mục tiêu chí).
 */
import { db, fetchAllRows, fetchTablePage, throwDbError, type PaginatedTableResult } from '../../../../lib/db';
import { applyPostgrestSearch, dieuKienKyTheoNgay } from '../../../../lib/postgrest-search';
import i18n from '../../../../lib/i18n';
import type {
  GiamSatChatLuong,
  KetLuanGscl,
  KetQuaThung,
  LoaiTieuChi,
  PhieuQcTomTat,
  ThungMau,
  TieuChi,
  TieuChiDanhMuc,
  TrangThaiGscl,
  XeDaXepCayHang,
} from '../core/types';
import type { GiamSatChatLuongFormValues, TieuChiFormValues } from '../core/schema';
import { ketLuanPhieu, SO_TIEU_CHI_KHONG_DAT_MAC_DINH } from '../core/ket-luan';
import { coKetLuan, trangThaiTheoSoThung } from '../core/trang-thai';
import { anhChupTieuChi, taoMaTieuChi } from '../core/tieu-chi';
import {
  GSCL_SORTABLE_DB_COLUMNS,
  GSCL_SORT_MAC_DINH,
  type GiamSatChatLuongListServerQuery,
} from './giam-sat-chat-luong-list-query';

const TABLE = 'fp_farm_giam_sat_chat_luong';
const TABLE_CT = 'fp_farm_giam_sat_chat_luong_ct';
const TABLE_TC = 'fp_farm_gscl_tieu_chi';
const TABLE_CAI_DAT = 'fp_farm_gscl_cai_dat';

const ROW_COLUMNS =
  'id,so_phieu,ngay,id_chi_nhanh,id_hang_hoa,ma_cay_hang,so_thung_cay,so_thung_mau,tieu_chi,trang_thai,ket_luan,' +
  'ghi_chu,id_nguoi_tao,tg_tao,tg_cap_nhat,tg_nop,id_nguoi_nop,chi_nhanh:fp_var_chi_nhanh(ten_chi_nhanh),' +
  'hang_hoa:fp_farm_danh_sach_hang_hoa(ma_hang_hoa,ten_hang_hoa),thung:fp_farm_giam_sat_chat_luong_ct(da_kiem)';

const CT_COLUMNS = 'id,id_phieu,stt_thung,ma_tem,ket_qua,tong_nhanh,da_kiem,tg_kiem,id_nguoi_kiem,ghi_chu,hinh_anh_urls';
const TC_COLUMNS = 'id,ma,ten,loai,don_vi,nguong_min,nguong_max,thu_tu,dang_dung';

interface DbRow {
  id: number;
  so_phieu: string | null;
  ngay: string;
  id_chi_nhanh: number;
  id_hang_hoa: number | null;
  ma_cay_hang: string | null;
  so_thung_cay: number;
  so_thung_mau: number;
  tieu_chi: unknown;
  trang_thai: TrangThaiGscl;
  ket_luan: KetLuanGscl | null;
  ghi_chu: string | null;
  id_nguoi_tao: number | null;
  tg_tao: string;
  tg_cap_nhat: string;
  tg_nop: string | null;
  id_nguoi_nop: number | null;
  chi_nhanh?: { ten_chi_nhanh: string | null } | null;
  hang_hoa?: { ma_hang_hoa: string | null; ten_hang_hoa: string | null } | null;
  thung?: { da_kiem: boolean }[] | null;
}

interface DbCtRow {
  id: number;
  id_phieu: number;
  stt_thung: number;
  ma_tem: string;
  ket_qua: KetQuaThung | null;
  tong_nhanh: number | null;
  da_kiem: boolean;
  tg_kiem: string | null;
  id_nguoi_kiem: number | null;
  ghi_chu: string | null;
  hinh_anh_urls: string[] | null;
}

interface DbTcRow {
  id: number;
  ma: string;
  ten: string;
  loai: LoaiTieuChi;
  don_vi: string | null;
  nguong_min: string | number | null;
  nguong_max: string | number | null;
  thu_tu: number;
  dang_dung: boolean;
}

const idStr = (v: number | null | undefined) => (v != null ? String(v) : null);
const soHoacNull = (v: unknown) => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function toIntId(id: string): number {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error('Invalid id');
  return n;
}

/** jsonb `tieu_chi` → mảng TieuChi (numeric trong jsonb có thể về dạng chuỗi). */
function docTieuChi(raw: unknown): TieuChi[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && typeof x.ma === 'string')
    .map((x) => ({
      ma: String(x.ma),
      ten: String(x.ten ?? x.ma),
      loai: (x.loai === 'do_luong' || x.loai === 'dat_khong' ? x.loai : 'dem_loi') as LoaiTieuChi,
      don_vi: typeof x.don_vi === 'string' ? x.don_vi : null,
      nguong_min: soHoacNull(x.nguong_min),
      nguong_max: soHoacNull(x.nguong_max),
    }));
}

function rowToModel(row: DbRow): GiamSatChatLuong {
  return {
    id: String(row.id),
    so_phieu: row.so_phieu ?? `#${row.id}`,
    ngay: row.ngay,
    id_chi_nhanh: String(row.id_chi_nhanh),
    ten_chi_nhanh: row.chi_nhanh?.ten_chi_nhanh ?? null,
    id_hang_hoa: idStr(row.id_hang_hoa),
    ma_hang_hoa: row.hang_hoa?.ma_hang_hoa ?? null,
    ten_hang_hoa: row.hang_hoa?.ten_hang_hoa ?? null,
    ma_cay_hang: row.ma_cay_hang,
    so_thung_cay: row.so_thung_cay,
    so_thung_mau: row.so_thung_mau,
    tieu_chi: docTieuChi(row.tieu_chi),
    trang_thai: row.trang_thai,
    ket_luan: row.ket_luan,
    ghi_chu: row.ghi_chu,
    id_nguoi_tao: idStr(row.id_nguoi_tao),
    ten_nguoi_tao: null,
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
    tg_nop: row.tg_nop,
    id_nguoi_nop: idStr(row.id_nguoi_nop),
    ten_nguoi_nop: null,
    so_thung_da_kiem: (row.thung ?? []).filter((t) => t.da_kiem).length,
  };
}

function ctToModel(row: DbCtRow): ThungMau {
  return {
    id: String(row.id),
    id_phieu: String(row.id_phieu),
    stt_thung: row.stt_thung,
    ma_tem: row.ma_tem,
    ket_qua: row.ket_qua ?? {},
    tong_nhanh: row.tong_nhanh,
    da_kiem: row.da_kiem,
    tg_kiem: row.tg_kiem,
    id_nguoi_kiem: idStr(row.id_nguoi_kiem),
    ten_nguoi_kiem: null,
    ghi_chu: row.ghi_chu,
    hinh_anh_urls: row.hinh_anh_urls ?? [],
  };
}

function tcToModel(row: DbTcRow): TieuChiDanhMuc {
  return {
    id: String(row.id),
    ma: row.ma,
    ten: row.ten,
    loai: row.loai,
    don_vi: row.don_vi,
    nguong_min: soHoacNull(row.nguong_min),
    nguong_max: soHoacNull(row.nguong_max),
    thu_tu: row.thu_tu,
    dang_dung: row.dang_dung,
  };
}

const blank = (v: string | null | undefined) => {
  const s = (v ?? '').trim();
  return s === '' ? null : s;
};

function formPayload(v: GiamSatChatLuongFormValues): Record<string, unknown> {
  return {
    id_chi_nhanh: toIntId(v.id_chi_nhanh),
    ngay: v.ngay,
    id_hang_hoa: toIntId(v.id_hang_hoa),
    ma_cay_hang: blank(v.ma_cay_hang),
    so_thung_cay: v.so_thung_cay,
    so_thung_mau: v.so_thung_mau,
    ghi_chu: blank(v.ghi_chu),
  };
}

/** Cột tham gia ô tìm kiếm ở server. */
const GSCL_SEARCH_SPEC = {
  text: ['so_phieu', 'ma_cay_hang', 'ghi_chu'],
  numeric: ['id', 'so_thung_cay', 'so_thung_mau'],
  dates: ['ngay'],
};

const nums = (ids: string[]) => ids.map(Number).filter(Number.isFinite);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPhamVi(q: any, viewAll: boolean, allowedBranchIds: string[]): any {
  if (viewAll) return q;
  const ids = nums(allowedBranchIds);
  return ids.length === 0 ? q.eq('id', -1) : q.in('id_chi_nhanh', ids);
}

/** Lọc + sắp xếp dùng chung cho trang danh sách. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyGsclListQuery(q: any, query: GiamSatChatLuongListServerQuery): any {
  let sel = applyPhamVi(q, query.viewAll, query.allowedBranchIds);
  if (query.idChiNhanh.length > 0) sel = sel.in('id_chi_nhanh', nums(query.idChiNhanh));
  if (query.idHangHoa.length > 0) sel = sel.in('id_hang_hoa', nums(query.idHangHoa));
  if (query.trangThai.length > 0) sel = sel.in('trang_thai', query.trangThai);
  if (query.ketLuan.length > 0) sel = sel.in('ket_luan', query.ketLuan);
  const ky = dieuKienKyTheoNgay(query.nam, query.thang, 'ngay');
  if (ky.length) sel = sel.or(ky.join(','));

  sel = applyPostgrestSearch(sel, query.searchTerm, GSCL_SEARCH_SPEC);

  const dbSortable = query.sortColumn != null && GSCL_SORTABLE_DB_COLUMNS.has(query.sortColumn);
  const sortCol = dbSortable ? query.sortColumn! : GSCL_SORT_MAC_DINH.column;
  const ascending = dbSortable ? query.sortDirection !== 'desc' : GSCL_SORT_MAC_DINH.ascending;
  sel = sel.order(sortCol, { ascending, nullsFirst: false });
  return sel.order('id', { ascending: false });
}

export async function getGsclPageDb(
  query: GiamSatChatLuongListServerQuery
): Promise<PaginatedTableResult<GiamSatChatLuong>> {
  const result = await fetchTablePage<DbRow>(query.page, query.pageSize, async (from, to) => {
    const res = await applyGsclListQuery(db.from(TABLE).select(ROW_COLUMNS, { count: 'exact' }), query).range(from, to);
    return { data: (res.data as DbRow[] | null) ?? null, error: res.error, count: res.count };
  });
  return { ...result, data: result.data.map(rowToModel) };
}

export interface GsclTomTatRow {
  id: number;
  ngay: string;
  id_chi_nhanh: number | null;
  id_hang_hoa: number | null;
  trang_thai: TrangThaiGscl;
  ket_luan: KetLuanGscl | null;
  id_nguoi_tao: number | null;
}

/** Vài cột của toàn bộ phiếu — chip lọc (đếm trên toàn bộ) + farm gần nhất của tôi. */
export async function getGsclTomTatDb(viewAll: boolean, allowedBranchIds: string[]): Promise<GsclTomTatRow[]> {
  return fetchAllRows<GsclTomTatRow>((from, to) =>
    applyPhamVi(
      db.from(TABLE).select('id,ngay,id_chi_nhanh,id_hang_hoa,trang_thai,ket_luan,id_nguoi_tao'),
      viewAll,
      allowedBranchIds
    )
      .order('ngay', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to)
  );
}

export async function getGsclByIdDb(id: string): Promise<GiamSatChatLuong | null> {
  const { data, error } = await db.from(TABLE).select(ROW_COLUMNS).eq('id', toIntId(id)).maybeSingle();
  if (error) throwDbError(error);
  return data ? rowToModel(data as unknown as DbRow) : null;
}

export async function createGsclDb(values: GiamSatChatLuongFormValues, idNguoiTao: string | null): Promise<GiamSatChatLuong> {
  // tieu_chi để trống → trigger chụp bộ tiêu chí đang dùng; so_phieu + thùng mẫu cũng do trigger sinh.
  const payload = { ...formPayload(values), id_nguoi_tao: idNguoiTao ? toIntId(idNguoiTao) : null };
  const { data, error } = await db.from(TABLE).insert(payload).select('id').single();
  if (error) throwDbError(error);
  const row = await getGsclByIdDb(String((data as { id: number }).id));
  if (!row) throw new Error(i18n.t('giamSatChatLuong.service.notFound'));
  return row;
}

export async function updateGsclDb(id: string, values: GiamSatChatLuongFormValues): Promise<GiamSatChatLuong> {
  const { error } = await db.from(TABLE).update(formPayload(values)).eq('id', toIntId(id));
  if (error) throwDbError(error);
  // Đổi số thùng mẫu làm thay đổi "đã đủ thùng chưa" → tính lại.
  return capNhatKetLuanDb(id);
}

export async function deleteGsclDb(id: string): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq('id', toIntId(id));
  if (error) throwDbError(error);
}

export async function deleteGsclManyDb(ids: string[]): Promise<void> {
  const list = nums(ids);
  if (list.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', list);
  if (error) throwDbError(error);
}

/** Huỷ có điều kiện đang kiểm — hai người bấm cùng lúc thì người sau nhận lỗi. */
export async function huyGsclDb(id: string): Promise<void> {
  const { data, error } = await db
    .from(TABLE)
    .update({ trang_thai: 'huy', ket_luan: null })
    .eq('id', toIntId(id))
    .eq('trang_thai', 'dang_kiem')
    .select('id');
  if (error) throwDbError(error);
  if (((data as unknown[] | null) ?? []).length === 0) throw new Error(i18n.t('giamSatChatLuong.service.trangThaiDaDoi'));
}

export async function khoiPhucGsclDb(id: string): Promise<GiamSatChatLuong> {
  const { data, error } = await db
    .from(TABLE)
    .update({ trang_thai: 'dang_kiem' })
    .eq('id', toIntId(id))
    .eq('trang_thai', 'huy')
    .select('id');
  if (error) throwDbError(error);
  if (((data as unknown[] | null) ?? []).length === 0) throw new Error(i18n.t('giamSatChatLuong.service.trangThaiDaDoi'));
  return capNhatKetLuanDb(id);
}

/** Nộp phiếu: chỉ từ "hoàn thành" (đủ thùng). Có điều kiện trạng thái để hai người bấm cùng lúc không ghi đè. */
export async function nopGsclDb(id: string, idNguoi: string | null): Promise<void> {
  const { data, error } = await db
    .from(TABLE)
    .update({
      trang_thai: 'da_nop',
      tg_nop: new Date().toISOString(),
      id_nguoi_nop: idNguoi ? toIntId(idNguoi) : null,
    })
    .eq('id', toIntId(id))
    .eq('trang_thai', 'hoan_thanh')
    .select('id');
  if (error) throwDbError(error);
  if (((data as unknown[] | null) ?? []).length === 0) throw new Error(i18n.t('giamSatChatLuong.service.trangThaiDaDoi'));
}

/** Mở lại phiếu đã nộp (cấp cao — DB chặn người khác) rồi tính lại trạng thái theo số thùng. */
export async function moPhieuGsclDb(id: string): Promise<GiamSatChatLuong> {
  const { data, error } = await db
    .from(TABLE)
    .update({ trang_thai: 'hoan_thanh', tg_nop: null, id_nguoi_nop: null })
    .eq('id', toIntId(id))
    .eq('trang_thai', 'da_nop')
    .select('id');
  if (error) throwDbError(error);
  if (((data as unknown[] | null) ?? []).length === 0) throw new Error(i18n.t('giamSatChatLuong.service.trangThaiDaDoi'));
  return capNhatKetLuanDb(id);
}

/** Chụp lại bộ tiêu chí đang dùng vào phiếu (cấp cao — vd vừa sửa ngưỡng) rồi tính lại kết luận. */
export async function apDungTieuChiMoiDb(id: string, boTieuChi?: TieuChi[]): Promise<GiamSatChatLuong> {
  // Ưu tiên đúng bộ người dùng vừa xem trong popup xác nhận (tránh áp bộ khác nếu cài đặt vừa đổi).
  const tieuChi = boTieuChi ?? anhChupTieuChi(await getTieuChiDb());
  const { error } = await db.from(TABLE).update({ tieu_chi: tieuChi }).eq('id', toIntId(id));
  if (error) throwDbError(error);
  return capNhatKetLuanDb(id);
}

// ── Thùng mẫu ─────────────────────────────────────────────────────────────────

export async function getThungDb(idPhieu: string): Promise<ThungMau[]> {
  const { data, error } = await db
    .from(TABLE_CT)
    .select(CT_COLUMNS)
    .eq('id_phieu', toIntId(idPhieu))
    .order('stt_thung', { ascending: true });
  if (error) throwDbError(error);
  return ((data as DbCtRow[] | null) ?? []).map(ctToModel);
}

export async function getThungTheoMaTemDb(maTem: string): Promise<ThungMau | null> {
  const { data, error } = await db.from(TABLE_CT).select(CT_COLUMNS).eq('ma_tem', maTem).maybeSingle();
  if (error) throwDbError(error);
  return data ? ctToModel(data as DbCtRow) : null;
}

/**
 * Tính lại trạng thái + kết luận từ các thùng đã kiểm và ghi vào phiếu (chỉ khi đổi).
 * Kết luận chỉ ghi khi đủ thùng mẫu; chưa đủ thì để trống (chi tiết vẫn hiện "tạm tính").
 */
export async function capNhatKetLuanDb(idPhieu: string): Promise<GiamSatChatLuong> {
  const phieu = await getGsclByIdDb(idPhieu);
  if (!phieu) throw new Error(i18n.t('giamSatChatLuong.service.notFound'));
  const thung = await getThungDb(idPhieu);
  const daKiem = thung.filter((t) => t.da_kiem);
  const trangThai = trangThaiTheoSoThung(phieu.trang_thai, daKiem.length, phieu.so_thung_mau);
  const ketLuan = coKetLuan(trangThai)
    ? ketLuanPhieu(
        phieu.tieu_chi,
        daKiem.map((t) => t.ket_qua),
        phieu.so_thung_mau,
        (await getCaiDatGsclDb()).so_tieu_chi_khong_dat
      ).ketLuan
    : null;
  if (trangThai === phieu.trang_thai && ketLuan === phieu.ket_luan) return phieu;
  const { error } = await db.from(TABLE).update({ trang_thai: trangThai, ket_luan: ketLuan }).eq('id', toIntId(idPhieu));
  if (error) throwDbError(error);
  return { ...phieu, trang_thai: trangThai, ket_luan: ketLuan };
}

export interface LuuKetQuaThungInput {
  idThung: string;
  idPhieu: string;
  ketQua: KetQuaThung;
  /** Tổng số nhánh/nải trong thùng — mẫu số tỉ lệ lỗi. */
  tongNhanh: number;
  ghiChu: string | null;
  idNguoi: string | null;
  /** Có truyền mới ghi đè ảnh thùng (luồng quét tem không đụng ảnh). */
  hinhAnhUrls?: string[];
}

/** Ghi kết quả một thùng (đánh dấu đã kiểm) rồi tính lại phiếu. */
export async function luuKetQuaThungDb(input: LuuKetQuaThungInput): Promise<GiamSatChatLuong> {
  const { error } = await db
    .from(TABLE_CT)
    .update({
      ket_qua: input.ketQua,
      tong_nhanh: input.tongNhanh,
      ghi_chu: blank(input.ghiChu),
      da_kiem: true,
      tg_kiem: new Date().toISOString(),
      id_nguoi_kiem: input.idNguoi ? toIntId(input.idNguoi) : null,
      ...(input.hinhAnhUrls ? { hinh_anh_urls: input.hinhAnhUrls } : {}),
    })
    .eq('id', toIntId(input.idThung))
    .eq('id_phieu', toIntId(input.idPhieu));
  if (error) throwDbError(error);
  return capNhatKetLuanDb(input.idPhieu);
}

/** Chỉ thay ảnh của thùng — không đổi kết quả, người kiểm, giờ kiểm hay kết luận phiếu. */
export async function capNhatAnhThungDb(idThung: string, idPhieu: string, urls: string[]): Promise<void> {
  const { data, error } = await db
    .from(TABLE_CT)
    .update({ hinh_anh_urls: urls })
    .eq('id', toIntId(idThung))
    .eq('id_phieu', toIntId(idPhieu))
    .select('id');
  if (error) throwDbError(error);
  if (((data as unknown[] | null) ?? []).length === 0) throw new Error(i18n.t('giamSatChatLuong.service.notFound'));
}

// ── Cài đặt chung (một dòng id = 1) ───────────────────────────────────────────

export interface CaiDatGscl {
  /** Cây hàng KHÔNG ĐẠT khi có từ chừng này tiêu chí không đạt trở lên. */
  so_tieu_chi_khong_dat: number;
}

/** Chưa có dòng cài đặt → dùng mặc định. */
export async function getCaiDatGsclDb(): Promise<CaiDatGscl> {
  const { data, error } = await db.from(TABLE_CAI_DAT).select('so_tieu_chi_khong_dat').eq('id', 1).maybeSingle();
  if (error) throwDbError(error);
  const n = Number((data as { so_tieu_chi_khong_dat: number } | null)?.so_tieu_chi_khong_dat);
  return { so_tieu_chi_khong_dat: Number.isInteger(n) && n >= 1 ? n : SO_TIEU_CHI_KHONG_DAT_MAC_DINH };
}

/** Chỉ cấp cao — RLS chặn người khác (migration 030). */
export async function updateCaiDatGsclDb(v: CaiDatGscl): Promise<void> {
  const { data, error } = await db
    .from(TABLE_CAI_DAT)
    .update({ so_tieu_chi_khong_dat: v.so_tieu_chi_khong_dat })
    .eq('id', 1)
    .select('id');
  if (error) throwDbError(error);
  if (((data as unknown[] | null) ?? []).length === 0) throw new Error(i18n.t('giamSatChatLuong.service.khongCoQuyenCaiDat'));
}

// ── Danh mục tiêu chí ──────────────────────────────────────────────────────────

export async function getTieuChiDb(): Promise<TieuChiDanhMuc[]> {
  const { data, error } = await db
    .from(TABLE_TC)
    .select(TC_COLUMNS)
    .order('thu_tu', { ascending: true })
    .order('id', { ascending: true });
  if (error) throwDbError(error);
  return ((data as DbTcRow[] | null) ?? []).map(tcToModel);
}

function tcPayload(v: TieuChiFormValues): Record<string, unknown> {
  return {
    ten: v.ten.trim(),
    loai: v.loai,
    don_vi: blank(v.don_vi),
    nguong_min: v.loai === 'do_luong' ? v.nguong_min : null,
    nguong_max: v.nguong_max,
  };
}

export async function createTieuChiDb(v: TieuChiFormValues, danhMuc: TieuChiDanhMuc[]): Promise<void> {
  const payload = {
    ...tcPayload(v),
    ma: taoMaTieuChi(v.ten, danhMuc.map((d) => d.ma)),
    thu_tu: danhMuc.reduce((m, d) => Math.max(m, d.thu_tu), 0) + 1,
  };
  const { error } = await db.from(TABLE_TC).insert(payload);
  if (error) throwDbError(error);
}

export async function updateTieuChiDb(id: string, v: TieuChiFormValues): Promise<void> {
  const { error } = await db.from(TABLE_TC).update(tcPayload(v)).eq('id', toIntId(id));
  if (error) throwDbError(error);
}

export async function datDangDungTieuChiDb(id: string, dangDung: boolean): Promise<void> {
  const { error } = await db.from(TABLE_TC).update({ dang_dung: dangDung }).eq('id', toIntId(id));
  if (error) throwDbError(error);
}

/** Xoá hẳn khỏi danh mục — phiếu cũ không ảnh hưởng vì đã chụp bộ tiêu chí riêng. */
export async function deleteTieuChiDb(id: string): Promise<void> {
  const { error } = await db.from(TABLE_TC).delete().eq('id', toIntId(id));
  if (error) throwDbError(error);
}

/** Ghi lại thứ tự theo mảng id (sau khi kéo / bấm lên-xuống). */
export async function sapXepTieuChiDb(ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += 1) {
    const { error } = await db.from(TABLE_TC).update({ thu_tu: i + 1 }).eq('id', toIntId(ids[i]));
    if (error) throwDbError(error);
  }
}

// ── Liên kết Đăng ký nhận hàng (xếp cây hàng lên xe) ──────────────────────────

const PHIEU_QC_COLUMNS =
  'id,so_phieu,ngay,id_chi_nhanh,trang_thai,ket_luan,so_thung_cay,ma_cay_hang,hang_hoa:fp_farm_danh_sach_hang_hoa(ten_hang_hoa)';

interface DbPhieuQcRow {
  id: number;
  so_phieu: string;
  ngay: string;
  id_chi_nhanh: number;
  trang_thai: TrangThaiGscl;
  ket_luan: KetLuanGscl | null;
  so_thung_cay: number;
  ma_cay_hang: string | null;
  hang_hoa?: { ten_hang_hoa: string | null } | null;
}

function phieuQcToModel(r: DbPhieuQcRow): PhieuQcTomTat {
  return {
    id: String(r.id),
    so_phieu: r.so_phieu,
    ngay: r.ngay,
    id_chi_nhanh: String(r.id_chi_nhanh),
    trang_thai: r.trang_thai,
    ket_luan: r.ket_luan,
    so_thung_cay: r.so_thung_cay,
    ma_cay_hang: r.ma_cay_hang,
    ten_hang_hoa: r.hang_hoa?.ten_hang_hoa ?? null,
  };
}

/** Phiếu QC (cây hàng) của một tem — null khi không có tem này. */
export async function timPhieuQcTheoMaTemDb(maTem: string): Promise<PhieuQcTomTat | null> {
  const { data, error } = await db
    .from(TABLE_CT)
    .select(`phieu:${TABLE}(${PHIEU_QC_COLUMNS})`)
    .eq('ma_tem', maTem)
    .maybeSingle();
  if (error) throwDbError(error);
  const p = (data as { phieu?: DbPhieuQcRow | null } | null)?.phieu;
  return p ? phieuQcToModel(p) : null;
}

export async function getPhieuQcTomTatDb(id: string): Promise<PhieuQcTomTat | null> {
  const { data, error } = await db.from(TABLE).select(PHIEU_QC_COLUMNS).eq('id', toIntId(id)).maybeSingle();
  if (error) throwDbError(error);
  return data ? phieuQcToModel(data as unknown as DbPhieuQcRow) : null;
}

/** Phiếu QC (trừ phiếu huỷ) của một farm trong `soNgay` ngày gần đây — danh sách chọn tay khi tem hỏng. */
export async function dsPhieuQcXepXeDb(idChiNhanh: string, soNgay = 60): Promise<PhieuQcTomTat[]> {
  const tu = new Date(Date.now() - soNgay * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await db
    .from(TABLE)
    .select(PHIEU_QC_COLUMNS)
    .eq('id_chi_nhanh', toIntId(idChiNhanh))
    .neq('trang_thai', 'huy')
    .gte('ngay', tu)
    .order('ngay', { ascending: false })
    .order('stt_trong_ngay', { ascending: false })
    .limit(500);
  if (error) throwDbError(error);
  return ((data as unknown as DbPhieuQcRow[] | null) ?? []).map(phieuQcToModel);
}

/** Các xe (phiếu Đăng ký nhận hàng) đã xếp những cây hàng này — map id phiếu QC → danh sách xe. */
export async function getXeDaXepCayHangDb(idPhieuGscl: string[]): Promise<Map<string, XeDaXepCayHang[]>> {
  const ids = nums(idPhieuGscl);
  const out = new Map<string, XeDaXepCayHang[]>();
  if (ids.length === 0) return out;
  const { data, error } = await db
    .from('fp_farm_dang_ky_nhan_hang_ct')
    .select('id_phieu,id_phieu_gscl,xe:fp_farm_dang_ky_nhan_hang(so_xe,so_cont,ngay_dang_ky)')
    .in('id_phieu_gscl', ids);
  if (error) throwDbError(error);
  type Row = {
    id_phieu: number;
    id_phieu_gscl: number;
    xe?: { so_xe: string | null; so_cont: string | null; ngay_dang_ky: string } | null;
  };
  for (const r of (data as unknown as Row[] | null) ?? []) {
    const k = String(r.id_phieu_gscl);
    const list = out.get(k) ?? [];
    list.push({
      id_phieu_xe: String(r.id_phieu),
      so_xe: r.xe?.so_xe ?? null,
      so_cont: r.xe?.so_cont ?? null,
      ngay_dang_ky: r.xe?.ngay_dang_ky ?? '',
    });
    out.set(k, list);
  }
  return out;
}
