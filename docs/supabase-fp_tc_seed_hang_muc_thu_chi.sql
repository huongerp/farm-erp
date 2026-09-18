-- =============================================================================
-- Seed hạng mục thu chi quỹ theo sổ quỹ Excel đang dùng ở farm.
-- Chạy sau: supabase-fp_tc_hang_muc_thu_chi.sql
-- Idempotent: ON CONFLICT (ma) DO NOTHING — chạy lại không tạo trùng, không đè
-- tên người dùng đã sửa.
-- =============================================================================

INSERT INTO public.fp_tc_hang_muc_thu_chi (ma, ten, loai, thu_tu, ghi_chu)
VALUES
  ('SO_DU_DAU_KY', 'Số dư đầu kỳ',   'thu',    0, 'Dùng cho phiếu thu mở sổ / chuyển số dư từ sổ Excel cũ'),
  ('TAM_UNG',      'Tạm ứng',        'thu',   10, 'Tạm ứng quỹ theo đợt cho farm'),
  ('VAT_TU',       'Vật tư',         'chi',   20, NULL),
  ('BOC_KHOAN',    'Bốc khoán',      'chi',   30, NULL),
  ('CHI_KHAC',     'Chi khác',       'chi',   40, NULL)
ON CONFLICT (ma) DO NOTHING;
