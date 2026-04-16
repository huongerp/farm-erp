/**
 * Service phiếu kiểm kê – đọc/ghi Supabase (fp_mh_phieu_kiem_ke, fp_mh_phieu_kiem_ke_chi_tiet).
 */
import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { PhieuKiemKe, PhieuKiemKeChiTiet } from '../core/types';
import type { PhieuKiemKeFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getKhoRef } from '../../danh-sach-kho/services/kho-service';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { getHangHoaRef } from '../../danh-sach-hang-hoa/services/hang-hoa-service';

const TABLE_PHIEU = 'fp_mh_phieu_kiem_ke';
const TABLE_CHI_TIET = 'fp_mh_phieu_kiem_ke_chi_tiet';

const PHIEU_KIEM_KE_ROW_COLUMNS =
  'id,so_phieu,ngay,id_kho,id_nguoi_thuc_hien,id_nguoi_duyet,ghi_chu,trang_thai,tg_tao,tg_cap_nhat';

interface PhieuDbRow {
  id: number;
  so_phieu: string;
  ngay: string;
  id_kho: number;
  id_nguoi_thuc_hien: number;
  id_nguoi_duyet: number | null;
  ghi_chu: string | null;
  trang_thai: string;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

interface ChiTietDbRow {
  id: number;
  id_phieu_kiem_ke: number;
  id_hang_hoa: number;
  so_luong_so: number;
  so_luong_thuc_te: number | null;
  chenh_lech: number | null;
  don_vi_tinh: string | null;
  ghi_chu: string | null;
}

function toNum(s: string | null | undefined): number | null {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function rowToPhieu(
  row: PhieuDbRow,
  enrich?: { ten_kho?: string; ten_nguoi_thuc_hien?: string; ten_nguoi_duyet?: string | null }
): PhieuKiemKe {
  return {
    id: String(row.id),
    so_phieu: row.so_phieu ?? '',
    ngay: row.ngay ?? '',
    id_kho: String(row.id_kho),
    ten_kho: enrich?.ten_kho,
    id_nguoi_thuc_hien: String(row.id_nguoi_thuc_hien),
    ten_nguoi_thuc_hien: enrich?.ten_nguoi_thuc_hien,
    id_nguoi_duyet: row.id_nguoi_duyet != null ? String(row.id_nguoi_duyet) : null,
    ten_nguoi_duyet: enrich?.ten_nguoi_duyet ?? null,
    ghi_chu: row.ghi_chu ?? undefined,
    trang_thai: row.trang_thai ?? 'Nháp',
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function rowToChiTiet(
  row: ChiTietDbRow,
  idPhieuStr: string,
  enrich?: { ma_hang?: string; ten_hang?: string }
): PhieuKiemKeChiTiet {
  return {
    id: String(row.id),
    id_phieu_kiem_ke: idPhieuStr,
    id_hang_hoa: String(row.id_hang_hoa),
    so_luong_so: Number(row.so_luong_so),
    so_luong_thuc_te: row.so_luong_thuc_te != null ? Number(row.so_luong_thuc_te) : null,
    chenh_lech: row.chenh_lech != null ? Number(row.chenh_lech) : null,
    don_vi_tinh: row.don_vi_tinh ?? undefined,
    ghi_chu: row.ghi_chu ?? undefined,
    ma_hang: enrich?.ma_hang,
    ten_hang: enrich?.ten_hang,
  };
}

async function getChiTietAggregatesKiemKe(): Promise<Record<string, { so_dong: number; tong_so_luong: number }>> {
  const ctRows = await fetchAllRows<{ id_phieu_kiem_ke: number; so_luong_so: number | string | null }>((from, to) =>
    supabase
      .from(TABLE_CHI_TIET)
      .select('id_phieu_kiem_ke, so_luong_so')
      .order('id', { ascending: true })
      .range(from, to)
  );
  const agg: Record<string, { so_dong: number; tong_so_luong: number }> = {};
  ctRows.forEach((r) => {
    const key = String(r.id_phieu_kiem_ke);
    if (!agg[key]) agg[key] = { so_dong: 0, tong_so_luong: 0 };
    agg[key].so_dong += 1;
    agg[key].tong_so_luong += Number(r.so_luong_so) || 0;
  });
  return agg;
}

export async function getAllPhieuKiemKeSupabase(): Promise<PhieuKiemKe[]> {
  const [rows, khoList, employees, aggregates] = await Promise.all([
    fetchAllRows<PhieuDbRow>((from, to) =>
      supabase
        .from(TABLE_PHIEU)
        .select(PHIEU_KIEM_KE_ROW_COLUMNS)
        .order('ngay', { ascending: false })
        .order('so_phieu', { ascending: false })
        .range(from, to)
    ),
    getKhoRef(),
    getEmployeesRef(),
    getChiTietAggregatesKiemKe(),
  ]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => {
    khoMap[k.id] = k.ten_kho;
  });
  const nvMap: Record<string, string> = {};
  employees.forEach((e) => {
    nvMap[e.id] = e.ho_ten;
  });
  return rows.map((row) => {
    const ten_kho = khoMap[String(row.id_kho)];
    const ten_nguoi_thuc_hien = nvMap[String(row.id_nguoi_thuc_hien)];
    const ten_nguoi_duyet = row.id_nguoi_duyet != null ? nvMap[String(row.id_nguoi_duyet)] ?? null : null;
    const phieu = rowToPhieu(row, { ten_kho, ten_nguoi_thuc_hien, ten_nguoi_duyet });
    const a = aggregates[String(row.id)];
    phieu.tong_so_dong = a?.so_dong ?? 0;
    phieu.tong_so_luong = a?.tong_so_luong ?? 0;
    return phieu;
  });
}

export async function getPhieuKiemKeByIdSupabase(id: string): Promise<PhieuKiemKe | null> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) return null;
  const { data: row, error } = await supabase
    .from(TABLE_PHIEU)
    .select(PHIEU_KIEM_KE_ROW_COLUMNS)
    .eq('id', idNum)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const [khoList, employees, ctRows, hangHoaList] = await Promise.all([
    getKhoRef(),
    getEmployeesRef(),
    supabase
      .from(TABLE_CHI_TIET)
      .select('id, id_phieu_kiem_ke, id_hang_hoa, so_luong_so, so_luong_thuc_te, chenh_lech, don_vi_tinh, ghi_chu')
      .eq('id_phieu_kiem_ke', idNum)
      .order('id', { ascending: true })
      .then((r) => r.data ?? []),
    getHangHoaRef(),
  ]);
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => {
    khoMap[k.id] = k.ten_kho;
  });
  const nvMap: Record<string, string> = {};
  employees.forEach((e) => {
    nvMap[e.id] = e.ho_ten;
  });
  const hangHoaMap: Record<string, { ma_hang: string; ten_hang: string }> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = { ma_hang: h.ma_hang ?? h.ma_hang_hoa ?? '', ten_hang: h.ten_hang_hoa ?? h.ten_hang ?? '' };
  });

  const p = row as PhieuDbRow;
  const phieu = rowToPhieu(p, {
    ten_kho: khoMap[String(p.id_kho)],
    ten_nguoi_thuc_hien: nvMap[String(p.id_nguoi_thuc_hien)],
    ten_nguoi_duyet: p.id_nguoi_duyet != null ? nvMap[String(p.id_nguoi_duyet)] ?? null : null,
  });

  const chi_tiet: PhieuKiemKeChiTiet[] = (ctRows as ChiTietDbRow[]).map((ct) => {
    const enrich = hangHoaMap[String(ct.id_hang_hoa)];
    return rowToChiTiet(ct, id, enrich);
  });
  phieu.chi_tiet = chi_tiet;
  phieu.tong_so_dong = chi_tiet.length;
  phieu.tong_so_luong = chi_tiet.reduce((s, c) => s + (Number(c.so_luong_so) || 0), 0);
  return phieu;
}

