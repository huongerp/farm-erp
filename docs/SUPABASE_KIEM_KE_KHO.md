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
  - **`public.fp_mh_dot_kiem_ke_kho_chi_tiet`**: Chi tiết từng dòng (đợt, kho, hàng hóa, SL sổ, SL thực tế, kết quả; sau khi chạy script điều chỉnh tồn thêm cột liên kết phiếu kho).
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

### 4. Điều chỉnh tồn sau kiểm kê (phiếu kho + RPC)

Tồn kho trên hệ thống là **view `fp_mh_ton_kho`** (tổng hợp từ `fp_mh_phieu_kho` / `fp_mh_phieu_kho_chi_tiet`). Để **ghi nhận điều chỉnh thật**, app gọi RPC trên Supabase (transaction một lần):

- **`docs/supabase-fp_mh_dot_kiem_ke_kho_dieu_chinh_ton.sql`** (chạy **sau** script đợt kiểm kê và script phiếu kho `docs/supabase-fp_mh_phieu_kho.sql` — cần `get_next_so_phieu`).
- **`docs/supabase-fp_mh_dot_kiem_ke_kho_chi_tiet_clear_on_phieu_delete.sql`** (chạy **sau** file điều chỉnh tồn): dọn orphan, FK `ON DELETE SET NULL`, trigger **BEFORE DELETE** trên `fp_mh_phieu_kho` để khi xóa phiếu điều chỉnh thì chi tiết kiểm kê gỡ sạch 3 cột liên kết (UI cho điều chỉnh lại).

Script này:

1. **`ALTER TABLE`** `fp_mh_dot_kiem_ke_kho_chi_tiet`: thêm `id_phieu_kho_dieu_chinh`, `so_luong_dieu_chinh`, `tg_dieu_chinh_ton`.
2. **`kiem_ke_apply_dieu_chinh_chi_tiet(p_id_chi_tiet, p_nguoi_tao_id)`** — một dòng lệch → **một** phiếu nhập hoặc xuất (`trang_thai = 'Đã duyệt'`), `mo_ta`/`ghi_chu` theo chuỗi “Điều chỉnh tồn kiểm kê”.
3. **`kiem_ke_apply_dieu_chinh_dot(p_id_dot, p_nguoi_tao_id)`** — toàn đợt: **gộp** theo `(kho, loại nhập/xuất)` — tối đa 2 phiếu/kho mỗi lần bấm; cập nhật từng dòng chi tiết trỏ về cùng phiếu nếu cùng nhóm.

**Quy tắc loại phiếu (đưa tồn sổ trên hệ thống khớp số lượng thực tế đã kiểm, `delta = SL thực tế − SL sổ` trên dòng):**

- **Thừa** (`delta > 0`): tạo phiếu **nhập** — tăng tồn sổ cho bằng thực tế.
- **Thiếu** (`delta < 0`): tạo phiếu **xuất** — giảm tồn sổ cho bằng thực tế.

Sau khi sửa script, cần chạy lại `CREATE OR REPLACE FUNCTION` trên Supabase (hoặc toàn bộ file `docs/supabase-fp_mh_dot_kiem_ke_kho_dieu_chinh_ton.sql`) để DB áp dụng quy tắc mới. Các phiếu đã tạo trước đó vẫn giữ loại cũ.

App (`kiem-ke-kho-supabase.service.ts`) gọi hai RPC trên; không dùng `capNhatTonKho` (đã bỏ khỏi luồng kiểm kê).

**Lưu ý:** Dòng đã có `id_phieu_kho_dieu_chinh` không được post lại; dòng khớp (`thực tế = sổ`) bị bỏ qua khi điều chỉnh toàn đợt (trả về số dòng đã cập nhật, có thể là 0).

---

## Tóm tắt thay đổi trong app

| Phần | Thay đổi |
|------|----------|
| **Supabase** | (1) `docs/supabase-fp_mh_dot_kiem_ke_kho.sql` — bảng đợt + phạm vi kho + chi tiết. (2) `docs/supabase-fp_mh_dot_kiem_ke_kho_dieu_chinh_ton.sql` — cột điều chỉnh + RPC `kiem_ke_apply_dieu_chinh_chi_tiet` / `kiem_ke_apply_dieu_chinh_dot`. |
| **Module Kiểm kê kho** | 2 tab: **Đợt kiểm kê** (DotTab) và **Thống kê** (ThongKeTab). Xác nhận trước khi điều chỉnh tồn; hiển thị trạng thái/SL điều chỉnh và link xem phiếu. |
| **Service** | `kiem-ke-kho-service.ts` → `kiem-ke-kho-supabase.service.ts` (CRUD đợt, tạo danh sách, nhập kết quả, **RPC điều chỉnh tồn**, hoàn thành đợt). |
| **Flow** | Tạo đợt (draft) → Chọn phạm vi kho → **Tạo danh sách** (lấy tồn theo từng kho, có lọc hàng hóa/danh mục) → Đợt chuyển **Đang kiểm kê** → Nhập **số lượng thực tế** từng dòng → (Tùy chọn) **Điều chỉnh tồn** (tạo phiếu nhập/xuất, cập nhật view tồn) → **Hoàn thành đợt**. |

Sau khi chạy đủ script SQL trên Supabase (đợt kiểm kê + điều chỉnh tồn), module Kiểm kê kho ghi nhận điều chỉnh qua **phiếu kho** và hiển thị trạng thái từng dòng.
