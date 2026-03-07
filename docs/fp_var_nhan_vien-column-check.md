# Đối chiếu cột fp_var_nhan_vien (Supabase) với app

## Bảng Supabase (50 cột)

| # | Cột DB | App đọc (rowToEmployee) | App ghi (formToRow) |
|---|--------|-------------------------|---------------------|
| 1 | id | ✓ (pk) | — (auto) |
| 2 | ho_va_ten | ✓ → ho_ten | ✓ |
| 3 | hinh_anh | ✓ → anh_dai_dien | ✓ |
| 4 | trang_thai | ✓ (text→số) | ✓ (số→text) |
| 5 | phong_ban_id | ✓ → id_phong_ban | ✓ |
| 6 | ten_phong_ban | ✓ → ten_phong_ban | — (fill từ API khác khi create/update) |
| 7 | chuc_vu_id | ✓ → id_chuc_vu | ✓ |
| 8 | ten_chuc_vu | ✓ → ten_chuc_vu | — (fill từ API khác) |
| 9 | chi_nhanh_id | ✓ → id_chi_nhanh | ✓ |
| 10 | ten_chi_nhanh | ✓ → ten_chi_nhanh | — (fill từ API khác) |
| 11 | email | ✓ | ✓ |
| 12 | so_dien_thoai | ✓ | ✓ |
| 13 | gioi_tinh | ✓ | ✓ |
| 14 | ngay_vao_lam | ✓ | ✓ |
| 15 | ngay_sinh | ✓ | ✓ |
| 16 | cmnd_cccd | ✓ | ✓ |
| 17 | ngay_cap_cccd | ✓ | ✓ |
| 18 | noi_cap_cccd | ✓ | ✓ |
| 19 | quoc_tich | ✓ | ✓ |
| 20 | dan_toc | ✓ | ✓ |
| 21 | ton_giao | ✓ | ✓ |
| 22 | tinh_thanh | ✓ | ✓ |
| 23 | quan_huyen | ✓ | ✓ |
| 24 | phuong_xa | ✓ | ✓ |
| 25 | dia_chi_cu_the | ✓ | ✓ |
| 26 | dia_chi_tam_tru | ✓ | ✓ |
| 27 | loai_hop_dong | ✓ | ✓ |
| 28 | ngay_het_han_hd | ✓ | ✓ |
| 29 | noi_lam_viec | ✓ | ✓ |
| 30 | nguoi_lien_he_khan_cap | ✓ | ✓ |
| 31 | sdt_khan_cap | ✓ | ✓ |
| 32 | quan_he_khan_cap | ✓ | ✓ |
| 33 | tinh_trang_hon_nhan | ✓ | ✓ |
| 34 | so_nguoi_phu_thuoc | ✓ | ✓ |
| 35 | trinh_do_hoc_van | ✓ | ✓ |
| 36 | chuyen_nganh | ✓ | ✓ |
| 37 | truong_hoc | ✓ | ✓ |
| 38 | nam_tot_nghiep | ✓ | ✓ |
| 39 | chung_chi | ✓ | ✓ |
| 40 | so_tai_khoan | ✓ | ✓ |
| 41 | ten_ngan_hang | ✓ | ✓ |
| 42 | chi_nhanh_nh | ✓ | ✓ |
| 43 | ma_so_thue_ca_nhan | ✓ | ✓ |
| 44 | so_bhxh | ✓ | ✓ |
| 45 | so_bhyt | ✓ | ✓ |
| 46 | ngay_tham_gia_bh | ✓ | ✓ |
| 47 | noi_dang_ky_kcb | ✓ | ✓ |
| 48 | cap_bac_id | ✓ → id_cap_bac | ✓ |
| 49 | ten_cap_bac | ✓ | — (có thể fill từ API khác nếu cần) |
| 50 | cap_bac (smallint) | ✓ | — (form không có field) |

## Đã loại trừ (không có trên Supabase)

- **ma_nhan_vien** — App chỉ hiển thị dạng `NV` + id, không lưu DB.
- **email_ca_nhan** — Đã xóa; chỉ dùng 1 cột **email**.
- **created_at, updated_at, created_by, updated_by** — Đã xóa khỏi type và UI.

## Kết luận

- **Không còn cột thừa:** Mọi cột app đọc/ghi đều tồn tại trên bảng Supabase.
- **Không thiếu cột:** Toàn bộ 50 cột của bảng đều được app đọc (select * + rowToEmployee). Cột không ghi từ form (ten_phong_ban, ten_chuc_vu, ten_chi_nhanh, ten_cap_bac, cap_bac) là cố ý: form chỉ gửi id, tên hiển thị được lấy từ API phòng ban/chức vụ/chi nhánh sau create/update.

*Cập nhật: sau rà soát lần cuối.*
