-- =============================================================================
-- 095-dgdv-gan-nhom-loi-con-lai.sql — Đánh giá đầu vào: gán sẵn nhóm nguyên nhân cho các lý do còn lại
--
-- 094 chỉ gán theo cột Excel của khách (23 lý do). File này gán phần còn lại theo nghiệp vụ chuối
-- (Công yêu cầu 22/11/2026 — người dùng đổi lại được ở ⚙ Cài đặt → Lý do):
--   Thu hoạch      — thu sai độ già (căng trái, Dame, chín cây, rớt size, quá tuần), dập / trầy / mủ khi
--                    cắt và chuyển cáp (rớt cáp, rơi ròng rọc, vướng cáp, gãy cuống, dính mủ).
--   Chăm sóc vườn  — sâu bệnh và cây: nấm xanh / nấm đen (theo rệp), bọ trĩ, rỉ sắt, chuột, cây đổ,
--                    thiếu lá, cháy / đọng thuốc phun, teo đầu / teo trái, buồng ít nải, chậm phát triển.
--   Chăm sóc buồng — bao buồng, bẻ hoa, tỉa lá chạm buồng, dây màu: trầy khô, cháy nắng, thối trái /
--                    thối đầu trái / thối cùi, không bẻ hoa, không bao buồng, không dây, loang màu.
-- CỐ Ý ĐỂ TRỐNG: lý do ghép lỗi thuộc NHIỀU nhóm («Trầy khô 4,Nấm xanh 6», «Dame,căng trái,thối trái»,
-- «Khác (Nhọn đầu, Không BB)»…) và «x» — báo cáo (core/nhom-loi.ts) tách từng phần rồi tính vào đúng nhóm.
--
-- Chỉ gán khi id_nhom_loi IS NULL → chạy lại không đè lựa chọn người dùng đã đổi.
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/095-dgdv-gan-nhom-loi-con-lai.sql
-- =============================================================================

BEGIN;

UPDATE public.fp_var_dgdv_ly_do l
   SET id_nhom_loi = n.id
  FROM (VALUES
    -- Thu hoạch -----------------------------------------------------------------
    ('dame',                         'Thu hoạch'),
    ('căng trái',                    'Thu hoạch'),
    ('dame, căng trái',              'Thu hoạch'),
    ('dame căng +chín cây',          'Thu hoạch'),
    ('qúa size, căng trái',          'Thu hoạch'),
    ('qúa size, dame, căng trái',    'Thu hoạch'),
    ('qúa size, căng trái, dame',    'Thu hoạch'),
    ('chín cây',                     'Thu hoạch'),
    ('thâm trái, mềm trái',          'Thu hoạch'),
    ('nội địa quá tuần',             'Thu hoạch'),
    ('rớt size',                     'Thu hoạch'),
    ('rớt size nặng',                'Thu hoạch'),
    ('dính mủ',                      'Thu hoạch'),
    ('mủ',                           'Thu hoạch'),
    ('rớt cáp',                      'Thu hoạch'),
    ('rớt cap 1',                    'Thu hoạch'),
    ('rớt cap ( tắt máy)',           'Thu hoạch'),
    ('rớt cap ( vướng hàng rào)',    'Thu hoạch'),
    ('rớt cap 2,dame 3',             'Thu hoạch'),
    ('rơi ròng rọc',                 'Thu hoạch'),
    ('vướng cáp',                    'Thu hoạch'),
    ('gãy cuống',                    'Thu hoạch'),
    ('lỗi do thu hoạch',             'Thu hoạch'),
    -- Chăm sóc vườn -------------------------------------------------------------
    ('nấm xanh',                     'Chăm sóc vườn'),
    ('nấm xanh 2',                   'Chăm sóc vườn'),
    ('nấm xanh 6',                   'Chăm sóc vườn'),
    ('nấm xanh nặng',                'Chăm sóc vườn'),
    ('nấm đen',                      'Chăm sóc vườn'),
    ('nấm đen nặng',                 'Chăm sóc vườn'),
    ('nấm xanh, nấm đen',            'Chăm sóc vườn'),
    ('nấm xanh,rệp sáp',             'Chăm sóc vườn'),
    ('nấm xanh, 4-5 nải',            'Chăm sóc vườn'),
    ('bọ trĩ',                       'Chăm sóc vườn'),
    ('rỉ sắt',                       'Chăm sóc vườn'),
    ('chuột phá',                    'Chăm sóc vườn'),
    ('chuột ăn',                     'Chăm sóc vườn'),
    ('đổ mới',                       'Chăm sóc vườn'),
    ('đổ cũ',                        'Chăm sóc vườn'),
    ('đỗ mới',                       'Chăm sóc vườn'),
    ('đỗ cũ',                        'Chăm sóc vườn'),
    ('chuối đổ ngã',                 'Chăm sóc vườn'),
    ('đổ ngã mềm trái',              'Chăm sóc vườn'),
    ('thiếu lá',                     'Chăm sóc vườn'),
    ('chín thiếu lá',                'Chăm sóc vườn'),
    ('nội địa, thiếu lá',            'Chăm sóc vườn'),
    ('cháy thuốc',                   'Chăm sóc vườn'),
    ('đọng thuốc',                   'Chăm sóc vườn'),
    ('teo đầu',                      'Chăm sóc vườn'),
    ('teo trái',                     'Chăm sóc vườn'),
    ('4-5 nải',                      'Chăm sóc vườn'),
    ('buồng 6 nải',                  'Chăm sóc vườn'),
    ('chậm phát triển',              'Chăm sóc vườn'),
    ('chín bệnh',                    'Chăm sóc vườn'),
    -- Chăm sóc buồng ------------------------------------------------------------
    ('trầy khô',                     'Chăm sóc buồng'),
    ('trầy khô 4',                   'Chăm sóc buồng'),
    ('trầy khô nặng',                'Chăm sóc buồng'),
    ('cháy nắng',                    'Chăm sóc buồng'),
    ('cháy nắng 1',                  'Chăm sóc buồng'),
    ('cháy nắng nặng',               'Chăm sóc buồng'),
    ('chín cháy nắng',               'Chăm sóc buồng'),
    ('thối trái',                    'Chăm sóc buồng'),
    ('thối trái nặng',               'Chăm sóc buồng'),
    ('thối trái, thối đầu trái',     'Chăm sóc buồng'),
    ('thối trái , cháy nắng',        'Chăm sóc buồng'),
    ('thối cùi',                     'Chăm sóc buồng'),
    ('không bẻ hoa',                 'Chăm sóc buồng'),
    ('không bao buồng',              'Chăm sóc buồng'),
    ('không dây',                    'Chăm sóc buồng'),
    ('loang màu',                    'Chăm sóc buồng')
  ) AS t(khoa, ten_nhom)
  JOIN public.fp_var_dgdv_nhom_loi n ON n.ten = t.ten_nhom
 WHERE lower(regexp_replace(btrim(l.ten), '\s+', ' ', 'g')) = t.khoa
   AND l.id_nhom_loi IS NULL;

COMMIT;

-- Kiểm tra: lý do còn trống (kỳ vọng chỉ còn lý do ghép nhiều nhóm + «x»)
--   SELECT loai, ten FROM fp_var_dgdv_ly_do WHERE id_nhom_loi IS NULL ORDER BY loai, ten;
