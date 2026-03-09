/**
 * Service phiếu kho đọc/ghi Supabase (fp_mh_phieu_kho, fp_mh_phieu_kho_chi_tiet).
 * Trên DB không có FK; app liên kết và enrich với: danh sách kho, danh sách hàng hóa,
 * nhân viên, danh sách đối tác.
 */
import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { PhieuKho, PhieuKhoChiTiet, LoaiPhieuKho, ChiTietPhieuKhoFlat, TrangThaiPhieuKho } from '../core/types';
import type { PhieuKhoFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

/** Dòng lịch sử nhập/xuất/chuyển theo hàng hóa. */
export interface LichSuNhapXuatRow {
  id_phieu_kho: string;
  id_chi_tiet: string;
  so_phieu: string;
  ngay: string;
  loai: LoaiPhieuKho;
  so_luong: number;
  don_vi_tinh?: string;
  ghi_chu?: string;
  ten_kho?: string;
  ten_kho_den?: string;
}

/** Dòng lịch sử theo kho (có thêm ma_hang, ten_hang). */
export interface LichSuNhapXuatByKhoRow extends LichSuNhapXuatRow {
  ma_hang?: string;
  ten_hang?: string;
}
import { getKhoList } from '../../danh-sach-kho/services/kho-service';
import { getAllDoiTac } from '../../danh-sach-doi-tac/services/doi-tac-service';
import { getAllHangHoa } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import { getEmployees } from '../../../he-thong/nhan-vien/services/nhan-vien-service';

const TABLE_PHIEU = 'fp_mh_phieu_kho';
const TABLE_CHI_TIET = 'fp_mh_phieu_kho_chi_tiet';

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
  mo_ta: string | null;
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
  ghi_chu: string | null;
  nguoi_tao_id: number | null;
  ten_nguoi_tao: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToPhieu(row: PhieuKhoDbRow, enrich?: { ten_kho?: string; ten_kho_den?: string; ten_nha_cung_cap?: string; ten_khach_hang?: string; ten_nguoi_tao?: string }): PhieuKho {
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
    trang_thai: (row.trang_thai as TrangThaiPhieuKho) || 'Chờ duyệt',
    mo_ta: row.mo_ta ?? undefined,
    nguoi_tao_id: row.nguoi_tao_id ?? undefined,
    ten_nguoi_tao: enrich?.ten_nguoi_tao ?? row.ten_nguoi_tao ?? undefined,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function rowToChiTiet(row: ChiTietDbRow, idPhieuKhoStr: string, enrich?: { ma_hang?: string }): PhieuKhoChiTiet {
  return {
    id: String(row.id),
    id_phieu_kho: idPhieuKhoStr,
    id_hang_hoa: String(row.id_hang_hoa),
    ten_hang_hoa: row.ten_hang_hoa ?? undefined,
    so_luong: Number(row.so_luong),
    don_gia: row.don_gia != null ? Number(row.don_gia) : undefined,
    thanh_tien: row.thanh_tien != null ? Number(row.thanh_tien) : undefined,
    don_vi_tinh: row.don_vi_tinh ?? undefined,
    ghi_chu: row.ghi_chu ?? undefined,
    nguoi_tao_id: row.nguoi_tao_id ?? undefined,
    ten_nguoi_tao: row.ten_nguoi_tao ?? undefined,
    tg_tao: row.tg_tao ?? undefined,
    tg_cap_nhat: row.tg_cap_nhat ?? undefined,
    ma_hang: enrich?.ma_hang,
    ten_hang: row.ten_hang_hoa ?? undefined,
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
  if (error) throw new Error(error.message);
  if (typeof data !== 'string') throw new Error('get_next_so_phieu did not return string');
  return data;
}

/** Aggregate chi tiết: id_phieu_kho -> { so_dong, tong_tien } */
async function getChiTietAggregates(): Promise<Record<string, { so_dong: number; tong_tien: number }>> {
  const { data: ctRows } = await supabase.from(TABLE_CHI_TIET).select('id_phieu_kho, thanh_tien');
  const agg: Record<string, { so_dong: number; tong_tien: number }> = {};
  (ctRows ?? []).forEach((r: { id_phieu_kho: number; thanh_tien: number | null }) => {
    const key = String(r.id_phieu_kho);
    if (!agg[key]) agg[key] = { so_dong: 0, tong_tien: 0 };
    agg[key].so_dong += 1;
    agg[key].tong_tien += Number(r.thanh_tien) || 0;
  });
  return agg;
}

export async function getAllPhieuKhoSupabase(): Promise<PhieuKho[]> {
  const [rows, khoList, doiTacList, employees, aggregates] = await Promise.all([
    fetchAllRows<PhieuKhoDbRow>((from, to) =>
      supabase.from(TABLE_PHIEU).select('*').order('ngay', { ascending: false }).order('so_phieu', { ascending: false }).range(from, to)
    ),
    getKhoList(),
    getAllDoiTac(),
    getEmployees(),
    getChiTietAggregates(),
  ]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });
  const doiTacMap: Record<string, string> = {};
  doiTacList.forEach((d) => { doiTacMap[d.id] = d.ten_ncc; });
  const nvMap: Record<string, string> = {};
  employees.forEach((e) => { nvMap[e.id] = e.ho_ten; });
  return rows.map((row) => {
    const ten_kho = khoMap[String(row.kho_id)] ?? row.ten_kho ?? undefined;
    const ten_kho_den = row.kho_den_id != null ? (khoMap[String(row.kho_den_id)] ?? row.ten_kho_den ?? undefined) : undefined;
    const ten_nha_cung_cap = row.id_nha_cung_cap != null ? doiTacMap[String(row.id_nha_cung_cap)] : undefined;
    const ten_khach_hang = row.id_khach_hang != null ? doiTacMap[String(row.id_khach_hang)] : undefined;
    const ten_nguoi_tao = row.nguoi_tao_id != null ? nvMap[String(row.nguoi_tao_id)] : undefined;
    const phieu = rowToPhieu(row, { ten_kho, ten_kho_den, ten_nha_cung_cap, ten_khach_hang, ten_nguoi_tao });
    const agg = aggregates[String(row.id)];
    if (agg) {
      phieu.tong_so_dong = agg.so_dong;
      phieu.tong_tien = agg.tong_tien;
    }
    return phieu;
  });
}

export async function getPhieuKhoByIdSupabase(id: string): Promise<PhieuKho | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await supabase
    .from(TABLE_PHIEU)
    .select('*')
    .eq('id', idNum)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const [khoList, doiTacList, employees, ctRows, hangHoaList] = await Promise.all([
    getKhoList(),
    getAllDoiTac(),
    getEmployees(),
    supabase.from(TABLE_CHI_TIET).select('*').eq('id_phieu_kho', idNum).order('id', { ascending: true }).then((r) => r.data ?? []),
    getAllHangHoa(),
  ]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });
  const doiTacMap: Record<string, string> = {};
  doiTacList.forEach((d) => { doiTacMap[d.id] = d.ten_ncc; });
  const nvMap: Record<string, string> = {};
  employees.forEach((e) => { nvMap[e.id] = e.ho_ten; });
  const hangHoaMap: Record<string, { ma_hang: string }> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = { ma_hang: h.ma_hang ?? h.ma_hang_hoa ?? '' }; });

  const p = row as PhieuKhoDbRow;
  const ten_kho = khoMap[String(p.kho_id)] ?? p.ten_kho ?? undefined;
  const ten_kho_den = p.kho_den_id != null ? (khoMap[String(p.kho_den_id)] ?? p.ten_kho_den ?? undefined) : undefined;
  const ten_nha_cung_cap = p.id_nha_cung_cap != null ? doiTacMap[String(p.id_nha_cung_cap)] : undefined;
  const ten_khach_hang = p.id_khach_hang != null ? doiTacMap[String(p.id_khach_hang)] : undefined;
  const ten_nguoi_tao = p.nguoi_tao_id != null ? nvMap[String(p.nguoi_tao_id)] : undefined;
  const phieu = rowToPhieu(p, { ten_kho, ten_kho_den, ten_nha_cung_cap, ten_khach_hang, ten_nguoi_tao });

  const chi_tiet: PhieuKhoChiTiet[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const enrich = hangHoaMap[String(ct.id_hang_hoa)];
    return rowToChiTiet(ct, id, enrich);
  });
  phieu.chi_tiet = chi_tiet;
  return phieu;
}

