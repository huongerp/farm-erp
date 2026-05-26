-- =============================================================================
-- Chi phí tài sản (Asset costs) – Hành chính / Tài sản
-- Chạy trong Supabase Dashboard → SQL Editor
-- Gồm: (1) Trạng thái phiếu chi phí tài sản (thiết lập), (2) Phiếu chi phí tài sản.
-- Phiếu có id_trang_thai + ten_trang_thai tham chiếu bảng thiết lập trạng thái.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Trạng thái phiếu chi phí tài sản (thiết lập – Chờ duyệt, Đã duyệt, Không duyệt)
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS public.fp_ts_chi_phi_tai_san;
DROP TABLE IF EXISTS public.fp_ts_trang_thai_chi_phi_tai_san;

CREATE TABLE public.fp_ts_trang_thai_chi_phi_tai_san (
  id           bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma           text NOT NULL,
  ten          text NOT NULL,
  thu_tu       integer NOT NULL DEFAULT 0,
  ghi_chu      text,
  trang_thai   text NOT NULL DEFAULT 'Đang hoạt động',
  tg_tao       timestamptz DEFAULT now(),
  tg_cap_nhat  timestamptz DEFAULT now()
);

COMMENT ON TABLE public.fp_ts_trang_thai_chi_phi_tai_san IS 'Danh mục trạng thái phiếu chi phí tài sản – Thiết lập (Chờ duyệt, Đã duyệt, Không duyệt). Dùng cho bảng fp_ts_chi_phi_tai_san.id_trang_thai.';
COMMENT ON COLUMN public.fp_ts_trang_thai_chi_phi_tai_san.ma IS 'Mã trạng thái (CHO_DUYET, DA_DUYET, KHONG_DUYET)';
COMMENT ON COLUMN public.fp_ts_trang_thai_chi_phi_tai_san.ten IS 'Tên hiển thị trạng thái phiếu';
COMMENT ON COLUMN public.fp_ts_trang_thai_chi_phi_tai_san.thu_tu IS 'Thứ tự sắp xếp';
COMMENT ON COLUMN public.fp_ts_trang_thai_chi_phi_tai_san.trang_thai IS 'Trạng thái hoạt động – text: Đang hoạt động | Ngừng hoạt động';

CREATE UNIQUE INDEX idx_fp_ts_trang_thai_cpts_ma ON public.fp_ts_trang_thai_chi_phi_tai_san(ma);
CREATE INDEX idx_fp_ts_trang_thai_cpts_thu_tu ON public.fp_ts_trang_thai_chi_phi_tai_san(thu_tu);

CREATE OR REPLACE FUNCTION fp_ts_trang_thai_chi_phi_tai_san_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_ts_trang_thai_chi_phi_tai_san_tg_cap_nhat
  BEFORE UPDATE ON public.fp_ts_trang_thai_chi_phi_tai_san
  FOR EACH ROW EXECUTE PROCEDURE fp_ts_trang_thai_chi_phi_tai_san_tg_cap_nhat();

ALTER TABLE public.fp_ts_trang_thai_chi_phi_tai_san ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_ts_trang_thai_chi_phi_tai_san" ON public.fp_ts_trang_thai_chi_phi_tai_san
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert fp_ts_trang_thai_chi_phi_tai_san" ON public.fp_ts_trang_thai_chi_phi_tai_san
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update fp_ts_trang_thai_chi_phi_tai_san" ON public.fp_ts_trang_thai_chi_phi_tai_san
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete fp_ts_trang_thai_chi_phi_tai_san" ON public.fp_ts_trang_thai_chi_phi_tai_san
  FOR DELETE TO authenticated USING (true);

-- Dữ liệu mẫu trạng thái phiếu (thứ tự id 1=Chờ duyệt, 2=Đã duyệt, 3=Không duyệt)
INSERT INTO public.fp_ts_trang_thai_chi_phi_tai_san (ma, ten, thu_tu, ghi_chu, trang_thai)
VALUES
  ('CHO_DUYET', 'Chờ duyệt', 1, 'Phiếu chờ duyệt', 'Đang hoạt động'),
  ('DA_DUYET', 'Đã duyệt', 2, 'Phiếu đã được duyệt', 'Đang hoạt động'),
  ('KHONG_DUYET', 'Không duyệt', 3, 'Phiếu không duyệt', 'Đang hoạt động');

