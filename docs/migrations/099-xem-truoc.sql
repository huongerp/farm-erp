-- =============================================================================
-- 099-xem-truoc.sql — CHỈ ĐỌC. Đối chiếu trước khi chạy migration 099:
-- mỗi tên trong danh mục Báo cáo nhân công sẽ gắn vào ai / tạo mới, ở những chi nhánh nào.
--
-- Xuất CSV:
--   bash scripts/db-sql.sh --csv -f docs/migrations/099-xem-truoc.sql > backup/099-xem-truoc.csv
-- =============================================================================
WITH s AS (
  SELECT s.id, s.id_chi_nhanh, s.dang_dung,
         regexp_replace(btrim(s.ho_ten), '\s+', ' ', 'g')        AS ten_gon,
         lower(regexp_replace(btrim(s.ho_ten), '\s+', ' ', 'g')) AS khoa
    FROM public.fp_var_nhan_vien_so_che s
),
n AS (
  SELECT DISTINCT ON (khoa) id, ho_va_ten, trang_thai, chi_nhanh_ids, khoa
    FROM (SELECT id, ho_va_ten, trang_thai, chi_nhanh_ids,
                 lower(regexp_replace(btrim(ho_va_ten), '\s+', ' ', 'g')) AS khoa
            FROM public.fp_var_nhan_vien
           WHERE ho_va_ten IS NOT NULL AND btrim(ho_va_ten) <> '') x
   ORDER BY khoa, (trang_thai = 'Đang làm việc') DESC, id
)
SELECT CASE WHEN n.id IS NULL THEN 'TẠO MỚI' ELSE 'GẮN NGƯỜI CÓ SẴN' END       AS hanh_dong,
       coalesce(n.ho_va_ten, min(initcap(s.ten_gon)))                          AS ho_ten_danh_sach_nv,
       n.id                                                                     AS id_nhan_vien_co_san,
       string_agg(DISTINCT s.ten_gon, ' / ')                                    AS cach_viet_trong_bcnc,
       string_agg(DISTINCT c.ten_chi_nhanh, ', ')                               AS chi_nhanh_bcnc,
       CASE WHEN n.id IS NULL THEN NULL
            ELSE string_agg(DISTINCT c.ten_chi_nhanh, ', ')
                   FILTER (WHERE NOT (s.id_chi_nhanh::text = ANY (coalesce(n.chi_nhanh_ids, '{}'::text[]))))
       END                                                                      AS chi_nhanh_them_vao,
       coalesce(n.trang_thai,
                CASE WHEN bool_or(s.dang_dung) THEN 'Đang làm việc' ELSE 'Nghỉ việc' END) AS trang_thai,
       count(*)                                                                 AS so_dong_bcnc
  FROM s
  LEFT JOIN n USING (khoa)
  JOIN public.fp_var_chi_nhanh c ON c.id = s.id_chi_nhanh
 GROUP BY s.khoa, n.id, n.ho_va_ten, n.trang_thai, n.chi_nhanh_ids
 ORDER BY hanh_dong, ho_ten_danh_sach_nv;
