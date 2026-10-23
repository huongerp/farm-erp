# CLAUDE.md — farm-erp

Ứng dụng ERP nội bộ (React 19 + Vite + TypeScript), dữ liệu qua **PostgREST self-host** trên VPS,
đăng nhập qua **auth-service** riêng (`services/auth`, Hono + JWT). Gói `@supabase/postgrest-js`
trong `lib/db.ts` chỉ là thư viện client PostgREST, app **không** dùng dịch vụ Supabase nào.

## Lệnh chuẩn

| Việc | Lệnh |
|---|---|
| Dev (tự spawn PostgREST + auth-service + notify-service) | `npm run dev` |
| Typecheck (incremental, lần sau ~1,5s) | `npm run typecheck` |
| Test toàn bộ | `npm test` |
| Test theo file đang sửa | `npm run test:changed -- <path>` |
| Test 1 file | `npx vitest run <path>` |
| Build production | `npm run build` |
| Lint | `npm run lint` |
| Kiểm tra kích thước bundle | `npm run check:bundle` |
| Sao lưu DB trên VPS (chạy TRƯỚC migration) | `bash scripts/db-backup.sh <nhan>` |
| Sao lưu kho ảnh trên VPS | `bash scripts/media-backup.sh` |
| Chạy SQL / migration lên VPS | `bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/NNN-*.sql` |

Dev server **không** chạy bằng lệnh nền thủ công — `vite/dev-services.ts` tự bật PostgREST,
auth-service, notify-service và sheets-service kèm `npm run dev` (bỏ qua bằng `DEV_SKIP_SERVICES=1`). Chi tiết biến môi trường:
[README.md](README.md).

## Bản đồ thư mục

- `App.tsx` — router, theme, ngôn ngữ, route bảo vệ, bootstrap phiên.
- `features/<nhóm>/<module>/` — nghiệp vụ theo nhóm: `he-thong`, `hanh-chinh`, `kho-van`,
  `mua-hang`, `quan-ly-nha-so-che`.
- Submenu **Phân thuốc** (`/phan-thuoc`) KHÔNG có thư mục riêng: dùng lại 6 module kho của
  `quan-ly-nha-so-che` (hàng hoá, phiếu kho, kiểm kê, tồn kho, đề xuất mua hàng, thiết lập đề xuất)
  qua biến thể `features/quan-ly-nha-so-che/kho-bien-the/` — tên bảng/view/RPC, module_id, tiền tố
  số phiếu nằm ở `bien-the.ts`; Sơ chế dùng `fp_farm_*`, Phân thuốc dùng `fp_pt_*` (migration 029).
  Service nhận `bt` làm tham số đầu, hook lấy `useKhoBienThe()` và gắn `bt.key` vào queryKey; store
  bảng tạo qua `storeTheoBienThe`. Sửa SQL của một bên thì làm migration cho cả bên kia.
- `components/` — `ui/` (Button, Input, Table…), `shared/` (ConfirmDialog, Section,
  ModulePermissionGuard…), `layout/`, `auth/`.
- `lib/` — hạ tầng dùng chung: `db.ts` (PostgrestClient), `auth.ts`, `token-store.ts`,
  `mat-khau.ts`, `constants.ts`, `i18n.ts`, menu, hooks.
- `store/` — Zustand: `useStore.ts` (auth), `useConfirmStore.ts`, `createGenericStore.ts`.
- `pages/` — trang đơn (Login, Profile, Settings, dashboards…).
- `locales/vi/` — chuỗi dùng chung (`common.json`, `pages.json`…); chuỗi riêng module ở
  `features/<nhóm>/<module>/locales/vi.json`. App chỉ có tiếng Việt. Không hardcode chuỗi hiển thị.
- `services/auth/` — auth-service (Node/Hono): đăng nhập mật khẩu + Google, ký JWT, refresh token.
- `services/notify/` — notify-service (Node/Hono): worker thông báo (outbox + LISTEN/NOTIFY) và
  endpoint đăng ký Web Push. Logic "ai nhận / viết gì" nằm ở `src/core/` và có test cạnh file.
- `services/sheets/` — sheets-service (Node/Hono): kết nối Google (OAuth `drive.file`), xuất Google Sheet và
  worker đồng bộ tự động. Luật thuần ở `src/core/` có test; `core/dinh-dang.ts` là bản sao của
  `lib/export/dinh-dang-o.ts` (sửa cả hai, test parity canh).
- `services/media/` — media-service (Node/Hono + sharp): `POST /upload` (JWT app) lưu ảnh vào volume
  `media-data`, `GET /f/...` phục vụ ảnh (tên file 128 bit ngẫu nhiên, cache 1 năm). Frontend tải ảnh qua
  `lib/media-upload.ts` → `uploadAnh(file, thuMuc)`; thư mục mới phải thêm ở cả `ThuMucAnh` và
  `src/core/duong-dan.ts`. DB chỉ lưu `/media/f/...` — KHÔNG Cloudinary, KHÔNG base64 (schema
  `hinh-anh-url-schema.ts` từ chối `data:`). Dev proxy `/media` thẳng lên VPS.
