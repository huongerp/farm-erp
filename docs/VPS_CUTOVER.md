# Cut-over: chuyển hẳn sang PostgREST self-host

Runbook thao tác cho ngày chuyển đổi. Thiết kế và lý do chọn từng phương án nằm ở `docs/VPS_POSTGREST_PLAN.md`; phần dữ liệu (dump/restore) ở `docs/VPS_MIGRATION.md`.

Toàn bộ code đã xong: SQL, auth-service, docker-compose, frontend. Việc còn lại là chạy đúng thứ tự.

## 0. Thứ tự không được đổi

```
SQL trên VPS  →  deploy PostgREST  →  smoke test  →  deploy auth + web
              →  đồng bộ dữ liệu lần cuối  →  đổi DNS  →  siết bảo mật
```

Smoke test phải xanh **trước khi** người dùng thật vào, vì đó là chỗ duy nhất phát hiện sai khác phiên bản PostgREST.

## 1. Sinh secret và khai biến môi trường

Trên máy bạn:

```bash
openssl rand -base64 48   # PGRST_JWT_SECRET
openssl rand -base64 32   # AUTH_SERVICE_DB_PASSWORD (nếu chưa có trong .env)
```

Điền vào `.env` (dùng khi chạy script SQL và smoke test) và vào **tab Environment của Dokploy** (dùng khi chạy container). Danh sách đầy đủ ở `.env.example`; bắt buộc phải có:

| Biến | Dùng ở | Ghi chú |
| --- | --- | --- |
| `APP_DOMAIN` | Traefik | domain duy nhất, ví dụ `erp.5fedu.vn` |
| `PGRST_JWT_SECRET` | PostgREST + auth-service | **phải giống nhau**, tối thiểu 32 ký tự |
| `PGRST_DB_URI` | PostgREST | role `authenticator`, hostname nội bộ Dokploy |
| `AUTH_DATABASE_URL` | auth-service | role `auth_service`, hostname nội bộ Dokploy |
| `GOOGLE_CLIENT_ID` | auth-service + bundle SPA | cùng một client ID |
| `VITE_CLOUDINARY_*`, `VITE_SENTRY_DSN` | build SPA | giữ như hiện tại |

Không khai `VITE_API_URL` / `VITE_AUTH_URL`: để trống thì SPA gọi `/api` và `/auth` tương đối, nên đổi domain về sau **không phải build lại image**.

## 2. SQL còn thiếu trên VPS

`vps-01` → `vps-03` đã chạy xong đợt trước. Còn lại:

```bash
psql "$VPS_DB_URL" -v auth_service_password="$AUTH_SERVICE_DB_PASSWORD" \
  -f docs/vps-04-auth-schema.sql
psql "$VPS_DB_URL" -f docs/vps-04-auth-test.sql   # 9 test, tự ROLLBACK
```

`vps-04` tạo role `auth_service`, bảng phiên, bảng chống dò mật khẩu, các RPC đăng nhập, trigger thu hồi phiên khi nghỉ việc, và **xoá 2 policy `anon`** trên `fp_hr_nhom_phieu_hanh_chinh`. Test phải 9/9 xanh.

## 3. Deploy PostgREST rồi smoke test

Trong Dokploy: tạo Compose service trỏ vào repo, file `docker-compose.yml`. Deploy trước một mình `postgrest` (hoặc deploy cả 3 nhưng chưa đổi DNS), gắn domain `APP_DOMAIN` và bật TLS Let's Encrypt.

```bash
./scripts/postgrest-smoke.sh https://<APP_DOMAIN>/api
```

Script tự ký JWT bằng `PGRST_JWT_SECRET`, kiểm mọi nhóm cú pháp app đang dùng và cả 28 RPC, đồng thời xác nhận không token thì bị chặn. **Có test đỏ vì lệch phiên bản** → sửa `image:` trong `docker-compose.yml` về `postgrest/postgrest:v12.2` (bản Supabase đang chạy), deploy lại, chạy lại.

## 4. Deploy auth-service và web

Google Cloud Console → OAuth client đang dùng → **Authorized JavaScript origins** thêm `https://<APP_DOMAIN>`. Luồng GIS không cần Client Secret cũng không cần redirect URI; thiếu origin thì nút Google im lặng không hiện.

```bash
curl -fsS https://<APP_DOMAIN>/auth/khoe        # {"ok":true}
curl -fsS -X POST https://<APP_DOMAIN>/auth/dang-nhap \
  -H 'content-type: application/json' \
  -d '{"email":"...","mat_khau":"..."}'
```

Đăng nhập thành công trả `access_token` (15 phút) + `refresh_token` (30 ngày) + `phai_doi_mat_khau`.

