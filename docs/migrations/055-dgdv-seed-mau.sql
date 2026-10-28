-- =============================================================================
-- 055-dgdv-seed-mau.sql — DỮ LIỆU MẪU để thử module Đánh giá đầu vào (KHÔNG phải dữ liệu thật)
--
-- 4 phiếu: năm 2026 tuần 42 + 43 × Farm fp1 (id 1) + Farm fp2 (id 2), ghi chú bắt đầu «[DỮ LIỆU MẪU]».
-- Hai chi nhánh này chưa có Báo cáo sơ chế / Dự báo SL đóng thùng → trigger đồng bộ của 052 không
-- đè số thật nào (kiểm lại trước khi chạy nếu chạy muộn: phần KIỂM TRA TRƯỚC bên dưới).
-- Mỗi phiếu: 3 cột dây (1 màu / 2 màu / xé đôi), 3–4 lô, 2–3 tổ trưởng gõ tay, số buồng T2–T7,
-- vài ô có đánh giá / số lỗi + lý do (có lý do gõ tự do chưa có trong danh mục), đứt dây; lô đầu có
-- 2 dòng ở vài ngày. Phiếu tuần 42 FP1 để trạng thái «đã khoá».
-- Lô chưa có trong danh mục được tạo với ghi_chu '[MẪU]'.
--
-- Chạy được nhiều lần: phiếu mẫu đã có (cùng tuần + chi nhánh) thì bỏ qua.
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/055-dgdv-seed-mau.sql
--
-- KIỂM TRA TRƯỚC (kỳ vọng 0 | 0):
--   SELECT (SELECT count(*) FROM fp_farm_bao_cao_so_che WHERE id_chi_nhanh IN (1, 2)),
--          (SELECT count(*) FROM fp_farm_du_bao_sl_dong_thung WHERE id_chi_nhanh IN (1, 2));
--
-- XOÁ DỮ LIỆU MẪU khi thử xong (phiếu xoá cascade cột / lô / ô):
--   BEGIN;
--   DELETE FROM fp_farm_dgdv WHERE ghi_chu LIKE '[DỮ LIỆU MẪU]%';
--   DELETE FROM fp_var_lo_thu_hoach l WHERE l.ghi_chu = '[MẪU]'
--     AND NOT EXISTS (SELECT 1 FROM fp_farm_dgdv_lo pl WHERE pl.id_lo = l.id);
--   COMMIT;
-- =============================================================================

BEGIN;

DO $$
DECLARE
  -- chi nhánh | tuần | khoá | danh sách lô «tên:tổ trưởng»
  ph record;
  v_dau date;
  v_phieu bigint;
  v_cot bigint[];
  v_lo bigint;
  v_id_lo bigint;
  v_ten text;
  v_tt text;
  i int;
  c int;
  d int;
  k int;
  v_dg text[] := ARRAY['Thiếu lá', 'Chín xanh', 'Rệp sáp', 'Trầy xước'];
  v_loi text[] := ARRAY['Chín bệnh', 'Thối cuống', 'Gãy buồng'];
  v_mau int[][] := ARRAY[[1, 0, 0], [3, 4, 0], [5, 0, 1]];  -- màu 1, màu 2 (0 = không), xé đôi
