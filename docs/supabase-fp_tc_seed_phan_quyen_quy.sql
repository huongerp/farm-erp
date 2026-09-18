-- =============================================================================
-- Cấp quyền cho 3 module Quỹ farm (Tài chính) theo đúng khuôn đang dùng ở các
-- module farm khác (tham chiếu: quan-ly-farm/de-xuat-mua-hang).
--
--   - Tổng Giám Đốc (tt = 1): all  → xem/sửa MỌI farm (quy ước "cấp cao" của app)
--   - Trưởng nhóm / Quản lý điều hành: view+create+update+delete trong phạm vi
--     chi nhánh được phân ở hồ sơ nhân viên
--   - Các chức vụ còn lại: chỉ view
--   - Thiết lập quỹ (danh mục hạng mục): chỉ cấp sửa cho nhóm quản lý
--
-- Idempotent: chạy lại sẽ ghi đè đúng bộ quyền này (ON CONFLICT DO UPDATE).
-- Muốn đổi cho từng chức vụ thì làm trên UI Hệ thống → Phân quyền, không sửa file.
-- Chạy sau: supabase-fp_tc_quy_thu_chi.sql
-- =============================================================================

-- 1) Quản trị toàn phần cho chức vụ đứng đầu (tt = 1)
INSERT INTO fp_var_phan_quyen (chuc_vu_id, module_id, actions)
SELECT cv.id, m.module_id, ARRAY['view','create','update','delete','admin','all']::text[]
FROM fp_var_chuc_vu cv
CROSS JOIN (VALUES
  ('tai-chinh/thu-chi-quy'),
  ('tai-chinh/thong-ke-quy'),
  ('tai-chinh/thiet-lap-quy')
) AS m(module_id)
WHERE cv.tt = 1
ON CONFLICT (chuc_vu_id, module_id) DO UPDATE SET actions = EXCLUDED.actions;

-- 2) Nhóm quản lý: thao tác đầy đủ trong phạm vi chi nhánh của mình
--    (lấy đúng các chức vụ đang có quyền sửa trên Đề xuất mua hàng farm)
INSERT INTO fp_var_phan_quyen (chuc_vu_id, module_id, actions)
SELECT pq.chuc_vu_id, m.module_id, ARRAY['view','create','update','delete']::text[]
FROM fp_var_phan_quyen pq
JOIN fp_var_chuc_vu cv ON cv.id = pq.chuc_vu_id AND cv.tt <> 1
CROSS JOIN (VALUES
  ('tai-chinh/thu-chi-quy'),
  ('tai-chinh/thong-ke-quy'),
  ('tai-chinh/thiet-lap-quy')
) AS m(module_id)
WHERE pq.module_id = 'quan-ly-farm/de-xuat-mua-hang'
  AND pq.actions @> ARRAY['update']::text[]
ON CONFLICT (chuc_vu_id, module_id) DO UPDATE SET actions = EXCLUDED.actions;

-- 3) Các chức vụ còn lại: chỉ xem.
--    Ma trận phân quyền thường đã có sẵn dòng RỖNG cho mọi (chức vụ × module) do
--    lần lưu trước trên UI, nên phải ghi đè đúng các dòng rỗng đó — dòng đã có
--    quyền (bước 1-2 hoặc do người dùng tự cấp) thì giữ nguyên.
INSERT INTO fp_var_phan_quyen (chuc_vu_id, module_id, actions)
SELECT cv.id, m.module_id, ARRAY['view']::text[]
FROM fp_var_chuc_vu cv
CROSS JOIN (VALUES
  ('tai-chinh/thu-chi-quy'),
  ('tai-chinh/thong-ke-quy'),
  ('tai-chinh/thiet-lap-quy')
) AS m(module_id)
ON CONFLICT (chuc_vu_id, module_id) DO UPDATE
  SET actions = EXCLUDED.actions
  WHERE fp_var_phan_quyen.actions IS NULL
     OR cardinality(fp_var_phan_quyen.actions) = 0;
