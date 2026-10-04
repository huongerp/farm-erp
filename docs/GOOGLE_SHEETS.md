# Xuất & đồng bộ Google Sheet

Dialog **Xuất dữ liệu** (`components/shared/export-dialog/`) có 4 định dạng: Excel, CSV, PDF và
**Google Sheet**. Google Sheet đi qua service riêng `services/sheets` (Hono + Node 22), route `/sheets/*`.

| Thành phần | Vai trò |
|---|---|
| `lib/export/dinh-dang-o.ts` | Một ô → `hienThi` (csv/pdf) · `excel` (số/Date thật) · `sheet` (số + serial ngày) |
| `components/shared/export-dialog/` | Dialog, chọn/sắp cột, panel Google Sheet, hook kết nối + Picker |
| `lib/sheets-client.ts` | Gọi `/sheets/*` kèm access token của app |
| `services/sheets/src/google/` | OAuth, gọi Google (retry), ghi Sheet |
| `services/sheets/src/core/` | Luật thuần có test: mã hoá token, kiểm dữ liệu, so header |
| `docs/migrations/011-google-sheets-ket-noi.sql` | Role `sheets_service` + bảng `fp_var_google_ket_noi` |
| `docs/migrations/012-google-sheets-dong-bo.sql` | Bảng lịch `fp_var_dong_bo_sheet`, trigger đánh dấu, view `v_xuat_*`, RPC kiểm người tạo / báo lỗi |
| `services/sheets/src/dong-bo/` | Worker đồng bộ: nhận lịch đến hạn, đọc nguồn, so khớp, ghi |

## Thiết kế

- **OAuth theo từng nhân viên**, scope `openid email drive.file`. `drive.file` KHÔNG nhạy cảm → app
  publish *In production* mà không phải chờ Google xác minh, người dùng Gmail cá nhân vẫn dùng được.
  Đổi lại app chỉ đụng file **do app tạo** hoặc file **người dùng chọn qua Google Picker** — vì vậy
  không có ô "dán link file".
- Token Google mã hoá AES-256-GCM (`SHEETS_TOKEN_KEY`) trước khi ghi DB. Người dùng app không đọc
  được bảng kết nối (RLS + REVOKE).
- Ghi Sheet luôn `valueInputOption=RAW`: số là số thật (SUM được), ngày là serial + `numberFormat`
  cột (`dd/mm/yyyy`) — sort/lọc theo ngày đúng; chuỗi `0123` giữ số 0 đầu, `=...` không thành công thức.
- **Tải mới** ghi dữ liệu mới trước rồi mới xoá phần thừa của bảng cũ (lỗi giữa chừng không để tab
  trống), chỉ trong phạm vi bề rộng bảng — cột người dùng tự thêm xa hơn bên phải được giữ.
  **Tải thêm** nối cuối tab; lệch header thì vẫn ghi nhưng cảnh báo.
- Xuất một lần dùng đúng dữ liệu đang lọc trên màn hình (client gửi lên), tối đa 50.000 dòng.
- File/tab đã xuất được nhớ theo module (localStorage `export-gs:<fileName>`) → lần sau mặc định
  ghi vào đúng file cũ.

## Đồng bộ tự động (lịch)

Trong dialog Xuất → Google Sheet, module có khai `dongBo={{ moduleId }}` hiện công tắc
**Đồng bộ tự động** và danh sách lịch của người dùng (bật/tắt, Đồng bộ ngay, Xoá).

- **Tần suất**: khi có thay đổi (gộp trong 5 phút từ thay đổi đầu tiên) · mỗi giờ · mỗi 4 giờ ·
  hằng ngày / tuần / tháng theo giờ VN (ngày 31 = ngày cuối tháng). Lịch "khi có thay đổi" còn được
  ghi lại toàn bộ lúc 03:00 hằng đêm để sửa chỗ ai đó gõ tay làm lệch Sheet.
