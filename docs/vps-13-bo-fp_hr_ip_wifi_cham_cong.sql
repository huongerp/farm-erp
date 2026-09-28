-- =============================================================================
-- Gỡ bảng IP wifi chấm công (tạo ở vps-12). Tab IP wifi đã bị gỡ khỏi trang
-- Thiết lập công lương từ commit 26ee8da, không màn hình nào dùng → bỏ hẳn cả bảng lẫn code.
-- Chạy trên VPS: psql "$VPS_DB_URL" -f docs/vps-13-bo-fp_hr_ip_wifi_cham_cong.sql
-- Lúc gỡ bảng trống, không có khoá ngoại / view nào trỏ tới. Chạy lại được.
-- =============================================================================

DROP TABLE IF EXISTS public.fp_hr_ip_wifi_cham_cong;
DROP FUNCTION IF EXISTS public.fp_hr_ip_wifi_cham_cong_tg_cap_nhat();

NOTIFY pgrst, 'reload schema';
