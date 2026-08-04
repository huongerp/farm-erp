/**
 * Service khấu hao tài sản – đọc/ghi Supabase (fp_ts_ky_khau_hao, fp_ts_chi_tiet_khau_hao).
 */
import { supabase, throwSupabaseError } from '../../../../lib/supabase';
import type { KyKhauHao, ChiTietKhauHao, KyKhauHaoCreate, TrangThaiKyKhauHao } from '../core/types';
import { getTaiSanList } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { updateTaiSanKhauHao } from '../../danh-muc-tai-san/services/danh-muc-tai-san-service';
import { getAssetGroups } from '../../thiet-lap-tai-san/services/nhom-tai-san-service';
import type { TaiSan } from '../../danh-muc-tai-san/core/types';
import type { AssetGroup } from '../../thiet-lap-tai-san/core/types';
import i18n from '../../../../lib/i18n';

const TABLE_KY = 'fp_ts_ky_khau_hao';
const TABLE_CHI_TIET = 'fp_ts_chi_tiet_khau_hao';

const KY_KHAU_HAO_COLUMNS =
  'id,thang,nam,trang_thai,tong_nguyen_gia,tong_khau_hao_ky,ghi_chu,id_nguoi_tao,ten_nguoi_tao,tg_tao,tg_cap_nhat';
const CHI_TIET_KHAU_HAO_COLUMNS =
  'id,id_ky_khau_hao,id_tai_san,ma_tai_san,ten_tai_san,id_nhom,ten_nhom,nguyen_gia,gia_tri_con_lai_dau_ky,khau_hao_ky,khau_hao_luy_ke,gia_tri_con_lai_cuoi_ky,ten_noi_luu,ten_nguoi_giu,id_nguoi_tao,ten_nguoi_tao,tg_tao,tg_cap_nhat';

