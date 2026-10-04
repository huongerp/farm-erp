-- =============================================================================
-- 011-google-sheets-ket-noi.sql — Xuất Google Sheet (giai đoạn 2): role + bảng kết nối
--
-- Mỗi nhân viên tự kết nối tài khoản Google của mình (OAuth, scope drive.file) để
-- xuất dữ liệu ra Sheet. Token lưu ĐÃ MÃ HOÁ (AES-256-GCM, khoá SHEETS_TOKEN_KEY chỉ
-- service sheets biết) — lộ bảng này cũng không dùng được token.
-- Khớp services/sheets. Hướng dẫn cấu hình: docs/GOOGLE_SHEETS.md
--
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/011-google-sheets-ket-noi.sql
-- Lần đầu chạy sẽ in MẬT KHẨU role sheets_service ra NOTICE — ghi ngay vào
-- SHEETS_DATABASE_URL (Dokploy) và SHEETS_SERVICE_DB_PASSWORD (.env dev).
-- =============================================================================

BEGIN;

-- 1) Role riêng cho service sheets — chỉ chạm bảng của chính nó ------------------
DO $$
DECLARE
  v_mk text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sheets_service') THEN
    v_mk := encode(extensions.gen_random_bytes(24), 'hex');
    EXECUTE format(
      'CREATE ROLE sheets_service WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD %L',
      v_mk
    );
    RAISE NOTICE 'Đã tạo role sheets_service. MẬT KHẨU (chỉ in một lần): %', v_mk;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO sheets_service;

-- 2) Kết nối Google của từng nhân viên ------------------------------------------
CREATE TABLE public.fp_var_google_ket_noi (
    nhan_vien_id bigint PRIMARY KEY REFERENCES public.fp_var_nhan_vien(id) ON DELETE CASCADE,
    google_email text NOT NULL,
    refresh_token_mahoa text NOT NULL,
    access_token_mahoa text,
    access_token_het_han timestamp with time zone,
    -- 'hong' = Google trả invalid_grant (người dùng thu hồi quyền / đổi mật khẩu) → phải kết nối lại.
    trang_thai text DEFAULT 'hoat_dong' NOT NULL,
    tg_tao timestamp with time zone DEFAULT now() NOT NULL,
    tg_cap_nhat timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fp_var_google_ket_noi_trang_thai_check
      CHECK (trang_thai = ANY (ARRAY['hoat_dong'::text, 'hong'::text]))
);

COMMENT ON TABLE public.fp_var_google_ket_noi IS
  'Kết nối Google (OAuth drive.file) của nhân viên để xuất/đồng bộ Google Sheet. Token mã hoá AES-256-GCM ở services/sheets.';

ALTER TABLE public.fp_var_google_ket_noi ENABLE ROW LEVEL SECURITY;

-- Người dùng app KHÔNG đọc trực tiếp (kể cả token mã hoá) — mọi thao tác qua /sheets/*.
REVOKE ALL ON TABLE public.fp_var_google_ket_noi FROM PUBLIC, anon, authenticated;

CREATE POLICY "Service sheets toàn quyền kết nối" ON public.fp_var_google_ket_noi
  TO sheets_service USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fp_var_google_ket_noi TO sheets_service;

COMMIT;
