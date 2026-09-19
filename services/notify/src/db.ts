/**
 * Truy cập Postgres bằng role `notify_service`.
 *
 * Role này chỉ có quyền trên 4 bảng thông báo và 3 RPC tra cứu (xem
 * docs/supabase-fp_var_su_kien_thong_bao.sql). Nếu service bị chiếm, kẻ tấn công
 * vẫn không đọc được bảng nghiệp vụ nào — cùng nguyên tắc với auth_service.
 */

import { Pool } from 'pg';
import { config } from './config.ts';
import type { DongOutbox } from './core/types.ts';
import type { NguoiDuyet } from './core/routing.ts';
import type { CaiDatNgoaiLe, TuyChonChung } from './core/nen-gui-push.ts';
import { chuanHoaDongOutbox } from './core/chuan-hoa.ts';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[notify/db] lỗi trên connection rảnh:', err.message);
});

// --- Outbox ------------------------------------------------------------------

export async function laySuKienChuaXuLy(gioiHan: number): Promise<DongOutbox[]> {
  const kq = await pool.query<Record<string, unknown>>(
    `SELECT id, module_id, bang, ban_ghi_id, thao_tac,
            trang_thai_cu, trang_thai_moi, actor_id, payload, payload_cu
       FROM public.fp_var_su_kien_thong_bao
      WHERE tg_xu_ly IS NULL
        AND so_lan_thu < $2
      ORDER BY id
      LIMIT $1`,
    [gioiHan, config.soLanThuToiDa]
  );
  return kq.rows.map(chuanHoaDongOutbox);
}

export async function laySuKienTheoId(id: number): Promise<DongOutbox | null> {
  const kq = await pool.query<Record<string, unknown>>(
    `SELECT id, module_id, bang, ban_ghi_id, thao_tac,
            trang_thai_cu, trang_thai_moi, actor_id, payload, payload_cu
       FROM public.fp_var_su_kien_thong_bao
      WHERE id = $1 AND tg_xu_ly IS NULL`,
    [id]
  );
  const r = kq.rows[0];
  return r ? chuanHoaDongOutbox(r) : null;
}

export async function danhDauDaXuLy(id: number): Promise<void> {
  await pool.query('UPDATE public.fp_var_su_kien_thong_bao SET tg_xu_ly = now() WHERE id = $1', [id]);
}

export async function ghiLoiSuKien(id: number, loi: string): Promise<void> {
  await pool.query(
    `UPDATE public.fp_var_su_kien_thong_bao
        SET so_lan_thu = so_lan_thu + 1, loi_cuoi = $2
      WHERE id = $1`,
    [id, loi.slice(0, 1000)]
  );
}

// --- Tra cứu định tuyến ------------------------------------------------------

export async function layNguoiDuyet(moduleId: string, chiNhanhId: number | null): Promise<NguoiDuyet[]> {
  const kq = await pool.query<{ nhan_vien_id: string; cap_bac: number }>(
    'SELECT nhan_vien_id, cap_bac FROM public.rpc_tb_nguoi_duyet($1, $2)',
    [moduleId, chiNhanhId]
  );
  return kq.rows.map((r) => ({ nhanVienId: Number(r.nhan_vien_id), capBac: Number(r.cap_bac) }));
}

export async function layChiNhanhPhieu(bang: string, banGhiId: number): Promise<number | null> {
  const kq = await pool.query<{ kq: string | null }>(
    'SELECT public.rpc_tb_chi_nhanh_phieu($1, $2) AS kq',
    [bang, banGhiId]
  );
  const v = kq.rows[0]?.kq;
  return v === null || v === undefined ? null : Number(v);
}

export async function layTenNhanVien(ids: number[]): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map();
  const kq = await pool.query<{ id: string; ho_va_ten: string }>(
    'SELECT id, ho_va_ten FROM public.rpc_tb_ten_nhan_vien($1::bigint[])',
    [ids]
  );
  return new Map(kq.rows.map((r) => [Number(r.id), r.ho_va_ten]));
}

