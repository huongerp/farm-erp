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
4. Mở trình duyệt theo địa chỉ in ra (thường là `http://localhost:5173`).

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Chạy dev server (Vite) |
| `npm run build` | Build production (output trong `dist/`) |
| `npm run preview` | Xem bản build (sau khi chạy `npm run build`) |
| `npm run test` | Chạy test (Vitest) |
| `npm run test:watch` | Chạy test ở chế độ watch |

## Chạy full-stack ở local (PostgREST + auth-service)

Mặc định `npm run dev` chỉ chạy SPA. Đăng nhập/gọi API cần thêm PostgREST và auth-service — Vite dev server proxy `/api` và `/auth` sang hai service này (xem `vite.config.ts`), giống hệt cách Traefik route ở production, nên **không cần đặt `VITE_API_URL`/`VITE_AUTH_URL`**.

Cả hai service đều nối thẳng ra Postgres trên VPS qua host **ngoài** (không nằm trong mạng nội bộ Dokploy) — dùng `VPS_DB_URL` đã có trong `.env` để lấy host/port/dbname:

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

Mật khẩu hai role (`PGRST_AUTHENTICATOR_PASSWORD`, `AUTH_SERVICE_DB_PASSWORD`) và `PGRST_JWT_SECRET` phải khớp giá trị đã đặt lúc chạy `docs/vps-01-prepare-target.sql` / `docs/vps-04-auth-schema.sql` trên VPS. Port 5432 của VPS Postgres phải đang mở ra ngoài (đóng lại theo `docs/VPS_CUTOVER.md` mục 7 thì cách này cũng dừng theo).

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
