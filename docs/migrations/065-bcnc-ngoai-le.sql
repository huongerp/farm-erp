-- Báo cáo nhân công: Ngoại lệ – Ngoài lô.
-- Chỉ giữ người, vị trí và buổi đi làm trong _nv; không sinh số liệu _ct/_ct_sub cho KPI.
-- Chạy TRƯỚC frontend mới, sau khi duyệt migration:
--   bash scripts/db-backup.sh truoc-065
--   bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/065-bcnc-ngoai-le.sql
BEGIN;

ALTER TABLE public.fp_farm_bao_cao_nhan_cong_ct
  DROP CONSTRAINT fp_farm_bcnc_ct_loai_chk,
  ADD CONSTRAINT fp_farm_bcnc_ct_loai_chk CHECK (loai_chuyen = ANY (ARRAY[
    'XAN_NAI', 'TIA_DANH_GIA', 'CAN_TEM_DONG_THUNG', 'KHO_HUT_CHAN_KHONG',
    'CONG_TANG_CUONG', 'CONG_DINH_BIEN_KHONG_SAN_XUAT', 'NGOAI_LE'])),
  ADD CONSTRAINT fp_farm_bcnc_ct_ngoai_le_zero CHECK (
    loai_chuyen <> 'NGOAI_LE' OR
    (sl_cong_ngay = 0 AND sl_cong_nua = 0 AND sl_tang_ca = 0 AND so_gio_tc = 0)
  );

ALTER TABLE public.fp_var_nhan_vien_so_che
  DROP CONSTRAINT fp_var_nvsc_loai_chuyen_chk,
  ADD CONSTRAINT fp_var_nvsc_loai_chuyen_chk CHECK (loai_chuyen IS NULL OR loai_chuyen = ANY (ARRAY[
    'XAN_NAI', 'TIA_DANH_GIA', 'CAN_TEM_DONG_THUNG', 'KHO_HUT_CHAN_KHONG',
    'CONG_TANG_CUONG', 'CONG_DINH_BIEN_KHONG_SAN_XUAT', 'NGOAI_LE']));

-- Chặn cả ghi trực tiếp ngoài frontend: Ngoại lệ không được có giờ hoặc dòng sub.
-- Đồng thời chặn đổi chuyền đang có giờ/sub sang Ngoại lệ mà chưa dọn số liệu.
CREATE FUNCTION public.fn_bcnc_ngoai_le_khong_tinh_gio() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_loai text;
BEGIN
  IF TG_TABLE_NAME = 'fp_farm_bao_cao_nhan_cong_ct' THEN
    IF NEW.loai_chuyen = 'NGOAI_LE' AND (
      EXISTS (SELECT 1 FROM public.fp_farm_bao_cao_nhan_cong_ct_sub WHERE id_bcnc_ct = NEW.id)
      OR EXISTS (SELECT 1 FROM public.fp_farm_bao_cao_nhan_cong_nv
        WHERE id_bcnc_ct = NEW.id AND (so_gio_cong <> 0 OR so_gio_tc <> 0))
    ) THEN
      RAISE EXCEPTION 'Ngoại lệ chỉ chấm sáng/chiều, không tính giờ hoặc KPI sơ chế.';
    END IF;
  ELSE
    SELECT loai_chuyen INTO v_loai FROM public.fp_farm_bao_cao_nhan_cong_ct
      WHERE id = NEW.id_bcnc_ct;
    IF v_loai = 'NGOAI_LE' THEN
      IF TG_TABLE_NAME = 'fp_farm_bao_cao_nhan_cong_ct_sub' THEN
        RAISE EXCEPTION 'Ngoại lệ không được có số liệu giờ công hoặc tăng ca.';
      ELSIF NEW.so_gio_cong <> 0 OR NEW.so_gio_tc <> 0 THEN
        RAISE EXCEPTION 'Nhân sự Ngoại lệ chỉ chấm sáng/chiều, không nhập giờ.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_bcnc_ngoai_le_khong_tinh_gio() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_bcnc_ngoai_le_khong_tinh_gio() TO authenticated;

CREATE TRIGGER trg_bcnc_ngoai_le_khong_tinh_gio BEFORE INSERT OR UPDATE
  ON public.fp_farm_bao_cao_nhan_cong_ct
  FOR EACH ROW EXECUTE FUNCTION public.fn_bcnc_ngoai_le_khong_tinh_gio();
CREATE TRIGGER trg_bcnc_ngoai_le_khong_tinh_gio BEFORE INSERT OR UPDATE
  ON public.fp_farm_bao_cao_nhan_cong_ct_sub
  FOR EACH ROW EXECUTE FUNCTION public.fn_bcnc_ngoai_le_khong_tinh_gio();
CREATE TRIGGER trg_bcnc_ngoai_le_khong_tinh_gio BEFORE INSERT OR UPDATE
  ON public.fp_farm_bao_cao_nhan_cong_nv
  FOR EACH ROW EXECUTE FUNCTION public.fn_bcnc_ngoai_le_khong_tinh_gio();

COMMIT;
NOTIFY pgrst, 'reload schema';
