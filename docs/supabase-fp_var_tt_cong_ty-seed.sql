-- =============================================================================
-- Dữ liệu mẫu bảng fp_var_tt_cong_ty (Thông tin công ty)
-- Chạy trong Supabase Dashboard → SQL Editor (sau khi đã tạo bảng fp_var_tt_cong_ty)
-- Dữ liệu dựa trên mock trong store/useStore.ts (companyInfo)
-- =============================================================================

-- Chỉ chèn 1 dòng mẫu khi bảng đang trống (tránh trùng khi chạy nhiều lần)
INSERT INTO fp_var_tt_cong_ty (
  ten_ung_dung,
  mo_ta,
  logo,
  ten_cong_ty,
  ma_so_thue,
  dia_chi,
  so_dien_thoai,
  email,
  trang_web
)
SELECT
  'Forpeasantz',
  'Hợp Tác Xã Nông Nghiệp Công Nghệ Cao FP - Forpeasantz',
  'https://scontent.fhan4-5.fna.fbcdn.net/v/t39.30808-6/646547940_873439215698096_8760186466343055269_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=13d280&_nc_ohc=RAsKtIGtd-8Q7kNvwHyjEYV&_nc_oc=AdmPaglRA6w8umYrs4ELlGNy4mcwgbEmXig4eHfJHVpmlEkxBZBTaSnD3vaVn20o-Y4&_nc_zt=23&_nc_ht=scontent.fhan4-5.fna&_nc_gid=ZR7t3ad-E7IH_sTcGZ8tPQ&_nc_ss=8&oh=00_Afx9TruOr9KWk3qZWGBgUKCEX3O7--0UU6h9sjb98wlIqA&oe=69B09F87',
  'HỢP TÁC XÃ NÔNG NGHIỆP CÔNG NGHỆ CAO FP - FORPEASANTZ. Công ty TNHH XUẤT NHẬP KHẨU ForPeasantz',
  '',
  'Trụ sở: 675 Hoàng Sa, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh, Việt Nam. Trang trại: Làng Ring, Xã Ia Mơ, Huyện Chư Prông, Gia Lai.',
  '0335224927 / 0826 432 468 / (028)66545885',
  'info@forpeasantz.com',
  'https://forpeasantz.com'
WHERE NOT EXISTS (SELECT 1 FROM fp_var_tt_cong_ty LIMIT 1);
