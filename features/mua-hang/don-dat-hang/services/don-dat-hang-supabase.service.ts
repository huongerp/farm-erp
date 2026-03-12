/**
 * Service đơn đặt hàng – đọc/ghi Supabase (fp_mh_don_dat_hang, fp_mh_don_dat_hang_chi_tiet).
 * Trạng thái DB và app đều dùng text (giống module đề xuất vật tư).
 */
import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { DonDatHang, DonDatHangChiTiet, DonDatHangTrangThai } from '../core/types';
import type { DonDatHangFormValues } from '../core/schema';
import { TRANG_THAI_NHAP } from '../core/types';
import i18n from '../../../../lib/i18n';
import { getKhoList } from '../../../kho-van/danh-sach-kho/services/kho-service';
import { getAllDoiTac } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import { getEmployees } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { getAllHangHoa } from '../../../kho-van/danh-sach-hang-hoa/services/hang-hoa-service';
import { getPhieuDeXuatVatTuById } from '../../../kho-van/phieu-de-xuat-vat-tu/services/phieu-de-xuat-vat-tu-service';

const TABLE_DON = 'fp_mh_don_dat_hang';
const TABLE_CHI_TIET = 'fp_mh_don_dat_hang_chi_tiet';

function trangThaiFromDb(s: string | null): DonDatHangTrangThai {
  if (s == null || s === '') return TRANG_THAI_NHAP;
  return s as DonDatHangTrangThai;
}

