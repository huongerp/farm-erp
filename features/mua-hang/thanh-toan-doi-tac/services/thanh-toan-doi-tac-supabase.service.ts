/**
 * Service thanh toán đối tác – đọc/ghi Supabase (fp_mh_thanh_toan_doi_tac).
 * Dùng id_trang_thai_thanh_toan (FK) và trang_thai (text denormalize).
 */
import { supabase, fetchAllRows, throwSupabaseError } from '../../../../lib/supabase';
import type { ThanhToanDoiTac } from '../core/types';
import type { ThanhToanDoiTacFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getBranches } from '../../../he-thong/chi-nhanh/services/chi-nhanh-service';
import { getDoiTacRef } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { getTrangThaiThanhToanDoiTacList } from '../../thiet-lap-de-xuat-vat-tu/services/trang-thai-thanh-toan-doi-tac-service';

const TABLE = 'fp_mh_thanh_toan_doi_tac';
const RPC_NEXT_SO_PHIEU = 'get_next_so_phieu_thanh_toan_doi_tac';

const THANH_TOAN_ROW_COLUMNS =
  'id,so_phieu,hang_muc_thanh_toan,ngay,id_don_vi,id_doi_tac,id_trang_thai_thanh_toan,trang_thai,so_tien,ngay_xu_ly,ghi_chu,id_nguoi_tao,tg_tao,tg_cap_nhat';

export interface NextSoPhieuTtoConfig {
  tien_to_so_phieu: string;
  do_dai_phan_so: number;
}

/** Gọi RPC Supabase lấy số thứ tự tiếp theo, format thành mã phiếu (tiền tố + pad). */
export async function getNextSoPhieuThanhToanDoiTacRpc(config: NextSoPhieuTtoConfig): Promise<string> {
  const { data, error } = await supabase.rpc(RPC_NEXT_SO_PHIEU);
  if (error) throwSupabaseError(error);
  const nextNum = Number(data);
  if (Number.isNaN(nextNum) || nextNum < 1) throw new Error('Invalid next number from RPC');
  const padded = String(nextNum).padStart(config.do_dai_phan_so, '0');
  return `${config.tien_to_so_phieu || ''}${padded}`;
}

