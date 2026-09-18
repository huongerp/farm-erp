-- =============================================================================
-- Thông báo của từng người nhận
--
-- Mỗi dòng = một thông báo gửi tới MỘT nhân viên. Worker services/notify fan-out
-- từ một sự kiện outbox thành n dòng ở đây.
--
-- Thứ tự chạy: SAU supabase-fp_var_su_kien_thong_bao.sql.
-- Phụ thuộc: public.nhan_vien_hien_tai_id() (docs/vps-05-quyen-doi-mat-khau.sql)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fp_var_thong_bao (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nguoi_nhan_id bigint      NOT NULL REFERENCES public.fp_var_nhan_vien(id) ON DELETE CASCADE,
  module_id     text        NOT NULL,
  loai_su_kien  text        NOT NULL,
  muc           text        NOT NULL DEFAULT 'thuong',
  tieu_de       text        NOT NULL,
  noi_dung      text,
  link          text,
  bang          text,
  ban_ghi_id    bigint,
  su_kien_id    bigint      REFERENCES public.fp_var_su_kien_thong_bao(id) ON DELETE SET NULL,
  du_lieu       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  da_doc        boolean     NOT NULL DEFAULT false,
  da_xoa        boolean     NOT NULL DEFAULT false,
  so_lan        integer     NOT NULL DEFAULT 1,
  tg_tao        timestamptz NOT NULL DEFAULT now(),
  tg_cap_nhat   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_fp_var_thong_bao_muc CHECK (muc IN ('cao', 'thuong'))
);

COMMENT ON TABLE public.fp_var_thong_bao IS
  'Thông báo trong app của từng nhân viên. Xoá là xoá mềm (da_xoa) để giữ vết đối chiếu.';
COMMENT ON COLUMN public.fp_var_thong_bao.module_id IS 'Mã module dạng ''kho-van/phieu-kho'' — dùng cho chip lọc theo module và kiểm tra quyền xem';
COMMENT ON COLUMN public.fp_var_thong_bao.loai_su_kien IS 'Mã loại sự kiện, ví dụ ''phieu.cho_duyet'', ''cong_viec.duoc_giao'' — quyết định icon và cài đặt bật/tắt';
COMMENT ON COLUMN public.fp_var_thong_bao.muc IS 'cao = rung push ngay; thuong = vào chuông, push theo cài đặt';
COMMENT ON COLUMN public.fp_var_thong_bao.link IS 'Đường dẫn trong app để điều hướng khi bấm vào thông báo';
COMMENT ON COLUMN public.fp_var_thong_bao.so_lan IS
  'Số lần sự kiện cùng loại lặp lại trên cùng bản ghi trong cửa sổ gộp. >1 nghĩa là đã gộp, không tạo dòng mới.';
COMMENT ON COLUMN public.fp_var_thong_bao.du_lieu IS 'Dữ liệu phụ để render (số phiếu, tên người thao tác, lý do từ chối…)';

-- Truy vấn nóng nhất: danh sách thông báo của tôi, mới nhất trước, bỏ dòng đã xoá.
CREATE INDEX IF NOT EXISTS idx_fp_var_thong_bao_nguoi_nhan
  ON public.fp_var_thong_bao (nguoi_nhan_id, tg_tao DESC)
  WHERE da_xoa = false;

-- Badge đếm chưa đọc — query chạy mỗi 60 giây nên phải rẻ.
CREATE INDEX IF NOT EXISTS idx_fp_var_thong_bao_chua_doc
  ON public.fp_var_thong_bao (nguoi_nhan_id)
  WHERE da_doc = false AND da_xoa = false;

-- Chip lọc theo module.
CREATE INDEX IF NOT EXISTS idx_fp_var_thong_bao_module
  ON public.fp_var_thong_bao (nguoi_nhan_id, module_id, tg_tao DESC)
  WHERE da_xoa = false;

-- Worker tra cứu để gộp trùng trong cửa sổ 60 giây.
CREATE INDEX IF NOT EXISTS idx_fp_var_thong_bao_gop
  ON public.fp_var_thong_bao (nguoi_nhan_id, bang, ban_ghi_id, loai_su_kien, tg_cap_nhat DESC);

CREATE OR REPLACE FUNCTION public.fp_var_thong_bao_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_var_thong_bao_tg_cap_nhat ON public.fp_var_thong_bao;
CREATE TRIGGER tr_fp_var_thong_bao_tg_cap_nhat
  BEFORE UPDATE ON public.fp_var_thong_bao
  FOR EACH ROW EXECUTE PROCEDURE public.fp_var_thong_bao_tg_cap_nhat();

-- =============================================================================
-- RLS — chặt hơn mặt bằng chung của repo
--
-- Các bảng nghiệp vụ khác dùng USING (true) cho mọi authenticated. Ở đây KHÔNG
-- được làm vậy: nội dung thông báo là riêng tư, người này không được đọc của
-- người kia. Không có policy INSERT/DELETE cho authenticated — chỉ worker ghi,
-- và xoá là xoá mềm qua UPDATE.
-- =============================================================================

