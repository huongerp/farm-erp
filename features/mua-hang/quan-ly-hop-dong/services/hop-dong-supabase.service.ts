/**
 * Quản lý hợp đồng – Supabase (fp_mh_hop_dong, fp_mh_hop_dong_ct, v_hop_dong_summary)
 */
import { supabase, fetchAllRows, throwSupabaseError } from '../../../../lib/supabase';
import type { HopDong, HopDongChiTiet } from '../core/types';
import type { HopDongFormValues, HopDongChiTietLineValues } from '../core/schema';
import type { TrangThaiHopDong } from '../core/constants';
import { getDoiTacRef } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import i18n from '../../../../lib/i18n';

const TABLE_HOP = 'fp_mh_hop_dong';
const TABLE_CT = 'fp_mh_hop_dong_ct';
const VIEW_SUMMARY = 'v_hop_dong_summary';

const HOP_ROW_COLUMNS =
  'id,ngay,id_nha_cung_cap,ten_nha_cung_cap,ma_hop_dong,ten_hop_dong,noi_dung,so_luong_cay,don_gia,thanh_tien,trang_thai,ghi_chu,id_nguoi_tao,tg_tao,tg_cap_nhat';

/**
 * Không liệt kê từng cột computed trên view: nếu Supabase chưa chạy migration
 * `docs/supabase-v_hop_dong_summary.sql` mới, select có cột không tồn tại → 400.
 * `*` chỉ trả các cột thực có; rowToHop map thiếu → null.
 */
const VIEW_SUMMARY_SELECT = '*';

const CT_SELECT =
  'id,id_hop_dong,ngay,ten_dot,so_tien,so_cay_thuc_nhan,ghi_chu,id_chi_nhanh,id_nguoi_tao,tg_tao,tg_cap_nhat';

/** Chỉ dùng để gom nhóm theo hợp đồng (danh sách) — không phụ thuộc view summary. */
const CT_AGG_SELECT = 'id_hop_dong,so_tien,so_cay_thuc_nhan';

interface CtAggRow {
  id_hop_dong: number;
  so_tien: number | null;
  so_cay_thuc_nhan: number | null;
}

type CtAgg = { dot: number; tongTien: number; tongCay: number };

function buildCtAggMap(ctRows: CtAggRow[]): Map<number, CtAgg> {
  const m = new Map<number, CtAgg>();
  for (const r of ctRows) {
    const id = r.id_hop_dong;
    const cur = m.get(id) ?? { dot: 0, tongTien: 0, tongCay: 0 };
    cur.dot += 1;
    cur.tongTien += Number(r.so_tien) || 0;
    cur.tongCay += Number(r.so_cay_thuc_nhan) || 0;
    m.set(id, cur);
  }
  return m;
}

/** Ghi đè các chỉ số tổng hợp từ dòng chi tiết (khớp list & luôn đúng khi view chưa có cột). */
function applyAggregatesFromChiTiet(hop: HopDong): HopDong {
  const lines = hop.chi_tiet ?? [];
  let tongTien = 0;
  let tongCay = 0;
  for (const c of lines) {
    tongTien += Number(c.so_tien) || 0;
    tongCay += Number(c.so_cay_thuc_nhan) || 0;
  }
  const tt = hop.thanh_tien ?? 0;
  const sl = hop.so_luong_cay != null ? Number(hop.so_luong_cay) : 0;
  return {
    ...hop,
    tong_da_thanh_toan: tongTien,
    so_dot_thanh_toan: lines.length,
    tong_cay_da_giao: tongCay,
    tien_con_lai: tt - tongTien,
    cay_con_lai: sl - tongCay,
  };
}

function enrichSummaryRowWithCtAgg(row: HopSummaryRow, agg: CtAgg): HopSummaryRow {
  const tt = row.thanh_tien != null ? Number(row.thanh_tien) : 0;
  const sl = row.so_luong_cay != null ? Number(row.so_luong_cay) : 0;
  return {
    ...row,
    tong_da_thanh_toan: agg.tongTien,
    so_dot_thanh_toan: agg.dot,
    tong_cay_da_giao: agg.tongCay,
    tien_con_lai: tt - agg.tongTien,
    cay_con_lai: sl - agg.tongCay,
  };
}

