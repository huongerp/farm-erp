# Phân quyền – Kết nối Supabase

Module **Phân quyền** (Hệ thống → Phân quyền) đã dùng Supabase qua `lib/supabase.ts`. Để module hoạt động đầy đủ, cần tạo bảng trên Supabase và cấu hình biến môi trường.

## 1. Cấu hình biến môi trường

Trong file **`.env`** (copy từ `.env.example` nếu chưa có), đặt:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Lấy giá trị từ **Supabase Dashboard** → **Settings** → **API** (Project URL và anon public key).

## 2. Tạo bảng phân quyền trên Supabase

Chạy **toàn bộ** script SQL trong file:

- **`docs/supabase-fp_var_phan_quyen.sql`**

Script sẽ:

- Tạo bảng **`public.fp_var_phan_quyen`** với các cột:
  - `id` (bigint, PK, identity)
  - `chuc_vu_id` (bigint, FK → `fp_var_chuc_vu(id)` ON DELETE CASCADE)
  - `module_id` (text, ví dụ: `hanh-chinh/cong-viec`, `he-thong/phan-quyen`)
  - `actions` (text[], các giá trị: `view`, `create`, `update`, `delete`, `admin`, `all`)
  - `tg_cap_nhat` (timestamptz)
- Ràng buộc UNIQUE `(chuc_vu_id, module_id)`.
- Index, trigger cập nhật `tg_cap_nhat`, RLS và policy cho `authenticated`.

**Điều kiện:** Bảng **`fp_var_chuc_vu`** (chức vụ) phải đã tồn tại, vì `fp_var_phan_quyen` có FK tham chiếu tới nó. Nếu chưa có, cần tạo bảng chức vụ trước.

## 3. Cách app kết nối Supabase

- **Client:** `lib/supabase.ts` tạo client từ `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
- **Service:** `features/he-thong/phan-quyen/services/phan-quyen-service.ts` gọi:
  - `getRoles()` → đọc `fp_var_chuc_vu` + `fp_var_phan_quyen` + `fp_var_nhan_vien` (đếm nhân viên theo chức vụ).
  - `createRole()` → insert `fp_var_chuc_vu` rồi insert `fp_var_phan_quyen`.
  - `deleteRoles()` → xóa `fp_var_phan_quyen` theo `chuc_vu_id`, rồi xóa `fp_var_chuc_vu`.
  - `updateModulePermissions()` → update/insert từng dòng `fp_var_phan_quyen` theo module và chức vụ.

Sau khi chạy xong script SQL và cấu hình `.env`, reload app (và nếu cần: Supabase Dashboard → Settings → API → Reload schema cache), module Phân quyền sẽ đọc/ghi đúng với Supabase.
