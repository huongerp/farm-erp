# Kiểm kê kho – Chỉnh sửa trên Supabase

Module **Kiểm kê kho** đã được xây dựng lại theo đúng flow gốc: **Đợt kiểm kê** (nhiều kho) → **Tạo danh sách** từ tồn → **Nhập kết quả** (khớp/thiếu/thừa/chưa kiểm) → **Điều chỉnh tồn** → **Hoàn thành**.

## Bạn cần chạy trên Supabase

### 1. Tạo bảng đợt kiểm kê kho

Chạy **toàn bộ** script SQL trong file:

- **`docs/supabase-fp_mh_dot_kiem_ke_kho.sql`**

Script này sẽ:

- **Xóa** (nếu có) các bảng cũ: `fp_mh_dot_kiem_ke_kho_chi_tiet`, `fp_mh_dot_kiem_ke_kho_kho`, `fp_mh_dot_kiem_ke_kho`.
- **Tạo** 3 bảng trong schema **`public`** (để Supabase nhận đúng):
  - **`public.fp_mh_dot_kiem_ke_kho`**: Đợt kiểm kê (mã đợt tự sinh, tên, ngày, trạng thái, **người phụ trách bắt buộc**, ghi chú).
  - **`public.fp_mh_dot_kiem_ke_kho_kho`**: Phạm vi kho (một đợt nhiều kho).
  - **`public.fp_mh_dot_kiem_ke_kho_chi_tiet`**: Chi tiết từng dòng (đợt, kho, hàng hóa, SL sổ, SL thực tế, kết quả).
- **Mã đợt tự tăng**: sequence `fp_mh_dot_kiem_ke_kho_ma_seq` + RPC **`get_next_ma_dot_dot_kiem_ke_kho()`** (app format: `KK-YYYY-NNNN`).
- **Index**, **trigger** `tg_cap_nhat`, **RLS** và **policy** cho `authenticated`.

**Nếu gặp lỗi "Could not find the table 'public.fp_mh_dot_kiem_ke_kho' in the schema cache":**

1. Đảm bảo đã chạy xong **toàn bộ** script SQL trên (không bỏ đoạn nào).
2. Vào **Supabase Dashboard** → **Settings** → **API** → bấm **Reload schema cache** (hoặc đợi vài phút rồi refresh trang).

**Lưu ý:** Script không tạo FK tới `fp_mh_danh_sach_kho`, `fp_mh_danh_sach_hang_hoa`, `fp_var_nhan_vien` (chỉ COMMENT). Các bảng đó phải đã tồn tại và `id` là `bigint`.

### 2. Không cần đổi bảng phiếu kiểm kê cũ

Bảng **`fp_mh_phieu_kiem_ke`** (và chi tiết) vẫn nằm trong project (module **phieu-kiem-ke**). Module **Kiểm kê kho** giờ dùng **đợt kiểm kê** (`fp_mh_dot_kiem_ke_kho` + chi tiết), không dùng phiếu kiểm kê trong màn Kiểm kê kho. Bạn có thể giữ hoặc xóa `fp_mh_phieu_kiem_ke` tùy nhu cầu dùng chỗ khác.

### 3. View tồn kho

Flow **Tạo danh sách kiểm kê** lấy tồn theo kho từ **view `fp_mh_ton_kho`** (đã có sẵn). Không cần tạo thêm bảng/view mới cho tồn.

### 4. Điều chỉnh tồn sau kiểm kê

Hiện tại **Điều chỉnh tồn** (theo dòng hoặc theo đợt) gọi `capNhatTonKho(id_kho, id_hang_hoa, bien_dong)` trong `ton-kho-service`. Hàm này đang **no-op** (tồn đọc từ view). Nếu bạn muốn ghi nhận điều chỉnh thật (ví dụ bảng nhật ký tồn hoặc bảng biến động), cần bổ sung logic trong backend/Supabase (function/trigger hoặc API) và cập nhật `capNhatTonKho` tương ứng.

---

## Tóm tắt thay đổi trong app

| Phần | Thay đổi |
|------|----------|
| **Supabase** | Chạy `docs/supabase-fp_mh_dot_kiem_ke_kho.sql` để tạo bảng đợt + phạm vi kho + chi tiết. |
| **Module Kiểm kê kho** | 2 tab: **Đợt kiểm kê** (DotTab) và **Thống kê** (ThongKeTab). |
| **Service** | `kiem-ke-kho-service.ts` gọi Supabase qua `kiem-ke-kho-supabase.service.ts` (CRUD đợt, tạo danh sách từ tồn, nhập kết quả, điều chỉnh tồn, hoàn thành đợt). |
| **Flow** | Tạo đợt (draft) → Chọn phạm vi kho → **Tạo danh sách** (lấy tồn theo từng kho, có lọc hàng hóa/danh mục) → Đợt chuyển **Đang kiểm kê** → Nhập **số lượng thực tế** từng dòng → (Tùy chọn) **Điều chỉnh tồn** → **Hoàn thành đợt**. |

Sau khi chạy xong script SQL trên Supabase, module Kiểm kê kho sẽ hoạt động đúng theo flow gốc.
