-- =============================================================================
-- 090-bcsc-ton-cuoi-tu-tinh.sql — Báo cáo sơ chế: «Số buồng tồn cuối ngày» tự tính
--
-- Mục 10 (`sl_buong_ton_cuoi_ngay`) của BCSC = mục 7 − mục 8 − mục 9:
--     tong_buong_thu_hoach − tong_buong_khong_so_che − tong_buong_so_che
-- KHÔNG cộng tồn đầu ngày. Có thể ra số âm (sơ chế nhập lớn hơn thu − không sơ chế) và giữ nguyên âm.
--
-- 1. fn_bcsc_tinh_lai_ton_cuoi(p_ids) — tính lại mục 10 cho các phiếu được chỉ định.
--    GUARD chống đệ quy: trigger FOR EACH STATEMENT vẫn bắn khi UPDATE 0 dòng, nên hàm phải
--    RETURN trước khi UPDATE nếu không có dòng nào thực sự lệch (nếu không sẽ lặp vô hạn).
-- 2. fn_bcsc_trg_ton_cuoi() — trigger mức câu lệnh gom id_bao_cao bị ảnh hưởng (INSERT/UPDATE)
--    rồi gọi hàm tính lại.
--    - INSERT: chỉ NEW TABLE; UPDATE: hợp OLD + NEW (an toàn khi dòng đổi mã / đổi id_bao_cao).
-- 3. Trigger trg_bcsc_ton_cuoi_ins / trg_bcsc_ton_cuoi_upd trên fp_farm_bao_cao_so_che_ct.
-- 4. Backfill toàn bộ phiếu + kiểm tra chéo công thức.
--
-- Cột gia_tri là NOT NULL → luôn ghi số (COALESCE 0), không ghi NULL.
-- Không đụng bộ trigger dự báo trg_du_bao_ton_* (migration 060).
-- Chạy lại được (CREATE OR REPLACE + DROP TRIGGER IF EXISTS + backfill idempotent).
--
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/090-bcsc-ton-cuoi-tu-tinh.sql
-- =============================================================================
BEGIN;

