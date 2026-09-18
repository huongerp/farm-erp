-- =============================================================================
-- Gắn trigger sinh sự kiện thông báo cho 7 module đợt đầu
--
-- Trigger cố tình mỏng: nó chỉ chụp dòng dữ liệu vào outbox rồi pg_notify.
-- Mọi quyết định "ai nhận / viết gì" nằm ở services/notify (TypeScript, có test).
--
-- Tham số: EXECUTE FUNCTION fn_ghi_su_kien_thong_bao('<module_id>', '<cột trạng thái>')
--   - module_id phải khớp fp_var_phan_quyen.module_id, KHÔNG phải URL. Phiếu kho
--     có URL /mua-hang/phieu-kho nhưng module_id là kho-van/phieu-kho
--     (xem KHO_VAN_SLUGS trong permission-modules-config.ts).
--
-- Thứ tự chạy: SAU supabase-rpc_thong_bao_dinh_tuyen.sql.
-- Chạy lại an toàn: mọi trigger đều DROP IF EXISTS trước.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Công việc — đấu đầu tiên để kiểm chứng đường đi đầu-cuối, vì module này có
--    đủ người giao / người chịu trách nhiệm / người hỗ trợ / trao đổi.
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_thong_bao_fp_hc_cong_viec ON public.fp_hc_cong_viec;
CREATE TRIGGER tr_thong_bao_fp_hc_cong_viec
  AFTER INSERT OR UPDATE ON public.fp_hc_cong_viec
  FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('hanh-chinh/cong-viec', 'trang_thai');

-- -----------------------------------------------------------------------------
-- 2) Bốn module phiếu dùng chung bộ trạng thái duyệt
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_thong_bao_fp_mh_phieu_kho ON public.fp_mh_phieu_kho;
CREATE TRIGGER tr_thong_bao_fp_mh_phieu_kho
  AFTER INSERT OR UPDATE ON public.fp_mh_phieu_kho
  FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('kho-van/phieu-kho', 'trang_thai');

DROP TRIGGER IF EXISTS tr_thong_bao_fp_mh_phieu_de_xuat_vat_tu ON public.fp_mh_phieu_de_xuat_vat_tu;
CREATE TRIGGER tr_thong_bao_fp_mh_phieu_de_xuat_vat_tu
  AFTER INSERT OR UPDATE ON public.fp_mh_phieu_de_xuat_vat_tu
  FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('mua-hang/phieu-de-xuat-vat-tu', 'trang_thai');

DROP TRIGGER IF EXISTS tr_thong_bao_fp_farm_de_xuat_mua_hang ON public.fp_farm_de_xuat_mua_hang;
CREATE TRIGGER tr_thong_bao_fp_farm_de_xuat_mua_hang
  AFTER INSERT OR UPDATE ON public.fp_farm_de_xuat_mua_hang
  FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('quan-ly-farm/de-xuat-mua-hang', 'trang_thai');

DROP TRIGGER IF EXISTS tr_thong_bao_fp_farm_phieu_kho_phan_thuoc ON public.fp_farm_phieu_kho_phan_thuoc;
CREATE TRIGGER tr_thong_bao_fp_farm_phieu_kho_phan_thuoc
  AFTER INSERT OR UPDATE ON public.fp_farm_phieu_kho_phan_thuoc
  FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('quan-ly-farm/phieu-kho-phan-thuoc', 'trang_thai');

-- -----------------------------------------------------------------------------
-- 3) Phiếu hành chính — một cấp duyệt
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_thong_bao_fp_hr_phieu_hanh_chinh ON public.fp_hr_phieu_hanh_chinh;
CREATE TRIGGER tr_thong_bao_fp_hr_phieu_hanh_chinh
  AFTER INSERT OR UPDATE ON public.fp_hr_phieu_hanh_chinh
  FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('hanh-chinh/phieu-hanh-chinh', 'trang_thai');

-- -----------------------------------------------------------------------------
-- 4) Đơn đặt hàng
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_thong_bao_fp_mh_don_dat_hang ON public.fp_mh_don_dat_hang;
CREATE TRIGGER tr_thong_bao_fp_mh_don_dat_hang
  AFTER INSERT OR UPDATE ON public.fp_mh_don_dat_hang
  FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('mua-hang/don-dat-hang', 'trang_thai');

-- =============================================================================
-- Kiểm tra sau khi chạy
-- =============================================================================
-- Phải ra đúng 7 dòng:
--
--   SELECT c.relname AS bang, t.tgname AS trigger_ten
--     FROM pg_trigger t
--     JOIN pg_class c ON c.oid = t.tgrelid
--    WHERE t.tgname LIKE 'tr_thong_bao_%'
--    ORDER BY c.relname;
--
-- Thử một nhịp đầu-cuối (chạy bằng tài khoản có JWT, ví dụ qua PostgREST):
--
--   UPDATE fp_hc_cong_viec SET mo_ta = mo_ta || ' ' WHERE id = <id nào đó>;
--   SELECT id, bang, thao_tac, trang_thai_cu, trang_thai_moi, actor_id, tg_xu_ly
--     FROM fp_var_su_kien_thong_bao ORDER BY id DESC LIMIT 5;
--
-- tg_xu_ly còn NULL sau vài giây nghĩa là worker chưa chạy hoặc chưa LISTEN được.
--
-- =============================================================================
-- Gỡ toàn bộ khi cần quay đầu
-- =============================================================================
-- DROP TRIGGER IF EXISTS tr_thong_bao_fp_hc_cong_viec               ON public.fp_hc_cong_viec;
-- DROP TRIGGER IF EXISTS tr_thong_bao_fp_mh_phieu_kho               ON public.fp_mh_phieu_kho;
-- DROP TRIGGER IF EXISTS tr_thong_bao_fp_mh_phieu_de_xuat_vat_tu    ON public.fp_mh_phieu_de_xuat_vat_tu;
-- DROP TRIGGER IF EXISTS tr_thong_bao_fp_farm_de_xuat_mua_hang      ON public.fp_farm_de_xuat_mua_hang;
-- DROP TRIGGER IF EXISTS tr_thong_bao_fp_farm_phieu_kho_phan_thuoc  ON public.fp_farm_phieu_kho_phan_thuoc;
-- DROP TRIGGER IF EXISTS tr_thong_bao_fp_hr_phieu_hanh_chinh        ON public.fp_hr_phieu_hanh_chinh;
-- DROP TRIGGER IF EXISTS tr_thong_bao_fp_mh_don_dat_hang            ON public.fp_mh_don_dat_hang;