export interface DbKyKhauHaoRow {
  id: number;
  thang: number;
  nam: number;
  trang_thai: string;
  tong_nguyen_gia: number | null;
  tong_khau_hao_ky: number | null;
  ghi_chu: string | null;
  id_nguoi_tao: number | null;
  ten_nguoi_tao: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

export interface DbChiTietKhauHaoRow {
  id: number;
  id_ky_khau_hao: number;
  id_tai_san: number;
  ma_tai_san: string | null;
  ten_tai_san: string | null;
  id_nhom: number;
  ten_nhom: string | null;
  nguyen_gia: number;
  gia_tri_con_lai_dau_ky: number;
  khau_hao_ky: number;
  khau_hao_luy_ke: number;
  gia_tri_con_lai_cuoi_ky: number;
  ten_noi_luu: string | null;
  ten_nguoi_giu: string | null;
  id_nguoi_tao: number | null;
  ten_nguoi_tao: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

function rowToKy(row: DbKyKhauHaoRow): KyKhauHao {
  return {
    id: String(row.id),
    thang: row.thang,
    nam: row.nam,
    trang_thai: row.trang_thai === 'chot' ? 'chot' : 'draft',
    tong_nguyen_gia: row.tong_nguyen_gia ?? null,
    tong_khau_hao_ky: row.tong_khau_hao_ky ?? null,
    ghi_chu: row.ghi_chu ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function rowToChiTiet(row: DbChiTietKhauHaoRow): ChiTietKhauHao {
  return {
    id: String(row.id),
    id_ky_khau_hao: String(row.id_ky_khau_hao),
    id_tai_san: String(row.id_tai_san),
    ma_tai_san: row.ma_tai_san ?? null,
    ten_tai_san: row.ten_tai_san ?? null,
    id_nhom: String(row.id_nhom),
    ten_nhom: row.ten_nhom ?? null,
    nguyen_gia: Number(row.nguyen_gia),
    gia_tri_con_lai_dau_ky: Number(row.gia_tri_con_lai_dau_ky),
    khau_hao_ky: Number(row.khau_hao_ky),
    khau_hao_luy_ke: Number(row.khau_hao_luy_ke),
    gia_tri_con_lai_cuoi_ky: Number(row.gia_tri_con_lai_cuoi_ky),
    ten_noi_luu: row.ten_noi_luu ?? null,
    ten_nguoi_giu: row.ten_nguoi_giu ?? null,
    id_nguoi_tao: row.id_nguoi_tao != null ? String(row.id_nguoi_tao) : null,
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
    tg_tao: row.tg_tao ?? new Date().toISOString(),
    tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
  };
}

function toNum(val: string | undefined | null): number | null {
  if (val == null || val === '') return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

function lastDayOfMonth(year: number, month: number): string {
  const d = new Date(year, month, 0);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function roundMoney(value: number): number {
  return Math.round(value);
}

/** export để unit test — logic tính khấu hao 1 kỳ, không phụ thuộc Supabase. */
export function tinhKhauHaoKy(
  nguyenGia: number,
  giaTriConLaiDauKy: number,
  khauHaoLuyKeHienTai: number,
  group: AssetGroup
): { khau_hao_ky: number; khau_hao_luy_ke: number; gia_tri_con_lai_cuoi_ky: number } {
  const tyLe = group.ty_le_khau_hao ?? null;
  const soNam = group.so_nam_su_dung ?? null;
  let khauHaoNam = 0;
  if (group.phuong_phap_khau_hao === 'duong_thang') {
    if (soNam != null && soNam > 0) {
      khauHaoNam = nguyenGia / soNam;
    } else if (tyLe != null && tyLe > 0) {
      khauHaoNam = (nguyenGia * tyLe) / 100;
    }
  } else {
    if (tyLe != null && tyLe > 0) {
      khauHaoNam = (giaTriConLaiDauKy * tyLe) / 100;
    }
  }
  const khauHaoKy = roundMoney(khauHaoNam / 12);
  const giaTriConLaiCuoiKy = Math.max(0, roundMoney(giaTriConLaiDauKy - khauHaoKy));
  const khauHaoLuyKe = khauHaoLuyKeHienTai + khauHaoKy;
  return { khau_hao_ky: khauHaoKy, khau_hao_luy_ke: khauHaoLuyKe, gia_tri_con_lai_cuoi_ky: giaTriConLaiCuoiKy };
}

export async function getKyKhauHaoListSupabase(): Promise<KyKhauHao[]> {
  const { data, error } = await supabase
    .from(TABLE_KY)
    .select(KY_KHAU_HAO_COLUMNS)
    .order('nam', { ascending: false })
    .order('thang', { ascending: false });
  if (error) throwSupabaseError(error);
  return (data ?? []).map((row) => rowToKy(row as DbKyKhauHaoRow));
}

export async function getKyKhauHaoByIdSupabase(id: string): Promise<KyKhauHao | null> {
  const numId = toNum(id);
  if (numId == null) return null;
  const { data, error } = await supabase.from(TABLE_KY).select(KY_KHAU_HAO_COLUMNS).eq('id', numId).maybeSingle();
  if (error) throwSupabaseError(error);
  return data ? rowToKy(data as DbKyKhauHaoRow) : null;
}

export async function createKyKhauHaoSupabase(data: KyKhauHaoCreate): Promise<KyKhauHao> {
  const { data: existing } = await supabase
    .from(TABLE_KY)
    .select('id')
    .eq('thang', data.thang)
    .eq('nam', data.nam)
    .maybeSingle();
  if (existing) throw new Error(i18n.t('khauHaoTaiSan.service.kyExists'));

  const payload = {
    thang: data.thang,
    nam: data.nam,
    trang_thai: 'draft',
    ghi_chu: data.ghi_chu?.trim() || null,
    id_nguoi_tao: toNum(data.id_nguoi_tao ?? null),
    ten_nguoi_tao: data.ten_nguoi_tao?.trim() || null,
  };
  const { data: inserted, error } = await supabase.from(TABLE_KY).insert(payload).select(KY_KHAU_HAO_COLUMNS).single();
  if (error) throwSupabaseError(error);
  return rowToKy(inserted as DbKyKhauHaoRow);
}

export async function updateKyKhauHaoSupabase(id: string, data: KyKhauHaoCreate): Promise<KyKhauHao> {
  const numId = toNum(id);
  if (numId == null) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));

  const { data: ky } = await supabase.from(TABLE_KY).select('trang_thai').eq('id', numId).single();
  if (!ky) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));
  if (ky.trang_thai === 'chot') throw new Error(i18n.t('khauHaoTaiSan.service.kyAlreadyChot'));

  const { data: existing } = await supabase
    .from(TABLE_KY)
    .select('id')
    .eq('thang', data.thang)
    .eq('nam', data.nam)
    .neq('id', numId)
    .maybeSingle();
  if (existing) throw new Error(i18n.t('khauHaoTaiSan.service.kyExists'));

  const payload = {
    thang: data.thang,
    nam: data.nam,
    ghi_chu: data.ghi_chu?.trim() || null,
    id_nguoi_tao: toNum(data.id_nguoi_tao ?? null),
    ten_nguoi_tao: data.ten_nguoi_tao?.trim() || null,
  };
  const { error } = await supabase.from(TABLE_KY).update(payload).eq('id', numId);
  if (error) throwSupabaseError(error);
  const { data: updated, error: err2 } = await supabase.from(TABLE_KY).select(KY_KHAU_HAO_COLUMNS).eq('id', numId).single();
  if (err2 || !updated) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));
  return rowToKy(updated as DbKyKhauHaoRow);
}

