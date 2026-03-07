import { supabase } from './supabase';

/**
 * Đảm bảo email có tài khoản Supabase Auth.
 * Gọi PostgreSQL function `ensure_auth_user` qua RPC (SECURITY DEFINER, chạy server-side).
 * - Nếu chưa có → tạo mới với mật khẩu mặc định 123456, email_confirm = true.
 * - Nếu đã có → bỏ qua (idempotent).
 * Trả về { created: true } nếu vừa tạo mới, { created: false } nếu đã tồn tại.
 */
export async function ensureAuthUser(email: string): Promise<{ created: boolean }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { created: false };

  const { data, error } = await supabase.rpc('ensure_auth_user', {
    p_email: trimmed,
  });

  if (error) {
    throw new Error(`Tạo tài khoản Auth thất bại: ${error.message}`);
  }

  return { created: !!(data as { created?: boolean })?.created };
}
