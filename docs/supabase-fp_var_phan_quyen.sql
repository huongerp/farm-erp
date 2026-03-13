-- =============================================================================
-- Phân quyền theo chức vụ (Role/Permission matrix) – Hệ thống
-- Chạy trong Supabase Dashboard → SQL Editor
-- Lưu quyền theo từng chức vụ (fp_var_chuc_vu) và module (vd: hanh-chinh/cong-viec).
-- Mỗi dòng: 1 chức vụ + 1 module + danh sách hành động (view, create, update, delete, admin, all).
-- Liên kết: chuc_vu_id → fp_var_chuc_vu(id).
-- =============================================================================

DROP TABLE IF EXISTS public.fp_var_phan_quyen;

CREATE TABLE public.fp_var_phan_quyen (
  id           bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  chuc_vu_id   bigint NOT NULL,
  module_id    text NOT NULL,
  actions      text[] NOT NULL DEFAULT '{}',
  tg_cap_nhat  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_fp_var_phan_quyen_chuc_vu
    FOREIGN KEY (chuc_vu_id) REFERENCES public.fp_var_chuc_vu(id) ON DELETE CASCADE,
  CONSTRAINT uq_fp_var_phan_quyen_chuc_vu_module
    UNIQUE (chuc_vu_id, module_id),
  CONSTRAINT chk_fp_var_phan_quyen_actions
    CHECK (actions <@ ARRAY['view', 'create', 'update', 'delete', 'admin', 'all']::text[])
);

COMMENT ON TABLE public.fp_var_phan_quyen IS 'Phân quyền theo chức vụ: mỗi dòng = 1 chức vụ + 1 module + danh sách hành động (view, create, update, delete, admin, all)';
COMMENT ON COLUMN public.fp_var_phan_quyen.chuc_vu_id IS 'Chức vụ được gán quyền → fp_var_chuc_vu(id)';
COMMENT ON COLUMN public.fp_var_phan_quyen.module_id IS 'Mã module (vd: hanh-chinh/cong-viec, he-thong/phan-quyen)';
COMMENT ON COLUMN public.fp_var_phan_quyen.actions IS 'Danh sách quyền: view, create, update, delete, admin, all';
COMMENT ON COLUMN public.fp_var_phan_quyen.tg_cap_nhat IS 'Thời điểm cập nhật lần cuối';

CREATE INDEX idx_fp_var_phan_quyen_chuc_vu_id ON public.fp_var_phan_quyen(chuc_vu_id);
CREATE INDEX idx_fp_var_phan_quyen_module_id ON public.fp_var_phan_quyen(module_id);

-- Trigger: cập nhật tg_cap_nhat khi UPDATE
CREATE OR REPLACE FUNCTION fp_var_phan_quyen_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_var_phan_quyen_tg_cap_nhat
  BEFORE UPDATE ON public.fp_var_phan_quyen
  FOR EACH ROW EXECUTE PROCEDURE fp_var_phan_quyen_tg_cap_nhat();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE public.fp_var_phan_quyen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_var_phan_quyen" ON public.fp_var_phan_quyen
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert fp_var_phan_quyen" ON public.fp_var_phan_quyen
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update fp_var_phan_quyen" ON public.fp_var_phan_quyen
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete fp_var_phan_quyen" ON public.fp_var_phan_quyen
  FOR DELETE TO authenticated USING (true);