export async function createPhieuKhoSupabase(loai: LoaiPhieuKho, data: PhieuKhoFormValues): Promise<PhieuKho> {
  const soPhieu = data.so_phieu.trim();
  const { data: existing } = await supabase.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).eq('loai', loai).maybeSingle();
  if (existing) throw new Error(i18n.t('phieuKho.service.duplicateCode'));

  const payload = {
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    loai,
    kho_id: Number(data.kho_id),
    ten_kho: null as string | null,
    kho_den_id: loai === 'chuyển' && data.kho_den_id ? Number(data.kho_den_id) : null,
    ten_kho_den: null as string | null,
    id_nha_cung_cap: toNum(data.id_nha_cung_cap),
    id_khach_hang: toNum(data.id_khach_hang),
    trang_thai: data.trang_thai,
    mo_ta: data.mo_ta?.trim() || null,
    nguoi_tao_id: data.nguoi_tao_id != null ? Number(data.nguoi_tao_id) : null,
    ten_nguoi_tao: null as string | null,
  };

  const { data: inserted, error } = await supabase.from(TABLE_PHIEU).insert(payload).select('*').single();
  if (error) throw new Error(error.message);
  const idPhieu = (inserted as PhieuKhoDbRow).id;
  const idStr = String(idPhieu);

  const hangHoaList = await getAllHangHoa();
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
        ghi_chu: c.ghi_chu?.trim() || null,
        nguoi_tao_id: null as number | null,
        ten_nguoi_tao: null as string | null,
      };
    });
    const { error: errCt } = await supabase.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throw new Error(errCt.message);
  }

  const got = await getPhieuKhoByIdSupabase(idStr);
  if (!got) throw new Error(i18n.t('phieuKho.service.notFound'));
  return got;
}

