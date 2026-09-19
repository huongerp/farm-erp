/**
 * Service sổ quỹ thu chi — PostgREST (fp_tc_quy_thu_chi).
 *
 * Danh sách đọc VIEW `v_tc_quy_thu_chi_summary` để có sẵn cột tồn quỹ lũy kế.
 * Riêng truy vấn theo chứng từ (section trong drawer Đơn đặt hàng / Đề xuất /
 * Chi phí tài sản) đọc THẲNG BẢNG GỐC: filter loai_chung_tu/id_chung_tu không
 * đẩy xuống được dưới window function, đọc view sẽ bắt Postgres tính lũy kế cả
 * sổ chỉ để lấy vài dòng.
 */
import { db, fetchAllRows, fetchTablePage, throwSupabaseError, type PaginatedTableResult } from '../../../../lib/db';
import { bulkInsert } from '../../../../lib/import-bulk';
import { postgrestQuotedIlikePattern } from '../../../../lib/postgrest-or-ilike';
import i18n from '../../../../lib/i18n';
import { buildSoPhieu } from '../core/constants';
import { TRANG_THAI_THU_CHI_QUY } from '../core/types';
import type {
  LoaiThuChi,
  QuySoDu,
  ThuChiNguon,
  ThuChiQuy,
  ThuChiQuyRow,
  TrangThaiThuChiQuy,
} from '../core/types';
import type { ThuChiQuyFormValues } from '../core/schema';
import type { ThuChiQuyListServerQuery } from './thu-chi-quy-list-query';

const TABLE = 'fp_tc_quy_thu_chi';
const VIEW_SUMMARY = 'v_tc_quy_thu_chi_summary';
const VIEW_SO_DU = 'v_tc_quy_so_du';
const RPC_NEXT_SO_PHIEU: Record<LoaiThuChi, string> = {
  thu: 'get_next_so_phieu_tc_quy_thu',
  chi: 'get_next_so_phieu_tc_quy_chi',
};
const RPC_NEXT_SO_PHIEU_BATCH = 'get_next_so_phieu_tc_quy_batch';

const BASE_COLUMNS =
  'id,so_phieu,ngay,id_chi_nhanh,ten_chi_nhanh,loai,so_tien,so_luong,don_gia,' +
  'id_hang_muc,ten_hang_muc,dien_giai,ghi_chu,loai_chung_tu,id_chung_tu,so_chung_tu,' +
  'id_nguoi_tao,ten_nguoi_tao,trang_thai,id_nguoi_yeu_cau_mo,ten_nguoi_yeu_cau_mo,' +
  'ly_do_yeu_cau_mo,tg_yeu_cau_mo,id_nguoi_xu_ly_mo,ten_nguoi_xu_ly_mo,tg_xu_ly_mo,' +
  'tg_tao,tg_cap_nhat';

/** Không select ref_tim_kiem (chuỗi dài, chỉ phục vụ ilike ở server). */
const SUMMARY_COLUMNS = `${BASE_COLUMNS},thu,chi,ton_quy,ref_ten_chi_nhanh,ref_ten_hang_muc,ref_ten_nguoi_tao`;

