-- 051: Hợp đồng mua hàng — tách đợt cọc và ghi vết trừ cọc trên từng đợt thanh toán theo số cây.
-- Nghiệp vụ: HĐ 60.000 cây × 9.500 = 570tr. Đợt 1 cọc 170tr (0 cây). Đợt 2 nhận 20.000 cây → giá trị 190tr, thực trả 190tr.
-- Đợt 3 nhận 40.000 cây → giá trị 380tr, trừ cọc 170tr → thực trả 210tr. Tổng thực trả 570tr.
-- so_tien GIỮ nghĩa tiền thực chi của đợt → mọi tổng hiện có (view v_hop_dong_summary, báo cáo, xuất file) không đổi.
-- Không đụng quyền / view. Trigger nhật ký (016) đã có trên bảng → cột mới tự vào nhật ký.

BEGIN;

ALTER TABLE public.fp_mh_hop_dong_ct
  ADD COLUMN IF NOT EXISTS loai_dot text NOT NULL DEFAULT 'thanh_toan';

ALTER TABLE public.fp_mh_hop_dong_ct
  DROP CONSTRAINT IF EXISTS fp_mh_hop_dong_ct_loai_dot_check;
ALTER TABLE public.fp_mh_hop_dong_ct
  ADD CONSTRAINT fp_mh_hop_dong_ct_loai_dot_check CHECK (loai_dot IN ('coc', 'thanh_toan'));

ALTER TABLE public.fp_mh_hop_dong_ct
  ADD COLUMN IF NOT EXISTS tien_tru_coc numeric(18,2) NOT NULL DEFAULT 0;

ALTER TABLE public.fp_mh_hop_dong_ct
  DROP CONSTRAINT IF EXISTS fp_mh_hop_dong_ct_tien_tru_coc_check;
ALTER TABLE public.fp_mh_hop_dong_ct
  ADD CONSTRAINT fp_mh_hop_dong_ct_tien_tru_coc_check CHECK (tien_tru_coc >= 0);

COMMENT ON COLUMN public.fp_mh_hop_dong_ct.loai_dot IS
  'Loại đợt: coc = tiền cọc (0 cây), thanh_toan = thanh toán theo số cây thực nhận';
COMMENT ON COLUMN public.fp_mh_hop_dong_ct.tien_tru_coc IS
  'Tiền cọc khấu trừ vào đợt thanh toán này; so_tien = giá trị hàng (số cây × đơn giá) − tien_tru_coc';

-- Dòng cũ: đợt không nhận cây mà tên có chữ "cọc" coi là đợt cọc.
UPDATE public.fp_mh_hop_dong_ct
   SET loai_dot = 'coc'
 WHERE coalesce(so_cay_thuc_nhan, 0) = 0
   AND ten_dot ILIKE '%cọc%';

NOTIFY pgrst, 'reload schema';

COMMIT;
