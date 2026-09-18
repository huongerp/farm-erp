-- =============================================================================
-- Đổi tên nhóm module: "Quản lý farm" -> "Quản lý nhà sơ chế"
--
-- Mã nhóm đổi theo: module_id 'quan-ly-farm/<slug>' -> 'quan-ly-nha-so-che/<slug>'
-- và URL '/quan-ly-farm/...' -> '/quan-ly-nha-so-che/...'. Slug của 10 module con
-- KHÔNG đổi.
--
-- THỨ TỰ TRIỂN KHAI — chạy file này TRƯỚC khi deploy code mới:
--   1) chạy file này trên VPS
--   2) deploy lại services/notify (hardcode module_id trong src/core/mo-ta-bang.ts)
--   3) deploy frontend
-- Đảo thứ tự (deploy code trước) sẽ làm mọi nhân viên mất quyền vào nhóm này cho
-- tới khi file này chạy xong, vì app suy ra module_id từ URL
-- (getPermissionModuleId trong features/he-thong/phan-quyen/core/permission-modules-config.ts).
--
-- QUYỀN CHẠY: phải là owner/superuser — role `authenticated` chỉ được UPDATE
-- (da_doc, da_xoa) trên fp_var_thong_bao.
--
-- Chạy lại nhiều lần được (idempotent): mọi UPDATE đều lọc theo tiền tố cũ.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Phân quyền — bảng quan trọng nhất. UNIQUE (chuc_vu_id, module_id) nên phải
--    dọn dòng đích trùng trước: ma trận phân quyền hay có sẵn dòng RỖNG do lần
--    lưu trước trên UI, giữ lại dòng đó sẽ làm UPDATE vi phạm unique.
-- -----------------------------------------------------------------------------
DELETE FROM public.fp_var_phan_quyen AS moi
WHERE moi.module_id LIKE 'quan-ly-nha-so-che/%'
  AND EXISTS (
    SELECT 1 FROM public.fp_var_phan_quyen AS cu
    WHERE cu.module_id = 'quan-ly-farm/' || split_part(moi.module_id, '/', 2)
      AND cu.chuc_vu_id = moi.chuc_vu_id
  );

UPDATE public.fp_var_phan_quyen
SET module_id = 'quan-ly-nha-so-che/' || split_part(module_id, '/', 2)
WHERE module_id LIKE 'quan-ly-farm/%';

-- -----------------------------------------------------------------------------
-- 2) Cài đặt thông báo theo từng người (bảng "chỉ lưu ngoại lệ").
--    Bỏ bước này thì ai đã TẮT thông báo của module farm sẽ bị bật lại.
--    UNIQUE (nhan_vien_id, module_id, loai_su_kien) -> dọn dòng đích trùng trước.
-- -----------------------------------------------------------------------------
DELETE FROM public.fp_var_thong_bao_cai_dat AS moi
WHERE moi.module_id LIKE 'quan-ly-nha-so-che/%'
  AND EXISTS (
    SELECT 1 FROM public.fp_var_thong_bao_cai_dat AS cu
    WHERE cu.module_id = 'quan-ly-farm/' || split_part(moi.module_id, '/', 2)
      AND cu.nhan_vien_id = moi.nhan_vien_id
      AND cu.loai_su_kien = moi.loai_su_kien
  );

UPDATE public.fp_var_thong_bao_cai_dat
SET module_id = 'quan-ly-nha-so-che/' || split_part(module_id, '/', 2)
WHERE module_id LIKE 'quan-ly-farm/%';

-- -----------------------------------------------------------------------------
-- 3) Thông báo đã gửi: module_id dùng cho chip lọc theo module, link dùng để
--    điều hướng khi bấm vào thông báo (link là snapshot tại lúc tạo).
-- -----------------------------------------------------------------------------
UPDATE public.fp_var_thong_bao
SET module_id = 'quan-ly-nha-so-che/' || split_part(module_id, '/', 2)
WHERE module_id LIKE 'quan-ly-farm/%';

UPDATE public.fp_var_thong_bao
SET link = replace(link, '/quan-ly-farm/', '/quan-ly-nha-so-che/')
WHERE link LIKE '%/quan-ly-farm/%';

-- -----------------------------------------------------------------------------
-- 4) Outbox sự kiện (tự dọn sau 30 ngày, nhưng sự kiện chưa xử lý phải đúng mã).
-- -----------------------------------------------------------------------------
UPDATE public.fp_var_su_kien_thong_bao
SET module_id = 'quan-ly-nha-so-che/' || split_part(module_id, '/', 2)
WHERE module_id LIKE 'quan-ly-farm/%';

-- -----------------------------------------------------------------------------
-- 5) Hai trigger truyền module_id qua TG_ARGV — giá trị cố định hoá trong định
--    nghĩa trigger, ALTER TRIGGER không đổi được nên phải DROP + CREATE lại.
--    Giữ đồng bộ với docs/supabase-trigger_thong_bao_7_module.sql.
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_thong_bao_fp_farm_de_xuat_mua_hang ON public.fp_farm_de_xuat_mua_hang;
CREATE TRIGGER tr_thong_bao_fp_farm_de_xuat_mua_hang
  AFTER INSERT OR UPDATE ON public.fp_farm_de_xuat_mua_hang
  FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('quan-ly-nha-so-che/de-xuat-mua-hang', 'trang_thai');

DROP TRIGGER IF EXISTS tr_thong_bao_fp_farm_phieu_kho_phan_thuoc ON public.fp_farm_phieu_kho_phan_thuoc;
CREATE TRIGGER tr_thong_bao_fp_farm_phieu_kho_phan_thuoc
  AFTER INSERT OR UPDATE ON public.fp_farm_phieu_kho_phan_thuoc
  FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('quan-ly-nha-so-che/phieu-kho-phan-thuoc', 'trang_thai');

COMMIT;

-- =============================================================================
-- Đối chiếu sau khi chạy — mọi cột con_lai phải bằng 0.
-- =============================================================================
SELECT 'fp_var_phan_quyen'          AS bang,
       count(*) FILTER (WHERE module_id LIKE 'quan-ly-farm/%')      AS con_lai,
       count(*) FILTER (WHERE module_id LIKE 'quan-ly-nha-so-che/%') AS da_doi
FROM public.fp_var_phan_quyen
UNION ALL
SELECT 'fp_var_thong_bao_cai_dat',
       count(*) FILTER (WHERE module_id LIKE 'quan-ly-farm/%'),
       count(*) FILTER (WHERE module_id LIKE 'quan-ly-nha-so-che/%')
FROM public.fp_var_thong_bao_cai_dat
UNION ALL
SELECT 'fp_var_thong_bao',
       count(*) FILTER (WHERE module_id LIKE 'quan-ly-farm/%' OR link LIKE '%/quan-ly-farm/%'),
       count(*) FILTER (WHERE module_id LIKE 'quan-ly-nha-so-che/%')
FROM public.fp_var_thong_bao
UNION ALL
SELECT 'fp_var_su_kien_thong_bao',
       count(*) FILTER (WHERE module_id LIKE 'quan-ly-farm/%'),
       count(*) FILTER (WHERE module_id LIKE 'quan-ly-nha-so-che/%')
FROM public.fp_var_su_kien_thong_bao;
