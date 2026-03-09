# Tồn kho (view) và Định mức tồn kho

## View `fp_mh_ton_kho`

`fp_mh_ton_kho` là **VIEW** (không phải bảng). Cấu trúc hiển thị trên Supabase:

| Cột         | Kiểu    | Ghi chú |
| ----------- | ------- | ------- |
| kho_id      | bigint  | FK kho  |
| id_hang_hoa | bigint  | FK hàng hóa |
| so_luong    | numeric | Tổng tồn (kho_id, id_hang_hoa) |

**Không thiếu `id`**: View là kết quả truy vấn tổng hợp theo cặp (kho_id, id_hang_hoa), mỗi dòng = một cặp kho + hàng hóa với tổng số lượng. Khóa logic là **(kho_id, id_hang_hoa)**. Nếu cần bảng vật lý có `id` riêng thì phải tạo bảng (materialized table), không dùng view.

**Logic trạng thái**: Chỉ **phiếu "Không duyệt"** không tính vào tồn kho. Phiếu **"Chờ duyệt"** và **"Đã duyệt"** đều được tính (nhập cộng, xuất/chuyển trừ).

- View dùng `fp_mh_phieu_kho` (kho_id, loai, trang_thai, kho_den_id) và `fp_mh_phieu_kho_chi_tiet` (id_phieu_kho, id_hang_hoa, so_luong). Không cần thêm trường nào.

App đọc: `supabase.from('fp_mh_ton_kho').select('kho_id, id_hang_hoa, so_luong')`.

### Bước 1: Quyền đọc bảng gốc (tránh lỗi policy khi đọc view)

View đọc từ `fp_mh_phieu_kho` và `fp_mh_phieu_kho_chi_tiet`. Khi role `authenticated` truy vấn view, nó phải có quyền SELECT trên hai bảng này và RLS phải cho phép. Chạy **trước** khi tạo view (hoặc khi gặp lỗi policy):

```sql
-- Cho phép role authenticated đọc hai bảng (cần có trước khi đọc view)
GRANT SELECT ON fp_mh_phieu_kho TO authenticated;
GRANT SELECT ON fp_mh_phieu_kho_chi_tiet TO authenticated;

-- RLS: policy SELECT cho authenticated (nếu chưa có thì tạo)
-- Bảng phiếu kho
DROP POLICY IF EXISTS "Allow select for authenticated" ON fp_mh_phieu_kho;
CREATE POLICY "Allow select for authenticated" ON fp_mh_phieu_kho
  FOR SELECT TO authenticated USING (true);

-- Bảng phiếu kho chi tiết
DROP POLICY IF EXISTS "Allow select for authenticated details" ON fp_mh_phieu_kho_chi_tiet;
CREATE POLICY "Allow select for authenticated details" ON fp_mh_phieu_kho_chi_tiet
  FOR SELECT TO authenticated USING (true);
```

### Bước 2: Script tạo view

```sql
CREATE OR REPLACE VIEW fp_mh_ton_kho AS
WITH movements AS (
  -- Nhập: cộng tại kho_id (Chờ duyệt + Đã duyệt)
  SELECT p.kho_id, ct.id_hang_hoa, ct.so_luong AS delta
  FROM fp_mh_phieu_kho p
  JOIN fp_mh_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = p.id
  WHERE p.trang_thai <> 'Không duyệt' AND p.loai = 'nhập'
  UNION ALL
  -- Xuất: trừ tại kho_id
  SELECT p.kho_id, ct.id_hang_hoa, -ct.so_luong AS delta
  FROM fp_mh_phieu_kho p
  JOIN fp_mh_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = p.id
  WHERE p.trang_thai <> 'Không duyệt' AND p.loai = 'xuất'
  UNION ALL
  -- Chuyển đi: trừ tại kho_id
  SELECT p.kho_id, ct.id_hang_hoa, -ct.so_luong AS delta
  FROM fp_mh_phieu_kho p
  JOIN fp_mh_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = p.id
  WHERE p.trang_thai <> 'Không duyệt' AND p.loai = 'chuyển' AND p.kho_den_id IS NOT NULL
  UNION ALL
  -- Chuyển đến: cộng tại kho_den_id
  SELECT p.kho_den_id AS kho_id, ct.id_hang_hoa, ct.so_luong AS delta
  FROM fp_mh_phieu_kho p
  JOIN fp_mh_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = p.id
  WHERE p.trang_thai <> 'Không duyệt' AND p.loai = 'chuyển' AND p.kho_den_id IS NOT NULL
)
SELECT kho_id, id_hang_hoa, SUM(delta)::numeric(18,4) AS so_luong
FROM movements
GROUP BY kho_id, id_hang_hoa;

COMMENT ON VIEW fp_mh_ton_kho IS 'Tồn kho theo (kho, hàng hóa). Chỉ phiếu Không duyệt không tính; Chờ duyệt và Đã duyệt đều tính.';
```

