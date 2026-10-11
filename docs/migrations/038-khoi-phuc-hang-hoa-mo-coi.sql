-- =============================================================================
-- 038-khoi-phuc-hang-hoa-mo-coi.sql — Khôi phục danh mục hàng hoá Mua hàng cho các dòng mồ côi
--
-- Bối cảnh (xem 025): 06/10/2026 xoá ~198 hàng đang được chứng từ dùng (khi đó chưa có khoá ngoại)
-- → phiếu kho, đơn đặt hàng, đề xuất, định mức trỏ tới id không tồn tại. Tồn kho / thống kê hiện
-- "#1702" thay tên hàng, và các hàng này đứng đầu danh sách tồn (vd Xốp đóng thùng, Túi PPE, Thùng TQ3).
-- 025 thêm khoá ngoại NOT VALID nên không sinh thêm mồ côi, nhưng chưa sửa dữ liệu cũ.
--
-- Mồ côi lúc viết (11/10/2026): 214 id, chia hai nhóm:
--   1. 162 id có bản ghi đầy đủ trong nhật ký xoá fp_var_nhat_ky_thay_doi (thao_tac = 'xoa')
--      → chèn lại NGUYÊN dòng cũ (giữ id, mã, tên, danh mục, trạng thái). Đã soát: không trùng
--      ma_hang_hoa với hàng hiện có.
--   2. 52 id bị xoá trước khi có nhật ký (trước 04/10/2026), không bản sao lưu nào còn
--      → tạo dòng thay thế 'Ngừng hoạt động', mã XOA-<id>, tên/ĐVT lấy từ bản chụp trên chứng từ
--      nếu có. Không hiện ở ô chọn hàng (chỉ lấy hàng đang hoạt động), chỉ để chứng từ cũ có tên.
-- Sau đó VALIDATE sáu khoá ngoại của 025 — từ nay DB bảo đảm không còn mồ côi.
--
-- Chỉ THÊM dòng, không sửa / xoá chứng từ nào.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-038
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/038-khoi-phuc-hang-hoa-mo-coi.sql
-- =============================================================================

BEGIN;

CREATE TEMP TABLE _mo_coi ON COMMIT DROP AS
SELECT DISTINCT x.id
FROM (
    SELECT id_hang_hoa AS id FROM public.fp_mh_phieu_kho_chi_tiet
    UNION SELECT id_hang_hoa FROM public.fp_mh_don_dat_hang_chi_tiet
    UNION SELECT id_hang_hoa FROM public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet
    UNION SELECT id_hang_hoa FROM public.fp_mh_dot_kiem_ke_kho_chi_tiet
    UNION SELECT id_hang_hoa FROM public.fp_mh_phieu_kiem_ke_chi_tiet
    UNION SELECT hang_hoa_id FROM public.fp_mh_dinh_muc_ton_kho
) x
WHERE x.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.fp_mh_danh_sach_hang_hoa h WHERE h.id = x.id);

-- 1. Chèn lại nguyên dòng từ lần xoá gần nhất trong nhật ký.
INSERT INTO public.fp_mh_danh_sach_hang_hoa
SELECT (jsonb_populate_record(NULL::public.fp_mh_danh_sach_hang_hoa, nk.du_lieu_cu)).*
FROM (
    SELECT DISTINCT ON (ban_ghi_id) ban_ghi_id, du_lieu_cu
    FROM public.fp_var_nhat_ky_thay_doi
    WHERE bang = 'fp_mh_danh_sach_hang_hoa' AND thao_tac = 'xoa' AND du_lieu_cu IS NOT NULL
    ORDER BY ban_ghi_id, thoi_diem DESC
) nk
JOIN _mo_coi m ON m.id = nk.ban_ghi_id::bigint;

-- 2. Dòng thay thế cho id không còn nguồn: tên / ĐVT phổ biến nhất trên chứng từ.
WITH chup AS (
    SELECT id_hang_hoa AS id, NULLIF(trim(ten_hang_hoa), '') AS ten, NULLIF(trim(don_vi_tinh), '') AS dvt
    FROM public.fp_mh_phieu_kho_chi_tiet
    UNION ALL SELECT id_hang_hoa, NULL, NULLIF(trim(don_vi_tinh), '') FROM public.fp_mh_don_dat_hang_chi_tiet
    UNION ALL SELECT id_hang_hoa, NULL, NULLIF(trim(don_vi_tinh), '') FROM public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet
),
con_lai AS (
    SELECT m.id FROM _mo_coi m
    WHERE NOT EXISTS (SELECT 1 FROM public.fp_mh_danh_sach_hang_hoa h WHERE h.id = m.id)
)
INSERT INTO public.fp_mh_danh_sach_hang_hoa (id, ma_hang_hoa, ten_hang_hoa, dvt, trang_thai, mo_ta)
SELECT
    c.id,
    'XOA-' || c.id,
    coalesce(
        (SELECT ten FROM chup WHERE chup.id = c.id AND ten IS NOT NULL GROUP BY ten ORDER BY count(*) DESC, ten LIMIT 1),
        'Hàng đã xoá (không rõ tên) #' || c.id
    ),
    (SELECT dvt FROM chup WHERE chup.id = c.id AND dvt IS NOT NULL GROUP BY dvt ORDER BY count(*) DESC, dvt LIMIT 1),
    'Ngừng hoạt động',
    'Dòng thay thế (038): hàng bị xoá trước 04/10/2026 khi chứng từ còn dùng, không còn bản gốc.'
FROM con_lai c;

-- Không còn mồ côi → khoá ngoại 025 kiểm cả dữ liệu cũ.
ALTER TABLE public.fp_mh_phieu_kho_chi_tiet VALIDATE CONSTRAINT fp_mh_phieu_kho_chi_tiet_id_hang_hoa_fkey;
ALTER TABLE public.fp_mh_don_dat_hang_chi_tiet VALIDATE CONSTRAINT fp_mh_don_dat_hang_chi_tiet_id_hang_hoa_fkey;
ALTER TABLE public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet VALIDATE CONSTRAINT fp_mh_phieu_de_xuat_vat_tu_chi_tiet_id_hang_hoa_fkey;
ALTER TABLE public.fp_mh_dot_kiem_ke_kho_chi_tiet VALIDATE CONSTRAINT fp_mh_dot_kiem_ke_kho_chi_tiet_id_hang_hoa_fkey;
ALTER TABLE public.fp_mh_phieu_kiem_ke_chi_tiet VALIDATE CONSTRAINT fp_mh_phieu_kiem_ke_chi_tiet_id_hang_hoa_fkey;
ALTER TABLE public.fp_mh_dinh_muc_ton_kho VALIDATE CONSTRAINT fp_mh_dinh_muc_ton_kho_hang_hoa_id_fkey;

COMMIT;