export async function createPhieuKiemKeSupabase(data: PhieuKiemKeFormValues): Promise<PhieuKiemKe> {
  const soPhieu = data.so_phieu.trim();
  const { data: existing } = await supabase.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).maybeSingle();
  if (existing) throw new Error(i18n.t('phieuKiemKe.service.duplicateCode'));

  const payload = {
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    id_kho: Number(data.id_kho),
    id_nguoi_thuc_hien: Number(data.id_nguoi_thuc_hien),
    id_nguoi_duyet: toNum(data.id_nguoi_duyet),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { data: inserted, error } = await supabase.from(TABLE_PHIEU).insert(payload).select(PHIEU_KIEM_KE_ROW_COLUMNS).single();
  if (error) throw new Error(error.message);
  const idPhieu = (inserted as PhieuDbRow).id;

  const hangHoaList = await getHangHoaRef();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = h.don_vi_tinh ?? '';
  });

  const chiTietPayload = (data.chi_tiet ?? []).filter((ct) => ct.id_hang_hoa?.trim());
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => {
      const slTe = c.so_luong_thuc_te != null && !Number.isNaN(Number(c.so_luong_thuc_te)) ? Number(c.so_luong_thuc_te) : null;
      return {
        id_phieu_kiem_ke: idPhieu,
        id_hang_hoa: Number(c.id_hang_hoa),
        so_luong_so: Number(c.so_luong_so) || 0,
        so_luong_thuc_te: slTe,
        don_vi_tinh: ((c.don_vi_tinh as string)?.trim() || hangHoaMap[c.id_hang_hoa.trim()]) ?? null,
        ghi_chu: c.ghi_chu?.trim() || null,
      };
    });
    const { error: errCt } = await supabase.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throw new Error(errCt.message);
  }

  const got = await getPhieuKiemKeByIdSupabase(String(idPhieu));
  if (!got) throw new Error(i18n.t('phieuKiemKe.service.notFound'));
  return got;
}