## 5. Đồng bộ dữ liệu lần cuối

Chọn giờ ít người dùng, thông báo trước, rồi:

```bash
./scripts/vps-dump-restore.sh all             # dump → prepare → restore → postcheck
./scripts/vps-dump-restore.sh sync-passwords  # copy mat_khau_hash từ Supabase
./scripts/vps-dump-restore.sh cleanup         # bỏ dual-write, drop ensure_auth_user
psql "$VPS_DB_URL" -v auth_service_password="$AUTH_SERVICE_DB_PASSWORD" \
  -f docs/vps-04-auth-schema.sql              # restore ghi đè public → chạy lại
```

Bước cuối là chỗ dễ quên nhất: `restore` nạp lại schema `public` từ Supabase nên xoá mất những gì `vps-04` đã tạo. Chạy lại `vps-04` rồi `vps-04-auth-test.sql` để chắc.

Từ lúc này **Supabase phải coi là chỉ đọc** — ai còn dùng app cũ thì dữ liệu ghi vào đó sẽ mất.

## 6. Nghiệm thu trên domain mới

- [ ] Đăng nhập bằng mật khẩu, và bằng Google với email có hồ sơ nhân viên
- [ ] Google với email không có hồ sơ → hiện đúng thông báo, không tạo phiên
- [ ] Nhân viên `phai_doi_mat_khau = true` bị đưa sang trang đổi mật khẩu ngay
- [ ] Sai mật khẩu 11 lần liên tiếp → bị chặn tạm 15 phút
- [ ] Đặt một nhân viên sang Nghỉ việc → phiên bị thu hồi, refresh thất bại
- [ ] Đóng tab rồi mở lại → vẫn đăng nhập (refresh token còn hạn)
- [ ] Đăng xuất ở một tab → tab còn lại cũng thoát
- [ ] Đi hết các module chính: tạo, sửa, xoá, import Excel, xuất PDF
- [ ] DevTools → Network: không còn request nào đi `supabase.co`
- [ ] DevTools → Console: không có lỗi 401/403 lạ

## 7. Siết bảo mật sau khi ổn

Chỉ làm sau khi app chạy ổn định vài ngày (Supabase là đường lùi trong thời gian đó):

1. Đóng port 5432 ra Internet trên VPS (dump/restore từ máy ngoài không cần nữa).
2. Đổi mật khẩu role `5fedu`, xoá `SUPABASE_DB_URL` và `VPS_DB_URL` khỏi `.env`.
3. Tắt project Supabase, hoặc ít nhất thu hồi anon key.
4. Xoá `scripts/migrate-base64-to-cloudinary.mjs` cùng `@supabase/supabase-js` trong devDependencies nếu đã dọn xong 17 dòng ảnh base64 còn lại.

## Đường lùi

| Tình huống | Cách lùi |
| --- | --- |
| Smoke test đỏ | Chưa đổi DNS, app cũ vẫn chạy Supabase — không ảnh hưởng ai |
| Frontend mới lỗi nặng | Deploy lại image trước đó trong Dokploy (giữ lại tag cũ) |
| Dữ liệu trên VPS sai | `./scripts/vps-dump-restore.sh all` lần nữa, Supabase vẫn là nguồn |
| Cần quay hẳn về Supabase | `git revert` các commit giai đoạn 4, build lại với biến Supabase cũ |

## Việc còn nợ, không thuộc đợt này

**234 policy RLS đều là `TO authenticated USING (true)`** — ai có token hợp lệ đọc ghi được mọi bảng, phân quyền theo module hiện chỉ chặn ở giao diện. Supabase trước giờ cũng vậy nên **không phải hồi quy**, nhưng khi tự phơi API ra Internet thì cần siết lại thành việc riêng. Phần bù trước mắt: access token 15 phút và trigger thu hồi phiên.

**`main` chunk đang 716 KB so với baseline 503 KB** (`scripts/bundle-baseline.json` từ 2026-06-13). Đây là nợ có trước, không do đợt này: bỏ `supabase-js` còn làm chunk `supabase` giảm từ 168 KB xuống 16 KB. Cần một đợt riêng để xử lý rồi cập nhật baseline.

**Vài tên còn chữ "supabase"**: `lib/supabase-errors.ts` cùng `throwSupabaseError` / `formatSupabaseError` (27 chỗ gọi), và hai file `*-supabase.service.ts`, `use-supabase-ref-queries.ts`. Client đã đổi thành `lib/db.ts` / biến `db`; phần còn lại thuần đổi tên, để riêng một commit cho khỏi trộn vào diff cần review.