-- -----------------------------------------------------------------------------
-- 2. Phiếu chi phí tài sản (id_trang_thai + ten_trang_thai từ bảng thiết lập trên)
-- -----------------------------------------------------------------------------

CREATE TABLE public.fp_ts_chi_phi_tai_san (
  id               bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma_phieu         text NOT NULL,
  ngay             date NOT NULL,
  id_tai_san       bigint NOT NULL,
  ma_tai_san       text,
  ten_tai_san      text,
  id_hang_muc      text NOT NULL,
  ten_hang_muc     text,
  mo_ta            text NOT NULL,
  so_tien          numeric(18,2) NOT NULL DEFAULT 0,
  ghi_chu          text,
  id_trang_thai    bigint NOT NULL,
  ten_trang_thai   text,
  nguoi_duyet     text,
  id_nguoi_tao     bigint,
  ten_nguoi_tao    text,
  tg_tao           timestamptz DEFAULT now(),
  tg_cap_nhat      timestamptz DEFAULT now(),
  CONSTRAINT fk_fp_ts_chi_phi_tai_san_trang_thai
    FOREIGN KEY (id_trang_thai) REFERENCES public.fp_ts_trang_thai_chi_phi_tai_san(id)
);

COMMENT ON TABLE public.fp_ts_chi_phi_tai_san IS 'Phiếu chi phí tài sản – Module Chi phí tài sản. Trạng thái lấy từ fp_ts_trang_thai_chi_phi_tai_san (id_trang_thai, ten_trang_thai).';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ma_phieu IS 'Mã phiếu – tự sinh CPTS-0001, CPTS-0002, ... (RPC get_next_ma_phieu_chi_phi_tai_san)';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ngay IS 'Ngày phiếu';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.id_tai_san IS 'ID tài sản (tham chiếu fp_ts_tai_san.id, không FK để linh hoạt)';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ma_tai_san IS 'Mã tài sản (lưu tắt khi tạo/cập nhật)';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ten_tai_san IS 'Tên tài sản (lưu tắt khi tạo/cập nhật)';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.id_hang_muc IS 'ID loại chi phí (fp_ts_loai_chi_phi.id, dạng text) hoặc legacy bao_tri | sua_chua';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ten_hang_muc IS 'Tên hạng mục (lưu tắt)';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.mo_ta IS 'Mô tả nội dung chi phí';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.so_tien IS 'Số tiền';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ghi_chu IS 'Ghi chú';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.id_trang_thai IS 'ID trạng thái phiếu – tham chiếu fp_ts_trang_thai_chi_phi_tai_san(id)';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ten_trang_thai IS 'Tên trạng thái phiếu (lưu tắt từ bảng thiết lập khi tạo/cập nhật)';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.nguoi_duyet IS 'Tên người duyệt';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.id_nguoi_tao IS 'ID người tạo';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ten_nguoi_tao IS 'Tên người tạo (lưu tắt)';

CREATE UNIQUE INDEX idx_fp_ts_chi_phi_tai_san_ma_phieu ON public.fp_ts_chi_phi_tai_san(ma_phieu);
CREATE INDEX idx_fp_ts_chi_phi_tai_san_ngay ON public.fp_ts_chi_phi_tai_san(ngay);
CREATE INDEX idx_fp_ts_chi_phi_tai_san_id_tai_san ON public.fp_ts_chi_phi_tai_san(id_tai_san);
CREATE INDEX idx_fp_ts_chi_phi_tai_san_id_trang_thai ON public.fp_ts_chi_phi_tai_san(id_trang_thai);
CREATE INDEX idx_fp_ts_chi_phi_tai_san_id_hang_muc ON public.fp_ts_chi_phi_tai_san(id_hang_muc);
CREATE INDEX idx_fp_ts_chi_phi_tai_san_id_nguoi_tao ON public.fp_ts_chi_phi_tai_san(id_nguoi_tao) WHERE id_nguoi_tao IS NOT NULL;

