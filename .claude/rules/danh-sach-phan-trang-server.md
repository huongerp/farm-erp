---
paths:
  - "features/**/services/*-list-query.ts"
  - "features/**/services/*-db.service.ts"
  - "lib/postgrest-search.ts"
  - "lib/postgrest-or-ilike.ts"
  - "lib/list-query-key.ts"
  - "features/quan-ly-nha-so-che/bao-cao-nhan-cong/**"
---

# Danh sách: phân trang ở SERVER

_Tách từ mục «Quy ước module» của CLAUDE.md gốc — tự nạp khi đọc/sửa file khớp `paths`. Đường dẫn trong file tính từ gốc repo._

### Danh sách: phân trang ở SERVER, không tải cả bảng

Module có dữ liệu lớn dần theo thời gian (phiếu, báo cáo, danh mục hàng hoá) phải
lọc / sắp xếp / cắt trang ở PostgREST. Khuôn đã áp dụng — xem
`features/quan-ly-nha-so-che/bao-cao-nhan-cong` làm mẫu đầy đủ nhất:

```
services/<module>-list-query.ts   # kiểu XListServerQuery + cột sort được ở DB
services/<module>-db.service.ts   # apply<X>ListQuery dùng chung cho:
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
