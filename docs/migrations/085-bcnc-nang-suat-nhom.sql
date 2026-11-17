-- =============================================================================
-- 085-bcnc-nang-suat-nhom.sql — Báo cáo nhân công: năng suất và thưởng theo nhóm
--
-- Mỗi chuyền × nhóm nhập số thùng trên phiếu (jsonb `so_thung_nhom` của _ct, khoá "1".."9");
-- NS nhóm = số thùng ÷ tổng giờ công thành viên (không cộng giờ TC), so với mục tiêu của phiếu
-- (`muc_tieu_ns_nhom`, mặc định 3 thùng/giờ-người). Thưởng tính khi hiển thị, KHÔNG lưu DB.
-- Ghi qua PostgREST, RLS có sẵn của hai bảng đã phủ cột mới.
--
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/085-bcnc-nang-suat-nhom.sql
-- =============================================================================
BEGIN;

-- Kiểm tra từng cặp khoá/giá trị (CHECK không được dùng subquery → bọc trong hàm IMMUTABLE).
CREATE OR REPLACE FUNCTION public.fn_bcnc_so_thung_nhom_hop_le(v jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_typeof(v) = 'object'
     AND NOT EXISTS (
       SELECT 1
       FROM jsonb_each(v) AS e(k, val)
       WHERE e.k !~ '^[1-9]$'
          OR jsonb_typeof(e.val) <> 'number'
          OR (e.val #>> '{}')::numeric < 0
     );
$$;
COMMENT ON FUNCTION public.fn_bcnc_so_thung_nhom_hop_le(jsonb) IS 'CHECK cho fp_farm_bao_cao_nhan_cong_ct.so_thung_nhom: object, khoá "1".."9", giá trị số ≥ 0';
REVOKE ALL ON FUNCTION public.fn_bcnc_so_thung_nhom_hop_le(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_bcnc_so_thung_nhom_hop_le(jsonb) TO authenticated;

ALTER TABLE public.fp_farm_bao_cao_nhan_cong_ct
  ADD COLUMN IF NOT EXISTS so_thung_nhom jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.fp_farm_bao_cao_nhan_cong_ct DROP CONSTRAINT IF EXISTS fp_farm_bcnc_ct_so_thung_nhom_chk;
ALTER TABLE public.fp_farm_bao_cao_nhan_cong_ct
  ADD CONSTRAINT fp_farm_bcnc_ct_so_thung_nhom_chk
  CHECK (jsonb_typeof(so_thung_nhom) = 'object' AND public.fn_bcnc_so_thung_nhom_hop_le(so_thung_nhom));
COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_ct.so_thung_nhom IS 'Số thùng theo nhóm của chuyền: {"1": 160, "2": 120}; thiếu khoá = chưa nhập. Dùng tính năng suất nhóm';

ALTER TABLE public.fp_farm_bao_cao_nhan_cong
  ADD COLUMN IF NOT EXISTS muc_tieu_ns_nhom numeric(6,2) NOT NULL DEFAULT 3;
ALTER TABLE public.fp_farm_bao_cao_nhan_cong DROP CONSTRAINT IF EXISTS fp_farm_bcnc_muc_tieu_ns_nhom_chk;
ALTER TABLE public.fp_farm_bao_cao_nhan_cong
  ADD CONSTRAINT fp_farm_bcnc_muc_tieu_ns_nhom_chk CHECK (muc_tieu_ns_nhom > 0);
COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong.muc_tieu_ns_nhom IS 'Mục tiêu năng suất nhóm (thùng / giờ-người) của phiếu, mặc định 3; tỷ lệ đạt = NS ÷ mục tiêu × 100';

COMMIT;

NOTIFY pgrst, 'reload schema';