interface HopDbRow {
  id: number;
  ngay: string | null;
  id_nha_cung_cap: number;
  ten_nha_cung_cap: string | null;
  ma_hop_dong: string;
  ten_hop_dong: string | null;
  noi_dung: string | null;
  so_luong_cay: number | null;
  don_gia: number | null;
  thanh_tien: number | null;
  trang_thai: string;
  ghi_chu: string | null;
  id_nguoi_tao: number | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

type HopSummaryRow = HopDbRow & {
  ref_ten_nha_cung_cap?: string | null;
  ref_ma_nha_cung_cap?: string | null;
  ref_ten_nguoi_tao?: string | null;
  tong_da_thanh_toan?: number | string | null;
  so_dot_thanh_toan?: number | string | null;
  tong_cay_da_giao?: number | string | null;
  tien_con_lai?: number | string | null;
  cay_con_lai?: number | string | null;
};

interface ChiTietDbRow {
  id: number;
  id_hop_dong: number;
  ngay: string | null;
  ten_dot: string | null;
  so_tien: number | null;
  so_cay_thuc_nhan: number | null;
  ghi_chu: string | null;
  id_chi_nhanh: number | null;
  id_nguoi_tao: number | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function toNum(s: string | null | undefined): number | null {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function numFromSummary(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function rowToHop(
  row: HopSummaryRow,
  enrich?: { chi_tiet?: HopDongChiTiet[] }
): HopDong {
  const tong = numFromSummary(row.tong_da_thanh_toan);
  return {
    id: String(row.id),
    ngay: row.ngay,
    id_nha_cung_cap: String(row.id_nha_cung_cap),
    ten_nha_cung_cap: row.ref_ten_nha_cung_cap ?? row.ten_nha_cung_cap ?? undefined,
    ma_hop_dong: row.ma_hop_dong ?? '',
    ten_hop_dong: row.ten_hop_dong,
    noi_dung: row.noi_dung,
    so_luong_cay: row.so_luong_cay != null ? Number(row.so_luong_cay) : null,
    don_gia: row.don_gia != null ? Number(row.don_gia) : null,
    thanh_tien: row.thanh_tien != null ? Number(row.thanh_tien) : null,
    trang_thai: row.trang_thai as TrangThaiHopDong,
    ghi_chu: row.ghi_chu,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: row.ref_ten_nguoi_tao ?? undefined,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    tong_da_thanh_toan: tong,
    so_dot_thanh_toan: numFromSummary(row.so_dot_thanh_toan),
    tong_cay_da_giao: numFromSummary(row.tong_cay_da_giao),
    tien_con_lai: numFromSummary(row.tien_con_lai),
    cay_con_lai: numFromSummary(row.cay_con_lai),
    chi_tiet: enrich?.chi_tiet,
  };
}

function rowToChiTiet(row: ChiTietDbRow, idHopStr: string): HopDongChiTiet {
  return {
    id: String(row.id),
    id_hop_dong: idHopStr,
    ngay: row.ngay,
    ten_dot: row.ten_dot,
    so_tien: row.so_tien != null ? Number(row.so_tien) : null,
    so_cay_thuc_nhan: row.so_cay_thuc_nhan != null ? Number(row.so_cay_thuc_nhan) : null,
    ghi_chu: row.ghi_chu,
    id_chi_nhanh: row.id_chi_nhanh != null ? String(row.id_chi_nhanh) : null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
  };
}

function lineToCtPayload(
  idHopNum: number,
  c: HopDongChiTietLineValues,
  idNguoiTaoNum: number | null
) {
  return {
    id_hop_dong: idHopNum,
    ngay: c.ngay?.trim() || null,
    ten_dot: c.ten_dot?.trim() || null,
    so_tien: c.so_tien != null && c.so_tien !== '' ? Number(c.so_tien) : null,
    so_cay_thuc_nhan:
      c.so_cay_thuc_nhan != null && c.so_cay_thuc_nhan !== '' ? Number(c.so_cay_thuc_nhan) : null,
    ghi_chu: c.ghi_chu?.trim() || null,
    id_chi_nhanh: toNum(c.id_chi_nhanh ?? undefined),
    id_nguoi_tao: idNguoiTaoNum != null && Number.isFinite(idNguoiTaoNum) ? idNguoiTaoNum : null,
  };
}

export async function getAllHopDongSupabase(): Promise<HopDong[]> {
  const rows = await fetchAllRows<HopSummaryRow>((from, to) =>
    supabase
      .from(VIEW_SUMMARY)
      .select(VIEW_SUMMARY_SELECT)
      .order('ngay', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false })
      .range(from, to)
  );

  const ctRows = await fetchAllRows<CtAggRow>((from, to) =>
    supabase.from(TABLE_CT).select(CT_AGG_SELECT).order('id', { ascending: true }).range(from, to)
  );
  const aggMap = buildCtAggMap(ctRows);

  return rows.map((row) => {
    const agg = aggMap.get(row.id) ?? { dot: 0, tongTien: 0, tongCay: 0 };
    return rowToHop(enrichSummaryRowWithCtAgg(row, agg));
  });
}

export async function getHopDongByIdSupabase(id: string): Promise<HopDong | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;

  const { data: row, error } = await supabase
    .from(VIEW_SUMMARY)
    .select(VIEW_SUMMARY_SELECT)
    .eq('id', idNum)
    .maybeSingle();
  if (error) throwSupabaseError(error);
  if (!row) return null;

  const { data: ctRows = [] } = await supabase
    .from(TABLE_CT)
    .select(CT_SELECT)
    .eq('id_hop_dong', idNum)
    .order('ngay', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });

