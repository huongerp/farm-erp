-- =============================================================================
-- Cấp quyền cho module Kiểm kê kho phân thuốc
-- (module_id: 'quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc')
--
-- Module thêm sau lần lưu ma trận phân quyền gần nhất nên chỉ có Tổng Giám Đốc
-- và Trưởng nhóm điều hành được cấp tay; 12 chức vụ còn lại đang là '{}' →
-- canView = false → ModulePermissionGuard chặn.
--
-- Cấp theo đúng ma trận của module Phiếu kho phân thuốc (cùng nhóm nghiệp vụ
-- Kho phân thuốc, cùng tập kho và hàng hóa) — khuôn giống
-- docs/vps-08-don-quyen-module-cu-va-seed-thiet-lap-dxmh.sql.
--
-- LƯU Ý: slug 'kiem-ke-kho-phan-thuoc' TỪNG thuộc một module cũ đã gỡ, và
-- vps-08 đã DELETE sạch quyền của nó. Đây là module mới dựng lại trên cùng
-- slug, nên phải seed lại từ đầu.
--
-- Không cấp 'approve': module không có nút Duyệt (không nằm trong
-- MODULES_WITH_APPROVE ở features/he-thong/phan-quyen/core/permission-modules-config.ts).
--
-- Chạy SAU docs/supabase-fp_farm_dot_kiem_ke_pt.sql. Chạy lại nhiều lần được.
-- =============================================================================

BEGIN;

INSERT INTO public.fp_var_phan_quyen (chuc_vu_id, module_id, actions)
SELECT pq.chuc_vu_id, 'quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc', pq.actions
FROM public.fp_var_phan_quyen pq
WHERE pq.module_id = 'quan-ly-nha-so-che/phieu-kho-phan-thuoc'
  AND pq.actions <> '{}'
ON CONFLICT (chuc_vu_id, module_id) DO UPDATE SET actions = EXCLUDED.actions;

COMMIT;

-- Sau khi chạy: quyền được cache 30 phút ở client (useCurrentRoleContext) →
-- người đang mở app phải F5.
