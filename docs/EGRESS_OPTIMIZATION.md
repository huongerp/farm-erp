# Tối ưu egress Supabase — farm-erp

## Script SQL cần chạy trên Supabase (theo thứ tự)

1. `docs/supabase-fp_farm_bao_cao_nhan_cong_egress_columns.sql` — **DROP** `so_anh`, `anh_thumbnail_url` (nếu đã thêm)
1b. `docs/supabase-fp_farm_bao_cao_nhan_cong_migrate_anh_cloudinary.sql` — kiểm tra + migrate ảnh (kèm hướng dẫn)
2. `docs/supabase-rpc_nxt_family.sql` — `rpc_nxt_by_period`, `rpc_phieu_in_period`, `rpc_ton_at_date`
3. `docs/supabase-rpc_phieu_de_xuat_stats.sql` — tab Thống kê phiếu đề xuất

Sau khi chạy: **Settings → API → Reload schema cache**.

## Kiểm tra egress / base64

```sql
-- Còn base64 không?
SELECT 'nhan_vien' AS tbl, COUNT(*) FILTER (WHERE hinh_anh LIKE 'data:image/%') AS base64
FROM fp_var_nhan_vien WHERE hinh_anh IS NOT NULL
UNION ALL
SELECT 'tai_san', COUNT(*) FILTER (WHERE hinh_anh LIKE 'data:image/%')
FROM fp_ts_tai_san WHERE hinh_anh IS NOT NULL
UNION ALL
SELECT 'bao_cao_nc', COUNT(*) FILTER (WHERE hinh_anh_urls::text LIKE '%data:image/%')
FROM fp_farm_bao_cao_nhan_cong;
```

Kỳ vọng: **0** sau migrate Cloudinary.

## Migrate ảnh base64 → Cloudinary

```bash
# .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CLOUDINARY_URL
node scripts/migrate-base64-to-cloudinary.mjs --dry-run
node scripts/migrate-base64-to-cloudinary.mjs
```

## Dev: theo dõi request

Trong `.env.local`:

```
VITE_API_REQUEST_LOGGER=1
```

Mở Console — cảnh báo nếu >10 request/giây cùng bảng.

## Dashboard

**Project Settings → Usage → Egress** — so sánh trước/sau khi deploy SQL + app.

## Thay đổi app (đã merge)

- List báo cáo nhân công: không select `hinh_anh_urls`
- Tab chi tiết phiếu kho flat: bỏ `trao_doi` khỏi select list
- Hook full-load (`usePhieuKhoList`, …): `enabled: false`
- Tab Thống kê đề xuất / tổng hợp báo cáo đề xuất: RPC stats
- Đơn hàng Thống kê: không tải full list khi RPC có
- Upload ảnh NV / tài sản: Cloudinary (không base64 mới)
- Lịch sử NXT theo HH/kho: giới hạn 500 dòng

## Fallback client

Nếu RPC chưa deploy, Console vẫn có:

`[bao-cao-nxt] RPC ... failed or missing — using client fallback`

→ Chạy `docs/supabase-rpc_nxt_family.sql`.
