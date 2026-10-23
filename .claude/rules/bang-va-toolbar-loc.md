---
paths:
  - "components/shared/GenericTable.tsx"
  - "components/shared/HierarchyTable.tsx"
  - "components/shared/GenericToolbar.tsx"
  - "components/shared/DashboardToolbar.tsx"
  - "components/shared/ResponsiveFilterChips.tsx"
  - "components/shared/StatsToolbar.tsx"
  - "components/shared/FilterOverflowDropdown.tsx"
  - "components/ui/MobileFilterSheet.tsx"
  - "lib/table-core/**"
  - "lib/list-search-matcher.ts"
  - "lib/filter-chip-split.ts"
  - "store/createGenericStore.ts"
---

# Bảng dùng chung & Toolbar lọc

_Tách từ mục «Quy ước module» của CLAUDE.md gốc — tự nạp khi đọc/sửa file khớp `paths`. Đường dẫn trong file tính từ gốc repo._

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

### Toolbar lọc

- Hàng chip desktop: truyền `filters={<ResponsiveFilterChips items={...} />}`
  (`components/shared/ResponsiveFilterChips.tsx`, logic + test ở `lib/filter-chip-split.ts`).
  Tối đa 5 bộ lọc ngoài toolbar ở màn ≥ 1024px, 3 ở 640–1024px, dư vào nút Filter.
  Item `kind: 'custom'` (chọn khoảng ngày, ô ngày, nút gạt) luôn hiện nhưng vẫn tính chỗ;
  bộ lọc ít dùng → `luonVaoFilter`. Không tự `.slice` / tự đặt `FilterOverflowDropdown`.
- Điện thoại (< 640px) dùng bảng lọc từ `filterGroups`. Control không phải danh sách chọn
  phải truyền thêm qua `mobileFilterExtra` (+ `mobileFilterExtraCount`) của GenericToolbar /
  DashboardToolbar, bọc bằng `MobileFilterField`; chọn khoảng ngày dùng
  `<DateRangePicker inline …/>` cùng value/onChange với desktop. Thiếu bước này thì điện
  thoại không lọc được theo ngày.
- Tab thống kê dùng `components/shared/StatsToolbar.tsx` (truyền nhãn đã dịch qua props),
  không tạo bản sao `stats/StatsToolbar.tsx` riêng cho module.