### Bước 3: Quyền đọc view

```sql
GRANT SELECT ON fp_mh_ton_kho TO authenticated;
```

### Nếu vẫn lỗi policy (PostgreSQL 15+)

Có thể tạo view chạy với quyền owner (bỏ qua RLS khi đọc qua view), rồi chỉ cấp SELECT trên view cho `authenticated`:

```sql
-- Xóa view cũ rồi tạo lại với security_invoker = false (view chạy theo quyền owner)
DROP VIEW IF EXISTS fp_mh_ton_kho;

CREATE VIEW fp_mh_ton_kho WITH (security_invoker = false) AS
WITH movements AS (
  SELECT p.kho_id, ct.id_hang_hoa, ct.so_luong AS delta
  FROM fp_mh_phieu_kho p
  JOIN fp_mh_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = p.id
  WHERE p.trang_thai <> 'Không duyệt' AND p.loai = 'nhập'
  UNION ALL
  SELECT p.kho_id, ct.id_hang_hoa, -ct.so_luong AS delta
  FROM fp_mh_phieu_kho p
  JOIN fp_mh_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = p.id
  WHERE p.trang_thai <> 'Không duyệt' AND p.loai = 'xuất'
  UNION ALL
  SELECT p.kho_id, ct.id_hang_hoa, -ct.so_luong AS delta
  FROM fp_mh_phieu_kho p
  JOIN fp_mh_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = p.id
  WHERE p.trang_thai <> 'Không duyệt' AND p.loai = 'chuyển' AND p.kho_den_id IS NOT NULL
  UNION ALL
  SELECT p.kho_den_id AS kho_id, ct.id_hang_hoa, ct.so_luong AS delta
  FROM fp_mh_phieu_kho p
  JOIN fp_mh_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = p.id
  WHERE p.trang_thai <> 'Không duyệt' AND p.loai = 'chuyển' AND p.kho_den_id IS NOT NULL
)
SELECT kho_id, id_hang_hoa, SUM(delta)::numeric(18,4) AS so_luong
FROM movements
GROUP BY kho_id, id_hang_hoa;

GRANT SELECT ON fp_mh_ton_kho TO authenticated;
```

(Lưu ý: với `security_invoker = false`, view chạy với quyền owner của view, nên owner phải là role có quyền đọc hai bảng, thường là `postgres` hoặc role tạo bảng.)

### Kiểm tra khi view trống

1. **Xem trạng thái phiếu** — phiếu `Chờ duyệt` hoặc `Đã duyệt` mới tính tồn; `Không duyệt` không tính:
   ```sql
   SELECT id, so_phieu, loai, trang_thai FROM fp_mh_phieu_kho ORDER BY id DESC LIMIT 20;
   ```
2. **Đảm bảo có phiếu chi tiết** (id_phieu_kho, id_hang_hoa, so_luong) cho phiếu đó.
3. **Kiểm tra view**:
   ```sql
   SELECT * FROM fp_mh_ton_kho LIMIT 10;
   ```

Sau khi tạo phiếu nhập (trạng thái Chờ duyệt hoặc Đã duyệt), module Tồn kho sẽ có số liệu. Chỉ khi phiếu bị **Không duyệt** thì mới không cộng/trừ tồn.

---

## Bảng `fp_mh_dinh_muc_ton_kho`

Cột: `id` (PK), `kho_id`, `hang_hoa_id`, `ton_toi_thieu`.

Để app đọc được định mức:

```sql
GRANT SELECT ON fp_mh_dinh_muc_ton_kho TO authenticated;
```

(Nếu sau này cần cho phép sửa định mức từ app: thêm policy INSERT/UPDATE/DELETE tương ứng.)
