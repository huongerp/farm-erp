# Bàn giao tài khoản dịch vụ — farm-erp

App chạy trên nhiều dịch vụ bên ngoài. Mỗi dịch vụ có người **đứng tên** (chủ tài khoản) và người
**trả phí**. Bảng này để hai bên thống nhất khi bàn giao: dịch vụ nào chuyển hẳn cho khách, dịch vụ
nào bên phát triển tiếp tục quản lý thay (ghi vào hợp đồng). Cột để trống là phần cần điền.

> Không ghi mật khẩu / khoá bí mật vào file này. Bí mật trao tay qua kênh riêng (trình quản lý
> mật khẩu, gặp trực tiếp), rồi đổi mới sau bàn giao — xem mục cuối.

## 1. Bảng tài khoản

| # | Dịch vụ | Dùng để làm gì | Cấu hình ở đâu (tên biến) | Đứng tên | Trả phí | Chuyển cho khách? | Ghi chú |
|---|---|---|---|---|---|---|---|
| 1 | VPS (máy chủ) | Chạy toàn bộ app + database Postgres | SSH alias `5fedu` (máy dev) | | | | Hiện dùng chung với các app khác của bên phát triển |
| 2 | Tên miền | Địa chỉ web người dùng truy cập | `APP_DOMAIN` | | | | Gia hạn hằng năm — ghi rõ ngày hết hạn |
| 3 | Dokploy (trên VPS) | Deploy, Traefik, cấp HTTPS Let's Encrypt tự gia hạn | Giao diện Dokploy | | — | | Tài khoản admin Dokploy |
| 4 | Postgres (trong Dokploy) | Dữ liệu nghiệp vụ | `PGRST_DB_URI`, `*_DATABASE_URL`, role `5fedu` | | — | | Role chủ hiện tên `5fedu` |
| 5 | GitHub `huongerp/farm-erp` | Mã nguồn | `git remote` | | | | Chuyển quyền owner hoặc thêm khách làm admin |
| 6 | Google Cloud project | Đăng nhập bằng Google; xuất / đồng bộ Google Sheet | `GOOGLE_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `VITE_GOOGLE_PICKER_API_KEY`, `VITE_GOOGLE_APP_ID` | | | | Màn hình xin quyền OAuth hiện tên + email liên hệ của chủ project. Xem [GOOGLE_SHEETS.md](GOOGLE_SHEETS.md) |
| 7 | Cloudinary | Lưu ảnh upload (ảnh nhân viên, tài sản…) | `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`, `CLOUDINARY_URL` | | | | Gói miễn phí có giới hạn dung lượng |
| 8 | Sentry | Ghi lỗi giao diện | `VITE_SENTRY_DSN` | | | | Tuỳ chọn — bỏ trống thì tắt |
| 9 | Khoá Web Push (VAPID) | Gửi thông báo đẩy | `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | — | — | | Không phải tài khoản; `VAPID_SUBJECT` nên là email liên hệ của khách |
| 10 | Tài khoản quản trị trong app | Đăng nhập app cấp bậc 1 | Bảng `fp_var_nhan_vien` | | — | | Trao cho người phụ trách bên khách |

## 2. Việc làm khi bàn giao

- [ ] Điền đủ cột "Đứng tên / Trả phí / Chuyển cho khách?" và đưa vào phụ lục hợp đồng.
- [ ] Dịch vụ chuyển cho khách: chuyển quyền owner (không chỉ thêm thành viên) và xác nhận khách đăng nhập được.
- [ ] Dịch vụ bên phát triển giữ: ghi rõ phạm vi quản lý, chi phí, thời hạn và điều kiện chuyển giao sau này.
- [ ] Đổi mới các bí mật mà bên phát triển từng biết (bảng dưới), cập nhật env trên Dokploy, deploy lại.
- [ ] Đổi mật khẩu tài khoản quản trị trong app; bỏ mật khẩu mặc định cho tài khoản mới.

## 3. Bí mật cần đổi mới sau bàn giao

| Bí mật | Ảnh hưởng khi đổi |
|---|---|
| `PGRST_JWT_SECRET` | Mọi phiên đăng nhập hết hiệu lực — người dùng đăng nhập lại |
| `PGRST_AUTHENTICATOR_PASSWORD`, `AUTH_SERVICE_DB_PASSWORD`, `NOTIFY_SERVICE_DB_PASSWORD`, `SHEETS_SERVICE_DB_PASSWORD` | Đổi cả trong Postgres (`ALTER ROLE … PASSWORD`) lẫn env, rồi deploy lại |
| Mật khẩu role `5fedu` (chủ DB) | Script `scripts/db-*.sh` trên máy dev cần URL mới |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Tạo secret mới trong Google Cloud, xoá secret cũ |
| `SHEETS_TOKEN_KEY` | **Không** đổi tuỳ tiện: dùng để giải mã token Google đã lưu — đổi thì mọi kết nối Google Sheet phải kết nối lại |
| `VAPID_PRIVATE_KEY` | Đổi cặp khoá thì mọi thiết bị phải đăng ký nhận thông báo lại |
| `CLOUDINARY_URL` (API secret) | Tạo key mới trong Cloudinary |