- `sw/sw.ts` — service worker tự viết (vite-plugin-pwa chế độ `injectManifest`): precache, runtime
  caching và listener `push` / `notificationclick`.
- `docs/` — `db-schema-baseline.sql`, `migrations/` (SQL mới) + tài liệu vận hành.
- `deploy/`, `docker-compose.yml` — Nginx + Docker cho production.

## Quy ước module

Mỗi module trong `features/` theo cùng một khuôn:

```
<module>/
  index.tsx      # trang chính, lấy quyền qua useModulePermissionFromContext()
  core/          # types.ts, schema.ts (zod), constants.ts + test cạnh file
  services/      # gọi db (PostgREST), không chứa JSX
  hooks/         # React Query: use-<module>.ts
  components/    # bảng, form, drawer chi tiết, toolbar
  store/         # zustand riêng của module (nếu cần)
  utils/         # thuần, không phụ thuộc React
```

- Truy vấn dữ liệu: `db` từ `lib/db.ts` (PostgREST). Không thêm lại `@supabase/supabase-js`.
- Lỗi từ PostgREST format qua `lib/db-errors.ts` để hiện toast tiếng Việt kèm mã lỗi.
- Bảng dữ liệu đặt tên `fp_var_*` (danh mục/hệ thống), `fp_farm_*` (nghiệp vụ farm), `fp_hr_*` (nhân sự).

- Danh sách phân trang ở SERVER (khuôn `*-list-query` + `*-db.service`), bảng dùng chung (`GenericTable`/`HierarchyTable`) và toolbar lọc: chi tiết ở `.claude/rules/danh-sach-phan-trang-server.md` và `.claude/rules/bang-va-toolbar-loc.md` (tự nạp khi chạm file liên quan; xem bảng cuối file).

## Phân quyền — hai tầng phải khớp nhau

1. **Tầng app**: `fp_var_phan_quyen` (chuc_vu_id + module_id + actions) → `ModulePermissionGuard`
   cấp `canView/canCreate/canUpdate/canDelete/canApprove/canAdmin`.
2. **Tầng DB**: RLS policy + RPC `SECURITY DEFINER` trong `docs/*.sql`.

Sửa quyền ở một tầng thì phải soi tầng kia, nếu không UI cho bấm mà DB từ chối (đúng ca lỗi
`[P0001] … rpc_set_mat_khau`, xử lý ở [docs/db-schema-baseline.sql](docs/db-schema-baseline.sql)).

Quy ước "cấp cao": `cap_bac = 1` hoặc quyền `admin`/`all` trên module → xem/sửa toàn phạm vi;
xem mẫu ở các hook `use-*-view-scope.ts`.

## Test

- Vitest **node-first**: `environment: 'node'`, project `dom` (jsdom) chỉ áp cho `*.test.tsx`.
  File `.ts` cần DOM thì thêm docblock đầu file: `// @vitest-environment jsdom`.
- Test nằm **cạnh file nguồn** (`foo.ts` + `foo.test.ts`), không tạo thư mục `__tests__/`.
- Ưu tiên test logic thuần: quyền/phạm vi xem, tính kỳ–ngày–hạn, parse/import/export, tiền lương,
  máy trạng thái. Không test render/layout/wrapper mỏng.

## Tài liệu tham chiếu

- [docs/UI-CONVENTIONS.md](docs/UI-CONVENTIONS.md) — thang chữ, Dialog/Drawer, Section, design system.
- [docs/VPS_POSTGREST_PLAN.md](docs/VPS_POSTGREST_PLAN.md), [docs/VPS_CUTOVER.md](docs/VPS_CUTOVER.md) — kiến trúc self-host và runbook cut-over.
- [docs/RUI_RO_NEN_TANG_DU_LIEU.md](docs/RUI_RO_NEN_TANG_DU_LIEU.md) — rủi ro nền tảng dữ liệu.
- [docs/BUNDLE_OPTIMIZATION.md](docs/BUNDLE_OPTIMIZATION.md), [docs/EGRESS_OPTIMIZATION.md](docs/EGRESS_OPTIMIZATION.md) — tối ưu bundle và egress.
- [docs/GOOGLE_SHEETS.md](docs/GOOGLE_SHEETS.md) — dialog Xuất (Excel/CSV/PDF/Google Sheet), đồng bộ tự động,
  cấu hình Google Cloud, đấu thêm module.
- [docs/THONG_BAO_PUSH.md](docs/THONG_BAO_PUSH.md) — thông báo + Web Push: kiến trúc outbox, thứ tự chạy SQL,
  catalog sự kiện (bắn gì / khi nào / cho ai), cách đấu thêm module, soi lỗi.
