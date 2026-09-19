-- =============================================================================
-- Đợt kiểm kê kho phân thuốc (Quản lý nhà sơ chế)
-- Bản song sinh của fp_mh_dot_kiem_ke_kho, nhưng kiểm kê tồn PHÂN THUỐC:
--   tồn sổ lấy từ v_farm_ton_kho_phan_thuoc,
--   điều chỉnh lệch sinh phiếu fp_farm_phieu_kho_phan_thuoc (file …_dieu_chinh_ton.sql).
--
-- Liên kết:
--   id_nguoi_phu_trach, id_nguoi_tao, id_nguoi_kiem → fp_var_nhan_vien(id)
--   id_kho                                          → fp_mh_danh_sach_kho(id)  (kho DÙNG CHUNG với Mua hàng)
--   id_hang_hoa                                     → fp_farm_danh_sach_hang_hoa(id)
--
-- Trạng thái đợt: draft | dang_kiem_ke | hoan_thanh (text, không CHECK — theo tiền lệ bản mua hàng).
-- Kết quả chi tiết: chua_kiem | khop | thieu | thua (text).
--
-- Hậu tố tên bảng `_pt` (không phải `_phan_thuoc`) để nhất quán với các object
-- farm đang chạy (fp_farm_phieu_kho_pt_so_seq_*, get_next_so_phieu_farm_pt…) và
-- để tên constraint Postgres tự sinh không vượt 63 ký tự rồi bị cắt.
--
-- Chạy sau: docs/supabase-fp_farm_phieu_kho_phan_thuoc.sql,
--           docs/supabase-fp_farm_danh_sach_hang_hoa.sql,
--           docs/supabase-v_farm_ton_kho_phan_thuoc.sql
-- KHÔNG DROP TABLE — file phải chạy lại được an toàn trên VPS.
-- =============================================================================

-- Bảng cha: đợt kiểm kê
CREATE TABLE IF NOT EXISTS public.fp_farm_dot_kiem_ke_pt (
  id                     bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma_dot                 text NOT NULL,
  ten_dot                text NOT NULL,
  ngay_bat_dau           date NOT NULL,
  ngay_ket_thuc          date NOT NULL,
  trang_thai             text NOT NULL DEFAULT 'draft',
  id_nguoi_phu_trach     bigint NOT NULL,
  id_nguoi_tao           bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL,
  ghi_chu                text,
  tg_tao                 timestamptz DEFAULT now(),
  tg_cap_nhat            timestamptz DEFAULT now()
);

COMMENT ON TABLE public.fp_farm_dot_kiem_ke_pt IS 'Đợt kiểm kê kho phân thuốc – mã đợt, tên, ngày, trạng thái, người phụ trách';
COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt.ma_dot IS 'Mã đợt (unique), tự sinh qua RPC get_next_ma_dot_farm_kiem_ke_pt → KKPT-YYYY-NNNN';
COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt.trang_thai IS 'draft | dang_kiem_ke | hoan_thanh';
COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt.id_nguoi_phu_trach IS 'Người phụ trách (bắt buộc) → fp_var_nhan_vien(id)';
COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt.id_nguoi_tao IS 'Người tạo đợt → fp_var_nhan_vien(id)';

-- Bảng nối: phạm vi kho của đợt (một đợt nhiều kho)
CREATE TABLE IF NOT EXISTS public.fp_farm_dot_kiem_ke_pt_kho (
  id_dot_kiem_ke_pt      bigint NOT NULL REFERENCES public.fp_farm_dot_kiem_ke_pt(id) ON DELETE CASCADE,
  id_kho                 bigint NOT NULL,
  PRIMARY KEY (id_dot_kiem_ke_pt, id_kho)
);

COMMENT ON TABLE public.fp_farm_dot_kiem_ke_pt_kho IS 'Phạm vi kho cần kiểm trong đợt; id_kho → fp_mh_danh_sach_kho(id)';

