-- =============================================================================
-- Outbox sự kiện thông báo — nền của tính năng Thông báo + Web Push
--
-- Trigger trên bảng nghiệp vụ CHỈ ghi sự kiện thô vào bảng này (cùng transaction
-- với thay đổi dữ liệu), rồi pg_notify đánh thức worker `services/notify`.
-- Worker mới là nơi quyết định AI NHẬN và VIẾT GÌ — logic đó nằm trong
-- TypeScript để test được, không nhồi vào PL/pgSQL.
--
-- Thứ tự chạy: file này TRƯỚC supabase-fp_var_thong_bao.sql.
-- Phụ thuộc: public.nhan_vien_hien_tai_id() (docs/vps-05-quyen-doi-mat-khau.sql)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fp_var_su_kien_thong_bao (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  module_id      text        NOT NULL,
  bang           text        NOT NULL,
  ban_ghi_id     bigint      NOT NULL,
  thao_tac       text        NOT NULL,
  trang_thai_cu  text,
  trang_thai_moi text,
  actor_id       bigint,
  payload        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  payload_cu     jsonb,
  tg_tao         timestamptz NOT NULL DEFAULT now(),
  tg_xu_ly       timestamptz,
  so_lan_thu     integer     NOT NULL DEFAULT 0,
  loi_cuoi       text,
  CONSTRAINT ck_fp_var_su_kien_thao_tac CHECK (thao_tac IN ('INSERT', 'UPDATE'))
);

COMMENT ON TABLE public.fp_var_su_kien_thong_bao IS
  'Outbox sự kiện thông báo. Trigger nghiệp vụ ghi vào đây; worker services/notify đọc ra, định tuyến người nhận rồi ghi fp_var_thong_bao.';
COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.module_id IS
  'Mã module dạng ''kho-van/phieu-kho'' — khớp module_id trong fp_var_phan_quyen và PERMISSION_FUNCTIONS phía app.';
COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.bang IS 'Tên bảng nghiệp vụ sinh ra sự kiện';
COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.ban_ghi_id IS 'Khoá chính của bản ghi nghiệp vụ';
COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.thao_tac IS 'INSERT | UPDATE (không theo dõi DELETE: phiếu xoá thì thông báo cũ tự hết ý nghĩa)';
COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.actor_id IS
  'Nhân viên gây ra thay đổi, lấy từ JWT của phiên đang chạy. Worker dùng để KHÔNG bắn ngược lại chính người đó.';
COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.payload IS 'Ảnh chụp bản ghi sau thay đổi, đã loại các cột nặng (ảnh, đính kèm)';
COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.payload_cu IS 'Ảnh chụp trước thay đổi (NULL khi INSERT) — dùng để so mảng người hỗ trợ, trao đổi mới';
COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.tg_xu_ly IS 'NULL = chưa xử lý. Worker quét cột này khi khởi động và mỗi 30 giây.';
COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.so_lan_thu IS 'Số lần worker thử xử lý và thất bại — chặn vòng lặp vô hạn với sự kiện hỏng';

-- Worker chỉ quan tâm dòng chưa xử lý → index partial giữ cho bảng có phình
-- theo thời gian thì truy vấn hàng đợi vẫn nhanh.
CREATE INDEX IF NOT EXISTS idx_fp_var_su_kien_chua_xu_ly
  ON public.fp_var_su_kien_thong_bao (id)
  WHERE tg_xu_ly IS NULL;

CREATE INDEX IF NOT EXISTS idx_fp_var_su_kien_ban_ghi
  ON public.fp_var_su_kien_thong_bao (bang, ban_ghi_id, tg_tao DESC);

CREATE INDEX IF NOT EXISTS idx_fp_var_su_kien_tg_tao
  ON public.fp_var_su_kien_thong_bao (tg_tao);

-- =============================================================================
-- Hàm trigger dùng chung cho MỌI bảng nghiệp vụ
--
-- Tham số (truyền qua CREATE TRIGGER ... EXECUTE FUNCTION fn(...)):
--   TG_ARGV[0] = module_id, ví dụ 'kho-van/phieu-kho'
--   TG_ARGV[1] = tên cột trạng thái, ví dụ 'trang_thai'. Truyền '' nếu bảng
--                không có máy trạng thái (khi đó mọi UPDATE đều sinh sự kiện).
--
-- Trigger cố tình KHÔNG biết gì về nghiệp vụ: nó chụp cả dòng vào jsonb và để
-- worker tự rút cột cần. Nhờ vậy đấu thêm module chỉ là thêm một CREATE TRIGGER,
-- không phải sửa hàm này.
-- =============================================================================

