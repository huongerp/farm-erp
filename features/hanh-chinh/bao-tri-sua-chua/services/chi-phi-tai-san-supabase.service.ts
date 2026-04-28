/**
 * Service chi phí tài sản – đọc/ghi Supabase.
 * Bảng: fp_ts_chi_phi_tai_san (phiếu), fp_ts_trang_thai_chi_phi_tai_san (thiết lập trạng thái).
 * Map: id_trang_thai + ten_trang_thai (DB) <-> trang_thai enum (app: cho_duyet | da_duyet | khong_duyet).
 */
import { supabase } from '../../../../lib/supabase';
import { formatDate, formatDateShort } from '../../../../lib/utils';
import type { PhieuBaoTriSuaChua, PhieuBaoTriSuaChuaCreate } from '../core/types';
import type { TrangThaiPhieu } from '../core/types';
import i18n from '../../../../lib/i18n';

const TABLE_PHIEU = 'fp_ts_chi_phi_tai_san';
const TABLE_TRANG_THAI = 'fp_ts_trang_thai_chi_phi_tai_san';
const TABLE_TAI_SAN = 'fp_ts_tai_san';
const TABLE_NHAN_VIEN = 'fp_var_nhan_vien';

const PHIEU_CHI_PHI_ROW_COLUMNS =
  'id,ngay,id_tai_san,ma_tai_san,ten_tai_san,id_hang_muc,ten_hang_muc,mo_ta,so_tien,ghi_chu,id_trang_thai,ten_trang_thai,nguoi_duyet,id_nguoi_tao,ten_nguoi_tao,tg_tao,tg_cap_nhat';

function parseNguoiTaoDbId(idNguoiTao: string): number | null {
  const t = idNguoiTao.trim();
  if (!t || !/^\d+$/.test(t)) return null;
  const n = parseInt(t, 10);
  return Number.isNaN(n) ? null : n;
}

/** Lấy mã/tên tài sản hiện tại để lưu tắt trên phiếu và đồng bộ khi sửa phiếu */
async function fetchTaiSanMaTen(idTaiSan: string): Promise<{ ma_tai_san: string; ten_tai_san: string } | null> {
  const n = parseInt(idTaiSan, 10);
  if (Number.isNaN(n)) return null;
  const { data, error } = await supabase
    .from(TABLE_TAI_SAN)
    .select('ma_tai_san, ten_tai_san')
    .eq('id', n)
    .maybeSingle();
  if (error || !data) return null;
  return {
    ma_tai_san: data.ma_tai_san != null ? String(data.ma_tai_san) : '',
    ten_tai_san: data.ten_tai_san != null ? String(data.ten_tai_san) : '',
  };
}

/** Map id_trang_thai (DB) -> TrangThaiPhieu (app). Seed order: 1=CHO_DUYET, 2=DA_DUYET, 3=KHONG_DUYET */
const ID_TO_TRANG_THAI: Record<number, TrangThaiPhieu> = {
  1: 'cho_duyet',
  2: 'da_duyet',
  3: 'khong_duyet',
};

const TRANG_THAI_TO_ID: Record<TrangThaiPhieu, number> = {
  cho_duyet: 1,
  da_duyet: 2,
  khong_duyet: 3,
};

function idTrangThaiToEnum(id: number): TrangThaiPhieu {
  return ID_TO_TRANG_THAI[id] ?? 'cho_duyet';
}