export async function getChiTietKhauHaoSupabase(idKy: string): Promise<ChiTietKhauHao[]> {
  const numKy = toNum(idKy);
  if (numKy == null) return [];
  const { data, error } = await supabase
    .from(TABLE_CHI_TIET)
    .select(CHI_TIET_KHAU_HAO_COLUMNS)
    .eq('id_ky_khau_hao', numKy)
    .order('id_tai_san');
  if (error) throwSupabaseError(error);
  return (data ?? []).map((row) => rowToChiTiet(row as DbChiTietKhauHaoRow));
}

export async function tinhToanKhauHaoKySupabase(
  idKy: string,
  id_nguoi_tao?: string | null,
  ten_nguoi_tao?: string | null
): Promise<ChiTietKhauHao[]> {
  const numKy = toNum(idKy);
  if (numKy == null) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));

  const { data: kyRow } = await supabase.from(TABLE_KY).select('thang, nam, trang_thai').eq('id', numKy).single();
  if (!kyRow) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));
  if (kyRow.trang_thai === 'chot') throw new Error(i18n.t('khauHaoTaiSan.service.kyAlreadyChot'));

  const [taiSanList, groups] = await Promise.all([getTaiSanList(), getAssetGroups()]);
  const groupMap = new Map<string, AssetGroup>(groups.map((g) => [g.id, g]));
  const endDate = lastDayOfMonth(kyRow.nam, kyRow.thang);
  const eligible: TaiSan[] = taiSanList.filter((ts) => {
    if (ts.trang_thai !== 1) return false;
    const nguyenGia = ts.nguyen_gia ?? 0;
    if (nguyenGia <= 0) return false;
    const ngayBatDau = ts.ngay_bat_dau_trich_khau_hao ?? ts.ngay_nhap ?? '';
    if (!ngayBatDau || ngayBatDau > endDate) return false;
    const group = groupMap.get(ts.id_nhom);
    if (!group) return false;
    const hasRate =
      (group.ty_le_khau_hao != null && group.ty_le_khau_hao > 0) ||
      (group.so_nam_su_dung != null && group.so_nam_su_dung > 0);
    return hasRate;
  });

  await supabase.from(TABLE_CHI_TIET).delete().eq('id_ky_khau_hao', numKy);

  let tongNguyenGia = 0;
  let tongKhauHaoKy = 0;
  const idNguoiTaoNum = toNum(id_nguoi_tao ?? null);
  const inserts: Record<string, unknown>[] = [];

  for (const ts of eligible) {
    const group = groupMap.get(ts.id_nhom)!;
    const nguyenGia = ts.nguyen_gia ?? 0;
    const giaTriDauKy = ts.gia_tri_con_lai ?? nguyenGia;
    const khauHaoLuyKeHienTai = ts.khau_hao_luy_ke ?? 0;
    const { khau_hao_ky, khau_hao_luy_ke, gia_tri_con_lai_cuoi_ky } = tinhKhauHaoKy(
      nguyenGia,
      giaTriDauKy,
      khauHaoLuyKeHienTai,
      group
    );
    tongNguyenGia += nguyenGia;
    tongKhauHaoKy += khau_hao_ky;
    inserts.push({
      id_ky_khau_hao: numKy,
      id_tai_san: Number(ts.id),
      ma_tai_san: ts.ma_tai_san ?? null,
      ten_tai_san: ts.ten_tai_san ?? null,
      id_nhom: Number(ts.id_nhom),
      ten_nhom: ts.ten_nhom ?? null,
      nguyen_gia: nguyenGia,
      gia_tri_con_lai_dau_ky: giaTriDauKy,
      khau_hao_ky,
      khau_hao_luy_ke,
      gia_tri_con_lai_cuoi_ky,
      ten_noi_luu: ts.ten_noi_luu ?? null,
      ten_nguoi_giu: ts.ten_nhan_vien_dang_giu ? (ts.ten_nhan_vien_dang_giu ?? null) : null,
      id_nguoi_tao: idNguoiTaoNum,
      ten_nguoi_tao: ten_nguoi_tao?.trim() || null,
    });
  }

  if (inserts.length > 0) {
    const { error: insErr } = await supabase.from(TABLE_CHI_TIET).insert(inserts);
    if (insErr) throwSupabaseError(insErr);
  }

  const { error: upErr } = await supabase
    .from(TABLE_KY)
    .update({
      tong_nguyen_gia: tongNguyenGia,
      tong_khau_hao_ky: tongKhauHaoKy,
    })
    .eq('id', numKy);
  if (upErr) throwSupabaseError(upErr);

  return getChiTietKhauHaoSupabase(idKy);
}