-- Bảng chi tiết: mỗi dòng = (đợt, kho, hàng hóa)
CREATE TABLE IF NOT EXISTS public.fp_farm_dot_kiem_ke_pt_chi_tiet (
  id                     bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_dot_kiem_ke_pt      bigint NOT NULL REFERENCES public.fp_farm_dot_kiem_ke_pt(id) ON DELETE CASCADE,
  id_kho                 bigint NOT NULL,
  id_hang_hoa            bigint NOT NULL,
  so_luong_so            numeric(18,4) NOT NULL DEFAULT 0,
  so_luong_thuc_te       numeric(18,4),
  ket_qua                text NOT NULL DEFAULT 'chua_kiem',
  ghi_chu_dong           text,
  id_nguoi_kiem          bigint,
  ngay_kiem              timestamptz,
  -- Liên kết phiếu điều chỉnh: tên constraint ĐẶT TAY cho ngắn, để migration sau
  -- còn DROP CONSTRAINT IF EXISTS đúng tên (tên tự sinh sẽ vượt 63 ký tự và bị cắt).
  id_phieu_kho_dieu_chinh bigint
      CONSTRAINT fp_farm_dot_kk_pt_ct_phieu_fkey
      REFERENCES public.fp_farm_phieu_kho_phan_thuoc(id) ON DELETE SET NULL,
  so_luong_dieu_chinh    numeric(18,4),
  tg_dieu_chinh_ton      timestamptz,
  tg_tao                 timestamptz DEFAULT now(),
  tg_cap_nhat            timestamptz DEFAULT now(),
  UNIQUE (id_dot_kiem_ke_pt, id_kho, id_hang_hoa)
);

COMMENT ON TABLE public.fp_farm_dot_kiem_ke_pt_chi_tiet IS 'Chi tiết kiểm kê phân thuốc: mỗi dòng = (đợt, kho, hàng hóa) với SL sổ, SL thực tế, kết quả';
COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt_chi_tiet.id_hang_hoa IS 'Hàng hóa → fp_farm_danh_sach_hang_hoa(id)';
COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt_chi_tiet.so_luong_so IS 'Số lượng sổ — snapshot v_farm_ton_kho_phan_thuoc lúc tạo danh sách';
COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt_chi_tiet.ket_qua IS 'chua_kiem | khop | thieu | thua';
COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt_chi_tiet.id_phieu_kho_dieu_chinh IS 'Phiếu kho phân thuốc sinh ra khi điều chỉnh tồn về thực tế';

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_fp_farm_dot_kk_pt_ma_dot ON public.fp_farm_dot_kiem_ke_pt(ma_dot);
CREATE INDEX IF NOT EXISTS idx_fp_farm_dot_kk_pt_ngay_bat_dau ON public.fp_farm_dot_kiem_ke_pt(ngay_bat_dau);
CREATE INDEX IF NOT EXISTS idx_fp_farm_dot_kk_pt_ngay_ket_thuc ON public.fp_farm_dot_kiem_ke_pt(ngay_ket_thuc);
CREATE INDEX IF NOT EXISTS idx_fp_farm_dot_kk_pt_trang_thai ON public.fp_farm_dot_kiem_ke_pt(trang_thai);
CREATE INDEX IF NOT EXISTS idx_fp_farm_dot_kk_pt_nguoi_phu_trach ON public.fp_farm_dot_kiem_ke_pt(id_nguoi_phu_trach);
CREATE INDEX IF NOT EXISTS idx_fp_farm_dot_kk_pt_nguoi_tao ON public.fp_farm_dot_kiem_ke_pt(id_nguoi_tao);
CREATE INDEX IF NOT EXISTS idx_fp_farm_dot_kk_pt_kho_id_dot ON public.fp_farm_dot_kiem_ke_pt_kho(id_dot_kiem_ke_pt);
CREATE INDEX IF NOT EXISTS idx_fp_farm_dot_kk_pt_kho_id_kho ON public.fp_farm_dot_kiem_ke_pt_kho(id_kho);
CREATE INDEX IF NOT EXISTS idx_fp_farm_dot_kk_pt_ct_id_dot ON public.fp_farm_dot_kiem_ke_pt_chi_tiet(id_dot_kiem_ke_pt);
CREATE INDEX IF NOT EXISTS idx_fp_farm_dot_kk_pt_ct_id_kho ON public.fp_farm_dot_kiem_ke_pt_chi_tiet(id_kho);
CREATE INDEX IF NOT EXISTS idx_fp_farm_dot_kk_pt_ct_id_hang_hoa ON public.fp_farm_dot_kiem_ke_pt_chi_tiet(id_hang_hoa);
CREATE INDEX IF NOT EXISTS idx_fp_farm_dot_kk_pt_ct_phieu
  ON public.fp_farm_dot_kiem_ke_pt_chi_tiet(id_phieu_kho_dieu_chinh)
  WHERE id_phieu_kho_dieu_chinh IS NOT NULL;

