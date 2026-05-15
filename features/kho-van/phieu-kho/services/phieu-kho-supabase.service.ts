/**
 * Service phiếu kho đọc/ghi Supabase (fp_mh_phieu_kho, fp_mh_phieu_kho_chi_tiet).
 * Trên DB không có FK; app liên kết và enrich với: danh sách kho, danh sách hàng hóa,
 * nhân viên, danh sách đối tác.
 */
import { supabase, fetchAllRows, fetchTablePage, type PaginatedTableResult, throwSupabaseError } from '../../../../lib/supabase';
import type { PhieuKho, PhieuKhoChiTiet, LoaiPhieuKho, ChiTietPhieuKhoFlat, TrangThaiPhieuKho } from '../core/types';
import type { PhieuKhoFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

/** Dòng lịch sử nhập/xuất/chuyển theo hàng hóa. */
export interface LichSuNhapXuatRow {
  id_phieu_kho: string;
  id_chi_tiet: string;
  /** Hàng hóa của dòng chi tiết — partition luỹ kế tồn theo kho. */
  id_hang_hoa: string;
  so_phieu: string;
  ngay: string;
  loai: LoaiPhieuKho;
  so_luong: number;
  don_vi_tinh?: string;
  ghi_chu?: string;
  ten_kho?: string;
  ten_kho_den?: string;
  /** Kho nguồn trên phiếu (fp_mh_phieu_kho.kho_id) — dùng lọc theo kho. */
  kho_id: string;
  kho_den_id?: string | null;
  /** Thời gian tạo phiếu — ưu tiên hiển thị thay cho chỉ có ngày chứng từ. */
  tg_tao?: string | null;
}

/** Dòng lịch sử theo kho (có thêm ma_hang, ten_hang). */
export interface LichSuNhapXuatByKhoRow extends LichSuNhapXuatRow {
  ma_hang?: string;
  ten_hang?: string;
}
import { getKhoRef } from '../../danh-sach-kho/services/kho-service';
import { getDoiTacRef } from '../../danh-sach-doi-tac/services/doi-tac-service';
import { getHangHoaRef } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import type { BranchListScope } from '../../../../lib/branch-scope-query';
import { postgrestQuotedIlikePattern } from '../../../../lib/postgrest-or-ilike';
import type { ChiTietPhieuKhoListServerQuery, PhieuKhoListServerQuery } from './phieu-kho-list-query';

const TABLE_PHIEU = 'fp_mh_phieu_kho';
const TABLE_CHI_TIET = 'fp_mh_phieu_kho_chi_tiet';

const PHIEU_KHO_CHI_TIET_ROW_SELECT =
  'id, id_phieu_kho, id_hang_hoa, ten_hang_hoa, don_vi_tinh, so_luong, don_gia, thanh_tien, so_lot, ghi_chu, nguoi_tao_id, ten_nguoi_tao, tg_tao, tg_cap_nhat';

/** Cột view summary — có mo_ta cho list; vẫn bỏ trao_doi (dài, chỉ cần khi mở chi tiết). */
const PHIEU_KHO_SUMMARY_SELECT =
  'id, so_phieu, ngay, loai, kho_id, ten_kho, kho_den_id, ten_kho_den, id_nha_cung_cap, id_khach_hang, id_don_dat_hang, trang_thai, mo_ta, id_nguoi_duyet, nguoi_tao_id, ten_nguoi_tao, tg_tao, tg_cap_nhat, so_dong, tong_so_luong, tong_tien, ref_ten_kho, ref_ten_kho_den, ref_ten_nha_cung_cap, ref_ten_khach_hang, ref_ten_nguoi_tao, ref_ten_nguoi_duyet, ref_so_po_don_dat_hang';

const PHIEU_KHO_HEADER_ROW_SELECT =
  'id, so_phieu, ngay, loai, kho_id, ten_kho, kho_den_id, ten_kho_den, id_nha_cung_cap, id_khach_hang, id_don_dat_hang, trang_thai, mo_ta, trao_doi, id_nguoi_duyet, nguoi_tao_id, ten_nguoi_tao, tg_tao, tg_cap_nhat';

/** View DB: chạy docs/supabase-v_phieu_kho_summary.sql trên Supabase. */
const VIEW_PHIEU_KHO_SUMMARY = 'v_phieu_kho_summary';
/** View DB: chạy docs/supabase-v_phieu_kho_chi_tiet_flat.sql trên Supabase. */
const VIEW_PHIEU_KHO_CHI_TIET_FLAT = 'v_phieu_kho_chi_tiet_flat';

/** Row fp_mh_phieu_kho từ Supabase */
interface PhieuKhoDbRow {
  id: number;
  so_phieu: string;
  ngay: string;
  loai: string;
  kho_id: number;
  ten_kho: string | null;
  kho_den_id: number | null;
  ten_kho_den: string | null;
  id_nha_cung_cap: number | null;
  id_khach_hang: number | null;
  trang_thai: string;
  mo_ta?: string | null;
  /** Optional khi chỉ load summary list (không select trao_doi). */
  trao_doi?: string | null;
  /** Cột mới trên Supabase; có thể chưa có trên bản DB cũ. */
  id_nguoi_duyet?: number | null;
  /** Liên kết đơn đặt hàng (phiếu nhập). */
  id_don_dat_hang?: number | null;
  nguoi_tao_id: number | null;
  ten_nguoi_tao: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

/** Row fp_mh_phieu_kho_chi_tiet từ Supabase */
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

/** Row từ v_phieu_kho_summary (= header + aggregate + cột ref_* từ JOIN khi view đã migrate). */
type PhieuKhoSummaryRow = PhieuKhoDbRow & {
  so_dong: number;
  tong_so_luong: number | string | null;
  tong_tien: number | string | null;
  ref_ten_kho?: string | null;
  ref_ten_kho_den?: string | null;
  ref_ten_nha_cung_cap?: string | null;
  ref_ten_khach_hang?: string | null;
  ref_ten_nguoi_tao?: string | null;
  ref_ten_nguoi_duyet?: string | null;
  ref_so_po_don_dat_hang?: string | null;
};

/** Map một dòng summary (đã JOIN tên trên DB) → PhieuKho — không gọi get*Ref. */
function mapPhieuKhoSummaryRowToPhieu(row: PhieuKhoSummaryRow): PhieuKho {
  const ten_kho = row.ref_ten_kho ?? row.ten_kho ?? undefined;
  const ten_kho_den = row.kho_den_id != null ? (row.ref_ten_kho_den ?? row.ten_kho_den ?? undefined) : undefined;
  const ten_nha_cung_cap = row.id_nha_cung_cap != null ? (row.ref_ten_nha_cung_cap ?? undefined) : undefined;
  const ten_khach_hang = row.id_khach_hang != null ? (row.ref_ten_khach_hang ?? undefined) : undefined;
  const ten_nguoi_tao = row.nguoi_tao_id != null ? (row.ten_nguoi_tao ?? row.ref_ten_nguoi_tao ?? undefined) : undefined;
  const ten_nguoi_duyet = row.id_nguoi_duyet != null ? (row.ref_ten_nguoi_duyet ?? undefined) : undefined;
  const soPoDon =
    row.ref_so_po_don_dat_hang != null && String(row.ref_so_po_don_dat_hang).trim() !== ''
      ? String(row.ref_so_po_don_dat_hang).trim()
      : undefined;
  const phieu = rowToPhieu(row as PhieuKhoDbRow, {
    ten_kho,
    ten_kho_den,
    ten_nha_cung_cap,
    ten_khach_hang,
    ten_nguoi_tao,
    ten_nguoi_duyet,
    so_po_don_dat_hang: soPoDon,
  });
  phieu.tong_so_dong = Number(row.so_dong) || 0;
  phieu.tong_so_luong = Number(row.tong_so_luong) || 0;
  phieu.tong_tien = Number(row.tong_tien) || 0;
  return phieu;
}

/** Row từ v_phieu_kho_chi_tiet_flat. */
interface PhieuKhoChiTietFlatViewRow {
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
  id_nha_cung_cap: number | null;
  id_khach_hang: number | null;
  trang_thai: string;
  mo_ta: string | null;
  trao_doi: string | null;
  phieu_nguoi_tao_id: number | null;
  phieu_ten_nguoi_tao: string | null;
  id_nguoi_duyet: number | null;
  phieu_tg_tao: string | null;
  phieu_tg_cap_nhat: string | null;
  id_don_dat_hang?: number | null;
  ma_hang: string | null;
  so_po_don_dat_hang?: string | null;
}

const PHIEU_KHO_CHI_TIET_FLAT_SELECT =
  'chi_tiet_id, id_phieu_kho, id_hang_hoa, ten_hang_hoa, don_vi_tinh, so_luong, don_gia, thanh_tien, so_lot, ghi_chu, chi_tiet_nguoi_tao_id, chi_tiet_ten_nguoi_tao, chi_tiet_tg_tao, chi_tiet_tg_cap_nhat, phieu_id, so_phieu, ngay, loai, kho_id, ten_kho, kho_den_id, ten_kho_den, id_nha_cung_cap, id_khach_hang, trang_thai, mo_ta, trao_doi, phieu_nguoi_tao_id, phieu_ten_nguoi_tao, id_nguoi_duyet, phieu_tg_tao, phieu_tg_cap_nhat, id_don_dat_hang, ma_hang, so_po_don_dat_hang';

function rowToPhieu(
  row: PhieuKhoDbRow,
  enrich?: {
    ten_kho?: string;
    ten_kho_den?: string;
    ten_nha_cung_cap?: string;
    ten_khach_hang?: string;
    ten_nguoi_tao?: string;
    ten_nguoi_duyet?: string;
    so_po_don_dat_hang?: string;
  }
): PhieuKho {
  return {
    id: String(row.id),
    so_phieu: row.so_phieu ?? '',
    ngay: row.ngay ?? '',
    loai: (row.loai as LoaiPhieuKho) || 'nhập',
    kho_id: String(row.kho_id),
    ten_kho: enrich?.ten_kho ?? row.ten_kho ?? undefined,
    kho_den_id: row.kho_den_id != null ? String(row.kho_den_id) : null,
    ten_kho_den: enrich?.ten_kho_den ?? row.ten_kho_den ?? undefined,
    id_nha_cung_cap: row.id_nha_cung_cap != null ? String(row.id_nha_cung_cap) : null,
    ten_nha_cung_cap: enrich?.ten_nha_cung_cap,
    id_khach_hang: row.id_khach_hang != null ? String(row.id_khach_hang) : null,
    ten_khach_hang: enrich?.ten_khach_hang,
    id_don_dat_hang: row.id_don_dat_hang != null ? String(row.id_don_dat_hang) : null,
    so_po_don_dat_hang: enrich?.so_po_don_dat_hang ?? null,
    trang_thai: (row.trang_thai as TrangThaiPhieuKho) || 'Chờ duyệt',
    mo_ta: row.mo_ta ?? undefined,
    trao_doi: row.trao_doi ?? undefined,
    id_nguoi_duyet: row.id_nguoi_duyet != null ? row.id_nguoi_duyet : undefined,
    ten_nguoi_duyet: enrich?.ten_nguoi_duyet,
    nguoi_tao_id: row.nguoi_tao_id ?? undefined,
    ten_nguoi_tao: enrich?.ten_nguoi_tao ?? row.ten_nguoi_tao ?? undefined,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function rowToChiTiet(row: ChiTietDbRow, idPhieuKhoStr: string, enrich?: { ma_hang?: string; ten_danh_muc?: string }): PhieuKhoChiTiet {
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

/** num(null/undefined) -> null, else Number. */
function toNum(s: string | null | undefined): number | null {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

/** Lấy số phiếu tiếp theo theo loại (Option B: RPC dùng bảng counter). Gọi khi tạo phiếu mới. */
export async function getNextSoPhieuSupabase(loai: LoaiPhieuKho): Promise<string> {
  const { data, error } = await supabase.rpc('get_next_so_phieu', { p_loai: loai });
  if (error) throwSupabaseError(error);
  if (typeof data !== 'string') throw new Error('get_next_so_phieu did not return string');
  return data;
}

export async function getAllPhieuKhoSupabase(): Promise<PhieuKho[]> {
  const rows = await fetchAllRows<PhieuKhoSummaryRow>((from, to) =>
    supabase
      .from(VIEW_PHIEU_KHO_SUMMARY)
      .select(PHIEU_KHO_SUMMARY_SELECT)
      .order('ngay', { ascending: false })
      .order('so_phieu', { ascending: false })
      .range(from, to)
  );
  return rows.map((row) => mapPhieuKhoSummaryRowToPhieu(row));
}

export async function getPhieuKhoByIdSupabase(id: string): Promise<PhieuKho | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await supabase
    .from(TABLE_PHIEU)
    .select(PHIEU_KHO_HEADER_ROW_SELECT)
    .eq('id', idNum)
    .maybeSingle();
  if (error) throwSupabaseError(error);
  if (!row) return null;

  const [khoList, doiTacList, employees, ctRows, hangHoaList] = await Promise.all([
    getKhoRef(),
    getDoiTacRef(),
    getEmployeesRef(),
    supabase
      .from(TABLE_CHI_TIET)
      .select(PHIEU_KHO_CHI_TIET_ROW_SELECT)
      .eq('id_phieu_kho', idNum)
      .order('id', { ascending: true })
      .then((r) => r.data ?? []),
    getHangHoaRef(),
  ]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });
  const doiTacMap: Record<string, string> = {};
  doiTacList.forEach((d) => { doiTacMap[d.id] = d.ten_ncc; });
  const nvMap: Record<string, string> = {};
  employees.forEach((e) => { nvMap[e.id] = e.ho_ten; });
  const hangHoaMap: Record<string, { ma_hang: string; ten_danh_muc?: string }> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = { ma_hang: h.ma_hang ?? h.ma_hang_hoa ?? '', ten_danh_muc: h.ten_danh_muc }; });

  const p = row as PhieuKhoDbRow;
  let soPoDon: string | undefined;
  if (p.id_don_dat_hang != null) {
    const { data: dh } = await supabase
      .from('fp_mh_don_dat_hang')
      .select('so_po')
      .eq('id', p.id_don_dat_hang)
      .maybeSingle();
    const raw = (dh as { so_po?: string | null } | null)?.so_po;
    if (raw != null && String(raw).trim() !== '') soPoDon = String(raw).trim();
  }
  const ten_kho = khoMap[String(p.kho_id)] ?? p.ten_kho ?? undefined;
  const ten_kho_den = p.kho_den_id != null ? (khoMap[String(p.kho_den_id)] ?? p.ten_kho_den ?? undefined) : undefined;
  const ten_nha_cung_cap = p.id_nha_cung_cap != null ? doiTacMap[String(p.id_nha_cung_cap)] : undefined;
  const ten_khach_hang = p.id_khach_hang != null ? doiTacMap[String(p.id_khach_hang)] : undefined;
  const ten_nguoi_tao = p.nguoi_tao_id != null ? nvMap[String(p.nguoi_tao_id)] : undefined;
  const ten_nguoi_duyet = p.id_nguoi_duyet != null ? nvMap[String(p.id_nguoi_duyet)] : undefined;
  const phieu = rowToPhieu(p, { ten_kho, ten_kho_den, ten_nha_cung_cap, ten_khach_hang, ten_nguoi_tao, ten_nguoi_duyet, so_po_don_dat_hang: soPoDon });

  const chi_tiet: PhieuKhoChiTiet[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const h = hangHoaMap[String(ct.id_hang_hoa)];
    return rowToChiTiet(ct, id, { ma_hang: h?.ma_hang, ten_danh_muc: h?.ten_danh_muc });
  });
  phieu.chi_tiet = chi_tiet;
  phieu.tong_so_dong = chi_tiet.length;
  phieu.tong_so_luong = chi_tiet.reduce((s, c) => s + (Number(c.so_luong) || 0), 0);
  phieu.tong_tien = chi_tiet.reduce((s, c) => s + (Number(c.thanh_tien) || 0), 0);
  return phieu;
}

export async function createPhieuKhoSupabase(loai: LoaiPhieuKho, data: PhieuKhoFormValues): Promise<PhieuKho> {
  const soPhieu = data.so_phieu.trim();
  const { data: existing } = await supabase.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).eq('loai', loai).maybeSingle();
  if (existing) throw new Error(i18n.t('phieuKho.service.duplicateCode'));

  const [khoList, employees] = await Promise.all([getKhoRef(), getEmployeesRef()]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });
  const nvMap: Record<string, string> = {};
  employees.forEach((e) => { nvMap[e.id] = e.ho_ten; });

  const nguoiTaoId = data.nguoi_tao_id != null ? Number(data.nguoi_tao_id) : null;

  const payload = {
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    loai,
    kho_id: Number(data.kho_id),
    ten_kho: khoMap[String(data.kho_id)] ?? null,
    kho_den_id: loai === 'chuyển' && data.kho_den_id ? Number(data.kho_den_id) : null,
    ten_kho_den: loai === 'chuyển' && data.kho_den_id ? (khoMap[String(data.kho_den_id)] ?? null) : null,
    id_nha_cung_cap: toNum(data.id_nha_cung_cap),
    id_khach_hang: toNum(data.id_khach_hang),
    id_don_dat_hang: loai === 'nhập' ? toNum(data.id_don_dat_hang) : null,
    trang_thai: data.trang_thai,
    mo_ta: data.mo_ta?.trim() || null,
    nguoi_tao_id: nguoiTaoId,
    ten_nguoi_tao: nguoiTaoId != null ? (nvMap[String(nguoiTaoId)] ?? null) : null,
  };

  const { data: inserted, error } = await supabase.from(TABLE_PHIEU).insert(payload).select(PHIEU_KHO_HEADER_ROW_SELECT).single();
  if (error) throwSupabaseError(error);
  const idPhieu = (inserted as PhieuKhoDbRow).id;
  const idStr = String(idPhieu);

  const hangHoaList = await getHangHoaRef();
  const hangHoaMap: Record<string, { ten_hang_hoa: string; don_vi_tinh?: string }> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = { ten_hang_hoa: h.ten_hang_hoa ?? h.ten_hang ?? '', don_vi_tinh: h.don_vi_tinh ?? undefined }; });

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

  const got = await getPhieuKhoByIdSupabase(idStr);
  if (!got) throw new Error(i18n.t('phieuKho.service.notFound'));
  return got;
}

