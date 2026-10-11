-- =============================================================================
-- 035-phieu-kho-pt-xin-sua.sql — Phiếu kho (Sơ chế + Phân thuốc): khoá phiếu đã duyệt,
-- luồng "Xin sửa", khoá ngày phiếu.
--
-- Áp cho CẢ HAI biến thể kho (xem features/quan-ly-nha-so-che/kho-bien-the/bien-the.ts):
--   Sơ chế     fp_farm_phieu_kho_phan_thuoc(+_chi_tiet)  module quan-ly-nha-so-che/phieu-kho-phan-thuoc
--   Phân thuốc fp_pt_phieu_kho(+_chi_tiet)                module phan-thuoc/phieu-kho-phan-thuoc
--
-- Luật (khớp core/quyen-sua-phieu.ts ở app):
-- - "Cấp cao" = fn_co_quyen_module(module, {admin,all}) (đã gồm cap_bac = 1, mig 013):
--   luôn sửa / xoá được, ở mọi trạng thái, và là người DUY NHẤT đổi được ngày phiếu.
-- - Phiếu 'Đã duyệt': người khác không sửa / xoá — phải Xin sửa (lý do bắt buộc):
--     NULL ──xin──▶ cho_cap ──cấp──▶ da_cap ──khoá lại──▶ NULL
--                          └─từ chối─▶ NULL
--   Khi da_cap: CHỈ người xin được sửa / xoá phiếu; lưu sửa thì phiếu về 'Chờ duyệt'.
--   Phiếu được duyệt lại ('Đã duyệt') thì quyền đã cấp tự thu.
-- - Người có quyền approve vẫn đổi quyết định duyệt được (chỉ đổi trang_thai / trao_doi /
--   id_nguoi_duyet) như trước.
-- Chỉ kiểm khi current_user = 'authenticated' (request PostgREST) — RPC SECURITY DEFINER
-- (kiểm kê điều chỉnh, xin sửa) và SQL tay không bị chặn.
-- Thông báo: dùng lại tr_thong_bao_* sẵn có (bắt mọi UPDATE) — worker so trang_thai_sua.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-035
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/035-phieu-kho-pt-xin-sua.sql
-- =============================================================================

BEGIN;

-- --- 1. Cột xin sửa -----------------------------------------------------------

DO $$
DECLARE
  b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['fp_farm_phieu_kho_phan_thuoc', 'fp_pt_phieu_kho'] LOOP
    EXECUTE format($f$
      ALTER TABLE public.%1$I
        ADD COLUMN trang_thai_sua text,
        ADD COLUMN id_nguoi_xin_sua bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL,
        ADD COLUMN ten_nguoi_xin_sua text,
        ADD COLUMN ly_do_xin_sua text,
        ADD COLUMN tg_xin_sua timestamp with time zone,
        ADD COLUMN id_nguoi_cap_sua bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL,
        ADD COLUMN ten_nguoi_cap_sua text,
        ADD COLUMN tg_cap_sua timestamp with time zone,
        ADD CONSTRAINT %2$I CHECK (trang_thai_sua IS NULL OR trang_thai_sua = ANY (ARRAY['cho_cap', 'da_cap']))
    $f$, b, b || '_trang_thai_sua_check');

    EXECUTE format($f$COMMENT ON COLUMN public.%I.trang_thai_sua IS
      'Xin sửa phiếu đã duyệt: NULL (khoá bình thường) | cho_cap (chờ cấp cao cấp quyền) | da_cap (người xin được sửa/xoá)'$f$, b);
    EXECUTE format($f$COMMENT ON COLUMN public.%I.id_nguoi_xin_sua IS 'Người xin sửa — khi da_cap chỉ người này được sửa/xoá'$f$, b);
    EXECUTE format($f$COMMENT ON COLUMN public.%I.ly_do_xin_sua IS 'Lý do xin sửa (bắt buộc)'$f$, b);
    EXECUTE format($f$COMMENT ON COLUMN public.%I.id_nguoi_cap_sua IS 'Cấp cao xử lý yêu cầu gần nhất (cấp / từ chối / khoá lại)'$f$, b);
  END LOOP;
