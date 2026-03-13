/**
 * Service phiếu đề xuất vật tư – đọc/ghi Supabase (fp_mh_phieu_de_xuat_vat_tu, fp_mh_phieu_de_xuat_vat_tu_chi_tiet).
 */
import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { PhieuDeXuatVatTu, PhieuDeXuatVatTuChiTiet, PhieuDeXuatVatTuChiTietRow } from '../core/types';
import type { PhieuDeXuatVatTuFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getKhoList } from '../../danh-sach-kho/services/kho-service';
import { getAllHangHoa } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import { getEmployees } from '../../../he-thong/nhan-vien/services/nhan-vien-service';

const TABLE_PHIEU = 'fp_mh_phieu_de_xuat_vat_tu';
const TABLE_CHI_TIET = 'fp_mh_phieu_de_xuat_vat_tu_chi_tiet';

interface PhieuDbRow {
  id: number;
  so_phieu: string;
  ngay: string;
  ngay_can: string;
  id_noi_de_xuat: number;
  id_nguoi_de_xuat: number;
  id_nguoi_duyet: number | null;
  ghi_chu: string | null;
  trang_thai: string;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface ChiTietDbRow {
  id: number;
  id_phieu_de_xuat_vat_tu: number;
  id_hang_hoa: number;
  so_luong: number;
  don_vi_tinh: string | null;
  thong_so: string | null;
  ghi_chu: string | null;
}

/** Hàng đầy đủ từ fp_mh_phieu_de_xuat_vat_tu_chi_tiet (có cột kéo từ phiếu). */
interface ChiTietFullDbRow extends ChiTietDbRow {
  so_phieu: string | null;
  ngay: string | null;
  ngay_can: string | null;
  ten_noi_de_xuat: string | null;
  ten_nguoi_de_xuat: string | null;
  ten_nguoi_duyet: string | null;
  trang_thai_phieu: string | null;
}

function toNum(s: string | null | undefined): number | null {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function rowToPhieu(
  row: PhieuDbRow,
  enrich?: { ten_noi_de_xuat?: string; ten_nguoi_de_xuat?: string; ma_nguoi_de_xuat?: string; ten_nguoi_duyet?: string | null; ma_nguoi_duyet?: string | null }
): PhieuDeXuatVatTu {
  return {
    id: String(row.id),
    so_phieu: row.so_phieu ?? '',
    ngay: row.ngay ?? '',
    ngay_can: row.ngay_can ?? '',
    id_noi_de_xuat: String(row.id_noi_de_xuat),
    ten_noi_de_xuat: enrich?.ten_noi_de_xuat,
    id_nguoi_de_xuat: String(row.id_nguoi_de_xuat),
    ten_nguoi_de_xuat: enrich?.ten_nguoi_de_xuat,
    ma_nguoi_de_xuat: enrich?.ma_nguoi_de_xuat,
    id_nguoi_duyet: row.id_nguoi_duyet != null ? String(row.id_nguoi_duyet) : null,
    ten_nguoi_duyet: enrich?.ten_nguoi_duyet ?? null,
    ma_nguoi_duyet: enrich?.ma_nguoi_duyet ?? null,
    ghi_chu: row.ghi_chu ?? undefined,
    trang_thai: (row.trang_thai as PhieuDeXuatVatTu['trang_thai']) || 'Chờ duyệt',
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function rowToChiTiet(row: ChiTietDbRow, idPhieuStr: string, enrich?: { ma_hang?: string; ten_hang?: string }): PhieuDeXuatVatTuChiTiet {
  return {
    id: String(row.id),
    id_phieu_de_xuat_vat_tu: idPhieuStr,
    id_hang_hoa: String(row.id_hang_hoa),
    so_luong: Number(row.so_luong),
    don_vi_tinh: row.don_vi_tinh ?? undefined,
    thong_so: row.thong_so ?? undefined,
    ghi_chu: row.ghi_chu ?? undefined,
    ma_hang: enrich?.ma_hang,
    ten_hang: enrich?.ten_hang,
  };
}

export async function getAllPhieuDeXuatVatTuSupabase(): Promise<PhieuDeXuatVatTu[]> {
  const [rows, khoList, employees] = await Promise.all([
    fetchAllRows<PhieuDbRow>((from, to) =>
      supabase
        .from(TABLE_PHIEU)
        .select('*')
        .order('ngay', { ascending: false })
        .order('so_phieu', { ascending: false })
        .range(from, to)
    ),
    getKhoList(),
    getEmployees(),
  ]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => {
    khoMap[k.id] = k.ten_kho;
  });
  const nvMap: Record<string, { ho_ten: string; ma_nhan_vien: string }> = {};
  employees.forEach((e) => {
    nvMap[e.id] = { ho_ten: e.ho_ten, ma_nhan_vien: e.ma_nhan_vien ?? '' };
  });
  return rows.map((row) => {
    const ten_noi_de_xuat = khoMap[String(row.id_noi_de_xuat)];
    const ten_nguoi_de_xuat = nvMap[String(row.id_nguoi_de_xuat)]?.ho_ten;
    const ma_nguoi_de_xuat = nvMap[String(row.id_nguoi_de_xuat)]?.ma_nhan_vien;
    const ten_nguoi_duyet = row.id_nguoi_duyet != null ? nvMap[String(row.id_nguoi_duyet)]?.ho_ten ?? null : null;
    const ma_nguoi_duyet = row.id_nguoi_duyet != null ? nvMap[String(row.id_nguoi_duyet)]?.ma_nhan_vien ?? null : null;
    return rowToPhieu(row, { ten_noi_de_xuat, ten_nguoi_de_xuat, ma_nguoi_de_xuat, ten_nguoi_duyet, ma_nguoi_duyet });
  });
}

export async function getPhieuDeXuatVatTuByIdSupabase(id: string): Promise<PhieuDeXuatVatTu | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await supabase
    .from(TABLE_PHIEU)
    .select('*')
    .eq('id', idNum)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const [khoList, employees, ctRows, hangHoaList] = await Promise.all([
    getKhoList(),
    getEmployees(),
    supabase
      .from(TABLE_CHI_TIET)
      .select('id, id_phieu_de_xuat_vat_tu, id_hang_hoa, so_luong, don_vi_tinh, thong_so, ghi_chu')
      .eq('id_phieu_de_xuat_vat_tu', idNum)
      .order('id', { ascending: true })
      .then((r) => r.data ?? []),
    getAllHangHoa(),
  ]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => {
    khoMap[k.id] = k.ten_kho;
  });
  const nvMap: Record<string, { ho_ten: string; ma_nhan_vien: string }> = {};
  employees.forEach((e) => {
    nvMap[e.id] = { ho_ten: e.ho_ten, ma_nhan_vien: e.ma_nhan_vien ?? '' };
  });
  const hangHoaMap: Record<string, { ma_hang: string; ten_hang: string }> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = { ma_hang: h.ma_hang ?? h.ma_hang_hoa ?? '', ten_hang: h.ten_hang_hoa ?? h.ten_hang ?? '' };
  });

  const p = row as PhieuDbRow;
  const ten_noi_de_xuat = khoMap[String(p.id_noi_de_xuat)];
  const ten_nguoi_de_xuat = nvMap[String(p.id_nguoi_de_xuat)]?.ho_ten;
  const ma_nguoi_de_xuat = nvMap[String(p.id_nguoi_de_xuat)]?.ma_nhan_vien;
  const ten_nguoi_duyet = p.id_nguoi_duyet != null ? nvMap[String(p.id_nguoi_duyet)]?.ho_ten ?? null : null;
  const ma_nguoi_duyet = p.id_nguoi_duyet != null ? nvMap[String(p.id_nguoi_duyet)]?.ma_nhan_vien ?? null : null;
  const phieu = rowToPhieu(p, { ten_noi_de_xuat, ten_nguoi_de_xuat, ma_nguoi_de_xuat, ten_nguoi_duyet, ma_nguoi_duyet });

  const chi_tiet: PhieuDeXuatVatTuChiTiet[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const enrich = hangHoaMap[String(ct.id_hang_hoa)];
    return rowToChiTiet(ct, id, enrich);
  });
  phieu.chi_tiet = chi_tiet;
  return phieu;
}

