/**
 * Phiếu kho phân thuốc — Supabase (fp_farm_phieu_kho_phan_thuoc + chi tiết + views).
 */
import { supabase, fetchTablePage, type PaginatedTableResult, throwSupabaseError } from '../../../../lib/supabase';
import type {
  PhieuKhoPT,
  PhieuKhoPTChiTiet,
  LoaiPhieuKhoPT,
  ChiTietPhieuKhoPTFlat,
  TrangThaiPhieuKhoPT,
} from '../core/types';
import type { PhieuKhoPTFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getKhoRef } from '../../../kho-van/danh-sach-kho/services/kho-service';
import { getAllFarmHangHoa } from '../../hang-hoa-phan-thuoc/services/farm-hang-hoa-service';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { postgrestQuotedIlikePattern } from '../../../../lib/postgrest-or-ilike';
import type { ChiTietPhieuKhoPTListServerQuery, PhieuKhoPTListServerQuery } from './phieu-kho-pt-list-query';

const TABLE_PHIEU = 'fp_farm_phieu_kho_phan_thuoc';
const TABLE_CHI_TIET = 'fp_farm_phieu_kho_phan_thuoc_chi_tiet';
const VIEW_SUMMARY = 'v_farm_phieu_kho_phan_thuoc_summary';
const VIEW_FLAT = 'v_farm_phieu_kho_phan_thuoc_chi_tiet_flat';

const PHIEU_PT_CHI_TIET_ROW_SELECT =
  'id, id_phieu_kho, id_hang_hoa, ten_hang_hoa, don_vi_tinh, so_luong, don_gia, thanh_tien, so_lot, ghi_chu, nguoi_tao_id, ten_nguoi_tao, tg_tao, tg_cap_nhat';

const PHIEU_PT_SUMMARY_SELECT =
  'id, so_phieu, ngay, loai, kho_id, ten_kho, kho_den_id, ten_kho_den, trang_thai, mo_ta, id_nguoi_duyet, nguoi_tao_id, ten_nguoi_tao, tg_tao, tg_cap_nhat, so_dong, tong_so_luong, tong_tien, ref_ten_kho, ref_ten_kho_den, ref_ten_nguoi_tao, ref_ten_nguoi_duyet';

const PHIEU_PT_HEADER_ROW_SELECT =
  'id, so_phieu, ngay, loai, kho_id, ten_kho, kho_den_id, ten_kho_den, trang_thai, mo_ta, trao_doi, id_nguoi_duyet, nguoi_tao_id, ten_nguoi_tao, tg_tao, tg_cap_nhat';

