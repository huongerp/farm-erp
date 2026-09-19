# CLAUDE.md — farm-erp

Ứng dụng ERP nội bộ (React 19 + Vite + TypeScript), dữ liệu qua **PostgREST self-host** trên VPS,
đăng nhập qua **auth-service** riêng (`services/auth`, Hono + JWT). Trước đây chạy trên Supabase —
nhiều tên hàm/bảng/tài liệu còn giữ tiền tố `supabase-`, đó là di sản đặt tên chứ không phải
còn phụ thuộc Supabase.

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

Dev server **không** chạy bằng lệnh nền thủ công — `vite/dev-services.ts` tự bật PostgREST,
auth-service và notify-service kèm `npm run dev` (bỏ qua bằng `DEV_SKIP_SERVICES=1`). Chi tiết biến môi trường:
[README.md](README.md).

## Bản đồ thư mục

- `App.tsx` — router, theme, ngôn ngữ, route bảo vệ, bootstrap phiên.
- `features/<nhóm>/<module>/` — nghiệp vụ theo nhóm: `he-thong`, `hanh-chinh`, `kho-van`,
  `mua-hang`, `quan-ly-nha-so-che`.
- `components/` — `ui/` (Button, Input, Table…), `shared/` (ConfirmDialog, Section,
  ModulePermissionGuard…), `layout/`, `auth/`.
- `lib/` — hạ tầng dùng chung: `db.ts` (PostgrestClient), `auth.ts`, `token-store.ts`,
  `mat-khau.ts`, `constants.ts`, `i18n.ts`, menu, hooks.
- `store/` — Zustand: `useStore.ts` (auth), `useConfirmStore.ts`, `createGenericStore.ts`.
- `pages/` — trang đơn (Login, Profile, Settings, dashboards…).
- `locales/` — `vi.json`, `en.json`. Không hardcode chuỗi hiển thị.
- `services/auth/` — auth-service (Node/Hono): đăng nhập mật khẩu + Google, ký JWT, refresh token.
- `services/notify/` — notify-service (Node/Hono): worker thông báo (outbox + LISTEN/NOTIFY) và
  endpoint đăng ký Web Push. Logic "ai nhận / viết gì" nằm ở `src/core/` và có test cạnh file.
- `sw/sw.ts` — service worker tự viết (vite-plugin-pwa chế độ `injectManifest`): precache, runtime
  caching và listener `push` / `notificationclick`.
- `docs/` — SQL migration + tài liệu vận hành.
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

- Truy vấn dữ liệu: `db` từ `lib/db.ts` (PostgREST), **không** import supabase-js cho dữ liệu nghiệp vụ.
- Lỗi từ PostgREST format qua `lib/supabase-errors.ts` để hiện toast tiếng Việt kèm mã lỗi.
- Bảng dữ liệu đặt tên `fp_var_*` (danh mục/hệ thống), `fp_farm_*` (nghiệp vụ farm), `fp_hr_*` (nhân sự).

### Danh sách: phân trang ở SERVER, không tải cả bảng

Module có dữ liệu lớn dần theo thời gian (phiếu, báo cáo, danh mục hàng hoá) phải
lọc / sắp xếp / cắt trang ở PostgREST. Khuôn đã áp dụng — xem
`features/quan-ly-nha-so-che/bao-cao-nhan-cong` làm mẫu đầy đủ nhất:

```
services/<module>-list-query.ts   # kiểu XListServerQuery + cột sort được ở DB
services/<module>-supabase...ts   # apply<X>ListQuery dùng chung cho:
                                  #   get<X>Page()            → một trang (fetchTablePage)
                                  #   fetchAll<X>ForListQuery() → CHỈ khi bấm Xuất file
                                  #   get<X>TomTat()          → vài cột cho chip lọc/gợi ý
hooks/use-<module>.ts             # use<X>Page(query) + placeholderData: keepPreviousData
components/<X>List.tsx            # GenericTable nhận totalRecordsOverride + isFetching
```

- Ô tìm kiếm ở server: `applyPostgrestSearch` (`lib/postgrest-search.ts`) — tự escape
  `%`/`_`, chỉ so cột số khi từ khoá là số nguyên, cột ngày nhận `dd/mm/yyyy`.
- Lọc theo kỳ (năm/tháng): `dieuKienKyTheoNgay` cùng file.
- Cần lọc theo cột của bảng khác (tên nhân viên, chi nhánh của tài sản): tra id trước
  bằng một truy vấn nhẹ rồi `.in('cot_id', ids)` — xem `bang-luong-service.ts`.
- Bảng cha kèm bảng con: dùng embed của PostgREST
  (`ban_cha(cot,...,bang_con(cot,...))`) để lấy một trang trong MỘT request, thay vì
  `.in()` với toàn bộ id.
- Chip lọc và số đếm phải tính trên **toàn bộ** dữ liệu → dùng bản `TomTat` vài cột,
  không dùng dữ liệu của trang đang xem.

**Cố ý GIỮ lọc ở client** (chuyển sang server là sai hướng, không phải bỏ sót):

- **Bảng cây** — Công việc (`id_cha`), Phòng ban: cắt trang ở DB làm mất nhánh cha
  hoặc con nằm ngoài trang, cây dựng ra sẽ sai.
- **Danh mục cấu hình dùng làm ref chung** — kho, chi nhánh, chức vụ, cấp bậc, nhóm
  tài sản, nơi lưu, hạng mục thu chi…: số dòng cố định nhỏ, lại được cache IndexedDB
  và dùng lại ở form/phiếu khắp nơi; phân trang riêng cho màn danh sách sẽ phá cache
  dùng chung đó.