export async function createPhieuDeXuatVatTuSupabase(data: PhieuDeXuatVatTuFormValues): Promise<PhieuDeXuatVatTu> {
  const soPhieu = data.so_phieu.trim();
  const { data: existing } = await supabase.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).maybeSingle();
  if (existing) throw new Error(i18n.t('phieuDeXuatVatTu.service.duplicateCode'));

  const payload = {
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    ngay_can: data.ngay_can.trim(),
    id_noi_de_xuat: Number(data.id_noi_de_xuat),
    id_nguoi_de_xuat: Number(data.id_nguoi_de_xuat),
    id_nguoi_duyet: toNum(data.id_nguoi_duyet),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { data: inserted, error } = await supabase.from(TABLE_PHIEU).insert(payload).select('*').single();
  if (error) throw new Error(error.message);
  const idPhieu = (inserted as PhieuDbRow).id;
  const idStr = String(idPhieu);

  const hangHoaList = await getAllHangHoa();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = h.don_vi_tinh ?? '';
  });

  const chiTietPayload = (data.chi_tiet ?? []).filter((ct) => ct.id_hang_hoa?.trim() && Number(ct.so_luong) > 0);
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => ({
      id_phieu_de_xuat_vat_tu: idPhieu,
      id_hang_hoa: Number(c.id_hang_hoa),
      so_luong: Number(c.so_luong),
      don_vi_tinh: hangHoaMap[c.id_hang_hoa.trim()] ?? null,
      thong_so: c.thong_so?.trim() || null,
      ghi_chu: c.ghi_chu?.trim() || null,
    }));
    const { error: errCt } = await supabase.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throw new Error(errCt.message);
  }

  const got = await getPhieuDeXuatVatTuByIdSupabase(idStr);
  if (!got) throw new Error(i18n.t('phieuDeXuatVatTu.service.notFound'));
  return got;
}

