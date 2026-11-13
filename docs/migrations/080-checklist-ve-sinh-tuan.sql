-- =============================================================================
-- 080-checklist-ve-sinh-tuan.sql — Checklist công đoạn: phiếu VỆ SINH TUẦN (đợt 2 của 073)
--
-- Mẫu loai = 've_sinh_tuan': phiếu theo TUẦN (ngay = thứ Hai), mỗi hạng mục là một dòng có lưới
-- T2–CN; chỉ tích được những ngày có lịch theo tần suất của hạng mục mẫu (tan_suat jsonb):
--   NULL / {"kieu":"hang_ngay"}         → T2..CN
--   {"kieu":"thu","thu":[2,4,6]}        → các thứ đó (2..7 = T2..T7, 8 = CN)
--   {"kieu":"cuoi_thang","thu":7}       → chỉ tuần có T7 cuối cùng của tháng
-- Khớp features/quan-ly-nha-so-che/checklist-ban-giao/core/ve-sinh-tuan.ts.
--
-- Dùng lại nguyên luồng / quyền / RPC của 073: kết quả từng ngày lưu ở dòng (kq_ngay jsonb),
-- trigger tự tính kq_thuc_hien của dòng (đủ ngày có lịch → Đạt, có ngày K.Đạt → K.Đạt, thiếu →
-- NULL). Vì vậy rpc_cl_chuyen (đếm kq_thuc_hien NULL, K.Đạt thiếu khắc phục), cờ «từng Không
-- đạt» (076), khâu kiểm tra lại theo dòng giữ nguyên.
--
-- Ghi ô ngày: rpc_cl_vs_tich (SECURITY INVOKER → RLS + trigger khoá 073 vẫn áp dụng).
-- Hạng mục không có ngày nào trong tuần (vd «T7 cuối tháng» ở tuần giữa tháng) không tạo dòng.
--
-- Chạy lại được. Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/080-checklist-ve-sinh-tuan.sql
-- =============================================================================

BEGIN;

-- 1) Cột mới ---------------------------------------------------------------------------
ALTER TABLE public.fp_farm_cl_phieu
  ADD COLUMN IF NOT EXISTS loai text NOT NULL DEFAULT 'ban_giao';
ALTER TABLE public.fp_farm_cl_phieu DROP CONSTRAINT IF EXISTS fp_farm_cl_phieu_loai_check;
ALTER TABLE public.fp_farm_cl_phieu ADD CONSTRAINT fp_farm_cl_phieu_loai_check
  CHECK (loai = ANY (ARRAY['ban_giao'::text, 've_sinh_tuan'::text]));
COMMENT ON COLUMN public.fp_farm_cl_phieu.loai IS
  'Ảnh chụp loai của mẫu lúc tạo phiếu. ve_sinh_tuan: ngay = thứ Hai đầu tuần, dòng có lưới T2–CN';

ALTER TABLE public.fp_farm_cl_phieu_dong
  ADD COLUMN IF NOT EXISTS tan_suat jsonb,
  ADD COLUMN IF NOT EXISTS ngay_lich smallint[],
  ADD COLUMN IF NOT EXISTS kq_ngay jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.fp_farm_cl_phieu_dong.tan_suat IS 'Phiếu vệ sinh tuần: ảnh chụp tần suất hạng mục mẫu';
COMMENT ON COLUMN public.fp_farm_cl_phieu_dong.ngay_lich IS
  'Phiếu vệ sinh tuần: các thứ có lịch trong tuần (2..8). NULL = phiếu bàn giao thường';
COMMENT ON COLUMN public.fp_farm_cl_phieu_dong.kq_ngay IS
  'Phiếu vệ sinh tuần: {"2":"dat","4":"khong_dat"} — kq_thuc_hien do trigger tính từ đây';

COMMENT ON COLUMN public.fp_farm_cl_mau.loai IS 'ban_giao: phiếu 2 cột tích theo ngày | ve_sinh_tuan: phiếu tuần, lưới T2–CN (080)';
COMMENT ON COLUMN public.fp_farm_cl_mau_hang_muc.tan_suat IS
  'Mẫu ve_sinh_tuan: NULL/{"kieu":"hang_ngay"} | {"kieu":"thu","thu":[2..8]} | {"kieu":"cuoi_thang","thu":2..8}';