- **Kanban / Gantt / báo cáo tổng hợp**: bản chất cần toàn bộ tập dữ liệu trong phạm
  vi, nên lọc ở server theo kỳ + phạm vi thay vì cắt trang.

### Bảng dùng chung

- `GenericTable` / `HierarchyTable` đặt `table-layout: fixed` + `<colgroup>` + một
  `<col>` đệm. Thiếu ba thứ này thì kéo đổi bề rộng cột sẽ "không ăn".
- Kéo cột: truyền `onResizeColumn={resizeColumn}` của store; logic nằm ở
  `lib/table-core/use-column-resize.ts` (pointer event, ←/→, double-click auto-fit).
- Ẩn/hiện cột, thứ tự và bề rộng được lưu qua `zustand/persist`; mỗi store khai
  `storageKey` dạng `table-<module>`. `resetState()` CỐ Ý không đụng `columns`.
- Ô tìm kiếm quét **mọi cột** qua `createListSearchMatcher` (`lib/list-search-matcher.ts`),
  bỏ dấu tiếng Việt. Placeholder dùng chung `common.searchPlaceholder` — không đặt
  gợi ý riêng từng module (làm người dùng tưởng chỉ tìm được vài cột được kể tên).

## Phân quyền — hai tầng phải khớp nhau

1. **Tầng app**: `fp_var_phan_quyen` (chuc_vu_id + module_id + actions) → `ModulePermissionGuard`
   cấp `canView/canCreate/canUpdate/canDelete/canApprove/canAdmin`.
2. **Tầng DB**: RLS policy + RPC `SECURITY DEFINER` trong `docs/*.sql`.

Sửa quyền ở một tầng thì phải soi tầng kia, nếu không UI cho bấm mà DB từ chối (đúng ca lỗi
`[P0001] … rpc_set_mat_khau`, xử lý ở [docs/vps-05-quyen-doi-mat-khau.sql](docs/vps-05-quyen-doi-mat-khau.sql)).

Quy ước "cấp cao": `cap_bac = 1` hoặc quyền `admin`/`all` trên module → xem/sửa toàn phạm vi;
xem mẫu ở các hook `use-*-view-scope.ts`.

## Test

- Vitest **node-first**: `environment: 'node'`, project `dom` (jsdom) chỉ áp cho `*.test.tsx`.
  File `.ts` cần DOM thì thêm docblock đầu file: `// @vitest-environment jsdom`.
- Test nằm **cạnh file nguồn** với code mới (`foo.ts` + `foo.test.ts`); thư mục `__tests__/` là
  di sản, không tạo thêm.
- Ưu tiên test logic thuần: quyền/phạm vi xem, tính kỳ–ngày–hạn, parse/import/export, tiền lương,
  máy trạng thái. Không test render/layout/wrapper mỏng.

## Tài liệu tham chiếu

- [docs/UI-CONVENTIONS.md](docs/UI-CONVENTIONS.md) — thang chữ, Dialog/Drawer, Section, design system.
- [docs/VPS_POSTGREST_PLAN.md](docs/VPS_POSTGREST_PLAN.md), [docs/VPS_CUTOVER.md](docs/VPS_CUTOVER.md) — kiến trúc self-host và runbook cut-over.
- [docs/RUI_RO_NEN_TANG_DU_LIEU.md](docs/RUI_RO_NEN_TANG_DU_LIEU.md) — rủi ro nền tảng dữ liệu.
- [docs/BUNDLE_OPTIMIZATION.md](docs/BUNDLE_OPTIMIZATION.md), [docs/EGRESS_OPTIMIZATION.md](docs/EGRESS_OPTIMIZATION.md) — tối ưu bundle và egress.
- [docs/THONG_BAO_PUSH.md](docs/THONG_BAO_PUSH.md) — thông báo + Web Push: kiến trúc outbox, thứ tự chạy SQL,
  catalog sự kiện (bắn gì / khi nào / cho ai), cách đấu thêm module, soi lỗi.
- SQL migration: `docs/vps-0*.sql` (VPS, chạy tuần tự), `docs/supabase-*.sql` (bảng/RPC theo module).

## Lưu ý khi sửa

- Migration SQL mới: thêm file vào `docs/`, không sửa đè file đã chạy trên VPS.
- Mật khẩu chỉ ghi qua RPC `rpc_set_mat_khau` (bcrypt server-side); không hash ở browser,
  không UPDATE thẳng `mat_khau_hash`.
- Thông báo sinh bằng trigger DB ghi vào outbox, **không** gọi thêm insert từ frontend sau mutation —
  làm vậy sẽ sót khi dữ liệu đổi từ SQL tay hoặc module khác. Xem [docs/THONG_BAO_PUSH.md](docs/THONG_BAO_PUSH.md).
- Sổ quỹ (`features/tai-chinh/thu-chi-quy`) có trạng thái khoá: `mo` / `khoa` / `cho_mo`. Luật thuần ở
  `core/trang-thai.ts` (có test), cổng theo người dùng ở `hooks/use-thu-chi-quy-permissions.ts`. Mở khoá
  chỉ dành cho `cap_bac = 1` / quản trị; phiếu khoá phải chặn cả ở `ThuChiLienQuanSection` (bảng nhúng
  trong drawer của 3 module khác, KHÔNG đọc được ModulePermissionGuard của quỹ).
- Thêm chuỗi hiển thị phải thêm cả `vi.json` và `en.json` (`node scripts/check-i18n-keys.mjs` để soi thiếu).