interface DbRow {
  id: number;
  so_phieu: string;
  hang_muc_thanh_toan: string;
  ngay: string;
  id_don_vi: number | null;
  id_doi_tac: number;
  id_trang_thai_thanh_toan: number | null;
  trang_thai: string | null;
  so_tien: number;
  ngay_xu_ly: string | null;
  ghi_chu: string | null;
  id_nguoi_tao: number | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function toNum(s: string | null | undefined): number | null {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function rowToItem(
  row: DbRow,
  enrich: {
    ten_don_vi?: string | null;
    ten_doi_tac?: string;
    ma_doi_tac?: string;
    ten_nguoi_tao?: string;
    ma_nguoi_tao?: string;
    ten_trang_thai?: string;
    mau_trang_thai?: string;
  }
): ThanhToanDoiTac {
  const idTrangThai =
    row.id_trang_thai_thanh_toan != null
      ? String(row.id_trang_thai_thanh_toan)
      : '';
  const tenTrangThai = enrich.ten_trang_thai ?? row.trang_thai ?? undefined;
  return {
    id: String(row.id),
    so_phieu: row.so_phieu ?? '',
    hang_muc_thanh_toan: row.hang_muc_thanh_toan ?? '',
    ngay: row.ngay ?? '',
    id_don_vi: row.id_don_vi != null ? String(row.id_don_vi) : null,
    ten_don_vi: enrich.ten_don_vi ?? null,
    id_doi_tac: String(row.id_doi_tac),
    ten_doi_tac: enrich.ten_doi_tac,
    ma_doi_tac: enrich.ma_doi_tac,
    id_trang_thai_thanh_toan: idTrangThai,
    ten_trang_thai: tenTrangThai,
    mau_trang_thai: enrich.mau_trang_thai,
    so_tien: Number(row.so_tien),
    ngay_xu_ly: row.ngay_xu_ly ?? null,
    ghi_chu: row.ghi_chu ?? undefined ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : '',
    ten_nguoi_tao: enrich.ten_nguoi_tao,
    ma_nguoi_tao: enrich.ma_nguoi_tao,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

export async function getAllThanhToanDoiTac(): Promise<ThanhToanDoiTac[]> {
  const [rows, branches, doiTacList, employees, statusList] = await Promise.all([
    fetchAllRows<DbRow>((from, to) =>
      supabase
        .from(TABLE)
        .select(THANH_TOAN_ROW_COLUMNS)
        .order('ngay', { ascending: false })
        .order('so_phieu', { ascending: false })
        .range(from, to)
    ),
    getBranches(),
    getDoiTacRef('nha_cung_cap'),
    getEmployeesRef(),
    getTrangThaiThanhToanDoiTacList(),
  ]);

  const donViMap: Record<string, string> = {};
  branches.forEach((b) => {
    donViMap[b.id] = b.ten_chi_nhanh;
  });
  const doiTacMap: Record<string, { ten: string; ma: string }> = {};
  doiTacList.forEach((d) => {
    doiTacMap[d.id] = { ten: d.ten_ncc, ma: d.ma_ncc };
  });
  const nvMap: Record<string, { ten: string; ma: string }> = {};
  employees.forEach((e) => {
    nvMap[e.id] = { ten: e.ho_ten ?? '', ma: e.ma_nhan_vien ?? '' };
  });
  const statusTenMap: Record<string, string> = {};
  const statusMauMap: Record<string, string> = {};
  statusList.forEach((s) => {
    statusTenMap[s.id] = s.ten;
    if (s.mau) statusMauMap[s.id] = s.mau;
  });

  return rows.map((row) => {
    const ten_don_vi = row.id_don_vi != null ? donViMap[String(row.id_don_vi)] ?? null : null;
    const doiTac = row.id_doi_tac != null ? doiTacMap[String(row.id_doi_tac)] : undefined;
    const nv = row.id_nguoi_tao != null ? nvMap[String(row.id_nguoi_tao)] : undefined;
    const ten_trang_thai =
      row.id_trang_thai_thanh_toan != null
        ? statusTenMap[String(row.id_trang_thai_thanh_toan)]
        : undefined;
    const mau_trang_thai =
      row.id_trang_thai_thanh_toan != null
        ? statusMauMap[String(row.id_trang_thai_thanh_toan)]
        : undefined;
    return rowToItem(row, {
      ten_don_vi,
      ten_doi_tac: doiTac?.ten,
      ma_doi_tac: doiTac?.ma,
      ten_nguoi_tao: nv?.ten,
      ma_nguoi_tao: nv?.ma,
      ten_trang_thai: ten_trang_thai ?? row.trang_thai ?? undefined,
      mau_trang_thai,
    });
  });
}

export async function getThanhToanDoiTacById(id: string): Promise<ThanhToanDoiTac | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;

  const { data: row, error } = await supabase
    .from(TABLE)
    .select(THANH_TOAN_ROW_COLUMNS)
    .eq('id', idNum)
    .maybeSingle();

  if (error) throwSupabaseError(error);
  if (!row) return null;

  const [branches, doiTacList, employees, statusList] = await Promise.all([
    getBranches(),
    getDoiTacRef('nha_cung_cap'),
    getEmployeesRef(),
    getTrangThaiThanhToanDoiTacList(),
  ]);

  const donViMap: Record<string, string> = {};
  branches.forEach((b) => {
    donViMap[b.id] = b.ten_chi_nhanh;
  });
  const doiTacMap: Record<string, { ten: string; ma: string }> = {};
  doiTacList.forEach((d) => {
    doiTacMap[d.id] = { ten: d.ten_ncc, ma: d.ma_ncc };
  });
  const nvMap: Record<string, { ten: string; ma: string }> = {};
  employees.forEach((e) => {
    nvMap[e.id] = { ten: e.ho_ten ?? '', ma: e.ma_nhan_vien ?? '' };
  });
  const statusTenMap: Record<string, string> = {};
  const statusMauMap: Record<string, string> = {};
  statusList.forEach((s) => {
    statusTenMap[s.id] = s.ten;
    if (s.mau) statusMauMap[s.id] = s.mau;
  });

  const r = row as DbRow;
  const ten_don_vi = r.id_don_vi != null ? donViMap[String(r.id_don_vi)] ?? null : null;
  const doiTac = r.id_doi_tac != null ? doiTacMap[String(r.id_doi_tac)] : undefined;
  const nv = r.id_nguoi_tao != null ? nvMap[String(r.id_nguoi_tao)] : undefined;
  const ten_trang_thai =
    r.id_trang_thai_thanh_toan != null
      ? statusTenMap[String(r.id_trang_thai_thanh_toan)]
      : undefined;
  const mau_trang_thai =
    r.id_trang_thai_thanh_toan != null
      ? statusMauMap[String(r.id_trang_thai_thanh_toan)]
      : undefined;

  return rowToItem(r, {
    ten_don_vi,
    ten_doi_tac: doiTac?.ten,
    ma_doi_tac: doiTac?.ma,
    ten_nguoi_tao: nv?.ten,
    ma_nguoi_tao: nv?.ma,
    ten_trang_thai: ten_trang_thai ?? r.trang_thai ?? undefined,
    mau_trang_thai,
  });
}

export async function createThanhToanDoiTac(data: ThanhToanDoiTacFormValues): Promise<ThanhToanDoiTac> {
  const soPhieu = data.so_phieu.trim();
  const { data: existing } = await supabase.from(TABLE).select('id').eq('so_phieu', soPhieu).maybeSingle();
  if (existing) throw new Error(i18n.t('thanhToanDoiTac.service.duplicateSoPhieu'));

  const statusList = await getTrangThaiThanhToanDoiTacList();
  const idTrangThaiNum = toNum(data.id_trang_thai_thanh_toan);
  const status = idTrangThaiNum != null ? statusList.find((s) => s.id === String(idTrangThaiNum)) : undefined;
  const trangThaiText = status?.ten ?? data.id_trang_thai_thanh_toan?.trim() ?? 'Chờ xử lý';

  const payload = {
    so_phieu: soPhieu,
    hang_muc_thanh_toan: data.hang_muc_thanh_toan.trim(),
    ngay: data.ngay.trim(),
    id_don_vi: toNum(data.id_don_vi),
    id_doi_tac: Number(data.id_doi_tac),
    id_trang_thai_thanh_toan: idTrangThaiNum,
    trang_thai: trangThaiText,
    so_tien: Number(data.so_tien),
    ngay_xu_ly: data.ngay_xu_ly?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || null,
    id_nguoi_tao: toNum(data.id_nguoi_tao),
  };

  const { data: inserted, error } = await supabase.from(TABLE).insert(payload).select(THANH_TOAN_ROW_COLUMNS).single();
  if (error) throwSupabaseError(error);

  const got = await getThanhToanDoiTacById(String((inserted as DbRow).id));
  if (!got) throw new Error(i18n.t('thanhToanDoiTac.service.notFound'));
  return got;
}

export async function updateThanhToanDoiTac(
  id: string,
  data: ThanhToanDoiTacFormValues
): Promise<ThanhToanDoiTac> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('thanhToanDoiTac.service.notFound'));

  const soPhieu = data.so_phieu.trim();
  const { data: other } = await supabase
    .from(TABLE)
    .select('id')
    .eq('so_phieu', soPhieu)
    .neq('id', idNum)
    .maybeSingle();
  if (other) throw new Error(i18n.t('thanhToanDoiTac.service.duplicateSoPhieu'));

  const statusList = await getTrangThaiThanhToanDoiTacList();
  const idTrangThaiNum = toNum(data.id_trang_thai_thanh_toan);
  const status = idTrangThaiNum != null ? statusList.find((s) => s.id === String(idTrangThaiNum)) : undefined;
  const trangThaiText = status?.ten ?? data.id_trang_thai_thanh_toan?.trim() ?? 'Chờ xử lý';

  const payload = {
    so_phieu: soPhieu,
    hang_muc_thanh_toan: data.hang_muc_thanh_toan.trim(),
    ngay: data.ngay.trim(),
    id_don_vi: toNum(data.id_don_vi),
    id_doi_tac: Number(data.id_doi_tac),
    id_trang_thai_thanh_toan: idTrangThaiNum,
    trang_thai: trangThaiText,
    so_tien: Number(data.so_tien),
    ngay_xu_ly: data.ngay_xu_ly?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || null,
    id_nguoi_tao: toNum(data.id_nguoi_tao),
  };

  const { error } = await supabase.from(TABLE).update(payload).eq('id', idNum);
  if (error) throwSupabaseError(error);

  const got = await getThanhToanDoiTacById(id);
  if (!got) throw new Error(i18n.t('thanhToanDoiTac.service.notFound'));
  return got;
}

export async function deleteThanhToanDoiTac(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('thanhToanDoiTac.service.notFound'));
  const { error } = await supabase.from(TABLE).delete().eq('id', idNum);
  if (error) throwSupabaseError(error);
}

export async function deleteThanhToanDoiTacMany(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in('id', numIds);
  if (error) throwSupabaseError(error);
}