CREATE OR REPLACE FUNCTION fp_ts_chi_phi_tai_san_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_ts_chi_phi_tai_san_tg_cap_nhat
  BEFORE UPDATE ON public.fp_ts_chi_phi_tai_san
  FOR EACH ROW EXECUTE PROCEDURE fp_ts_chi_phi_tai_san_tg_cap_nhat();

-- Trigger: cập nhật ten_trang_thai khi id_trang_thai thay đổi
CREATE OR REPLACE FUNCTION fp_ts_chi_phi_tai_san_sync_ten_trang_thai()
RETURNS TRIGGER AS $$
BEGIN
  SELECT ten INTO NEW.ten_trang_thai
  FROM public.fp_ts_trang_thai_chi_phi_tai_san
  WHERE id = NEW.id_trang_thai;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_ts_chi_phi_tai_san_sync_ten_trang_thai
  BEFORE INSERT OR UPDATE OF id_trang_thai ON public.fp_ts_chi_phi_tai_san
  FOR EACH ROW EXECUTE PROCEDURE fp_ts_chi_phi_tai_san_sync_ten_trang_thai();

ALTER TABLE public.fp_ts_chi_phi_tai_san ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_ts_chi_phi_tai_san" ON public.fp_ts_chi_phi_tai_san
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert fp_ts_chi_phi_tai_san" ON public.fp_ts_chi_phi_tai_san
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update fp_ts_chi_phi_tai_san" ON public.fp_ts_chi_phi_tai_san
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete fp_ts_chi_phi_tai_san" ON public.fp_ts_chi_phi_tai_san
  FOR DELETE TO authenticated USING (true);

-- -----------------------------------------------------------------------------
-- 3. Sequence + RPC mã phiếu tự tăng (CPTS-0001, CPTS-0002, ...)
-- App gọi get_next_ma_phieu_chi_phi_tai_san() khi tạo phiếu mới.
-- -----------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS fp_ts_chi_phi_tai_san_ma_phieu_seq START 1;

CREATE OR REPLACE FUNCTION get_next_ma_phieu_chi_phi_tai_san()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val bigint;
BEGIN
  next_val := nextval('fp_ts_chi_phi_tai_san_ma_phieu_seq');
  RETURN 'CPTS-' || lpad(next_val::text, 4, '0');
END;
$$;

COMMENT ON FUNCTION get_next_ma_phieu_chi_phi_tai_san() IS 'Trả về mã phiếu chi phí tài sản tiếp theo (CPTS-0001, CPTS-0002, ...)';

GRANT USAGE ON SEQUENCE fp_ts_chi_phi_tai_san_ma_phieu_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_ma_phieu_chi_phi_tai_san() TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Đồng bộ ma_tai_san / ten_tai_san trên phiếu chi phí khi đổi mã hoặc tên tài sản
-- (bảng fp_ts_tai_san phải đã tồn tại). Chạy thêm block này nếu DB đã deploy trước đó.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fp_ts_tai_san_sync_chi_phi_ma_ten()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    OLD.ma_tai_san IS DISTINCT FROM NEW.ma_tai_san
    OR OLD.ten_tai_san IS DISTINCT FROM NEW.ten_tai_san
  ) THEN
    UPDATE public.fp_ts_chi_phi_tai_san
    SET
      ma_tai_san = NEW.ma_tai_san,
      ten_tai_san = NEW.ten_tai_san
    WHERE id_tai_san = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_ts_tai_san_sync_chi_phi_ma_ten ON public.fp_ts_tai_san;
CREATE TRIGGER tr_fp_ts_tai_san_sync_chi_phi_ma_ten
  AFTER UPDATE OF ma_tai_san, ten_tai_san ON public.fp_ts_tai_san
  FOR EACH ROW
  EXECUTE PROCEDURE public.fp_ts_tai_san_sync_chi_phi_ma_ten();
