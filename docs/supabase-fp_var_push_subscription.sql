-- =============================================================================
-- Đăng ký Web Push của từng thiết bị
--
-- Mỗi trình duyệt / thiết bị của một nhân viên là một dòng. Người dùng đăng nhập
-- trên cả điện thoại lẫn máy tính nên phải quản lý được nhiều dòng cùng lúc.
--
-- Thứ tự chạy: SAU supabase-fp_var_thong_bao_cai_dat.sql.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fp_var_push_subscription (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nhan_vien_id bigint      NOT NULL REFERENCES public.fp_var_nhan_vien(id) ON DELETE CASCADE,
  endpoint     text        NOT NULL,
  p256dh       text        NOT NULL,
  auth_key     text        NOT NULL,
  user_agent   text,
  ten_thiet_bi text,
  tg_tao       timestamptz NOT NULL DEFAULT now(),
  tg_dung_cuoi timestamptz,
  so_lan_loi   integer     NOT NULL DEFAULT 0,
  CONSTRAINT uq_fp_var_push_subscription_endpoint UNIQUE (endpoint)
);

COMMENT ON TABLE public.fp_var_push_subscription IS
  'Đăng ký Web Push theo thiết bị. endpoint là khoá tự nhiên do trình duyệt cấp.';
COMMENT ON COLUMN public.fp_var_push_subscription.endpoint IS 'URL push service do trình duyệt cấp — duy nhất toàn hệ thống';
COMMENT ON COLUMN public.fp_var_push_subscription.p256dh IS 'Khoá công khai của client, dùng mã hoá payload';
COMMENT ON COLUMN public.fp_var_push_subscription.auth_key IS 'Khoá xác thực của client (trường ''auth'' trong PushSubscription)';
COMMENT ON COLUMN public.fp_var_push_subscription.ten_thiet_bi IS 'Nhãn dễ đọc suy từ user agent, ví dụ ''Chrome trên Windows'' — hiện trong trang cài đặt';
COMMENT ON COLUMN public.fp_var_push_subscription.so_lan_loi IS
  'Đếm lỗi gửi liên tiếp. Push service trả 404/410 thì worker xoá thẳng dòng này.';

CREATE INDEX IF NOT EXISTS idx_fp_var_push_subscription_nv
  ON public.fp_var_push_subscription (nhan_vien_id);

-- =============================================================================
-- RLS
--
-- Người dùng cần TỰ xem và gỡ được thiết bị của mình trong trang cài đặt, nên
-- cấp SELECT/DELETE. Việc ĐĂNG KÝ đi qua service notify (nó giữ khoá VAPID và
-- xác thực JWT), không qua PostgREST — nên không cấp INSERT cho authenticated.
-- =============================================================================

ALTER TABLE public.fp_var_push_subscription ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Thiết bị push của mình" ON public.fp_var_push_subscription;
CREATE POLICY "Thiết bị push của mình" ON public.fp_var_push_subscription
  FOR SELECT TO authenticated
  USING (nhan_vien_id = public.nhan_vien_hien_tai_id());

DROP POLICY IF EXISTS "Gỡ thiết bị push của mình" ON public.fp_var_push_subscription;
CREATE POLICY "Gỡ thiết bị push của mình" ON public.fp_var_push_subscription
  FOR DELETE TO authenticated
  USING (nhan_vien_id = public.nhan_vien_hien_tai_id());

-- Worker đăng ký/gỡ subscription thay người dùng nên cần policy riêng.
DROP POLICY IF EXISTS "Worker thông báo toàn quyền trên subscription" ON public.fp_var_push_subscription;
CREATE POLICY "Worker thông báo toàn quyền trên subscription" ON public.fp_var_push_subscription
  FOR ALL TO notify_service USING (true) WITH CHECK (true);

GRANT SELECT, DELETE ON public.fp_var_push_subscription TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fp_var_push_subscription TO notify_service;
GRANT USAGE, SELECT ON SEQUENCE public.fp_var_push_subscription_id_seq TO notify_service;