interface DonDbRow {
  id: number;
  so_po: string;
  ngay_dat: string;
  ngay_giao_dk: string;
  id_nha_cung_cap: number;
  ten_nha_cung_cap: string | null;
  id_kho_nhan: number | null;
  ten_kho_nhan: string | null;
  id_phieu_de_xuat_vat_tu: number | null;
  id_nguoi_dat: number;
  id_nguoi_duyet: number | null;
  ghi_chu: string | null;
  trang_thai: string;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface ChiTietDbRow {
  id: number;
  id_don_dat_hang: number;
  id_hang_hoa: number;
  so_luong: number;
  don_vi_tinh: string | null;
  don_gia: number | null;
  thanh_tien: number | null;
  ghi_chu: string | null;
}

function toNum(s: string | null | undefined): number | null {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function rowToDon(
  row: DonDbRow,
  enrich?: {
    ma_nha_cung_cap?: string;
    so_phieu_de_xuat?: string | null;
    ten_nguoi_dat?: string;
    ma_nguoi_dat?: string;
    ten_nguoi_duyet?: string | null;
    ma_nguoi_duyet?: string | null;
  }
): DonDatHang {
  return {
    id: String(row.id),
    so_po: row.so_po ?? '',
    ngay_dat: row.ngay_dat ?? '',
    ngay_giao_dk: row.ngay_giao_dk ?? '',
    id_nha_cung_cap: String(row.id_nha_cung_cap),
    ten_nha_cung_cap: row.ten_nha_cung_cap ?? undefined,
    ma_nha_cung_cap: enrich?.ma_nha_cung_cap,
    id_kho_nhan: row.id_kho_nhan != null ? String(row.id_kho_nhan) : null,
    ten_kho_nhan: row.ten_kho_nhan ?? null,
    id_phieu_de_xuat_vat_tu: row.id_phieu_de_xuat_vat_tu != null ? String(row.id_phieu_de_xuat_vat_tu) : null,
    so_phieu_de_xuat: enrich?.so_phieu_de_xuat ?? null,
    id_nguoi_dat: String(row.id_nguoi_dat),
    ten_nguoi_dat: enrich?.ten_nguoi_dat,
    ma_nguoi_dat: enrich?.ma_nguoi_dat,
    id_nguoi_duyet: row.id_nguoi_duyet != null ? String(row.id_nguoi_duyet) : null,
    ten_nguoi_duyet: enrich?.ten_nguoi_duyet ?? null,
    ma_nguoi_duyet: enrich?.ma_nguoi_duyet ?? null,
    ghi_chu: row.ghi_chu ?? undefined,
    trang_thai: trangThaiFromDb(row.trang_thai),
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function rowToChiTiet(row: ChiTietDbRow, idDonStr: string, enrich?: { ma_hang?: string; ten_hang?: string; don_vi_tinh?: string }): DonDatHangChiTiet {
  return {
    id: String(row.id),
    id_don_dat_hang: idDonStr,
    id_hang_hoa: String(row.id_hang_hoa),
    so_luong: Number(row.so_luong),
    don_vi_tinh: row.don_vi_tinh ?? enrich?.don_vi_tinh ?? undefined,
    don_gia: row.don_gia != null ? Number(row.don_gia) : undefined,
    thanh_tien: row.thanh_tien != null ? Number(row.thanh_tien) : undefined,
    ghi_chu: row.ghi_chu ?? undefined,
    ma_hang: enrich?.ma_hang,
    ten_hang: enrich?.ten_hang,
  };
}

export async function getAllDonDatHangSupabase(): Promise<DonDatHang[]> {
  const [rows, khoList, doiTacList, employees] = await Promise.all([
    fetchAllRows<DonDbRow>((from, to) =>
      supabase
        .from(TABLE_DON)
        .select('*')
        .order('ngay_dat', { ascending: false })
        .order('so_po', { ascending: false })
        .range(from, to)
    ),
    getKhoList(),
    getAllDoiTac('nha_cung_cap'),
    getEmployees(),
  ]);

  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });
  const nccMap: Record<string, { ten: string; ma: string }> = {};
  doiTacList.forEach((d) => { nccMap[d.id] = { ten: d.ten_ncc, ma: d.ma_ncc }; });
  const nvMap: Record<string, { ho_ten: string; ma_nhan_vien: string }> = {};
  employees.forEach((e) => { nvMap[e.id] = { ho_ten: e.ho_ten, ma_nhan_vien: e.ma_nhan_vien ?? '' }; });

  const result: DonDatHang[] = [];
  for (const row of rows) {
    const ten_nha_cung_cap = row.ten_nha_cung_cap ?? nccMap[String(row.id_nha_cung_cap)]?.ten;
    const ten_kho_nhan = row.ten_kho_nhan ?? (row.id_kho_nhan != null ? khoMap[String(row.id_kho_nhan)] : null);
    let so_phieu_de_xuat: string | null = null;
    if (row.id_phieu_de_xuat_vat_tu != null) {
      try {
        const pdx = await getPhieuDeXuatVatTuById(String(row.id_phieu_de_xuat_vat_tu));
        so_phieu_de_xuat = pdx?.so_phieu ?? null;
      } catch {
        // ignore
      }
    }
    const ten_nguoi_dat = nvMap[String(row.id_nguoi_dat)]?.ho_ten;
    const ma_nguoi_dat = nvMap[String(row.id_nguoi_dat)]?.ma_nhan_vien;
    const ten_nguoi_duyet = row.id_nguoi_duyet != null ? nvMap[String(row.id_nguoi_duyet)]?.ho_ten ?? null : null;
    const ma_nguoi_duyet = row.id_nguoi_duyet != null ? nvMap[String(row.id_nguoi_duyet)]?.ma_nhan_vien ?? null : null;

    result.push(rowToDon(row, {
      ma_nha_cung_cap: nccMap[String(row.id_nha_cung_cap)]?.ma,
      so_phieu_de_xuat,
      ten_nguoi_dat,
      ma_nguoi_dat,
      ten_nguoi_duyet,
      ma_nguoi_duyet,
    }));
    const last = result[result.length - 1];
    if (ten_nha_cung_cap != null) last.ten_nha_cung_cap = ten_nha_cung_cap;
    if (ten_kho_nhan != null) last.ten_kho_nhan = ten_kho_nhan;
  }
  return result;
}

export async function getDonDatHangByIdSupabase(id: string): Promise<DonDatHang | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;

  const { data: row, error } = await supabase
    .from(TABLE_DON)
    .select('*')
    .eq('id', idNum)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const [khoList, doiTacList, employees, ctRows, hangHoaList] = await Promise.all([
    getKhoList(),
    getAllDoiTac('nha_cung_cap'),
    getEmployees(),
    supabase
      .from(TABLE_CHI_TIET)
      .select('id, id_don_dat_hang, id_hang_hoa, so_luong, don_vi_tinh, don_gia, thanh_tien, ghi_chu')
      .eq('id_don_dat_hang', idNum)
      .order('id', { ascending: true })
      .then((r) => r.data ?? []),
    getAllHangHoa(),
  ]);

  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });
  const nccMap: Record<string, { ten: string; ma: string }> = {};
  doiTacList.forEach((d) => { nccMap[d.id] = { ten: d.ten_ncc, ma: d.ma_ncc }; });
  const nvMap: Record<string, { ho_ten: string; ma_nhan_vien: string }> = {};
  employees.forEach((e) => { nvMap[e.id] = { ho_ten: e.ho_ten, ma_nhan_vien: e.ma_nhan_vien ?? '' }; });
  const hangHoaMap: Record<string, { ma_hang: string; ten_hang: string; dvt: string }> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = {
      ma_hang: h.ma_hang ?? h.ma_hang_hoa ?? '',
      ten_hang: h.ten_hang_hoa ?? h.ten_hang ?? '',
      dvt: h.dvt ?? '',
    };
  });

  const p = row as DonDbRow;
  let so_phieu_de_xuat: string | null = null;
  if (p.id_phieu_de_xuat_vat_tu != null) {
    try {
      const pdx = await getPhieuDeXuatVatTuById(String(p.id_phieu_de_xuat_vat_tu));
      so_phieu_de_xuat = pdx?.so_phieu ?? null;
    } catch {
      // ignore
    }
  }

  const don = rowToDon(p, {
    ma_nha_cung_cap: nccMap[String(p.id_nha_cung_cap)]?.ma,
    so_phieu_de_xuat,
    ten_nguoi_dat: nvMap[String(p.id_nguoi_dat)]?.ho_ten,
    ma_nguoi_dat: nvMap[String(p.id_nguoi_dat)]?.ma_nhan_vien,
    ten_nguoi_duyet: p.id_nguoi_duyet != null ? nvMap[String(p.id_nguoi_duyet)]?.ho_ten ?? null : null,
    ma_nguoi_duyet: p.id_nguoi_duyet != null ? nvMap[String(p.id_nguoi_duyet)]?.ma_nhan_vien ?? null : null,
  });
  if (p.ten_nha_cung_cap) don.ten_nha_cung_cap = p.ten_nha_cung_cap;
  if (p.ten_kho_nhan) don.ten_kho_nhan = p.ten_kho_nhan;

  const chi_tiet: DonDatHangChiTiet[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const enrich = hangHoaMap[String(ct.id_hang_hoa)];
    return rowToChiTiet(ct, id, enrich);
  });
  don.chi_tiet = chi_tiet;
  return don;
}