-- 2) Lịch trong tuần ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_cl_vs_lich(p_tan_suat jsonb, p_tuan date) RETURNS smallint[]
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  v_kieu text := coalesce(p_tan_suat->>'kieu', 'hang_ngay');
  v_thu int;
  v_ngay date;
BEGIN
  IF v_kieu = 'thu' AND jsonb_typeof(p_tan_suat->'thu') = 'array' THEN
    RETURN coalesce((SELECT array_agg(DISTINCT x::smallint ORDER BY x::smallint)
                       FROM jsonb_array_elements_text(p_tan_suat->'thu') x
                      WHERE x ~ '^[2-8]$'), '{}');
  ELSIF v_kieu = 'cuoi_thang' THEN
    v_thu := CASE WHEN (p_tan_suat->>'thu') ~ '^[2-8]$' THEN (p_tan_suat->>'thu')::int END;
    IF v_thu IS NULL THEN RETURN '{}'; END IF;
    v_ngay := p_tuan + (v_thu - 2);
    RETURN CASE WHEN extract(month FROM v_ngay + 7) <> extract(month FROM v_ngay)
                THEN ARRAY[v_thu::smallint] ELSE '{}'::smallint[] END;
  END IF;
  RETURN ARRAY[2, 3, 4, 5, 6, 7, 8]::smallint[];
END
$$;
COMMENT ON FUNCTION public.fn_cl_vs_lich(jsonb, date) IS
  'Các thứ (2..8) có lịch vệ sinh trong tuần bắt đầu p_tuan (thứ Hai) — khớp core/ve-sinh-tuan.ts lichVeSinh';

-- 3) Tạo phiếu: chụp loai, chuẩn ngày về thứ Hai; dòng chép tần suất + lịch -----------------
CREATE OR REPLACE FUNCTION public.fn_cl_phieu_truoc_khi_tao() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  m public.fp_farm_cl_mau%ROWTYPE;
BEGIN
  SELECT * INTO m FROM public.fp_farm_cl_mau WHERE id = NEW.id_mau;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy mẫu checklist %', NEW.id_mau USING ERRCODE = 'P0001';
  END IF;
  IF current_user = 'authenticated' AND NOT m.dang_dung THEN
    RAISE EXCEPTION 'Mẫu "%" đang ngừng dùng.', m.ten USING ERRCODE = 'P0001';
  END IF;
  NEW.so_phieu := coalesce(nullif(btrim(NEW.so_phieu), ''), 'CL-' || lpad(NEW.id::text, 5, '0'));
  NEW.ten_mau := m.ten;
  NEW.ma_mau := m.ma;
  NEW.loai := m.loai;
  IF m.loai = 've_sinh_tuan' THEN
    NEW.ngay := date_trunc('week', NEW.ngay)::date;
  END IF;
  NEW.ten_ben_thuc_hien := m.ten_ben_thuc_hien;
  NEW.ten_ben_kiem_tra := m.ten_ben_kiem_tra;
  NEW.chuc_vu_thuc_hien_ids := m.chuc_vu_thuc_hien_ids;
  NEW.chuc_vu_kiem_tra_ids := m.chuc_vu_kiem_tra_ids;
  NEW.co_ket_luan_van_hanh := m.co_ket_luan_van_hanh;
  NEW.id_nguoi_tao := coalesce(public.nhan_vien_hien_tai_id(), NEW.id_nguoi_tao);
  -- Phiếu mới luôn ở nháp; cột luồng chỉ RPC ghi.
  NEW.trang_thai := 'nhap';
  NEW.so_lan_tra_lai := 0;
  NEW.ly_do_tra_lai := NULL;
  NEW.id_nguoi_chuyen := NULL; NEW.tg_chuyen := NULL;
  NEW.id_nguoi_nhan := NULL;   NEW.tg_nhan := NULL;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION public.fn_cl_phieu_truoc_khi_tao() FROM PUBLIC, anon;

