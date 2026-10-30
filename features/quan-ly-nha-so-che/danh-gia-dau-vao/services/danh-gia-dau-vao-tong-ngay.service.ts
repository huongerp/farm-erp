/**
 * Tổng theo ngày của phiếu Đánh giá đầu vào (cộng MỌI chuyến trong ngày — migration 057):
 * - `fn_dgdv_tong_ngay`: tổng thu + KSC của một ngày + chi nhánh. Báo cáo sơ chế và Dự báo SL đóng
 *   thùng dùng để hiện ô khoá — DB ghi đè đúng số này bằng trigger.
 * - View `v_fp_farm_dgdv_tong_ngay_day`: ngày × chi nhánh × lô × dây (dòng `id_mau_1` null = đứt dây).
 * - View `v_fp_farm_dgdv_tong_chuyen`: tổng từng chuyến (1 dòng / phiếu).
 */
import { db, fetchAllRows, throwDbError } from '../../../../lib/db';

export interface DgdvTongNgay {
  /** Σ số lượng các dây + Σ đứt dây. */
  tong_thu: number;
  /** Σ số lượng lỗi (không sơ chế). */
  ksc: number;
}

const RPC_TONG_NGAY = 'fn_dgdv_tong_ngay';
const VIEW_TONG_NGAY_DAY = 'v_fp_farm_dgdv_tong_ngay_day';
const VIEW_TONG_CHUYEN = 'v_fp_farm_dgdv_tong_chuyen';