interface PhieuKhoPTDbRow {
  id: number;
  so_phieu: string;
  ngay: string;
  loai: string;
  kho_id: number;
  ten_kho: string | null;
  kho_den_id: number | null;
  ten_kho_den: string | null;
  trang_thai: string;
  mo_ta?: string | null;
  trao_doi?: string | null;
  id_nguoi_duyet?: number | null;
  nguoi_tao_id: number | null;
  ten_nguoi_tao: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface ChiTietDbRow {
  id: number;
  id_phieu_kho: number;
  id_hang_hoa: number;
  ten_hang_hoa: string | null;
  don_vi_tinh: string | null;
  so_luong: number;
  don_gia: number | null;
  thanh_tien: number | null;
  so_lot: string | null;
  ghi_chu: string | null;
  nguoi_tao_id: number | null;
  ten_nguoi_tao: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

type PhieuKhoPTSummaryRow = PhieuKhoPTDbRow & {
  so_dong: number;
  tong_so_luong: number | string | null;
  tong_tien: number | string | null;
  ref_ten_kho?: string | null;
  ref_ten_kho_den?: string | null;
  ref_ten_nguoi_tao?: string | null;
  ref_ten_nguoi_duyet?: string | null;
};

function mapPhieuKhoPTSummaryRowToPhieu(row: PhieuKhoPTSummaryRow): PhieuKhoPT {
  const ten_kho = row.ref_ten_kho ?? row.ten_kho ?? undefined;
  const ten_kho_den = row.kho_den_id != null ? (row.ref_ten_kho_den ?? row.ten_kho_den ?? undefined) : undefined;
  const ten_nguoi_tao = row.nguoi_tao_id != null ? (row.ten_nguoi_tao ?? row.ref_ten_nguoi_tao ?? undefined) : undefined;
  const ten_nguoi_duyet = row.id_nguoi_duyet != null ? (row.ref_ten_nguoi_duyet ?? undefined) : undefined;
  const phieu = rowToPhieu(row as PhieuKhoPTDbRow, { ten_kho, ten_kho_den, ten_nguoi_tao, ten_nguoi_duyet });
  phieu.tong_so_dong = Number(row.so_dong) || 0;
  phieu.tong_so_luong = Number(row.tong_so_luong) || 0;
  phieu.tong_tien = Number(row.tong_tien) || 0;
  return phieu;
}

interface PhieuKhoPTChiTietFlatViewRow {
  chi_tiet_id: number;
  id_phieu_kho: number;
  id_hang_hoa: number;
  ten_hang_hoa: string | null;
  don_vi_tinh: string | null;
  so_luong: number | string | null;
  don_gia: number | string | null;
  thanh_tien: number | string | null;
  so_lot: string | null;
  ghi_chu: string | null;
  chi_tiet_nguoi_tao_id: number | null;
  chi_tiet_ten_nguoi_tao: string | null;
  chi_tiet_tg_tao: string | null;
  chi_tiet_tg_cap_nhat: string | null;
  phieu_id: number;
  so_phieu: string;
  ngay: string;
  loai: string;
  kho_id: number;
  ten_kho: string | null;
  kho_den_id: number | null;
  ten_kho_den: string | null;
  trang_thai: string;
  mo_ta: string | null;
  trao_doi: string | null;
  phieu_nguoi_tao_id: number | null;
  phieu_ten_nguoi_tao: string | null;
  id_nguoi_duyet: number | null;
  phieu_tg_tao: string | null;
  phieu_tg_cap_nhat: string | null;
  ma_hang: string | null;
}

const PHIEU_PT_CHI_TIET_FLAT_SELECT =
  'chi_tiet_id, id_phieu_kho, id_hang_hoa, ten_hang_hoa, don_vi_tinh, so_luong, don_gia, thanh_tien, so_lot, ghi_chu, chi_tiet_nguoi_tao_id, chi_tiet_ten_nguoi_tao, chi_tiet_tg_tao, chi_tiet_tg_cap_nhat, phieu_id, so_phieu, ngay, loai, kho_id, ten_kho, kho_den_id, ten_kho_den, trang_thai, mo_ta, trao_doi, phieu_nguoi_tao_id, phieu_ten_nguoi_tao, id_nguoi_duyet, phieu_tg_tao, phieu_tg_cap_nhat, ma_hang';

function rowToPhieu(
  row: PhieuKhoPTDbRow,
  enrich?: {
    ten_kho?: string;
    ten_kho_den?: string;
    ten_nguoi_tao?: string;
    ten_nguoi_duyet?: string;
  }
): PhieuKhoPT {
  return {
    id: String(row.id),
    so_phieu: row.so_phieu,
    ngay: row.ngay,
    loai: row.loai as LoaiPhieuKhoPT,
    kho_id: String(row.kho_id),
    ten_kho: enrich?.ten_kho ?? row.ten_kho ?? undefined,
    kho_den_id: row.kho_den_id != null ? String(row.kho_den_id) : undefined,
    ten_kho_den: enrich?.ten_kho_den ?? row.ten_kho_den ?? undefined,
    trang_thai: (row.trang_thai as TrangThaiPhieuKhoPT) || 'Chờ duyệt',
    mo_ta: row.mo_ta ?? undefined,
    trao_doi: row.trao_doi ?? undefined,
    id_nguoi_duyet: row.id_nguoi_duyet ?? undefined,
    ten_nguoi_duyet: enrich?.ten_nguoi_duyet,
    nguoi_tao_id: row.nguoi_tao_id ?? undefined,
    ten_nguoi_tao: enrich?.ten_nguoi_tao ?? row.ten_nguoi_tao ?? undefined,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function rowToChiTiet(
  row: ChiTietDbRow,
  idPhieuKhoStr: string,
  enrich?: { ma_hang?: string; ten_danh_muc?: string }
): PhieuKhoPTChiTiet {
  return {
    id: String(row.id),
    id_phieu_kho: idPhieuKhoStr,
    id_hang_hoa: String(row.id_hang_hoa),
    ten_hang_hoa: row.ten_hang_hoa ?? undefined,
    so_luong: Number(row.so_luong),
    don_gia: row.don_gia != null ? Number(row.don_gia) : undefined,
    thanh_tien: row.thanh_tien != null ? Number(row.thanh_tien) : undefined,
    don_vi_tinh: row.don_vi_tinh ?? undefined,
    so_lot: row.so_lot ?? undefined,
    ghi_chu: row.ghi_chu ?? undefined,
    nguoi_tao_id: row.nguoi_tao_id ?? undefined,
    ten_nguoi_tao: row.ten_nguoi_tao ?? undefined,
    tg_tao: row.tg_tao ?? undefined,
    tg_cap_nhat: row.tg_cap_nhat ?? undefined,
    ma_hang: enrich?.ma_hang,
    ten_hang: row.ten_hang_hoa ?? undefined,
    ten_danh_muc: enrich?.ten_danh_muc,
  };
}

export async function getNextSoPhieuFarmPtSupabase(loai: LoaiPhieuKhoPT): Promise<string> {
  const { data, error } = await supabase.rpc('get_next_so_phieu_farm_pt', { p_loai: loai });
  if (error) throwSupabaseError(error);
  if (typeof data !== 'string') throw new Error('get_next_so_phieu_farm_pt did not return string');
  return data;
}

export async function getPhieuKhoPTByIdSupabase(id: string): Promise<PhieuKhoPT | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await supabase
    .from(TABLE_PHIEU)
    .select(PHIEU_PT_HEADER_ROW_SELECT)
    .eq('id', idNum)
    .maybeSingle();
  if (error) throwSupabaseError(error);
  if (!row) return null;

  const [khoList, employees, ctRows, hangHoaList] = await Promise.all([
    getKhoRef(),
    getEmployeesRef(),
    supabase
      .from(TABLE_CHI_TIET)
      .select(PHIEU_PT_CHI_TIET_ROW_SELECT)
      .eq('id_phieu_kho', idNum)
      .order('id', { ascending: true })
      .then((r) => r.data ?? []),
    getAllFarmHangHoa(),
  ]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => {
    khoMap[k.id] = k.ten_kho;
  });
  const nvMap: Record<string, string> = {};
  employees.forEach((e) => {
    nvMap[e.id] = e.ho_ten;
  });
  const hangHoaMap: Record<string, { ma_hang: string; ten_danh_muc?: string }> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = { ma_hang: h.ma_hang_hoa ?? '', ten_danh_muc: h.ten_danh_muc };
  });

  const p = row as PhieuKhoPTDbRow;
  const ten_kho = khoMap[String(p.kho_id)] ?? p.ten_kho ?? undefined;
  const ten_kho_den = p.kho_den_id != null ? (khoMap[String(p.kho_den_id)] ?? p.ten_kho_den ?? undefined) : undefined;
  const ten_nguoi_tao = p.nguoi_tao_id != null ? nvMap[String(p.nguoi_tao_id)] : undefined;
  const ten_nguoi_duyet = p.id_nguoi_duyet != null ? nvMap[String(p.id_nguoi_duyet)] : undefined;
  const phieu = rowToPhieu(p, { ten_kho, ten_kho_den, ten_nguoi_tao, ten_nguoi_duyet });

  const chi_tiet: PhieuKhoPTChiTiet[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const h = hangHoaMap[String(ct.id_hang_hoa)];
    return rowToChiTiet(ct, id, { ma_hang: h?.ma_hang, ten_danh_muc: h?.ten_danh_muc });
  });
  phieu.chi_tiet = chi_tiet;
  phieu.tong_so_dong = chi_tiet.length;
  phieu.tong_so_luong = chi_tiet.reduce((s, c) => s + (Number(c.so_luong) || 0), 0);
  phieu.tong_tien = chi_tiet.reduce((s, c) => s + (Number(c.thanh_tien) || 0), 0);
  return phieu;
}

