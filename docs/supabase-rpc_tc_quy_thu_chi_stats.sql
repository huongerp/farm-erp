-- =============================================================================
-- RPC: rpc_tc_quy_thu_chi_stats — module Thống kê & tra cứu quỹ (gom về 1 request)
-- Trả một jsonb duy nhất: tồn đầu kỳ / tổng thu / tổng chi / tồn cuối kỳ + các
-- bảng gộp theo hạng mục, theo tháng, theo chi nhánh, theo nguồn chứng từ.
--
-- Phạm vi chi nhánh do APP truyền vào qua p_chi_nhanh_ids (lấy từ view-scope):
--   - cấp cao / quản trị: truyền NULL = tất cả chi nhánh
--   - còn lại: truyền đúng mảng chi nhánh được phân. Mảng RỖNG ⇒ không có dữ liệu
--     (fail-closed), KHÔNG được hiểu là "tất cả".
-- Chạy sau: fp_tc_quy_thu_chi, fp_tc_hang_muc_thu_chi, fp_var_chi_nhanh
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rpc_tc_quy_thu_chi_stats(
  p_tu_ngay date DEFAULT NULL,
  p_den_ngay date DEFAULT NULL,
  p_chi_nhanh_ids bigint[] DEFAULT NULL,
  p_loai text DEFAULT NULL,
  p_hang_muc_ids bigint[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
WITH scope AS (
  -- Toàn bộ sổ trong phạm vi chi nhánh (chưa cắt theo kỳ) — dùng cho tồn đầu kỳ
  SELECT p.*
  FROM public.fp_tc_quy_thu_chi p
  WHERE (p_chi_nhanh_ids IS NULL OR p.id_chi_nhanh = ANY (p_chi_nhanh_ids))
),
base AS (
  SELECT s.*
  FROM scope s
  WHERE
    (p_tu_ngay IS NULL OR s.ngay >= p_tu_ngay)
    AND (p_den_ngay IS NULL OR s.ngay <= p_den_ngay)
    AND (p_loai IS NULL OR s.loai = p_loai)
    AND (p_hang_muc_ids IS NULL OR cardinality(p_hang_muc_ids) = 0 OR s.id_hang_muc = ANY (p_hang_muc_ids))
),
dau_ky AS (
  -- Tồn đầu kỳ: toàn bộ phát sinh TRƯỚC p_tu_ngay, không áp filter loại/hạng mục
  SELECT COALESCE(SUM(CASE WHEN s.loai = 'thu' THEN s.so_tien ELSE -s.so_tien END), 0)::numeric AS ton
  FROM scope s
  WHERE p_tu_ngay IS NOT NULL AND s.ngay < p_tu_ngay
),
tong AS (
  SELECT
    COALESCE(SUM(CASE WHEN b.loai = 'thu' THEN b.so_tien ELSE 0 END), 0)::numeric AS tong_thu,
    COALESCE(SUM(CASE WHEN b.loai = 'chi' THEN b.so_tien ELSE 0 END), 0)::numeric AS tong_chi,
    COUNT(*)::int AS so_phieu
  FROM base b
),
theo_hang_muc AS (
  SELECT
    b.id_hang_muc::text AS id,
    COALESCE(hm.ten, b.ten_hang_muc, '—') AS ten,
    COALESCE(SUM(CASE WHEN b.loai = 'thu' THEN b.so_tien ELSE 0 END), 0)::numeric AS thu,
    COALESCE(SUM(CASE WHEN b.loai = 'chi' THEN b.so_tien ELSE 0 END), 0)::numeric AS chi,
    COUNT(*)::int AS so_phieu
  FROM base b
  LEFT JOIN public.fp_tc_hang_muc_thu_chi hm ON hm.id = b.id_hang_muc
  GROUP BY 1, 2
),
theo_thang AS (
  SELECT
    to_char(date_trunc('month', b.ngay), 'YYYY-MM') AS thang,
    COALESCE(SUM(CASE WHEN b.loai = 'thu' THEN b.so_tien ELSE 0 END), 0)::numeric AS thu,
    COALESCE(SUM(CASE WHEN b.loai = 'chi' THEN b.so_tien ELSE 0 END), 0)::numeric AS chi
  FROM base b
  GROUP BY 1
),
theo_chi_nhanh AS (
  SELECT
    b.id_chi_nhanh::text AS id,
    COALESCE(cn.ten_chi_nhanh, b.ten_chi_nhanh, '—') AS ten,
    COALESCE(SUM(CASE WHEN b.loai = 'thu' THEN b.so_tien ELSE 0 END), 0)::numeric AS thu,
    COALESCE(SUM(CASE WHEN b.loai = 'chi' THEN b.so_tien ELSE 0 END), 0)::numeric AS chi,
    COUNT(*)::int AS so_phieu
  FROM base b
  LEFT JOIN public.fp_var_chi_nhanh cn ON cn.id = b.id_chi_nhanh
  GROUP BY 1, 2
),
theo_nguon AS (
  SELECT
    COALESCE(b.loai_chung_tu, 'khong_lien_ket') AS nguon,
    COALESCE(SUM(CASE WHEN b.loai = 'thu' THEN b.so_tien ELSE 0 END), 0)::numeric AS thu,
    COALESCE(SUM(CASE WHEN b.loai = 'chi' THEN b.so_tien ELSE 0 END), 0)::numeric AS chi,
    COUNT(*)::int AS so_phieu
  FROM base b
  GROUP BY 1
)
SELECT jsonb_build_object(
  'ton_dau_ky', (SELECT ton FROM dau_ky),
  'tong_thu', (SELECT tong_thu FROM tong),
  'tong_chi', (SELECT tong_chi FROM tong),
  'ton_cuoi_ky', (SELECT ton FROM dau_ky) + (SELECT tong_thu FROM tong) - (SELECT tong_chi FROM tong),
  'so_phieu', (SELECT so_phieu FROM tong),
  'theo_hang_muc', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.chi DESC, t.thu DESC) FROM theo_hang_muc t), '[]'::jsonb),
  'theo_thang', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.thang) FROM theo_thang t), '[]'::jsonb),
  'theo_chi_nhanh', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.ten) FROM theo_chi_nhanh t), '[]'::jsonb),
  'theo_nguon_chung_tu', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.nguon) FROM theo_nguon t), '[]'::jsonb)
);
$fn$;

COMMENT ON FUNCTION public.rpc_tc_quy_thu_chi_stats(date, date, bigint[], text, bigint[])
  IS 'Thống kê quỹ thu chi theo kỳ + chi nhánh: tồn đầu/cuối kỳ, tổng thu chi, gộp theo hạng mục / tháng / chi nhánh / nguồn chứng từ';

GRANT EXECUTE ON FUNCTION public.rpc_tc_quy_thu_chi_stats(date, date, bigint[], text, bigint[]) TO authenticated;
