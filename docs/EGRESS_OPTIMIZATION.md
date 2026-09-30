# Tối ưu egress (băng thông) — farm-erp

## RPC phía DB (đã có, xem `docs/db-schema-baseline.sql`)

- `rpc_nxt_by_period`, `rpc_phieu_in_period`, `rpc_ton_at_date` — báo cáo nhập xuất tồn
- `rpc_phieu_de_xuat_stats` — tab Thống kê phiếu đề xuất

Đổi hàm/view thì reload schema cache của PostgREST: `NOTIFY pgrst, 'reload schema';`

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

## Dev: theo dõi request

Trong `.env.local`:

```
VITE_API_REQUEST_LOGGER=1
```

Mở Console — cảnh báo nếu >10 request/giây cùng bảng.

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

→ Kiểm tra các hàm `rpc_nxt_*` đã có trên DB (xem `docs/db-schema-baseline.sql`).
