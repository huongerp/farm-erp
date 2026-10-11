-- =============================================================================
-- 036-thu-chi-quy-duyet-phieu.sql — Thu chi quỹ: bỏ khoá / xin mở, thay bằng duyệt phiếu
--
--   cho_duyet ──duyệt──▶ da_duyet
--   cho_duyet ──không duyệt (bắt buộc lý do)──▶ khong_duyet
--   da_duyet ⇄ khong_duyet                     (cấp cao đổi ý)
--   da_duyet | khong_duyet ──đưa về──▶ cho_duyet
--
-- - Mọi chuyển trạng thái chỉ cấp cao (cấp bậc 1 / chức vụ tt = 1 / admin|all trên module).
-- - Phiếu đã xét (da_duyet | khong_duyet): chỉ cấp cao sửa / xoá.
-- - Phiếu khong_duyet KHÔNG tính vào tồn quỹ lũy kế, số dư và thống kê (không quyết toán).
-- Khớp features/tai-chinh/thu-chi-quy/core/trang-thai.ts ở app.
--
-- Dữ liệu cũ: mo → cho_duyet, khoa → da_duyet, cho_mo → cho_duyet. Cột xin-mở cũ
-- (id_nguoi_yeu_cau_mo, ly_do_yeu_cau_mo, …) GIỮ nguyên để tra lịch sử, app thôi dùng.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-036
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/036-thu-chi-quy-duyet-phieu.sql
-- =============================================================================

BEGIN;

-- 1. Cột người duyệt + lý do không duyệt ----------------------------------------
ALTER TABLE public.fp_tc_quy_thu_chi
  ADD COLUMN id_nguoi_duyet bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL,
  ADD COLUMN ten_nguoi_duyet text,
  ADD COLUMN tg_duyet timestamp with time zone,
  ADD COLUMN ly_do_khong_duyet text;

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.id_nguoi_duyet IS 'Cấp cao duyệt / không duyệt gần nhất (fp_var_nhan_vien.id); NULL khi chờ duyệt';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.ten_nguoi_duyet IS 'Snapshot tên người duyệt';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.tg_duyet IS 'Thời điểm duyệt / không duyệt';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.ly_do_khong_duyet IS 'Lý do không duyệt — bắt buộc ở app khi trang_thai = khong_duyet';

-- 2. Đổi trạng thái dữ liệu cũ ----------------------------------------------------
-- Tắt trigger thông báo (khỏi đổ hàng loạt sự kiện vào outbox) và trigger tg_cap_nhat
-- (giữ nguyên thời điểm sửa thật của phiếu) trong lúc map.
ALTER TABLE public.fp_tc_quy_thu_chi DISABLE TRIGGER tr_thong_bao_fp_tc_quy_thu_chi;
ALTER TABLE public.fp_tc_quy_thu_chi DISABLE TRIGGER tr_fp_tc_quy_thu_chi_tg_cap_nhat;

ALTER TABLE public.fp_tc_quy_thu_chi DROP CONSTRAINT fp_tc_qtc_trang_thai_chk;

UPDATE public.fp_tc_quy_thu_chi
   SET trang_thai = CASE trang_thai WHEN 'khoa' THEN 'da_duyet' ELSE 'cho_duyet' END
 WHERE trang_thai IN ('mo', 'khoa', 'cho_mo');

ALTER TABLE public.fp_tc_quy_thu_chi
  ALTER COLUMN trang_thai SET DEFAULT 'cho_duyet',
  ADD CONSTRAINT fp_tc_qtc_trang_thai_chk
    CHECK (trang_thai = ANY (ARRAY['cho_duyet'::text, 'da_duyet'::text, 'khong_duyet'::text]));

ALTER TABLE public.fp_tc_quy_thu_chi ENABLE TRIGGER tr_thong_bao_fp_tc_quy_thu_chi;
ALTER TABLE public.fp_tc_quy_thu_chi ENABLE TRIGGER tr_fp_tc_quy_thu_chi_tg_cap_nhat;

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.trang_thai IS
  'cho_duyet = chờ duyệt (sửa theo quyền module) | da_duyet = đã duyệt | khong_duyet = không duyệt, không tính tồn quỹ. Đã xét thì chỉ cấp cao sửa/xoá/đổi';