BEGIN
  FOR ph IN
    SELECT * FROM (VALUES
      (1::bigint, 42, true,  ARRAY['A1-1:Võ Thị Cưng', 'A1-2:Phạm Đức Đạt', 'B2-1:Võ Thị Cưng', 'B2-2:Nguyễn Văn Bé']),
      (1::bigint, 43, false, ARRAY['A1-1:Võ Thị Cưng', 'A1-2:Phạm Đức Đạt', 'B2-1:Võ Thị Cưng', 'B2-2:Nguyễn Văn Bé']),
      (2::bigint, 42, false, ARRAY['C1-1:Trần Thị Lan', 'C1-2:Lê Văn Hùng', 'C2-1:Trần Thị Lan']),
      (2::bigint, 43, false, ARRAY['C1-1:Trần Thị Lan', 'C1-2:Lê Văn Hùng', 'C2-1:Trần Thị Lan'])
    ) AS t(cn, tuan, khoa, lo)
  LOOP
    IF EXISTS (SELECT 1 FROM fp_farm_dgdv WHERE nam = 2026 AND tuan = ph.tuan AND id_chi_nhanh = ph.cn) THEN
      RAISE NOTICE 'Bỏ qua: đã có phiếu tuần %/2026 chi nhánh %', ph.tuan, ph.cn;
      CONTINUE;
    END IF;

    v_dau := fn_dgdv_ngay_dau_tuan(2026, ph.tuan);
    INSERT INTO fp_farm_dgdv (nam, tuan, id_chi_nhanh, ghi_chu, trang_thai)
    VALUES (2026, ph.tuan, ph.cn, '[DỮ LIỆU MẪU] Phiếu thử — xoá được bằng lệnh ở cuối docs/migrations/055-dgdv-seed-mau.sql', 'mo')
    RETURNING id INTO v_phieu;

    -- Cột dây: cột c chích bắp lùi (10 + c - 1) tuần → thu hoạch tuần của phiếu, cột sau lệch thêm 1 tuần.
    v_cot := ARRAY[]::bigint[];
    FOR c IN 1..3 LOOP
      INSERT INTO fp_farm_dgdv_cot (id_phieu, stt, chich_bap_tu, chich_bap_den, thu_hoach_tu, thu_hoach_den, id_mau_1, id_mau_2, xe_doi)
      VALUES (v_phieu, c,
              v_dau - 70 - (c - 1) * 7, v_dau - 64 - (c - 1) * 7,
              v_dau - (c - 1) * 7, v_dau + 6 - (c - 1) * 7,
              v_mau[c][1], NULLIF(v_mau[c][2], 0), v_mau[c][3] = 1)
      RETURNING id INTO v_lo;
      v_cot := v_cot || v_lo;
    END LOOP;

    FOR i IN 1..array_length(ph.lo, 1) LOOP
      v_ten := split_part(ph.lo[i], ':', 1);
      v_tt := split_part(ph.lo[i], ':', 2);
      SELECT id INTO v_id_lo FROM fp_var_lo_thu_hoach WHERE id_chi_nhanh = ph.cn AND lower(ten_lo) = lower(v_ten);
      IF v_id_lo IS NULL THEN
        INSERT INTO fp_var_lo_thu_hoach (ten_lo, id_chi_nhanh, to_truong, ghi_chu, thu_tu)
        VALUES (v_ten, ph.cn, v_tt, '[MẪU]', i)
        RETURNING id INTO v_id_lo;
      END IF;

      INSERT INTO fp_farm_dgdv_lo (id_phieu, id_lo, to_truong, ghi_chu, stt)
      VALUES (v_phieu, v_id_lo, v_tt, CASE WHEN i = 2 THEN 'Lô dốc, buồng nhỏ' END, i)
      RETURNING id INTO v_lo;

      FOR d IN 0..5 LOOP  -- T2 … T7
        FOR c IN 1..3 LOOP
          k := i * 7 + c * 5 + d * 3 + ph.tuan;
          INSERT INTO fp_farm_dgdv_dong (id_phieu_lo, id_cot, ngay, stt_dong, so_luong, danh_gia, so_luong_loi, ly_do_loi)
          VALUES (v_lo, v_cot[c], v_dau + d, 1,
                  10 + k % 41,
                  CASE WHEN k % 5 = 0 THEN v_dg[1 + k % 4] END,
                  CASE WHEN k % 7 = 0 THEN 1 + k % 3 ELSE 0 END,
                  CASE WHEN k % 7 = 0 THEN v_loi[1 + k % 3] END);
        END LOOP;
        -- Lô đầu: thêm dòng thứ 2 ở cột 1 vào T3, T5.
        IF i = 1 AND d IN (1, 3) THEN
          INSERT INTO fp_farm_dgdv_dong (id_phieu_lo, id_cot, ngay, stt_dong, so_luong, danh_gia)
          VALUES (v_lo, v_cot[1], v_dau + d, 2, 6 + d, 'Thiếu lá');
        END IF;
        -- Đứt dây ở lô thứ 2 vào T2, T4.
        IF i = 2 AND d IN (0, 2) THEN
          INSERT INTO fp_farm_dgdv_lo_ngay (id_phieu_lo, ngay, dut_day) VALUES (v_lo, v_dau + d, 2 + d);
        END IF;
      END LOOP;
    END LOOP;

    IF ph.khoa THEN
      UPDATE fp_farm_dgdv SET trang_thai = 'khoa' WHERE id = v_phieu;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- Kiểm tra sau khi chạy:
--   SELECT p.id, p.tuan, p.id_chi_nhanh, p.trang_thai, t.ngay, s.tong_thu, s.ksc
--   FROM fp_farm_dgdv p
--   CROSS JOIN LATERAL generate_series(fn_dgdv_ngay_dau_tuan(p.nam, p.tuan), fn_dgdv_ngay_dau_tuan(p.nam, p.tuan) + 5, '1 day') t(ngay)
--   CROSS JOIN LATERAL fn_dgdv_tong_ngay(t.ngay::date, p.id_chi_nhanh) s
--   WHERE p.ghi_chu LIKE '[DỮ LIỆU MẪU]%' ORDER BY p.id, t.ngay;
