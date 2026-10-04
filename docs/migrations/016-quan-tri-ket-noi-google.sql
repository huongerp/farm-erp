-- =============================================================================
-- 016-quan-tri-ket-noi-google.sql — Hệ thống > Kết nối Google (quản trị)
--
-- Quản trị xem ai đã kết nối email Google nào, lịch đồng bộ nào đang lỗi; tạm dừng/bật lại,
-- xoá lịch, ngắt kết nối Google của một nhân viên. Khớp features/he-thong/ket-noi-google.
--
-- Hai bảng fp_var_google_ket_noi / fp_var_dong_bo_sheet vẫn KHOÁ với người dùng app (chỉ
-- sheets_service đọc). Mọi thao tác đi qua RPC SECURITY DEFINER dưới đây: mỗi RPC tự kiểm
-- quyền trên module 'he-thong/ket-noi-google' bằng fn_co_quyen_module (migration 013) và
-- KHÔNG BAO GIỜ trả cột token.
--
-- Phân quyền: chép y module 'he-thong/phan-quyen' — chức vụ nào có quyền gì ở Phân quyền thì
-- có đúng quyền đó ở Kết nối Google.
--
-- Chạy SAU 011, 012, 013: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/016-quan-tri-ket-noi-google.sql
-- =============================================================================

BEGIN;

-- 1) Chép quyền từ module Phân quyền --------------------------------------------
INSERT INTO public.fp_var_phan_quyen (chuc_vu_id, module_id, actions)
SELECT chuc_vu_id, 'he-thong/ket-noi-google', actions
  FROM public.fp_var_phan_quyen
 WHERE module_id = 'he-thong/phan-quyen'
ON CONFLICT (chuc_vu_id, module_id) DO NOTHING;

-- 2) Danh sách kết nối -------------------------------------------------------------
CREATE FUNCTION public.rpc_qt_ket_noi_google_ds()
    RETURNS TABLE(
      nhan_vien_id bigint,
      ho_va_ten text,
      ten_phong_ban text,
      ten_chuc_vu text,
      trang_thai_nhan_vien text,
      google_email text,
      trang_thai text,
      tg_tao timestamp with time zone,
      tg_cap_nhat timestamp with time zone,
      so_lich integer,
      so_lich_dang_bat integer,
      so_lich_loi integer,
      lan_dong_bo_cuoi timestamp with time zone
    )
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.fn_co_quyen_module('he-thong/ket-noi-google', ARRAY['view', 'admin', 'all']) THEN
    RAISE EXCEPTION 'Bạn không có quyền xem danh sách kết nối Google.';
  END IF;
  RETURN QUERY
  SELECT k.nhan_vien_id,
         nv.ho_va_ten,
         nv.ten_phong_ban,
         nv.ten_chuc_vu,
         nv.trang_thai,
         k.google_email,
         k.trang_thai,
         k.tg_tao,
         k.tg_cap_nhat,
         COUNT(l.id)::integer,
         (COUNT(l.id) FILTER (WHERE l.bat))::integer,
         (COUNT(l.id) FILTER (WHERE l.ket_qua_cuoi = 'loi'))::integer,
         MAX(l.lan_chay_cuoi)
    FROM public.fp_var_google_ket_noi k
    LEFT JOIN public.fp_var_nhan_vien nv ON nv.id = k.nhan_vien_id
    LEFT JOIN public.fp_var_dong_bo_sheet l ON l.nhan_vien_id = k.nhan_vien_id
   GROUP BY k.nhan_vien_id, nv.ho_va_ten, nv.ten_phong_ban, nv.ten_chuc_vu, nv.trang_thai,
            k.google_email, k.trang_thai, k.tg_tao, k.tg_cap_nhat
   ORDER BY k.tg_tao DESC;
END;
$$;

-- 3) Lịch đồng bộ (của một nhân viên, hoặc tất cả khi p_nhan_vien_id NULL) ------------
CREATE FUNCTION public.rpc_qt_lich_dong_bo_ds(p_nhan_vien_id bigint DEFAULT NULL)
    RETURNS TABLE(
      id bigint,
      nhan_vien_id bigint,
      module_id text,
      ten_file text,
      sheet_title text,
      spreadsheet_url text,
      tan_suat text,
      gio smallint,
      thu smallint,
      ngay_thang smallint,
      bat boolean,
      can_chay boolean,
      lan_chay_cuoi timestamp with time zone,
      ket_qua_cuoi text,
      thong_diep_cuoi text,
      so_dong_cuoi integer,
      so_loi_lien_tiep integer,
      lan_chay_ke_tiep timestamp with time zone,
      so_cot integer,
      tg_tao timestamp with time zone
    )
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.fn_co_quyen_module('he-thong/ket-noi-google', ARRAY['view', 'admin', 'all']) THEN
    RAISE EXCEPTION 'Bạn không có quyền xem lịch đồng bộ Google Sheet.';
  END IF;
  RETURN QUERY
  SELECT l.id, l.nhan_vien_id, l.module_id, l.ten_file, l.sheet_title, l.spreadsheet_url,
         l.tan_suat, l.gio, l.thu, l.ngay_thang, l.bat, l.can_chay, l.lan_chay_cuoi,
         l.ket_qua_cuoi, l.thong_diep_cuoi, l.so_dong_cuoi, l.so_loi_lien_tiep,
         l.lan_chay_ke_tiep, jsonb_array_length(l.cot)::integer, l.tg_tao
    FROM public.fp_var_dong_bo_sheet l
   WHERE p_nhan_vien_id IS NULL OR l.nhan_vien_id = p_nhan_vien_id
   ORDER BY l.id DESC;