DROP INDEX IF EXISTS public.idx_fp_tc_qtc_trang_thai;
CREATE INDEX idx_fp_tc_qtc_trang_thai ON public.fp_tc_quy_thu_chi USING btree (trang_thai)
  WHERE (trang_thai <> 'da_duyet'::text);

-- 3. Chốt quyền ở DB (RLS của bảng đang USING (true)) ----------------------------
CREATE OR REPLACE FUNCTION public.fn_tc_quy_la_cap_cao() RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT public.fn_co_quyen_module('tai-chinh/thu-chi-quy', ARRAY['admin', 'all']);
$$;

REVOKE ALL ON FUNCTION public.fn_tc_quy_la_cap_cao() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_tc_quy_la_cap_cao() TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_tc_quy_khoa_duyet() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Migration, SQL tay, hàm SECURITY DEFINER: không chặn.
  IF current_user <> 'authenticated' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF public.fn_tc_quy_la_cap_cao() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.trang_thai <> 'cho_duyet' THEN
      RAISE EXCEPTION 'Phiếu quỹ mới phải ở trạng thái Chờ duyệt.' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.trang_thai <> 'cho_duyet' THEN
    RAISE EXCEPTION 'Phiếu % đã duyệt / không duyệt — chỉ quản trị hoặc cấp bậc 1 mới sửa, xoá hoặc đổi trạng thái.', OLD.so_phieu
      USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.trang_thai IS DISTINCT FROM OLD.trang_thai THEN
    RAISE EXCEPTION 'Chỉ quản trị hoặc cấp bậc 1 mới duyệt / không duyệt phiếu quỹ.' USING ERRCODE = 'P0001';
  END IF;

  RETURN COALESCE(NEW, OLD);
END
$$;

REVOKE ALL ON FUNCTION public.fn_tc_quy_khoa_duyet() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_tc_quy_khoa_duyet ON public.fp_tc_quy_thu_chi;
CREATE TRIGGER trg_tc_quy_khoa_duyet
  BEFORE INSERT OR UPDATE OR DELETE ON public.fp_tc_quy_thu_chi
  FOR EACH ROW EXECUTE FUNCTION public.fn_tc_quy_khoa_duyet();

