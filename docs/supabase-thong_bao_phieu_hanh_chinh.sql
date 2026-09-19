-- =============================================================================
-- Thông báo module Hành chính > Phiếu hành chính — hai RPC tra cứu bổ sung.
--
-- Chạy SAU: docs/supabase-rpc_thong_bao_dinh_tuyen.sql (#5)
--           docs/supabase-trigger_thong_bao_7_module.sql (#6)
--
-- KHÔNG đụng vào rpc_tb_nguoi_duyet(text, bigint) đang có. Postgres phân biệt
-- hàm theo SỐ THAM SỐ, nên thêm một tham số bằng CREATE OR REPLACE sẽ sinh ra
-- hàm thứ hai chứ không thay hàm cũ; lời gọi hai tham số của 7 module kia lập
-- tức thành ambiguous ("function is not unique") và cả 8 module cùng tắt tiếng.
-- Vì vậy nhánh định tuyến theo phòng ban nằm ở một hàm RIÊNG, tên khác hẳn.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Ai duyệt phiếu hành chính của MỘT người cụ thể?
--
--    Ba nhóm, hợp lại:
--      a. Quản lý phòng ban CỦA NGƯỜI TẠO — cùng phong_ban_id, cap_bac 2 hoặc 3
--         (2 = Trưởng bộ phận, 3 = Quản lý). Đây là nhóm mà rpc_tb_nguoi_duyet
--         bỏ sót: quản lý phòng chỉ được tick {view, create, update} nên không
--         lọt qua điều kiện actions && ARRAY['approve','admin','all']. Hệ quả
--         thật: 16 phiếu chờ duyệt của Phòng Sản xuất mà cả ba quản lý phòng
--         đó không nhận được gì.
--      b. Quản trị module — chức vụ có 'admin' | 'all'. KHÔNG gộp 'approve' như
--         hàm chung: cổng phía app (usePhieuHanhChinhViewScope) chỉ mở tab
--         "Tôi quản lý" cho admin/all, báo cho người chỉ có 'approve' là đẩy họ
--         tới một tab họ không mở được. Đã soi dữ liệu: không chức vụ nào đang
--         giữ riêng 'approve' trên module này, nên thu hẹp không cắt mất ai.
--      c. Cấp bậc 1 — luôn có mặt (luật im lặng xử ở worker, không ở đây).
--
--    p_nguoi_tao_id NULL hoặc không tra được phòng ban => nhánh (a) tự rỗng,
--    vẫn còn (b) + (c): thông báo không bao giờ rơi về số không.
--    Không có tham số chi nhánh: phiếu hành chính không gắn kho nào,
--    rpc_tb_chi_nhanh_phieu vốn đã trả NULL cho bảng này.
--
--    Nhận p_nguoi_tao_id chứ không nhận sẵn phòng ban vì role notify_service
--    không có quyền SELECT trên fp_var_nhan_vien — worker không tự tra được.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_tb_nguoi_duyet_phong_ban(
  p_module_id    text,
  p_nguoi_tao_id bigint
)
RETURNS TABLE (nhan_vien_id bigint, cap_bac integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Cấp bậc đọc qua fp_var_cap_bac như rpc_tb_nguoi_duyet: ưu tiên cột
  -- denormalized fp_var_nhan_vien.cap_bac, lui về cap_bac_id khi cột đó trống.
  WITH nv AS (
    SELECT e.id,
           e.trang_thai,
           e.chuc_vu_id,
           e.phong_ban_id,
           COALESCE(e.cap_bac, cb.cap_bac) AS cap_bac
      FROM public.fp_var_nhan_vien e
      LEFT JOIN public.fp_var_cap_bac cb ON cb.id = e.cap_bac_id
  ),
  pb AS (
    SELECT nv.phong_ban_id FROM nv WHERE nv.id = p_nguoi_tao_id
  )
  SELECT nv.id, COALESCE(nv.cap_bac, 99)::integer
    FROM nv
   WHERE COALESCE(nv.trang_thai, '') <> 'Nghỉ việc'
     AND (
           nv.cap_bac = 1
        OR EXISTS (
             SELECT 1
               FROM public.fp_var_phan_quyen pq
              WHERE pq.chuc_vu_id = nv.chuc_vu_id
                AND pq.module_id  = p_module_id
                AND pq.actions && ARRAY['admin', 'all']
           )
        OR (
             nv.cap_bac IN (2, 3)
         AND nv.phong_ban_id IS NOT NULL
         AND nv.phong_ban_id = (SELECT phong_ban_id FROM pb)
           )
         );
$$;

COMMENT ON FUNCTION public.rpc_tb_nguoi_duyet_phong_ban(text, bigint) IS
  'Người duyệt phiếu hành chính: quản lý phòng ban của NGƯỜI TẠO (cấp bậc 2-3) + quản trị module (admin/all) + cấp bậc 1. Hàm RIÊNG, không thay rpc_tb_nguoi_duyet.';

-- -----------------------------------------------------------------------------
-- 2) Tên loại phiếu, để thông báo nói "Xin nghỉ phép" thay vì im lặng về loại.
--    Cùng khuôn rpc_tb_ten_nhan_vien: role notify_service không đọc thẳng bảng
--    nghiệp vụ nào, mọi tra cứu đi qua SECURITY DEFINER.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_tb_ten_loai_phieu_hanh_chinh(p_ids bigint[])
RETURNS TABLE (id bigint, loai_phieu text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT n.id, NULLIF(btrim(n.loai_phieu), '')
    FROM public.fp_hr_nhom_phieu_hanh_chinh n
   WHERE n.id = ANY (p_ids);
$$;

COMMENT ON FUNCTION public.rpc_tb_ten_loai_phieu_hanh_chinh(bigint[]) IS
  'Tên loại phiếu hành chính (fp_hr_nhom_phieu_hanh_chinh.loai_phieu) cho nội dung thông báo.';

GRANT EXECUTE ON FUNCTION public.rpc_tb_nguoi_duyet_phong_ban(text, bigint) TO notify_service;
GRANT EXECUTE ON FUNCTION public.rpc_tb_ten_loai_phieu_hanh_chinh(bigint[]) TO notify_service;

-- =============================================================================
-- Kiểm tra sau khi chạy
--
-- a) rpc_tb_nguoi_duyet vẫn CHỈ có một chữ ký. Ra 2 dòng nghĩa là đã lỡ tạo
--    overload, phải DROP bản thừa NGAY, nếu không 7 module kia tắt tiếng:
--      SELECT oid::regprocedure FROM pg_proc WHERE proname = 'rpc_tb_nguoi_duyet';
--      -- kỳ vọng đúng 1 dòng: rpc_tb_nguoi_duyet(text,bigint)
--
-- b) Người nhận thật của một phiếu Phòng Sản xuất (kỳ vọng có đủ ba quản lý
--    phòng cấp bậc 3, cùng quản trị và cấp bậc 1):
--      SELECT d.nhan_vien_id, d.cap_bac, nv.ho_va_ten, nv.ten_phong_ban
--        FROM public.fp_hr_phieu_hanh_chinh p
--        CROSS JOIN LATERAL public.rpc_tb_nguoi_duyet_phong_ban(
--               'hanh-chinh/phieu-hanh-chinh', p.nguoi_tao_id) d
--        JOIN public.fp_var_nhan_vien nv ON nv.id = d.nhan_vien_id
--       WHERE p.id = <id phiếu chờ duyệt của Phòng Sản xuất>
--       ORDER BY d.cap_bac, nv.ho_va_ten;
--
-- c) Không ai đang phụ thuộc riêng 'approve' trên module này. Nếu ra dòng thì
--    phải thêm 'approve' vào nhánh (b) trước khi deploy worker:
--      SELECT cv.ten_chuc_vu, pq.actions
--        FROM public.fp_var_phan_quyen pq
--        JOIN public.fp_var_chuc_vu cv ON cv.id = pq.chuc_vu_id
--       WHERE pq.module_id = 'hanh-chinh/phieu-hanh-chinh'
--         AND 'approve' = ANY (pq.actions)
--         AND NOT (pq.actions && ARRAY['admin','all']);
--
-- d) Tên loại phiếu:
--      SELECT * FROM public.rpc_tb_ten_loai_phieu_hanh_chinh(ARRAY[1,2,3]::bigint[]);
-- =============================================================================