interface DbRow {
  id: number;
  so_phieu: string;
  ngay: string;
  id_chi_nhanh: number;
  ten_chi_nhanh: string | null;
  loai: string;
  so_tien: string | number;
  so_luong: string | number | null;
  don_gia: string | number | null;
  id_hang_muc: number | null;
  ten_hang_muc: string | null;
  dien_giai: string;
  ghi_chu: string | null;
  loai_chung_tu: string | null;
  id_chung_tu: number | null;
  so_chung_tu: string | null;
  id_nguoi_tao: number | null;
  ten_nguoi_tao: string | null;
  trang_thai: string | null;
  id_nguoi_yeu_cau_mo: number | null;
  ten_nguoi_yeu_cau_mo: string | null;
  ly_do_yeu_cau_mo: string | null;
  tg_yeu_cau_mo: string | null;
  id_nguoi_xu_ly_mo: number | null;
  ten_nguoi_xu_ly_mo: string | null;
  tg_xu_ly_mo: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface DbSummaryRow extends DbRow {
  thu: string | number;
  chi: string | number;
  ton_quy: string | number;
  ref_ten_chi_nhanh: string | null;
  ref_ten_hang_muc: string | null;
  ref_ten_nguoi_tao: string | null;
}

function num(v: string | number | null | undefined): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOrNull(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeLoai(v: string | null): LoaiThuChi {
  return v === 'thu' ? 'thu' : 'chi';
}

function normalizeNguon(v: string | null): ThuChiNguon | null {
  if (v === 'don_dat_hang' || v === 'de_xuat_mua_hang' || v === 'chi_phi_tai_san') return v;
  return null;
}

function normalizeTrangThai(v: string | null): TrangThaiThuChiQuy {
  if (v === TRANG_THAI_THU_CHI_QUY.KHOA || v === TRANG_THAI_THU_CHI_QUY.CHO_MO) return v;
  return TRANG_THAI_THU_CHI_QUY.MO;
}

function rowToItem(row: DbRow): ThuChiQuy {
  return {
    id: String(row.id),
    so_phieu: row.so_phieu ?? '',
    ngay: row.ngay ?? '',
    id_chi_nhanh: String(row.id_chi_nhanh),
    ten_chi_nhanh: row.ten_chi_nhanh ?? undefined,
    loai: normalizeLoai(row.loai),
    so_tien: num(row.so_tien),
    so_luong: numOrNull(row.so_luong),
    don_gia: numOrNull(row.don_gia),
    id_hang_muc: row.id_hang_muc != null ? String(row.id_hang_muc) : null,
    ten_hang_muc: row.ten_hang_muc ?? undefined,
    dien_giai: row.dien_giai ?? '',
    ghi_chu: row.ghi_chu ?? undefined,
    loai_chung_tu: normalizeNguon(row.loai_chung_tu),
    id_chung_tu: row.id_chung_tu != null ? String(row.id_chung_tu) : null,
    so_chung_tu: row.so_chung_tu ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: row.ten_nguoi_tao ?? undefined,
    trang_thai: normalizeTrangThai(row.trang_thai),
    id_nguoi_yeu_cau_mo: row.id_nguoi_yeu_cau_mo != null ? String(row.id_nguoi_yeu_cau_mo) : null,
    ten_nguoi_yeu_cau_mo: row.ten_nguoi_yeu_cau_mo ?? null,
    ly_do_yeu_cau_mo: row.ly_do_yeu_cau_mo ?? null,
    tg_yeu_cau_mo: row.tg_yeu_cau_mo ?? null,
    id_nguoi_xu_ly_mo: row.id_nguoi_xu_ly_mo != null ? String(row.id_nguoi_xu_ly_mo) : null,
    ten_nguoi_xu_ly_mo: row.ten_nguoi_xu_ly_mo ?? null,
    tg_xu_ly_mo: row.tg_xu_ly_mo ?? null,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function summaryRowToItem(row: DbSummaryRow): ThuChiQuyRow {
  return {
    ...rowToItem(row),
    thu: num(row.thu),
    chi: num(row.chi),
    ton_quy: num(row.ton_quy),
    ref_ten_chi_nhanh: row.ref_ten_chi_nhanh ?? undefined,
    ref_ten_hang_muc: row.ref_ten_hang_muc ?? undefined,
    ref_ten_nguoi_tao: row.ref_ten_nguoi_tao ?? undefined,
  };
}

interface PayloadExtra {
  tenChiNhanh?: string | null;
  tenHangMuc?: string | null;
  idNguoiTao?: string | null;
  tenNguoiTao?: string | null;
}

function toPayload(data: ThuChiQuyFormValues, extra: PayloadExtra = {}) {
  return {
    ngay: data.ngay,
    id_chi_nhanh: Number(data.id_chi_nhanh),
    ten_chi_nhanh: extra.tenChiNhanh ?? null,
    loai: data.loai,
    so_tien: data.so_tien,
    so_luong: data.so_luong ?? null,
    don_gia: data.don_gia ?? null,
    id_hang_muc: data.id_hang_muc ? Number(data.id_hang_muc) : null,
    ten_hang_muc: extra.tenHangMuc ?? null,
    dien_giai: data.dien_giai.trim(),
    ghi_chu: data.ghi_chu?.trim() || null,
    loai_chung_tu: data.loai_chung_tu ?? null,
    id_chung_tu: data.id_chung_tu ? Number(data.id_chung_tu) : null,
    so_chung_tu: data.so_chung_tu?.trim() || null,
  };
}

/* ------------------------------------------------------------------ */
/* Đọc danh sách                                                       */
/* ------------------------------------------------------------------ */

type QueryBuilder = ReturnType<ReturnType<typeof db.from>['select']>;

/**
 * Áp filter lên view summary.
 * LƯU Ý: filter `id_chi_nhanh` là điều kiện DUY NHẤT được Postgres đẩy xuống
 * dưới window function (vì là cột PARTITION BY) — vừa đúng vừa nhanh. Các filter
 * còn lại áp sau khi tồn quỹ đã tính nên không làm sai cột Tồn quỹ.
 */
function applyListQuery(q: QueryBuilder, query: ThuChiQuyListServerQuery): QueryBuilder {
  let b = q;
  if (query.chiNhanhIds !== null) b = b.in('id_chi_nhanh', query.chiNhanhIds);
  if (query.loai.length > 0) b = b.in('loai', query.loai);
  if (query.hangMucIds.length > 0) b = b.in('id_hang_muc', query.hangMucIds);
  if (query.nguonChungTu.length > 0) b = b.in('loai_chung_tu', query.nguonChungTu);
  if (query.nguoiTaoIds.length > 0) b = b.in('id_nguoi_tao', query.nguoiTaoIds);
  if (query.trangThai.length > 0) b = b.in('trang_thai', query.trangThai);
  if (query.ngayFrom) b = b.gte('ngay', query.ngayFrom);
  if (query.ngayTo) b = b.lte('ngay', query.ngayTo);
  if (query.searchTerm) {
    const pattern = postgrestQuotedIlikePattern(`%${query.searchTerm}%`);
    b = b.or(`ref_tim_kiem.ilike.${pattern}`);
  }
  return b;
}

export async function getThuChiQuyPage(
  page: number,
  pageSize: number,
  query: ThuChiQuyListServerQuery
): Promise<PaginatedTableResult<ThuChiQuyRow>> {
  const res = await fetchTablePage<DbSummaryRow>(page, pageSize, async (from, to) => {
    let sel = db.from(VIEW_SUMMARY).select(SUMMARY_COLUMNS, { count: 'exact' });
    sel = applyListQuery(sel as QueryBuilder, query) as typeof sel;
    const r = await sel
      .order('ngay', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to);
    return { data: r.data as DbSummaryRow[] | null, error: r.error, count: r.count };
  });
  return { ...res, data: res.data.map(summaryRowToItem) };
}

/**
 * Toàn bộ sổ quỹ khớp filter hiện tại — dùng cho nút Xuất (xuất tất cả bản ghi
 * đã lọc, không chỉ trang đang xem).
 */
export async function getThuChiQuyAll(query: ThuChiQuyListServerQuery): Promise<ThuChiQuyRow[]> {
  const rows = await fetchAllRows<DbSummaryRow>((from, to) => {
    let sel = db.from(VIEW_SUMMARY).select(SUMMARY_COLUMNS);
    sel = applyListQuery(sel as QueryBuilder, query) as typeof sel;
    return sel.order('ngay', { ascending: false }).order('id', { ascending: false }).range(from, to);
  });
  return rows.map(summaryRowToItem);
}

export async function getThuChiQuyById(id: string): Promise<ThuChiQuy | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data, error } = await db.from(TABLE).select(BASE_COLUMNS).eq('id', idNum).maybeSingle();
  if (error) throwSupabaseError(error);
  return data ? rowToItem(data as unknown as DbRow) : null;
}

/**
 * Phiếu gần nhất do chính người này lập — dùng để gợi ý sẵn farm + hạng mục khi
 * mở form tạo phiếu mới (thủ quỹ thường nhập lặp lại cùng loại chi).
 */
export async function getPhieuGanNhatCuaToi(idNguoiTao: string): Promise<ThuChiQuy | null> {
  const idNum = Number(idNguoiTao);
  if (Number.isNaN(idNum)) return null;
  const { data, error } = await db
    .from(TABLE)
    .select(BASE_COLUMNS)
    .eq('id_nguoi_tao', idNum)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throwSupabaseError(error);
  return data ? rowToItem(data as unknown as DbRow) : null;
}

/** Phiếu quỹ gắn với một chứng từ nguồn — đọc BẢNG GỐC (xem ghi chú đầu file). */
export async function getThuChiQuyByChungTu(
  loaiChungTu: ThuChiNguon,
  idChungTu: string
): Promise<ThuChiQuy[]> {
  const idNum = Number(idChungTu);
  if (Number.isNaN(idNum)) return [];
  const { data, error } = await db
    .from(TABLE)
    .select(BASE_COLUMNS)
    .eq('loai_chung_tu', loaiChungTu)
    .eq('id_chung_tu', idNum)
    .order('ngay', { ascending: true })
    .order('id', { ascending: true });
  if (error) throwSupabaseError(error);
  return ((data ?? []) as unknown as DbRow[]).map(rowToItem);
}

/* ------------------------------------------------------------------ */
/* Chứng từ nguồn (để chọn phiếu liên kết trong form)                   */
/* ------------------------------------------------------------------ */

/** Một phiếu nguồn rút gọn cho combobox chọn chứng từ liên kết. */
export interface ChungTuRef {
  id: string;
  so: string;
  ngay: string;
  mo_ta?: string | null;
}

/** Bảng + cột của từng loại chứng từ (chỉ đọc vài cột, không kéo cả phiếu). */
const CHUNG_TU_NGUON: Record<
  ThuChiNguon,
  { table: string; cotSo: string; cotNgay: string; cotMoTa?: string }
> = {
  don_dat_hang: { table: 'fp_mh_don_dat_hang', cotSo: 'so_po', cotNgay: 'ngay_dat', cotMoTa: 'ten_nha_cung_cap' },
  de_xuat_mua_hang: { table: 'fp_farm_de_xuat_mua_hang', cotSo: 'so_phieu', cotNgay: 'ngay', cotMoTa: 'ghi_chu' },
  chi_phi_tai_san: { table: 'fp_ts_chi_phi_tai_san', cotSo: 'ma_phieu', cotNgay: 'ngay', cotMoTa: 'ten_tai_san' },
};

/**
 * Danh sách phiếu nguồn mới nhất để chọn trong form (mặc định 50 phiếu gần nhất,
 * gõ vào ô tìm kiếm thì lọc theo số phiếu ở server).
 * Đọc thẳng bảng của module khác thay vì import service của họ — tránh phụ thuộc
 * chéo giữa các feature.
 */
export async function getChungTuRefList(
  loai: ThuChiNguon,
  search = '',
  limit = 50
): Promise<ChungTuRef[]> {
  const cfg = CHUNG_TU_NGUON[loai];
  const cols = [cfg.cotSo, cfg.cotNgay, cfg.cotMoTa].filter(Boolean).join(',');
  let sel = db.from(cfg.table).select(`id,${cols}`);
  const term = search.trim();
  if (term) {
    sel = sel.ilike(cfg.cotSo, postgrestQuotedIlikePattern(`%${term}%`));
  }
  const { data, error } = await sel.order(cfg.cotNgay, { ascending: false }).limit(limit);
  if (error) throwSupabaseError(error);
  return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    so: String(row[cfg.cotSo] ?? ''),
    ngay: String(row[cfg.cotNgay] ?? ''),
    mo_ta: cfg.cotMoTa ? ((row[cfg.cotMoTa] as string) ?? null) : null,
  }));
}