export async function createPhieuKhoPTSupabase(data: PhieuKhoPTFormValues): Promise<PhieuKhoPT> {
  const loai = data.loai as LoaiPhieuKhoPT;
  const soPhieu = data.so_phieu.trim();
  const { data: existing } = await supabase.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).eq('loai', loai).maybeSingle();
  if (existing) throw new Error(i18n.t('phieuKhoPhanThuoc.service.duplicateCode'));

  const [khoList, employees] = await Promise.all([getKhoRef(), getEmployeesRef()]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => {
    khoMap[k.id] = k.ten_kho;
  });
  const nvMap: Record<string, string> = {};
  employees.forEach((e) => {
    nvMap[e.id] = e.ho_ten;
  });

  const nguoiTaoId = data.nguoi_tao_id != null ? Number(data.nguoi_tao_id) : null;

  const payload = {
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    loai,
    kho_id: Number(data.kho_id),
    ten_kho: khoMap[String(data.kho_id)] ?? null,
    kho_den_id: loai === 'chuyển' && data.kho_den_id ? Number(data.kho_den_id) : null,
    ten_kho_den: loai === 'chuyển' && data.kho_den_id ? (khoMap[String(data.kho_den_id)] ?? null) : null,
    trang_thai: data.trang_thai,
    mo_ta: data.mo_ta?.trim() || null,
    nguoi_tao_id: nguoiTaoId,
    ten_nguoi_tao: nguoiTaoId != null ? (nvMap[String(nguoiTaoId)] ?? null) : null,
  };

  const { data: inserted, error } = await supabase.from(TABLE_PHIEU).insert(payload).select(PHIEU_PT_HEADER_ROW_SELECT).single();
  if (error) throwSupabaseError(error);
  const idPhieu = (inserted as PhieuKhoPTDbRow).id;
  const idStr = String(idPhieu);

  const hangHoaList = await getAllFarmHangHoa();
  const hangHoaMap: Record<string, { ten_hang_hoa: string; don_vi_tinh?: string }> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = { ten_hang_hoa: h.ten_hang_hoa ?? '', don_vi_tinh: h.dvt ?? undefined };
  });

  const chiTietPayload = (data.chi_tiet ?? []).filter((c) => c.id_hang_hoa?.trim() && Number(c.so_luong) > 0);
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => {
      const h = hangHoaMap[c.id_hang_hoa.trim()];
      const sl = Number(c.so_luong);
      const dg = c.don_gia != null ? Number(c.don_gia) : 0;
      return {
        id_phieu_kho: idPhieu,
        id_hang_hoa: Number(c.id_hang_hoa),
        ten_hang_hoa: h?.ten_hang_hoa ?? null,
        don_vi_tinh: h?.don_vi_tinh ?? null,
        so_luong: sl,
        don_gia: dg,
        thanh_tien: sl * dg,
        so_lot: c.so_lot?.trim() || null,
        ghi_chu: c.ghi_chu?.trim() || null,
        nguoi_tao_id: nguoiTaoId,
        ten_nguoi_tao: nguoiTaoId != null ? (nvMap[String(nguoiTaoId)] ?? null) : null,
      };
    });
    const { error: errCt } = await supabase.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throwSupabaseError(errCt);
  }

  const got = await getPhieuKhoPTByIdSupabase(idStr);
  if (!got) throw new Error(i18n.t('phieuKhoPhanThuoc.service.notFound'));
  return got;
}

