# farm-erp — Hệ thống quản lý nội bộ

Ứng dụng web (PWA) quản lý nghiệp vụ nội bộ: nhà sơ chế, kho vận, mua hàng, hành chính – nhân sự,
tài chính (sổ quỹ) và hệ thống. Chỉ có tiếng Việt; hỗ trợ giao diện sáng/tối, cài lên điện thoại,
thông báo đẩy, xuất Excel/CSV/PDF/Google Sheet.

**Phiên bản:** xem `version` trong `package.json` (hiện ở cuối trang Cài đặt) và git tag `vX.Y.Z`.

## Kiến trúc

| Thành phần | Công nghệ | Thư mục |
|---|---|---|
| Giao diện (SPA) | React 19 + Vite + TypeScript, nginx khi chạy thật | gốc repo, `deploy/` |
| API dữ liệu | PostgREST (REST tự sinh trên Postgres, phân quyền bằng RLS) | `docker-compose.yml` |
| Đăng nhập | auth-service (Node/Hono): mật khẩu + Google, ký JWT | `services/auth` |
| Thông báo | notify-service: outbox + Web Push | `services/notify` |
| Google Sheet | sheets-service: xuất và đồng bộ tự động | `services/sheets` |
| Cơ sở dữ liệu | PostgreSQL trên VPS (Dokploy) | `docs/db-schema-baseline.sql`, `docs/migrations/` |

Tất cả nằm sau một domain, Traefik (Dokploy) chia đường: `/` → web, `/api` → PostgREST,
`/auth`, `/notify`, `/sheets` → các service.

## Chức năng (50 module)

- **Hệ thống:** nhân viên, phòng ban, chức vụ, cấp bậc, chi nhánh, phân quyền, thông tin công ty.
- **Hành chính:** bảng lương, thiết lập công lương, điểm cộng trừ, công việc, phiếu hành chính, tài sản
  (danh mục, thiết lập, cấp phát – thu hồi, kiểm kê, khấu hao, bảo trì sửa chữa), nơi quản lý.
- **Kho vận:** danh mục / danh sách hàng hoá, danh sách kho, đối tác, phiếu kho, phiếu đề xuất vật tư,
  kiểm kê kho, tồn kho, báo cáo nhập – xuất – tồn.
- **Mua hàng:** đơn đặt hàng, hợp đồng, thanh toán đối tác, báo cáo đề xuất vật tư, thiết lập.
- **Quản lý nhà sơ chế:** thu hoạch, báo cáo sơ chế, báo cáo nhân công, thống kê sản xuất, dự báo sản lượng
  đóng thùng, giám sát chất lượng, đăng ký nhận hàng, đề xuất mua hàng, hàng hoá / phiếu kho / kiểm kê /
  tồn kho phân thuốc.
- **Tài chính:** sổ thu chi quỹ, thiết lập quỹ, thống kê quỹ.

## Yêu cầu

- Node.js 22 (giống image Docker), npm.
- Truy cập Postgres trên VPS (qua SSH tunnel — `scripts/db-sql.sh` tự mở) và file `.env` (mẫu: `.env.example`).

## Lệnh

| Việc | Lệnh |
|---|---|
| Chạy dev (tự bật PostgREST + 3 service) | `npm run dev` |
| Typecheck | `npm run typecheck` |
| Test | `npm test` · theo file: `npm run test:changed -- <path>` |
| Lint | `npm run lint` |
| Build production | `npm run build` |
| Kiểm kích thước bundle | `npm run check:bundle` |
| Sao lưu DB (trước migration) | `bash scripts/db-backup.sh <nhan>` |
| Chạy SQL / migration | `bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/NNN-*.sql` |

CI (`.github/workflows/ci.yml`) chạy typecheck, lint, test, build mỗi lần push lên `main`.

## Triển khai

Deploy bằng Dokploy từ `docker-compose.yml`; biến môi trường khai trong tab Environment của Dokploy
(danh sách: `.env.example`). Quy trình phát hành, chạy migration, xử lý sự cố, khôi phục dữ liệu:
**[docs/VAN_HANH.md](docs/VAN_HANH.md)**.

## Chạy full-stack ở local (PostgREST + auth-service)

Đăng nhập và mọi request dữ liệu cần thêm hai service: PostgREST (`/api`) và auth-service (`/auth`). Vite dev server proxy sang chúng giống hệt cách Traefik route ở production, nên **không cần đặt `VITE_API_URL`/`VITE_AUTH_URL`**.

Không phải chạy tay: plugin `vite/dev-services.ts` bật cả hai kèm `npm run dev` và tắt theo khi bạn `Ctrl+C`. Log của chúng in chung terminal với tiền tố `[postgrest]` / `[auth]`.

Chuẩn bị một lần:

```bash
brew install postgrest          # hoặc dùng bản Docker, xem phần chạy tay bên dưới
npm ci --prefix services/auth
```

Yêu cầu kèm theo: `.env` phải có `VPS_DB_URL`, `PGRST_AUTHENTICATOR_PASSWORD`, `AUTH_SERVICE_DB_PASSWORD`, `PGRST_JWT_SECRET`. Hai mật khẩu role và `PGRST_JWT_SECRET` phải khớp giá trị đã đặt cho role `authenticator` / `auth_service` trên VPS (danh sách role ở đầu `docs/db-schema-baseline.sql`). Cả hai service nối thẳng ra Postgres trên VPS qua host **ngoài**, nên port 5432 phải đang mở (đóng lại theo `docs/VPS_CUTOVER.md` mục 7 thì cách này cũng dừng theo). Thiếu biến nào plugin chỉ cảnh báo rồi bỏ qua, SPA vẫn chạy.

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

| Tài liệu | Nội dung |
|---|---|
| [docs/VAN_HANH.md](docs/VAN_HANH.md) | Runbook: phát hành, migration, sự cố, nhật ký thay đổi, khôi phục |
| [docs/HAN_CHE_DA_BIET.md](docs/HAN_CHE_DA_BIET.md) | Hạn chế đã biết tại thời điểm bàn giao |
| [docs/MA_TRAN_PHAN_QUYEN.md](docs/MA_TRAN_PHAN_QUYEN.md) | Chức vụ × module × quyền (sinh từ DB) |
| [docs/BAN_GIAO_TAI_KHOAN.md](docs/BAN_GIAO_TAI_KHOAN.md) | Tài khoản dịch vụ, bí mật cần đổi sau bàn giao |
| [docs/UI-CONVENTIONS.md](docs/UI-CONVENTIONS.md) | Quy ước giao diện |
| [docs/THONG_BAO_PUSH.md](docs/THONG_BAO_PUSH.md) | Thông báo + Web Push |
| [docs/GOOGLE_SHEETS.md](docs/GOOGLE_SHEETS.md) | Xuất / đồng bộ Google Sheet, cấu hình Google Cloud |
| [docs/RUI_RO_NEN_TANG_DU_LIEU.md](docs/RUI_RO_NEN_TANG_DU_LIEU.md) | Rủi ro nền tảng dữ liệu |
| [docs/VPS_POSTGREST_PLAN.md](docs/VPS_POSTGREST_PLAN.md), [docs/VPS_CUTOVER.md](docs/VPS_CUTOVER.md) | Kiến trúc self-host, runbook cut-over (lịch sử) |
| [CLAUDE.md](CLAUDE.md) | Bản đồ thư mục và quy ước code chi tiết |