export async function updatePhieuKiemKeSupabase(id: string, data: PhieuKiemKeFormValues): Promise<PhieuKiemKe> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKiemKe.service.notFound'));

  const { data: oldRow, error: fetchErr } = await supabase.from(TABLE_PHIEU).select(PHIEU_KIEM_KE_ROW_COLUMNS).eq('id', idNum).maybeSingle();
  if (fetchErr || !oldRow) throw new Error(i18n.t('phieuKiemKe.service.notFound'));

  const soPhieu = data.so_phieu.trim();
  const { data: other } = await supabase.from(TABLE_PHIEU).select('id').eq('so_phieu', soPhieu).neq('id', idNum).maybeSingle();
  if (other) throw new Error(i18n.t('phieuKiemKe.service.duplicateCode'));

  const payload = {
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    id_kho: Number(data.id_kho),
    id_nguoi_thuc_hien: Number(data.id_nguoi_thuc_hien),
    id_nguoi_duyet: toNum(data.id_nguoi_duyet),
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai,
  };

  const { error: updateErr } = await supabase.from(TABLE_PHIEU).update(payload).eq('id', idNum);
  if (updateErr) throw new Error(updateErr.message);

  await supabase.from(TABLE_CHI_TIET).delete().eq('id_phieu_kiem_ke', idNum);

  const hangHoaList = await getHangHoaRef();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = h.don_vi_tinh ?? '';
  });

  const chiTietPayload = (data.chi_tiet ?? []).filter((ct) => ct.id_hang_hoa?.trim());
  if (chiTietPayload.length > 0) {
    const ctRows = chiTietPayload.map((c) => {
      const slTe = c.so_luong_thuc_te != null && !Number.isNaN(Number(c.so_luong_thuc_te)) ? Number(c.so_luong_thuc_te) : null;
      return {
        id_phieu_kiem_ke: idNum,
        id_hang_hoa: Number(c.id_hang_hoa),
        so_luong_so: Number(c.so_luong_so) || 0,
        so_luong_thuc_te: slTe,
        don_vi_tinh: ((c.don_vi_tinh as string)?.trim() || hangHoaMap[c.id_hang_hoa.trim()]) ?? null,
        ghi_chu: c.ghi_chu?.trim() || null,
      };
    });
    const { error: errCt } = await supabase.from(TABLE_CHI_TIET).insert(ctRows);
    if (errCt) throw new Error(errCt.message);
  }

  const got = await getPhieuKiemKeByIdSupabase(id);
  if (!got) throw new Error(i18n.t('phieuKiemKe.service.notFound'));
  return got;
}

export async function deletePhieuKiemKeSupabase(id: string): Promise<void> {
  const idNum = Number(id);
  if (Number.isNaN(idNum)) throw new Error(i18n.t('phieuKiemKe.service.notFound'));
  const { error } = await supabase.from(TABLE_PHIEU).delete().eq('id', idNum);
  if (error) throw new Error(error.message);
}

export async function deletePhieuKiemKeManySupabase(ids: string[]): Promise<void> {
  const numIds = ids.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numIds.length === 0) return;
  const { error } = await supabase.from(TABLE_PHIEU).delete().in('id', numIds);
  if (error) throw new Error(error.message);
}

export async function getNextSoPhieuPhieuKiemKe(): Promise<number> {
  const { data, error } = await supabase.rpc('get_next_so_phieu_phieu_kiem_ke');
  if (error) throw new Error(error.message);
  if (typeof data === 'number' && Number.isFinite(data)) return data;
  const n = Number(data);
  return Number.isFinite(n) ? n : 1;
}