-- Bản 077 + tan_suat / ngay_lich; phiếu vệ sinh bỏ hạng mục không có ngày nào trong tuần.
CREATE OR REPLACE FUNCTION public.fn_cl_phieu_sau_khi_tao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_vs boolean := NEW.loai = 've_sinh_tuan';
BEGIN
  INSERT INTO public.fp_farm_cl_phieu_dong
    (id_phieu, id_hang_muc, ten_muc, thu_tu_muc, stt, doi_tuong, tieu_chuan, phuong_phap,
     quan_trong, ma_ts, so_luong, tan_suat_bao_duong, tan_suat, ngay_lich)
  SELECT NEW.id, hm.id, mm.ten, coalesce(mm.thu_tu, 0),
         row_number() OVER (ORDER BY coalesce(mm.thu_tu, 0), mm.id NULLS FIRST, hm.thu_tu, hm.id)::int,
         hm.doi_tuong, hm.tieu_chuan, hm.phuong_phap, hm.quan_trong,
         tb.ma_ts, tb.so_luong,
         (SELECT string_agg(v.noi_dung || coalesce(' (' || v.chu_ky_ngay || ' ngày)', ''), '; ' ORDER BY v.thu_tu, v.id)
            FROM public.fp_farm_bd_viec v WHERE v.id_thiet_bi = tb.id AND v.dang_dung),
         CASE WHEN v_vs THEN hm.tan_suat END,
         CASE WHEN v_vs THEN public.fn_cl_vs_lich(hm.tan_suat, NEW.ngay) END
    FROM public.fp_farm_cl_mau_hang_muc hm
    LEFT JOIN public.fp_farm_cl_mau_muc mm ON mm.id = hm.id_muc
    LEFT JOIN LATERAL (
      SELECT t2.* FROM public.fp_farm_bd_thiet_bi t0
        JOIN public.fp_farm_bd_thiet_bi t2 ON lower(trim(t2.ten)) = lower(trim(t0.ten))
       WHERE t0.id = hm.id_thiet_bi
         AND (t2.id_chi_nhanh = NEW.id_chi_nhanh OR (NEW.id_chi_nhanh IS NULL AND t2.id = t0.id))
         AND (t2.dang_dung OR t2.id = t0.id)
       ORDER BY (t2.id = t0.id) DESC, t2.thu_tu, t2.id
       LIMIT 1
    ) tb ON true
   WHERE hm.id_mau = NEW.id_mau AND hm.dang_dung
     AND (NOT v_vs OR cardinality(public.fn_cl_vs_lich(hm.tan_suat, NEW.ngay)) > 0);

  INSERT INTO public.fp_farm_cl_phieu_lich_su (id_phieu, hanh_dong, den_trang_thai, id_nguoi, ten_nguoi)
  SELECT NEW.id, 'tao', NEW.trang_thai, nv.id, nv.ho_va_ten
    FROM (SELECT public.nhan_vien_hien_tai_id() AS id) x
    LEFT JOIN public.fp_var_nhan_vien nv ON nv.id = x.id;
  RETURN NULL;
END
$$;
REVOKE ALL ON FUNCTION public.fn_cl_phieu_sau_khi_tao() FROM PUBLIC, anon;

-- 4) Phiếu vệ sinh: không đổi sang tuần khác (dòng đã chụp lịch theo tuần) ------------------
CREATE OR REPLACE FUNCTION public.fn_cl_phieu_vs_giu_tuan() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.loai = 've_sinh_tuan' AND NEW.ngay IS DISTINCT FROM OLD.ngay THEN
    IF date_trunc('week', NEW.ngay)::date <> OLD.ngay THEN
      RAISE EXCEPTION 'Phiếu vệ sinh tuần % không đổi sang tuần khác — huỷ phiếu và tạo phiếu mới cho tuần đó.', OLD.so_phieu
        USING ERRCODE = 'P0001';
    END IF;
    NEW.ngay := OLD.ngay;
  END IF;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION public.fn_cl_phieu_vs_giu_tuan() FROM PUBLIC, anon;