-- 4. Tồn quỹ / số dư / thống kê bỏ phiếu không duyệt -----------------------------
-- Giữ nguyên thứ tự cột cũ, cột mới nối ở cuối (điều kiện của CREATE OR REPLACE VIEW).
CREATE OR REPLACE VIEW public.v_tc_quy_thu_chi_summary WITH (security_invoker='true') AS
 SELECT p.id,
    p.so_phieu,
    p.ngay,
    p.id_chi_nhanh,
    p.ten_chi_nhanh,
    p.loai,
    p.so_tien,
    p.so_luong,
    p.don_gia,
    p.id_hang_muc,
    p.ten_hang_muc,
    p.dien_giai,
    p.ghi_chu,
    p.loai_chung_tu,
    p.id_chung_tu,
    p.so_chung_tu,
    p.id_nguoi_tao,
    p.ten_nguoi_tao,
    p.tg_tao,
    p.tg_cap_nhat,
    p.trang_thai,
    p.id_nguoi_yeu_cau_mo,
    p.ten_nguoi_yeu_cau_mo,
    p.ly_do_yeu_cau_mo,
    p.tg_yeu_cau_mo,
    p.id_nguoi_xu_ly_mo,
    p.ten_nguoi_xu_ly_mo,
    p.tg_xu_ly_mo,
        CASE
            WHEN (p.loai = 'thu'::text) THEN p.so_tien
            ELSE (0)::numeric
        END AS thu,
        CASE
            WHEN (p.loai = 'chi'::text) THEN p.so_tien
            ELSE (0)::numeric
        END AS chi,
    sum(
        CASE
            WHEN (p.trang_thai = 'khong_duyet'::text) THEN (0)::numeric
            WHEN (p.loai = 'thu'::text) THEN p.so_tien
            ELSE (- p.so_tien)
        END) OVER (PARTITION BY p.id_chi_nhanh ORDER BY p.ngay, p.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS ton_quy,
    cn.ten_chi_nhanh AS ref_ten_chi_nhanh,
    cn.ma_chi_nhanh AS ref_ma_chi_nhanh,
    hm.ten AS ref_ten_hang_muc,
    hm.ma AS ref_ma_hang_muc,
    nv.ho_va_ten AS ref_ten_nguoi_tao,
    TRIM(BOTH ' '::text FROM concat_ws(' '::text, NULLIF(btrim(COALESCE(p.so_phieu, ''::text)), ''::text), NULLIF(btrim(COALESCE(p.dien_giai, ''::text)), ''::text), NULLIF(btrim(COALESCE(p.ghi_chu, ''::text)), ''::text), NULLIF(btrim(COALESCE(p.so_chung_tu, ''::text)), ''::text), NULLIF(btrim(COALESCE(p.ten_hang_muc, ''::text)), ''::text), NULLIF(btrim(COALESCE((p.ngay)::text, ''::text)), ''::text))) AS ref_tim_kiem,
    p.id_nguoi_duyet,
    p.ten_nguoi_duyet,
    p.tg_duyet,
    p.ly_do_khong_duyet
   FROM (((public.fp_tc_quy_thu_chi p
     LEFT JOIN public.fp_var_chi_nhanh cn ON ((cn.id = p.id_chi_nhanh)))
     LEFT JOIN public.fp_tc_hang_muc_thu_chi hm ON ((hm.id = p.id_hang_muc)))
     LEFT JOIN public.fp_var_nhan_vien nv ON ((nv.id = p.id_nguoi_tao)));

COMMENT ON COLUMN public.v_tc_quy_thu_chi_summary.ton_quy IS
  'Tồn quỹ lũy kế của CHI NHÁNH tính đến dòng này (thứ tự ngay, id), bỏ phiếu khong_duyet — không phụ thuộc filter/phân trang';

CREATE OR REPLACE VIEW public.v_tc_quy_so_du WITH (security_invoker='true') AS
 SELECT p.id_chi_nhanh,
    cn.ten_chi_nhanh AS ref_ten_chi_nhanh,
    (count(*))::integer AS so_phieu,
    COALESCE(sum(
        CASE
            WHEN (p.loai = 'thu'::text) THEN p.so_tien
            ELSE (0)::numeric
        END), (0)::numeric) AS tong_thu,
    COALESCE(sum(
        CASE
            WHEN (p.loai = 'chi'::text) THEN p.so_tien
            ELSE (0)::numeric
        END), (0)::numeric) AS tong_chi,
    COALESCE(sum(
        CASE
            WHEN (p.loai = 'thu'::text) THEN p.so_tien
            ELSE (- p.so_tien)
        END), (0)::numeric) AS ton_quy_hien_tai,
    min(p.ngay) AS ngay_dau,
    max(p.ngay) AS ngay_cuoi
   FROM (public.fp_tc_quy_thu_chi p
     LEFT JOIN public.fp_var_chi_nhanh cn ON ((cn.id = p.id_chi_nhanh)))
  WHERE (p.trang_thai <> 'khong_duyet'::text)
  GROUP BY p.id_chi_nhanh, cn.ten_chi_nhanh;

COMMENT ON VIEW public.v_tc_quy_so_du IS 'Số dư quỹ tiền mặt hiện tại theo chi nhánh (tổng thu - tổng chi toàn sổ, bỏ phiếu không duyệt)';

CREATE OR REPLACE FUNCTION public.rpc_tc_quy_thu_chi_stats(p_tu_ngay date DEFAULT NULL::date, p_den_ngay date DEFAULT NULL::date, p_chi_nhanh_ids bigint[] DEFAULT NULL::bigint[], p_loai text DEFAULT NULL::text, p_hang_muc_ids bigint[] DEFAULT NULL::bigint[]) RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
WITH scope AS (
  -- Toàn bộ sổ trong phạm vi chi nhánh (chưa cắt theo kỳ, bỏ phiếu không duyệt) — dùng cho tồn đầu kỳ
  SELECT p.*
  FROM public.fp_tc_quy_thu_chi p
  WHERE (p_chi_nhanh_ids IS NULL OR p.id_chi_nhanh = ANY (p_chi_nhanh_ids))
    -- Phiếu không duyệt không quyết toán → không tính vào tồn quỹ / thống kê (migration 036).
    AND p.trang_thai <> 'khong_duyet'
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
$$;

REVOKE ALL ON FUNCTION public.rpc_tc_quy_thu_chi_stats(date, date, bigint[], text, bigint[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_tc_quy_thu_chi_stats(date, date, bigint[], text, bigint[]) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