- **Ghi tối thiểu**: cột A luôn là `id`. Worker đọc toàn bộ nguồn, so từng dòng với Sheet rồi chỉ sửa /
  thêm / xoá dòng khác biệt (không dựa `tg_cap_nhat` — view tổng hợp đổi số liệu mà dòng cha không
  đổi). Header lệch, tab mất hoặc thay đổi > 30% thì ghi lại toàn bộ. Dữ liệu không đổi (SHA-256 trùng
  lần trước) thì bỏ qua, không gọi Google.
- **Quyền**: worker đọc nguồn qua PostgREST bằng JWT của **người tạo lịch** (RLS áp như trên app).
  Chỉ người **toàn phạm vi** trên module (`cap_bac = 1` hoặc quyền `admin`/`all`) mới tạo được lịch,
  vì RLS các bảng nghiệp vụ mở cho mọi người đăng nhập — phạm vi "của tôi / chi nhánh tôi" chỉ là bộ lọc
  UI, lịch chạy nền không áp được. Kiểm lại ở MỖI lần chạy: người tạo nghỉ việc hoặc mất quyền → lịch dừng.
- **Lỗi**: lỗi vĩnh viễn (mất quyền file, cột không còn, kết nối Google hỏng) → dừng lịch ngay; lỗi tạm
  (mạng, Google 5xx) → thử lại sau 2, 4, 8… tối đa 60 phút, quá 10 lần thì dừng. Báo vào chuông thông báo
  của người tạo (lần lỗi thứ 3 hoặc khi dừng), tối đa 1 lần/ngày/lịch.
- Worker chỉ chạy khi `SHEETS_WORKER_BAT=true` (production). Dev dùng chung DB: muốn test thì đặt
  `DEV_SHEETS_WORKER_BAT=true` tạm thời rồi tắt.

### Đấu thêm module

1. Migration mới: view `v_xuat_<module>` (`security_invoker`) có **tên cột = key xuất** trong
   `features/.../utils/export-*-danh-sach.ts` (bắt buộc có `id`) + `CREATE TRIGGER trg_dong_bo_sheet_danh_dau
   ... FOR EACH STATEMENT EXECUTE FUNCTION fn_dong_bo_sheet_danh_dau()` trên MỌI bảng nền ảnh hưởng số liệu.
2. Thêm mục vào `services/sheets/src/core/nguon-dong-bo.ts` (`moduleId` = mã phân quyền).
3. Truyền `dongBo={{ moduleId }}` cho `<ExportDialog>` của tab danh sách.

Đang bật: `mua-hang/don-dat-hang`, `quan-ly-nha-so-che/phieu-kho-phan-thuoc`.

## Cấu hình Google Cloud (làm một lần)

Dùng **project Google Cloud đang chứa OAuth client đăng nhập** của farm-erp (`VITE_GOOGLE_CLIENT_ID`)
— dùng luôn client đó, chỉ thêm redirect URI và lấy secret.

1. <https://console.cloud.google.com> → chọn đúng project.
2. **APIs & Services → Library**: bật **Google Sheets API**, **Google Drive API**, **Google Picker API**.
3. **Google Auth Platform → Branding**:
   - App name, User support email, Developer contact.
   - App domain: Home `https://<APP_DOMAIN>/gioi-thieu.html`, Privacy
     `https://<APP_DOMAIN>/quyen-rieng-tu.html`, Terms `https://<APP_DOMAIN>/dieu-khoan.html`
     (3 trang nằm sẵn trong `public/`).
   - Authorized domains: domain gốc của `APP_DOMAIN`.
   - **Không tải logo** — có logo là Google đòi xác minh thương hiệu.
4. **Audience**: User type **External** → **Publish app** → trạng thái **In production**.
   Để *Testing* thì chỉ test user dùng được và refresh token chết sau 7 ngày.
5. **Data access → Add or remove scopes**: `openid`, `.../auth/userinfo.email`, `.../auth/drive.file`.
6. **Clients → OAuth client (Web) đang dùng đăng nhập**:
   - Authorized JavaScript origins: `https://<APP_DOMAIN>`, `http://localhost:3000` (thêm cổng dev khác nếu dùng, vd `http://localhost:3005`).
   - Authorized redirect URIs: `https://<APP_DOMAIN>/sheets/google/callback`,
     `http://localhost:3000/sheets/google/callback` (và cổng dev khác tương ứng).
   - Copy **Client secret** → `GOOGLE_OAUTH_CLIENT_SECRET`.
