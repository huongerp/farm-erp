-- =============================================================================
-- vps-06 — Index cho TÌM KIẾM (ilike) và SẮP XẾP (ORDER BY) của các list view
-- =============================================================================
-- Vì sao cần:
--   1. Các module đã tìm kiếm phía server (`.or(col.ilike.%tu-khoa%)`) hiện chạy
--      seq scan mỗi lần gõ — chưa có index pg_trgm nào cho chúng.
--      (docs/supabase-search-ilike-indexes.sql là bản NHÁP, toàn bộ đang comment.)
--   2. Nhiều bảng danh sách ORDER BY trên cột chưa có index (tg_cap_nhat, tg_tao,
--      nam/thang…), nên mỗi lần mở trang Postgres phải sort toàn bảng.
--
-- Chạy được nhiều lần (idempotent). Cột/bảng không tồn tại thì BỎ QUA kèm NOTICE
-- thay vì ném lỗi — schema mỗi môi trường lệch nhau đôi chút.
--
-- Đo trước/sau:
--   EXPLAIN (ANALYZE, BUFFERS) SELECT ... WHERE so_phieu ILIKE '%abc%';
--   -- kỳ vọng: Seq Scan  ->  Bitmap Index Scan
--
-- Ghi chú: GIN trgm làm INSERT/UPDATE chậm hơn một chút và tốn dung lượng. Chỉ
-- khai những cột thực sự nằm trong ô tìm kiếm — xem danh sách dưới, mỗi nhóm
-- khớp đúng một hàm `apply*ListQuery` trong services.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- 1) GIN trgm cho các cột text tham gia `.or(...ilike...)`
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
  idx_name text;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- Nhân viên — nhan-vien-service.ts
      ('fp_var_nhan_vien', 'ho_va_ten'),
      ('fp_var_nhan_vien', 'email'),
      ('fp_var_nhan_vien', 'so_dien_thoai'),
      ('fp_var_nhan_vien', 'ma_nhan_vien'),

      -- Phiếu kho — phieu-kho-supabase.service.ts (view v_phieu_kho_summary)
      ('fp_mh_phieu_kho', 'so_phieu'),
      ('fp_mh_phieu_kho', 'mo_ta'),
      ('fp_mh_phieu_kho', 'ten_kho'),
      ('fp_mh_phieu_kho', 'ten_kho_den'),
      ('fp_mh_phieu_kho_chi_tiet', 'ten_hang_hoa'),
      ('fp_mh_phieu_kho_chi_tiet', 'pham_cap'),
      ('fp_mh_phieu_kho_chi_tiet', 'ghi_chu'),

      -- Đơn đặt hàng — don-dat-hang-supabase.service.ts
      ('fp_mh_don_dat_hang', 'so_po'),
      ('fp_mh_don_dat_hang', 'ghi_chu'),
      ('fp_mh_don_dat_hang', 'trang_thai'),
      ('fp_mh_don_dat_hang_chi_tiet', 'ma_hang'),
      ('fp_mh_don_dat_hang_chi_tiet', 'ten_hang'),
      ('fp_mh_don_dat_hang_chi_tiet', 'ghi_chu'),
      ('fp_mh_don_dat_hang_chi_tiet', 'phan_loai'),
      ('fp_mh_don_dat_hang_chi_tiet', 'muc_dich_su_dung'),
      ('fp_mh_don_dat_hang_chi_tiet', 'don_vi_tinh'),

      -- Phiếu kho phân thuốc — phieu-kho-pt-supabase.service.ts
      ('fp_farm_phieu_kho_phan_thuoc', 'so_phieu'),
      ('fp_farm_phieu_kho_phan_thuoc', 'mo_ta'),
      ('fp_farm_phieu_kho_phan_thuoc', 'ten_kho'),
      ('fp_farm_phieu_kho_phan_thuoc', 'ten_kho_den'),
      ('fp_farm_phieu_kho_phan_thuoc_chi_tiet', 'ten_hang_hoa'),
      ('fp_farm_phieu_kho_phan_thuoc_chi_tiet', 'ma_hang'),
      ('fp_farm_phieu_kho_phan_thuoc_chi_tiet', 'ghi_chu'),

      -- Thu chi quỹ — view v_tc_quy_thu_chi_summary.ref_tim_kiem gộp từ các cột này
      ('fp_tc_quy_thu_chi', 'so_phieu'),
      ('fp_tc_quy_thu_chi', 'dien_giai'),
      ('fp_tc_quy_thu_chi', 'ghi_chu'),
      ('fp_tc_quy_thu_chi', 'so_chung_tu'),
      ('fp_tc_quy_thu_chi', 'ten_hang_muc'),

      -- Danh mục được JOIN vào các view summary ở trên
      ('fp_mh_danh_sach_kho', 'ten_kho'),
      ('fp_mh_danh_sach_kho', 'ma_kho'),
      ('fp_mh_danh_sach_hang_hoa', 'ten_hang_hoa'),
      ('fp_mh_danh_sach_hang_hoa', 'ma_hang_hoa'),
      ('fp_var_chi_nhanh', 'ten_chi_nhanh'),
      ('fp_var_chi_nhanh', 'ma_chi_nhanh')
    ) AS t(tbl, col)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = r.tbl AND column_name = r.col
    ) THEN
      -- Tên index tối đa 63 ký tự (NAMEDATALEN).
      idx_name := left('idx_' || r.tbl || '_' || r.col || '_trgm', 63);
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I USING gin (%I gin_trgm_ops)',
        idx_name, r.tbl, r.col
      );
    ELSE
      RAISE NOTICE 'Bỏ qua %.% — không có cột này', r.tbl, r.col;
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 2) B-tree cho cột ORDER BY của các danh sách đang quét toàn bảng
-- -----------------------------------------------------------------------------
-- Cột trong ngoặc phải khớp ĐÚNG thứ tự ORDER BY của service, kể cả chiều DESC,
-- nếu không planner vẫn phải sort lại.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- Danh mục tài sản — danh-muc-tai-san-supabase.service.ts: .order('tg_cap_nhat', desc)
      ('idx_fp_ts_tai_san_tg_cap_nhat',        'fp_ts_tai_san',                 'tg_cap_nhat DESC'),
      -- Cấp phát/thu hồi — cap-phat-thu-hoi-supabase.service.ts: .order('tg_tao', desc)
      ('idx_fp_ts_phieu_cp_th_tg_tao',         'fp_ts_phieu_cap_phat_thu_hoi',  'tg_tao DESC'),
      -- Khấu hao — khau-hao-tai-san-supabase.service.ts: .order('nam').order('thang')
      ('idx_fp_ts_ky_khau_hao_nam_thang',      'fp_ts_ky_khau_hao',             'nam DESC, thang DESC'),
      -- Bảng lương — bang-luong-service.ts: .order('nam', desc).order('thang', desc)
      ('idx_fp_hr_bang_luong_nam_thang',       'fp_hr_bang_luong',              'nam DESC, thang DESC'),
      -- Thu hoạch — thu-hoach-supabase.service.ts
      ('idx_fp_farm_thu_hoach_nam_tuan',       'fp_farm_thu_hoach',             'nam DESC, tuan DESC'),
      -- Bảo trì/sửa chữa — chi-phi-tai-san-supabase.service.ts: .order('ngay', desc)
      ('idx_fp_ts_chi_phi_tai_san_ngay',       'fp_ts_chi_phi_tai_san',         'ngay DESC'),
      -- Dự báo SL đóng thùng — .order('ngay', desc)
      ('idx_fp_farm_du_bao_sl_dt_ngay',        'fp_farm_du_bao_sl_dong_thung',  'ngay DESC'),
      -- Báo cáo nhân công / sơ chế — .order('ngay', desc)
      ('idx_fp_farm_bao_cao_nhan_cong_ngay',   'fp_farm_bao_cao_nhan_cong',     'ngay DESC'),
      ('idx_fp_farm_bao_cao_so_che_ngay',      'fp_farm_bao_cao_so_che',        'ngay DESC')
    ) AS t(idx, tbl, cols)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = r.tbl
    ) THEN
      BEGIN
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%s)', r.idx, r.tbl, r.cols);
      EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Bỏ qua % — bảng % thiếu cột trong (%)', r.idx, r.tbl, r.cols;
      END;
    ELSE
      RAISE NOTICE 'Bỏ qua % — không có bảng %', r.idx, r.tbl;
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 3) Cập nhật thống kê để planner dùng index mới ngay
-- -----------------------------------------------------------------------------
ANALYZE;
