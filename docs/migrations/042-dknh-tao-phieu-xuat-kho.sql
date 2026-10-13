-- =============================================================================
-- 042-dknh-tao-phieu-xuat-kho.sql — Đăng ký nhận hàng: tạo phiếu xuất kho thành phẩm từ cây hàng trên xe
--
-- Trước đây cây hàng xếp lên xe (fp_farm_dang_ky_nhan_hang_ct) không nối với kho: thủ kho phải tạo
-- lại phiếu FXK cùng số thùng ở module Phiếu kho. Nay:
--
-- 1. fp_farm_phieu_kho_phan_thuoc.id_dang_ky_nhan_hang — khoá nối phiếu xuất ↔ xe. Mỗi xe chỉ một
--    phiếu còn hiệu lực (≠ 'Không duyệt'). Chỉ bảng Sơ chế: Phân thuốc (fp_pt_*) không có module
--    đăng ký nhận hàng nên không thêm cột bên đó.
-- 2. rpc_dknh_tao_phieu_xuat(xe, kho): bấm "Tạo phiếu xuất kho" / "Cập nhật phiếu xuất" — ghi header +
--    dòng trong một transaction, dòng gộp theo thành phẩm (id_hang_hoa của phiếu QC). KHÔNG tự đồng bộ:
--    quét thêm / sửa / xoá cây sau đó chỉ đánh dấu "cần cập nhật".
-- 3. fp_farm_dang_ky_nhan_hang.tinh_trang_phieu_xuat — tình trạng cho danh sách + chip lọc:
--      NULL          xe chưa có cây hàng
--      chua_tao      có cây, chưa có phiếu xuất còn hiệu lực
--      can_cap_nhat  tổng thùng theo thành phẩm trên xe ≠ trên phiếu xuất
--      da_tao        khớp, phiếu 'Chờ duyệt'
--      da_duyet      khớp, phiếu 'Đã duyệt'
--    Tính lại bằng trigger trên bảng con xe, header và dòng phiếu kho. Khớp core/phieu-xuat.ts ở app.
-- 4. Phiếu xuất 'Đã duyệt' → khoá thêm / sửa / xoá cây trên xe, trừ cấp cao (DKNH hoặc Phiếu kho)
--    và người được cấp "Xin sửa" phiếu kho đó (luật 035).
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-042
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/042-dknh-tao-phieu-xuat-kho.sql
-- =============================================================================

BEGIN;

-- --- 1. Cột liên kết + cột tình trạng -----------------------------------------

