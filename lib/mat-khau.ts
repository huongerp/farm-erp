import { db } from './db';
import { formatSupabaseError } from './supabase-errors';

/**
 * Ghi mật khẩu vào `fp_var_nhan_vien.mat_khau_hash` qua RPC `rpc_set_mat_khau`
 * (xem docs/supabase-fp_var_nhan_vien_mat_khau.sql).
 *
 * Hash bcrypt được sinh SERVER-SIDE bằng pgcrypto, không hash ở browser. RPC là
 * đường ghi duy nhất cho cột này — `authenticated` không có quyền UPDATE trực tiếp.
 *
 * Quyền: admin đặt cho bất kỳ ai; user thường chỉ đặt cho chính mình.
 *
 * @param phaiDoi bật cờ buộc user đổi mật khẩu ở lần đăng nhập kế tiếp.
 */
export async function setMatKhauHash(
  nhanVienId: string | number,
  matKhau: string,
  phaiDoi = false
): Promise<void> {
  const { error } = await db.rpc('rpc_set_mat_khau', {
    p_nhan_vien_id: Number(nhanVienId),
    p_mat_khau: matKhau,
    p_phai_doi: phaiDoi,
  });

  if (error) throw new Error(formatSupabaseError(error, { resource: 'rpc_set_mat_khau' }));
}
