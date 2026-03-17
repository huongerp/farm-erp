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
const RPC_NEXT_SO_PHIEU = 'get_next_so_phieu_phieu_de_xuat_vat_tu';

export interface NextSoPhieuConfig {
  tien_to_so_phieu: string;
  do_dai_phan_so: number;
}

/** Gọi RPC Supabase lấy số thứ tự tiếp theo, format thành mã phiếu (tiền tố + pad). Nguồn sự thật duy nhất, tránh trùng khi nhiều user. */
export async function getNextSoPhieuPhieuDeXuatVatTuRpc(config: NextSoPhieuConfig): Promise<string> {
  const { data, error } = await supabase.rpc(RPC_NEXT_SO_PHIEU);
  if (error) throw new Error(error.message);
  const nextNum = Number(data);
  if (Number.isNaN(nextNum) || nextNum < 1) throw new Error('Invalid next number from RPC');
  const padded = String(nextNum).padStart(config.do_dai_phan_so, '0');
  return `${config.tien_to_so_phieu || ''}${padded}`;
}

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
  id_tien_do_mh: number | null;
  ten_tien_do_mh: string | null;
  trao_doi: string | null;
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
    id_tien_do_mh: row.id_tien_do_mh != null ? String(row.id_tien_do_mh) : null,
    ten_tien_do_mh: row.ten_tien_do_mh ?? null,
    trao_doi: row.trao_doi ?? null,
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
      .select('id, id_phieu_de_xuat_vat_tu, id_hang_hoa, so_luong, don_vi_tinh, thong_so, ghi_chu, id_tien_do_mh, ten_tien_do_mh, trao_doi')
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

  const [hangHoaList, khoList, employees] = await Promise.all([
    getAllHangHoa(),
    getKhoList(),
    getEmployees(),
  ]);
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = h.don_vi_tinh ?? '';
  });
  const tenNoiDeXuat = khoList.find((k) => String(k.id) === String(data.id_noi_de_xuat))?.ten_kho ?? null;
  const tenNguoiDeXuat = employees.find((e) => String(e.id) === String(data.id_nguoi_de_xuat))?.ho_ten ?? null;
  const tenNguoiDuyet = data.id_nguoi_duyet
    ? (employees.find((e) => String(e.id) === String(data.id_nguoi_duyet))?.ho_ten ?? null)
    : null;

  const chiTietPayload = (data.chi_tiet ?? []).filter((ct) => ct.id_hang_hoa?.trim() && Number(ct.so_luong) > 0);
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => ({
      id_phieu_de_xuat_vat_tu: idPhieu,
      id_hang_hoa: Number(c.id_hang_hoa),
      so_luong: Number(c.so_luong),
      don_vi_tinh: hangHoaMap[c.id_hang_hoa.trim()] ?? null,
      thong_so: c.thong_so?.trim() || null,
      ghi_chu: c.ghi_chu?.trim() || null,
      id_tien_do_mh: c.id_tien_do_mh ? Number(c.id_tien_do_mh) : null,
      ten_tien_do_mh: c.ten_tien_do_mh?.trim() || null,
      trao_doi: c.trao_doi?.trim() || null,
      so_phieu: soPhieu,
      ngay: data.ngay.trim() || null,
      ngay_can: data.ngay_can.trim() || null,
      ten_noi_de_xuat: tenNoiDeXuat,
      ten_nguoi_de_xuat: tenNguoiDeXuat,
      ten_nguoi_duyet: tenNguoiDuyet,
      trang_thai_phieu: data.trang_thai,
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

  const [hangHoaList, khoList, employees] = await Promise.all([
    getAllHangHoa(),
    getKhoList(),
    getEmployees(),
  ]);
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = h.don_vi_tinh ?? '';
  });
  const tenNoiDeXuat = khoList.find((k) => String(k.id) === String(data.id_noi_de_xuat))?.ten_kho ?? null;
  const tenNguoiDeXuat = employees.find((e) => String(e.id) === String(data.id_nguoi_de_xuat))?.ho_ten ?? null;
  const tenNguoiDuyet = data.id_nguoi_duyet
    ? (employees.find((e) => String(e.id) === String(data.id_nguoi_duyet))?.ho_ten ?? null)
    : null;

  const chiTietPayload = (data.chi_tiet ?? []).filter((ct) => ct.id_hang_hoa?.trim() && Number(ct.so_luong) > 0);
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => ({
      id_phieu_de_xuat_vat_tu: idNum,
      id_hang_hoa: Number(c.id_hang_hoa),
      so_luong: Number(c.so_luong),
      don_vi_tinh: hangHoaMap[c.id_hang_hoa.trim()] ?? null,
      thong_so: c.thong_so?.trim() || null,
      ghi_chu: c.ghi_chu?.trim() || null,
      id_tien_do_mh: c.id_tien_do_mh ? Number(c.id_tien_do_mh) : null,
      ten_tien_do_mh: c.ten_tien_do_mh?.trim() || null,
      trao_doi: c.trao_doi?.trim() || null,
      so_phieu: soPhieu,
      ngay: data.ngay.trim() || null,
      ngay_can: data.ngay_can.trim() || null,
      ten_noi_de_xuat: tenNoiDeXuat,
      ten_nguoi_de_xuat: tenNguoiDeXuat,
      ten_nguoi_duyet: tenNguoiDuyet,
      trang_thai_phieu: data.trang_thai,
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

/** Lấy toàn bộ dòng chi tiết từ bảng fp_mh_phieu_de_xuat_vat_tu_chi_tiet (phục vụ tab Chi tiết). Làm giàu ten_noi_de_xuat, ten_nguoi_de_xuat, ten_nguoi_duyet từ phiếu nếu chi tiết chưa có. */
export async function getAllPhieuDeXuatVatTuChiTietSupabase(): Promise<PhieuDeXuatVatTuChiTietRow[]> {
  const [rows, hangHoaList, khoList, employees] = await Promise.all([
    fetchAllRows<ChiTietFullDbRow>((from, to) =>
      supabase
        .from(TABLE_CHI_TIET)
        .select('*')
        .order('id_phieu_de_xuat_vat_tu', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to)
    ),
    getAllHangHoa(),
    getKhoList(),
    getEmployees(),
  ]);

  const phieuIds = [...new Set(rows.map((r) => r.id_phieu_de_xuat_vat_tu))];
  const phieuRows: PhieuDbRow[] = [];
  if (phieuIds.length > 0) {
    const { data: phieuData } = await supabase.from(TABLE_PHIEU).select('*').in('id', phieuIds);
    if (phieuData) phieuRows.push(...(phieuData as PhieuDbRow[]));
  }
  const nvMap: Record<string, { ho_ten: string }> = {};
  employees.forEach((e) => {
    nvMap[String(e.id)] = { ho_ten: e.ho_ten ?? '' };
  });
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => {
    khoMap[String(k.id)] = k.ten_kho ?? '';
  });
  const phieuEnrich: Record<
    number,
    { so_phieu: string; ngay: string; ngay_can: string; ten_noi_de_xuat: string; ten_nguoi_de_xuat: string; ten_nguoi_duyet: string | null; trang_thai_phieu: string }
  > = {};
  phieuRows.forEach((p) => {
    phieuEnrich[p.id] = {
      so_phieu: p.so_phieu ?? '',
      ngay: p.ngay ?? '',
      ngay_can: p.ngay_can ?? '',
      ten_noi_de_xuat: khoMap[String(p.id_noi_de_xuat)] ?? '',
      ten_nguoi_de_xuat: nvMap[String(p.id_nguoi_de_xuat)]?.ho_ten ?? '',
      ten_nguoi_duyet: p.id_nguoi_duyet != null ? (nvMap[String(p.id_nguoi_duyet)]?.ho_ten ?? null) : null,
      trang_thai_phieu: p.trang_thai ?? '',
    };
  });

  const hangHoaMap: Record<string, { ma_hang: string; ten_hang: string }> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = { ma_hang: h.ma_hang ?? h.ma_hang_hoa ?? '', ten_hang: h.ten_hang_hoa ?? h.ten_hang ?? '' };
  });
  return rows.map((row) => {
    const enrich = hangHoaMap[String(row.id_hang_hoa)];
    const ct = row as ChiTietDbRow;
    const full = row as ChiTietFullDbRow;
    const fromPhieu = phieuEnrich[row.id_phieu_de_xuat_vat_tu];
    return {
      id: String(row.id),
      id_phieu_de_xuat_vat_tu: String(row.id_phieu_de_xuat_vat_tu),
      so_phieu: full.so_phieu ?? fromPhieu?.so_phieu ?? null,
      ngay: full.ngay ?? fromPhieu?.ngay ?? null,
      ngay_can: full.ngay_can ?? fromPhieu?.ngay_can ?? null,
      ten_noi_de_xuat: full.ten_noi_de_xuat ?? fromPhieu?.ten_noi_de_xuat ?? null,
      ten_nguoi_de_xuat: full.ten_nguoi_de_xuat ?? fromPhieu?.ten_nguoi_de_xuat ?? null,
      ten_nguoi_duyet: full.ten_nguoi_duyet ?? fromPhieu?.ten_nguoi_duyet ?? null,
      trang_thai_phieu: full.trang_thai_phieu ?? fromPhieu?.trang_thai_phieu ?? null,
      id_hang_hoa: String(row.id_hang_hoa),
      ma_hang: enrich?.ma_hang,
      ten_hang: enrich?.ten_hang,
      so_luong: Number(row.so_luong),
      don_vi_tinh: row.don_vi_tinh ?? null,
      thong_so: row.thong_so ?? null,
      ghi_chu: row.ghi_chu ?? null,
      id_tien_do_mh: ct.id_tien_do_mh != null ? String(ct.id_tien_do_mh) : null,
      ten_tien_do_mh: ct.ten_tien_do_mh ?? null,
      trao_doi: ct.trao_doi ?? null,
    };
  });
}
