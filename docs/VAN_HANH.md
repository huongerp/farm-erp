# Vận hành farm-erp — runbook

Các lệnh `bash scripts/…` chạy ở máy có `.env` và SSH alias `5fedu` (script tự mở tunnel tới Postgres).

## 1. Phát hành bản mới

1. CI trên GitHub phải xanh cho commit định deploy (tab Actions).
2. Tăng `version` trong `package.json` (vd `1.0.0` → `1.1.0`), commit, gắn tag và đẩy lên:
   ```bash
   git tag -a v1.1.0 -m "Phiên bản 1.1.0" && git push origin main --tags
   ```
3. Có migration mới → làm mục 2 **trước** khi deploy code cần nó.
4. Dokploy → Compose service farm-erp → **Deploy**.
5. Kiểm tra sau deploy (thay `<domain>`):
   ```bash
   curl -s https://<domain>/auth/khoe     # {"ok":true,...}
   curl -s https://<domain>/notify/khoe
   curl -s https://<domain>/sheets/khoe
   curl -sI https://<domain>/ | grep -iE "strict-transport|x-frame|content-security"
   ```
   Mở app, đăng nhập, xem số phiên bản ở cuối trang Cài đặt đúng bản vừa phát hành.
6. Lỗi nặng → Dokploy deploy lại commit trước (hoặc `git revert` rồi deploy). Migration đã chạy thì
   đánh giá có cần migration đảo ngược không (mục 2) — code cũ thường vẫn chạy với schema mới.

## 2. Chạy migration

Không có DB thử: migration chạy thẳng lên dữ liệu thật.

1. Sao lưu: `bash scripts/db-backup.sh truoc-NNN` → `backup/<thời gian>-truoc-NNN.dump` (~160 MB,
   chứa dữ liệu thật, không commit / không gửi đi).
2. Chạy thử trong transaction rồi huỷ — copy nội dung file, bỏ `BEGIN;`/`COMMIT;`, bọc giữa
   `BEGIN;` … `ROLLBACK;`, thêm câu kiểm tra (giả lập người dùng như dưới) rồi chạy bằng `db-sql.sh -f`.
   Giả lập request của một nhân viên:
   ```sql
   SELECT set_config('request.jwt.claims', '{"role":"authenticated","nv":<id nhân viên>}', true);
   SET LOCAL ROLE authenticated;
   -- câu lệnh muốn thử …
   RESET ROLE;
   ```
3. Chạy thật: `bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/NNN-*.sql`.
   File kết thúc bằng `NOTIFY pgrst, 'reload schema';` để PostgREST nạp lại schema.

Quy ước khi viết migration (quyền hàm, RLS, trigger nhật ký): xem `CLAUDE.md` mục "Lưu ý khi sửa".

## 3. Giám sát

- **Uptime:** đặt một dịch vụ kiểm tra từ bên ngoài (UptimeRobot, Better Stack, Uptime Kuma…) gọi 5 phút/lần
  bốn địa chỉ ở mục 1 bước 5 (trang chủ + 3 `/khoe`), báo qua email/Zalo/Telegram khi lỗi. `/khoe` trả 503
  khi service mất kết nối DB.
- **Lỗi giao diện:** đặt `VITE_SENTRY_DSN` đúng dạng `https://<khoá>@<host>/<id>` trong Dokploy rồi deploy lại;
  sai dạng thì app bỏ qua và in cảnh báo ra Console.
- **Log service:** Dokploy → service → Logs. Log Docker giữ tối đa 3 × 10 MB mỗi service.

## 4. Sự cố thường gặp

| Hiện tượng | Kiểm tra | Xử lý |
|---|---|---|
| Không ai đăng nhập được | `/auth/khoe`; log service `auth` | DB chết → khởi động lại Postgres trong Dokploy. `PGRST_JWT_SECRET` của PostgREST và auth lệch nhau → khai lại cho khớp, deploy |
| Đăng nhập được nhưng mọi màn báo lỗi / trống | Console trình duyệt, log `postgrest` | Lỗi schema cache sau migration → chạy `NOTIFY pgrst, 'reload schema';`. Lỗi 403 hàng loạt → policy vừa đổi, xem migration gần nhất |
| Một người báo "không có quyền" | Phân quyền chức vụ của người đó (module Phân quyền) | Cấp quyền cho chức vụ. Nhớ: DB cũng kiểm quyền với bảng nhân viên, phân quyền, chức vụ, cấp bậc, bảng lương |
| "Đăng nhập sai quá nhiều lần" | Bảng `fp_var_lan_dang_nhap_sai` (theo email) | Tự hết sau 15 phút; chặn theo IP (30 lần sai / 15 phút) reset khi khởi động lại `auth` |
| Không nhận thông báo đẩy | `/notify/khoe` trả `"push": true`? | Xem [THONG_BAO_PUSH.md](THONG_BAO_PUSH.md) mục soi lỗi |
| Xuất / đồng bộ Google Sheet lỗi | `/sheets/khoe`, log `sheets` | Xem [GOOGLE_SHEETS.md](GOOGLE_SHEETS.md) mục soi lỗi |
| Người dùng vẫn thấy bản cũ | Số phiên bản ở trang Cài đặt | App tự cập nhật khi rảnh; bảo người dùng tải lại trang |