-- 1) Hàm tính lại mục 10 cho danh sách phiếu ------------------------------------------
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
  -- Không còn dòng nào thực sự lệch → thoát trước khi UPDATE.
  IF NOT EXISTS (
    SELECT 1
      FROM public.fp_farm_bao_cao_so_che_ct ct
     WHERE ct.id_bao_cao = ANY(p_ids)
       AND ct.ma_chi_tieu = 'sl_buong_ton_cuoi_ngay'
       AND ct.gia_tri IS DISTINCT FROM (
             COALESCE((SELECT MAX(x.gia_tri) FROM public.fp_farm_bao_cao_so_che_ct x
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
             COALESCE(MAX(gia_tri) FILTER (WHERE ma_chi_tieu = 'tong_buong_thu_hoach'), 0)
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

-- 2) Trigger gom id_bao_cao (mức câu lệnh) --------------------------------------------
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
     WHERE x.ma_chi_tieu IN ('tong_buong_thu_hoach', 'tong_buong_khong_so_che',
                             'tong_buong_so_che', 'sl_buong_ton_cuoi_ngay');
  ELSIF TG_OP = 'UPDATE' THEN
    -- Hợp OLD + NEW: dòng có thể đổi mã chỉ tiêu hoặc đổi id_bao_cao (cả phiếu cũ lẫn mới đều phải tính lại).
    SELECT array_agg(DISTINCT x.id_bao_cao) INTO v_ids
      FROM (
        SELECT id_bao_cao FROM old_rows
         WHERE ma_chi_tieu IN ('tong_buong_thu_hoach', 'tong_buong_khong_so_che',
                               'tong_buong_so_che', 'sl_buong_ton_cuoi_ngay')
        UNION
        SELECT id_bao_cao FROM new_rows
         WHERE ma_chi_tieu IN ('tong_buong_thu_hoach', 'tong_buong_khong_so_che',
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

-- Hàm nội bộ (chỉ trigger gọi, chạy với quyền chủ hàm) → không cấp cho ai.
REVOKE ALL ON FUNCTION public.fn_bcsc_tinh_lai_ton_cuoi(bigint[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_bcsc_trg_ton_cuoi() FROM PUBLIC, anon, authenticated;

-- Transition table không dùng chung nhiều sự kiện → 2 trigger, cùng một hàm.
DROP TRIGGER IF EXISTS trg_bcsc_ton_cuoi_ins ON public.fp_farm_bao_cao_so_che_ct;
CREATE TRIGGER trg_bcsc_ton_cuoi_ins AFTER INSERT ON public.fp_farm_bao_cao_so_che_ct
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_bcsc_trg_ton_cuoi();

DROP TRIGGER IF EXISTS trg_bcsc_ton_cuoi_upd ON public.fp_farm_bao_cao_so_che_ct;
CREATE TRIGGER trg_bcsc_ton_cuoi_upd AFTER UPDATE ON public.fp_farm_bao_cao_so_che_ct
  REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_bcsc_trg_ton_cuoi();

-- 3) Backfill toàn bộ phiếu ------------------------------------------------------------
SELECT public.fn_bcsc_tinh_lai_ton_cuoi(array_agg(id)) FROM public.fp_farm_bao_cao_so_che;

-- 4) Kiểm tra sau backfill ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM public.fp_farm_bao_cao_so_che_ct ct
      JOIN public.fp_farm_bao_cao_so_che b ON b.id = ct.id_bao_cao
     WHERE ct.ma_chi_tieu = 'sl_buong_ton_cuoi_ngay'
       AND ct.gia_tri IS DISTINCT FROM (
             COALESCE((SELECT MAX(x.gia_tri) FROM public.fp_farm_bao_cao_so_che_ct x
                        WHERE x.id_bao_cao = ct.id_bao_cao AND x.ma_chi_tieu = 'tong_buong_thu_hoach'), 0)
           - COALESCE((SELECT MAX(x.gia_tri) FROM public.fp_farm_bao_cao_so_che_ct x
                        WHERE x.id_bao_cao = ct.id_bao_cao AND x.ma_chi_tieu = 'tong_buong_khong_so_che'), 0)
           - COALESCE((SELECT MAX(x.gia_tri) FROM public.fp_farm_bao_cao_so_che_ct x
                        WHERE x.id_bao_cao = ct.id_bao_cao AND x.ma_chi_tieu = 'tong_buong_so_che'), 0)
           )
  ) THEN
    RAISE EXCEPTION 'Số buồng tồn cuối ngày còn lệch công thức mục 7 − mục 8 − mục 9 sau backfill';
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- KIỂM TRA SAU KHI CHẠY (chạy tay bằng scripts/db-sql.sh -c "...")
-- =============================================================================
-- 1) Xem lệch còn lại (phải rỗng):
--    SELECT ct.id_bao_cao, ct.gia_tri, ... FROM fp_farm_bao_cao_so_che_ct ct WHERE ...
-- 2) Thử sửa mục 8 trong transaction rồi ROLLBACK, xem mục 10 tự đổi:
--    BEGIN;
--    UPDATE fp_farm_bao_cao_so_che_ct SET gia_tri = gia_tri + 10
--     WHERE id_bao_cao = (SELECT max(id) FROM fp_farm_bao_cao_so_che)
--       AND ma_chi_tieu = 'tong_buong_khong_so_che';
--    SELECT ma_chi_tieu, gia_tri FROM fp_farm_bao_cao_so_che_ct
--     WHERE id_bao_cao = (SELECT max(id) FROM fp_farm_bao_cao_so_che)
--     ORDER BY thu_tu;
--    ROLLBACK;
-- =============================================================================