// --- Ghi thông báo -----------------------------------------------------------

export interface DongThongBaoCu {
  id: number;
  tgCapNhat: Date;
}

/** Dòng gần nhất cùng khoá gộp, để quyết định gộp hay tạo mới. */
export async function timThongBaoDeGop(
  nguoiNhanId: number,
  bang: string,
  banGhiId: number,
  loaiSuKien: string
): Promise<DongThongBaoCu | null> {
  const kq = await pool.query<{ id: string; tg_cap_nhat: Date }>(
    `SELECT id, tg_cap_nhat
       FROM public.fp_var_thong_bao
      WHERE nguoi_nhan_id = $1 AND bang = $2 AND ban_ghi_id = $3 AND loai_su_kien = $4
        AND da_xoa = false
      ORDER BY tg_cap_nhat DESC
      LIMIT 1`,
    [nguoiNhanId, bang, banGhiId, loaiSuKien]
  );
  const r = kq.rows[0];
  return r ? { id: Number(r.id), tgCapNhat: r.tg_cap_nhat } : null;
}

export interface ThamSoGhiThongBao {
  nguoiNhanId: number;
  moduleId: string;
  loaiSuKien: string;
  muc: string;
  tieuDe: string;
  noiDung: string | null;
  link: string | null;
  bang: string;
  banGhiId: number;
  suKienId: number;
  duLieu: Record<string, unknown>;
}