export async function updatePhieuKhoSupabase(id: string, data: PhieuKhoFormValues): Promise<PhieuKho> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKho.service.notFound'));

  const { data: oldRow, error: fetchErr } = await supabase.from(TABLE_PHIEU).select('*').eq('id', idNum).maybeSingle();
  if (fetchErr || !oldRow) throw new Error(i18n.t('phieuKho.service.notFound'));

  const soPhieu = data.so_phieu.trim();
  const { data: other } = await supabase.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).eq('loai', (oldRow as PhieuKhoDbRow).loai).neq('id', idNum).maybeSingle();
  if (other) throw new Error(i18n.t('phieuKho.service.duplicateCode'));

  const payload = {
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    kho_id: Number(data.kho_id),
    kho_den_id: (oldRow as PhieuKhoDbRow).loai === 'chuyển' && data.kho_den_id ? Number(data.kho_den_id) : null,
    id_nha_cung_cap: toNum(data.id_nha_cung_cap),
    id_khach_hang: toNum(data.id_khach_hang),
    trang_thai: data.trang_thai,
    mo_ta: data.mo_ta?.trim() || null,
    nguoi_tao_id: data.nguoi_tao_id != null ? Number(data.nguoi_tao_id) : null,
  };

  const { error: updateErr } = await supabase.from(TABLE_PHIEU).update(payload).eq('id', idNum);
  if (updateErr) throw new Error(updateErr.message);

  await supabase.from(TABLE_CHI_TIET).delete().eq('id_phieu_kho', idNum);

  const hangHoaList = await getAllHangHoa();
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
        ghi_chu: c.ghi_chu?.trim() || null,
        nguoi_tao_id: null as number | null,
        ten_nguoi_tao: null as string | null,
      };
    });
    const { error: errCt } = await supabase.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throw new Error(errCt.message);
  }

  const got = await getPhieuKhoByIdSupabase(id);
  if (!got) throw new Error(i18n.t('phieuKho.service.notFound'));
  return got;
}

/** Cập nhật chỉ trạng thái (và ghi chú duyệt); dùng cho nút Duyệt trong detail. */
export async function updatePhieuKhoTrangThaiSupabase(
  id: string,
  trang_thai: TrangThaiPhieuKho,
  ghi_chu?: string
): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKho.service.notFound'));
  const { data: row } = await supabase.from(TABLE_PHIEU).select('mo_ta').eq('id', idNum).maybeSingle();
  const existingMoTa = (row as { mo_ta?: string } | null)?.mo_ta ?? '';
  const newMoTa = ghi_chu?.trim()
    ? (existingMoTa ? existingMoTa + '\n[Ghi chú duyệt] ' + ghi_chu.trim() : '[Ghi chú duyệt] ' + ghi_chu.trim())
    : existingMoTa;
  const { error } = await supabase
    .from(TABLE_PHIEU)
    .update({ trang_thai, mo_ta: newMoTa || null })
    .eq('id', idNum);
  if (error) throw new Error(error.message);
}

export async function deletePhieuKhoSupabase(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKho.service.notFound'));
  const { error } = await supabase.from(TABLE_PHIEU).delete().eq('id', idNum);
  if (error) throw new Error(error.message);
}