ALTER TABLE public.fp_farm_phieu_kho_phan_thuoc
  ADD COLUMN IF NOT EXISTS id_dang_ky_nhan_hang bigint
    REFERENCES public.fp_farm_dang_ky_nhan_hang(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.fp_farm_phieu_kho_phan_thuoc.id_dang_ky_nhan_hang IS
  'Phiếu xuất thành phẩm sinh từ đăng ký nhận hàng (xe) — rpc_dknh_tao_phieu_xuat';

CREATE UNIQUE INDEX IF NOT EXISTS fp_farm_phieu_kho_pt_dknh_hieu_luc_key
  ON public.fp_farm_phieu_kho_phan_thuoc (id_dang_ky_nhan_hang)
  WHERE id_dang_ky_nhan_hang IS NOT NULL AND trang_thai <> 'Không duyệt';

ALTER TABLE public.fp_farm_dang_ky_nhan_hang
  ADD COLUMN IF NOT EXISTS tinh_trang_phieu_xuat text;

ALTER TABLE public.fp_farm_dang_ky_nhan_hang
  DROP CONSTRAINT IF EXISTS fp_farm_dknh_tinh_trang_phieu_xuat_check;
ALTER TABLE public.fp_farm_dang_ky_nhan_hang
  ADD CONSTRAINT fp_farm_dknh_tinh_trang_phieu_xuat_check
    CHECK (tinh_trang_phieu_xuat IS NULL
           OR tinh_trang_phieu_xuat = ANY (ARRAY['chua_tao', 'can_cap_nhat', 'da_tao', 'da_duyet']));

COMMENT ON COLUMN public.fp_farm_dang_ky_nhan_hang.tinh_trang_phieu_xuat IS
  'NULL (chưa có cây) | chua_tao | can_cap_nhat | da_tao | da_duyet — do trigger tính, app không ghi';

-- --- 2. Hàm dùng chung --------------------------------------------------------

-- Phiếu xuất còn hiệu lực của xe (≠ 'Không duyệt'); NULL nếu chưa có.
CREATE OR REPLACE FUNCTION public.fn_dknh_phieu_xuat_hieu_luc(p_id_dknh bigint) RETURNS bigint
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT pk.id
    FROM public.fp_farm_phieu_kho_phan_thuoc pk
   WHERE pk.id_dang_ky_nhan_hang = p_id_dknh
     AND pk.trang_thai <> 'Không duyệt'
   ORDER BY pk.id DESC
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.fn_dknh_phieu_xuat_hieu_luc(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_dknh_phieu_xuat_hieu_luc(bigint) TO authenticated;

-- Người gọi được sửa cây / cập nhật phiếu khi phiếu xuất đã duyệt?
CREATE OR REPLACE FUNCTION public.fn_dknh_duoc_sua_khi_phieu_xuat_duyet(p_id_phieu_kho bigint) RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT public.fn_dknh_la_cap_cao()
      OR public.fn_co_quyen_module('quan-ly-nha-so-che/phieu-kho-phan-thuoc', ARRAY['admin', 'all'])
      OR EXISTS (
           SELECT 1 FROM public.fp_farm_phieu_kho_phan_thuoc pk
            WHERE pk.id = p_id_phieu_kho
              AND pk.trang_thai_sua = 'da_cap'
              AND pk.id_nguoi_xin_sua = public.nhan_vien_hien_tai_id()
         );
$$;

REVOKE ALL ON FUNCTION public.fn_dknh_duoc_sua_khi_phieu_xuat_duyet(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_dknh_duoc_sua_khi_phieu_xuat_duyet(bigint) TO authenticated;

-- Tính lại tinh_trang_phieu_xuat của một xe. SECURITY DEFINER để trigger chạy được bất kể RLS.
CREATE OR REPLACE FUNCTION public.fn_dknh_tinh_lai_phieu_xuat(p_id_dknh bigint) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id_pk  bigint;
  v_tt_pk  text;
  v_co_cay boolean;
  v_lech   boolean;
  v_moi    text;
BEGIN
  IF p_id_dknh IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.fp_farm_dang_ky_nhan_hang_ct WHERE id_phieu = p_id_dknh) INTO v_co_cay;
  v_id_pk := public.fn_dknh_phieu_xuat_hieu_luc(p_id_dknh);

  IF v_id_pk IS NULL THEN
    v_moi := CASE WHEN v_co_cay THEN 'chua_tao' END;
  ELSE
    SELECT trang_thai INTO v_tt_pk FROM public.fp_farm_phieu_kho_phan_thuoc WHERE id = v_id_pk;

    WITH xe AS (
      SELECT g.id_hang_hoa, sum(ct.so_luong) AS sl
        FROM public.fp_farm_dang_ky_nhan_hang_ct ct
        JOIN public.fp_farm_giam_sat_chat_luong g ON g.id = ct.id_phieu_gscl
       WHERE ct.id_phieu = p_id_dknh
       GROUP BY g.id_hang_hoa
    ), phieu AS (
      SELECT d.id_hang_hoa, sum(d.so_luong) AS sl
        FROM public.fp_farm_phieu_kho_phan_thuoc_chi_tiet d
       WHERE d.id_phieu_kho = v_id_pk
       GROUP BY d.id_hang_hoa
    )
    SELECT EXISTS (
      SELECT 1
        FROM xe FULL JOIN phieu ON phieu.id_hang_hoa = xe.id_hang_hoa
       WHERE xe.id_hang_hoa IS NULL OR phieu.id_hang_hoa IS NULL OR xe.sl <> phieu.sl
    ) INTO v_lech;

    v_moi := CASE
      WHEN v_lech THEN 'can_cap_nhat'
      WHEN v_tt_pk = 'Đã duyệt' THEN 'da_duyet'
      ELSE 'da_tao'
    END;
  END IF;

  UPDATE public.fp_farm_dang_ky_nhan_hang
     SET tinh_trang_phieu_xuat = v_moi
   WHERE id = p_id_dknh
     AND tinh_trang_phieu_xuat IS DISTINCT FROM v_moi;
END
$$;

REVOKE ALL ON FUNCTION public.fn_dknh_tinh_lai_phieu_xuat(bigint) FROM PUBLIC, anon;

-- --- 3. Trigger tính lại tình trạng -------------------------------------------
-- SECURITY DEFINER: người dùng (authenticated) quét / sửa cây vẫn kích hoạt được tính lại, còn
-- fn_dknh_tinh_lai_phieu_xuat không mở cho gọi thẳng qua PostgREST.

CREATE OR REPLACE FUNCTION public.fn_dknh_ct_tinh_lai_phieu_xuat() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.fn_dknh_tinh_lai_phieu_xuat(OLD.id_phieu);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND (TG_OP = 'INSERT' OR NEW.id_phieu IS DISTINCT FROM OLD.id_phieu) THEN
    PERFORM public.fn_dknh_tinh_lai_phieu_xuat(NEW.id_phieu);
  END IF;
  RETURN NULL;
END
$$;

REVOKE ALL ON FUNCTION public.fn_dknh_ct_tinh_lai_phieu_xuat() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_dknh_ct_tinh_lai_phieu_xuat ON public.fp_farm_dang_ky_nhan_hang_ct;
CREATE TRIGGER trg_dknh_ct_tinh_lai_phieu_xuat
  AFTER INSERT OR UPDATE OR DELETE ON public.fp_farm_dang_ky_nhan_hang_ct
  FOR EACH ROW EXECUTE FUNCTION public.fn_dknh_ct_tinh_lai_phieu_xuat();

CREATE OR REPLACE FUNCTION public.fn_pk_farm_tinh_lai_phieu_xuat_dknh() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM public.fn_dknh_tinh_lai_phieu_xuat(OLD.id_dang_ky_nhan_hang);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE')
     AND NEW.id_dang_ky_nhan_hang IS DISTINCT FROM (CASE WHEN TG_OP = 'UPDATE' THEN OLD.id_dang_ky_nhan_hang END) THEN
    PERFORM public.fn_dknh_tinh_lai_phieu_xuat(NEW.id_dang_ky_nhan_hang);
  END IF;
  RETURN NULL;
END
$$;

REVOKE ALL ON FUNCTION public.fn_pk_farm_tinh_lai_phieu_xuat_dknh() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_pk_farm_tinh_lai_phieu_xuat_dknh ON public.fp_farm_phieu_kho_phan_thuoc;
CREATE TRIGGER trg_pk_farm_tinh_lai_phieu_xuat_dknh
  AFTER INSERT OR UPDATE OR DELETE ON public.fp_farm_phieu_kho_phan_thuoc
  FOR EACH ROW EXECUTE FUNCTION public.fn_pk_farm_tinh_lai_phieu_xuat_dknh();

CREATE OR REPLACE FUNCTION public.fn_pk_farm_ct_tinh_lai_phieu_xuat_dknh() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id_dknh bigint;
BEGIN
  SELECT pk.id_dang_ky_nhan_hang INTO v_id_dknh
    FROM public.fp_farm_phieu_kho_phan_thuoc pk
   WHERE pk.id = COALESCE(NEW.id_phieu_kho, OLD.id_phieu_kho);
  PERFORM public.fn_dknh_tinh_lai_phieu_xuat(v_id_dknh);
  RETURN NULL;
END
$$;

REVOKE ALL ON FUNCTION public.fn_pk_farm_ct_tinh_lai_phieu_xuat_dknh() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_pk_farm_ct_tinh_lai_phieu_xuat_dknh ON public.fp_farm_phieu_kho_phan_thuoc_chi_tiet;
CREATE TRIGGER trg_pk_farm_ct_tinh_lai_phieu_xuat_dknh
  AFTER INSERT OR UPDATE OR DELETE ON public.fp_farm_phieu_kho_phan_thuoc_chi_tiet
  FOR EACH ROW EXECUTE FUNCTION public.fn_pk_farm_ct_tinh_lai_phieu_xuat_dknh();

-- --- 4. Khoá cây hàng khi phiếu xuất đã duyệt ---------------------------------

CREATE OR REPLACE FUNCTION public.fn_dknh_ct_khoa_phieu_xuat_duyet() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id_pk    bigint;
  v_so_phieu text;
BEGIN
  -- Migration, SQL tay, cascade, hàm SECURITY DEFINER: không chặn.
  IF current_user <> 'authenticated' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT pk.id, pk.so_phieu INTO v_id_pk, v_so_phieu
    FROM public.fp_farm_phieu_kho_phan_thuoc pk
   WHERE pk.id = public.fn_dknh_phieu_xuat_hieu_luc(COALESCE(NEW.id_phieu, OLD.id_phieu))
     AND pk.trang_thai = 'Đã duyệt';

  IF v_id_pk IS NOT NULL AND NOT public.fn_dknh_duoc_sua_khi_phieu_xuat_duyet(v_id_pk) THEN
    RAISE EXCEPTION 'Phiếu xuất kho % của xe này đã duyệt — không thêm, sửa, xoá cây hàng được. Bấm "Xin sửa" ở phiếu kho để xin cấp quyền.', v_so_phieu
      USING ERRCODE = 'P0001';
  END IF;

  RETURN COALESCE(NEW, OLD);
END
$$;

REVOKE ALL ON FUNCTION public.fn_dknh_ct_khoa_phieu_xuat_duyet() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_dknh_ct_khoa_phieu_xuat_duyet ON public.fp_farm_dang_ky_nhan_hang_ct;
CREATE TRIGGER trg_dknh_ct_khoa_phieu_xuat_duyet
  BEFORE INSERT OR UPDATE OR DELETE ON public.fp_farm_dang_ky_nhan_hang_ct
  FOR EACH ROW EXECUTE FUNCTION public.fn_dknh_ct_khoa_phieu_xuat_duyet();

-- --- 5. RPC tạo / cập nhật phiếu xuất -----------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_dknh_tao_phieu_xuat(p_id_dknh bigint, p_kho_id bigint) RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_xe       public.fp_farm_dang_ky_nhan_hang%ROWTYPE;
  v_kho      public.fp_mh_danh_sach_kho%ROWTYPE;
  v_id_pk    bigint;
  v_pk       public.fp_farm_phieu_kho_phan_thuoc%ROWTYPE;
  v_id_nv    bigint := public.nhan_vien_hien_tai_id();
  v_ten_nv   text;
  v_thieu_tp text;
BEGIN
  IF NOT public.fn_co_quyen_module('quan-ly-nha-so-che/dang-ky-nhan-hang', ARRAY['update', 'admin', 'all']) THEN
    RAISE EXCEPTION 'Bạn không có quyền sửa đăng ký nhận hàng nên không tạo được phiếu xuất kho.'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_xe FROM public.fp_farm_dang_ky_nhan_hang WHERE id = p_id_dknh FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu đăng ký nhận hàng #%.', p_id_dknh USING ERRCODE = 'P0001';
  END IF;
  IF v_xe.trang_thai NOT IN ('da_vao', 'da_ra') THEN
    RAISE EXCEPTION 'Chỉ tạo phiếu xuất kho khi xe đã vào hoặc đã ra.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.fp_farm_dang_ky_nhan_hang_ct WHERE id_phieu = p_id_dknh) THEN
    RAISE EXCEPTION 'Xe chưa có cây hàng nào để xuất kho.' USING ERRCODE = 'P0001';
  END IF;

  SELECT string_agg(g.so_phieu, ', ' ORDER BY g.so_phieu) INTO v_thieu_tp
    FROM public.fp_farm_dang_ky_nhan_hang_ct ct
    JOIN public.fp_farm_giam_sat_chat_luong g ON g.id = ct.id_phieu_gscl
   WHERE ct.id_phieu = p_id_dknh AND g.id_hang_hoa IS NULL;
  IF v_thieu_tp IS NOT NULL THEN
    RAISE EXCEPTION 'Phiếu QC % chưa chọn thành phẩm — bổ sung ở Giám sát chất lượng rồi tạo lại.', v_thieu_tp
      USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_kho FROM public.fp_mh_danh_sach_kho WHERE id = p_kho_id;
  IF NOT FOUND OR v_kho.chi_nhanh_id IS DISTINCT FROM v_xe.id_chi_nhanh THEN
    RAISE EXCEPTION 'Kho xuất phải thuộc chi nhánh của xe.' USING ERRCODE = 'P0001';
  END IF;

  SELECT n.ho_va_ten INTO v_ten_nv FROM public.fp_var_nhan_vien n WHERE n.id = v_id_nv;

  v_id_pk := public.fn_dknh_phieu_xuat_hieu_luc(p_id_dknh);

  IF v_id_pk IS NULL THEN
    INSERT INTO public.fp_farm_phieu_kho_phan_thuoc (
      so_phieu, ngay, loai, kho_id, ten_kho, trang_thai, mo_ta,
      nguoi_tao_id, ten_nguoi_tao, id_dang_ky_nhan_hang
    ) VALUES (
      get_next_so_phieu_farm_pt('xuất'),
      COALESCE((v_xe.tg_vao_thuc_te AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, v_xe.ngay_dang_ky),
      'xuất',
      v_kho.id,
      v_kho.ten_kho,
      'Chờ duyệt',
      'Xuất thành phẩm theo đăng ký xe: '
        || COALESCE(NULLIF(concat_ws(' · ', NULLIF(btrim(v_xe.so_xe), ''), NULLIF(btrim(v_xe.so_cont), ''),
                                     NULLIF(btrim(v_xe.khach_hang), '')), ''), '#' || v_xe.id),
      v_id_nv,
      v_ten_nv,
      p_id_dknh
    )
    RETURNING id INTO v_id_pk;
  ELSE
    SELECT * INTO v_pk FROM public.fp_farm_phieu_kho_phan_thuoc WHERE id = v_id_pk FOR UPDATE;

    IF v_pk.trang_thai = 'Đã duyệt' AND NOT public.fn_dknh_duoc_sua_khi_phieu_xuat_duyet(v_id_pk) THEN
      RAISE EXCEPTION 'Phiếu xuất kho % đã duyệt — bấm "Xin sửa" ở phiếu kho để xin cấp quyền rồi cập nhật lại.', v_pk.so_phieu
        USING ERRCODE = 'P0001';
    END IF;

    -- Người được cấp "Xin sửa" (không phải cấp cao): bản sửa phải được duyệt lại — như luật 035.
    UPDATE public.fp_farm_phieu_kho_phan_thuoc
       SET kho_id = v_kho.id,
           ten_kho = v_kho.ten_kho,
           trang_thai = CASE
             WHEN v_pk.trang_thai = 'Đã duyệt'
                  AND NOT public.fn_dknh_la_cap_cao()
                  AND NOT public.fn_co_quyen_module('quan-ly-nha-so-che/phieu-kho-phan-thuoc', ARRAY['admin', 'all'])
               THEN 'Chờ duyệt'
             ELSE trang_thai
           END
     WHERE id = v_id_pk;

    DELETE FROM public.fp_farm_phieu_kho_phan_thuoc_chi_tiet WHERE id_phieu_kho = v_id_pk;
  END IF;

  INSERT INTO public.fp_farm_phieu_kho_phan_thuoc_chi_tiet (
    id_phieu_kho, id_hang_hoa, ten_hang_hoa, don_vi_tinh, pham_cap, so_luong, don_gia, ghi_chu,
    nguoi_tao_id, ten_nguoi_tao
  )
  SELECT v_id_pk,
         g.id_hang_hoa,
         hh.ten_hang_hoa,
         hh.dvt,
         hh.pham_cap,
         sum(ct.so_luong),
         0,
         'Cây: ' || string_agg(g.so_phieu || COALESCE(' (' || NULLIF(btrim(g.ma_cay_hang), '') || ')', ''),
                               ', ' ORDER BY g.so_phieu),
         v_id_nv,
         v_ten_nv
    FROM public.fp_farm_dang_ky_nhan_hang_ct ct
    JOIN public.fp_farm_giam_sat_chat_luong g ON g.id = ct.id_phieu_gscl
    LEFT JOIN public.fp_farm_danh_sach_hang_hoa hh ON hh.id = g.id_hang_hoa
   WHERE ct.id_phieu = p_id_dknh
   GROUP BY g.id_hang_hoa, hh.ten_hang_hoa, hh.dvt, hh.pham_cap
   ORDER BY hh.ten_hang_hoa;

  RETURN v_id_pk;
END
$$;

COMMENT ON FUNCTION public.rpc_dknh_tao_phieu_xuat(bigint, bigint) IS
  'Tạo (hoặc cập nhật nếu đã có) phiếu xuất kho Sơ chế từ cây hàng trên xe — dòng gộp theo thành phẩm';

REVOKE ALL ON FUNCTION public.rpc_dknh_tao_phieu_xuat(bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_dknh_tao_phieu_xuat(bigint, bigint) TO authenticated;

-- --- 6. Backfill ---------------------------------------------------------------

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.fp_farm_dang_ky_nhan_hang LOOP
    PERFORM public.fn_dknh_tinh_lai_phieu_xuat(r.id);
  END LOOP;
END
$$;

COMMIT;

NOTIFY pgrst, 'reload schema';