-- Trigger tg_cap_nhat
CREATE OR REPLACE FUNCTION public.fp_farm_dot_kiem_ke_pt_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_farm_dot_kk_pt_tg_cap_nhat ON public.fp_farm_dot_kiem_ke_pt;
CREATE TRIGGER tr_fp_farm_dot_kk_pt_tg_cap_nhat
  BEFORE UPDATE ON public.fp_farm_dot_kiem_ke_pt
  FOR EACH ROW EXECUTE FUNCTION public.fp_farm_dot_kiem_ke_pt_tg_cap_nhat();

DROP TRIGGER IF EXISTS tr_fp_farm_dot_kk_pt_ct_tg_cap_nhat ON public.fp_farm_dot_kiem_ke_pt_chi_tiet;
CREATE TRIGGER tr_fp_farm_dot_kk_pt_ct_tg_cap_nhat
  BEFORE UPDATE ON public.fp_farm_dot_kiem_ke_pt_chi_tiet
  FOR EACH ROW EXECUTE FUNCTION public.fp_farm_dot_kiem_ke_pt_tg_cap_nhat();

-- RLS: cùng mức với fp_farm_phieu_kho_phan_thuoc — phân quyền thật nằm ở tầng app
-- (fp_var_phan_quyen + ModulePermissionGuard, module_id 'quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc').
ALTER TABLE public.fp_farm_dot_kiem_ke_pt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fp_farm_dot_kiem_ke_pt_kho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fp_farm_dot_kiem_ke_pt_chi_tiet ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
  p text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'fp_farm_dot_kiem_ke_pt',
    'fp_farm_dot_kiem_ke_pt_kho',
    'fp_farm_dot_kiem_ke_pt_chi_tiet'
  ] LOOP
    FOREACH p IN ARRAY ARRAY['select', 'insert', 'update', 'delete'] LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_' || p, t);
    END LOOP;
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', t || '_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t || '_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t || '_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (true)', t || '_delete', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

GRANT USAGE, SELECT ON SEQUENCE public.fp_farm_dot_kiem_ke_pt_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.fp_farm_dot_kiem_ke_pt_chi_tiet_id_seq TO authenticated;

-- Mã đợt tự sinh: app format thành KKPT-YYYY-NNNN
CREATE SEQUENCE IF NOT EXISTS public.fp_farm_dot_kiem_ke_pt_ma_seq START 1;

CREATE OR REPLACE FUNCTION public.get_next_ma_dot_farm_kiem_ke_pt()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN nextval('fp_farm_dot_kiem_ke_pt_ma_seq');
END;
$$;

COMMENT ON FUNCTION public.get_next_ma_dot_farm_kiem_ke_pt() IS 'Số thứ tự mã đợt kiểm kê phân thuốc tiếp theo (app ghép thành KKPT-YYYY-NNNN)';

GRANT USAGE ON SEQUENCE public.fp_farm_dot_kiem_ke_pt_ma_seq TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_ma_dot_farm_kiem_ke_pt() TO authenticated;