/** Số dư hiện tại theo chi nhánh (view gộp, không chạy window). */
export async function getQuySoDu(chiNhanhIds: number[] | null): Promise<QuySoDu[]> {
  let sel = db
    .from(VIEW_SO_DU)
    .select('id_chi_nhanh,ref_ten_chi_nhanh,so_phieu,tong_thu,tong_chi,ton_quy_hien_tai,ngay_dau,ngay_cuoi');
  if (chiNhanhIds !== null) sel = sel.in('id_chi_nhanh', chiNhanhIds);
  const { data, error } = await sel;
  if (error) throwSupabaseError(error);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id_chi_nhanh: String(row.id_chi_nhanh),
    ten_chi_nhanh: (row.ref_ten_chi_nhanh as string) ?? undefined,
    so_phieu: num(row.so_phieu as number),
    tong_thu: num(row.tong_thu as number),
    tong_chi: num(row.tong_chi as number),
    ton_quy_hien_tai: num(row.ton_quy_hien_tai as number),
    ngay_dau: (row.ngay_dau as string) ?? null,
    ngay_cuoi: (row.ngay_cuoi as string) ?? null,
  }));
}

/* ------------------------------------------------------------------ */
/* Ghi                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Số phiếu kế tiếp — CHỈ gọi lúc bấm Lưu (gọi khi mở form sẽ đốt sequence).
 * Sequence không rollback nên số nhảy cách là bình thường.
 */
