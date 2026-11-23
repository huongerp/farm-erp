-- =============================================================================
-- 096-bcsc-ton-cuoi-cong-ton-dau.sql — Báo cáo sơ chế: tồn cuối ngày CỘNG tồn đầu ngày
--
-- Sửa công thức migration 090. Mục 10 (`sl_buong_ton_cuoi_ngay`) giờ là
--     mục 6 + mục 7 − mục 8 − mục 9
--   = sl_buong_ton_dau_ngay + tong_buong_thu_hoach − tong_buong_khong_so_che − tong_buong_so_che
-- Vẫn cho phép âm. Trigger 090 phải bắt thêm thay đổi ở `sl_buong_ton_dau_ngay`.
--
-- Backfill toàn bộ phiếu: UPDATE mục 10 làm trigger dự báo trg_du_bao_ton_* (migration 060)
-- bắn theo → Dự báo SL đóng thùng tự lấy lại tồn cuối mới. Không sửa bộ trigger đó.
-- Chạy lại được (CREATE OR REPLACE + backfill idempotent).
--
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/096-bcsc-ton-cuoi-cong-ton-dau.sql
-- =============================================================================
BEGIN;

-- 1) Hàm tính lại mục 10 (giữ GUARD chống đệ quy của 090) -----------------------------
CREATE OR REPLACE FUNCTION public.fn_bcsc_tinh_lai_ton_cuoi(p_ids bigint[])
    RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF p_ids IS NULL OR cardinality(p_ids) = 0 THEN
    RETURN;
  END IF;

  -- GUARD chống đệ quy: trigger FOR EACH STATEMENT bắn cả khi UPDATE 0 dòng.
  IF NOT EXISTS (
    SELECT 1
      FROM public.fp_farm_bao_cao_so_che_ct ct
     WHERE ct.id_bao_cao = ANY(p_ids)
       AND ct.ma_chi_tieu = 'sl_buong_ton_cuoi_ngay'
       AND ct.gia_tri IS DISTINCT FROM (
             COALESCE((SELECT MAX(x.gia_tri) FROM public.fp_farm_bao_cao_so_che_ct x
                        WHERE x.id_bao_cao = ct.id_bao_cao AND x.ma_chi_tieu = 'sl_buong_ton_dau_ngay'), 0)
           + COALESCE((SELECT MAX(x.gia_tri) FROM public.fp_farm_bao_cao_so_che_ct x
                        WHERE x.id_bao_cao = ct.id_bao_cao AND x.ma_chi_tieu = 'tong_buong_thu_hoach'), 0)
           - COALESCE((SELECT MAX(x.gia_tri) FROM public.fp_farm_bao_cao_so_che_ct x
                        WHERE x.id_bao_cao = ct.id_bao_cao AND x.ma_chi_tieu = 'tong_buong_khong_so_che'), 0)
           - COALESCE((SELECT MAX(x.gia_tri) FROM public.fp_farm_bao_cao_so_che_ct x
                        WHERE x.id_bao_cao = ct.id_bao_cao AND x.ma_chi_tieu = 'tong_buong_so_che'), 0)
           )
  ) THEN
    RETURN;
  END IF;

  UPDATE public.fp_farm_bao_cao_so_che_ct ct
     SET gia_tri = moi.gia_tri_moi
    FROM (
      SELECT id_bao_cao,
             COALESCE(MAX(gia_tri) FILTER (WHERE ma_chi_tieu = 'sl_buong_ton_dau_ngay'), 0)
           + COALESCE(MAX(gia_tri) FILTER (WHERE ma_chi_tieu = 'tong_buong_thu_hoach'), 0)
           - COALESCE(MAX(gia_tri) FILTER (WHERE ma_chi_tieu = 'tong_buong_khong_so_che'), 0)
           - COALESCE(MAX(gia_tri) FILTER (WHERE ma_chi_tieu = 'tong_buong_so_che'), 0) AS gia_tri_moi
        FROM public.fp_farm_bao_cao_so_che_ct
       WHERE id_bao_cao = ANY(p_ids)
       GROUP BY id_bao_cao
    ) moi
   WHERE ct.id_bao_cao = moi.id_bao_cao
     AND ct.ma_chi_tieu = 'sl_buong_ton_cuoi_ngay'
     AND ct.gia_tri IS DISTINCT FROM moi.gia_tri_moi;
