/**
 * Đọc và cập nhật thông báo qua PostgREST.
 *
 * RLS đã giới hạn mọi truy vấn về đúng nhân viên đang đăng nhập
 * (docs/supabase-fp_var_thong_bao.sql), nên không câu nào ở đây phải tự lọc
 * nguoi_nhan_id — và cũng không thể lách qua được.
 */

import { db, throwSupabaseError } from '../../../lib/db';
import type { CaiDatThongBao, DemTheoModule, ThongBao, ThietBiPush, TrangThongBao, TuyChonThongBao } from '../core/types';
import { TUY_CHON_MAC_DINH } from '../core/types';

const BANG = 'fp_var_thong_bao';
const BANG_CAI_DAT = 'fp_var_thong_bao_cai_dat';
const BANG_TUY_CHON = 'fp_var_thong_bao_tuy_chon';
const BANG_THIET_BI = 'fp_var_push_subscription';

/** Chỉ các cột giao diện dùng — không kéo du_lieu và su_kien_id cho nhẹ đường truyền. */
const COT = 'id,module_id,loai_su_kien,muc,tieu_de,noi_dung,link,da_doc,so_lan,tg_tao';

type Row = Record<string, unknown>;

function chuanHoa(row: Row): ThongBao {
  return {
    id: String(row['id']),
    moduleId: (row['module_id'] as string) ?? '',
    loaiSuKien: (row['loai_su_kien'] as string) ?? '',
    muc: row['muc'] === 'cao' ? 'cao' : 'thuong',
    tieuDe: (row['tieu_de'] as string) ?? '',
    noiDung: (row['noi_dung'] as string | null) ?? null,
    link: (row['link'] as string | null) ?? null,
    daDoc: row['da_doc'] === true,
    soLan: Number(row['so_lan'] ?? 1),
    tgTao: (row['tg_tao'] as string) ?? new Date().toISOString(),
  };
}

/**
 * Chỉ đếm số chưa đọc, không kéo nội dung.
 *
 * Đây là câu chạy định kỳ khi tab mở nên phải thật rẻ: `head: true` khiến
 * PostgREST trả về mỗi header Content-Range, không có body. Repo tối ưu egress
 * rất kỹ (docs/EGRESS_OPTIMIZATION.md) nên chi tiết này quan trọng.
 */
export async function demChuaDoc(): Promise<number> {
  const { count, error } = await db
    .from(BANG)
    .select('id', { count: 'exact', head: true })
    .eq('da_doc', false)
    .eq('da_xoa', false);
  if (error) throwSupabaseError(error);
  return count ?? 0;
}

/**
 * Đếm chưa đọc theo từng module cho chip lọc.
 * PostgREST không có GROUP BY nên kéo đúng một cột rồi đếm tại client — vẫn nhẹ
 * vì số dòng chưa đọc của một người hiếm khi quá vài chục.
 */
export async function demChuaDocTheoModule(): Promise<DemTheoModule> {
  const { data, error } = await db
    .from(BANG)
    .select('module_id')
    .eq('da_doc', false)
    .eq('da_xoa', false);
  if (error) throwSupabaseError(error);

  const dem: DemTheoModule = {};
  for (const row of (data ?? []) as Row[]) {
    const m = (row['module_id'] as string) ?? '';
    dem[m] = (dem[m] ?? 0) + 1;
  }
  return dem;
}

export interface BoLocThongBao {
  /** null = mọi module. */
  moduleId?: string | null;
  chiChuaDoc?: boolean;
  trang?: number;
  soDong?: number;
}

export async function layDanhSach(loc: BoLocThongBao = {}): Promise<TrangThongBao> {
  const soDong = loc.soDong ?? 20;
  const trang = loc.trang ?? 0;
  const tu = trang * soDong;

  let q = db
    .from(BANG)
    .select(COT, { count: 'exact' })
    .eq('da_xoa', false)
    .order('tg_tao', { ascending: false })
    .range(tu, tu + soDong - 1);

  if (loc.moduleId) q = q.eq('module_id', loc.moduleId);
  if (loc.chiChuaDoc) q = q.eq('da_doc', false);

  const { data, error, count } = await q;
  if (error) throwSupabaseError(error);

  return { items: ((data ?? []) as Row[]).map(chuanHoa), tong: count ?? 0 };
}

export async function danhDauDaDoc(id: string): Promise<void> {
  const { error } = await db.from(BANG).update({ da_doc: true }).eq('id', id);
  if (error) throwSupabaseError(error);
}

export async function xoaMot(id: string): Promise<void> {
  const { error } = await db.from(BANG).update({ da_xoa: true }).eq('id', id);
  if (error) throwSupabaseError(error);
}

/** Hoàn tác nút xoá lẻ — cho phép sửa sai bằng toast thay vì hỏi trước mỗi lần. */
export async function hoanTacXoa(id: string): Promise<void> {
  const { error } = await db.from(BANG).update({ da_xoa: false }).eq('id', id);
  if (error) throwSupabaseError(error);
}