export async function createDonDatHangSupabase(data: DonDatHangFormValues): Promise<DonDatHang> {
  const soPo = data.so_po.trim();
  const { data: existing } = await supabase.from(TABLE_DON).select('id').eq('so_po', soPo).maybeSingle();
  if (existing) throw new Error(i18n.t('donDatHang.service.duplicateCode'));

  const [doiTacList, khoList] = await Promise.all([
    getAllDoiTac('nha_cung_cap'),
    getKhoList(),
  ]);
  const nccMap: Record<string, string> = {};
  doiTacList.forEach((d) => { nccMap[d.id] = d.ten_ncc; });
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });

  const payload = {
    so_po: soPo,
    ngay_dat: data.ngay_dat.trim(),
    ngay_giao_dk: data.ngay_giao_dk.trim(),
    id_nha_cung_cap: Number(data.id_nha_cung_cap),
    ten_nha_cung_cap: nccMap[data.id_nha_cung_cap] ?? null,
    id_kho_nhan: toNum(data.id_kho_nhan),
    ten_kho_nhan: data.id_kho_nhan ? (khoMap[data.id_kho_nhan] ?? null) : null,
    id_phieu_de_xuat_vat_tu: toNum(data.id_phieu_de_xuat_vat_tu),
    id_nguoi_dat: Number(data.id_nguoi_dat),
    id_nguoi_duyet: toNum(data.id_nguoi_duyet),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { data: inserted, error } = await supabase.from(TABLE_DON).insert(payload).select('*').single();
  if (error) throw new Error(error.message);
  const idDon = (inserted as DonDbRow).id;
  const idStr = String(idDon);

  const hangHoaList = await getAllHangHoa();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = h.dvt ?? ''; });

  const chiTietPayload = (data.chi_tiet ?? []).filter((ct) => ct.id_hang_hoa?.trim() && Number(ct.so_luong) > 0);
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => ({
      id_don_dat_hang: idDon,
      id_hang_hoa: Number(c.id_hang_hoa),
      so_luong: Number(c.so_luong),
      don_vi_tinh: hangHoaMap[c.id_hang_hoa.trim()] ?? null,
      don_gia: Number(c.don_gia ?? 0),
      ghi_chu: c.ghi_chu?.trim() || null,
    }));
    const { error: errCt } = await supabase.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throw new Error(errCt.message);
  }

  const got = await getDonDatHangByIdSupabase(idStr);
  if (!got) throw new Error(i18n.t('donDatHang.service.notFound'));
  return got;
}

