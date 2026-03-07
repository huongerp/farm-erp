# Đăng nhập Google (Supabase OAuth)

App đã tích hợp đăng nhập bằng Google qua Supabase. Để bật tính năng:

## 1. Google Cloud Console

1. Vào [Google Cloud Console](https://console.cloud.google.com/) → chọn hoặc tạo project.
2. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
3. Nếu chưa có OAuth consent screen: chọn **Configure consent screen** → chọn User Type (External hoặc Internal) → điền App name, Support email, Developer contact.
4. Tạo **OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: thêm URL app (vd: `https://your-app.vercel.app`, `http://localhost:5173`).
   - **Authorized redirect URIs**: thêm **Supabase callback URL**:
     - Production: `https://<project-ref>.supabase.co/auth/v1/callback`
     - Lấy `<project-ref>` từ Supabase Dashboard → Settings → API → Project URL (phần trước `.supabase.co`).
5. Lưu **Client ID** và **Client Secret**.

## 2. Supabase Dashboard

1. **Authentication** → **Providers** → **Google** → bật **Enable Sign in with Google**.
2. Dán **Client ID** và **Client Secret** từ bước 1.
3. **Authentication** → **URL Configuration**:
   - **Site URL**: URL app (vd: `https://your-app.vercel.app`).
   - **Redirect URLs**: thêm `https://your-app.vercel.app/` và `http://localhost:5173/` (sau khi đăng nhập Google user được redirect về đây).

## 3. Hồ sơ nhân viên

Giống đăng nhập email/mật khẩu: **email tài khoản Google** phải tồn tại trong bảng `fp_var_nhan_vien` (cột `email`). Nếu không có, user sẽ thấy thông báo và không vào được app.

## 4. Luồng hoạt động

1. User bấm **Google** trên trang đăng nhập.
2. Chuyển sang Google để đăng nhập/ủy quyền.
3. Google redirect về app (trang chủ `/`).
4. App đọc session từ Supabase, tìm nhân viên theo email → nếu có thì đăng nhập vào app, nếu không thì thông báo và chuyển về trang đăng nhập.