export async function updatePhieuKhoPTSupabase(id: string, data: PhieuKhoPTFormValues): Promise<PhieuKhoPT> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKhoPhanThuoc.service.notFound'));

  const { data: oldRow, error: fetchErr } = await supabase.from(TABLE_PHIEU).select(PHIEU_PT_HEADER_ROW_SELECT).eq('id', idNum).maybeSingle();
  if (fetchErr || !oldRow) throw new Error(i18n.t('phieuKhoPhanThuoc.service.notFound'));

  const soPhieu = data.so_phieu.trim();
  const loaiForUnique = data.loai as LoaiPhieuKhoPT;
  const { data: other } = await supabase
    .from(TABLE_PHIEU)
    .select('id')
    .eq('so_phieu', soPhieu)
    .eq('loai', loaiForUnique)
    .neq('id', idNum)
    .maybeSingle();
  if (other) throw new Error(i18n.t('phieuKhoPhanThuoc.service.duplicateCode'));

  const [khoList, employees] = await Promise.all([getKhoRef(), getEmployeesRef()]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => {
    khoMap[k.id] = k.ten_kho;
  });
  const nvMap: Record<string, string> = {};
  employees.forEach((e) => {
    nvMap[e.id] = e.ho_ten;
  });

  const nguoiTaoId = data.nguoi_tao_id != null ? Number(data.nguoi_tao_id) : null;

  const payload = {
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    loai: data.loai as LoaiPhieuKhoPT,
    kho_id: Number(data.kho_id),
    ten_kho: khoMap[String(data.kho_id)] ?? null,
    kho_den_id: data.loai === 'chuyển' && data.kho_den_id ? Number(data.kho_den_id) : null,
    ten_kho_den: data.loai === 'chuyển' && data.kho_den_id ? (khoMap[String(data.kho_den_id)] ?? null) : null,
    trang_thai: data.trang_thai,
    mo_ta: data.mo_ta?.trim() || null,
    nguoi_tao_id: nguoiTaoId,
    ten_nguoi_tao: nguoiTaoId != null ? (nvMap[String(nguoiTaoId)] ?? null) : null,
  };

  const { error: updateErr } = await supabase.from(TABLE_PHIEU).update(payload).eq('id', idNum);
  if (updateErr) throwSupabaseError(updateErr);

  await supabase.from(TABLE_CHI_TIET).delete().eq('id_phieu_kho', idNum);

  const hangHoaList = await getAllFarmHangHoa();
  const hangHoaMap: Record<string, { ten_hang_hoa: string; don_vi_tinh?: string }> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = { ten_hang_hoa: h.ten_hang_hoa ?? '', don_vi_tinh: h.dvt ?? undefined };
  });

  const chiTietPayload = (data.chi_tiet ?? []).filter((c) => c.id_hang_hoa?.trim() && Number(c.so_luong) > 0);
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => {
      const h = hangHoaMap[c.id_hang_hoa.trim()];
      const sl = Number(c.so_luong);
      const dg = c.don_gia != null ? Number(c.don_gia) : 0;
      return {
        id_phieu_kho: idNum,
        id_hang_hoa: Number(c.id_hang_hoa),
        ten_hang_hoa: h?.ten_hang_hoa ?? null,
        don_vi_tinh: h?.don_vi_tinh ?? null,
        so_luong: sl,
        don_gia: dg,
        thanh_tien: sl * dg,
        so_lot: c.so_lot?.trim() || null,
        ghi_chu: c.ghi_chu?.trim() || null,
        nguoi_tao_id: nguoiTaoId,
        ten_nguoi_tao: nguoiTaoId != null ? (nvMap[String(nguoiTaoId)] ?? null) : null,
      };
    });
    const { error: errCt } = await supabase.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throwSupabaseError(errCt);
  }

  const got = await getPhieuKhoPTByIdSupabase(id);
  if (!got) throw new Error(i18n.t('phieuKhoPhanThuoc.service.notFound'));
  return got;
}

