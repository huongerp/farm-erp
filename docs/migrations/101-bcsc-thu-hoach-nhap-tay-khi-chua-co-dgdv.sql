-- =============================================================================
-- 101-bcsc-thu-hoach-nhap-tay-khi-chua-co-dgdv.sql — Báo cáo sơ chế: ngày CHƯA có phiếu Đánh giá đầu vào
-- thì mục 7 «Tổng số buồng thu hoạch» + mục 8 «Không sơ chế» cho nhập tay.
--
-- Trước đây (052) 2 ô này LUÔN bị ghi đè bằng fn_dgdv_tong_ngay → ngày chưa dùng app ĐGĐV (trước
-- ~27–31/10/2026 tuỳ chi nhánh) ra thu hoạch = 0 trong khi sơ chế > 0 → tồn cuối âm (−sơ chế).
-- Công chốt 25/11/2026: ngày không có phiếu ĐGĐV → mở nhập tay; có phiếu → vẫn khoá theo ĐGĐV.
--
-- «Có phiếu ĐGĐV» = tồn tại fp_farm_dgdv cùng ngay + id_chi_nhanh (phiếu theo chuyến, 057) — kể cả
-- phiếu rỗng (đã tạo phiếu thì ĐGĐV là nguồn).
--   - fn_dgdv_co_phieu_ngay: RPC cho form (quyết định ô khoá / ô nhập).
--   - fn_dgdv_trg_bcsc_ct_khoa_so (thân 052): không có phiếu → giữ số gửi lên.
--   - fn_dgdv_dong_bo_bcsc (thân 052): không có phiếu → không UPDATE 2 ô (không ghi 0 đè số nhập tay).
--     Xoá hết phiếu ĐGĐV của một ngày → số đồng bộ lần cuối được giữ lại, thành số nhập tay.
-- Không backfill: phiếu cũ giữ 0 tới khi người dùng nhập lại; trigger tồn cuối (096) + nối chuỗi tồn
-- đầu (100) tự tính lại khi lưu.
--
-- Chạy lại được (CREATE OR REPLACE).
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/101-bcsc-thu-hoach-nhap-tay-khi-chua-co-dgdv.sql
-- =============================================================================
BEGIN;

-- 1) Ngày + chi nhánh đã có phiếu ĐGĐV chưa -------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_dgdv_co_phieu_ngay(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.fp_farm_dgdv p WHERE p.ngay = p_ngay AND p.id_chi_nhanh = p_id_chi_nhanh);
$$;
COMMENT ON FUNCTION public.fn_dgdv_co_phieu_ngay(date, bigint) IS
  'Đánh giá đầu vào: ngày + chi nhánh đã có phiếu chưa. false → Báo cáo sơ chế cho nhập tay thu hoạch / KSC (migration 101)';

REVOKE ALL ON FUNCTION public.fn_dgdv_co_phieu_ngay(date, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_dgdv_co_phieu_ngay(date, bigint) TO authenticated;

-- 2) Khoá số chỉ khi có phiếu ĐGĐV --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_dgdv_trg_bcsc_ct_khoa_so()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ngay date;
  v_cn bigint;
  v_thu bigint := 0;
  v_ksc bigint := 0;
BEGIN
  IF NEW.ma_chi_tieu NOT IN ('tong_buong_thu_hoach', 'tong_buong_khong_so_che') THEN
    RETURN NEW;
  END IF;

  SELECT b.ngay, b.id_chi_nhanh INTO v_ngay, v_cn FROM public.fp_farm_bao_cao_so_che b WHERE b.id = NEW.id_bao_cao;
  IF v_ngay IS NOT NULL AND public.fn_dgdv_co_phieu_ngay(v_ngay, v_cn) THEN
    SELECT t.tong_thu, t.ksc INTO v_thu, v_ksc FROM public.fn_dgdv_tong_ngay(v_ngay, v_cn) t;
    NEW.gia_tri := CASE NEW.ma_chi_tieu WHEN 'tong_buong_thu_hoach' THEN v_thu ELSE v_ksc END;
  ELSE
    -- Chưa có phiếu ĐGĐV: giữ số nhập tay.
    NEW.gia_tri := COALESCE(NEW.gia_tri, 0);
  END IF;

  IF TG_OP = 'INSERT' AND EXISTS (
       SELECT 1 FROM public.fp_farm_bao_cao_so_che_ct ct
       WHERE ct.id_bao_cao = NEW.id_bao_cao AND ct.ma_chi_tieu = NEW.ma_chi_tieu) THEN
    UPDATE public.fp_farm_bao_cao_so_che_ct ct
       SET don_vi_tinh = NEW.don_vi_tinh,
           ghi_chu = NEW.ghi_chu,
           thu_tu = NEW.thu_tu,
           gia_tri = NEW.gia_tri
     WHERE ct.id_bao_cao = NEW.id_bao_cao AND ct.ma_chi_tieu = NEW.ma_chi_tieu;
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Đồng bộ: không có phiếu ĐGĐV thì không ghi đè 2 ô ----------------------------------------
CREATE OR REPLACE FUNCTION public.fn_dgdv_dong_bo_bcsc(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_thu bigint;
  v_ksc bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.fp_farm_bao_cao_so_che WHERE ngay = p_ngay AND id_chi_nhanh = p_id_chi_nhanh) THEN
    RETURN;
  END IF;

  IF public.fn_dgdv_co_phieu_ngay(p_ngay, p_id_chi_nhanh) THEN
    SELECT t.tong_thu, t.ksc INTO v_thu, v_ksc FROM public.fn_dgdv_tong_ngay(p_ngay, p_id_chi_nhanh) t;

    UPDATE public.fp_farm_bao_cao_so_che_ct ct
       SET gia_tri = CASE ct.ma_chi_tieu WHEN 'tong_buong_thu_hoach' THEN v_thu ELSE v_ksc END
      FROM public.fp_farm_bao_cao_so_che b
     WHERE b.id = ct.id_bao_cao
       AND b.ngay = p_ngay
       AND b.id_chi_nhanh = p_id_chi_nhanh
       AND ct.ma_chi_tieu IN ('tong_buong_thu_hoach', 'tong_buong_khong_so_che')
       AND ct.gia_tri IS DISTINCT FROM (CASE ct.ma_chi_tieu WHEN 'tong_buong_thu_hoach' THEN v_thu ELSE v_ksc END)::numeric;
  END IF;

  INSERT INTO public.fp_farm_bao_cao_so_che_ct (id_bao_cao, ma_chi_tieu, gia_tri, don_vi_tinh, thu_tu)
  SELECT b.id, m.ma, 0, 'Buồng', m.thu_tu
  FROM public.fp_farm_bao_cao_so_che b
  CROSS JOIN (VALUES ('tong_buong_thu_hoach'::text, 2), ('tong_buong_khong_so_che'::text, 3)) AS m(ma, thu_tu)
  WHERE b.ngay = p_ngay
    AND b.id_chi_nhanh = p_id_chi_nhanh
    AND NOT EXISTS (
      SELECT 1 FROM public.fp_farm_bao_cao_so_che_ct ct
      WHERE ct.id_bao_cao = b.id AND ct.ma_chi_tieu = m.ma);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_dgdv_trg_bcsc_ct_khoa_so() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_dgdv_dong_bo_bcsc(date, bigint) FROM PUBLIC, anon, authenticated;

COMMIT;