export async function getNextSoPhieu(loai: LoaiThuChi): Promise<string> {
  const { data, error } = await db.rpc(RPC_NEXT_SO_PHIEU[loai]);
  if (error) throwSupabaseError(error);
  const next = Number(data);
  if (!Number.isFinite(next)) throw new Error(i18n.t('thuChiQuy.service.soPhieuError'));
  return buildSoPhieu(next, loai);
}

export async function createThuChiQuy(
  data: ThuChiQuyFormValues,
  extra: PayloadExtra = {}
): Promise<ThuChiQuy> {
  const soPhieu = await getNextSoPhieu(data.loai);
  const payload = {
    ...toPayload(data, extra),
    so_phieu: soPhieu,
    id_nguoi_tao: extra.idNguoiTao ? Number(extra.idNguoiTao) : null,
    ten_nguoi_tao: extra.tenNguoiTao ?? null,
  };
  const { data: inserted, error } = await db.from(TABLE).insert(payload).select(BASE_COLUMNS).single();
  if (error) throwSupabaseError(error);
  return rowToItem(inserted as unknown as DbRow);
}

export async function updateThuChiQuy(
  id: string,
  data: ThuChiQuyFormValues,
  extra: PayloadExtra = {}
): Promise<ThuChiQuy> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('thuChiQuy.service.notFound'));

  const { error } = await db.from(TABLE).update(toPayload(data, extra)).eq('id', idNum);
  if (error) throwSupabaseError(error);

  const row = await getThuChiQuyById(id);
  if (!row) throw new Error(i18n.t('thuChiQuy.service.notFound'));
  return row;
}

