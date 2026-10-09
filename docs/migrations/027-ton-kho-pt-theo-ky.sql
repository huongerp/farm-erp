-- =============================================================================
-- 027-ton-kho-pt-theo-ky.sql — Tồn kho phân thuốc theo khoảng ngày (kho × hàng)
--
-- Màn Tồn kho Nhà sơ chế có chip "Từ ngày – Đến ngày": mỗi ô kho × hàng trả tồn đầu kỳ, nhập,
-- xuất, chuyển đến, chuyển đi, tồn cuối kỳ. Thay cách cũ tải toàn bộ lịch sử phiếu về trình duyệt.
--
-- Luật biến động giống view v_farm_ton_kho_phan_thuoc (022):
--   nhập  → +kho_id      xuất → −kho_id      chuyển (có kho_den_id) → −kho_id, +kho_den_id
--   Phiếu 'Không duyệt' không tính. p_chi_da_duyet = true → chỉ tính phiếu 'Đã duyệt'.
-- Kỳ: ngay < p_tu → tồn đầu; p_tu ≤ ngay ≤ p_den → phát sinh; ngay > p_den → bỏ.
--     p_tu NULL = không có tồn đầu (mọi phiếu ≤ p_den là phát sinh); p_den NULL = không chặn trên.
-- Bất biến: ton_dau + nhap − xuat + chuyen_den − chuyen_di = ton_cuoi.
-- Giữ cả dòng 0 (hàng đã phát sinh ở kho) để app vẫn báo đỏ dưới định mức — như 022.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-027
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/027-ton-kho-pt-theo-ky.sql
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.rpc_farm_ton_kho_pt_theo_ky(
    p_tu date,
    p_den date,
    p_chi_da_duyet boolean DEFAULT false
)
    RETURNS TABLE (
        id_kho bigint,
        id_hang_hoa bigint,
        ton_dau numeric,
        nhap numeric,
        xuat numeric,
        chuyen_den numeric,
        chuyen_di numeric,
        ton_cuoi numeric
    )
    LANGUAGE sql STABLE
    SET search_path TO 'public'
AS $$
    WITH phieu AS (
        SELECT pk.id, pk.ngay, pk.loai, pk.kho_id, pk.kho_den_id,
               (p_tu IS NOT NULL AND pk.ngay < p_tu) AS truoc_ky
        FROM fp_farm_phieu_kho_phan_thuoc pk
        WHERE pk.trang_thai <> 'Không duyệt'
          AND (NOT p_chi_da_duyet OR pk.trang_thai = 'Đã duyệt')
          AND (p_den IS NULL OR pk.ngay <= p_den)
          AND (pk.loai <> 'chuyển' OR pk.kho_den_id IS NOT NULL)
    ),
    mv AS (
        -- Một dòng biến động / kho: kind = nhap | xuat | chuyen_den | chuyen_di
        SELECT p.kho_id AS id_kho, ct.id_hang_hoa, p.truoc_ky, ct.so_luong AS sl,
               CASE p.loai WHEN 'nhập' THEN 'nhap' WHEN 'xuất' THEN 'xuat' ELSE 'chuyen_di' END AS kind
        FROM phieu p
        JOIN fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ct.id_phieu_kho = p.id
        UNION ALL
        SELECT p.kho_den_id, ct.id_hang_hoa, p.truoc_ky, ct.so_luong, 'chuyen_den'
        FROM phieu p
        JOIN fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ct.id_phieu_kho = p.id
        WHERE p.loai = 'chuyển'
    ),
    agg AS (
        SELECT mv.id_kho, mv.id_hang_hoa,
               COALESCE(sum(CASE WHEN mv.truoc_ky THEN
                   CASE WHEN mv.kind IN ('nhap', 'chuyen_den') THEN mv.sl ELSE -mv.sl END END), 0) AS ton_dau,
               COALESCE(sum(mv.sl) FILTER (WHERE NOT mv.truoc_ky AND mv.kind = 'nhap'), 0)       AS nhap,
               COALESCE(sum(mv.sl) FILTER (WHERE NOT mv.truoc_ky AND mv.kind = 'xuat'), 0)       AS xuat,
               COALESCE(sum(mv.sl) FILTER (WHERE NOT mv.truoc_ky AND mv.kind = 'chuyen_den'), 0) AS chuyen_den,
               COALESCE(sum(mv.sl) FILTER (WHERE NOT mv.truoc_ky AND mv.kind = 'chuyen_di'), 0)  AS chuyen_di
        FROM mv
        GROUP BY mv.id_kho, mv.id_hang_hoa
    )
    SELECT a.id_kho, a.id_hang_hoa,
           a.ton_dau::numeric(18,4), a.nhap::numeric(18,4), a.xuat::numeric(18,4),
           a.chuyen_den::numeric(18,4), a.chuyen_di::numeric(18,4),
           (a.ton_dau + a.nhap - a.xuat + a.chuyen_den - a.chuyen_di)::numeric(18,4)
    FROM agg a
$$;

COMMENT ON FUNCTION public.rpc_farm_ton_kho_pt_theo_ky(date, date, boolean) IS
  'Tồn kho phân thuốc theo kỳ (kho × hàng): tồn đầu, nhập, xuất, chuyển đến/đi, tồn cuối — màn Tồn kho Nhà sơ chế';

REVOKE ALL ON FUNCTION public.rpc_farm_ton_kho_pt_theo_ky(date, date, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_farm_ton_kho_pt_theo_ky(date, date, boolean) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
