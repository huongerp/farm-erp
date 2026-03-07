-- =============================================================================
-- Bảng fp_var_login_devices – Thiết bị đăng nhập (phiên đăng nhập theo thiết bị)
-- Đồng bộ với app: Thiết bị đăng nhập. App ghi/đọc tại đây, đăng xuất từ xa qua RPC.
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_var_login_devices (
  id                  uuid PRIMARY KEY,
  user_id             uuid NOT NULL,
  email_user          text,
  ten_user            text,
  ten_thiet_bi        text,
  loai_thiet_bi       text CHECK (loai_thiet_bi IN ('desktop', 'mobile', 'tablet')),
  trinh_duyet         text,
  he_dieu_hanh        text,
  dia_chi_ip          text,
  tg_dang_nhap_cuoi   timestamptz NOT NULL DEFAULT now(),
  trang_thai          smallint NOT NULL DEFAULT 1 CHECK (trang_thai IN (0, 1)),
  tg_tao              timestamptz DEFAULT now(),
  tg_cap_nhat         timestamptz DEFAULT now()
);

COMMENT ON TABLE fp_var_login_devices IS 'Phiên đăng nhập theo thiết bị – app cập nhật khi load/đăng nhập, đăng xuất từ xa qua revoke_session';
COMMENT ON COLUMN fp_var_login_devices.id IS 'session_id từ Supabase Auth (JWT session id)';
COMMENT ON COLUMN fp_var_login_devices.user_id IS 'auth.users.id của user đăng nhập';
COMMENT ON COLUMN fp_var_login_devices.trang_thai IS '1=đang hoạt động, 0=đã đăng xuất từ xa';

CREATE INDEX IF NOT EXISTS idx_fp_var_login_devices_user_id ON fp_var_login_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_fp_var_login_devices_tg_dang_nhap_cuoi ON fp_var_login_devices(tg_dang_nhap_cuoi DESC);
CREATE INDEX IF NOT EXISTS idx_fp_var_login_devices_trang_thai ON fp_var_login_devices(trang_thai);

ALTER TABLE fp_var_login_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User đọc thiết bị của chính mình"
  ON fp_var_login_devices FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "User thêm thiết bị của chính mình"
  ON fp_var_login_devices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User cập nhật thiết bị của chính mình"
  ON fp_var_login_devices FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User xóa thiết bị của chính mình"
  ON fp_var_login_devices FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- RPC: Thu hồi phiên đăng nhập (đăng xuất thiết bị từ xa)
-- Chỉ xóa session thuộc user đang gọi (auth.uid()). Gọi từ app: supabase.rpc('revoke_session', { p_session_id: '...' })
-- Lưu ý: Hàm cần chạy bởi role có quyền DELETE trên auth.sessions (thường là postgres/supabase_admin).
-- Nếu báo lỗi permission, chạy toàn bộ script bằng tài khoản owner của project.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.revoke_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.sessions
  WHERE id = p_session_id
    AND user_id = auth.uid();
END;
$$;

COMMENT ON FUNCTION public.revoke_session(uuid) IS 'Xóa phiên auth.sessions nếu thuộc user hiện tại – dùng cho đăng xuất thiết bị từ xa';

GRANT EXECUTE ON FUNCTION public.revoke_session(uuid) TO authenticated;