/* ------------------------------------------------------------------ */
/* Khoá / mở khoá phiếu                                                */
/* ------------------------------------------------------------------ */

/**
 * Ba hàm dưới đây CỐ Ý không đi qua `toPayload`: chúng chỉ chạm cột trạng thái,
 * không ghi đè nội dung phiếu. Trigger `tr_thong_bao_fp_tc_quy_thu_chi` chỉ bắn
 * khi cột `trang_thai` đổi giá trị, nên mỗi lệnh ở đây sinh đúng một sự kiện.
 */
async function updateTrangThai(id: string, patch: Record<string, unknown>): Promise<ThuChiQuy> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('thuChiQuy.service.notFound'));

  const { error } = await db.from(TABLE).update(patch).eq('id', idNum);
  if (error) throwSupabaseError(error);

  const row = await getThuChiQuyById(id);
  if (!row) throw new Error(i18n.t('thuChiQuy.service.notFound'));
  return row;
}

/** Chốt phiếu: mo → khoa. Xoá dấu vết yêu cầu mở cũ để lần sau xin lại từ đầu. */
export async function khoaThuChiQuy(id: string): Promise<ThuChiQuy> {
  return updateTrangThai(id, {
    trang_thai: TRANG_THAI_THU_CHI_QUY.KHOA,
    id_nguoi_yeu_cau_mo: null,
    ten_nguoi_yeu_cau_mo: null,
    ly_do_yeu_cau_mo: null,
    tg_yeu_cau_mo: null,
    id_nguoi_xu_ly_mo: null,
    ten_nguoi_xu_ly_mo: null,
    tg_xu_ly_mo: null,
  });
}

