import { Pool } from 'pg';
import { config } from './config.ts';

/**
 * Kết nối bằng role `auth_service`: không có quyền bảng nào, chỉ EXECUTE được
 * các RPC dưới đây (docs/vps-04-auth-schema.sql). Nên nếu service này bị chiếm,
 * kẻ tấn công vẫn không SELECT thẳng được bảng nào.
 */
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[db] lỗi trên connection rảnh:', err.message);
});

/** Mọi RPC ở đây trả JSONB một dòng. */
async function goiRpc<T>(sql: string, params: unknown[]): Promise<T> {
  const kq = await pool.query<{ kq: T }>(sql, params);
  return kq.rows[0]!.kq;
}

/** Payload chung của 3 nhánh tạo phiên. */
export type KetQuaDangNhap =
  | { ok: true; nhan_vien_id: number; email: string; ho_va_ten: string | null; phai_doi_mat_khau: boolean; refresh_token: string; refresh_het_han: string }
  | { ok: false; ly_do: 'sai_thong_tin' | 'bi_chan' | 'nghi_viec' | 'khong_co_ho_so' };

export function dangNhapMatKhau(
  email: string,
  matKhau: string,
  userAgent: string | null,
  ip: string | null
): Promise<KetQuaDangNhap> {
  return goiRpc('SELECT public.rpc_dang_nhap($1, $2, $3, $4) AS kq', [email, matKhau, userAgent, ip]);
}

export function dangNhapGoogle(
  email: string,
  userAgent: string | null,
  ip: string | null
): Promise<KetQuaDangNhap> {
  return goiRpc('SELECT public.rpc_dang_nhap_google($1, $2, $3) AS kq', [email, userAgent, ip]);
}

export type KetQuaLamMoi =
  | { ok: true; nhan_vien_id: number; email: string; refresh_token: string; refresh_het_han: string }
  | { ok: false; ly_do: 'phien_khong_hop_le' | 'nghi_viec' };

export function lamMoiPhien(
  refreshHash: string,
  userAgent: string | null,
  ip: string | null
): Promise<KetQuaLamMoi> {
  return goiRpc('SELECT public.rpc_lam_moi_phien($1, $2, $3) AS kq', [refreshHash, userAgent, ip]);
}

export async function thuHoiPhien(refreshHash: string): Promise<void> {
  await pool.query('SELECT public.rpc_thu_hoi_phien($1)', [refreshHash]);
}

export async function kiemTraKetNoi(): Promise<void> {
  await pool.query('SELECT 1');
}

export function dongPool(): Promise<void> {
  return pool.end();
}