export async function deletePhieuKhoManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((id) => Number(id)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_PHIEU).delete().in('id', numIds);
  if (error) throw new Error(error.message);
}

export async function getPhieuKhoByDoiTacSupabase(idDoiTac: string, loaiDoiTac: 'nha_cung_cap' | 'khach_hang'): Promise<PhieuKho[]> {
  const all = await getAllPhieuKhoSupabase();
  const filtered =
    loaiDoiTac === 'nha_cung_cap'
      ? all.filter((p) => p.loai === 'nhập' && p.id_nha_cung_cap === idDoiTac)
      : all.filter((p) => p.loai === 'xuất' && p.id_khach_hang === idDoiTac);
  return filtered.sort((a, b) => (b.ngay || '').localeCompare(a.ngay || '') || a.so_phieu.localeCompare(b.so_phieu));
}

export async function getChiTietPhieuKhoAllSupabase(): Promise<ChiTietPhieuKhoFlat[]> {
  const [ctRows, phieuRows, khoList, doiTacList, hangHoaList] = await Promise.all([
    fetchAllRows<ChiTietDbRow>((from, to) =>
      supabase.from(TABLE_CHI_TIET).select('*').order('id', { ascending: false }).range(from, to)
    ),
    fetchAllRows<PhieuKhoDbRow>((from, to) =>
      supabase.from(TABLE_PHIEU).select('*').order('ngay', { ascending: false }).order('so_phieu', { ascending: false }).range(from, to)
    ),
    getKhoList(),
    getAllDoiTac(),
    getAllHangHoa(),
  ]);
  const phieuById = new Map<number, PhieuKhoDbRow>();
  phieuRows.forEach((p) => phieuById.set(p.id, p));
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });
  const doiTacMap: Record<string, string> = {};
  doiTacList.forEach((d) => { doiTacMap[d.id] = d.ten_ncc; });
  const hangHoaMap: Record<string, { ma_hang: string }> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = { ma_hang: h.ma_hang ?? h.ma_hang_hoa ?? '' }; });

  const flat: ChiTietPhieuKhoFlat[] = [];
  for (const ct of ctRows) {
    const p = phieuById.get(ct.id_phieu_kho);
    if (!p) continue;
    const ten_kho = khoMap[String(p.kho_id)] ?? p.ten_kho ?? undefined;
    const ten_kho_den = p.kho_den_id != null ? (khoMap[String(p.kho_den_id)] ?? p.ten_kho_den ?? undefined) : undefined;
    const ten_nha_cung_cap = p.id_nha_cung_cap != null ? doiTacMap[String(p.id_nha_cung_cap)] : undefined;
    const ten_khach_hang = p.id_khach_hang != null ? doiTacMap[String(p.id_khach_hang)] : undefined;
    const enrich = hangHoaMap[String(ct.id_hang_hoa)];
    flat.push({
      id: String(ct.id),
      id_phieu_kho: String(p.id),
      so_phieu: p.so_phieu,
      ngay: p.ngay,
      loai: p.loai as LoaiPhieuKho,
      kho_id: String(p.kho_id),
      ten_kho,
      kho_den_id: p.kho_den_id != null ? String(p.kho_den_id) : undefined,
      ten_kho_den,
      id_nha_cung_cap: p.id_nha_cung_cap != null ? String(p.id_nha_cung_cap) : undefined,
      ten_nha_cung_cap,
      id_khach_hang: p.id_khach_hang != null ? String(p.id_khach_hang) : undefined,
      ten_khach_hang,
      trang_thai: (p.trang_thai as TrangThaiPhieuKho) || 'Chờ duyệt',
      id_hang_hoa: String(ct.id_hang_hoa),
      ten_hang_hoa: ct.ten_hang_hoa ?? undefined,
      ma_hang: enrich?.ma_hang,
      ten_hang: ct.ten_hang_hoa ?? undefined,
      so_luong: Number(ct.so_luong),
      don_gia: ct.don_gia != null ? Number(ct.don_gia) : undefined,
      thanh_tien: ct.thanh_tien != null ? Number(ct.thanh_tien) : undefined,
      don_vi_tinh: ct.don_vi_tinh ?? undefined,
      ghi_chu: ct.ghi_chu ?? undefined,
    });
  }
  flat.sort((a, b) => (b.ngay || '').localeCompare(a.ngay || '') || (a.so_phieu || '').localeCompare(b.so_phieu || '') || (a.ma_hang ?? '').localeCompare(b.ma_hang ?? ''));
  return flat;
}