## 5. Tra nhật ký thay đổi, khôi phục dữ liệu xoá nhầm

Mọi thêm / sửa / xoá trên bảng nghiệp vụ được ghi vào `fp_var_nhat_ky_thay_doi` (migration 016) kèm người
làm thật. Chỉ cấp cao đọc được qua API; tra bằng SQL:

```bash
# Ai đã sửa / xoá phiếu kho id 123 (và các dòng chi tiết của nó)
bash scripts/db-sql.sh -c "
  SELECT n.thoi_diem, n.bang, n.thao_tac, n.ban_ghi_id, nv.ho_va_ten, n.du_lieu_cu, n.du_lieu_moi
  FROM fp_var_nhat_ky_thay_doi n LEFT JOIN fp_var_nhan_vien nv ON nv.id = n.nhan_vien_id
  WHERE (n.bang = 'fp_mh_phieu_kho' AND n.ban_ghi_id = '123')
     OR (n.bang = 'fp_mh_phieu_kho_chi_tiet' AND (coalesce(n.du_lieu_cu, n.du_lieu_moi)->>'id_phieu_kho') = '123')
  ORDER BY n.thoi_diem"
```

Khôi phục một dòng đã xoá (lấy `id` của dòng nhật ký `thao_tac = 'xoa'`):

```sql
INSERT INTO public.<bảng>
SELECT * FROM jsonb_populate_record(NULL::public.<bảng>,
  (SELECT du_lieu_cu FROM public.fp_var_nhat_ky_thay_doi WHERE id = <id nhật ký>));
```

Giá trị dài trên 2000 ký tự (ảnh base64) được lược trong nhật ký — cột đó phải lấy từ bản sao lưu (mục 6).
Khôi phục phiếu có chi tiết: khôi phục dòng cha trước, rồi các dòng chi tiết.

Dung lượng nhật ký: `SELECT pg_size_pretty(pg_total_relation_size('fp_var_nhat_ky_thay_doi'));`.
Cần dọn thì xoá bản ghi cũ hơn N tháng bằng role chủ DB (sao lưu trước).

## 6. Khôi phục từ bản sao lưu

`pg_restore --clean` **ghi đè toàn bộ DB** — chỉ dùng khi mất dữ liệu diện rộng. Khôi phục một phần:
dựng bản sao lưu vào một database tạm rồi chép đúng bảng / dòng cần lấy.

```bash
# Dựng vào database tạm "fpfarm_khoi_phuc" trên cùng server rồi tra / chép dữ liệu cần lấy
bash scripts/db-sql.sh -c "CREATE DATABASE fpfarm_khoi_phuc"
pg_restore --no-owner --no-privileges -d "<VPS_DB_URL đổi tên database thành fpfarm_khoi_phuc>" backup/<file>.dump
# … xong thì: DROP DATABASE fpfarm_khoi_phuc
```

## 7. Bật chặn CSP

`deploy/nginx-security-headers.conf` đang gửi CSP ở chế độ **Report-Only** (chỉ ghi Console). Sau một thời gian
dùng thật (đăng nhập Google, chọn file Sheet, upload ảnh, xuất PDF, in tem) mà Console không còn dòng
`[Report Only] Refused to …`, đổi tên header thành `Content-Security-Policy` rồi deploy. Sửa 2 thẻ `<script>`
inline trong `index.html` thì chạy `npm run build && node scripts/csp-hash.mjs` và cập nhật hash.

## 8. Đổi bí mật

Danh sách bí mật, ảnh hưởng khi đổi: [BAN_GIAO_TAI_KHOAN.md](BAN_GIAO_TAI_KHOAN.md) mục 3.
