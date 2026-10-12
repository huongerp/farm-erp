-- 039: Trao đổi trên dòng hàng phiếu đề xuất — chỉ cấp cao ghi.
--
-- Cột `trao_doi` (log nhiều dòng, đã có ở 3 bảng chi tiết) giờ sửa được từ drawer chi tiết phiếu:
-- popup chứa sẵn log cũ + dòng mới `[dd/mm/yyyy HH:mm] Tên: `, lưu là ghi đè cả cột.
-- Ghi qua RPC riêng cho từng bảng (sửa phiếu thì xoá + chèn lại toàn bộ chi tiết, không dùng được):
--   - chỉ quản trị module (admin/all) hoặc cấp bậc 1 — `fn_co_quyen_module` (migration 013);
--   - khoá lạc quan: `p_trao_doi_cu` phải khớp giá trị đang lưu, tránh đè mất dòng "Chuyển tiến độ"
--     hay trao đổi của người khác vừa ghi trong lúc popup đang mở.
-- Trigger nhật ký (trg_nhat_ky_thay_doi) đã có trên các bảng → vẫn ghi người sửa thật từ JWT.

BEGIN;

-- Mua hàng — phiếu đề xuất vật tư -------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_mh_de_xuat_vt_ct_sua_trao_doi(
  p_id bigint, p_trao_doi text, p_trao_doi_cu text
) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_hien_tai text;
  v_moi text := NULLIF(btrim(p_trao_doi), '');
BEGIN
  IF NOT public.fn_co_quyen_module('mua-hang/phieu-de-xuat-vat-tu', ARRAY['admin', 'all']) THEN
    RAISE EXCEPTION 'Chỉ quản trị hoặc cấp bậc 1 mới ghi trao đổi.' USING ERRCODE = 'P0001';
  END IF;

  SELECT trao_doi INTO v_hien_tai
    FROM public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy dòng hàng của phiếu đề xuất (có thể phiếu vừa được sửa).' USING ERRCODE = 'P0001';
  END IF;
  IF NULLIF(btrim(v_hien_tai), '') IS DISTINCT FROM NULLIF(btrim(p_trao_doi_cu), '') THEN
    RAISE EXCEPTION 'Trao đổi vừa có người cập nhật — mở lại để xem bản mới rồi ghi tiếp.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet SET trao_doi = v_moi WHERE id = p_id;
  RETURN v_moi;
END
$$;

REVOKE ALL ON FUNCTION public.rpc_mh_de_xuat_vt_ct_sua_trao_doi(bigint, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_mh_de_xuat_vt_ct_sua_trao_doi(bigint, text, text) TO authenticated;

-- Nhà sơ chế — đề xuất mua hàng ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_farm_de_xuat_mh_ct_sua_trao_doi(
  p_id bigint, p_trao_doi text, p_trao_doi_cu text
) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_hien_tai text;
  v_moi text := NULLIF(btrim(p_trao_doi), '');
BEGIN
  IF NOT public.fn_co_quyen_module('quan-ly-nha-so-che/de-xuat-mua-hang', ARRAY['admin', 'all']) THEN
    RAISE EXCEPTION 'Chỉ quản trị hoặc cấp bậc 1 mới ghi trao đổi.' USING ERRCODE = 'P0001';
  END IF;

  SELECT trao_doi INTO v_hien_tai
    FROM public.fp_farm_de_xuat_mua_hang_chi_tiet WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy dòng hàng của phiếu đề xuất (có thể phiếu vừa được sửa).' USING ERRCODE = 'P0001';
  END IF;
  IF NULLIF(btrim(v_hien_tai), '') IS DISTINCT FROM NULLIF(btrim(p_trao_doi_cu), '') THEN
    RAISE EXCEPTION 'Trao đổi vừa có người cập nhật — mở lại để xem bản mới rồi ghi tiếp.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.fp_farm_de_xuat_mua_hang_chi_tiet SET trao_doi = v_moi WHERE id = p_id;
  RETURN v_moi;
END
$$;

REVOKE ALL ON FUNCTION public.rpc_farm_de_xuat_mh_ct_sua_trao_doi(bigint, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_farm_de_xuat_mh_ct_sua_trao_doi(bigint, text, text) TO authenticated;

-- Phân thuốc — đề xuất mua hàng (bảng riêng, migration 029) -------------------------
CREATE OR REPLACE FUNCTION public.rpc_pt_de_xuat_mh_ct_sua_trao_doi(
  p_id bigint, p_trao_doi text, p_trao_doi_cu text
) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_hien_tai text;
  v_moi text := NULLIF(btrim(p_trao_doi), '');
BEGIN
  IF NOT public.fn_co_quyen_module('phan-thuoc/de-xuat-mua-hang', ARRAY['admin', 'all']) THEN
    RAISE EXCEPTION 'Chỉ quản trị hoặc cấp bậc 1 mới ghi trao đổi.' USING ERRCODE = 'P0001';
  END IF;

  SELECT trao_doi INTO v_hien_tai
    FROM public.fp_pt_de_xuat_mua_hang_chi_tiet WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy dòng hàng của phiếu đề xuất (có thể phiếu vừa được sửa).' USING ERRCODE = 'P0001';
  END IF;
  IF NULLIF(btrim(v_hien_tai), '') IS DISTINCT FROM NULLIF(btrim(p_trao_doi_cu), '') THEN
    RAISE EXCEPTION 'Trao đổi vừa có người cập nhật — mở lại để xem bản mới rồi ghi tiếp.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.fp_pt_de_xuat_mua_hang_chi_tiet SET trao_doi = v_moi WHERE id = p_id;
  RETURN v_moi;
END
$$;

REVOKE ALL ON FUNCTION public.rpc_pt_de_xuat_mh_ct_sua_trao_doi(bigint, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_pt_de_xuat_mh_ct_sua_trao_doi(bigint, text, text) TO authenticated;

COMMIT;

-- PostgREST nạp lại schema cache để thấy RPC mới.
NOTIFY pgrst, 'reload schema';
