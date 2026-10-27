-- 053-dgdv-quyen-theo-bao-cao-so-che.sql — Đánh giá đầu vào: quyền app chép y nguyên «Báo cáo sơ chế»
-- 052 đã seed quyền theo «Thu hoạch»; người nhập Đánh giá đầu vào là người làm Báo cáo sơ chế
-- (số buồng thu / không sơ chế liên kết sang đó) nên dùng cùng bộ quyền. Ghi đè quyền đã seed ở 052.
BEGIN;

INSERT INTO public.fp_var_phan_quyen (chuc_vu_id, module_id, actions)
SELECT chuc_vu_id, 'quan-ly-nha-so-che/danh-gia-dau-vao', actions
FROM public.fp_var_phan_quyen
WHERE module_id = 'quan-ly-nha-so-che/bao-cao-so-che'
ON CONFLICT (chuc_vu_id, module_id) DO UPDATE SET actions = EXCLUDED.actions;

-- Chức vụ không có quyền Báo cáo sơ chế thì cũng không có quyền module này.
DELETE FROM public.fp_var_phan_quyen p
WHERE p.module_id = 'quan-ly-nha-so-che/danh-gia-dau-vao'
  AND NOT EXISTS (
    SELECT 1 FROM public.fp_var_phan_quyen b
    WHERE b.module_id = 'quan-ly-nha-so-che/bao-cao-so-che' AND b.chuc_vu_id = p.chuc_vu_id
  );

COMMIT;