  const chi_tiet = (ctRows as ChiTietDbRow[]).map((r) => rowToChiTiet(r, id));
  const hop = rowToHop(row as HopSummaryRow, { chi_tiet });
  return applyAggregatesFromChiTiet(hop);
}

export async function createHopDongSupabase(data: HopDongFormValues, idNguoiTao: string): Promise<HopDong> {
  const ma = data.ma_hop_dong.trim();
  const { data: existing } = await supabase.from(TABLE_HOP).select('id').eq('ma_hop_dong', ma).maybeSingle();
  if (existing) throw new Error(i18n.t('hopDong.service.duplicateMa'));

  const nvId = Number(idNguoiTao);
  if (!Number.isFinite(nvId)) throw new Error(i18n.t('hopDong.validation.userRequired'));

  const doiTacList = await getDoiTacRef('nha_cung_cap');
  const nccMap: Record<string, string> = {};
  doiTacList.forEach((d) => {
    nccMap[d.id] = d.ten_ncc;
  });

  const payload = {
    ngay: data.ngay.trim(),
    id_nha_cung_cap: Number(data.id_nha_cung_cap),
    ten_nha_cung_cap: nccMap[data.id_nha_cung_cap] ?? null,
    ma_hop_dong: ma,
    ten_hop_dong: data.ten_hop_dong.trim(),
    noi_dung: data.noi_dung?.trim() || null,
    so_luong_cay: numOrNull(data.so_luong_cay),
    don_gia: numOrNull(data.don_gia),
    thanh_tien: numOrNull(data.thanh_tien),
    trang_thai: data.trang_thai,
    ghi_chu: data.ghi_chu?.trim() || null,
    id_nguoi_tao: nvId,
  };

  const { data: inserted, error } = await supabase.from(TABLE_HOP).insert(payload).select(HOP_ROW_COLUMNS).single();
  if (error) throwSupabaseError(error);
  const idHop = (inserted as HopDbRow).id;
  const idStr = String(idHop);

  const got = await getHopDongByIdSupabase(idStr);
  if (!got) throw new Error(i18n.t('hopDong.service.notFound'));
  return got;
}

export async function updateHopDongSupabase(id: string, data: HopDongFormValues): Promise<HopDong> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('hopDong.service.notFound'));

  const { data: oldRow, error: fetchErr } = await supabase.from(TABLE_HOP).select(HOP_ROW_COLUMNS).eq('id', idNum).maybeSingle();
  if (fetchErr || !oldRow) throw new Error(i18n.t('hopDong.service.notFound'));

  const ma = data.ma_hop_dong.trim();
  const { data: other } = await supabase.from(TABLE_HOP).select('id').eq('ma_hop_dong', ma).neq('id', idNum).maybeSingle();
  if (other) throw new Error(i18n.t('hopDong.service.duplicateMa'));

  const doiTacList = await getDoiTacRef('nha_cung_cap');
  const nccMap: Record<string, string> = {};
  doiTacList.forEach((d) => {
    nccMap[d.id] = d.ten_ncc;
  });

  const payload = {
    ngay: data.ngay.trim(),
    id_nha_cung_cap: Number(data.id_nha_cung_cap),
    ten_nha_cung_cap: nccMap[data.id_nha_cung_cap] ?? null,
    ma_hop_dong: ma,
    ten_hop_dong: data.ten_hop_dong.trim(),
    noi_dung: data.noi_dung?.trim() || null,
    so_luong_cay: numOrNull(data.so_luong_cay),
    don_gia: numOrNull(data.don_gia),
    thanh_tien: numOrNull(data.thanh_tien),
    trang_thai: data.trang_thai,
    ghi_chu: data.ghi_chu?.trim() || null,
  };

  const { error: updateErr } = await supabase.from(TABLE_HOP).update(payload).eq('id', idNum);
  if (updateErr) throwSupabaseError(updateErr);

  const got = await getHopDongByIdSupabase(id);
  if (!got) throw new Error(i18n.t('hopDong.service.notFound'));
  return got;
}