export async function updatePhieuKhoSupabase(id: string, data: PhieuKhoFormValues): Promise<PhieuKho> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKho.service.notFound'));

  const { data: oldRow, error: fetchErr } = await supabase.from(TABLE_PHIEU).select(PHIEU_KHO_HEADER_ROW_SELECT).eq('id', idNum).maybeSingle();
  if (fetchErr || !oldRow) throw new Error(i18n.t('phieuKho.service.notFound'));

  const soPhieu = data.so_phieu.trim();
  const { data: other } = await supabase.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).eq('loai', (oldRow as PhieuKhoDbRow).loai).neq('id', idNum).maybeSingle();
  if (other) throw new Error(i18n.t('phieuKho.service.duplicateCode'));

  const [khoList, employees] = await Promise.all([getKhoRef(), getEmployeesRef()]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });
  const nvMap: Record<string, string> = {};
  employees.forEach((e) => { nvMap[e.id] = e.ho_ten; });

  const loaiDb = (oldRow as PhieuKhoDbRow).loai as LoaiPhieuKho;
  const nguoiTaoId = data.nguoi_tao_id != null ? Number(data.nguoi_tao_id) : null;

  const payload = {
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    kho_id: Number(data.kho_id),
    ten_kho: khoMap[String(data.kho_id)] ?? null,
    kho_den_id: loaiDb === 'chuyển' && data.kho_den_id ? Number(data.kho_den_id) : null,
    ten_kho_den: loaiDb === 'chuyển' && data.kho_den_id ? (khoMap[String(data.kho_den_id)] ?? null) : null,
    id_nha_cung_cap: toNum(data.id_nha_cung_cap),
    id_khach_hang: toNum(data.id_khach_hang),
    id_don_dat_hang: loaiDb === 'nhập' ? toNum(data.id_don_dat_hang) : null,
    trang_thai: data.trang_thai,
    mo_ta: data.mo_ta?.trim() || null,
    nguoi_tao_id: nguoiTaoId,
    ten_nguoi_tao: nguoiTaoId != null ? (nvMap[String(nguoiTaoId)] ?? null) : null,
  };

  const { error: updateErr } = await supabase.from(TABLE_PHIEU).update(payload).eq('id', idNum);
  if (updateErr) throwSupabaseError(updateErr);

  await supabase.from(TABLE_CHI_TIET).delete().eq('id_phieu_kho', idNum);

  const hangHoaList = await getHangHoaRef();
  const hangHoaMap: Record<string, { ten_hang_hoa: string; don_vi_tinh?: string }> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = { ten_hang_hoa: h.ten_hang_hoa ?? h.ten_hang ?? '', don_vi_tinh: h.don_vi_tinh ?? undefined }; });

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

  const got = await getPhieuKhoByIdSupabase(id);
  if (!got) throw new Error(i18n.t('phieuKho.service.notFound'));
  return got;
}