export async function chotKySupabase(idKy: string): Promise<void> {
  const numKy = toNum(idKy);
  if (numKy == null) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));

  const { data: kyRow } = await supabase.from(TABLE_KY).select('trang_thai').eq('id', numKy).single();
  if (!kyRow) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));
  if (kyRow.trang_thai === 'chot') throw new Error(i18n.t('khauHaoTaiSan.service.kyAlreadyChot'));

  const { data: chiTietRows, error: selErr } = await supabase
    .from(TABLE_CHI_TIET)
    .select('id_tai_san, gia_tri_con_lai_cuoi_ky, khau_hao_luy_ke')
    .eq('id_ky_khau_hao', numKy);
  if (selErr) throwSupabaseError(selErr);
  const list = (chiTietRows ?? []) as { id_tai_san: number; gia_tri_con_lai_cuoi_ky: number; khau_hao_luy_ke: number }[];
  if (list.length === 0) throw new Error(i18n.t('khauHaoTaiSan.service.chotRequiresTinhToan'));

  for (const ct of list) {
    await updateTaiSanKhauHao(String(ct.id_tai_san), {
      gia_tri_con_lai: ct.gia_tri_con_lai_cuoi_ky,
      khau_hao_luy_ke: ct.khau_hao_luy_ke,
    });
  }

  const { error: upErr } = await supabase.from(TABLE_KY).update({ trang_thai: 'chot' }).eq('id', numKy);
  if (upErr) throwSupabaseError(upErr);
}

export async function deleteKyKhauHaoSupabase(id: string): Promise<void> {
  const numId = toNum(id);
  if (numId == null) return;

  const { data: ky } = await supabase.from(TABLE_KY).select('trang_thai').eq('id', numId).single();
  if (ky?.trang_thai === 'chot') throw new Error(i18n.t('khauHaoTaiSan.service.cannotDeleteChot'));

  await supabase.from(TABLE_CHI_TIET).delete().eq('id_ky_khau_hao', numId);
  await supabase.from(TABLE_KY).delete().eq('id', numId);
}

export async function updateKyKhauHaoGhiChuSupabase(id: string, ghi_chu: string | null): Promise<KyKhauHao> {
  const numId = toNum(id);
  if (numId == null) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));
  const { data, error } = await supabase
    .from(TABLE_KY)
    .update({ ghi_chu: ghi_chu?.trim() || null })
    .eq('id', numId)
    .select(KY_KHAU_HAO_COLUMNS)
    .single();
  if (error) throwSupabaseError(error);
  if (!data) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));
  return rowToKy(data as DbKyKhauHaoRow);
}

export async function updateKyKhauHaoTrangThaiSupabase(
  id: string,
  trang_thai: TrangThaiKyKhauHao
): Promise<KyKhauHao> {
  const numId = toNum(id);
  if (numId == null) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));
  if (trang_thai === 'chot') throw new Error(i18n.t('khauHaoTaiSan.service.useChotKy'));

  const { data: ky } = await supabase.from(TABLE_KY).select('trang_thai').eq('id', numId).single();
  if (!ky || ky.trang_thai !== 'chot') throw new Error(i18n.t('khauHaoTaiSan.service.onlyRevertChot'));

  const { data, error } = await supabase
    .from(TABLE_KY)
    .update({ trang_thai: 'draft' })
    .eq('id', numId)
    .select(KY_KHAU_HAO_COLUMNS)
    .single();
  if (error) throwSupabaseError(error);
  if (!data) throw new Error(i18n.t('khauHaoTaiSan.service.kyNotFound'));
  return rowToKy(data as DbKyKhauHaoRow);
}