ALTER TABLE public.fp_var_thong_bao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chỉ đọc thông báo của mình" ON public.fp_var_thong_bao;
CREATE POLICY "Chỉ đọc thông báo của mình" ON public.fp_var_thong_bao
  FOR SELECT TO authenticated
  USING (nguoi_nhan_id = public.nhan_vien_hien_tai_id());

DROP POLICY IF EXISTS "Chỉ sửa thông báo của mình" ON public.fp_var_thong_bao;
CREATE POLICY "Chỉ sửa thông báo của mình" ON public.fp_var_thong_bao
  FOR UPDATE TO authenticated
  USING (nguoi_nhan_id = public.nhan_vien_hien_tai_id())
  WITH CHECK (nguoi_nhan_id = public.nhan_vien_hien_tai_id());

-- Column-level grant: người dùng chỉ đổi được hai cờ này, không sửa được tiêu đề
-- hay link của chính thông báo mình nhận.
GRANT SELECT ON public.fp_var_thong_bao TO authenticated;
GRANT UPDATE (da_doc, da_xoa) ON public.fp_var_thong_bao TO authenticated;

-- Worker ghi thông báo cho NGƯỜI KHÁC nên không lọt qua được policy theo
-- nhan_vien_hien_tai_id() (nó kết nối bằng role riêng, không có JWT).
DROP POLICY IF EXISTS "Worker thông báo toàn quyền" ON public.fp_var_thong_bao;
CREATE POLICY "Worker thông báo toàn quyền" ON public.fp_var_thong_bao
  FOR ALL TO notify_service USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.fp_var_thong_bao TO notify_service;
GRANT USAGE, SELECT ON SEQUENCE public.fp_var_thong_bao_id_seq TO notify_service;

-- =============================================================================
-- RPC hàng loạt: "Đọc tất cả" và "Xoá tất cả"
--
-- Làm qua RPC thay vì PATCH trần để hai nút này luôn tôn trọng đúng bộ lọc module
-- đang áp trên giao diện, và để trả về số dòng đã tác động cho hộp xác nhận.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rpc_thong_bao_doc_tat_ca(p_module_id text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_toi     bigint := public.nhan_vien_hien_tai_id();
  v_so_dong integer;
BEGIN
  IF v_toi IS NULL THEN
    RAISE EXCEPTION 'Không xác định được nhân viên của phiên hiện tại';
  END IF;

  UPDATE public.fp_var_thong_bao
     SET da_doc = true
   WHERE nguoi_nhan_id = v_toi
     AND da_doc = false
     AND da_xoa = false
     AND (p_module_id IS NULL OR module_id = p_module_id);

  GET DIAGNOSTICS v_so_dong = ROW_COUNT;
  RETURN v_so_dong;
END;
$$;

COMMENT ON FUNCTION public.rpc_thong_bao_doc_tat_ca(text) IS
  'Đánh dấu đã đọc mọi thông báo chưa đọc của phiên hiện tại. p_module_id NULL = tất cả module.';

CREATE OR REPLACE FUNCTION public.rpc_thong_bao_xoa_tat_ca(p_module_id text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_toi     bigint := public.nhan_vien_hien_tai_id();
  v_so_dong integer;
BEGIN
  IF v_toi IS NULL THEN
    RAISE EXCEPTION 'Không xác định được nhân viên của phiên hiện tại';
  END IF;

  UPDATE public.fp_var_thong_bao
     SET da_xoa = true
   WHERE nguoi_nhan_id = v_toi
     AND da_xoa = false
     AND (p_module_id IS NULL OR module_id = p_module_id);

  GET DIAGNOSTICS v_so_dong = ROW_COUNT;
  RETURN v_so_dong;
END;
$$;

COMMENT ON FUNCTION public.rpc_thong_bao_xoa_tat_ca(text) IS
  'Xoá mềm mọi thông báo của phiên hiện tại. p_module_id NULL = tất cả module. Dữ liệu vẫn còn trong bảng để đối chiếu.';

GRANT EXECUTE ON FUNCTION public.rpc_thong_bao_doc_tat_ca(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_thong_bao_xoa_tat_ca(text) TO authenticated;

-- =============================================================================
-- Dọn rác: thông báo đã xoá mềm hoặc đã đọc quá lâu.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rpc_don_thong_bao_cu(p_so_ngay integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_so_dong integer;
BEGIN
  DELETE FROM public.fp_var_thong_bao
   WHERE tg_tao < now() - make_interval(days => p_so_ngay)
     AND (da_xoa = true OR da_doc = true);
  GET DIAGNOSTICS v_so_dong = ROW_COUNT;
  RETURN v_so_dong;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_don_thong_bao_cu(integer) TO notify_service;
