-- 071 — Phiếu kho (Sơ chế + Phân thuốc): cột «Hạng mục» trên dòng hàng + báo cáo tiền xuất/luân chuyển theo hạng mục.
--
-- Hạng mục là chữ gõ tự do (như phẩm cấp), không bắt buộc, áp mọi loại phiếu. Cuối năm kế toán cộng
-- tiền xuất + tiền chuyển kho theo hạng mục để đối chiếu với kỹ thuật.
-- Làm cho CẢ HAI biến thể: fp_farm_* (Sơ chế) và fp_pt_* (Phân thuốc).
-- Chỉ thêm cột nullable + view/RPC — không đụng dữ liệu cũ. Chạy lại an toàn.

BEGIN;

-- 1. Cột hang_muc
ALTER TABLE public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ADD COLUMN IF NOT EXISTS hang_muc text;
ALTER TABLE public.fp_pt_phieu_kho_chi_tiet ADD COLUMN IF NOT EXISTS hang_muc text;

-- 2. View phẳng: giữ nguyên cột cũ, thêm hang_muc ở cuối (CREATE OR REPLACE chỉ cho nối cột).
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
    NULLIF(btrim(ct.hang_muc), ''::text) AS hang_muc
   FROM ((public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
     JOIN public.fp_farm_phieu_kho_phan_thuoc pk ON ((pk.id = ct.id_phieu_kho)))
     LEFT JOIN public.fp_farm_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)));

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
    NULLIF(btrim(ct.hang_muc), ''::text) AS hang_muc
   FROM ((public.fp_pt_phieu_kho_chi_tiet ct
     JOIN public.fp_pt_phieu_kho pk ON ((pk.id = ct.id_phieu_kho)))
     LEFT JOIN public.fp_pt_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)));

-- 3. Gợi ý hạng mục đã dùng (combobox + chip lọc).
CREATE OR REPLACE VIEW public.v_farm_pt_hang_muc_dang_dung WITH (security_invoker='true') AS
 SELECT DISTINCT btrim(ct.hang_muc) AS hang_muc
   FROM public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
  WHERE NULLIF(btrim(ct.hang_muc), ''::text) IS NOT NULL;

CREATE OR REPLACE VIEW public.v_pt_hang_muc_dang_dung WITH (security_invoker='true') AS
 SELECT DISTINCT btrim(ct.hang_muc) AS hang_muc
   FROM public.fp_pt_phieu_kho_chi_tiet ct
  WHERE NULLIF(btrim(ct.hang_muc), ''::text) IS NOT NULL;

REVOKE ALL ON TABLE public.v_farm_pt_hang_muc_dang_dung FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.v_pt_hang_muc_dang_dung FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.v_farm_pt_hang_muc_dang_dung TO authenticated;
GRANT SELECT ON TABLE public.v_pt_hang_muc_dang_dung TO authenticated;

-- 4. Tổng hợp tiền xuất / tiền luân chuyển theo hạng mục.
--    SECURITY INVOKER: RLS của bảng gốc vẫn áp như khi đọc view phẳng.
--    hang_muc NULL = dòng chưa phân hạng mục. p_kho_ids NULL = mọi kho người gọi được thấy.
CREATE OR REPLACE FUNCTION public.rpc_farm_pt_tong_hop_hang_muc(
  p_tu date,
  p_den date,
  p_kho_ids bigint[] DEFAULT NULL,
  p_trang_thai text[] DEFAULT ARRAY['Đã duyệt']
)
RETURNS TABLE (hang_muc text, tien_xuat numeric, tien_chuyen numeric, so_dong integer)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT NULLIF(btrim(ct.hang_muc), '') AS hang_muc,
         COALESCE(SUM(ct.thanh_tien) FILTER (WHERE pk.loai = 'xuất'), 0)   AS tien_xuat,
         COALESCE(SUM(ct.thanh_tien) FILTER (WHERE pk.loai = 'chuyển'), 0) AS tien_chuyen,
         COUNT(*)::integer AS so_dong
    FROM public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
    JOIN public.fp_farm_phieu_kho_phan_thuoc pk ON pk.id = ct.id_phieu_kho
   WHERE pk.loai IN ('xuất', 'chuyển')
     AND (p_tu IS NULL OR pk.ngay >= p_tu)
     AND (p_den IS NULL OR pk.ngay <= p_den)
     AND (p_kho_ids IS NULL OR pk.kho_id = ANY (p_kho_ids))
     AND (p_trang_thai IS NULL OR pk.trang_thai = ANY (p_trang_thai))
   GROUP BY 1;
$$;

CREATE OR REPLACE FUNCTION public.rpc_pt_tong_hop_hang_muc(
  p_tu date,
  p_den date,
  p_kho_ids bigint[] DEFAULT NULL,
  p_trang_thai text[] DEFAULT ARRAY['Đã duyệt']
)
RETURNS TABLE (hang_muc text, tien_xuat numeric, tien_chuyen numeric, so_dong integer)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT NULLIF(btrim(ct.hang_muc), '') AS hang_muc,
         COALESCE(SUM(ct.thanh_tien) FILTER (WHERE pk.loai = 'xuất'), 0)   AS tien_xuat,
         COALESCE(SUM(ct.thanh_tien) FILTER (WHERE pk.loai = 'chuyển'), 0) AS tien_chuyen,
         COUNT(*)::integer AS so_dong
    FROM public.fp_pt_phieu_kho_chi_tiet ct
    JOIN public.fp_pt_phieu_kho pk ON pk.id = ct.id_phieu_kho
   WHERE pk.loai IN ('xuất', 'chuyển')
     AND (p_tu IS NULL OR pk.ngay >= p_tu)
     AND (p_den IS NULL OR pk.ngay <= p_den)
     AND (p_kho_ids IS NULL OR pk.kho_id = ANY (p_kho_ids))
     AND (p_trang_thai IS NULL OR pk.trang_thai = ANY (p_trang_thai))
   GROUP BY 1;
$$;

REVOKE ALL ON FUNCTION public.rpc_farm_pt_tong_hop_hang_muc(date, date, bigint[], text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_pt_tong_hop_hang_muc(date, date, bigint[], text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_farm_pt_tong_hop_hang_muc(date, date, bigint[], text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_pt_tong_hop_hang_muc(date, date, bigint[], text[]) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