END;
$$;

-- 4) Tạm dừng / bật lại lịch — quyền sửa ----------------------------------------------
-- Bật lại: xoá đếm lỗi; lịch "khi có thay đổi" đánh dấu cần chạy để bắt kịp phần đổi trong
-- lúc tắt (cùng logic capNhatLich ở services/sheets/src/db.ts).
CREATE FUNCTION public.rpc_qt_lich_dong_bo_bat(p_id bigint, p_bat boolean)
    RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.fn_co_quyen_module('he-thong/ket-noi-google', ARRAY['update', 'admin', 'all']) THEN
    RAISE EXCEPTION 'Bạn không có quyền tạm dừng / bật lại lịch đồng bộ.';
  END IF;
  UPDATE public.fp_var_dong_bo_sheet
     SET bat = p_bat,
         so_loi_lien_tiep = CASE WHEN p_bat AND NOT bat THEN 0 ELSE so_loi_lien_tiep END,
         can_chay = CASE WHEN p_bat AND NOT bat AND tan_suat = 'khi_thay_doi' THEN true ELSE can_chay END,
         thay_doi_dau_luc = CASE WHEN p_bat AND NOT bat AND tan_suat = 'khi_thay_doi'
                                 THEN now() - interval '1 day' ELSE thay_doi_dau_luc END,
         -- Lịch định kỳ bật lại mà mốc cũ đã qua → chạy ở lượt quét kế tiếp.
         lan_chay_ke_tiep = CASE WHEN p_bat AND NOT bat AND tan_suat <> 'khi_thay_doi'
                                 THEN LEAST(COALESCE(lan_chay_ke_tiep, now()), now()) ELSE lan_chay_ke_tiep END,
         tg_cap_nhat = now()
   WHERE id = p_id;
  RETURN FOUND;
END;
$$;

-- 5) Xoá lịch — quyền xoá ------------------------------------------------------------
CREATE FUNCTION public.rpc_qt_lich_dong_bo_xoa(p_id bigint)
    RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.fn_co_quyen_module('he-thong/ket-noi-google', ARRAY['delete', 'admin', 'all']) THEN
    RAISE EXCEPTION 'Bạn không có quyền xoá lịch đồng bộ.';
  END IF;
  DELETE FROM public.fp_var_dong_bo_sheet WHERE id = p_id;
  RETURN FOUND;
END;
$$;

-- 6) Ngắt kết nối Google của một nhân viên — quyền xoá --------------------------------
-- Xoá dòng kết nối = token (đã mã hoá) bị xoá khỏi hệ thống; FK ON DELETE CASCADE xoá luôn
-- mọi lịch của người đó — y hệt khi chính chủ bấm "Ngắt kết nối". Không revoke phía Google
-- (DB không gọi mạng): quyền app vẫn hiện ở tài khoản Google của họ nhưng hệ thống hết token.
CREATE FUNCTION public.rpc_qt_ket_noi_google_ngat(p_nhan_vien_id bigint)
    RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.fn_co_quyen_module('he-thong/ket-noi-google', ARRAY['delete', 'admin', 'all']) THEN
    RAISE EXCEPTION 'Bạn không có quyền ngắt kết nối Google của nhân viên.';
  END IF;
  DELETE FROM public.fp_var_google_ket_noi WHERE nhan_vien_id = p_nhan_vien_id;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_qt_ket_noi_google_ds() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_qt_lich_dong_bo_ds(bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_qt_lich_dong_bo_bat(bigint, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_qt_lich_dong_bo_xoa(bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_qt_ket_noi_google_ngat(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_qt_ket_noi_google_ds() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_qt_lich_dong_bo_ds(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_qt_lich_dong_bo_bat(bigint, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_qt_lich_dong_bo_xoa(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_qt_ket_noi_google_ngat(bigint) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