END;
$$;

-- 2) Trigger gom id_bao_cao: thêm 'sl_buong_ton_dau_ngay' vào danh sách mã theo dõi -----
CREATE OR REPLACE FUNCTION public.fn_bcsc_trg_ton_cuoi()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ids bigint[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT array_agg(DISTINCT x.id_bao_cao) INTO v_ids
      FROM new_rows x
     WHERE x.ma_chi_tieu IN ('sl_buong_ton_dau_ngay', 'tong_buong_thu_hoach', 'tong_buong_khong_so_che',
                             'tong_buong_so_che', 'sl_buong_ton_cuoi_ngay');
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT array_agg(DISTINCT x.id_bao_cao) INTO v_ids
      FROM (
        SELECT id_bao_cao FROM old_rows
         WHERE ma_chi_tieu IN ('sl_buong_ton_dau_ngay', 'tong_buong_thu_hoach', 'tong_buong_khong_so_che',
                               'tong_buong_so_che', 'sl_buong_ton_cuoi_ngay')
        UNION
        SELECT id_bao_cao FROM new_rows
         WHERE ma_chi_tieu IN ('sl_buong_ton_dau_ngay', 'tong_buong_thu_hoach', 'tong_buong_khong_so_che',
                               'tong_buong_so_che', 'sl_buong_ton_cuoi_ngay')
      ) x;
  END IF;

  IF v_ids IS NULL OR cardinality(v_ids) = 0 THEN
    RETURN NULL;
  END IF;

  PERFORM public.fn_bcsc_tinh_lai_ton_cuoi(v_ids);
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_bcsc_tinh_lai_ton_cuoi(bigint[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_bcsc_trg_ton_cuoi() FROM PUBLIC, anon, authenticated;

-- 3) Backfill toàn bộ phiếu ------------------------------------------------------------
SELECT public.fn_bcsc_tinh_lai_ton_cuoi(array_agg(id)) FROM public.fp_farm_bao_cao_so_che;

-- 4) Kiểm tra sau backfill ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM public.fp_farm_bao_cao_so_che_ct ct
     WHERE ct.ma_chi_tieu = 'sl_buong_ton_cuoi_ngay'
       AND ct.gia_tri IS DISTINCT FROM (
             COALESCE((SELECT MAX(x.gia_tri) FROM public.fp_farm_bao_cao_so_che_ct x
                        WHERE x.id_bao_cao = ct.id_bao_cao AND x.ma_chi_tieu = 'sl_buong_ton_dau_ngay'), 0)
           + COALESCE((SELECT MAX(x.gia_tri) FROM public.fp_farm_bao_cao_so_che_ct x
                        WHERE x.id_bao_cao = ct.id_bao_cao AND x.ma_chi_tieu = 'tong_buong_thu_hoach'), 0)
           - COALESCE((SELECT MAX(x.gia_tri) FROM public.fp_farm_bao_cao_so_che_ct x
                        WHERE x.id_bao_cao = ct.id_bao_cao AND x.ma_chi_tieu = 'tong_buong_khong_so_che'), 0)
           - COALESCE((SELECT MAX(x.gia_tri) FROM public.fp_farm_bao_cao_so_che_ct x
                        WHERE x.id_bao_cao = ct.id_bao_cao AND x.ma_chi_tieu = 'tong_buong_so_che'), 0)
           )
  ) THEN
    RAISE EXCEPTION 'Số buồng tồn cuối ngày còn lệch công thức mục 6 + mục 7 − mục 8 − mục 9 sau backfill';
  END IF;
END $$;

COMMIT;