DROP TRIGGER IF EXISTS trg_cl_phieu_vs_giu_tuan ON public.fp_farm_cl_phieu;
CREATE TRIGGER trg_cl_phieu_vs_giu_tuan BEFORE UPDATE OF ngay ON public.fp_farm_cl_phieu
  FOR EACH ROW EXECUTE FUNCTION public.fn_cl_phieu_vs_giu_tuan();

-- 5) Khoá phiếu: bản 073 + cột loai không sửa tay ------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_cl_khoa_phieu() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF public.fn_cl_la_cap_cao() THEN RETURN OLD; END IF;
    IF OLD.trang_thai IN ('nhap', 'huy')
       AND public.fn_cl_la_ben_thuc_hien(OLD.chuc_vu_thuc_hien_ids, OLD.id_nguoi_tao) THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'Phiếu % đã chuyển đi — chỉ xoá được phiếu nháp / đã huỷ của khâu mình.', OLD.so_phieu
      USING ERRCODE = 'P0001';
  END IF;

  -- Cột luồng + ảnh chụp mẫu: chỉ RPC rpc_cl_* đổi (ghi lịch sử + thông báo).
  IF (NEW.trang_thai, NEW.so_lan_tra_lai, NEW.ly_do_tra_lai, NEW.id_nguoi_chuyen, NEW.tg_chuyen,
      NEW.id_nguoi_nhan, NEW.tg_nhan, NEW.id_mau, NEW.so_phieu, NEW.chuc_vu_thuc_hien_ids,
      NEW.chuc_vu_kiem_tra_ids, NEW.co_ket_luan_van_hanh, NEW.id_nguoi_tao, NEW.loai)
     IS DISTINCT FROM
     (OLD.trang_thai, OLD.so_lan_tra_lai, OLD.ly_do_tra_lai, OLD.id_nguoi_chuyen, OLD.tg_chuyen,
      OLD.id_nguoi_nhan, OLD.tg_nhan, OLD.id_mau, OLD.so_phieu, OLD.chuc_vu_thuc_hien_ids,
      OLD.chuc_vu_kiem_tra_ids, OLD.co_ket_luan_van_hanh, OLD.id_nguoi_tao, OLD.loai) THEN
    RAISE EXCEPTION 'Trạng thái phiếu chỉ đổi bằng nút Chuyển / Nhận / Trả lại.' USING ERRCODE = 'P0001';
  END IF;

  IF public.fn_cl_la_cap_cao() THEN
    RETURN NEW;
  END IF;

  IF OLD.trang_thai IN ('nhap', 'tra_lai')
     AND public.fn_cl_la_ben_thuc_hien(OLD.chuc_vu_thuc_hien_ids, OLD.id_nguoi_tao) THEN
    RETURN NEW;
  END IF;

  -- Khâu sau chỉ sửa kết luận / ý kiến khi phiếu đang chờ mình kiểm tra.
  IF OLD.trang_thai = 'cho_kiem_tra' AND public.fn_cl_la_ben_kiem_tra(OLD.chuc_vu_kiem_tra_ids)
     AND (NEW.ngay, NEW.ca, NEW.khu_vuc, NEW.day_chuyen, NEW.id_chi_nhanh, NEW.ghi_chu, NEW.ten_mau,
          NEW.ma_mau, NEW.ten_ben_thuc_hien, NEW.ten_ben_kiem_tra)
         IS NOT DISTINCT FROM
         (OLD.ngay, OLD.ca, OLD.khu_vuc, OLD.day_chuyen, OLD.id_chi_nhanh, OLD.ghi_chu, OLD.ten_mau,
          OLD.ma_mau, OLD.ten_ben_thuc_hien, OLD.ten_ben_kiem_tra) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Phiếu % đang ở trạng thái "%" — bạn không được sửa lúc này.', OLD.so_phieu, OLD.trang_thai
    USING ERRCODE = 'P0001';
END
$$;