export async function getLichSuNhapXuatByHangHoaSupabase(id_hang_hoa: string): Promise<LichSuNhapXuatRow[]> {
  const idHhNum = Number(id_hang_hoa);
  if (Number.isNaN(idHhNum)) return [];
  const { data: ctRows } = await supabase.from(TABLE_CHI_TIET).select('*').eq('id_hang_hoa', idHhNum);
  if (!ctRows?.length) return [];
  const phieuIds = [...new Set((ctRows as ChiTietDbRow[]).map((c) => c.id_phieu_kho))];
  const { data: phieuRows } = await supabase.from(TABLE_PHIEU).select('*').in('id', phieuIds);
  if (!phieuRows?.length) return [];
  const khoList = await getKhoList();
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });
  const phieuById = new Map<number, PhieuKhoDbRow>();
  (phieuRows as PhieuKhoDbRow[]).forEach((p) => phieuById.set(p.id, p));
  const rows: LichSuNhapXuatRow[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const p = phieuById.get(ct.id_phieu_kho);
    return {
      id_phieu_kho: String(ct.id_phieu_kho),
      id_chi_tiet: String(ct.id),
      so_phieu: p?.so_phieu ?? '',
      ngay: p?.ngay ?? '',
      loai: (p?.loai as LoaiPhieuKho) ?? 'nhập',
      so_luong: Number(ct.so_luong),
      don_vi_tinh: ct.don_vi_tinh ?? undefined,
      ghi_chu: ct.ghi_chu ?? undefined,
      ten_kho: p ? (khoMap[String(p.kho_id)] ?? p.ten_kho ?? undefined) : undefined,
      ten_kho_den: p?.kho_den_id != null ? (khoMap[String(p.kho_den_id)] ?? p.ten_kho_den ?? undefined) : undefined,
    };
  });
  return rows.sort((a, b) => (b.ngay || '').localeCompare(a.ngay || '') || (a.so_phieu || '').localeCompare(b.so_phieu || ''));
}

export async function getLichSuNhapXuatByKhoSupabase(id_kho: string): Promise<LichSuNhapXuatByKhoRow[]> {
  const idKhoNum = Number(id_kho);
  if (Number.isNaN(idKhoNum)) return [];
  const { data: phieuRows } = await supabase.from(TABLE_PHIEU).select('*').or(`kho_id.eq.${idKhoNum},kho_den_id.eq.${idKhoNum}`);
  if (!phieuRows?.length) return [];
  const phieuIds = (phieuRows as PhieuKhoDbRow[]).map((p) => p.id);
  const { data: ctRows } = await supabase.from(TABLE_CHI_TIET).select('*').in('id_phieu_kho', phieuIds);
  if (!ctRows?.length) return [];
  const hangHoaList = await getAllHangHoa();
  const hangHoaMap: Record<string, { ma_hang: string; ten_hang: string }> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = { ma_hang: h.ma_hang ?? '', ten_hang: h.ten_hang ?? '' }; });
  const phieuById = new Map<number, PhieuKhoDbRow>();
  (phieuRows as PhieuKhoDbRow[]).forEach((p) => phieuById.set(p.id, p));
  const khoList = await getKhoList();
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });

  const rows: LichSuNhapXuatByKhoRow[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const p = phieuById.get(ct.id_phieu_kho);
    const h = hangHoaMap[String(ct.id_hang_hoa)];
    return {
      id_phieu_kho: String(ct.id_phieu_kho),
      id_chi_tiet: String(ct.id),
      so_phieu: p?.so_phieu ?? '',
      ngay: p?.ngay ?? '',
      loai: (p?.loai as LoaiPhieuKho) ?? 'nhập',
      so_luong: Number(ct.so_luong),
      don_vi_tinh: ct.don_vi_tinh ?? undefined,
      ghi_chu: ct.ghi_chu ?? undefined,
      ten_kho: p ? (khoMap[String(p.kho_id)] ?? p.ten_kho ?? undefined) : undefined,
      ten_kho_den: p?.kho_den_id != null ? (khoMap[String(p.kho_den_id)] ?? p.ten_kho_den ?? undefined) : undefined,
      ma_hang: h?.ma_hang,
      ten_hang: h?.ten_hang ?? ct.ten_hang_hoa ?? undefined,
    };
  });
  return rows.sort((a, b) => (b.ngay || '').localeCompare(a.ngay || '') || (a.so_phieu || '').localeCompare(b.so_phieu || ''));
}