END
$$;

-- --- 2. View summary: thêm cột xin sửa (cuối danh sách) -----------------------

CREATE OR REPLACE VIEW public.v_farm_phieu_kho_phan_thuoc_summary WITH (security_invoker='true') AS
 SELECT pk.id,
    pk.so_phieu,
    pk.ngay,
    pk.loai,
    pk.kho_id,
    pk.ten_kho,
    pk.kho_den_id,
    pk.ten_kho_den,
    pk.trang_thai,
    pk.mo_ta,
    pk.trao_doi,
    pk.id_nguoi_duyet,
    pk.nguoi_tao_id,
    pk.ten_nguoi_tao,
    pk.tg_tao,
    pk.tg_cap_nhat,
    COALESCE(agg.so_dong, 0) AS so_dong,
    COALESCE(agg.tong_so_luong, (0)::numeric) AS tong_so_luong,
    COALESCE(agg.tong_tien, (0)::numeric) AS tong_tien,
    kho_ref.ten_kho AS ref_ten_kho,
    kho_den_ref.ten_kho AS ref_ten_kho_den,
    nv_t.ho_va_ten AS ref_ten_nguoi_tao,
    nv_d.ho_va_ten AS ref_ten_nguoi_duyet,
    pk.id_de_xuat_mua_hang,
    pk.so_phieu_de_xuat,
    pk.trang_thai_sua,
    pk.id_nguoi_xin_sua,
    pk.ten_nguoi_xin_sua,
    pk.ly_do_xin_sua,
    pk.tg_xin_sua,
    pk.id_nguoi_cap_sua,
    pk.ten_nguoi_cap_sua,
    pk.tg_cap_sua
   FROM (((((public.fp_farm_phieu_kho_phan_thuoc pk
     LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON ((kho_ref.id = pk.kho_id)))
     LEFT JOIN public.fp_mh_danh_sach_kho kho_den_ref ON ((kho_den_ref.id = pk.kho_den_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_t ON ((nv_t.id = pk.nguoi_tao_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_d ON ((nv_d.id = pk.id_nguoi_duyet)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS so_dong,
            sum(ct.so_luong) AS tong_so_luong,
            sum(ct.thanh_tien) AS tong_tien
           FROM public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
          WHERE (ct.id_phieu_kho = pk.id)) agg ON (true));

CREATE OR REPLACE VIEW public.v_pt_phieu_kho_summary WITH (security_invoker='true') AS
 SELECT pk.id,
    pk.so_phieu,
    pk.ngay,
    pk.loai,
    pk.kho_id,
    pk.ten_kho,
    pk.kho_den_id,
    pk.ten_kho_den,
    pk.trang_thai,
    pk.mo_ta,
    pk.trao_doi,
    pk.id_nguoi_duyet,
    pk.nguoi_tao_id,
    pk.ten_nguoi_tao,
    pk.tg_tao,
    pk.tg_cap_nhat,
    COALESCE(agg.so_dong, 0) AS so_dong,
    COALESCE(agg.tong_so_luong, (0)::numeric) AS tong_so_luong,
    COALESCE(agg.tong_tien, (0)::numeric) AS tong_tien,
    kho_ref.ten_kho AS ref_ten_kho,
    kho_den_ref.ten_kho AS ref_ten_kho_den,
    nv_t.ho_va_ten AS ref_ten_nguoi_tao,
    nv_d.ho_va_ten AS ref_ten_nguoi_duyet,
    pk.id_de_xuat_mua_hang,
    pk.so_phieu_de_xuat,
    pk.trang_thai_sua,
    pk.id_nguoi_xin_sua,
    pk.ten_nguoi_xin_sua,
    pk.ly_do_xin_sua,
    pk.tg_xin_sua,
    pk.id_nguoi_cap_sua,
    pk.ten_nguoi_cap_sua,
    pk.tg_cap_sua
   FROM (((((public.fp_pt_phieu_kho pk
     LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON ((kho_ref.id = pk.kho_id)))
     LEFT JOIN public.fp_mh_danh_sach_kho kho_den_ref ON ((kho_den_ref.id = pk.kho_den_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_t ON ((nv_t.id = pk.nguoi_tao_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_d ON ((nv_d.id = pk.id_nguoi_duyet)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS so_dong,
            sum(ct.so_luong) AS tong_so_luong,
            sum(ct.thanh_tien) AS tong_tien
           FROM public.fp_pt_phieu_kho_chi_tiet ct
          WHERE (ct.id_phieu_kho = pk.id)) agg ON (true));

-- --- 3. Trigger khoá phiếu cha ------------------------------------------------
-- TG_ARGV[0] = module_id.

CREATE OR REPLACE FUNCTION public.fn_kho_pt_khoa_phieu() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_module    text := TG_ARGV[0];
  -- Cột không tính là "nội dung phiếu" khi so ca chỉ đổi quyết định duyệt.
  v_cot_duyet text[] := ARRAY['trang_thai', 'trao_doi', 'id_nguoi_duyet', 'tg_cap_nhat'];
  v_cot_sua   text[] := ARRAY['trang_thai_sua', 'id_nguoi_xin_sua', 'ten_nguoi_xin_sua', 'ly_do_xin_sua',
                              'tg_xin_sua', 'id_nguoi_cap_sua', 'ten_nguoi_cap_sua', 'tg_cap_sua'];
  v_duyet_lai boolean := false;
  v_duoc_cap  boolean;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_duyet_lai := NEW.trang_thai = 'Đã duyệt' AND OLD.trang_thai IS DISTINCT FROM 'Đã duyệt';
  END IF;

  IF current_user = 'authenticated' AND NOT public.fn_co_quyen_module(v_module, ARRAY['admin', 'all']) THEN
    IF TG_OP = 'UPDATE' THEN
      IF NEW.ngay IS DISTINCT FROM OLD.ngay THEN
        RAISE EXCEPTION 'Chỉ cấp bậc 1 hoặc quản trị mới được sửa ngày phiếu %.', OLD.so_phieu
          USING ERRCODE = 'P0001';
      END IF;

      -- Cột xin sửa chỉ đổi qua RPC (SECURITY DEFINER), không PATCH thẳng.
      IF EXISTS (
           SELECT 1 FROM unnest(v_cot_sua) c
            WHERE to_jsonb(NEW) -> c IS DISTINCT FROM to_jsonb(OLD) -> c
         ) THEN
        RAISE EXCEPTION 'Trạng thái xin sửa chỉ đổi qua nút Xin sửa / Cấp quyền sửa.'
          USING ERRCODE = 'P0001';
      END IF;
    END IF;

    IF OLD.trang_thai = 'Đã duyệt' THEN
      v_duoc_cap := COALESCE(OLD.trang_thai_sua = 'da_cap'
                             AND OLD.id_nguoi_xin_sua = public.nhan_vien_hien_tai_id(), false);

      IF v_duoc_cap THEN
        -- Bản sửa của người được cấp phải được duyệt lại.
        IF TG_OP = 'UPDATE' THEN
          NEW.trang_thai := 'Chờ duyệt';
        END IF;
      ELSIF TG_OP = 'UPDATE'
            AND (to_jsonb(NEW) - v_cot_duyet) = (to_jsonb(OLD) - v_cot_duyet)
            AND public.fn_co_quyen_module(v_module, ARRAY['approve']) THEN
        NULL;  -- Người duyệt đổi quyết định duyệt — luồng sẵn có.
      ELSE
        RAISE EXCEPTION 'Phiếu % đã duyệt — chỉ cấp bậc 1 hoặc quản trị mới sửa, xoá được. Bấm "Xin sửa" để xin cấp quyền.', OLD.so_phieu
          USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END IF;

  -- Duyệt lại = thu quyền sửa đã cấp (chạy cho mọi người gọi).
  IF v_duyet_lai THEN
    NEW.trang_thai_sua    := NULL;
    NEW.id_nguoi_xin_sua  := NULL;
    NEW.ten_nguoi_xin_sua := NULL;
    NEW.ly_do_xin_sua     := NULL;
    NEW.tg_xin_sua        := NULL;
    NEW.id_nguoi_cap_sua  := NULL;
    NEW.ten_nguoi_cap_sua := NULL;
    NEW.tg_cap_sua        := NULL;
  END IF;

  RETURN COALESCE(NEW, OLD);
END
$$;


-- --- 4. Trigger khoá bảng chi tiết --------------------------------------------
-- TG_ARGV[0] = module_id, TG_ARGV[1] = bảng phiếu cha.
-- Xoá dây chuyền khi xoá phiếu: lúc đó phiếu cha không còn → không chặn.

CREATE OR REPLACE FUNCTION public.fn_kho_pt_khoa_chi_tiet() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_module   text := TG_ARGV[0];
  v_tt       text;
  v_tt_sua   text;
  v_nguoi    bigint;
  v_so_phieu text;
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  EXECUTE format('SELECT trang_thai, trang_thai_sua, id_nguoi_xin_sua, so_phieu FROM public.%I WHERE id = $1', TG_ARGV[1])
     INTO v_tt, v_tt_sua, v_nguoi, v_so_phieu
    USING COALESCE(NEW.id_phieu_kho, OLD.id_phieu_kho);

  IF v_tt = 'Đã duyệt'
     AND NOT COALESCE(v_tt_sua = 'da_cap' AND v_nguoi = public.nhan_vien_hien_tai_id(), false)
     AND NOT public.fn_co_quyen_module(v_module, ARRAY['admin', 'all']) THEN
    RAISE EXCEPTION 'Phiếu % đã duyệt — chỉ cấp bậc 1 hoặc quản trị mới sửa được dòng hàng. Bấm "Xin sửa" để xin cấp quyền.', v_so_phieu
      USING ERRCODE = 'P0001';
  END IF;

  RETURN COALESCE(NEW, OLD);
END
$$;

-- Tên bắt đầu "tr_a_" để chạy TRƯỚC các trigger BEFORE khác (Postgres xếp theo tên):
-- bị chặn thì khỏi chạy before_delete_clear_kiem_ke vô ích.
CREATE TRIGGER tr_a_khoa_phieu_da_duyet
  BEFORE UPDATE OR DELETE ON public.fp_farm_phieu_kho_phan_thuoc
  FOR EACH ROW EXECUTE FUNCTION public.fn_kho_pt_khoa_phieu('quan-ly-nha-so-che/phieu-kho-phan-thuoc');

CREATE TRIGGER tr_a_khoa_phieu_da_duyet
  BEFORE UPDATE OR DELETE ON public.fp_pt_phieu_kho
  FOR EACH ROW EXECUTE FUNCTION public.fn_kho_pt_khoa_phieu('phan-thuoc/phieu-kho-phan-thuoc');

CREATE TRIGGER tr_a_khoa_phieu_da_duyet
  BEFORE INSERT OR UPDATE OR DELETE ON public.fp_farm_phieu_kho_phan_thuoc_chi_tiet
  FOR EACH ROW EXECUTE FUNCTION public.fn_kho_pt_khoa_chi_tiet('quan-ly-nha-so-che/phieu-kho-phan-thuoc', 'fp_farm_phieu_kho_phan_thuoc');

CREATE TRIGGER tr_a_khoa_phieu_da_duyet
  BEFORE INSERT OR UPDATE OR DELETE ON public.fp_pt_phieu_kho_chi_tiet
  FOR EACH ROW EXECUTE FUNCTION public.fn_kho_pt_khoa_chi_tiet('phan-thuoc/phieu-kho-phan-thuoc', 'fp_pt_phieu_kho');

-- --- 5. RPC xin sửa / xử lý ---------------------------------------------------
-- Lõi dùng chung (dynamic SQL theo bảng), KHÔNG cấp cho ai; 4 hàm vỏ theo biến thể.

CREATE OR REPLACE FUNCTION public.fn_kho_pt_xin_sua_core(p_bang text, p_module text, p_id bigint, p_ly_do text)
    RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nv     bigint := public.nhan_vien_hien_tai_id();
  v_ly_do  text := btrim(COALESCE(p_ly_do, ''));
  v_tt     text;
  v_tt_sua text;
BEGIN
  IF v_nv IS NULL THEN
    RAISE EXCEPTION 'Không xác định được nhân viên đăng nhập.' USING ERRCODE = 'P0001';
  END IF;
  IF v_ly_do = '' THEN
    RAISE EXCEPTION 'Phải nhập lý do xin sửa.' USING ERRCODE = 'P0001';
  END IF;
  IF public.fn_co_quyen_module(p_module, ARRAY['admin', 'all']) THEN
    RAISE EXCEPTION 'Bạn sửa trực tiếp được phiếu này, không cần xin.' USING ERRCODE = 'P0001';
  END IF;
  IF NOT public.fn_co_quyen_module(p_module, ARRAY['update', 'delete']) THEN
    RAISE EXCEPTION 'Bạn không có quyền sửa hoặc xoá phiếu kho.' USING ERRCODE = 'P0001';
  END IF;

  EXECUTE format('SELECT trang_thai, trang_thai_sua FROM public.%I WHERE id = $1 FOR UPDATE', p_bang)
     INTO v_tt, v_tt_sua
    USING p_id;

  IF v_tt IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu.' USING ERRCODE = 'P0001';
  END IF;
  IF v_tt <> 'Đã duyệt' THEN
    RAISE EXCEPTION 'Phiếu chưa duyệt — sửa trực tiếp được, không cần xin.' USING ERRCODE = 'P0001';
  END IF;
  IF v_tt_sua = 'cho_cap' THEN
    RAISE EXCEPTION 'Phiếu đang chờ cấp quyền sửa.' USING ERRCODE = 'P0001';
  END IF;
  IF v_tt_sua = 'da_cap' THEN
    RAISE EXCEPTION 'Phiếu đã được cấp quyền sửa.' USING ERRCODE = 'P0001';
  END IF;

  EXECUTE format($f$
    UPDATE public.%I
       SET trang_thai_sua    = 'cho_cap',
           id_nguoi_xin_sua  = $2,
           ten_nguoi_xin_sua = (SELECT ho_va_ten FROM public.fp_var_nhan_vien WHERE id = $2),
           ly_do_xin_sua     = $3,
           tg_xin_sua        = now(),
           id_nguoi_cap_sua  = NULL,
           ten_nguoi_cap_sua = NULL,
           tg_cap_sua        = NULL
     WHERE id = $1
  $f$, p_bang) USING p_id, v_nv, v_ly_do;
END
$$;

CREATE OR REPLACE FUNCTION public.fn_kho_pt_xu_ly_xin_sua_core(p_bang text, p_module text, p_id bigint, p_hanh_dong text)
    RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nv      bigint := public.nhan_vien_hien_tai_id();
  v_tt_sua  text;
  v_tt_moi  text;
  v_can_co  text;
BEGIN
  IF NOT public.fn_co_quyen_module(p_module, ARRAY['admin', 'all']) THEN
    RAISE EXCEPTION 'Chỉ cấp bậc 1 hoặc quản trị mới xử lý yêu cầu xin sửa.' USING ERRCODE = 'P0001';
  END IF;

  CASE p_hanh_dong
    WHEN 'cap'      THEN v_can_co := 'cho_cap'; v_tt_moi := 'da_cap';
    WHEN 'tu_choi'  THEN v_can_co := 'cho_cap'; v_tt_moi := NULL;
    WHEN 'khoa_lai' THEN v_can_co := 'da_cap';  v_tt_moi := NULL;
    ELSE RAISE EXCEPTION 'Hành động không hợp lệ: %', p_hanh_dong USING ERRCODE = 'P0001';
  END CASE;

  EXECUTE format('SELECT trang_thai_sua FROM public.%I WHERE id = $1 FOR UPDATE', p_bang)
     INTO v_tt_sua
    USING p_id;

  IF v_tt_sua IS DISTINCT FROM v_can_co THEN
    RAISE EXCEPTION 'Yêu cầu xin sửa đã được xử lý hoặc không còn — tải lại phiếu.' USING ERRCODE = 'P0001';
  END IF;

  -- Giữ thông tin người xin (worker cần id_nguoi_xin_sua để báo kết quả cho họ).
  EXECUTE format($f$
    UPDATE public.%I
       SET trang_thai_sua    = $2,
           id_nguoi_cap_sua  = $3,
           ten_nguoi_cap_sua = (SELECT ho_va_ten FROM public.fp_var_nhan_vien WHERE id = $3),
           tg_cap_sua        = now()
     WHERE id = $1
  $f$, p_bang) USING p_id, v_tt_moi, v_nv;
END
$$;

CREATE OR REPLACE FUNCTION public.rpc_farm_pt_phieu_kho_xin_sua(p_id bigint, p_ly_do text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM public.fn_kho_pt_xin_sua_core('fp_farm_phieu_kho_phan_thuoc', 'quan-ly-nha-so-che/phieu-kho-phan-thuoc', p_id, p_ly_do);
END
$$;

CREATE OR REPLACE FUNCTION public.rpc_pt_phieu_kho_xin_sua(p_id bigint, p_ly_do text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM public.fn_kho_pt_xin_sua_core('fp_pt_phieu_kho', 'phan-thuoc/phieu-kho-phan-thuoc', p_id, p_ly_do);
END
$$;

CREATE OR REPLACE FUNCTION public.rpc_farm_pt_phieu_kho_xu_ly_xin_sua(p_id bigint, p_hanh_dong text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM public.fn_kho_pt_xu_ly_xin_sua_core('fp_farm_phieu_kho_phan_thuoc', 'quan-ly-nha-so-che/phieu-kho-phan-thuoc', p_id, p_hanh_dong);
END
$$;

CREATE OR REPLACE FUNCTION public.rpc_pt_phieu_kho_xu_ly_xin_sua(p_id bigint, p_hanh_dong text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM public.fn_kho_pt_xu_ly_xin_sua_core('fp_pt_phieu_kho', 'phan-thuoc/phieu-kho-phan-thuoc', p_id, p_hanh_dong);
END
$$;

-- --- 6. Người nhận "xin sửa" cho notify-service -------------------------------
-- Cấp bậc 1 + admin/all trên module. KHÔNG gồm người chỉ có approve (khác
-- rpc_tb_nguoi_duyet) và không lọc chi nhánh.

CREATE OR REPLACE FUNCTION public.rpc_tb_quan_tri_module(p_module_id text)
    RETURNS TABLE(nhan_vien_id bigint, cap_bac integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH nv AS (
    SELECT e.id,
           e.trang_thai,
           e.chuc_vu_id,
           COALESCE(e.cap_bac, cb.cap_bac) AS cap_bac
      FROM public.fp_var_nhan_vien e
      LEFT JOIN public.fp_var_cap_bac cb ON cb.id = e.cap_bac_id
  )
  SELECT nv.id, COALESCE(nv.cap_bac, 99)::integer
    FROM nv
   WHERE COALESCE(nv.trang_thai, '') <> 'Nghỉ việc'
     AND (
           nv.cap_bac = 1
        OR EXISTS (
             SELECT 1 FROM public.fp_var_phan_quyen pq
              WHERE pq.chuc_vu_id = nv.chuc_vu_id
                AND pq.module_id  = p_module_id
                AND pq.actions && ARRAY['admin', 'all']
           )
         );
$$;

-- --- 7. Quyền ----------------------------------------------------------------

REVOKE ALL ON FUNCTION public.fn_kho_pt_khoa_phieu() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_kho_pt_khoa_chi_tiet() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_kho_pt_xin_sua_core(text, text, bigint, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_kho_pt_xu_ly_xin_sua_core(text, text, bigint, text) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.rpc_farm_pt_phieu_kho_xin_sua(bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_pt_phieu_kho_xin_sua(bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_farm_pt_phieu_kho_xu_ly_xin_sua(bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_pt_phieu_kho_xu_ly_xin_sua(bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_farm_pt_phieu_kho_xin_sua(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_pt_phieu_kho_xin_sua(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_farm_pt_phieu_kho_xu_ly_xin_sua(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_pt_phieu_kho_xu_ly_xin_sua(bigint, text) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_tb_quan_tri_module(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_tb_quan_tri_module(text) TO notify_service;

COMMIT;

NOTIFY pgrst, 'reload schema';
