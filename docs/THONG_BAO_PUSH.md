# Thông báo trong app + Web Push — vận hành

Tính năng gồm ba phần: **outbox trong Postgres**, **service `notify`** (Node), và **chuông + trang cài đặt**
trong SPA. Tài liệu này là runbook triển khai và nơi soi khi có sự cố.

## Kiến trúc

```
UPDATE fp_mh_phieu_kho SET trang_thai='Đã duyệt' …
        │  (cùng transaction)
        ▼
  trigger fn_ghi_su_kien_thong_bao()
        │  INSERT fp_var_su_kien_thong_bao   ← sự kiện thô, chưa biết ai nhận
        │  pg_notify('thong_bao_moi', <id>)
        ▼
  services/notify  (giữ LISTEN, kèm vòng quét 30 giây làm lưới an toàn)
        │  1. phanTichSuKien   — chuyện gì vừa xảy ra
        │  2. dinhTuyen        — ai nhận
        │  3. renderThongBao   — viết gì
        │  4. INSERT fp_var_thong_bao (n dòng)
        │  5. web-push tới từng thiết bị đã đăng ký
        ▼
  chuông trong app  +  thông báo màn hình khoá
```

Trigger cố tình mỏng: nó chỉ chụp dòng dữ liệu, không chứa logic nghiệp vụ. Toàn bộ phần "ai nhận / viết gì"
nằm trong TypeScript nên test được bằng vitest và sửa câu chữ không phải chạy migration.

## Thứ tự chạy SQL

Chạy **đúng thứ tự** này trên Postgres của VPS:

| # | File | Tạo ra |
|---|---|---|
| 1 | `docs/supabase-fp_var_su_kien_thong_bao.sql` | Bảng outbox, `fn_ghi_su_kien_thong_bao()`, role `notify_service` |
| 2 | `docs/supabase-fp_var_thong_bao.sql` | Bảng thông báo, RLS, RPC đọc/xoá tất cả |
| 3 | `docs/supabase-fp_var_thong_bao_cai_dat.sql` | Bảng cài đặt + tuỳ chọn (giờ yên lặng) |
| 4 | `docs/supabase-fp_var_push_subscription.sql` | Bảng thiết bị đăng ký push |
| 5 | `docs/supabase-rpc_thong_bao_dinh_tuyen.sql` | RPC tra người duyệt / chi nhánh / tên nhân viên |
| 6 | `docs/supabase-trigger_thong_bao_7_module.sql` | Gắn trigger cho 7 bảng nghiệp vụ |

File **#1 tự tạo role `notify_service` và in mật khẩu ra NOTICE** — chép mật khẩu đó vào
`NOTIFY_DATABASE_URL` rồi xoá khỏi log. Chạy lại file này không đổi mật khẩu role đã có.

Phụ thuộc có sẵn: `public.nhan_vien_hien_tai_id()` (`docs/vps-05-quyen-doi-mat-khau.sql`) và
`auth.jwt()` (`docs/vps-01-prepare-target.sql`).

Sau khi chạy xong, PostgREST cần nạp lại schema cache để thấy bảng và RPC mới.

## Biến môi trường

```bash
# Kết nối của worker — role notify_service chỉ chạm được 4 bảng thông báo
NOTIFY_DATABASE_URL=postgresql://notify_service:<mat-khau>@<host-noi-bo>:5432/fpfarm
NOTIFY_SERVICE_DB_PASSWORD=<mat-khau>          # dùng khi chạy dev ở máy

# Khoá VAPID — sinh MỘT LẦN rồi giữ nguyên
#   npx web-push generate-vapid-keys
VITE_VAPID_PUBLIC_KEY=<public key>             # nhúng vào bundle lúc build
VAPID_PRIVATE_KEY=<private key>                # chỉ service notify biết
VAPID_SUBJECT=mailto:admin@forpeasantz.vn

COMPANY_TZ=Asia/Ho_Chi_Minh                    # tính giờ yên lặng
```

**Đổi khoá VAPID làm mọi thiết bị đã đăng ký ngừng nhận push** và người dùng phải bật lại từng máy.
Bỏ trống cả hai khoá thì hệ thống vẫn chạy: chuông trong app hoạt động bình thường, chỉ tắt phần đẩy ra
màn hình khoá.

## Bắn cái gì, khi nào, cho ai