-- 6) Khoá dòng: bản 073 + tan_suat/ngay_lich không sửa, kq_ngay tính là cột khâu làm ---------
CREATE OR REPLACE FUNCTION public.fn_cl_khoa_dong() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  p public.fp_farm_cl_phieu%ROWTYPE;
  v_doi_th boolean;
  v_doi_kt boolean;
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT * INTO p FROM public.fp_farm_cl_phieu WHERE id = COALESCE(NEW.id_phieu, OLD.id_phieu);
  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD); -- xoá dây chuyền theo phiếu
  END IF;
  IF public.fn_cl_la_cap_cao() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP <> 'UPDATE' THEN
    RAISE EXCEPTION 'Dòng checklist lấy từ mẫu — sửa mẫu rồi tạo phiếu mới, không thêm/xoá dòng tay.'
      USING ERRCODE = 'P0001';
  END IF;

  IF (NEW.id_phieu, NEW.id_hang_muc, NEW.ten_muc, NEW.thu_tu_muc, NEW.stt, NEW.doi_tuong, NEW.tieu_chuan,
      NEW.phuong_phap, NEW.quan_trong, NEW.ma_ts, NEW.so_luong, NEW.tan_suat_bao_duong, NEW.tan_suat, NEW.ngay_lich)
     IS DISTINCT FROM
     (OLD.id_phieu, OLD.id_hang_muc, OLD.ten_muc, OLD.thu_tu_muc, OLD.stt, OLD.doi_tuong, OLD.tieu_chuan,
      OLD.phuong_phap, OLD.quan_trong, OLD.ma_ts, OLD.so_luong, OLD.tan_suat_bao_duong, OLD.tan_suat, OLD.ngay_lich) THEN
    RAISE EXCEPTION 'Nội dung hạng mục lấy từ mẫu — không sửa trên phiếu.' USING ERRCODE = 'P0001';
  END IF;

  v_doi_th := (NEW.kq_thuc_hien, NEW.tinh_trang_khac_phuc, NEW.nguoi_xu_ly, NEW.ghi_chu, NEW.kq_ngay)
              IS DISTINCT FROM (OLD.kq_thuc_hien, OLD.tinh_trang_khac_phuc, OLD.nguoi_xu_ly, OLD.ghi_chu, OLD.kq_ngay);
  v_doi_kt := (NEW.kq_kiem_tra, NEW.ghi_chu_kiem_tra) IS DISTINCT FROM (OLD.kq_kiem_tra, OLD.ghi_chu_kiem_tra);

  IF v_doi_th AND NOT (p.trang_thai IN ('nhap', 'tra_lai')
                       AND public.fn_cl_la_ben_thuc_hien(p.chuc_vu_thuc_hien_ids, p.id_nguoi_tao)) THEN
    RAISE EXCEPTION 'Cột "%" chỉ khâu làm tích khi phiếu % còn nháp / bị trả lại.', p.ten_ben_thuc_hien, p.so_phieu
      USING ERRCODE = 'P0001';
  END IF;
  IF v_doi_kt AND NOT (p.trang_thai = 'cho_kiem_tra' AND public.fn_cl_la_ben_kiem_tra(p.chuc_vu_kiem_tra_ids)) THEN
    RAISE EXCEPTION 'Cột "%" chỉ khâu kiểm tra lại tích khi phiếu % đã được chuyển sang.', p.ten_ben_kiem_tra, p.so_phieu
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END
$$;

-- 7) Dòng vệ sinh: kiểm ô ngày + tính kq_thuc_hien --------------------------------------
-- Tên trigger bắt đầu «trg_cl_dong_a» để chạy TRƯỚC trg_cl_dong_tung_khong_dat (076) — trigger
-- BEFORE cùng bảng chạy theo thứ tự tên — nên cờ «từng Không đạt» thấy kq_thuc_hien đã tính.
CREATE OR REPLACE FUNCTION public.fn_cl_dong_vs_tinh_kq() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_khoa text;
  v_gt text;
  v_khong_dat boolean := false;
  v_thieu boolean := false;
  t smallint;