export async function updateDonDatHangSupabase(id: string, data: DonDatHangFormValues): Promise<DonDatHang> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('donDatHang.service.notFound'));

  const { data: oldRow, error: fetchErr } = await supabase.from(TABLE_DON).select('*').eq('id', idNum).maybeSingle();
  if (fetchErr || !oldRow) throw new Error(i18n.t('donDatHang.service.notFound'));

  const soPo = data.so_po.trim();
  const { data: other } = await supabase.from(TABLE_DON).select('id').eq('so_po', soPo).neq('id', idNum).maybeSingle();
  if (other) throw new Error(i18n.t('donDatHang.service.duplicateCode'));

  const [doiTacList, khoList] = await Promise.all([
    getAllDoiTac('nha_cung_cap'),
    getKhoList(),
  ]);
  const nccMap: Record<string, string> = {};
  doiTacList.forEach((d) => { nccMap[d.id] = d.ten_ncc; });
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });

  const payload = {
    so_po: soPo,
    ngay_dat: data.ngay_dat.trim(),
    ngay_giao_dk: data.ngay_giao_dk.trim(),
    id_nha_cung_cap: Number(data.id_nha_cung_cap),
    ten_nha_cung_cap: nccMap[data.id_nha_cung_cap] ?? null,
    id_kho_nhan: toNum(data.id_kho_nhan),
    ten_kho_nhan: data.id_kho_nhan ? (khoMap[data.id_kho_nhan] ?? null) : null,
    id_phieu_de_xuat_vat_tu: toNum(data.id_phieu_de_xuat_vat_tu),
    id_nguoi_dat: Number(data.id_nguoi_dat),
    id_nguoi_duyet: toNum(data.id_nguoi_duyet),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { error: updateErr } = await supabase.from(TABLE_DON).update(payload).eq('id', idNum);
  if (updateErr) throw new Error(updateErr.message);

  await supabase.from(TABLE_CHI_TIET).delete().eq('id_don_dat_hang', idNum);

  const hangHoaList = await getAllHangHoa();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = h.dvt ?? ''; });

  const chiTietPayload = (data.chi_tiet ?? []).filter((ct) => ct.id_hang_hoa?.trim() && Number(ct.so_luong) > 0);
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => ({
      id_don_dat_hang: idNum,
      id_hang_hoa: Number(c.id_hang_hoa),
      so_luong: Number(c.so_luong),
      don_vi_tinh: hangHoaMap[c.id_hang_hoa.trim()] ?? null,
      don_gia: Number(c.don_gia ?? 0),
      ghi_chu: c.ghi_chu?.trim() || null,
    }));
    const { error: errCt } = await supabase.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throw new Error(errCt.message);
  }

  const got = await getDonDatHangByIdSupabase(id);
  if (!got) throw new Error(i18n.t('donDatHang.service.notFound'));
  return got;
}

export async function deleteDonDatHangSupabase(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('donDatHang.service.notFound'));
  const { error } = await supabase.from(TABLE_DON).delete().eq('id', idNum);
  if (error) throw new Error(error.message);
}

export async function deleteDonDatHangManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_DON).delete().in('id', numIds);
  if (error) throw new Error(error.message);
}

/** Gọi RPC lấy số thứ tự tiếp theo cho so_po (app format: PO-YYYY- + pad). */
export async function getNextSoPoDonDatHangSupabase(): Promise<number> {
  const { data, error } = await supabase.rpc('get_next_so_po_don_dat_hang');
  if (error) throw new Error(error.message);
  return Number(data) ?? 1;
}