Mức **cao** = rung push ngay; **thường** = vào chuông, push theo cài đặt.

### Bốn module phiếu có luồng duyệt
`kho-van/phieu-kho` · `mua-hang/phieu-de-xuat-vat-tu` · `quan-ly-nha-so-che/de-xuat-mua-hang` · `quan-ly-nha-so-che/phieu-kho-phan-thuoc`

| Sự kiện | Khi | Ai nhận | Mức |
|---|---|---|---|
| `phieu.cho_duyet` | INSERT hoặc → `Chờ duyệt` | Người có quyền duyệt cùng chi nhánh + cấp bậc 1 | thường |
| `phieu.doi_duyet` | → `Đợi duyệt` | Người tạo + nhóm duyệt | thường |
| `phieu.da_duyet` | → `Đã duyệt` | Người tạo | thường |
| `phieu.khong_duyet` | → `Không duyệt` | Người tạo (kèm lý do) | **cao** |
| `phieu.sua_sau_duyet` | Sửa nội dung khi đang `Đã duyệt` | Người tạo + người duyệt | **cao** |

### Công việc — `hanh-chinh/cong-viec`

| Sự kiện | Khi | Ai nhận | Mức |
|---|---|---|---|
| `cong_viec.duoc_giao` | INSERT, hoặc `trach_nhiem` đổi | Người chịu trách nhiệm | **cao** |
| `cong_viec.them_ho_tro` | `nguoi_ho_tro[]` thêm người | Chỉ người vừa được thêm | thường |
| `cong_viec.trao_doi_moi` | `trao_doi` dài thêm | Người giao + trách nhiệm + hỗ trợ | thường |
| `cong_viec.cho_bao_cao` | → `cho_bao_cao` | Người giao việc | **cao** |
| `cong_viec.hoan_thanh` | → `hoan_thanh` | Người giao việc | thường |
| `cong_viec.huy` | → `huy` | Trách nhiệm + hỗ trợ | thường |

### Phiếu hành chính — `hanh-chinh/phieu-hanh-chinh`

Bảng chỉ có **một cấp duyệt**. Hằng `ADMIN_FORM_STATUSES` phía app còn giá trị `manager_approved` nhưng đó là
di sản: `admin-form-service.ts` chỉ ghi `Chờ duyệt / Đã duyệt / Từ chối / Đã hủy`, và bảng không có cột
`quan_ly_id` hay `hcns_id`. Người duyệt xác định bằng quyền `admin`/`all` trên module (theo
`usePhieuHanhChinhViewScope`), không phải bằng `approve`.

| Sự kiện | Khi | Ai nhận | Mức |
|---|---|---|---|
| `hanh_chinh.cho_duyet` | INSERT `Chờ duyệt` | Người có quyền duyệt + cấp bậc 1 | **cao** |
| `hanh_chinh.da_duyet` | → `Đã duyệt` | Người tạo | **cao** |
| `hanh_chinh.tu_choi` | → `Từ chối` | Người tạo | **cao** |
| `hanh_chinh.da_huy` | → `Đã hủy` | Người duyệt | thường |

### Đơn đặt hàng — `mua-hang/don-dat-hang`

Máy trạng thái 7 bước, chỉ báo 5 mốc có người phải hành động. Bỏ `Nháp → Đã gửi` và `Đã đóng`.

| Sự kiện | Khi | Ai nhận | Mức |
|---|---|---|---|
| `don_hang.cho_duyet` | → `Chờ duyệt` | Người có quyền duyệt + cấp bậc 1 | thường |
| `don_hang.da_xac_nhan` | → `Đã xác nhận` | Người đặt | thường |
| `don_hang.dang_giao` | → `Đang giao` | Người đặt | thường |
| `don_hang.da_nhan_du` | → `Đã nhận đủ` | Người đặt | thường |
| `don_hang.huy` | → `Hủy` | Người đặt + người duyệt | **cao** |

### Ba luật chống ồn

1. **Không gửi ngược cho người gây ra sự kiện.** Người tự duyệt phiếu mình tạo chỉ nhận một thông báo.
2. **Gộp trùng trong 60 giây.** Cùng bản ghi + cùng loại thì tăng `so_lan` thay vì tạo dòng mới.
3. **Cấp bậc 1 nhận ở mức im lặng.** Vào chuông đầy đủ, chỉ rung push với sự kiện mức cao — nếu không,
   điện thoại lãnh đạo rung hàng chục lần mỗi ngày rồi họ tắt hẳn thông báo.