- SQL: `docs/db-schema-baseline.sql` (ảnh chụp ngày 2026-09-30: role, extension, schema `auth` + `public`: bảng, view,
  RPC, trigger, RLS) + `docs/migrations/NNN-*.sql` (chạy sau bản chụp, tuần tự).

## Lưu ý khi sửa

- Migration SQL mới: thêm `docs/migrations/NNN-<mo-ta>.sql` (đánh số tiếp), không sửa đè file đã chạy trên VPS.
  Không có DB thử — migration chạy thẳng lên dữ liệu thật, nên LUÔN `bash scripts/db-backup.sh truoc-NNN`
  trước (dump vào `backup/`, đã gitignore, chứa dữ liệu thật — không commit / gửi đi).
- Hàm/RPC mới trong migration: Postgres mặc định cho PUBLIC gọi được → role `anon` (chưa đăng nhập)
  cũng gọi được. Luôn kèm `REVOKE ALL ON FUNCTION … FROM PUBLIC, anon;` + `GRANT EXECUTE … TO authenticated`
  (và service role cần dùng). Bảng mới không GRANT cho `anon`. Ghi bảng nhạy cảm theo
  `fn_co_quyen_module(module, actions)` thay vì `USING (true)` — mẫu ở migration 013, 014.
- Bảng nghiệp vụ mới: gắn trigger nhật ký `CREATE TRIGGER trg_nhat_ky_thay_doi AFTER INSERT OR UPDATE OR DELETE
  … EXECUTE FUNCTION fn_ghi_nhat_ky_thay_doi()` (migration 016). Nhật ký `fp_var_nhat_ky_thay_doi` ghi người
  làm thật từ JWT và lưu dòng bị xoá — tra ai sửa/xoá gì, khôi phục dữ liệu xoá nhầm ở đó.
- Mật khẩu chỉ ghi qua RPC `rpc_set_mat_khau` (bcrypt server-side); không hash ở browser,
  không UPDATE thẳng `mat_khau_hash`.
- Thông báo sinh bằng trigger DB ghi vào outbox, **không** gọi thêm insert từ frontend sau mutation —
  làm vậy sẽ sót khi dữ liệu đổi từ SQL tay hoặc module khác. Xem [docs/THONG_BAO_PUSH.md](docs/THONG_BAO_PUSH.md).
- Thêm chuỗi hiển thị vào `vi.json` của module hoặc `locales/vi/*.json` (`node scripts/check-i18n-keys.mjs`
  soi trùng khoá).
- Format: ESLint là chuẩn bắt buộc. Prettier CHƯA áp cho toàn repo (`npm run format:check` đang báo rất
  nhiều file) — đừng chạy `npm run format` cả repo trong một thay đổi tính năng (diff khổng lồ, đè việc
  đang làm song song); nếu muốn áp prettier thì làm một commit riêng chỉ format.
- Commit message: dòng đầu tiếng Việt có dấu nói rõ việc đã làm (vd "Thêm module Giám sát chất lượng"),
  dòng trống, rồi gạch đầu dòng chi tiết nếu cần. Không dùng message vô nghĩa ("312313", "jhkjhk") —
  lịch sử git là chỗ tra lại khi có lỗi.

## Ghi chép theo mảng — `.claude/rules/`

Chi tiết từng mảng nằm ở `.claude/rules/` và **tự nạp** khi đọc/sửa file thuộc mảng đó. Làm việc liên quan mà chưa chạm file mảng (lên kế hoạch, trả lời câu hỏi) thì đọc file rule tương ứng trước.

| Mảng | File | Tự nạp khi chạm |
|---|---|---|
| Danh sách phân trang/lọc/sắp xếp ở PostgREST (khuôn `*-list-query` + `*-db.service`) | [danh-sach-phan-trang-server.md](.claude/rules/danh-sach-phan-trang-server.md) | `features/**/services/*-list-query.ts`, `features/**/services/*-db.service.ts`, `lib/postgrest-search.ts` … |
| GenericTable/HierarchyTable, kéo cột, ô tìm kiếm, chip lọc, toolbar mobile | [bang-va-toolbar-loc.md](.claude/rules/bang-va-toolbar-loc.md) | `components/shared/GenericTable.tsx`, `components/shared/HierarchyTable.tsx`, `components/shared/GenericToolbar.tsx` … |
| Sổ quỹ: trạng thái duyệt, tồn quỹ, trigger `fn_tc_quy_khoa_duyet` | [so-quy-thu-chi.md](.claude/rules/so-quy-thu-chi.md) | `features/tai-chinh/**` |
| Trang in phiếu (`PhieuInPage`, khổ/hướng/lề, PDF/DOC) | [phieu-in.md](.claude/rules/phieu-in.md) | `components/shared/phieu-in/**`, `lib/phieu-in/**` |