export async function updatePhieuDeXuatVatTuSupabase(id: string, data: PhieuDeXuatVatTuFormValues): Promise<PhieuDeXuatVatTu> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuDeXuatVatTu.service.notFound'));

  const { data: oldRow, error: fetchErr } = await supabase.from(TABLE_PHIEU).select('*').eq('id', idNum).maybeSingle();
  if (fetchErr || !oldRow) throw new Error(i18n.t('phieuDeXuatVatTu.service.notFound'));

  const soPhieu = data.so_phieu.trim();
  const { data: other } = await supabase.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).neq('id', idNum).maybeSingle();
  if (other) throw new Error(i18n.t('phieuDeXuatVatTu.service.duplicateCode'));

  const payload = {
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    ngay_can: data.ngay_can.trim(),
    id_noi_de_xuat: Number(data.id_noi_de_xuat),
    id_nguoi_de_xuat: Number(data.id_nguoi_de_xuat),
    id_nguoi_duyet: toNum(data.id_nguoi_duyet),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { error: updateErr } = await supabase.from(TABLE_PHIEU).update(payload).eq('id', idNum);
  if (updateErr) throw new Error(updateErr.message);

  await supabase.from(TABLE_CHI_TIET).delete().eq('id_phieu_de_xuat_vat_tu', idNum);

  const hangHoaList = await getAllHangHoa();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = h.don_vi_tinh ?? '';
  });

  const chiTietPayload = (data.chi_tiet ?? []).filter((ct) => ct.id_hang_hoa?.trim() && Number(ct.so_luong) > 0);
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => ({
      id_phieu_de_xuat_vat_tu: idNum,
      id_hang_hoa: Number(c.id_hang_hoa),
      so_luong: Number(c.so_luong),
      don_vi_tinh: hangHoaMap[c.id_hang_hoa.trim()] ?? null,
      thong_so: c.thong_so?.trim() || null,
      ghi_chu: c.ghi_chu?.trim() || null,
    }));
    const { error: errCt } = await supabase.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throw new Error(errCt.message);
  }

  const got = await getPhieuDeXuatVatTuByIdSupabase(id);
  if (!got) throw new Error(i18n.t('phieuDeXuatVatTu.service.notFound'));
  return got;
}

export async function deletePhieuDeXuatVatTuSupabase(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuDeXuatVatTu.service.notFound'));
  const { error } = await supabase.from(TABLE_PHIEU).delete().eq('id', idNum);
  if (error) throw new Error(error.message);
}

export async function deletePhieuDeXuatVatTuManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_PHIEU).delete().in('id', numIds);
  if (error) throw new Error(error.message);
}

/** Lấy toàn bộ dòng chi tiết từ bảng fp_mh_phieu_de_xuat_vat_tu_chi_tiet (phục vụ tab Chi tiết). */
export async function getAllPhieuDeXuatVatTuChiTietSupabase(): Promise<PhieuDeXuatVatTuChiTietRow[]> {
  const [rows, hangHoaList] = await Promise.all([
    fetchAllRows<ChiTietFullDbRow>((from, to) =>
      supabase
        .from(TABLE_CHI_TIET)
        .select('*')
        .order('id_phieu_de_xuat_vat_tu', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)
    ),
    getAllHangHoa(),
  ]);
  const hangHoaMap: Record<string, { ma_hang: string; ten_hang: string }> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = { ma_hang: h.ma_hang ?? h.ma_hang_hoa ?? '', ten_hang: h.ten_hang_hoa ?? h.ten_hang ?? '' };
  });
  return rows.map((row) => {
    const enrich = hangHoaMap[String(row.id_hang_hoa)];
    return {
      id: String(row.id),
      id_phieu_de_xuat_vat_tu: String(row.id_phieu_de_xuat_vat_tu),
      so_phieu: row.so_phieu ?? null,
      ngay: row.ngay ?? null,
      ngay_can: row.ngay_can ?? null,
      ten_noi_de_xuat: row.ten_noi_de_xuat ?? null,
      ten_nguoi_de_xuat: row.ten_nguoi_de_xuat ?? null,
      ten_nguoi_duyet: row.ten_nguoi_duyet ?? null,
      trang_thai_phieu: row.trang_thai_phieu ?? null,
      id_hang_hoa: String(row.id_hang_hoa),
      ma_hang: enrich?.ma_hang,
      ten_hang: enrich?.ten_hang,
      so_luong: Number(row.so_luong),
      don_vi_tinh: row.don_vi_tinh ?? null,
      thong_so: row.thong_so ?? null,
      ghi_chu: row.ghi_chu ?? null,
    };
  });
}
