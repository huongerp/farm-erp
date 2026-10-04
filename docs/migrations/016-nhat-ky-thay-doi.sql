-- =============================================================================
-- 016-nhat-ky-thay-doi.sql — Nhật ký ai thêm / sửa / xoá gì, lúc nào
--
-- Trước đây chỉ có cột tg_cap_nhat: không biết ai sửa, giá trị cũ là gì; dữ liệu xoá là mất
-- hẳn. Các cột người tạo / người duyệt lại do trình duyệt gửi lên nên giả mạo được.
-- Nhật ký ghi người thực hiện THẬT lấy từ JWT phía DB (nhan_vien_hien_tai_id()).
--
-- - INSERT: lưu dòng mới · UPDATE: chỉ các cột đổi (cũ / mới) · DELETE: lưu nguyên dòng cũ
--   → khôi phục được dữ liệu xoá nhầm (trừ giá trị quá dài, xem dưới).
-- - Giá trị JSON dài > 2000 ký tự (ảnh base64, chữ ký…) thay bằng "<lược N ký tự>" để nhật ký
--   không phình; mat_khau_hash luôn che.
-- - Bỏ qua bảng hệ thống thay đổi liên tục (thông báo, phiên đăng nhập, push, đồng bộ Sheet…).
-- - Chỉ cấp cao (cấp bậc 1 / chức vụ tt = 1) đọc được; không ai sửa / xoá được qua API.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-016
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/016-nhat-ky-thay-doi.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.fp_var_nhat_ky_thay_doi (
  id            bigserial PRIMARY KEY,
  thoi_diem     timestamptz NOT NULL DEFAULT now(),
  bang          text NOT NULL,
  ban_ghi_id    text,
  thao_tac      text NOT NULL CHECK (thao_tac IN ('them', 'sua', 'xoa')),
  -- NULL khi thay đổi đến từ SQL tay / service không mang JWT nhân viên.
  nhan_vien_id  bigint,
  -- Role gửi request: authenticated (app), auth_service, notify_service, 5fedu (SQL tay)…
  nguon         text,
  du_lieu_cu    jsonb,
  du_lieu_moi   jsonb
);

COMMENT ON TABLE public.fp_var_nhat_ky_thay_doi IS
  'Nhật ký thêm/sửa/xoá trên bảng nghiệp vụ — ghi bởi trigger fn_ghi_nhat_ky_thay_doi (migration 016)';

CREATE INDEX IF NOT EXISTS idx_nhat_ky_bang_ban_ghi ON public.fp_var_nhat_ky_thay_doi (bang, ban_ghi_id);
CREATE INDEX IF NOT EXISTS idx_nhat_ky_thoi_diem ON public.fp_var_nhat_ky_thay_doi (thoi_diem DESC);
CREATE INDEX IF NOT EXISTS idx_nhat_ky_nhan_vien ON public.fp_var_nhat_ky_thay_doi (nhan_vien_id, thoi_diem DESC);

ALTER TABLE public.fp_var_nhat_ky_thay_doi ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.fp_var_nhat_ky_thay_doi FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.fp_var_nhat_ky_thay_doi_id_seq FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.fp_var_nhat_ky_thay_doi TO authenticated;

-- fn_co_quyen_module trả true cho cấp cao bất kể module → module giả 'he-thong/nhat-ky'
-- nghĩa là "chỉ cấp cao" cho tới khi có màn hình + quyền riêng.
CREATE POLICY fp_var_nhat_ky_xem_cap_cao ON public.fp_var_nhat_ky_thay_doi
  FOR SELECT TO authenticated
  USING (public.fn_co_quyen_module('he-thong/nhat-ky', ARRAY['admin', 'all']));

-- Rút gọn giá trị lớn và che mật khẩu.
CREATE OR REPLACE FUNCTION public.fn_nhat_ky_rut_gon(p jsonb)
  RETURNS jsonb
  LANGUAGE sql IMMUTABLE
  SET search_path TO 'public'
  AS $$
  SELECT jsonb_object_agg(
           e.key,
           CASE
             WHEN e.key = 'mat_khau_hash' THEN to_jsonb('***'::text)
             WHEN length(e.value::text) > 2000 THEN to_jsonb('<lược ' || length(e.value::text) || ' ký tự>')
             ELSE e.value
           END)
  FROM jsonb_each(p) AS e;
$$;

CREATE OR REPLACE FUNCTION public.fn_ghi_nhat_ky_thay_doi()
  RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
  AS $$
DECLARE
  v_cu  jsonb;
  v_moi jsonb;
  v_id  text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_moi := to_jsonb(NEW);
    v_id  := v_moi ->> 'id';
    v_moi := public.fn_nhat_ky_rut_gon(v_moi);
  ELSIF TG_OP = 'DELETE' THEN
    v_cu := to_jsonb(OLD);
    v_id := v_cu ->> 'id';
    v_cu := public.fn_nhat_ky_rut_gon(v_cu);
  ELSE
    v_id := to_jsonb(NEW) ->> 'id';
    SELECT jsonb_object_agg(n.key, o.value), jsonb_object_agg(n.key, n.value)
      INTO v_cu, v_moi
    FROM jsonb_each(to_jsonb(NEW)) AS n
    JOIN jsonb_each(to_jsonb(OLD)) AS o USING (key)
    WHERE n.value IS DISTINCT FROM o.value
      AND n.key NOT IN ('tg_cap_nhat', 'updated_at');
    -- Chỉ chạm tg_cap_nhat (hoặc UPDATE không đổi gì) → không ghi.
    IF v_moi IS NULL THEN
      RETURN NULL;
    END IF;
    v_cu  := public.fn_nhat_ky_rut_gon(v_cu);
    v_moi := public.fn_nhat_ky_rut_gon(v_moi);
  END IF;

  INSERT INTO public.fp_var_nhat_ky_thay_doi (bang, ban_ghi_id, thao_tac, nhan_vien_id, nguon, du_lieu_cu, du_lieu_moi)
  VALUES (
    TG_TABLE_NAME,
    v_id,
    CASE TG_OP WHEN 'INSERT' THEN 'them' WHEN 'UPDATE' THEN 'sua' ELSE 'xoa' END,
    public.nhan_vien_hien_tai_id(),
    COALESCE(NULLIF(auth.jwt() ->> 'role', ''), session_user::text),
    v_cu,
    v_moi
  );
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_ghi_nhat_ky_thay_doi() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_nhat_ky_rut_gon(jsonb) FROM PUBLIC, anon;

-- Gắn vào mọi bảng fp_* trừ bảng hệ thống thay đổi liên tục / không phải dữ liệu nghiệp vụ.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname LIKE 'fp\_%'
      AND c.relname NOT IN (
        'fp_var_nhat_ky_thay_doi',
        'fp_var_thong_bao',
        'fp_var_su_kien_thong_bao',
        'fp_var_thong_bao_cai_dat',
        'fp_var_thong_bao_tuy_chon',
        'fp_var_push_subscription',
        'fp_var_phien_dang_nhap',
        'fp_var_lan_dang_nhap_sai',
        'fp_var_dong_bo_sheet',
        'fp_var_google_ket_noi',
        'fp_mh_phieu_kho_so_phieu'
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_nhat_ky_thay_doi ON public.%I', r.relname);
    EXECUTE format(
      'CREATE TRIGGER trg_nhat_ky_thay_doi AFTER INSERT OR UPDATE OR DELETE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_nhat_ky_thay_doi()',
      r.relname
    );
  END LOOP;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