export async function ghiThongBao(t: ThamSoGhiThongBao): Promise<number> {
  const kq = await pool.query<{ id: string }>(
    `INSERT INTO public.fp_var_thong_bao
       (nguoi_nhan_id, module_id, loai_su_kien, muc, tieu_de, noi_dung, link,
        bang, ban_ghi_id, su_kien_id, du_lieu)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      t.nguoiNhanId, t.moduleId, t.loaiSuKien, t.muc, t.tieuDe, t.noiDung, t.link,
      t.bang, t.banGhiId, t.suKienId, JSON.stringify(t.duLieu),
    ]
  );
  return Number(kq.rows[0]!.id);
}

/**
 * Gộp vào dòng cũ: tăng số lần, làm mới nội dung và bật lại thành chưa đọc.
 * Bật lại chưa đọc là có chủ ý — sự kiện vừa lặp lại nên người nhận cần thấy.
 */
export async function gopThongBao(
  id: number,
  tieuDe: string,
  noiDung: string | null
): Promise<void> {
  await pool.query(
    `UPDATE public.fp_var_thong_bao
        SET so_lan = so_lan + 1, tieu_de = $2, noi_dung = $3, da_doc = false
      WHERE id = $1`,
    [id, tieuDe, noiDung]
  );
}

// --- Cài đặt người nhận ------------------------------------------------------

/**
 * Số thông báo chưa đọc của một người — gửi kèm payload push để service worker
 * đặt badge trên icon app. Tính ở server vì lúc push đến, app có thể đang đóng
 * và service worker không có token để tự hỏi PostgREST.
 */
export async function demChuaDoc(nhanVienId: number): Promise<number> {
  const kq = await pool.query<{ so: string }>(
    `SELECT count(*)::text AS so
       FROM public.fp_var_thong_bao
      WHERE nguoi_nhan_id = $1 AND da_doc = false AND da_xoa = false`,
    [nhanVienId]
  );
  return Number(kq.rows[0]?.so ?? 0);
}

export async function layCaiDatNgoaiLe(nhanVienId: number): Promise<CaiDatNgoaiLe[]> {
  const kq = await pool.query<{ module_id: string; loai_su_kien: string; trong_app: boolean; push: boolean }>(
    `SELECT module_id, loai_su_kien, trong_app, push
       FROM public.fp_var_thong_bao_cai_dat
      WHERE nhan_vien_id = $1`,
    [nhanVienId]
  );
  return kq.rows.map((r) => ({
    moduleId: r.module_id,
    loaiSuKien: r.loai_su_kien,
    trongApp: r.trong_app,
    push: r.push,
  }));
}

export async function layTuyChon(nhanVienId: number): Promise<TuyChonChung | null> {
  const kq = await pool.query<{
    push_bat: boolean; gio_yen_lang_bat: boolean; gio_yen_lang_tu: number; gio_yen_lang_den: number;
  }>(
    `SELECT push_bat, gio_yen_lang_bat, gio_yen_lang_tu, gio_yen_lang_den
       FROM public.fp_var_thong_bao_tuy_chon
      WHERE nhan_vien_id = $1`,
    [nhanVienId]
  );
  const r = kq.rows[0];
  return r
    ? {
        pushBat: r.push_bat,
        gioYenLangBat: r.gio_yen_lang_bat,
        gioYenLangTu: Number(r.gio_yen_lang_tu),
        gioYenLangDen: Number(r.gio_yen_lang_den),
      }
    : null;
}

// --- Đăng ký push ------------------------------------------------------------

export interface DongSubscription {
  id: number;
  endpoint: string;
  p256dh: string;
  authKey: string;
}

export async function laySubscription(nhanVienId: number): Promise<DongSubscription[]> {
  const kq = await pool.query<{ id: string; endpoint: string; p256dh: string; auth_key: string }>(
    'SELECT id, endpoint, p256dh, auth_key FROM public.fp_var_push_subscription WHERE nhan_vien_id = $1',
    [nhanVienId]
  );
  return kq.rows.map((r) => ({ id: Number(r.id), endpoint: r.endpoint, p256dh: r.p256dh, authKey: r.auth_key }));
}

export async function luuSubscription(t: {
  nhanVienId: number;
  endpoint: string;
  p256dh: string;
  authKey: string;
  userAgent: string | null;
  tenThietBi: string | null;
}): Promise<void> {
  // Cùng một endpoint có thể đổi chủ khi hai người dùng chung máy — ON CONFLICT
  // cập nhật lại nhan_vien_id thay vì để thông báo chạy nhầm tài khoản.
  await pool.query(
    `INSERT INTO public.fp_var_push_subscription
       (nhan_vien_id, endpoint, p256dh, auth_key, user_agent, ten_thiet_bi, tg_dung_cuoi)
     VALUES ($1,$2,$3,$4,$5,$6, now())
     ON CONFLICT (endpoint) DO UPDATE
        SET nhan_vien_id = EXCLUDED.nhan_vien_id,
            p256dh       = EXCLUDED.p256dh,
            auth_key     = EXCLUDED.auth_key,
            user_agent   = EXCLUDED.user_agent,
            ten_thiet_bi = EXCLUDED.ten_thiet_bi,
            tg_dung_cuoi = now(),
            so_lan_loi   = 0`,
    [t.nhanVienId, t.endpoint, t.p256dh, t.authKey, t.userAgent, t.tenThietBi]
  );
}

export async function xoaSubscriptionTheoEndpoint(endpoint: string): Promise<void> {
  await pool.query('DELETE FROM public.fp_var_push_subscription WHERE endpoint = $1', [endpoint]);
}

export async function danhDauDaDungSubscription(id: number): Promise<void> {
  await pool.query(
    'UPDATE public.fp_var_push_subscription SET tg_dung_cuoi = now(), so_lan_loi = 0 WHERE id = $1',
    [id]
  );
}

export async function tangLoiSubscription(id: number): Promise<void> {
  await pool.query('UPDATE public.fp_var_push_subscription SET so_lan_loi = so_lan_loi + 1 WHERE id = $1', [id]);
}

export async function kiemTraKetNoi(): Promise<void> {
  await pool.query('SELECT 1');
}

export function dongPool(): Promise<void> {
  return pool.end();
}