/** Định dạng thời điểm ghi vào cột trao_doi: dd/mm/yyyy hh:mm:ss (24h). */
function formatPhieuKhoTraoDoiTimestamp(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export interface UpdatePhieuKhoTrangThaiOptions {
  ghi_chu?: string;
  id_nguoi_duyet?: number | null;
  /** Tên hiển thị khi ghi dòng trao_doi (ưu tiên hơn map nhân viên lúc ghi). */
  ten_nguoi_duyet_hien_thi?: string;
}

/** Cập nhật chỉ trạng thái, id_nguoi_duyet và trao_doi; không đụng bảng chi tiết. */
export async function updatePhieuKhoTrangThaiSupabase(
  id: string,
  trang_thai: TrangThaiPhieuKho,
  options?: UpdatePhieuKhoTrangThaiOptions
): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKho.service.notFound'));
  const ghi_chu = options?.ghi_chu;
  const idNguoiDuyet =
    options?.id_nguoi_duyet != null && Number.isFinite(options.id_nguoi_duyet) && !Number.isNaN(options.id_nguoi_duyet)
      ? options.id_nguoi_duyet
      : null;

  const { data: row } = await supabase.from(TABLE_PHIEU).select('trao_doi').eq('id', idNum).maybeSingle();
  const existing = (row as { trao_doi?: string } | null)?.trao_doi ?? '';
  const ts = formatPhieuKhoTraoDoiTimestamp();
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

export async function deletePhieuKhoSupabase(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKho.service.notFound'));
  const { error } = await supabase.from(TABLE_PHIEU).delete().eq('id', idNum);
  if (error) throwSupabaseError(error);
}

export async function deletePhieuKhoManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((id) => Number(id)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_PHIEU).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}