interface DbPhieuRow {
  id: number;
  ngay: string;
  id_tai_san: number;
  ma_tai_san: string | null;
  ten_tai_san: string | null;
  id_hang_muc: string;
  ten_hang_muc: string | null;
  mo_ta: string;
  so_tien: number;
  ghi_chu: string | null;
  id_trang_thai: number;
  ten_trang_thai: string | null;
  nguoi_duyet: string | null;
  id_nguoi_tao: number | null;
  ten_nguoi_tao: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

/** Tìm nhanh theo mọi trường hiển thị / xuất (không phân biệt hoa thường). */
function phieuMatchesSearchQuery(p: PhieuBaoTriSuaChua, qRaw: string): boolean {
  const q = qRaw.trim().toLowerCase();
  if (!q) return true;

  const ngayDisp = [p.ngay, formatDate(p.ngay), formatDateShort(p.ngay)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const tien = p.so_tien ?? 0;
  const tienStr = String(tien).toLowerCase();
  const tienLocale = tien.toLocaleString('vi-VN').toLowerCase().replace(/\s/g, '');
  const statusLabels = (['cho_duyet', 'da_duyet', 'khong_duyet'] as const).map((k) =>
    String(i18n.t(`baoTriSuaChua.trangThai.${k}`)).toLowerCase()
  );

  const haystack = [
    p.id,
    ngayDisp,
    p.id_tai_san,
    p.ma_tai_san,
    p.ten_tai_san,
    p.id_hang_muc,
    p.ten_hang_muc,
    p.mo_ta,
    tienStr,
    tienLocale,
    p.ghi_chu,
    p.trang_thai,
    ...statusLabels,
    p.nguoi_duyet,
    p.ten_nguoi_tao,
    p.id_nguoi_tao,
  ]
    .filter((x) => x != null && String(x).trim() !== '')
    .map((x) => String(x).toLowerCase())
    .join(' ');

  return haystack.includes(q);
}

function rowToPhieu(row: DbPhieuRow): PhieuBaoTriSuaChua {
  return {
    id: String(row.id),
    ngay: row.ngay,
    id_tai_san: String(row.id_tai_san),
    ma_tai_san: row.ma_tai_san ?? undefined,
    ten_tai_san: row.ten_tai_san ?? undefined,
    id_hang_muc: String(row.id_hang_muc),
    ten_hang_muc: row.ten_hang_muc ?? undefined,
    mo_ta: row.mo_ta,
    so_tien: Number(row.so_tien),
    ghi_chu: row.ghi_chu ?? null,
    trang_thai: idTrangThaiToEnum(row.id_trang_thai),
    nguoi_duyet: row.nguoi_duyet ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : '',
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

export interface GetPhieuChiPhiListParams {
  q?: string;
  hang_muc?: string[];
  dateFrom?: string;
  dateTo?: string;
  id_tai_san?: string | string[];
}

export async function getPhieuChiPhiListSupabase(
  params: GetPhieuChiPhiListParams = {}
): Promise<PhieuBaoTriSuaChua[]> {
  let query = supabase
    .from(TABLE_PHIEU)
    .select(PHIEU_CHI_PHI_ROW_COLUMNS)
    .order('ngay', { ascending: false })
    .order('id', { ascending: false });

  if (params.id_tai_san !== undefined) {
    const ids = Array.isArray(params.id_tai_san) ? params.id_tai_san : [params.id_tai_san];
    const numIds = ids.map((x) => parseInt(x, 10)).filter((n) => !Number.isNaN(n));
    if (numIds.length > 0) query = query.in('id_tai_san', numIds);
  }
  if (params.hang_muc && params.hang_muc.length > 0) {
    query = query.in('id_hang_muc', params.hang_muc);
  }
  if (params.dateFrom) {
    query = query.gte('ngay', params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte('ngay', params.dateTo);
  }

  const { data, error } = await query;
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  let list = (data ?? []).map((r) => rowToPhieu(r as DbPhieuRow));

  if (params.q?.trim()) {
    const q = params.q.trim();
    list = list.filter((p) => phieuMatchesSearchQuery(p, q));
  }

  return list;
}

export async function getPhieuChiPhiByIdSupabase(id: string): Promise<PhieuBaoTriSuaChua | null> {
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return null;
  const { data, error } = await supabase.from(TABLE_PHIEU).select(PHIEU_CHI_PHI_ROW_COLUMNS).eq('id', numId).single();
  if (error || !data) return null;
  return rowToPhieu(data as DbPhieuRow);
}

export async function createPhieuChiPhiSupabase(
  data: PhieuBaoTriSuaChuaCreate,
  id_nguoi_tao: string,
  options?: { ten_nguoi_tao?: string | null }
): Promise<PhieuBaoTriSuaChua> {
  const idTrangThai = data.trang_thai ? TRANG_THAI_TO_ID[data.trang_thai] : 1;
  const taiSan = await fetchTaiSanMaTen(data.id_tai_san);
  const idNguoiNum = parseNguoiTaoDbId(id_nguoi_tao);
  let tenNguoi = options?.ten_nguoi_tao?.trim() || null;
  if (!tenNguoi && idNguoiNum != null) {
    const { data: nv } = await supabase
      .from(TABLE_NHAN_VIEN)
      .select('ho_va_ten')
      .eq('id', idNguoiNum)
      .maybeSingle();
    tenNguoi = (nv as { ho_va_ten?: string } | null)?.ho_va_ten?.trim() || null;
  }
  const payload = {
    ngay: data.ngay,
    id_tai_san: parseInt(data.id_tai_san, 10),
    ma_tai_san: taiSan?.ma_tai_san || null,
    ten_tai_san: taiSan?.ten_tai_san || null,
    id_hang_muc: data.id_hang_muc,
    ten_hang_muc: data.ten_hang_muc?.trim() || null,
    mo_ta: data.mo_ta.trim(),
    so_tien: data.so_tien,
    ghi_chu: data.ghi_chu?.trim() ?? null,
    id_trang_thai: idTrangThai,
    ten_trang_thai: null,
    nguoi_duyet: data.nguoi_duyet?.trim() ?? null,
    id_nguoi_tao: idNguoiNum,
    ten_nguoi_tao: tenNguoi,
  };
  const { data: inserted, error } = await supabase.from(TABLE_PHIEU).insert(payload).select(PHIEU_CHI_PHI_ROW_COLUMNS).single();
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  return rowToPhieu(inserted as DbPhieuRow);
}

export async function updatePhieuChiPhiSupabase(
  id: string,
  data: PhieuBaoTriSuaChuaCreate
): Promise<PhieuBaoTriSuaChua> {
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) throw new Error(i18n.t('baoTriSuaChua.service.notFound', { defaultValue: 'Phiếu không tồn tại' }));
  const idTrangThai = data.trang_thai != null ? TRANG_THAI_TO_ID[data.trang_thai] : undefined;
  const taiSan = await fetchTaiSanMaTen(data.id_tai_san);
  const payload: Record<string, unknown> = {
    ngay: data.ngay,
    id_tai_san: parseInt(data.id_tai_san, 10),
    ma_tai_san: taiSan?.ma_tai_san || null,
    ten_tai_san: taiSan?.ten_tai_san || null,
    id_hang_muc: data.id_hang_muc,
    ten_hang_muc: data.ten_hang_muc?.trim() || null,
    mo_ta: data.mo_ta.trim(),
    so_tien: data.so_tien,
    ghi_chu: data.ghi_chu?.trim() ?? null,
    nguoi_duyet: data.nguoi_duyet?.trim() ?? null,
  };
  if (idTrangThai !== undefined) payload.id_trang_thai = idTrangThai;

  const { error } = await supabase.from(TABLE_PHIEU).update(payload).eq('id', numId);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  const { data: updated, error: err2 } = await supabase.from(TABLE_PHIEU).select(PHIEU_CHI_PHI_ROW_COLUMNS).eq('id', numId).single();
  if (err2 || !updated) throw new Error(i18n.t('baoTriSuaChua.service.notFound', { defaultValue: 'Phiếu không tồn tại' }));
  return rowToPhieu(updated as DbPhieuRow);
}

export async function deletePhieuChiPhiSupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((x) => parseInt(x, 10)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_PHIEU).delete().in('id', numIds);
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
}

/** Lấy danh sách trạng thái phiếu từ bảng thiết lập (để combobox, v.v.) */
export async function getTrangThaiChiPhiListSupabase(): Promise<{ id: number; ma: string; ten: string }[]> {
  const { data, error } = await supabase
    .from(TABLE_TRANG_THAI)
    .select('id, ma, ten')
    .order('thu_tu', { ascending: true });
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  return (data ?? []).map((r: { id: number; ma: string; ten: string }) => ({ id: r.id, ma: r.ma, ten: r.ten }));
}
