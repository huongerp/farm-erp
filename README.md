# 5F Template – Ứng dụng quản lý nội bộ

Ứng dụng web quản lý thiết bị / nhân sự và nghiệp vụ nội bộ: Trang chủ, Hệ thống (nhân viên, phòng ban, chức vụ, cấp bậc, thông tin công ty, sao lưu, phân quyền), Trợ lý AI, Cài đặt, Hồ sơ. Giao diện đa ngôn ngữ (Việt / Anh), dark mode, tùy chọn màu chủ đạo.

## Yêu cầu

- Node.js (khuyến nghị LTS)

## Chạy dự án

1. Cài đặt phụ thuộc:
   ```bash
   npm install
   ```
2. (Tùy chọn) Tạo file `.env.local` và đặt `GEMINI_API_KEY` nếu dùng Trợ lý AI.
3. Chạy máy chủ phát triển:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt theo địa chỉ in ra (`http://localhost:3000`).

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Chạy dev server (Vite) |
| `npm run build` | Build production (output trong `dist/`) |
| `npm run preview` | Xem bản build (sau khi chạy `npm run build`) |
| `npm run test` | Chạy test (Vitest) |
| `npm run test:watch` | Chạy test ở chế độ watch |

## Chạy full-stack ở local (PostgREST + auth-service)

Đăng nhập và mọi request dữ liệu cần thêm hai service: PostgREST (`/api`) và auth-service (`/auth`). Vite dev server proxy sang chúng giống hệt cách Traefik route ở production, nên **không cần đặt `VITE_API_URL`/`VITE_AUTH_URL`**.

Không phải chạy tay: plugin `vite/dev-services.ts` bật cả hai kèm `npm run dev` và tắt theo khi bạn `Ctrl+C`. Log của chúng in chung terminal với tiền tố `[postgrest]` / `[auth]`.

Chuẩn bị một lần:

```bash
brew install postgrest          # hoặc dùng bản Docker, xem phần chạy tay bên dưới
npm ci --prefix services/auth
```

Yêu cầu kèm theo: `.env` phải có `VPS_DB_URL`, `PGRST_AUTHENTICATOR_PASSWORD`, `AUTH_SERVICE_DB_PASSWORD`, `PGRST_JWT_SECRET`. Hai mật khẩu role và `PGRST_JWT_SECRET` phải khớp giá trị đã đặt lúc chạy `docs/vps-01-prepare-target.sql` / `docs/vps-04-auth-schema.sql` trên VPS. Cả hai service nối thẳng ra Postgres trên VPS qua host **ngoài**, nên port 5432 phải đang mở (đóng lại theo `docs/VPS_CUTOVER.md` mục 7 thì cách này cũng dừng theo). Thiếu biến nào plugin chỉ cảnh báo rồi bỏ qua, SPA vẫn chạy.

Kiểm tra nhanh sau khi dev server lên:

```bash
curl -s localhost:3000/auth/khoe   # {"ok":true,"service":"farm-erp-auth"}
```

Khi nào plugin **không** spawn: đặt `DEV_SKIP_SERVICES=1`, hoặc port đã có process khác nghe (chạy tay từ terminal riêng), hoặc `DEV_API_PROXY_TARGET`/`DEV_AUTH_PROXY_TARGET` trỏ ra host không phải localhost — hữu ích khi muốn dev frontend nhắm thẳng API đã deploy:

```bash
DEV_API_PROXY_TARGET=https://<APP_DOMAIN>/api
DEV_AUTH_PROXY_TARGET=https://<APP_DOMAIN>/auth
```

<details>
<summary>Chạy tay hai service (khi cần debug riêng)</summary>

```bash
source .env
HOSTPORT=$(echo "$VPS_DB_URL" | sed -E 's#.*@([^/]+)/.*#\1#')
DBNAME=$(echo "$VPS_DB_URL" | sed -E 's#.*/([^/?]+)$#\1#')

# 1. PostgREST (cổng 3010 — trùng 3000 với Vite thì đổi qua DEV_API_PROXY_TARGET)
docker run --rm -p 3010:3000 \
  -e PGRST_DB_URI="postgresql://authenticator:${PGRST_AUTHENTICATOR_PASSWORD}@${HOSTPORT}/${DBNAME}" \
  -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon \
  -e PGRST_JWT_SECRET="$PGRST_JWT_SECRET" \
  -e PGRST_DB_EXTRA_SEARCH_PATH='public, extensions' \
  postgrest/postgrest:v14.16

# 2. auth-service (cổng 3001, terminal khác)
cd services/auth
DATABASE_URL="postgresql://auth_service:${AUTH_SERVICE_DB_PASSWORD}@${HOSTPORT}/${DBNAME}" \
JWT_SECRET="$PGRST_JWT_SECRET" \
GOOGLE_CLIENT_ID="$VITE_GOOGLE_CLIENT_ID" \
npm run dev
```

</details>

## Tài liệu

- [Quy ước giao diện (UI Conventions)](docs/UI-CONVENTIONS.md) – Dialog/Drawer, Section, Design system (border radius, button, error message).
- [Chuyển sang PostgREST self-host](docs/VPS_POSTGREST_PLAN.md), [runbook cut-over](docs/VPS_CUTOVER.md).

## Cấu trúc chính

- `App.tsx` – Router, theme, ngôn ngữ, route bảo vệ.
- `components/` – Layout, UI dùng chung (Button, Input, Table, …), shared (ConfirmDialog, ErrorState, …).
- `features/he-thong/` – Module Hệ thống: nhân viên, phòng ban, chức vụ, cấp bậc, thông tin công ty, sao lưu, phân quyền.
- `lib/` – Tiện ích, i18n, theme, dialog-sizes, sidebar menu.
- `locales/` – Bản dịch (vi.json, en.json).
- `pages/` – Trang đơn (Home, Login, Settings, Profile, …).
- `store/` – Zustand (auth, UI, confirm).
