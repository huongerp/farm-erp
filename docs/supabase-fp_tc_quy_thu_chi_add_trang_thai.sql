-- =============================================================================
-- Migration: trạng thái Khoá / Mở cho sổ quỹ (Tài chính > Thu chi quỹ)
--
--   mo     = đang mở, sửa/xoá bình thường
--   khoa   = đã chốt, người thường hết sửa/xoá; chỉ cap_bac = 1 / quản trị thao tác được
--   cho_mo = người lập phiếu đã XIN mở lại, đang chờ cấp cao duyệt
--
-- Chạy trên DB đã có bảng fp_tc_quy_thu_chi. Idempotent, chạy lại an toàn.
-- Chạy xong nhớ reload schema cache của PostgREST (NOTIFY pgrst, 'reload schema').
-- =============================================================================

ALTER TABLE public.fp_tc_quy_thu_chi
  ADD COLUMN IF NOT EXISTS trang_thai           text NOT NULL DEFAULT 'mo',
  ADD COLUMN IF NOT EXISTS id_nguoi_yeu_cau_mo  bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ten_nguoi_yeu_cau_mo text,
  ADD COLUMN IF NOT EXISTS ly_do_yeu_cau_mo     text,
  ADD COLUMN IF NOT EXISTS tg_yeu_cau_mo        timestamptz,
  ADD COLUMN IF NOT EXISTS id_nguoi_xu_ly_mo    bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ten_nguoi_xu_ly_mo   text,
  ADD COLUMN IF NOT EXISTS tg_xu_ly_mo          timestamptz;

UPDATE public.fp_tc_quy_thu_chi
   SET trang_thai = 'mo'
 WHERE trang_thai IS NULL OR btrim(trang_thai) = '';

ALTER TABLE public.fp_tc_quy_thu_chi
  DROP CONSTRAINT IF EXISTS fp_tc_qtc_trang_thai_chk;

ALTER TABLE public.fp_tc_quy_thu_chi
  ADD CONSTRAINT fp_tc_qtc_trang_thai_chk CHECK (trang_thai IN ('mo', 'khoa', 'cho_mo'));

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.trang_thai IS
  'mo = đang mở; khoa = đã khoá; cho_mo = đã xin mở lại, chờ cap_bac=1/quản trị duyệt';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.id_nguoi_yeu_cau_mo IS 'Người bấm "Xin mở khoá" (fp_var_nhan_vien.id)';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.ly_do_yeu_cau_mo IS 'Lý do xin mở — bắt buộc nhập ở app';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.id_nguoi_xu_ly_mo IS 'Người duyệt / từ chối yêu cầu mở khoá';

-- Đại đa số phiếu ở 'mo' ⇒ partial index cho chip lọc "Khoá" / "Chờ mở".
CREATE INDEX IF NOT EXISTS idx_fp_tc_qtc_trang_thai
  ON public.fp_tc_quy_thu_chi(trang_thai)
  WHERE trang_thai <> 'mo';

-- =============================================================================
-- View summary phải dựng lại: thân view là `p.*` rồi mới tới thu/chi/ton_quy,
-- nên cột mới chèn vào GIỮA danh sách ⇒ CREATE OR REPLACE bị từ chối.
-- Thân view giữ nguyên bản gốc ở docs/supabase-v_tc_quy_thu_chi_summary.sql,
-- chỉ bổ sung trang_thai vào chuỗi ref_tim_kiem là KHÔNG cần (mã không dấu).
-- v_tc_quy_so_du và rpc_tc_quy_thu_chi_stats đọc thẳng bảng gốc ⇒ không đụng.
-- =============================================================================
DROP VIEW IF EXISTS public.v_tc_quy_thu_chi_summary;

CREATE VIEW public.v_tc_quy_thu_chi_summary AS
SELECT
  p.*,
  CASE WHEN p.loai = 'thu' THEN p.so_tien ELSE 0 END AS thu,
  CASE WHEN p.loai = 'chi' THEN p.so_tien ELSE 0 END AS chi,
  SUM(CASE WHEN p.loai = 'thu' THEN p.so_tien ELSE -p.so_tien END)
    OVER (
      PARTITION BY p.id_chi_nhanh
      ORDER BY p.ngay, p.id
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS ton_quy,
  cn.ten_chi_nhanh AS ref_ten_chi_nhanh,
  cn.ma_chi_nhanh  AS ref_ma_chi_nhanh,
  hm.ten           AS ref_ten_hang_muc,
  hm.ma            AS ref_ma_hang_muc,
  nv.ho_va_ten     AS ref_ten_nguoi_tao,
  trim(
    both ' ' FROM concat_ws(
      ' ',
      NULLIF(btrim(COALESCE(p.so_phieu, '')), ''),
      NULLIF(btrim(COALESCE(p.dien_giai, '')), ''),
      NULLIF(btrim(COALESCE(p.ghi_chu, '')), ''),
      NULLIF(btrim(COALESCE(p.so_chung_tu, '')), ''),
      NULLIF(btrim(COALESCE(p.ten_hang_muc, '')), ''),
      NULLIF(btrim(COALESCE(p.ngay::text, '')), '')
    )
  ) AS ref_tim_kiem
FROM public.fp_tc_quy_thu_chi p
LEFT JOIN public.fp_var_chi_nhanh cn ON cn.id = p.id_chi_nhanh
LEFT JOIN public.fp_tc_hang_muc_thu_chi hm ON hm.id = p.id_hang_muc
LEFT JOIN public.fp_var_nhan_vien nv ON nv.id = p.id_nguoi_tao;

COMMENT ON VIEW public.v_tc_quy_thu_chi_summary IS 'Sổ quỹ + thu/chi tách cột + tồn quỹ lũy kế theo chi nhánh + tên tham chiếu';
COMMENT ON COLUMN public.v_tc_quy_thu_chi_summary.ton_quy IS 'Tồn quỹ lũy kế của CHI NHÁNH tính đến dòng này (thứ tự ngay, id) — không phụ thuộc filter/phân trang';
COMMENT ON COLUMN public.v_tc_quy_thu_chi_summary.ref_ten_chi_nhanh IS 'Tên chi nhánh HIỆN TẠI (khác ten_chi_nhanh là snapshot lúc lập phiếu)';
COMMENT ON COLUMN public.v_tc_quy_thu_chi_summary.ref_tim_kiem IS 'Chuỗi gộp số phiếu / diễn giải / ghi chú / số chứng từ / hạng mục / ngày — dùng cho ilike';

ALTER VIEW public.v_tc_quy_thu_chi_summary SET (security_invoker = true);

GRANT SELECT ON public.v_tc_quy_thu_chi_summary TO authenticated;
GRANT SELECT ON public.v_tc_quy_thu_chi_summary TO anon;
