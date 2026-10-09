-- =============================================================================
-- 028-cong-viec-quyen-ghi.sql — Ghi fp_hc_cong_viec theo quyền module
--
-- Trước đây policy INSERT / UPDATE / DELETE của fp_hc_cong_viec là `true`: UI đã chặn
-- theo canCreate / canUpdate / canDelete (form, drawer, Kanban, thao tác hàng loạt) nhưng
-- ai đã đăng nhập gọi thẳng PostgREST vẫn tạo / sửa trạng thái / giao lại / xoá được.
-- → Khớp tầng app (`tinhCoQuyen`): create / update / delete hoặc admin / all trên
--   module `hanh-chinh/cong-viec`; cấp bậc 1 / chức vụ tt = 1 toàn quyền (fn_co_quyen_module).
--
-- Bình luận (cột trao_doi) mở cho MỌI người xem được công việc, kể cả không có quyền
-- sửa — trước đây frontend đọc cả mảng rồi UPDATE đè. Siết UPDATE sẽ chặn luôn bình luận,
-- nên chuyển sang RPC SECURITY DEFINER chỉ được phép nối thêm MỘT bình luận:
--   - người gửi lấy từ JWT (không tin tên / id client gửi lên),
--   - nối nguyên tử `trao_doi || entry` (hết cảnh hai người bình luận cùng lúc đè nhau).
-- Trigger thông báo vẫn chạy như cũ (actor_id lấy từ JWT, không phụ thuộc DEFINER).
--
-- SELECT giữ nguyên `true` (phạm vi xem đang lọc ở app, xem core/scope.ts).
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-028
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/028-cong-viec-quyen-ghi.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) RPC thêm bình luận
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_cong_viec_them_binh_luan(p_id_cong_viec bigint, p_noi_dung text)
    RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nv_id    bigint := public.nhan_vien_hien_tai_id();
  v_noi_dung text   := btrim(coalesce(p_noi_dung, ''));
  v_ten      text;
  v_entry    jsonb;
BEGIN
  IF v_nv_id IS NULL THEN
    RAISE EXCEPTION 'Không xác định được nhân viên đang đăng nhập' USING ERRCODE = '42501';
  END IF;
  IF v_noi_dung = '' THEN
    RAISE EXCEPTION 'Nội dung bình luận trống' USING ERRCODE = '22023';
  END IF;

  SELECT nv.ho_va_ten INTO v_ten FROM public.fp_var_nhan_vien nv WHERE nv.id = v_nv_id;

  -- Cùng khuôn phần tử frontend đã ghi trước đây (xem COMMENT cột trao_doi).
  v_entry := jsonb_build_object(
    'id', 'bl-' || floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint,
    'noi_dung', v_noi_dung,
    'nguoi_gui_id', v_nv_id::text,
    'ten_nguoi_gui', v_ten,
    'tg_gui', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );

  UPDATE public.fp_hc_cong_viec
     SET trao_doi = coalesce(trao_doi, '[]'::jsonb) || jsonb_build_array(v_entry)
   WHERE id = p_id_cong_viec;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Công việc không tồn tại' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_entry;
END;
$$;

COMMENT ON FUNCTION public.rpc_cong_viec_them_binh_luan(bigint, text) IS
  'Nối một bình luận vào fp_hc_cong_viec.trao_doi; người gửi lấy từ JWT. Mọi người đã đăng nhập gọi được (bình luận không cần quyền sửa).';

REVOKE ALL ON FUNCTION public.rpc_cong_viec_them_binh_luan(bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_cong_viec_them_binh_luan(bigint, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2) Policy ghi theo quyền module
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow insert fp_hc_cong_viec" ON public.fp_hc_cong_viec;
DROP POLICY IF EXISTS "Allow update fp_hc_cong_viec" ON public.fp_hc_cong_viec;
DROP POLICY IF EXISTS "Allow delete fp_hc_cong_viec" ON public.fp_hc_cong_viec;
DROP POLICY IF EXISTS fp_hc_cong_viec_insert_quyen ON public.fp_hc_cong_viec;
DROP POLICY IF EXISTS fp_hc_cong_viec_update_quyen ON public.fp_hc_cong_viec;
DROP POLICY IF EXISTS fp_hc_cong_viec_delete_quyen ON public.fp_hc_cong_viec;

CREATE POLICY fp_hc_cong_viec_insert_quyen ON public.fp_hc_cong_viec
  FOR INSERT TO authenticated
  WITH CHECK (public.fn_co_quyen_module('hanh-chinh/cong-viec', ARRAY['create', 'admin', 'all']));

CREATE POLICY fp_hc_cong_viec_update_quyen ON public.fp_hc_cong_viec
  FOR UPDATE TO authenticated
  USING (public.fn_co_quyen_module('hanh-chinh/cong-viec', ARRAY['update', 'admin', 'all']))
  WITH CHECK (public.fn_co_quyen_module('hanh-chinh/cong-viec', ARRAY['update', 'admin', 'all']));

CREATE POLICY fp_hc_cong_viec_delete_quyen ON public.fp_hc_cong_viec
  FOR DELETE TO authenticated
  USING (public.fn_co_quyen_module('hanh-chinh/cong-viec', ARRAY['delete', 'admin', 'all']));

COMMIT;