/** Id chi nhánh hợp lệ cho RPC (bigint dương), không hợp lệ → null. */
export function idChiNhanhChoRpc(idChiNhanh: string | number | null | undefined): number | null {
  if (idChiNhanh == null || String(idChiNhanh).trim() === '') return null;
  const n = Number(idChiNhanh);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** Số không âm từ giá trị PostgREST (bigint có thể là chuỗi); rác / âm → 0. */
const soKhongAm = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** RPC trả TABLE → PostgREST trả mảng 1 dòng; bigint có thể về dạng chuỗi. Không có dòng = 0. */
export function docDgdvTongNgay(data: unknown): DgdvTongNgay {
  const dong = Array.isArray(data) ? data[0] : data;
  const o = dong && typeof dong === 'object' ? (dong as Record<string, unknown>) : {};
  return { tong_thu: soKhongAm(o.tong_thu), ksc: soKhongAm(o.ksc) };
}

export async function getDgdvTongNgayDb(ngay: string, idChiNhanh: number): Promise<DgdvTongNgay> {
  const { data, error } = await db.rpc(RPC_TONG_NGAY, { p_ngay: ngay, p_id_chi_nhanh: idChiNhanh });
  if (error) throwDbError(error);
  return docDgdvTongNgay(data);
}

// ---- Tổng ngày × lô × dây (mọi chuyến) ---------------------------------------------

/** Một dòng view tổng ngày × dây. `id_mau_1` null = dòng đứt dây của lô (không có dây / tuần thu hoạch). */
export interface DgdvTongNgayDay {
  ngay: string;
  id_chi_nhanh: string;
  /** tuần farm của ngày */
  nam: number;
  tuan: number;
  id_lo: string;
  ten_lo: string | null;
  to_truong: string | null;
  id_mau_1: string | null;
  id_mau_2: string | null;
  xe_doi: boolean;
  th_nam: number | null;
  th_tuan: number | null;
  so_luong: number;
  so_luong_huy: number;
}

type Id = number | string;
const str = (v: Id | null | undefined): string | null => (v == null || v === '' ? null : String(v));
const soHoacNull = (v: unknown): number | null => (v == null ? null : soKhongAm(v));

export function mapTongNgayDay(r: Record<string, unknown>): DgdvTongNgayDay {
  return {
    ngay: String(r.ngay ?? '').slice(0, 10),
    id_chi_nhanh: String(r.id_chi_nhanh),
    nam: soKhongAm(r.nam),
    tuan: soKhongAm(r.tuan),
    id_lo: String(r.id_lo),
    ten_lo: (r.ten_lo as string | null) ?? null,
    to_truong: (r.to_truong as string | null) ?? null,
    id_mau_1: str(r.id_mau_1 as Id | null),
    id_mau_2: str(r.id_mau_2 as Id | null),
    xe_doi: !!r.xe_doi,
    th_nam: soHoacNull(r.th_nam),
    th_tuan: soHoacNull(r.th_tuan),
    so_luong: soKhongAm(r.so_luong),
    so_luong_huy: soKhongAm(r.so_luong_huy),
  };
}

/** Phạm vi chi nhánh: một chi nhánh, hoặc mọi chi nhánh được xem khi `idChiNhanh` rỗng. */
export interface DgdvPhamViTong {
  idChiNhanh: string | null;
  viewAll: boolean;
  allowedBranchIds: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function locKhoang(q: any, tu: string, den: string): any {
  let x = q;
  if (tu) x = x.gte('ngay', tu);
  if (den) x = x.lte('ngay', den);
  return x;
}

/** Khoảng [tu, den], đầu rỗng = không giới hạn phía đó; ngược chiều → không có dòng nào. */
const khoangHopLe = (tu: string, den: string) => !(tu && den && den < tu);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function locChiNhanh(q: any, pv: DgdvPhamViTong): any {
  if (pv.idChiNhanh) return q.eq('id_chi_nhanh', idChiNhanhChoRpc(pv.idChiNhanh) ?? -1);
  if (pv.viewAll) return q;
  const ids = pv.allowedBranchIds.map(Number).filter(Number.isFinite);
  return ids.length === 0 ? q.eq('id_chi_nhanh', -1) : q.in('id_chi_nhanh', ids);
}

/**
 * Tổng ngày × lô × dây trong khoảng [tu, den] (cộng mọi chuyến; đầu rỗng = không giới hạn).
 * `toTruong` (tên gốc như đã nhập) → chỉ lô của các tổ trưởng đó, lọc ở server.
 */
export async function getDgdvTongNgayDayDb(
  tu: string,
  den: string,
  pv: DgdvPhamViTong,
  toTruong?: readonly string[]
): Promise<DgdvTongNgayDay[]> {
  if (!khoangHopLe(tu, den)) return [];
  if (toTruong && toTruong.length === 0) return [];
  const rows = await fetchAllRows<Record<string, unknown>>((from, to) => {
    const q = locChiNhanh(locKhoang(db.from(VIEW_TONG_NGAY_DAY).select('*'), tu, den), pv);
    return (toTruong ? q.in('to_truong', [...toTruong]) : q)
      .order('ngay')
      .order('id_chi_nhanh')
      .order('id_lo')
      .range(from, to);
  });
  return rows.map(mapTongNgayDay);
}

// ---- Tổng theo chuyến ----------------------------------------------------------------

export interface DgdvTongChuyen {
  id: string;
  ngay: string;
  chuyen: number;
  id_chi_nhanh: string;
  tong_so_luong: number;
  tong_dut_day: number;
  tong_thu: number;
  ksc: number;
  trang_thai: string;
}

export function mapTongChuyen(r: Record<string, unknown>): DgdvTongChuyen {
  return {
    id: String(r.id),
    ngay: String(r.ngay ?? '').slice(0, 10),
    chuyen: soKhongAm(r.chuyen),
    id_chi_nhanh: String(r.id_chi_nhanh),
    tong_so_luong: soKhongAm(r.tong_so_luong),
    tong_dut_day: soKhongAm(r.tong_dut_day),
    tong_thu: soKhongAm(r.tong_thu),
    ksc: soKhongAm(r.ksc),
    trang_thai: String(r.trang_thai ?? ''),
  };
}

/** Tổng từng chuyến có ngày trong khoảng [tu, den] (đầu rỗng = không giới hạn), xếp ngày → chi nhánh → chuyến. */
export async function getDgdvTongChuyenDb(tu: string, den: string, pv: DgdvPhamViTong): Promise<DgdvTongChuyen[]> {
  if (!khoangHopLe(tu, den)) return [];
  const rows = await fetchAllRows<Record<string, unknown>>((from, to) =>
    locChiNhanh(
      locKhoang(db.from(VIEW_TONG_CHUYEN).select('id,ngay,chuyen,id_chi_nhanh,tong_so_luong,tong_dut_day,tong_thu,ksc,trang_thai'), tu, den),
      pv
    )
      .order('ngay')
      .order('id_chi_nhanh')
      .order('chuyen')
      .range(from, to)
  );
  return rows.map(mapTongChuyen);
}

// ---- Số sơ chế của Báo cáo sơ chế (cột «% BC cuối ngày») --------------------------------------

const BANG_BCSC = 'fp_farm_bao_cao_so_che';
const MA_TONG_SO_CHE = 'tong_buong_so_che';

/**
 * Tổng buồng sơ chế (chỉ tiêu `tong_buong_so_che`) của Báo cáo sơ chế trong khoảng → Map `ngay|id_chi_nhanh`.
 * Ngày chưa có báo cáo không có khoá (khác 0). Báo cáo duy nhất / (ngày, chi nhánh) — `uq_fp_farm_bcsc_chi_nhanh_ngay`.
 */
export async function getBcscSoCheDb(tu: string, den: string, pv: DgdvPhamViTong): Promise<Map<string, number>> {
  if (!khoangHopLe(tu, den)) return new Map();
  const rows = await fetchAllRows<Record<string, unknown>>((from, to) =>
    locChiNhanh(
      locKhoang(db.from(BANG_BCSC).select('ngay,id_chi_nhanh,ct:fp_farm_bao_cao_so_che_ct(gia_tri)'), tu, den).eq(
        'ct.ma_chi_tieu',
        MA_TONG_SO_CHE
      ),
      pv
    )
      .order('ngay')
      .order('id_chi_nhanh')
      .range(from, to)
  );
  const m = new Map<string, number>();
  for (const r of rows) {
    const ct = Array.isArray(r.ct) ? (r.ct as { gia_tri: unknown }[]) : [];
    m.set(`${String(r.ngay ?? '').slice(0, 10)}|${String(r.id_chi_nhanh)}`, ct.reduce((s, x) => s + soKhongAm(x.gia_tri), 0));
  }
  return m;
}

// ---- Tổ trưởng đã nhập ở các lô của phiếu (tuỳ chọn chip Tổ trưởng) -----------------------------

/** Mọi tên tổ trưởng (gốc, khác rỗng) đã nhập ở lô của phiếu — để gom tuỳ chọn và lọc `in` ở server. */
export async function getDgdvTenToTruongDb(): Promise<string[]> {
  const rows = await fetchAllRows<{ to_truong: string | null }>((from, to) =>
    db.from('fp_farm_dgdv_lo').select('to_truong').not('to_truong', 'is', null).order('id').range(from, to)
  );
  return [...new Set(rows.map((r) => r.to_truong ?? '').filter((x) => x.trim() !== ''))];
}