function formatPhieuKhoPTTraoDoiTimestamp(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export interface UpdatePhieuKhoPTTrangThaiOptions {
  ghi_chu?: string;
  id_nguoi_duyet?: number | null;
  ten_nguoi_duyet_hien_thi?: string;
}

export async function updatePhieuKhoPTTrangThaiSupabase(
  id: string,
  trang_thai: TrangThaiPhieuKhoPT,
  options?: UpdatePhieuKhoPTTrangThaiOptions
): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKhoPhanThuoc.service.notFound'));
  const ghi_chu = options?.ghi_chu;
  const idNguoiDuyet =
    options?.id_nguoi_duyet != null && Number.isFinite(options.id_nguoi_duyet) && !Number.isNaN(options.id_nguoi_duyet)
      ? options.id_nguoi_duyet
      : null;

  const { data: row } = await supabase.from(TABLE_PHIEU).select('trao_doi').eq('id', idNum).maybeSingle();
  const existing = (row as { trao_doi?: string } | null)?.trao_doi ?? '';
  const ts = formatPhieuKhoPTTraoDoiTimestamp();
  const who =
    options?.ten_nguoi_duyet_hien_thi?.trim() ||
    (idNguoiDuyet != null ? `Nhân viên #${idNguoiDuyet}` : 'Người dùng');
  const actionVerb = trang_thai === 'Đã duyệt' ? 'đã duyệt' : 'không duyệt';
  const entry = ghi_chu?.trim()
    ? `${ts} — ${who} ${actionVerb}. Ghi chú: ${ghi_chu.trim()}`
    : `${ts} — ${who} ${actionVerb}.`;
  const newTraoDoi = existing ? existing + '\n' + entry : entry;
  const { error } = await supabase
    .from(TABLE_PHIEU)
    .update({ trang_thai, trao_doi: newTraoDoi, id_nguoi_duyet: idNguoiDuyet })
    .eq('id', idNum);
  if (error) throwSupabaseError(error);
}