## Đấu thêm module

1. Thêm một mục vào `MO_TA_BANG` (`services/notify/src/core/mo-ta-bang.ts`) — khai `moduleId` (mã **phân quyền**,
   không phải URL), đường dẫn, tên chứng từ, cột số phiếu và cột người tạo.
2. Thêm nhánh nhận diện sự kiện trong `services/notify/src/core/su-kien.ts` (hoặc dùng lại nhánh phiếu duyệt
   nếu module dùng chung bộ trạng thái).
3. Thêm câu chữ trong `services/notify/src/core/render.ts` và key i18n `notification.event.*`.
4. Thêm module vào `LOAI_SU_KIEN_THEO_MODULE` (`features/thong-bao/core/loai-su-kien.ts`) để nó hiện trong
   ma trận cài đặt và chip lọc.
5. Thêm một `CREATE TRIGGER` vào file SQL trigger.
6. Nếu module gắn với kho, thêm nhánh vào `rpc_tb_chi_nhanh_phieu` để giới hạn người nhận theo chi nhánh.

## Soi lỗi

**Không thấy thông báo nào.** Kiểm tra hàng đợi còn ứ không:

```sql
SELECT id, bang, thao_tac, trang_thai_cu, trang_thai_moi, actor_id, tg_xu_ly, so_lan_thu, loi_cuoi
  FROM fp_var_su_kien_thong_bao
 ORDER BY id DESC LIMIT 20;
```

- Bảng rỗng → trigger chưa gắn, chạy lại file SQL #6.
- Có dòng nhưng `tg_xu_ly` luôn NULL → worker không chạy hoặc không LISTEN được. Xem log service `notify`,
  tìm dòng `đang nghe kênh thong_bao_moi`.
- `so_lan_thu` tăng dần và `loi_cuoi` có nội dung → lỗi thật, đọc thông điệp ở đó. Quá 5 lần thì sự kiện bị
  bỏ qua để không kẹt hàng đợi.

**Có chuông nhưng không rung điện thoại.** Theo thứ tự: khoá VAPID đã cấu hình chưa (`GET /notify/khoe` trả
`push: true`), người dùng đã bật trong trang cài đặt chưa, có đang trong giờ yên lặng không, và người nhận có
phải cấp bậc 1 nhận ở mức im lặng không.

**`actor_id` là NULL.** Sự kiện sinh từ SQL chạy tay hoặc từ tiến trình không mang JWT. Thông báo vẫn gửi,
chỉ là câu chữ lui về "Có người…" thay vì tên người thao tác.

## Điểm cần nhớ khi bảo trì

- **`SW_UNREGISTER_BUSTER`** trong `components/shared/PwaRegister.tsx` gỡ toàn bộ service worker và xoá cache
  khi chuỗi đó đổi — thao tác đó **xoá luôn push subscription**. `BannerBatThongBao` gọi `dongBoLaiDangKy()`
  lúc khởi động để dựng lại im lặng, nhưng hãy cân nhắc trước khi bump chuỗi ấy.
- Service worker nay ở `sw/sw.ts` (chế độ `injectManifest`). Sửa quy tắc cache phải sửa trong file đó, không
  còn khai trong `vite.config.ts` như thời `generateSW`.
- `fp_var_thong_bao` xoá **mềm** (`da_xoa`). Dọn thật bằng `rpc_don_thong_bao_cu(90)`; outbox dọn bằng
  `rpc_don_su_kien_thong_bao_cu(30)`.
- Chưa làm nhóm thông báo **theo lịch** (nhắc hạn, tồn dưới định mức, phiếu quá hạn duyệt). Kiến trúc outbox
  dùng lại được nguyên vẹn — chỉ cần thêm nguồn ghi vào outbox. Điểm bám có sẵn: `ngay_het_han` +
  `getDueStatus()` ở Công việc, `ton_toi_thieu` trong `fp_mh_dinh_muc_ton_kho`, `ngay_giao_dk` ở đơn đặt hàng,
  `ngay_xu_ly` ở thanh toán đối tác, `ngay_het_han_hd` ở nhân viên.