BEGIN
  NEW.kq_ngay := coalesce(NEW.kq_ngay, '{}'::jsonb);
  IF NEW.ngay_lich IS NULL THEN
    IF NEW.kq_ngay <> '{}'::jsonb THEN
      RAISE EXCEPTION 'Phiếu bàn giao không có ô theo ngày.' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
  END IF;

  IF jsonb_typeof(NEW.kq_ngay) <> 'object' THEN
    RAISE EXCEPTION 'Kết quả theo ngày sai dạng.' USING ERRCODE = 'P0001';
  END IF;
  FOR v_khoa, v_gt IN SELECT key, value #>> '{}' FROM jsonb_each(NEW.kq_ngay) LOOP
    IF v_khoa !~ '^[2-8]$' OR NOT (v_khoa::smallint = ANY (NEW.ngay_lich)) THEN
      RAISE EXCEPTION 'Hạng mục "%" không có lịch vào %.', NEW.doi_tuong,
        CASE v_khoa WHEN '8' THEN 'Chủ nhật' ELSE 'thứ ' || v_khoa END USING ERRCODE = 'P0001';
    END IF;
    IF v_gt IS NULL OR v_gt NOT IN ('dat', 'khong_dat') THEN
      RAISE EXCEPTION 'Kết quả ngày phải là Đạt / Không đạt.' USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  FOREACH t IN ARRAY NEW.ngay_lich LOOP
    v_gt := NEW.kq_ngay->>t::text;
    IF v_gt IS NULL THEN v_thieu := true;
    ELSIF v_gt = 'khong_dat' THEN v_khong_dat := true;
    END IF;
  END LOOP;
  NEW.kq_thuc_hien := CASE
    WHEN cardinality(NEW.ngay_lich) = 0 OR v_thieu THEN NULL
    WHEN v_khong_dat THEN 'khong_dat'
    ELSE 'dat' END;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION public.fn_cl_dong_vs_tinh_kq() FROM PUBLIC, anon;
DROP TRIGGER IF EXISTS trg_cl_dong_a_vs_tinh_kq ON public.fp_farm_cl_phieu_dong;
CREATE TRIGGER trg_cl_dong_a_vs_tinh_kq BEFORE INSERT OR UPDATE ON public.fp_farm_cl_phieu_dong
  FOR EACH ROW EXECUTE FUNCTION public.fn_cl_dong_vs_tinh_kq();

-- 8) RPC tích một ô ngày (đọc-sửa-ghi nguyên tử; INVOKER nên RLS + trg_cl_khoa_dong vẫn chặn) ---
CREATE OR REPLACE FUNCTION public.rpc_cl_vs_tich(p_id_dong bigint, p_thu integer, p_kq text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY INVOKER
    SET search_path TO 'public'
    AS $$
DECLARE
  r record;
BEGIN
  IF p_thu IS NULL OR p_thu < 2 OR p_thu > 8 THEN
    RAISE EXCEPTION 'Thứ không hợp lệ.' USING ERRCODE = 'P0001';
  END IF;
  IF p_kq IS NOT NULL AND p_kq NOT IN ('dat', 'khong_dat') THEN
    RAISE EXCEPTION 'Kết quả ngày phải là Đạt / Không đạt.' USING ERRCODE = 'P0001';
  END IF;
  UPDATE public.fp_farm_cl_phieu_dong
     SET kq_ngay = CASE WHEN p_kq IS NULL THEN kq_ngay - p_thu::text
                        ELSE kq_ngay || jsonb_build_object(p_thu::text, p_kq) END
   WHERE id = p_id_dong
  RETURNING kq_ngay, kq_thuc_hien, qlx_tung_khong_dat INTO r;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy dòng checklist hoặc bạn không có quyền.' USING ERRCODE = 'P0001';
  END IF;
  RETURN jsonb_build_object('kq_ngay', r.kq_ngay, 'kq_thuc_hien', r.kq_thuc_hien,
                            'qlx_tung_khong_dat', r.qlx_tung_khong_dat);
END
$$;
COMMENT ON FUNCTION public.rpc_cl_vs_tich(bigint, integer, text) IS
  'Phiếu vệ sinh tuần: đặt / xoá (p_kq NULL) kết quả một ngày của dòng; trả kq_ngay + kq_thuc_hien mới';
REVOKE ALL ON FUNCTION public.rpc_cl_vs_tich(bigint, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_cl_vs_tich(bigint, integer, text) TO authenticated;
REVOKE ALL ON FUNCTION public.fn_cl_vs_lich(jsonb, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_cl_vs_lich(jsonb, date) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
