-- =============================================================================
-- 075-phieu-kho-chuyen-xac-nhan-nhan-trao-doi.sql — Phiếu kho loại CHUYỂN:
-- kho đến xác nhận "đã nhận hàng" + section Trao đổi trên phiếu.
--
-- Áp cho CẢ BA bảng phiếu kho (xem features/quan-ly-nha-so-che/kho-bien-the/bien-the.ts):
--   Mua hàng    fp_mh_phieu_kho                  module kho-van/phieu-kho
--   Sơ chế      fp_farm_phieu_kho_phan_thuoc     module quan-ly-nha-so-che/phieu-kho-phan-thuoc
--   Phân thuốc  fp_pt_phieu_kho                  module phan-thuoc/phieu-kho-phan-thuoc
--
-- 1. Cột mới (id_nguoi_nhan/ten_nguoi_nhan/tg_nhan): ai xác nhận đã nhận hàng, lúc nào.
-- 2. RPC xac_nhan_nhan: chỉ phiếu loai='chuyển' + trang_thai='Chờ duyệt' + chưa xác nhận.
--    Ghi người nhận + thời điểm vào phiếu, đồng thời nối dòng `[dd/mm/yyyy HH:mm] Tên: Đã nhận hàng`
--    vào trao_doi (đúng định dạng popup Trao đổi — lib/trao-doi-log.ts). KHÔNG chặn duyệt.
-- 3. RPC sua_trao_doi: ghi đè cả cột trao_doi với khoá lạc quan (khớp migration 039). Ai xem được
--    module cũng ghi THÊM được; sửa/xoá tin cũ chỉ quản trị module hoặc cấp bậc 1.
-- Quyền: fn_co_quyen_module(<module>, {view,create,update,delete,approve,admin,all}) — tức ai
-- xem được module cũng bấm/ghi được; RPC SECURITY DEFINER là chốt chặn thật.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-075
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/075-phieu-kho-chuyen-xac-nhan-nhan-trao-doi.sql
-- =============================================================================

BEGIN;

-- --- 1. Cột xác nhận đã nhận hàng ---------------------------------------------

ALTER TABLE public.fp_mh_phieu_kho
  ADD COLUMN id_nguoi_nhan bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL,
  ADD COLUMN ten_nguoi_nhan text,
  ADD COLUMN tg_nhan timestamp with time zone;

ALTER TABLE public.fp_farm_phieu_kho_phan_thuoc
  ADD COLUMN id_nguoi_nhan bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL,
  ADD COLUMN ten_nguoi_nhan text,
  ADD COLUMN tg_nhan timestamp with time zone;

ALTER TABLE public.fp_pt_phieu_kho
  ADD COLUMN id_nguoi_nhan bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL,
  ADD COLUMN ten_nguoi_nhan text,
  ADD COLUMN tg_nhan timestamp with time zone;

COMMENT ON COLUMN public.fp_mh_phieu_kho.id_nguoi_nhan IS 'Người (kho đến) xác nhận đã nhận hàng — chỉ phiếu loai = chuyển';
COMMENT ON COLUMN public.fp_mh_phieu_kho.tg_nhan IS 'Thời điểm xác nhận đã nhận hàng (múi giờ máy chủ)';
COMMENT ON COLUMN public.fp_farm_phieu_kho_phan_thuoc.id_nguoi_nhan IS 'Người (kho đến) xác nhận đã nhận hàng — chỉ phiếu loai = chuyển';
COMMENT ON COLUMN public.fp_farm_phieu_kho_phan_thuoc.tg_nhan IS 'Thời điểm xác nhận đã nhận hàng (múi giờ máy chủ)';
COMMENT ON COLUMN public.fp_pt_phieu_kho.id_nguoi_nhan IS 'Người (kho đến) xác nhận đã nhận hàng — chỉ phiếu loai = chuyển';
COMMENT ON COLUMN public.fp_pt_phieu_kho.tg_nhan IS 'Thời điểm xác nhận đã nhận hàng (múi giờ máy chủ)';

-- --- 2. View summary + flat: thêm 3 cột mới (cuối danh sách) ------------------
-- CREATE OR REPLACE VIEW không đổi được thứ tự cột cũ → chỉ nối thêm ở cuối.