export async function getPhieuKhoByDoiTacSupabase(idDoiTac: string, loaiDoiTac: 'nha_cung_cap' | 'khach_hang'): Promise<PhieuKho[]> {
  const idNum = Number(idDoiTac);
  if (Number.isNaN(idNum)) return [];
  const loaiDb: LoaiPhieuKho = loaiDoiTac === 'nha_cung_cap' ? 'nhập' : 'xuất';
  const col = loaiDoiTac === 'nha_cung_cap' ? 'id_nha_cung_cap' : 'id_khach_hang';
  const { data, error } = await supabase
    .from(VIEW_PHIEU_KHO_SUMMARY)
    .select(PHIEU_KHO_SUMMARY_SELECT)
    .eq('loai', loaiDb)
    .eq(col, idNum)
    .order('ngay', { ascending: false })
    .order('so_phieu', { ascending: false });
  if (error) throwSupabaseError(error);
  const rows = (data ?? []) as PhieuKhoSummaryRow[];
  return rows.map((row) => mapPhieuKhoSummaryRowToPhieu(row));
}

/** Cache một lần/session — tránh gọi getKhoRef + getDoiTacRef + getEmployeesRef mỗi lần đổi trang chi tiết phiếu. */
type ChiTietEnrichmentMaps = {
  khoMap: Record<string, string>;
  doiTacMap: Record<string, string>;
  nvMap: Record<string, string>;
};