7. **Credentials → Create credentials → API key** → Edit:
   - API restrictions: chỉ **Google Picker API**.
   - Application restrictions: HTTP referrers `https://<APP_DOMAIN>/*`, `http://localhost:3000/*`.
   - Copy → `VITE_GOOGLE_PICKER_API_KEY`.
8. **IAM & Admin → Settings**: copy **Project number** → `VITE_GOOGLE_APP_ID`.
9. Sinh khoá mã hoá token: `openssl rand -hex 32` → `SHEETS_TOKEN_KEY`.

## Cài đặt DB + biến môi trường

```bash
bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/011-google-sheets-ket-noi.sql
bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/012-google-sheets-dong-bo.sql
```

Lần đầu chạy in **mật khẩu role `sheets_service`** ra NOTICE — ghi ngay, không in lại.

| Biến | Đặt ở | Ghi chú |
|---|---|---|
| `SHEETS_DATABASE_URL` | Dokploy | `postgresql://sheets_service:<mk-encode>@<host-nội-bộ>:5432/fpfarm` |
| `SHEETS_SERVICE_DB_PASSWORD` | `.env` dev | mật khẩu role trên (dev tự ghép chuỗi kết nối từ `VPS_DB_URL`) |
| `GOOGLE_OAUTH_CLIENT_ID` | Dokploy | Client ID của OAuth client dùng cho Sheet. Biến riêng: KHÔNG bật nút đăng nhập Google (`GOOGLE_CLIENT_ID`). Dev bỏ trống thì lấy `VITE_GOOGLE_CLIENT_ID` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Dokploy + `.env` dev | bước 6 |
| `SHEETS_TOKEN_KEY` | Dokploy + `.env` dev | bước 9, **giống nhau** ở mọi nơi dùng chung DB; đổi khoá = mọi người kết nối lại |
| `VITE_GOOGLE_PICKER_API_KEY` | Dokploy (build arg) + `.env` dev | bước 7 |
| `VITE_GOOGLE_APP_ID` | Dokploy (build arg) + `.env` dev | bước 8 |
| `SHEETS_WORKER_BAT` | Dokploy | mặc định `true` — worker đồng bộ tự động (giai đoạn 3) |

`GOOGLE_OAUTH_REDIRECT_URI` và `POSTGREST_URL` đã đặt sẵn trong `docker-compose.yml`. Dev để trống
redirect URI: service tự lập theo origin localhost đang chạy.

Dev: `npm ci --prefix services/sheets` một lần, rồi `npm run dev` tự bật service (log `[sheets]`).
Thiếu biến nào thì service bị bỏ qua và dialog Xuất tự ẩn lựa chọn Google Sheet.

## Soi lỗi

| Hiện tượng | Nguyên nhân thường gặp |
|---|---|
| Không thấy lựa chọn "Google Sheet" | service sheets không chạy / thiếu biến (`curl localhost:3000/sheets/khoe`) |
| Popup báo `redirect_uri_mismatch` | URI ở bước 6 chưa khai đúng cổng/domain |
| "File có sẵn" bị mờ | thiếu `VITE_GOOGLE_PICKER_API_KEY` / `VITE_GOOGLE_APP_ID` |
| "App không mở được file này" | file chưa từng được chọn qua Picker (giới hạn của `drive.file`) → chọn lại |
| "Kết nối Google đã hết hiệu lực" | người dùng gỡ quyền / đổi mật khẩu Google, hoặc app còn ở chế độ Testing quá 7 ngày |
| Popup không tự đóng, dialog không cập nhật | service worker cũ chưa có `/sheets/` trong denylist → tải lại trang (SW mới) |
| Không thấy công tắc "Đồng bộ tự động" | module chưa khai `dongBo`, hoặc người dùng không có toàn phạm vi (dòng chú thích lý do hiện thay công tắc) |
| Lịch "khi có thay đổi" không chạy | worker tắt (`curl …/sheets/khoe` → `worker:false`) hoặc bảng nền thiếu trigger `trg_dong_bo_sheet_danh_dau` |