/**
 * Đọc tất cả / xoá tất cả đi qua RPC để luôn tôn trọng đúng bộ lọc module đang
 * áp trên giao diện, và trả về số dòng đã tác động cho hộp xác nhận.
 */
export async function docTatCa(moduleId: string | null): Promise<number> {
  const { data, error } = await db.rpc('rpc_thong_bao_doc_tat_ca', { p_module_id: moduleId });
  if (error) throwSupabaseError(error);
  return Number(data ?? 0);
}

export async function xoaTatCa(moduleId: string | null): Promise<number> {
  const { data, error } = await db.rpc('rpc_thong_bao_xoa_tat_ca', { p_module_id: moduleId });
  if (error) throwSupabaseError(error);
  return Number(data ?? 0);
}

// --- Cài đặt -----------------------------------------------------------------

export async function layCaiDat(): Promise<CaiDatThongBao[]> {
  const { data, error } = await db.from(BANG_CAI_DAT).select('module_id,loai_su_kien,trong_app,push');
  if (error) throwSupabaseError(error);
  return ((data ?? []) as Row[]).map((r) => ({
    moduleId: (r['module_id'] as string) ?? '',
    loaiSuKien: (r['loai_su_kien'] as string) ?? '*',
    trongApp: r['trong_app'] === true,
    push: r['push'] === true,
  }));
}

/**
 * Bảng cài đặt chỉ lưu NGOẠI LỆ: bật lại cả hai cờ thì xoá dòng đi thay vì giữ
 * một dòng "bật" thừa. Nhờ vậy đổi mặc định hệ thống về sau không phải dọn dữ liệu.
 */
export async function luuCaiDat(
  nhanVienId: number,
  moduleId: string,
  loaiSuKien: string,
  gt: { trongApp: boolean; push: boolean }
): Promise<void> {
  if (gt.trongApp && gt.push) {
    const { error } = await db
      .from(BANG_CAI_DAT)
      .delete()
      .eq('module_id', moduleId)
      .eq('loai_su_kien', loaiSuKien);
    if (error) throwSupabaseError(error);
    return;
  }

  const { error } = await db.from(BANG_CAI_DAT).upsert(
    {
      nhan_vien_id: nhanVienId,
      module_id: moduleId,
      loai_su_kien: loaiSuKien,
      trong_app: gt.trongApp,
      push: gt.push,
    },
    { onConflict: 'nhan_vien_id,module_id,loai_su_kien' }
  );
  if (error) throwSupabaseError(error);
}

export async function layTuyChon(): Promise<TuyChonThongBao> {
  const { data, error } = await db
    .from(BANG_TUY_CHON)
    .select('push_bat,gio_yen_lang_bat,gio_yen_lang_tu,gio_yen_lang_den')
    .limit(1);
  if (error) throwSupabaseError(error);

  const r = ((data ?? []) as Row[])[0];
  if (!r) return TUY_CHON_MAC_DINH;
  return {
    pushBat: r['push_bat'] === true,
    gioYenLangBat: r['gio_yen_lang_bat'] === true,
    gioYenLangTu: Number(r['gio_yen_lang_tu'] ?? TUY_CHON_MAC_DINH.gioYenLangTu),
    gioYenLangDen: Number(r['gio_yen_lang_den'] ?? TUY_CHON_MAC_DINH.gioYenLangDen),
  };
}

export async function luuTuyChon(nhanVienId: number, gt: TuyChonThongBao): Promise<void> {
  const { error } = await db.from(BANG_TUY_CHON).upsert(
    {
      nhan_vien_id: nhanVienId,
      push_bat: gt.pushBat,
      gio_yen_lang_bat: gt.gioYenLangBat,
      gio_yen_lang_tu: gt.gioYenLangTu,
      gio_yen_lang_den: gt.gioYenLangDen,
    },
    { onConflict: 'nhan_vien_id' }
  );
  if (error) throwSupabaseError(error);
}

// --- Thiết bị đã đăng ký push ------------------------------------------------

export async function layThietBi(): Promise<ThietBiPush[]> {
  const { data, error } = await db
    .from(BANG_THIET_BI)
    .select('id,endpoint,ten_thiet_bi,tg_tao,tg_dung_cuoi')
    .order('tg_tao', { ascending: false });
  if (error) throwSupabaseError(error);

  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r['id']),
    endpoint: (r['endpoint'] as string) ?? '',
    tenThietBi: (r['ten_thiet_bi'] as string | null) ?? null,
    tgTao: (r['tg_tao'] as string) ?? '',
    tgDungCuoi: (r['tg_dung_cuoi'] as string | null) ?? null,
  }));
}

export async function xoaThietBi(id: string): Promise<void> {
  const { error } = await db.from(BANG_THIET_BI).delete().eq('id', id);
  if (error) throwSupabaseError(error);
}
