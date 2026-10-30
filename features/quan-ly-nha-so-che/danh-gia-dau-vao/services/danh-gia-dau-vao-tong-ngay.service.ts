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
function locChiNhanh(q: any, pv: DgdvPhamViTong): any {
  if (pv.idChiNhanh) return q.eq('id_chi_nhanh', idChiNhanhChoRpc(pv.idChiNhanh) ?? -1);
  if (pv.viewAll) return q;
  const ids = pv.allowedBranchIds.map(Number).filter(Number.isFinite);
  return ids.length === 0 ? q.eq('id_chi_nhanh', -1) : q.in('id_chi_nhanh', ids);
}

/** Tổng ngày × lô × dây trong khoảng [tu, den] (cộng mọi chuyến). */
export async function getDgdvTongNgayDayDb(tu: string, den: string, pv: DgdvPhamViTong): Promise<DgdvTongNgayDay[]> {
  if (!tu || !den || den < tu) return [];
  const rows = await fetchAllRows<Record<string, unknown>>((from, to) =>
    locChiNhanh(db.from(VIEW_TONG_NGAY_DAY).select('*').gte('ngay', tu).lte('ngay', den), pv)
      .order('ngay')
      .order('id_chi_nhanh')
      .order('id_lo')
      .range(from, to)
  );
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
  };
}

/** Tổng từng chuyến có ngày trong khoảng [tu, den], xếp ngày → chi nhánh → chuyến. */
export async function getDgdvTongChuyenDb(tu: string, den: string, pv: DgdvPhamViTong): Promise<DgdvTongChuyen[]> {
  if (!tu || !den || den < tu) return [];
  const rows = await fetchAllRows<Record<string, unknown>>((from, to) =>
    locChiNhanh(
      db
        .from(VIEW_TONG_CHUYEN)
        .select('id,ngay,chuyen,id_chi_nhanh,tong_so_luong,tong_dut_day,tong_thu,ksc')
        .gte('ngay', tu)
        .lte('ngay', den),
      pv
    )
      .order('ngay')
      .order('id_chi_nhanh')
      .order('chuyen')
      .range(from, to)
  );
  return rows.map(mapTongChuyen);
}
