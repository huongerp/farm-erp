-- =============================================================================
-- Dọn quyền của module đã gỡ + cấp quyền cho module Thiết lập đề xuất mua hàng
--
-- Chạy SAU docs/vps-07-doi-module-id-quan-ly-nha-so-che.sql (file này dùng
-- module_id đã đổi tên: 'quan-ly-nha-so-che/...').
--
-- 1) fp_var_phan_quyen còn dòng của 2 module ĐÃ GỠ khỏi app — SubmenuPage chỉ
--    redirect 2 slug này về dashboard, không còn màn hình nào đọc chúng:
--      - kiem-ke-kho-phan-thuoc
--      - thuong-kpi
--    Giữ lại chỉ làm rác ma trận phân quyền.
--
-- 2) Module 'thiet-lap-de-xuat-mua-hang' chưa từng có dòng quyền nào (module
--    thêm sau lần lưu ma trận gần nhất), nên ngoài "cấp cao" (cap_bac = 1 hoặc
--    quyền admin/all) thì không ai thấy. Cấp theo đúng khuôn của module Thiết
--    lập đối xứng bên Mua hàng ('mua-hang/thiet-lap-de-xuat-vat-tu'): chỉ Tổng
--    Giám Đốc và Trưởng nhóm điều hành, toàn quyền.
--
-- Chạy lại nhiều lần được (idempotent).
-- =============================================================================

BEGIN;

-- 1) Dọn quyền của 2 module đã gỡ.
DELETE FROM public.fp_var_phan_quyen
WHERE module_id IN (
  'quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc',
  'quan-ly-nha-so-che/thuong-kpi'
);

-- 2) Cấp quyền Thiết lập đề xuất mua hàng — sao đúng ma trận của module Thiết
--    lập đề xuất vật tư (cùng loại màn danh mục cấu hình cho luồng đề xuất).
INSERT INTO public.fp_var_phan_quyen (chuc_vu_id, module_id, actions)
SELECT pq.chuc_vu_id, 'quan-ly-nha-so-che/thiet-lap-de-xuat-mua-hang', pq.actions
FROM public.fp_var_phan_quyen pq
WHERE pq.module_id = 'mua-hang/thiet-lap-de-xuat-vat-tu'
  AND pq.actions <> '{}'
ON CONFLICT (chuc_vu_id, module_id) DO UPDATE SET actions = EXCLUDED.actions;

COMMIT;

-- =============================================================================
-- Đối chiếu — 2 module đã gỡ phải bằng 0; Thiết lập ĐXMH phải khớp module mẫu.
-- =============================================================================
SELECT 'module da go con lai' AS kiem_tra,
       count(*)::text AS gia_tri
FROM public.fp_var_phan_quyen
WHERE module_id IN ('quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc', 'quan-ly-nha-so-che/thuong-kpi')
UNION ALL
SELECT 'thiet-lap-dxmh: so chuc vu duoc cap',
       count(*)::text
FROM public.fp_var_phan_quyen
WHERE module_id = 'quan-ly-nha-so-che/thiet-lap-de-xuat-mua-hang' AND actions <> '{}';

SELECT cv.ten_chuc_vu, pq.actions
FROM public.fp_var_phan_quyen pq
JOIN public.fp_var_chuc_vu cv ON cv.id = pq.chuc_vu_id
WHERE pq.module_id = 'quan-ly-nha-so-che/thiet-lap-de-xuat-mua-hang'
ORDER BY cv.id;
