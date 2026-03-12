# Phiếu đề xuất vật tư – Chỉnh sửa trên Supabase

## 1. Chạy script tạo bảng và RLS

Trong **Supabase Dashboard → SQL Editor**, chạy toàn bộ file:

- `docs/supabase-fp_mh_phieu_de_xuat_vat_tu.sql`

Script sẽ:

- Xóa bảng cũ (nếu có): `fp_mh_phieu_de_xuat_vat_tu_chi_tiet`, `fp_mh_phieu_de_xuat_vat_tu`
- Tạo lại 2 bảng + index + trigger (đồng bộ `tg_cap_nhat`, đồng bộ cột kéo từ phiếu xuống chi tiết)
- Bật RLS và tạo policy SELECT/INSERT/UPDATE/DELETE cho `authenticated`
- Tạo **sequence** và **function** tùy chọn cho số phiếu tự tăng trên server

Sau khi chạy, không cần chỉnh gì thêm trong Supabase cho phần bảng và RLS.

## 2. Số phiếu tự tăng (tùy chọn)

Cuối file SQL có block:

- **Sequence**: `fp_mh_phieu_de_xuat_vat_tu_so_seq`
- **Function**: `get_next_so_phieu_phieu_de_xuat_vat_tu()` → trả về `bigint` (số thứ tự tiếp theo)

Nếu bạn bật **“Tự sinh số phiếu”** trong cấu hình đề xuất vật tư, hiện tại app vẫn dùng counter trong **localStorage**. Để dùng counter trên Supabase (tránh trùng khi nhiều user):

1. Đảm bảo đã chạy cả block “TÙY CHỌN” trong file SQL (sequence + function + grant).
2. Trong app, khi tạo phiếu mới với “tự sinh số phiếu”, có thể gọi RPC:

   ```ts
   const { data: nextNum } = await supabase.rpc('get_next_so_phieu_phieu_de_xuat_vat_tu');
   const soPhieu = `${config.tien_to_so_phieu}${String(nextNum).padStart(config.do_dai_phan_so, '0')}`;
   ```

Nếu không dùng RPC, app tiếp tục dùng localStorage; chỉ cần chạy phần tạo bảng + RLS là đủ.

## 3. Liên kết bảng

- `id_noi_de_xuat` → `fp_mh_danh_sach_kho(id)`
- `id_nguoi_de_xuat`, `id_nguoi_duyet` → bảng nhân viên (vd. `fp_var_nhan_vien(id)`)
- Chi tiết: `id_hang_hoa` → `fp_mh_danh_sach_hang_hoa(id)`

Nếu tên bảng nhân viên/chi nhánh của bạn khác, chỉ cần đảm bảo app truyền đúng `id`; không bắt buộc tạo FK trên Supabase.

## 4. Tóm tắt thay đổi app (đã làm)

- Form tạo mới: tự điền **người đề xuất** (user đăng nhập) và **nơi đề xuất** (kho theo chi nhánh user); ẩn **Trạng thái** và **Người duyệt** khi tạo.
- Validation: **ngày cần** ≥ **ngày lập**.
- Tab danh sách: **Tất cả** / **Của tôi** / **Tôi duyệt** (lọc theo user).
- Số phiếu: vẫn theo cấu hình (tiền tố + độ dài); có thể chuyển sang RPC Supabase như trên khi cần.
