-- 022: v_farm_ton_kho_phan_thuoc giữ cả dòng tồn = 0 (bỏ HAVING sum <> 0).
-- Lý do: hàng đã phát sinh ở một kho rồi xuất hết vẫn phải hiện ở kho đó để báo đỏ dưới định mức
-- (định mức thêm ở migration 021). App tự lọc dòng 0 ở chỗ không cần (báo cáo NXT, tab tồn với
-- hàng không đặt định mức). Cột giữ nguyên → CREATE OR REPLACE, GRANT/COMMENT giữ nguyên.

CREATE OR REPLACE VIEW public.v_farm_ton_kho_phan_thuoc WITH (security_invoker='true') AS
 SELECT id_kho,
    id_hang_hoa,
    (sum(delta))::numeric(18,4) AS so_luong
   FROM ( SELECT pk.kho_id AS id_kho,
            ct.id_hang_hoa,
            ct.so_luong AS delta
           FROM (public.fp_farm_phieu_kho_phan_thuoc pk
             JOIN public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ((ct.id_phieu_kho = pk.id)))
          WHERE ((pk.loai = 'nhập'::text) AND (pk.trang_thai <> 'Không duyệt'::text))
        UNION ALL
         SELECT pk.kho_id,
            ct.id_hang_hoa,
            (- ct.so_luong)
           FROM (public.fp_farm_phieu_kho_phan_thuoc pk
             JOIN public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ((ct.id_phieu_kho = pk.id)))
          WHERE ((pk.loai = 'xuất'::text) AND (pk.trang_thai <> 'Không duyệt'::text))
        UNION ALL
         SELECT pk.kho_id,
            ct.id_hang_hoa,
            (- ct.so_luong)
           FROM (public.fp_farm_phieu_kho_phan_thuoc pk
             JOIN public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ((ct.id_phieu_kho = pk.id)))
          WHERE ((pk.loai = 'chuyển'::text) AND (pk.kho_den_id IS NOT NULL) AND (pk.trang_thai <> 'Không duyệt'::text))
        UNION ALL
         SELECT pk.kho_den_id,
            ct.id_hang_hoa,
            ct.so_luong
           FROM (public.fp_farm_phieu_kho_phan_thuoc pk
             JOIN public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ((ct.id_phieu_kho = pk.id)))
          WHERE ((pk.loai = 'chuyển'::text) AND (pk.kho_den_id IS NOT NULL) AND (pk.trang_thai <> 'Không duyệt'::text))) t
  GROUP BY id_kho, id_hang_hoa;

COMMENT ON VIEW public.v_farm_ton_kho_phan_thuoc IS
  'Tồn kho phân thuốc theo kho × hàng (tức thời) — gồm cả dòng tồn 0 của hàng đã phát sinh ở kho';

NOTIFY pgrst, 'reload schema';
