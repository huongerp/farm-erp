-- =============================================================================
-- Thêm quyền 'approve' (Phê duyệt) vào bảng fp_var_phan_quyen
-- Chạy trong Supabase Dashboard → SQL Editor sau khi đã có bảng fp_var_phan_quyen
-- =============================================================================

-- Drop constraint cũ và thêm constraint mới cho phép thêm giá trị 'approve' trong actions
ALTER TABLE public.fp_var_phan_quyen
  DROP CONSTRAINT IF EXISTS chk_fp_var_phan_quyen_actions;

ALTER TABLE public.fp_var_phan_quyen
  ADD CONSTRAINT chk_fp_var_phan_quyen_actions
  CHECK (actions <@ ARRAY['view', 'create', 'update', 'delete', 'admin', 'all', 'approve']::text[]);

COMMENT ON COLUMN public.fp_var_phan_quyen.actions IS 'Danh sách quyền: view, create, update, delete, admin, all, approve (approve chỉ dùng cho module có chức năng phê duyệt)';
