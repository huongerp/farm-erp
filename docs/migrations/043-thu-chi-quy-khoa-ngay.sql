-- =============================================================================
-- 043-thu-chi-quy-khoa-ngay.sql — Thu chi quỹ: chỉ cấp cao được chọn / đổi ngày phiếu
--
-- Ngày phiếu quyết định thứ tự tồn quỹ lũy kế → người thường không được lùi / tiến ngày:
-- - INSERT: ngày phiếu phải là hôm nay (giờ Việt Nam).
-- - UPDATE: không được đổi cột ngay.
-- Cấp cao (cấp bậc 1 / chức vụ tt = 1 / admin|all trên module) không bị chặn; migration,
-- SQL tay, hàm SECURITY DEFINER cũng không (current_user <> 'authenticated').
-- Khớp canSuaNgayThuChiQuy ở features/tai-chinh/thu-chi-quy/core/trang-thai.ts
-- (form khoá ô Ngày, Nhập Excel báo lỗi dòng khác ngày hôm nay).
--
-- Thân hàm giữ nguyên migration 036, chỉ thêm hai nhánh kiểm tra ngày.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-043
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/043-thu-chi-quy-khoa-ngay.sql
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_tc_quy_khoa_duyet() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Migration, SQL tay, hàm SECURITY DEFINER: không chặn.
  IF current_user <> 'authenticated' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF public.fn_tc_quy_la_cap_cao() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.trang_thai <> 'cho_duyet' THEN
      RAISE EXCEPTION 'Phiếu quỹ mới phải ở trạng thái Chờ duyệt.' USING ERRCODE = 'P0001';
    END IF;
    IF NEW.ngay IS DISTINCT FROM (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date THEN
      RAISE EXCEPTION 'Chỉ quản trị hoặc cấp bậc 1 mới lập phiếu quỹ khác ngày hôm nay.' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.trang_thai <> 'cho_duyet' THEN
    RAISE EXCEPTION 'Phiếu % đã duyệt / không duyệt — chỉ quản trị hoặc cấp bậc 1 mới sửa, xoá hoặc đổi trạng thái.', OLD.so_phieu
      USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.trang_thai IS DISTINCT FROM OLD.trang_thai THEN
    RAISE EXCEPTION 'Chỉ quản trị hoặc cấp bậc 1 mới duyệt / không duyệt phiếu quỹ.' USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.ngay IS DISTINCT FROM OLD.ngay THEN
    RAISE EXCEPTION 'Chỉ quản trị hoặc cấp bậc 1 mới đổi ngày phiếu quỹ %.', OLD.so_phieu USING ERRCODE = 'P0001';
  END IF;

  RETURN COALESCE(NEW, OLD);
END
$$;

REVOKE ALL ON FUNCTION public.fn_tc_quy_khoa_duyet() FROM PUBLIC, anon;

COMMIT;