let chiTietEnrichmentMapsPromise: Promise<ChiTietEnrichmentMaps> | null = null;

async function getChiTietEnrichmentMaps(): Promise<ChiTietEnrichmentMaps> {
  if (!chiTietEnrichmentMapsPromise) {
    chiTietEnrichmentMapsPromise = (async () => {
      const [khoList, doiTacList, employees] = await Promise.all([getKhoRef(), getDoiTacRef(), getEmployeesRef()]);
      const khoMap: Record<string, string> = {};
      khoList.forEach((k) => {
        khoMap[k.id] = k.ten_kho;
      });
      const doiTacMap: Record<string, string> = {};
      doiTacList.forEach((d) => {
        doiTacMap[d.id] = d.ten_ncc;
      });
      const nvMap: Record<string, string> = {};
      employees.forEach((e) => {
        nvMap[e.id] = e.ho_ten;
      });
      return { khoMap, doiTacMap, nvMap };
    })();
  }
  return chiTietEnrichmentMapsPromise;
}

function mapPhieuKhoChiTietFlatViewRows(
  flatRows: PhieuKhoChiTietFlatViewRow[],
  khoMap: Record<string, string>,
  doiTacMap: Record<string, string>,
  nvMap: Record<string, string>
): ChiTietPhieuKhoFlat[] {
  const flat: ChiTietPhieuKhoFlat[] = flatRows.map((r) => {
    const ten_kho = khoMap[String(r.kho_id)] ?? r.ten_kho ?? undefined;
    const ten_kho_den = r.kho_den_id != null ? (khoMap[String(r.kho_den_id)] ?? r.ten_kho_den ?? undefined) : undefined;
    const ten_nha_cung_cap = r.id_nha_cung_cap != null ? doiTacMap[String(r.id_nha_cung_cap)] : undefined;
    const ten_khach_hang = r.id_khach_hang != null ? doiTacMap[String(r.id_khach_hang)] : undefined;
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
      loai: r.loai as LoaiPhieuKho,
      kho_id: String(r.kho_id),
      ten_kho,
      kho_den_id: r.kho_den_id != null ? String(r.kho_den_id) : undefined,
      ten_kho_den,
      id_nha_cung_cap: r.id_nha_cung_cap != null ? String(r.id_nha_cung_cap) : undefined,
      ten_nha_cung_cap,
      id_khach_hang: r.id_khach_hang != null ? String(r.id_khach_hang) : undefined,
      ten_khach_hang,
      id_don_dat_hang: r.id_don_dat_hang != null ? String(r.id_don_dat_hang) : null,
      so_po_don_dat_hang:
        r.so_po_don_dat_hang != null && String(r.so_po_don_dat_hang).trim() !== ''
          ? String(r.so_po_don_dat_hang).trim()
          : null,
      trang_thai: (r.trang_thai as TrangThaiPhieuKho) || 'Chờ duyệt',
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
  flat.sort((a, b) => (b.ngay || '').localeCompare(a.ngay || '') || (a.so_phieu || '').localeCompare(b.so_phieu || '') || (a.ma_hang ?? '').localeCompare(b.ma_hang ?? ''));
  return flat;
}

export async function getChiTietPhieuKhoAllSupabase(): Promise<ChiTietPhieuKhoFlat[]> {
  const [flatRows, maps] = await Promise.all([
    fetchAllRows<PhieuKhoChiTietFlatViewRow>((from, to) =>
      supabase
        .from(VIEW_PHIEU_KHO_CHI_TIET_FLAT)
        .select(PHIEU_KHO_CHI_TIET_FLAT_SELECT)
        .order('ngay', { ascending: false })
        .order('so_phieu', { ascending: false })
        .order('chi_tiet_id', { ascending: false })
        .range(from, to)
    ),
    getChiTietEnrichmentMaps(),
  ]);
  return mapPhieuKhoChiTietFlatViewRows(flatRows, maps.khoMap, maps.doiTacMap, maps.nvMap);
}

const IMPOSSIBLE_NUM_ID = -2147483647;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyScopePhieuKhoSummary(q: any, scope: BranchListScope): any {
  let b = q;
  if (scope.viewAll) return b;
  const own = scope.ownEmployeeIdNum;
  if (!scope.viewByBranch) {
    if (own != null) return b.eq('nguoi_tao_id', own);
    return b.eq('id', IMPOSSIBLE_NUM_ID);
  }
  const ids = scope.allowedKhoNumericIds;
  const parts: string[] = [];
  if (own != null) parts.push(`nguoi_tao_id.eq.${own}`);
  if (ids.length > 0) {
    const inl = `(${ids.join(',')})`;
    parts.push(`kho_id.in.${inl}`);
    parts.push(`kho_den_id.in.${inl}`);
  }
  if (parts.length === 0) return b.eq('id', IMPOSSIBLE_NUM_ID);
  return b.or(parts.join(','));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyScopePhieuKhoChiTietFlat(q: any, scope: BranchListScope): any {
  let b = q;
  if (scope.viewAll) return b;
  const own = scope.ownEmployeeIdNum;
  if (!scope.viewByBranch) {
    if (own != null) return b.eq('phieu_nguoi_tao_id', own);
    return b.eq('phieu_id', IMPOSSIBLE_NUM_ID);
  }
  const ids = scope.allowedKhoNumericIds;
  const parts: string[] = [];
  if (own != null) parts.push(`phieu_nguoi_tao_id.eq.${own}`);
  if (ids.length > 0) {
    const inl = `(${ids.join(',')})`;
    parts.push(`kho_id.in.${inl}`);
    parts.push(`kho_den_id.in.${inl}`);
  }
  if (parts.length === 0) return b.eq('phieu_id', IMPOSSIBLE_NUM_ID);
  return b.or(parts.join(','));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPhieuKhoListQueryToSummarySelect(q: any, query: PhieuKhoListServerQuery): any {
  let b = applyScopePhieuKhoSummary(q, query.scope);
  b = b.eq('loai', query.loaiDb);
  if (query.trangThaiViet.length) b = b.in('trang_thai', query.trangThaiViet);
  if (query.khoIds.length) b = b.in('kho_id', query.khoIds);
  if (query.khoDenIds.length) b = b.in('kho_den_id', query.khoDenIds);
  if (query.ngayFrom) b = b.gte('ngay', query.ngayFrom);
  if (query.ngayTo) b = b.lte('ngay', query.ngayTo);
  if (query.nguoiTaoIds.length) b = b.in('nguoi_tao_id', query.nguoiTaoIds);
  if (query.nguoiDuyetIds.length) b = b.in('id_nguoi_duyet', query.nguoiDuyetIds);
  if (query.doiTacColumn && query.doiTacIds.length) b = b.in(query.doiTacColumn, query.doiTacIds);
  const term = (query.searchTerm ?? '').trim();
  if (term) {
    const esc = term.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pat = postgrestQuotedIlikePattern(`%${esc}%`);
    b = b.or(`so_phieu.ilike.${pat},mo_ta.ilike.${pat},ten_kho.ilike.${pat},ten_kho_den.ilike.${pat},ref_so_po_don_dat_hang.ilike.${pat}`);
  }
  return b;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyChiTietPhieuKhoListQueryToFlatSelect(q: any, query: ChiTietPhieuKhoListServerQuery): any {
  let b = applyScopePhieuKhoChiTietFlat(q, query.scope);
  if (query.loaiDb.length) b = b.in('loai', query.loaiDb);
  if (query.trangThaiViet.length) b = b.in('trang_thai', query.trangThaiViet);
  if (query.khoIds.length) b = b.in('kho_id', query.khoIds);
  if (query.khoDenIds.length) b = b.in('kho_den_id', query.khoDenIds);
  if (query.ngayFrom) b = b.gte('ngay', query.ngayFrom);
  if (query.ngayTo) b = b.lte('ngay', query.ngayTo);
  if (query.nguoiTaoIds.length) b = b.in('phieu_nguoi_tao_id', query.nguoiTaoIds);
  if (query.nguoiDuyetIds.length) b = b.in('id_nguoi_duyet', query.nguoiDuyetIds);
  if (query.doiTacIds.length) {
    const inl = `(${query.doiTacIds.join(',')})`;
    b = b.or(`id_nha_cung_cap.in.${inl},id_khach_hang.in.${inl}`);
  }
  const term = (query.searchTerm ?? '').trim();
  if (term) {
    const esc = term.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pat = postgrestQuotedIlikePattern(`%${esc}%`);
    b = b.or(`so_phieu.ilike.${pat},ten_hang_hoa.ilike.${pat},mo_ta.ilike.${pat},ghi_chu.ilike.${pat},so_po_don_dat_hang.ilike.${pat}`);
  }
  return b;
}

const CHI_TIET_PHIEU_KHO_PAGE_SIZE_DEFAULT = 100;

/** Một trang chi tiết phiếu kho phẳng (server-side). */
export async function getChiTietPhieuKhoPageSupabase(
  page: number,
  pageSize: number = CHI_TIET_PHIEU_KHO_PAGE_SIZE_DEFAULT,
  listQuery?: ChiTietPhieuKhoListServerQuery
): Promise<PaginatedTableResult<ChiTietPhieuKhoFlat>> {
  const [pageResult, maps] = await Promise.all([
    fetchTablePage<PhieuKhoChiTietFlatViewRow>(page, pageSize, async (from, to) => {
      let sel = supabase.from(VIEW_PHIEU_KHO_CHI_TIET_FLAT).select(PHIEU_KHO_CHI_TIET_FLAT_SELECT, { count: 'exact' });
      if (listQuery) sel = applyChiTietPhieuKhoListQueryToFlatSelect(sel, listQuery);
      const res = await sel
        .order('ngay', { ascending: false })
        .order('so_phieu', { ascending: false })
        .order('chi_tiet_id', { ascending: false })
        .range(from, to);
      return { data: res.data as PhieuKhoChiTietFlatViewRow[] | null, error: res.error, count: res.count };
    }),
    getChiTietEnrichmentMaps(),
  ]);
  const data = mapPhieuKhoChiTietFlatViewRows(pageResult.data, maps.khoMap, maps.doiTacMap, maps.nvMap);
  return { data, totalCount: pageResult.totalCount, page: pageResult.page, pageSize: pageResult.pageSize };
}

export async function getLichSuNhapXuatByHangHoaSupabase(id_hang_hoa: string): Promise<LichSuNhapXuatRow[]> {
  const idHhNum = Number(id_hang_hoa);
  if (Number.isNaN(idHhNum)) return [];
  const { data: ctRows } = await supabase.from(TABLE_CHI_TIET).select(PHIEU_KHO_CHI_TIET_ROW_SELECT).eq('id_hang_hoa', idHhNum);
  if (!ctRows?.length) return [];
  const phieuIds = [...new Set((ctRows as ChiTietDbRow[]).map((c) => c.id_phieu_kho))];
  const { data: phieuRows } = await supabase.from(TABLE_PHIEU).select(PHIEU_KHO_HEADER_ROW_SELECT).in('id', phieuIds);
  if (!phieuRows?.length) return [];
  const khoList = await getKhoRef();
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });
  const phieuById = new Map<number, PhieuKhoDbRow>();
  (phieuRows as PhieuKhoDbRow[]).forEach((p) => phieuById.set(p.id, p));
  const rows: LichSuNhapXuatRow[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const p = phieuById.get(ct.id_phieu_kho);
    return {
      id_phieu_kho: String(ct.id_phieu_kho),
      id_chi_tiet: String(ct.id),
      id_hang_hoa: String(ct.id_hang_hoa),
      so_phieu: p?.so_phieu ?? '',
      ngay: p?.ngay ?? '',
      loai: (p?.loai as LoaiPhieuKho) ?? 'nhập',
      so_luong: Number(ct.so_luong),
      don_vi_tinh: ct.don_vi_tinh ?? undefined,
      ghi_chu: ct.ghi_chu ?? undefined,
      ten_kho: p ? (khoMap[String(p.kho_id)] ?? p.ten_kho ?? undefined) : undefined,
      ten_kho_den: p?.kho_den_id != null ? (khoMap[String(p.kho_den_id)] ?? p.ten_kho_den ?? undefined) : undefined,
      kho_id: p != null ? String(p.kho_id) : '',
      kho_den_id: p?.kho_den_id != null ? String(p.kho_den_id) : null,
      tg_tao: p?.tg_tao ?? null,
    };
  });
  return rows.sort((a, b) => {
    const byNgay = (b.ngay || '').localeCompare(a.ngay || '');
    if (byNgay !== 0) return byNgay;
    const byTg = (b.tg_tao || '').localeCompare(a.tg_tao || '');
    if (byTg !== 0) return byTg;
    const byPhieu = (b.so_phieu || '').localeCompare(a.so_phieu || '');
    if (byPhieu !== 0) return byPhieu;
    return (b.id_chi_tiet || '').localeCompare(a.id_chi_tiet || '');
  });
}

export async function getLichSuNhapXuatByKhoSupabase(id_kho: string): Promise<LichSuNhapXuatByKhoRow[]> {
  const idKhoNum = Number(id_kho);
  if (Number.isNaN(idKhoNum)) return [];
  const { data: phieuRows } = await supabase.from(TABLE_PHIEU).select(PHIEU_KHO_HEADER_ROW_SELECT).or(`kho_id.eq.${idKhoNum},kho_den_id.eq.${idKhoNum}`);
  if (!phieuRows?.length) return [];
  const phieuIds = (phieuRows as PhieuKhoDbRow[]).map((p) => p.id);
  const { data: ctRows } = await supabase.from(TABLE_CHI_TIET).select(PHIEU_KHO_CHI_TIET_ROW_SELECT).in('id_phieu_kho', phieuIds);
  if (!ctRows?.length) return [];
  const hangHoaList = await getHangHoaRef();
  const hangHoaMap: Record<string, { ma_hang: string; ten_hang: string }> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = { ma_hang: h.ma_hang ?? '', ten_hang: h.ten_hang ?? '' }; });
  const phieuById = new Map<number, PhieuKhoDbRow>();
  (phieuRows as PhieuKhoDbRow[]).forEach((p) => phieuById.set(p.id, p));
  const khoList = await getKhoRef();
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });

  const rows: LichSuNhapXuatByKhoRow[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const p = phieuById.get(ct.id_phieu_kho);
    const h = hangHoaMap[String(ct.id_hang_hoa)];
    return {
      id_phieu_kho: String(ct.id_phieu_kho),
      id_chi_tiet: String(ct.id),
      id_hang_hoa: String(ct.id_hang_hoa),
      so_phieu: p?.so_phieu ?? '',
      ngay: p?.ngay ?? '',
      loai: (p?.loai as LoaiPhieuKho) ?? 'nhập',
      so_luong: Number(ct.so_luong),
      don_vi_tinh: ct.don_vi_tinh ?? undefined,
      ghi_chu: ct.ghi_chu ?? undefined,
      ten_kho: p ? (khoMap[String(p.kho_id)] ?? p.ten_kho ?? undefined) : undefined,
      ten_kho_den: p?.kho_den_id != null ? (khoMap[String(p.kho_den_id)] ?? p.ten_kho_den ?? undefined) : undefined,
      kho_id: p != null ? String(p.kho_id) : '',
      kho_den_id: p?.kho_den_id != null ? String(p.kho_den_id) : null,
      tg_tao: p?.tg_tao ?? null,
      ma_hang: h?.ma_hang,
      ten_hang: h?.ten_hang ?? ct.ten_hang_hoa ?? undefined,
    };
  });
  return rows.sort((a, b) => {
    const byNgay = (b.ngay || '').localeCompare(a.ngay || '');
    if (byNgay !== 0) return byNgay;
    const byTg = (b.tg_tao || '').localeCompare(a.tg_tao || '');
    if (byTg !== 0) return byTg;
    const byPhieu = (b.so_phieu || '').localeCompare(a.so_phieu || '');
    if (byPhieu !== 0) return byPhieu;
    return (b.id_chi_tiet || '').localeCompare(a.id_chi_tiet || '');
  });
}