-- Các cột nặng hoặc nhạy cảm không bao giờ nên nằm trong outbox: ảnh base64 cũ,
-- mảng URL ảnh, chữ ký. Bỏ ra để bảng outbox không phình và không rò dữ liệu.
CREATE OR REPLACE FUNCTION public.fn_loc_cot_nang(p jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p - ARRAY[
    'hinh_anh', 'hinh_anh_urls', 'anh', 'anh_urls', 'file_dinh_kem',
    'mat_khau_hash', 'chu_ky', 'chu_ky_url', 'logo', 'avatar_base64'
  ];
$$;

COMMENT ON FUNCTION public.fn_loc_cot_nang(jsonb) IS
  'Loại các cột ảnh/đính kèm/nhạy cảm khỏi ảnh chụp dòng trước khi ghi vào outbox thông báo.';

CREATE OR REPLACE FUNCTION public.fn_ghi_su_kien_thong_bao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_module_id      text := TG_ARGV[0];
  v_cot_trang_thai text := NULLIF(TG_ARGV[1], '');
  v_new            jsonb := to_jsonb(NEW);
  v_old            jsonb := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
  v_tt_cu          text;
  v_tt_moi         text;
  v_id             bigint;
BEGIN
  IF v_cot_trang_thai IS NOT NULL THEN
    v_tt_moi := v_new ->> v_cot_trang_thai;
    v_tt_cu  := v_old ->> v_cot_trang_thai;
  END IF;

  -- UPDATE không đổi gì thật sự thì bỏ qua. So cả dòng (đã lọc cột nặng) thay vì
  -- chỉ so trạng thái, vì worker còn cần bắt ca "phiếu đã duyệt bị sửa nội dung"
  -- và "có trao đổi mới" — hai ca không đổi trạng thái.
  IF TG_OP = 'UPDATE'
     AND public.fn_loc_cot_nang(v_new) IS NOT DISTINCT FROM public.fn_loc_cot_nang(v_old) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.fp_var_su_kien_thong_bao (
    module_id, bang, ban_ghi_id, thao_tac,
    trang_thai_cu, trang_thai_moi, actor_id, payload, payload_cu
  )
  VALUES (
    v_module_id,
    TG_TABLE_NAME,
    (v_new ->> 'id')::bigint,
    TG_OP,
    v_tt_cu,
    v_tt_moi,
    public.nhan_vien_hien_tai_id(),
    public.fn_loc_cot_nang(v_new),
    public.fn_loc_cot_nang(v_old)
  )
  RETURNING id INTO v_id;

  -- Đánh thức worker. pg_notify chỉ gửi khi transaction COMMIT, nên không có ca
  -- worker đọc phải sự kiện của transaction bị rollback.
  PERFORM pg_notify('thong_bao_moi', v_id::text);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_ghi_su_kien_thong_bao() IS
  'Trigger chung ghi sự kiện vào outbox thông báo. TG_ARGV[0]=module_id, TG_ARGV[1]=tên cột trạng thái (rỗng nếu không có).';

-- =============================================================================
-- Quyền
--
-- Outbox là hàng đợi nội bộ: KHÔNG cấp cho `authenticated`. Chỉ role của worker
-- đọc/ghi được, theo đúng cách auth_service chỉ EXECUTE được vài RPC.
-- =============================================================================

-- Role phải có TRƯỚC khi tạo policy tham chiếu tới nó, nếu không Postgres báo
-- 'role "notify_service" does not exist' và cả file bị rollback.
DO $$
DECLARE
  v_pw text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'notify_service') THEN
    v_pw := encode(gen_random_bytes(24), 'hex');
    EXECUTE format('CREATE ROLE notify_service WITH LOGIN NOINHERIT PASSWORD %L', v_pw);
    RAISE NOTICE 'Đã tạo role notify_service. Mật khẩu (lưu vào NOTIFY_DATABASE_URL rồi xoá khỏi log): %', v_pw;
  ELSE
    RAISE NOTICE 'Role notify_service đã tồn tại — giữ nguyên mật khẩu hiện có.';
  END IF;
END $$;

ALTER TABLE public.fp_var_su_kien_thong_bao ENABLE ROW LEVEL SECURITY;
-- Không có policy nào cho `authenticated` → PostgREST không đọc được bảng này.
-- RLS áp cho MỌI role không phải chủ bảng, kể cả notify_service, nên worker phải
-- có policy riêng, nếu không nó đọc ra bảng rỗng và im lặng không xử lý gì.
DROP POLICY IF EXISTS "Worker thông báo toàn quyền trên outbox" ON public.fp_var_su_kien_thong_bao;
CREATE POLICY "Worker thông báo toàn quyền trên outbox" ON public.fp_var_su_kien_thong_bao
  FOR ALL TO notify_service USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO notify_service;
GRANT SELECT, UPDATE ON public.fp_var_su_kien_thong_bao TO notify_service;

-- =============================================================================
-- Dọn rác: sự kiện đã xử lý quá 30 ngày thì bỏ. Gọi từ worker, không cần pg_cron.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rpc_don_su_kien_thong_bao_cu(p_so_ngay integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_so_dong integer;
BEGIN
  DELETE FROM public.fp_var_su_kien_thong_bao
   WHERE tg_xu_ly IS NOT NULL
     AND tg_xu_ly < now() - make_interval(days => p_so_ngay);
  GET DIAGNOSTICS v_so_dong = ROW_COUNT;
  RETURN v_so_dong;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_don_su_kien_thong_bao_cu(integer) TO notify_service;