export async function deletePhieuKhoPTSupabase(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKhoPhanThuoc.service.notFound'));
  const { error } = await supabase.from(TABLE_PHIEU).delete().eq('id', idNum);
  if (error) throwSupabaseError(error);
}

export async function deletePhieuKhoPTManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((id) => Number(id)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_PHIEU).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}

let nvMapCache: Promise<Record<string, string>> | null = null;
async function getNvMap(): Promise<Record<string, string>> {
  if (!nvMapCache) {
    nvMapCache = getEmployeesRef().then((employees) => {
      const nvMap: Record<string, string> = {};
      employees.forEach((e) => {
        nvMap[e.id] = e.ho_ten;
      });
      return nvMap;
    });
  }
  return nvMapCache;
}

function mapPhieuKhoPTChiTietFlatViewRows(flatRows: PhieuKhoPTChiTietFlatViewRow[], nvMap: Record<string, string>): ChiTietPhieuKhoPTFlat[] {
  const flat: ChiTietPhieuKhoPTFlat[] = flatRows.map((r) => {
    const lineNvId = r.chi_tiet_nguoi_tao_id != null ? r.chi_tiet_nguoi_tao_id : undefined;
    const lineTenNv =
      (typeof r.chi_tiet_ten_nguoi_tao === 'string' && r.chi_tiet_ten_nguoi_tao.trim() !== ''
        ? r.chi_tiet_ten_nguoi_tao.trim()
        : undefined) ?? (lineNvId != null ? nvMap[String(lineNvId)] : undefined);
    const maHang = r.ma_hang?.trim() ? r.ma_hang.trim() : undefined;
    return {
      id: String(r.chi_tiet_id),
      id_phieu_kho: String(r.phieu_id),
      so_phieu: r.so_phieu,
      ngay: r.ngay,
      loai: r.loai as LoaiPhieuKhoPT,
      kho_id: String(r.kho_id),
      ten_kho: r.ten_kho ?? undefined,
      kho_den_id: r.kho_den_id != null ? String(r.kho_den_id) : undefined,
      ten_kho_den: r.ten_kho_den ?? undefined,
      trang_thai: (r.trang_thai as TrangThaiPhieuKhoPT) || 'Chờ duyệt',
      mo_ta: r.mo_ta ?? undefined,
      trao_doi: r.trao_doi ?? undefined,
      phieu_tg_tao: r.phieu_tg_tao ?? undefined,
      phieu_tg_cap_nhat: r.phieu_tg_cap_nhat ?? undefined,
      id_nguoi_duyet: r.id_nguoi_duyet != null ? r.id_nguoi_duyet : undefined,
      ten_nguoi_duyet: r.id_nguoi_duyet != null ? nvMap[String(r.id_nguoi_duyet)] : undefined,
      nguoi_tao_id: r.phieu_nguoi_tao_id != null ? r.phieu_nguoi_tao_id : undefined,
      ten_nguoi_tao: r.phieu_nguoi_tao_id != null ? nvMap[String(r.phieu_nguoi_tao_id)] : undefined,
      id_hang_hoa: String(r.id_hang_hoa),
      ten_hang_hoa: r.ten_hang_hoa ?? undefined,
      ma_hang: maHang,
      ten_hang: r.ten_hang_hoa ?? undefined,
      so_luong: Number(r.so_luong),
      don_gia: r.don_gia != null ? Number(r.don_gia) : undefined,
      thanh_tien: r.thanh_tien != null ? Number(r.thanh_tien) : undefined,
      don_vi_tinh: r.don_vi_tinh ?? undefined,
      so_lot: r.so_lot ?? undefined,
      ghi_chu: r.ghi_chu ?? undefined,
      chi_tiet_nguoi_tao_id: lineNvId,
      chi_tiet_ten_nguoi_tao: lineTenNv,
      chi_tiet_tg_tao: r.chi_tiet_tg_tao ?? undefined,
      chi_tiet_tg_cap_nhat: r.chi_tiet_tg_cap_nhat ?? undefined,
    };
  });
  flat.sort(
    (a, b) =>
      (b.ngay || '').localeCompare(a.ngay || '') ||
      (a.so_phieu || '').localeCompare(b.so_phieu || '') ||
      (a.ma_hang ?? '').localeCompare(b.ma_hang ?? '')
  );
  return flat;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPhieuKhoPTListQueryToSummarySelect(q: any, query: PhieuKhoPTListServerQuery): any {
  let b = q;
  if (query.loaiDb.length) b = b.in('loai', query.loaiDb);
  if (query.trangThaiViet.length) b = b.in('trang_thai', query.trangThaiViet);
  if (query.khoIds.length) b = b.in('kho_id', query.khoIds);
  if (query.khoDenIds.length) b = b.in('kho_den_id', query.khoDenIds);
  if (query.ngayFrom) b = b.gte('ngay', query.ngayFrom);
  if (query.ngayTo) b = b.lte('ngay', query.ngayTo);
  if (query.nguoiTaoIds.length) b = b.in('nguoi_tao_id', query.nguoiTaoIds);
  if (query.nguoiDuyetIds.length) b = b.in('id_nguoi_duyet', query.nguoiDuyetIds);
  const term = (query.searchTerm ?? '').trim();
  if (term) {
    const esc = term.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pat = postgrestQuotedIlikePattern(`%${esc}%`);
    b = b.or(`so_phieu.ilike.${pat},mo_ta.ilike.${pat},ten_kho.ilike.${pat},ten_kho_den.ilike.${pat}`);
  }
  return b;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyChiTietPhieuKhoPTListQueryToFlatSelect(q: any, query: ChiTietPhieuKhoPTListServerQuery): any {
  let b = q;
  if (query.loaiDb.length) b = b.in('loai', query.loaiDb);
  if (query.trangThaiViet.length) b = b.in('trang_thai', query.trangThaiViet);
  if (query.khoIds.length) b = b.in('kho_id', query.khoIds);
  if (query.khoDenIds.length) b = b.in('kho_den_id', query.khoDenIds);
  if (query.ngayFrom) b = b.gte('ngay', query.ngayFrom);
  if (query.ngayTo) b = b.lte('ngay', query.ngayTo);
  if (query.nguoiTaoIds.length) b = b.in('phieu_nguoi_tao_id', query.nguoiTaoIds);
  if (query.nguoiDuyetIds.length) b = b.in('id_nguoi_duyet', query.nguoiDuyetIds);
  const term = (query.searchTerm ?? '').trim();
  if (term) {
    const esc = term.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pat = postgrestQuotedIlikePattern(`%${esc}%`);
    b = b.or(`so_phieu.ilike.${pat},ten_hang_hoa.ilike.${pat},mo_ta.ilike.${pat},ghi_chu.ilike.${pat},ma_hang.ilike.${pat}`);
  }
  return b;
}

const CHI_TIET_PAGE_SIZE_DEFAULT = 100;
const DANH_SACH_PAGE_SIZE_DEFAULT = 50;

export async function getPhieuKhoPTPageSupabase(
  page: number,
  pageSize: number = DANH_SACH_PAGE_SIZE_DEFAULT,
  listQuery?: PhieuKhoPTListServerQuery
): Promise<PaginatedTableResult<PhieuKhoPT>> {
  const pageResult = await fetchTablePage<PhieuKhoPTSummaryRow>(page, pageSize, async (from, to) => {
    let sel = supabase.from(VIEW_SUMMARY).select(PHIEU_PT_SUMMARY_SELECT, { count: 'exact' });
    if (listQuery) sel = applyPhieuKhoPTListQueryToSummarySelect(sel, listQuery);
    const res = await sel.order('ngay', { ascending: false }).order('so_phieu', { ascending: false }).range(from, to);
    return { data: (res.data ?? null) as PhieuKhoPTSummaryRow[] | null, error: res.error, count: res.count };
  });
  const data = pageResult.data.map((row) => mapPhieuKhoPTSummaryRowToPhieu(row));
  return { data, totalCount: pageResult.totalCount, page: pageResult.page, pageSize: pageResult.pageSize };
}

export async function getChiTietPhieuKhoPTPageSupabase(
  page: number,
  pageSize: number = CHI_TIET_PAGE_SIZE_DEFAULT,
  listQuery?: ChiTietPhieuKhoPTListServerQuery
): Promise<PaginatedTableResult<ChiTietPhieuKhoPTFlat>> {
  const [pageResult, nvMap] = await Promise.all([
    fetchTablePage<PhieuKhoPTChiTietFlatViewRow>(page, pageSize, async (from, to) => {
      let sel = supabase.from(VIEW_FLAT).select(PHIEU_PT_CHI_TIET_FLAT_SELECT, { count: 'exact' });
      if (listQuery) sel = applyChiTietPhieuKhoPTListQueryToFlatSelect(sel, listQuery);
      const res = await sel
        .order('ngay', { ascending: false })
        .order('so_phieu', { ascending: false })
        .order('chi_tiet_id', { ascending: false })
        .range(from, to);
      return { data: res.data as PhieuKhoPTChiTietFlatViewRow[] | null, error: res.error, count: res.count };
    }),
    getNvMap(),
  ]);
  const data = mapPhieuKhoPTChiTietFlatViewRows(pageResult.data, nvMap);
  return { data, totalCount: pageResult.totalCount, page: pageResult.page, pageSize: pageResult.pageSize };
}

export async function fetchAllPhieuKhoPTForListQuerySupabase(
  listQuery: PhieuKhoPTListServerQuery,
  pageSize = 500,
  maxRows = 25000
): Promise<PhieuKhoPT[]> {
  const out: PhieuKhoPT[] = [];
  let p = 0;
  while (out.length < maxRows) {
    const { data, totalCount } = await getPhieuKhoPTPageSupabase(p, pageSize, listQuery);
    out.push(...data);
    if (data.length === 0 || out.length >= totalCount) break;
    p += 1;
  }
  return out;
}

export async function fetchAllChiTietPhieuKhoPTForListQuerySupabase(
  listQuery: ChiTietPhieuKhoPTListServerQuery,
  pageSize = 500,
  maxRows = 25000
): Promise<ChiTietPhieuKhoPTFlat[]> {
  const out: ChiTietPhieuKhoPTFlat[] = [];
  let p = 0;
  while (out.length < maxRows) {
    const { data, totalCount } = await getChiTietPhieuKhoPTPageSupabase(p, pageSize, listQuery);
    out.push(...data);
    if (data.length === 0 || out.length >= totalCount) break;
    p += 1;
  }
  return out;
}