export interface XinMoThuChiQuyExtra {
  lyDo: string;
  idNguoiYeuCau?: string | null;
  tenNguoiYeuCau?: string | null;
}

/** khoa → cho_mo. Lý do bắt buộc (form đã chặn, đây là lưới an toàn cuối). */
export async function xinMoThuChiQuy(id: string, extra: XinMoThuChiQuyExtra): Promise<ThuChiQuy> {
  const lyDo = extra.lyDo.trim();
  if (!lyDo) throw new Error(i18n.t('thuChiQuy.moKhoa.lyDoRequired'));

  return updateTrangThai(id, {
    trang_thai: TRANG_THAI_THU_CHI_QUY.CHO_MO,
    id_nguoi_yeu_cau_mo: extra.idNguoiYeuCau ? Number(extra.idNguoiYeuCau) : null,
    ten_nguoi_yeu_cau_mo: extra.tenNguoiYeuCau ?? null,
    ly_do_yeu_cau_mo: lyDo,
    tg_yeu_cau_mo: new Date().toISOString(),
    id_nguoi_xu_ly_mo: null,
    ten_nguoi_xu_ly_mo: null,
    tg_xu_ly_mo: null,
  });
}

export interface XuLyMoThuChiQuyExtra {
  /** true = duyệt (→ mo); false = từ chối (→ khoa, giữ nguyên nội dung yêu cầu). */
  duyet: boolean;
  idNguoiXuLy?: string | null;
  tenNguoiXuLy?: string | null;
}

/** cho_mo → mo (duyệt) hoặc cho_mo → khoa (từ chối); cấp cao mở thẳng phiếu khoa cũng dùng hàm này. */
export async function xuLyMoThuChiQuy(id: string, extra: XuLyMoThuChiQuyExtra): Promise<ThuChiQuy> {
  return updateTrangThai(id, {
    trang_thai: extra.duyet ? TRANG_THAI_THU_CHI_QUY.MO : TRANG_THAI_THU_CHI_QUY.KHOA,
    id_nguoi_xu_ly_mo: extra.idNguoiXuLy ? Number(extra.idNguoiXuLy) : null,
    ten_nguoi_xu_ly_mo: extra.tenNguoiXuLy ?? null,
    tg_xu_ly_mo: new Date().toISOString(),
  });
}

export async function deleteThuChiQuyList(ids: string[]): Promise<void> {
  const numIds = ids.map(Number).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await db.from(TABLE).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}

/**
 * Cấp một lô số phiếu cho luồng import (một request cho cả lô, cùng dãy số với
 * phiếu nhập tay). Trả mảng số phiếu đã pad theo đúng thứ tự.
 */
export async function getSoPhieuBatch(loai: LoaiThuChi, soLuong: number): Promise<string[]> {
  if (soLuong <= 0) return [];
  const { data, error } = await db.rpc(RPC_NEXT_SO_PHIEU_BATCH, { p_loai: loai, p_so_luong: soLuong });
  if (error) throwSupabaseError(error);
  // RETURNS SETOF bigint: PostgREST trả mảng số; phòng trường hợp trả mảng object.
  const list = (Array.isArray(data) ? data : []).map((row) =>
    typeof row === 'object' && row !== null
      ? Number(Object.values(row as Record<string, unknown>)[0])
      : Number(row)
  );
  if (list.length < soLuong || list.some((n) => !Number.isFinite(n))) {
    throw new Error(i18n.t('thuChiQuy.service.soPhieuError'));
  }
  return list.map((n) => buildSoPhieu(n, loai));
}

/**
 * Ghi hàng loạt cho luồng import Excel — PostgREST nhận cả mảng trong một
 * request, `bulkInsert` chia lô 500 và gom lỗi theo lô.
 */
export async function insertThuChiQuyBulk(
  rows: Record<string, unknown>[]
): Promise<{ done: number; failed: { msg: string }[] }> {
  if (rows.length === 0) return { done: 0, failed: [] };
  const outcome = await bulkInsert(TABLE, rows.map((payload) => ({ payload })));
  return { done: outcome.done.length, failed: outcome.failed.map((f) => ({ msg: f.msg })) };
}