/** Một trang danh sách phiếu kho (server-side pagination). */
export async function getPhieuKhoPageSupabase(
  page: number,
  pageSize: number,
  listQuery?: PhieuKhoListServerQuery
): Promise<PaginatedTableResult<PhieuKho>> {
  const pageResult = await fetchTablePage<PhieuKhoSummaryRow>(page, pageSize, async (from, to) => {
    let sel = supabase.from(VIEW_PHIEU_KHO_SUMMARY).select(PHIEU_KHO_SUMMARY_SELECT, { count: 'exact' });
    if (listQuery) sel = applyPhieuKhoListQueryToSummarySelect(sel, listQuery);
    const res = await sel
      .order('ngay', { ascending: false })
      .order('so_phieu', { ascending: false })
      .range(from, to);
    return { data: (res.data ?? null) as PhieuKhoSummaryRow[] | null, error: res.error, count: res.count };
  });
  const data = pageResult.data.map((row) => mapPhieuKhoSummaryRowToPhieu(row));
  return { data, totalCount: pageResult.totalCount, page: pageResult.page, pageSize: pageResult.pageSize };
}

/** Gom tối đa `maxRows` phiếu khớp `listQuery` (lặp trang server) — dùng export. */
export async function fetchAllPhieuKhoForListQuerySupabase(
  listQuery: PhieuKhoListServerQuery,
  pageSize = 500,
  maxRows = 25000
): Promise<PhieuKho[]> {
  const out: PhieuKho[] = [];
  let page = 0;
  while (out.length < maxRows) {
    const { data, totalCount } = await getPhieuKhoPageSupabase(page, pageSize, listQuery);
    out.push(...data);
    if (data.length === 0 || out.length >= totalCount) break;
    page += 1;
  }
  return out;
}

/** Gom tối đa `maxRows` dòng chi tiết phẳng khớp `listQuery` — dùng export. */
export async function fetchAllChiTietPhieuKhoForListQuerySupabase(
  listQuery: ChiTietPhieuKhoListServerQuery,
  pageSize = 500,
  maxRows = 25000
): Promise<ChiTietPhieuKhoFlat[]> {
  const out: ChiTietPhieuKhoFlat[] = [];
  let page = 0;
  while (out.length < maxRows) {
    const { data, totalCount } = await getChiTietPhieuKhoPageSupabase(page, pageSize, listQuery);
    out.push(...data);
    if (data.length === 0 || out.length >= totalCount) break;
    page += 1;
  }
  return out;
}
