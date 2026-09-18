-- =============================================================================
-- View: v_tc_quy_thu_chi_summary
-- Sổ quỹ + cột THU / CHI tách đôi + TỒN QUỸ LŨY KẾ (running balance) + JOIN tên
-- để app không phải gọi thêm ref chi nhánh / hạng mục / nhân viên mỗi trang.
-- Chạy sau: fp_tc_quy_thu_chi, fp_tc_hang_muc_thu_chi, fp_var_chi_nhanh, fp_var_nhan_vien
--
-- ---------------------------------------------------------------------------
-- TỒN QUỸ tính bằng window function, KHÔNG lưu cột cứng. Lý do:
--   - Ghi O(1), không cần trigger rewrite hàng loạt khi chèn phiếu LÙI NGÀY.
--   - Không bao giờ drift (sửa SQL tay / import Excel vẫn đúng).
--   - Sửa `ngay` hoặc `id_chi_nhanh` của một phiếu tự khớp lại, không phải
--     recompute 2 partition; hai người ghi cùng lúc không khóa nhau.
-- Đánh đổi: mỗi truy vấn là O(số dòng của chi nhánh) — chấp nhận được với sổ quỹ
-- một farm. Khi dữ liệu lớn, đường thoát là thêm bảng chốt số dư đầu kỳ và chỉ
-- chạy window trong kỳ hiện tại; chỉ phải sửa thân view này.
--
-- QUAN TRỌNG — cách filter tương tác với window:
--   * Predicate KHÔNG nằm trong PARTITION BY (ngay, id_hang_muc, loai, ilike...)
--     không được đẩy xuống dưới window ⇒ ton_quy vẫn là lũy kế TOÀN BỘ SỔ của
--     chi nhánh, đúng như cột TỒN QUỸ trong Excel, kể cả khi lọc hoặc phân trang
--     bằng .range() — trang cuối vẫn đúng tuyệt đối.
--   * Riêng id_chi_nhanh (cột PARTITION BY) ĐƯỢC đẩy xuống. Đây là ngoại lệ có
--     lợi: kết quả không đổi (các partition độc lập) mà còn giảm khối lượng quét
--     ⇒ danh sách LUÔN phải gửi kèm filter id_chi_nhanh.
--   * count: 'exact' của PostgREST chạy thêm một lượt window — là chỗ hạ cấp đầu
--     tiên nếu về sau thấy chậm.
-- =============================================================================

CREATE OR REPLACE VIEW public.v_tc_quy_thu_chi_summary AS
SELECT
  p.*,
  CASE WHEN p.loai = 'thu' THEN p.so_tien ELSE 0 END AS thu,
  CASE WHEN p.loai = 'chi' THEN p.so_tien ELSE 0 END AS chi,
  SUM(CASE WHEN p.loai = 'thu' THEN p.so_tien ELSE -p.so_tien END)
    OVER (
      PARTITION BY p.id_chi_nhanh
      ORDER BY p.ngay, p.id
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS ton_quy,
  cn.ten_chi_nhanh AS ref_ten_chi_nhanh,
  cn.ma_chi_nhanh  AS ref_ma_chi_nhanh,
  hm.ten           AS ref_ten_hang_muc,
  hm.ma            AS ref_ma_hang_muc,
  nv.ho_va_ten     AS ref_ten_nguoi_tao,
  trim(
    both ' ' FROM concat_ws(
      ' ',
      NULLIF(btrim(COALESCE(p.so_phieu, '')), ''),
      NULLIF(btrim(COALESCE(p.dien_giai, '')), ''),
      NULLIF(btrim(COALESCE(p.ghi_chu, '')), ''),
      NULLIF(btrim(COALESCE(p.so_chung_tu, '')), ''),
      NULLIF(btrim(COALESCE(p.ten_hang_muc, '')), ''),
      NULLIF(btrim(COALESCE(p.ngay::text, '')), '')
    )
  ) AS ref_tim_kiem
FROM public.fp_tc_quy_thu_chi p
LEFT JOIN public.fp_var_chi_nhanh cn ON cn.id = p.id_chi_nhanh
LEFT JOIN public.fp_tc_hang_muc_thu_chi hm ON hm.id = p.id_hang_muc
LEFT JOIN public.fp_var_nhan_vien nv ON nv.id = p.id_nguoi_tao;

COMMENT ON VIEW public.v_tc_quy_thu_chi_summary IS 'Sổ quỹ + thu/chi tách cột + tồn quỹ lũy kế theo chi nhánh + tên tham chiếu';
COMMENT ON COLUMN public.v_tc_quy_thu_chi_summary.ton_quy IS 'Tồn quỹ lũy kế của CHI NHÁNH tính đến dòng này (thứ tự ngay, id) — không phụ thuộc filter/phân trang';
COMMENT ON COLUMN public.v_tc_quy_thu_chi_summary.ref_ten_chi_nhanh IS 'Tên chi nhánh HIỆN TẠI (khác ten_chi_nhanh là snapshot lúc lập phiếu)';
COMMENT ON COLUMN public.v_tc_quy_thu_chi_summary.ref_tim_kiem IS 'Chuỗi gộp số phiếu / diễn giải / ghi chú / số chứng từ / hạng mục / ngày — dùng cho ilike';

ALTER VIEW public.v_tc_quy_thu_chi_summary SET (security_invoker = true);

GRANT SELECT ON public.v_tc_quy_thu_chi_summary TO authenticated;
GRANT SELECT ON public.v_tc_quy_thu_chi_summary TO anon;
