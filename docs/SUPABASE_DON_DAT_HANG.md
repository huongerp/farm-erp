# Đơn đặt hàng – Script Supabase (pattern Đề xuất vật tư)

## 1. Chạy script tạo bảng và RLS

Trong **Supabase Dashboard → SQL Editor**, chạy toàn bộ file:

- `docs/supabase-fp_mh_don_dat_hang.sql`

Script sẽ:

- Xóa bảng cũ (nếu có): `fp_mh_don_dat_hang_chi_tiet`, `fp_mh_don_dat_hang`
- Tạo 2 bảng + index + trigger (tg_cap_nhat, thanh_tien, đồng bộ cột kéo từ đơn xuống chi tiết)
- Bật RLS và tạo policy SELECT/INSERT/UPDATE/DELETE cho `authenticated`
- Tạo **sequence** và **function** tùy chọn cho số PO tự tăng: `get_next_so_po_don_dat_hang()`

## 2. Cấu trúc bảng

| Bảng | Mô tả |
|------|--------|
| `fp_mh_don_dat_hang` | Đơn đặt hàng: so_po, ngay_dat, ngay_giao_dk, id_nha_cung_cap, id_kho_nhan, id_phieu_de_xuat_vat_tu, id_nguoi_dat, id_nguoi_duyet, dieu_khoan_thanh_toan, ghi_chu, **trang_thai (text)**, tg_tao, tg_cap_nhat |
| `fp_mh_don_dat_hang_chi_tiet` | Chi tiết dòng: id_don_dat_hang, id_hang_hoa, so_luong, don_vi_tinh, don_gia, thanh_tien, ghi_chu + cột kéo so_po, ngay_dat, ngay_giao_dk, **trang_thai_phieu (text)** |

**Trạng thái (trang_thai):** text, giống Phiếu đề xuất vật tư – `'Nháp'` \| `'Chờ duyệt'` \| `'Đã gửi'` \| `'Đã xác nhận'` \| `'Đang giao'` \| `'Đã nhận đủ'` \| `'Đã đóng'` \| `'Hủy'`. Mặc định `'Nháp'`.

## 3. Liên kết (app enrich, không bắt buộc FK trên Supabase)

- `id_nha_cung_cap` → đối tác loại nhà cung cấp (fp_mh_danh_sach_doi_tac hoặc tương đương)
- `id_kho_nhan` → `fp_mh_danh_sach_kho(id)`
- `id_phieu_de_xuat_vat_tu` → `fp_mh_phieu_de_xuat_vat_tu(id)`
- `id_nguoi_dat`, `id_nguoi_duyet` → `fp_var_nhan_vien(id)`
- Chi tiết: `id_hang_hoa` → `fp_mh_danh_sach_hang_hoa(id)`

## 4. Số PO tự tăng (tùy chọn)

- **Sequence:** `fp_mh_don_dat_hang_so_seq`
- **RPC:** `get_next_so_po_don_dat_hang()` → trả về `bigint`

Trong app, khi tạo đơn mới có thể gọi:

```ts
const { data: nextNum } = await supabase.rpc('get_next_so_po_don_dat_hang');
const soPo = `PO-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
```

## 5. Bước tiếp: nối app với Supabase

Sau khi chạy SQL, tạo service Supabase cho đơn đặt hàng (tương tự `phieu-de-xuat-vat-tu-supabase.service.ts`):

- Map cột DB (bigint id, date, smallint trang_thai) sang type app (string id, string ngay_dat/ngay_giao_dk, DonDatHangTrangThai).
- `getAllDonDatHang`, `getDonDatHangById`, `createDonDatHang`, `updateDonDatHang`, `deleteDonDatHang`, `deleteDonDatHangMany`.
- Enrich ten_nha_cung_cap, ten_kho_nhan, so_phieu_de_xuat, ten_nguoi_dat, ten_nguoi_duyet, ma_hang/ten_hang chi tiết từ các bảng tham chiếu hoặc để app enrich sau khi query.

Sau đó trong `don-dat-hang-service.ts` chuyển từ mock (seed) sang gọi Supabase service.