export async function updateHopDongTrangThaiSupabase(
  id: string,
  trang_thai: TrangThaiHopDong,
  ghi_chu: string | null
): Promise<HopDong> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('hopDong.service.notFound'));
  const { error } = await supabase
    .from(TABLE_HOP)
    .update({ trang_thai, ghi_chu: ghi_chu?.trim() || null })
    .eq('id', idNum);
  if (error) throwSupabaseError(error);
  const got = await getHopDongByIdSupabase(id);
  if (!got) throw new Error(i18n.t('hopDong.service.notFound'));
  return got;
}

export async function insertHopDongChiTietSupabase(
  idHopDong: string,
  row: HopDongChiTietLineValues,
  idNguoiTao: string | null
): Promise<HopDongChiTiet> {
  const idHop = Number(idHopDong);
  if (Number.isNaN(idHop)) throw new Error(i18n.t('hopDong.service.notFound'));
  const nv = idNguoiTao != null ? Number(idNguoiTao) : null;
  const payload = lineToCtPayload(idHop, row, nv != null && Number.isFinite(nv) ? nv : null);
  const { data: inserted, error } = await supabase.from(TABLE_CT).insert(payload).select(CT_SELECT).single();
  if (error) throwSupabaseError(error);
  return rowToChiTiet(inserted as ChiTietDbRow, idHopDong);
}

export async function updateHopDongChiTietSupabase(idCt: string, row: HopDongChiTietLineValues): Promise<void> {
  const idNum = Number(idCt);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('hopDong.service.notFound'));
  const { data: exists } = await supabase.from(TABLE_CT).select('id').eq('id', idNum).maybeSingle();
  if (!exists) throw new Error(i18n.t('hopDong.service.notFound'));
  const payload = {
    ngay: row.ngay?.trim() || null,
    ten_dot: row.ten_dot?.trim() || null,
    so_tien: row.so_tien != null && row.so_tien !== '' ? Number(row.so_tien) : null,
    so_cay_thuc_nhan:
      row.so_cay_thuc_nhan != null && row.so_cay_thuc_nhan !== '' ? Number(row.so_cay_thuc_nhan) : null,
    ghi_chu: row.ghi_chu?.trim() || null,
    id_chi_nhanh: toNum(row.id_chi_nhanh ?? undefined),
  };
  const { error } = await supabase.from(TABLE_CT).update(payload).eq('id', idNum);
  if (error) throwSupabaseError(error);
}

export async function deleteHopDongChiTietSupabase(idCt: string): Promise<void> {
  const idNum = Number(idCt);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('hopDong.service.notFound'));
  const { error } = await supabase.from(TABLE_CT).delete().eq('id', idNum);
  if (error) throwSupabaseError(error);
}

export async function deleteHopDongSupabase(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('hopDong.service.notFound'));
  const { error } = await supabase.from(TABLE_HOP).delete().eq('id', idNum);
  if (error) throwSupabaseError(error);
}

export async function deleteHopDongManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_HOP).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}
