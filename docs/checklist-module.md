# Checklist xây dựng module mới

Dùng checklist này khi tạo một module mới để tránh sót bước và đảm bảo chuẩn theo template (Dự án, Phòng ban, Nhân viên, Công việc…).

---

## 1. Cấu trúc thư mục & core

- [ ] Tạo thư mục `features/<nhóm>/<module>/` (vd: `features/hanh-chinh/du-an/`).
- [ ] **core/types.ts**: Định nghĩa type entity (id, các trường hiển thị, quan hệ).
- [ ] **core/schema.ts**: Zod schema cho form (validation, DuAnFormValues…).
- [ ] **core/constants.ts** (nếu cần): Options trạng thái, ưu tiên, v.v.

---

## 2. Store (Zustand)

- [ ] **store/useXxxStore.ts**: Dùng `createGenericStore<Filters>(initialFilters, DEFAULT_COLUMNS)`.
- [ ] Định nghĩa **Filters** (search, status, phòng ban, năm/thời gian… tùy module).
- [ ] **DEFAULT_COLUMNS**: id, label, visible, minWidth, order cho từng cột.
- [ ] **initialFilters**: Khởi tạo đủ key (status, id_phong_ban, nam_bat_dau…).

---

## 3. API / Service

- [ ] **services/xxx-service.ts**: getList, getById, create, update, delete (và deleteList nếu có xóa nhiều).
- [ ] **importXxx** (nếu có Import): Nhận mảng row, trả về `{ created, errors }`.
- [ ] Xử lý normalize dữ liệu (vd: id_phong_ban string | string[] → string[]).

---

## 4. Hooks (React Query)

- [ ] **hooks/use-xxx.ts**: useXxxList, useXxxById, useCreateXxx, useUpdateXxx, useDeleteXxxList.
- [ ] **useImportXxx(onSuccess?)** (nếu có Import): invalidate query, toast success/errors, gọi onSuccess.
- [ ] Query key thống nhất (vd: `['duAn']`).

---

## 5. Trang chính (index)

- [ ] State: showForm, editingItem, detailItem, (nếu có bảng con) detailChild, showChildForm, openedFormFromDetailId.
- [ ] **filterFn**: Khớp searchTerm + từng filter (status, id_phong_ban, nam_bat_dau…).
- [ ] **handleEdit**: Nếu mở từ detail thì set openedFormFromDetailId để Hủy mở lại detail.
- [ ] **handleCloseForm**: Nếu openedFormFromDetailId thì setDetailItem(fresh) rồi clear openedFormFromDetailId.
- [ ] **handleDeleteMany** onSuccess: Nếu id đang xem nằm trong ids xóa thì clear detailItem (và detailChild nếu có).
- [ ] Export: exportData useMemo, handleExport (exportToExcel).
- [ ] Import (nếu có): showImport, IMPORT_COLUMNS useMemo, handleImportData, ImportDialog, toolbar onImport.

---

## 6. Toolbar

- [ ] **GenericToolbar**: searchPlaceholder, actions, filters, filterGroups, onClearAllFilters, activeFilterCount, onDeleteMany, columns (toggle/reorder/reset), showBack.
- [ ] **Filter chips**: FilterChipMultiSelect (status, phòng ban, năm/thời gian…) — đồng bộ với store filters.
- [ ] Nút Thêm (Plus + BTN_ADD()), Export (Download), Import (Upload) nếu có.
- [ ] Props: onAdd, onDeleteMany, onExport?, onImport?.

---

## 7. Bảng danh sách

- [ ] Cột khớp DEFAULT_COLUMNS, sort được nếu dùng sort state.
- [ ] onView → mở detail; onEdit → mở form (và set openedFormFromDetailId nếu đang từ detail); onDelete → confirm + xóa.
- [ ] Checkbox chọn hàng, toggle all — đồng bộ selectedIds từ store.

---

## 8. Form (drawer)

- [ ] **FormDrawer** / GenericDrawer: title (create/edit), footer **FormDrawerFooter** (Hủy + Lưu, createIcon cho Thêm mới).
- [ ] Schema Zod, defaultValues từ initialData.
- [ ] Multi-select phòng ban (hoặc trường đặc thù) có required đúng schema.
- [ ] onClose: gọi callback từ trang chính (handleCloseForm).

---

## 9. Detail (drawer)

- [ ] **Summary card** đặt **trên** DetailToolbar: icon, title, subtitle (mã), trạng thái badge, thông tin tóm tắt (số bản ghi con, khoảng thời gian…).
- [ ] **DetailToolbar**: actions (Trạng thái, Thêm con… theo module).
- [ ] **DetailSection** + **DetailField**: thông tin cơ bản.
- [ ] Footer: Đóng | Sửa | Xóa (theo quyền).
- [ ] Bảng con (nếu có): block card, header + EmptyState, row click → mở detail con hoặc navigate; cột Thao tác (Sửa/Xóa). Xóa bản ghi con: onSuccess gọi **onChildDeleted?.(id)** để trang chủ đóng drawer detail con nếu đang xem đúng bản ghi đó.

---

## 10. Flow chi tiết

- [ ] **Detail → Sửa → Hủy**: Đóng form và mở lại detail (openedFormFromDetailId + handleCloseForm).
- [ ] **Detail → Sửa → Lưu**: Có thể đóng form và mở lại detail với dữ liệu mới (invalidate query + setDetailItem(fresh)).
- [ ] **Xóa bản ghi con trong detail**: Gọi onChildDeleted(id); trang chủ nếu detailChild?.id === id thì setDetailChild(null).
- **Xóa nhiều (bulk)**: Nếu bản ghi đang xem (detailItem hoặc detailChild) nằm trong danh sách xóa → clear detail state trong onSuccess.

---

## 11. i18n

- [ ] **locales/vi/xxx.json** và **locales/en/xxx.json**:
  - searchPlaceholder, loading, empty, emptyHint
  - deleteTitle, deleteMessage, bulkDeleteTitle, bulkDeleteMessage
  - toast: createSuccess, updateSuccess, deleteSuccess, importSuccess (nếu có)
  - form: createTitle, editTitle, basicInfo, các label + placeholder, save, create
  - store: label cho từng cột (maCol, tenCol…)
  - detail: section title, changeStatus, addTask, conEmptyHint…
  - validation: message cho từng rule
  - toolbar: exportData, yearStart (hoặc filter tương ứng), importData
  - service: notFound, hasChildren…

---

## 12. Route & menu

- [ ] Route đăng ký trong router (path, element).
- [ ] Menu/sidebar: thêm link tới module (icon, label, quyền nếu có).

---

## 13. Kiểm tra cuối

- [ ] Tìm kiếm + từng filter hoạt động đúng.
- [ ] Thêm mới / Sửa / Xóa một / Xóa nhiều.
- [ ] Mở detail → Sửa → Hủy → detail mở lại với dữ liệu cũ.
- [ ] Mở detail → bảng con → Xóa một dòng → nếu đang mở detail con của dòng đó thì drawer con đóng.
- [ ] Xóa nhiều: chọn cả bản ghi đang xem → sau khi xóa detail đóng.
- [ ] Export Excel (cột đúng, tên file).
- [ ] Import Excel (cột mapping, required, toast success/errors).
- [ ] Summary card trong detail hiển thị đủ (trạng thái, số liệu tóm tắt).

---

*File này tham chiếu chuẩn từ các module: Dự án, Phòng ban, Nhân viên, Công việc. Chỉnh sửa checklist khi có quy ước mới.*