-- Mua hàng — summary
CREATE OR REPLACE VIEW public.v_phieu_kho_summary WITH (security_invoker='true') AS
 SELECT pk.id,
    pk.so_phieu,
    pk.ngay,
    pk.loai,
    pk.kho_id,
    pk.ten_kho,
    pk.kho_den_id,
    pk.ten_kho_den,
    pk.id_nha_cung_cap,
    pk.id_khach_hang,
    pk.trang_thai,
    pk.mo_ta,
    pk.nguoi_tao_id,
    pk.ten_nguoi_tao,
    pk.tg_tao,
    pk.tg_cap_nhat,
    pk.trao_doi,
    pk.id_nguoi_duyet,
    pk.id_don_dat_hang,
    COALESCE(agg.so_dong, 0) AS so_dong,
    COALESCE(agg.tong_so_luong, (0)::numeric) AS tong_so_luong,
    COALESCE(agg.tong_tien, (0)::numeric) AS tong_tien,
    kho_ref.ten_kho AS ref_ten_kho,
    kho_den_ref.ten_kho AS ref_ten_kho_den,
    ncc.ten_doi_tac AS ref_ten_nha_cung_cap,
    kh.ten_doi_tac AS ref_ten_khach_hang,
    nv_t.ho_va_ten AS ref_ten_nguoi_tao,
    nv_d.ho_va_ten AS ref_ten_nguoi_duyet,
    dd.so_po AS ref_so_po_don_dat_hang,
    pk.id_nguoi_nhan,
    pk.ten_nguoi_nhan,
    pk.tg_nhan,
    nv_n.ho_va_ten AS ref_ten_nguoi_nhan
   FROM (((((((((public.fp_mh_phieu_kho pk
     LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON ((kho_ref.id = pk.kho_id)))
     LEFT JOIN public.fp_mh_danh_sach_kho kho_den_ref ON ((kho_den_ref.id = pk.kho_den_id)))
     LEFT JOIN public.fp_mh_danh_sach_doi_tac ncc ON ((ncc.id = pk.id_nha_cung_cap)))
     LEFT JOIN public.fp_mh_danh_sach_doi_tac kh ON ((kh.id = pk.id_khach_hang)))
     LEFT JOIN public.fp_var_nhan_vien nv_t ON ((nv_t.id = pk.nguoi_tao_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_d ON ((nv_d.id = pk.id_nguoi_duyet)))
     LEFT JOIN public.fp_var_nhan_vien nv_n ON ((nv_n.id = pk.id_nguoi_nhan)))
     LEFT JOIN public.fp_mh_don_dat_hang dd ON ((dd.id = pk.id_don_dat_hang)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS so_dong,
            sum(ct.so_luong) AS tong_so_luong,
            sum(ct.thanh_tien) AS tong_tien
           FROM public.fp_mh_phieu_kho_chi_tiet ct
          WHERE (ct.id_phieu_kho = pk.id)) agg ON (true));

-- Mua hàng — flat
CREATE OR REPLACE VIEW public.v_phieu_kho_chi_tiet_flat WITH (security_invoker='true') AS
SELECT ct.id AS chi_tiet_id,
    ct.id_phieu_kho,
    ct.id_hang_hoa,
    ct.ten_hang_hoa,
    ct.don_vi_tinh,
    COALESCE(NULLIF(btrim(ct.pham_cap), ''::text), NULLIF(btrim(hh.pham_cap), ''::text)) AS pham_cap,
    ct.so_luong,
    ct.don_gia,
    ct.thanh_tien,
    ct.so_lot,
    ct.ghi_chu,
    ct.nguoi_tao_id AS chi_tiet_nguoi_tao_id,
    ct.ten_nguoi_tao AS chi_tiet_ten_nguoi_tao,
    ct.tg_tao AS chi_tiet_tg_tao,
    ct.tg_cap_nhat AS chi_tiet_tg_cap_nhat,
    pk.id AS phieu_id,
    pk.so_phieu,
    pk.ngay,
    pk.loai,
    pk.kho_id,
    pk.ten_kho,
    pk.kho_den_id,
    pk.ten_kho_den,
    pk.id_nha_cung_cap,
    pk.id_khach_hang,
    pk.trang_thai,
    pk.mo_ta,
    pk.trao_doi,
    pk.nguoi_tao_id AS phieu_nguoi_tao_id,
    pk.ten_nguoi_tao AS phieu_ten_nguoi_tao,
    pk.id_nguoi_duyet,
    pk.tg_tao AS phieu_tg_tao,
    pk.tg_cap_nhat AS phieu_tg_cap_nhat,
    pk.id_don_dat_hang,
    hh.ma_hang_hoa AS ma_hang,
    dd.so_po AS so_po_don_dat_hang,
    pk.id_nguoi_nhan,
    pk.ten_nguoi_nhan,
    pk.tg_nhan
   FROM fp_mh_phieu_kho_chi_tiet ct
     JOIN fp_mh_phieu_kho pk ON pk.id = ct.id_phieu_kho
     LEFT JOIN fp_mh_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa
     LEFT JOIN fp_mh_don_dat_hang dd ON dd.id = pk.id_don_dat_hang;

-- Sơ chế — summary
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
    pk.tg_cap_sua,
    pk.id_nguoi_nhan,
    pk.ten_nguoi_nhan,
    pk.tg_nhan,
    nv_n.ho_va_ten AS ref_ten_nguoi_nhan
   FROM ((((((public.fp_farm_phieu_kho_phan_thuoc pk
     LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON ((kho_ref.id = pk.kho_id)))
     LEFT JOIN public.fp_mh_danh_sach_kho kho_den_ref ON ((kho_den_ref.id = pk.kho_den_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_t ON ((nv_t.id = pk.nguoi_tao_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_d ON ((nv_d.id = pk.id_nguoi_duyet)))
     LEFT JOIN public.fp_var_nhan_vien nv_n ON ((nv_n.id = pk.id_nguoi_nhan)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS so_dong,
            sum(ct.so_luong) AS tong_so_luong,
            sum(ct.thanh_tien) AS tong_tien
           FROM public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
          WHERE (ct.id_phieu_kho = pk.id)) agg ON (true));

-- Sơ chế — flat
CREATE OR REPLACE VIEW public.v_farm_phieu_kho_phan_thuoc_chi_tiet_flat WITH (security_invoker='true') AS
SELECT ct.id AS chi_tiet_id,
    ct.id_phieu_kho,
    ct.id_hang_hoa,
    ct.ten_hang_hoa,
    ct.don_vi_tinh,
    COALESCE(NULLIF(btrim(ct.pham_cap), ''::text), NULLIF(btrim(hh.pham_cap), ''::text)) AS pham_cap,
    ct.so_luong,
    ct.don_gia,
    ct.thanh_tien,
    ct.so_lot,
    ct.ghi_chu,
    ct.nguoi_tao_id AS chi_tiet_nguoi_tao_id,
    ct.ten_nguoi_tao AS chi_tiet_ten_nguoi_tao,
    ct.tg_tao AS chi_tiet_tg_tao,
    ct.tg_cap_nhat AS chi_tiet_tg_cap_nhat,
    pk.id AS phieu_id,
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
    pk.nguoi_tao_id AS phieu_nguoi_tao_id,
    pk.ten_nguoi_tao AS phieu_ten_nguoi_tao,
    pk.id_nguoi_duyet,
    pk.tg_tao AS phieu_tg_tao,
    pk.tg_cap_nhat AS phieu_tg_cap_nhat,
    hh.ma_hang_hoa AS ma_hang,
    NULLIF(btrim(ct.hang_muc), ''::text) AS hang_muc,
    pk.id_nguoi_nhan,
    pk.ten_nguoi_nhan,
    pk.tg_nhan
   FROM fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
     JOIN fp_farm_phieu_kho_phan_thuoc pk ON pk.id = ct.id_phieu_kho
     LEFT JOIN fp_farm_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa;

-- Phân thuốc — summary
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
    pk.tg_cap_sua,
    pk.id_nguoi_nhan,
    pk.ten_nguoi_nhan,
    pk.tg_nhan,
    nv_n.ho_va_ten AS ref_ten_nguoi_nhan
   FROM ((((((public.fp_pt_phieu_kho pk
     LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON ((kho_ref.id = pk.kho_id)))
     LEFT JOIN public.fp_mh_danh_sach_kho kho_den_ref ON ((kho_den_ref.id = pk.kho_den_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_t ON ((nv_t.id = pk.nguoi_tao_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_d ON ((nv_d.id = pk.id_nguoi_duyet)))
     LEFT JOIN public.fp_var_nhan_vien nv_n ON ((nv_n.id = pk.id_nguoi_nhan)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS so_dong,
            sum(ct.so_luong) AS tong_so_luong,
            sum(ct.thanh_tien) AS tong_tien
           FROM public.fp_pt_phieu_kho_chi_tiet ct
          WHERE (ct.id_phieu_kho = pk.id)) agg ON (true));

-- Phân thuốc — flat
CREATE OR REPLACE VIEW public.v_pt_phieu_kho_chi_tiet_flat WITH (security_invoker='true') AS
SELECT ct.id AS chi_tiet_id,
    ct.id_phieu_kho,
    ct.id_hang_hoa,
    ct.ten_hang_hoa,
    ct.don_vi_tinh,
    COALESCE(NULLIF(btrim(ct.pham_cap), ''::text), NULLIF(btrim(hh.pham_cap), ''::text)) AS pham_cap,
    ct.so_luong,
    ct.don_gia,
    ct.thanh_tien,
    ct.so_lot,
    ct.ghi_chu,
    ct.nguoi_tao_id AS chi_tiet_nguoi_tao_id,
    ct.ten_nguoi_tao AS chi_tiet_ten_nguoi_tao,
    ct.tg_tao AS chi_tiet_tg_tao,
    ct.tg_cap_nhat AS chi_tiet_tg_cap_nhat,
    pk.id AS phieu_id,
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
    pk.nguoi_tao_id AS phieu_nguoi_tao_id,
    pk.ten_nguoi_tao AS phieu_ten_nguoi_tao,
    pk.id_nguoi_duyet,
    pk.tg_tao AS phieu_tg_tao,
    pk.tg_cap_nhat AS phieu_tg_cap_nhat,
    hh.ma_hang_hoa AS ma_hang,
    NULLIF(btrim(ct.hang_muc), ''::text) AS hang_muc,
    pk.id_nguoi_nhan,
    pk.ten_nguoi_nhan,
    pk.tg_nhan
   FROM fp_pt_phieu_kho_chi_tiet ct
     JOIN fp_pt_phieu_kho pk ON pk.id = ct.id_phieu_kho
     LEFT JOIN fp_pt_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa;

-- --- 3. RPC xác nhận đã nhận hàng ---------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_mh_phieu_kho_xac_nhan_nhan(p_id bigint)
    RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nv      bigint := public.nhan_vien_hien_tai_id();
  v_ten     text;
  v_loai    text;
  v_tt      text;
  v_da_nhan bigint;
  v_dong    text;
BEGIN
  IF NOT public.fn_co_quyen_module('kho-van/phieu-kho', ARRAY['view','create','update','delete','approve','admin','all']) THEN
    RAISE EXCEPTION 'Bạn không có quyền truy cập phiếu kho.' USING ERRCODE = 'P0001';
  END IF;

  SELECT loai, trang_thai, id_nguoi_nhan INTO v_loai, v_tt, v_da_nhan
    FROM public.fp_mh_phieu_kho WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu kho.' USING ERRCODE = 'P0001';
  END IF;
  IF v_loai IS DISTINCT FROM 'chuyển' THEN
    RAISE EXCEPTION 'Chỉ phiếu chuyển kho mới xác nhận đã nhận hàng.' USING ERRCODE = 'P0001';
  END IF;
  IF v_tt IS DISTINCT FROM 'Chờ duyệt' THEN
    RAISE EXCEPTION 'Chỉ phiếu đang chờ duyệt mới xác nhận đã nhận hàng.' USING ERRCODE = 'P0001';
  END IF;
  IF v_da_nhan IS NOT NULL THEN
    RAISE EXCEPTION 'Phiếu đã được xác nhận đã nhận hàng.' USING ERRCODE = 'P0001';
  END IF;

  SELECT ho_va_ten INTO v_ten FROM public.fp_var_nhan_vien WHERE id = v_nv;
  v_ten := COALESCE(NULLIF(btrim(v_ten), ''), 'Người dùng');
  v_dong := '[' || to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY HH24:MI') || '] ' || v_ten || ': Đã nhận hàng';

  UPDATE public.fp_mh_phieu_kho
     SET id_nguoi_nhan  = v_nv,
         ten_nguoi_nhan = v_ten,
         tg_nhan        = now(),
         trao_doi       = concat_ws(E'\n', NULLIF(btrim(trao_doi), ''), v_dong)
   WHERE id = p_id;
END
$$;

CREATE OR REPLACE FUNCTION public.rpc_farm_pt_phieu_kho_xac_nhan_nhan(p_id bigint)
    RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nv      bigint := public.nhan_vien_hien_tai_id();
  v_ten     text;
  v_loai    text;
  v_tt      text;
  v_da_nhan bigint;
  v_dong    text;
BEGIN
  IF NOT public.fn_co_quyen_module('quan-ly-nha-so-che/phieu-kho-phan-thuoc', ARRAY['view','create','update','delete','approve','admin','all']) THEN
    RAISE EXCEPTION 'Bạn không có quyền truy cập phiếu kho.' USING ERRCODE = 'P0001';
  END IF;

  SELECT loai, trang_thai, id_nguoi_nhan INTO v_loai, v_tt, v_da_nhan
    FROM public.fp_farm_phieu_kho_phan_thuoc WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu kho.' USING ERRCODE = 'P0001';
  END IF;
  IF v_loai IS DISTINCT FROM 'chuyển' THEN
    RAISE EXCEPTION 'Chỉ phiếu luân chuyển mới xác nhận đã nhận hàng.' USING ERRCODE = 'P0001';
  END IF;
  IF v_tt IS DISTINCT FROM 'Chờ duyệt' THEN
    RAISE EXCEPTION 'Chỉ phiếu đang chờ duyệt mới xác nhận đã nhận hàng.' USING ERRCODE = 'P0001';
  END IF;
  IF v_da_nhan IS NOT NULL THEN
    RAISE EXCEPTION 'Phiếu đã được xác nhận đã nhận hàng.' USING ERRCODE = 'P0001';
  END IF;

  SELECT ho_va_ten INTO v_ten FROM public.fp_var_nhan_vien WHERE id = v_nv;
  v_ten := COALESCE(NULLIF(btrim(v_ten), ''), 'Người dùng');
  v_dong := '[' || to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY HH24:MI') || '] ' || v_ten || ': Đã nhận hàng';

  UPDATE public.fp_farm_phieu_kho_phan_thuoc
     SET id_nguoi_nhan  = v_nv,
         ten_nguoi_nhan = v_ten,
         tg_nhan        = now(),
         trao_doi       = concat_ws(E'\n', NULLIF(btrim(trao_doi), ''), v_dong)
   WHERE id = p_id;
END
$$;

CREATE OR REPLACE FUNCTION public.rpc_pt_phieu_kho_xac_nhan_nhan(p_id bigint)
    RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nv      bigint := public.nhan_vien_hien_tai_id();
  v_ten     text;
  v_loai    text;
  v_tt      text;
  v_da_nhan bigint;
  v_dong    text;
BEGIN
  IF NOT public.fn_co_quyen_module('phan-thuoc/phieu-kho-phan-thuoc', ARRAY['view','create','update','delete','approve','admin','all']) THEN
    RAISE EXCEPTION 'Bạn không có quyền truy cập phiếu kho.' USING ERRCODE = 'P0001';
  END IF;

  SELECT loai, trang_thai, id_nguoi_nhan INTO v_loai, v_tt, v_da_nhan
    FROM public.fp_pt_phieu_kho WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu kho.' USING ERRCODE = 'P0001';
  END IF;
  IF v_loai IS DISTINCT FROM 'chuyển' THEN
    RAISE EXCEPTION 'Chỉ phiếu luân chuyển mới xác nhận đã nhận hàng.' USING ERRCODE = 'P0001';
  END IF;
  IF v_tt IS DISTINCT FROM 'Chờ duyệt' THEN
    RAISE EXCEPTION 'Chỉ phiếu đang chờ duyệt mới xác nhận đã nhận hàng.' USING ERRCODE = 'P0001';
  END IF;
  IF v_da_nhan IS NOT NULL THEN
    RAISE EXCEPTION 'Phiếu đã được xác nhận đã nhận hàng.' USING ERRCODE = 'P0001';
  END IF;

  SELECT ho_va_ten INTO v_ten FROM public.fp_var_nhan_vien WHERE id = v_nv;
  v_ten := COALESCE(NULLIF(btrim(v_ten), ''), 'Người dùng');
  v_dong := '[' || to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY HH24:MI') || '] ' || v_ten || ': Đã nhận hàng';

  UPDATE public.fp_pt_phieu_kho
     SET id_nguoi_nhan  = v_nv,
         ten_nguoi_nhan = v_ten,
         tg_nhan        = now(),
         trao_doi       = concat_ws(E'\n', NULLIF(btrim(trao_doi), ''), v_dong)
   WHERE id = p_id;
END
$$;

-- --- 4. RPC ghi trao đổi (khoá lạc quan) --------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_mh_phieu_kho_sua_trao_doi(
  p_id bigint, p_trao_doi text, p_trao_doi_cu text
) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_hien_tai text;
  v_moi text := NULLIF(btrim(p_trao_doi), '');
BEGIN
  IF NOT public.fn_co_quyen_module('kho-van/phieu-kho', ARRAY['view','create','update','delete','approve','admin','all']) THEN
    RAISE EXCEPTION 'Bạn không có quyền truy cập phiếu kho.' USING ERRCODE = 'P0001';
  END IF;

  SELECT trao_doi INTO v_hien_tai
    FROM public.fp_mh_phieu_kho WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu kho (có thể phiếu vừa được sửa).' USING ERRCODE = 'P0001';
  END IF;
  IF NULLIF(btrim(v_hien_tai), '') IS DISTINCT FROM NULLIF(btrim(p_trao_doi_cu), '') THEN
    RAISE EXCEPTION 'Trao đổi vừa có người cập nhật — mở lại để xem bản mới rồi ghi tiếp.' USING ERRCODE = 'P0001';
  END IF;

  -- Người thường chỉ được GHI THÊM (giữ nguyên log cũ: dòng duyệt, "Đã nhận hàng", tin người khác);
  -- quản trị module / cấp bậc 1 mới được sửa/xoá tin cũ.
  IF NULLIF(btrim(v_hien_tai, E' \t\r\n'), '') IS NOT NULL
     AND NOT public.fn_co_quyen_module('kho-van/phieu-kho', ARRAY['admin', 'all'])
     AND left(btrim(COALESCE(v_moi, ''), E' \t\r\n'), length(btrim(v_hien_tai, E' \t\r\n')))
         IS DISTINCT FROM btrim(v_hien_tai, E' \t\r\n') THEN
    RAISE EXCEPTION 'Chỉ được ghi thêm tin mới, không sửa/xoá tin cũ (cần quyền quản trị).' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.fp_mh_phieu_kho SET trao_doi = v_moi WHERE id = p_id;
  RETURN v_moi;
END
$$;

CREATE OR REPLACE FUNCTION public.rpc_farm_pt_phieu_kho_sua_trao_doi(
  p_id bigint, p_trao_doi text, p_trao_doi_cu text
) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_hien_tai text;
  v_moi text := NULLIF(btrim(p_trao_doi), '');
BEGIN
  IF NOT public.fn_co_quyen_module('quan-ly-nha-so-che/phieu-kho-phan-thuoc', ARRAY['view','create','update','delete','approve','admin','all']) THEN
    RAISE EXCEPTION 'Bạn không có quyền truy cập phiếu kho.' USING ERRCODE = 'P0001';
  END IF;

  SELECT trao_doi INTO v_hien_tai
    FROM public.fp_farm_phieu_kho_phan_thuoc WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu kho (có thể phiếu vừa được sửa).' USING ERRCODE = 'P0001';
  END IF;
  IF NULLIF(btrim(v_hien_tai), '') IS DISTINCT FROM NULLIF(btrim(p_trao_doi_cu), '') THEN
    RAISE EXCEPTION 'Trao đổi vừa có người cập nhật — mở lại để xem bản mới rồi ghi tiếp.' USING ERRCODE = 'P0001';
  END IF;

  -- Người thường chỉ được GHI THÊM (giữ nguyên log cũ: dòng duyệt, "Đã nhận hàng", tin người khác);
  -- quản trị module / cấp bậc 1 mới được sửa/xoá tin cũ.
  IF NULLIF(btrim(v_hien_tai, E' \t\r\n'), '') IS NOT NULL
     AND NOT public.fn_co_quyen_module('quan-ly-nha-so-che/phieu-kho-phan-thuoc', ARRAY['admin', 'all'])
     AND left(btrim(COALESCE(v_moi, ''), E' \t\r\n'), length(btrim(v_hien_tai, E' \t\r\n')))
         IS DISTINCT FROM btrim(v_hien_tai, E' \t\r\n') THEN
    RAISE EXCEPTION 'Chỉ được ghi thêm tin mới, không sửa/xoá tin cũ (cần quyền quản trị).' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.fp_farm_phieu_kho_phan_thuoc SET trao_doi = v_moi WHERE id = p_id;
  RETURN v_moi;
END
$$;

CREATE OR REPLACE FUNCTION public.rpc_pt_phieu_kho_sua_trao_doi(
  p_id bigint, p_trao_doi text, p_trao_doi_cu text
) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_hien_tai text;
  v_moi text := NULLIF(btrim(p_trao_doi), '');
BEGIN
  IF NOT public.fn_co_quyen_module('phan-thuoc/phieu-kho-phan-thuoc', ARRAY['view','create','update','delete','approve','admin','all']) THEN
    RAISE EXCEPTION 'Bạn không có quyền truy cập phiếu kho.' USING ERRCODE = 'P0001';
  END IF;

  SELECT trao_doi INTO v_hien_tai
    FROM public.fp_pt_phieu_kho WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu kho (có thể phiếu vừa được sửa).' USING ERRCODE = 'P0001';
  END IF;
  IF NULLIF(btrim(v_hien_tai), '') IS DISTINCT FROM NULLIF(btrim(p_trao_doi_cu), '') THEN
    RAISE EXCEPTION 'Trao đổi vừa có người cập nhật — mở lại để xem bản mới rồi ghi tiếp.' USING ERRCODE = 'P0001';
  END IF;

  -- Người thường chỉ được GHI THÊM (giữ nguyên log cũ: dòng duyệt, "Đã nhận hàng", tin người khác);
  -- quản trị module / cấp bậc 1 mới được sửa/xoá tin cũ.
  IF NULLIF(btrim(v_hien_tai, E' \t\r\n'), '') IS NOT NULL
     AND NOT public.fn_co_quyen_module('phan-thuoc/phieu-kho-phan-thuoc', ARRAY['admin', 'all'])
     AND left(btrim(COALESCE(v_moi, ''), E' \t\r\n'), length(btrim(v_hien_tai, E' \t\r\n')))
         IS DISTINCT FROM btrim(v_hien_tai, E' \t\r\n') THEN
    RAISE EXCEPTION 'Chỉ được ghi thêm tin mới, không sửa/xoá tin cũ (cần quyền quản trị).' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.fp_pt_phieu_kho SET trao_doi = v_moi WHERE id = p_id;
  RETURN v_moi;
END
$$;

-- --- 5. Quyền ----------------------------------------------------------------

REVOKE ALL ON FUNCTION public.rpc_mh_phieu_kho_xac_nhan_nhan(bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_farm_pt_phieu_kho_xac_nhan_nhan(bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_pt_phieu_kho_xac_nhan_nhan(bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_mh_phieu_kho_sua_trao_doi(bigint, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_farm_pt_phieu_kho_sua_trao_doi(bigint, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_pt_phieu_kho_sua_trao_doi(bigint, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.rpc_mh_phieu_kho_xac_nhan_nhan(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_farm_pt_phieu_kho_xac_nhan_nhan(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_pt_phieu_kho_xac_nhan_nhan(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_mh_phieu_kho_sua_trao_doi(bigint, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_farm_pt_phieu_kho_sua_trao_doi(bigint, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_pt_phieu_kho_sua_trao_doi(bigint, text, text) TO authenticated;

COMMIT;

-- PostgREST nạp lại schema cache để thấy cột + RPC mới.
NOTIFY pgrst, 'reload schema';
