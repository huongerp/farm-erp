# Kế hoạch xây dựng module "Danh sách kho" (Kho vận)

**Mục tiêu:** Xây module Danh sách kho theo pattern chuẩn của dự án, dùng generic store, GenericToolbar, list/table + form drawer + detail drawer, và (tùy chọn) factory `createFeatureModule`.

**Chuẩn tham chiếu:** 
- `docs/checklist-module.md`
- Module **Phòng ban** (`features/he-thong/phong-ban/`) – pattern thủ công đầy đủ
- `store/createGenericStore.ts`, `lib/createFeatureModule.tsx`
- `components/shared/GenericToolbar`, `lib/hooks.ts` (`useListWithFilter`), `lib/useExportData`
- `docs/UI-CONVENTIONS.md`, `.cursor/rules/list-page-and-preview-standards.mdc`, `toolbar-filter-chip.mdc`

**Route hiện tại:** `/kho-van/danh-sach-kho` (đã có trong menu; hiện đang trả về `ModulePlaceholder`).

---

## 1. Cấu trúc thư mục

Tạo feature trong nhóm **kho-van**:

```
features/kho-van/danh-sach-kho/
├── core/
│   ├── types.ts          # Entity Kho (Warehouse)
│   ├── schema.ts         # Zod schema cho form
│   └── constants.ts      # (optional) Trạng thái, options
├── store/
│   └── useKhoStore.ts    # createGenericStore<KhoFilters>
├── services/
│   └── kho-service.ts    # getList, getById, create, update, delete, deleteMany, import
├── hooks/
│   └── use-kho.ts        # useKhoList, useKhoById, useCreateKho, useUpdateKho, useDeleteKho, useDeleteKhoMany, useImportKho
├── components/
│   ├── danh-sach-kho-toolbar.tsx   # GenericToolbar + FilterChip* + actions
│   ├── danh-sach-kho-list.tsx      # Bảng (GenericTable hoặc table chuẩn) + pagination
│   ├── danh-sach-kho-form.tsx      # Form drawer (GenericDrawer + react-hook-form + zod)
│   └── danh-sach-kho-detail.tsx    # Detail drawer (Summary card + DetailSection + actions)
└── index.tsx             # Trang chính: state, filterFn, handlers, layout
```

**Lưu ý:** Tên file có thể dùng `kho` (ngắn) hoặc `danh-sach-kho` cho components để rõ ngữ cảnh; trong plan dùng **kho** cho store/service/hooks và **danh-sach-kho** cho components để dễ phân biệt với module khác trong kho-van.

---

## 2. Core: types, schema, constants

### 2.1. `core/types.ts`

Định nghĩa entity **Kho** (kho không cần cây cha-con như Phòng ban; danh sách phẳng):

- `id: string` (UUID)
- `ma_kho: string` (mã kho, unique)
- `ten_kho: string`
- `dia_chi?: string`
- `mo_ta?: string`
- `id_chi_nhanh?: string | null` (optional, tham chiếu chi nhánh nếu có)
- `trang_thai: 0 | 1` (1: Hoạt động, 0: Tạm dừng)
- `thu_tu: number`
- `tg_tao: string` (ISO)
- `tg_cap_nhat: string` (ISO)

Có thể bổ sung `ten_chi_nhanh?: string` cho hiển thị (join/populate từ service).

### 2.2. `core/schema.ts`

Zod schema cho form (create/edit):

- `ma_kho`: required, min/max, regex (ví dụ `^[A-Z0-9_-]+$`)
- `ten_kho`: required, min/max
- `dia_chi`, `mo_ta`: optional string
- `id_chi_nhanh`: optional nullable string
- `trang_thai`: 0 | 1
- `thu_tu`: number min 0

Export type `KhoFormValues = z.infer<typeof khoSchema>`.

### 2.3. `core/constants.ts` (optional)

- Trạng thái: `[{ value: 1, label: '...' }, { value: 0, label: '...' }]`
- Nếu sau này có loại kho (kho tổng, kho lẻ): options cho filter.

---

## 3. Store (Zustand) – generic

### 3.1. `store/useKhoStore.ts`

- Dùng **`createGenericStore<KhoFilters>`** từ `store/createGenericStore.ts`.
- **KhoFilters:** ví dụ `{ status: string[] }` (Active/Inactive) hoặc thêm `id_chi_nhanh: string[]` nếu lọc theo chi nhánh.
- **initialFilters:** `{ status: [], id_chi_nhanh: [] }` (nếu có).
- **DEFAULT_COLUMNS:** khớp với bảng (id, label, visible, minWidth, maxWidth, order). Gợi ý cột:
  - `thu_tu`, `ma_kho`, `ten_kho`, `dia_chi`, `mo_ta`, `ten_chi_nhanh` (nếu có), `trang_thai`, `tg_cap_nhat`
- Dùng `i18n.t()` cho label cột (key ví dụ `kho.store.maKhoCol`, …) hoặc dùng key và t() ở component; nếu store khởi tạo lúc load thì dùng i18n.t trong store như phong-ban.

---

## 4. Service

### 4.1. `services/kho-service.ts`

- **getKhoList(): Promise<Kho[]>** – lấy tất cả (hoặc theo API phân trang sau).
- **getKhoById(id): Promise<Kho | null>** – chi tiết (có thể dùng cho detail).
- **createKho(data: KhoFormValues): Promise<Kho>**
- **updateKho(id, data: KhoFormValues): Promise<Kho>**
- **deleteKho(id): Promise<void>**
- **deleteKhoMany(ids: string[]): Promise<void>**
- **importKho(rows: Record<string, any>[]): Promise<{ created: number; errors: string[] }>** (nếu có Import).

Ban đầu có thể dùng mock trong memory (mảng `let dbKho: Kho[]`) giống `phong-ban-service.ts`, sau đổi sang API thật.

---

## 5. Hooks (React Query)

### 5.1. `hooks/use-kho.ts`

- **useKhoList()** – queryKey `['kho']`, queryFn getKhoList.
- **useKhoById(id)** – queryKey `['kho', id]`, enabled khi có id.
- **useCreateKho(onSuccess?)**
- **useUpdateKho(onSuccess?)**
- **useDeleteKho()** – xóa 1 (mutateAsync nhận id hoặc [id] tùy cách gọi).
- **useDeleteKhoMany()** – xóa nhiều (mutateAsync(ids: string[])).
- **useImportKho(onSuccess?)** – gọi importKho, invalidate `['kho']`, toast success/errors.

---

## 6. Components

### 6.1. Toolbar – `components/danh-sach-kho-toolbar.tsx`

- Dùng **GenericToolbar** với:
  - `searchPlaceholder`, `searchTerm`, `onSearchChange` (từ store).
  - `selectedCount={selectedIds.size}`, `onClearSelection`.
  - **filters:** FilterChipMultiSelect cho trạng thái (Active/Inactive); nếu có lọc chi nhánh thì thêm FilterChipMultiSelect tương ứng.
  - **filterGroups:** mảng khớp với từng filter cho **MobileFilterSheet** (theo `.cursor/rules/toolbar-filter-chip.mdc`).
  - **actions:** nút Thêm (Plus + BTN_ADD), Xuất (Export), Import (nếu có).
  - **onDeleteMany** khi có selection.
  - **columns**, **onToggleColumn**, **onReorderColumns**, **onResetColumns** (từ store).
  - **showBack**: true (quay lại /kho-van).
  - **activeFilterCount**, **onClearAllFilters**.
  - **mobileActions**, **onAdd** theo chuẩn (xem phong-ban-toolbar).

### 6.2. List / Table – `components/danh-sach-kho-list.tsx`

- Nhận props: `data`, `columns`, `selectedIds`, `onToggleSelection`, `onToggleAllSelection`, `isLoading`, `page`, `pageSize`, `onPageChange`, `onPageSizeChange`, `onEdit`, `onDelete`, `onView`, `sort`, `onSort` (nếu dùng sort từ store).
- **Loading:** `ListPageSkeleton` (loadingText từ i18n).
- **Empty:** `EmptyState` khi `!isLoading && data.length === 0`.
- Bảng: dùng **GenericTable** (nếu có) hoặc table với `getColumnCellStyle` từ `createGenericStore` cho th/td; cột khớp DEFAULT_COLUMNS; checkbox chọn hàng; cột Thao tác (Xem, Sửa, Xóa).
- **TablePaginationFooter** với pagination từ props.

Tham khảo: `phong-ban-list.tsx` (Phòng ban dùng HierarchyTable vì có cây; Danh sách kho danh sách phẳng nên dùng bảng thường).

### 6.3. Form drawer – `components/danh-sach-kho-form.tsx`

- **GenericDrawer** (width từ `lib/dialog-sizes`: DRAWER_WIDTH_FORM), title = "Thêm kho" / "Sửa kho" theo initialData.
- Form: **react-hook-form** + **zodResolver(khoSchema)**.
- Các trường: Mã kho, Tên kho, Địa chỉ, Mô tả, Chi nhánh (select optional), Trạng thái, Thứ tự.
- Footer: **FormDrawerFooter** – Hủy, Lưu (hoặc "Tạo mới" khi create).
- **onClose**: callback từ trang chính (đóng drawer, clear editingItem).

### 6.4. Detail drawer – `components/danh-sach-kho-detail.tsx`

- **GenericDrawer** (DRAWER_WIDTH_DETAIL).
- **Summary card** phía trên: icon kho, title (tên kho), subtitle (mã kho), badge trạng thái.
- **DetailToolbar**: actions (đổi trạng thái nếu có, …).
- **DetailSection** + **DetailField**: Mã kho, Tên kho, Địa chỉ, Mô tả, Chi nhánh, Trạng thái, Thứ tự, Ngày tạo, Ngày cập nhật.
- Footer: Đóng | Sửa | Xóa (Sửa gọi onEdit(item), Xóa confirm + onDelete(id)).

---

## 7. Trang chính – `index.tsx`

- State: `showForm`, `editingItem`, `viewingItem`, `showExport`, `showImport`; `page`, `pageSize` (hoặc lấy từ store pagination).
- Store: `useKhoStore()` – searchTerm, filters, sort, selectedIds, columns, clearSelection, toggleSelection, toggleAllSelection, setPage, setPageSize, resetState, …
- Data: `useKhoList()` → data, isLoading.
- **filterFn(item, searchTerm, filters):** lọc theo search (ma_kho, ten_kho, …) và theo filters (status, id_chi_nhanh nếu có).
- **useListWithFilter**(data, searchTerm, filters, filterFn) → filteredData.
- Sort: dùng sort từ store, sort filteredData theo sort.column / sort.direction (useMemo).
- Pagination: slice filteredData cho trang hiện tại (page, pageSize); total = filteredData.length.
- Handlers:
  - **handleEdit(item):** setEditingItem(item), setShowForm(true).
  - **handleView(item):** setViewingItem(item).
  - **handleDelete(id):** confirm (CONFIRM_DELETE) → deleteMutation.mutateAsync(id); nếu viewingItem?.id === id thì setViewingItem(null).
  - **handleDeleteMany(ids):** CONFIRM_DELETE_ALL → deleteManyMutation.mutateAsync(ids); clearSelection(); nếu viewingItem && ids.includes(viewingItem.id) thì setViewingItem(null).
  - **handleCloseForm:** setShowForm(false), setEditingItem(null).
  - **Export:** useExportData với exportMapFn, EXPORT_COLUMNS, exportFileName; mở ExportDialog.
  - **Import:** IMPORT_COLUMNS, onImportData → importMutation; ImportDialog.
- **useEffect** cleanup: resetState khi unmount.
- **useEffect** đồng bộ viewingItem với list sau refetch (khi list thay đổi, cập nhật viewingItem nếu có bản ghi tương ứng).
- Layout: Toolbar trên, dưới là bảng (DanhSachKhoList); bên dưới cùng có thể có TablePaginationFooter nếu không gộp trong list. Form drawer và Detail drawer render bằng AnimatePresence; Export/Import dialog tương tự.

---

## 8. Export / Import (generic)

- **Export:** Dùng **ExportDialog** (components/shared/ExportDialog); **useExportData** từ lib/useExportData với data = filteredData (hoặc sortedData), mapFn, pagination, selectedIds, keyExtractor. EXPORT_COLUMNS và exportFileName từ i18n.
- **Import:** Dùng **ImportDialog**; IMPORT_COLUMNS (key, label, required); onImportData gọi service import; sau khi import gọi invalidate query và toast.

---

## 9. Route và đăng ký trang

- Route đã có: `/kho-van/:moduleId` → SubmenuPage.
- Trong **SubmenuPage**, khi `basePath === '/kho-van' && decodedSlug === 'danh-sach-kho'`: render `<DanhSachKhoPage />` (hoặc tên component trang) thay vì ModulePlaceholder.
- Import: `import DanhSachKhoPage from '@/features/kho-van/danh-sach-kho';` (hoặc path tương đối từ pages).

---

## 10. i18n

- **Namespace:** Có thể dùng `kho` (ví dụ `locales/vi/kho.json`, `locales/en/kho.json`) hoặc nhúng vào `pages.json` với prefix `page.kho.*`.
- Key gợi ý:
  - **Chung:** searchPlaceholder, loading, empty, emptyHint.
  - **Confirm:** deleteTitle, deleteMessage, bulkDeleteTitle, bulkDeleteMessage.
  - **Toast:** createSuccess, updateSuccess, deleteSuccess, importSuccess.
  - **Form:** createTitle, editTitle, basicInfo, mã kho, tên kho, địa chỉ, mô tả, chi nhánh, trạng thái, thứ tự, save, create.
  - **Store (cột):** maKhoCol, tenKhoCol, diaChiCol, moTaCol, trangThaiCol, tgCapNhatCol, thuTuCol, …
  - **Detail:** section title, các nhãn trường.
  - **Toolbar:** export, import, add.
  - **Validation:** codeMin, codeMax, codeFormat, nameMin, nameMax, statusInvalid, sortOrderMin.
  - **Service:** notFound.

---

## 11. Tùy chọn: createFeatureModule

Nếu muốn giảm boilerplate, có thể chuyển sang **createFeatureModule**:

- Định nghĩa config với: name, useData (useKhoList), useStore (useKhoStore), keyExtractor, filterFn, TableComponent, ToolbarComponent, FormComponent, DetailComponent, importColumns, exportColumns, exportMapFn, exportFileName, importFileName, useDeleteMutation (useDeleteKhoMany hoặc wrapper), onImportData.
- Trang = `createFeatureModule<Kho, KhoFilters>(config)`.
- **Lưu ý:** createFeatureModule không có tab Stats mặc định; nếu không cần tab Thống kê thì phù hợp. Nếu cần tab đặc thù (như Phòng ban có cây) thì giữ pattern thủ công như hiện tại.

---

## 12. Checklist triển khai (theo checklist-module)

- [ ] Tạo thư mục `features/kho-van/danh-sach-kho/` và core (types, schema, constants).
- [ ] Store: useKhoStore với createGenericStore, DEFAULT_COLUMNS, initialFilters.
- [ ] Service: getList, getById, create, update, delete, deleteMany, import (nếu có).
- [ ] Hooks: useKhoList, useKhoById, useCreateKho, useUpdateKho, useDeleteKho, useDeleteKhoMany, useImportKho.
- [ ] Toolbar: GenericToolbar + FilterChip + filterGroups + actions + columns + showBack.
- [ ] List: bảng + pagination + empty/loading + checkbox + onView/onEdit/onDelete.
- [ ] Form drawer: GenericDrawer + form + schema + FormDrawerFooter.
- [ ] Detail drawer: Summary card + DetailSection + DetailToolbar + footer Đóng/Sửa/Xóa.
- [ ] Index: state, filterFn, useListWithFilter, sort, pagination, handlers, Export/Import dialog.
- [ ] SubmenuPage: if slug === 'danh-sach-kho' render DanhSachKhoPage.
- [ ] i18n: đủ key (vi/en) cho form, detail, toolbar, store, validation, toast, confirm.
- [ ] Kiểm tra: Tìm kiếm, filter, thêm/sửa/xóa một/xóa nhiều, detail → Sửa → Hủy, export/import (nếu có).

---

## 13. Thứ tự thực hiện gợi ý

1. **Core** (types, schema) + **constants** (nếu cần).
2. **Store** (useKhoStore) + **Service** (mock) + **Hooks**.
3. **Toolbar** + **List** (bảng + empty/loading + pagination).
4. **Form** drawer + **Detail** drawer.
5. **Index** (ghép state, filter, handlers, Export/Import).
6. **Route** (SubmenuPage) + **i18n**.
7. Kiểm tra E2E và chỉnh theo UI-CONVENTIONS.

---

*Tài liệu tham chiếu: checklist-module.md, Phòng ban (phong-ban), createGenericStore, GenericToolbar, UI-CONVENTIONS.md, list-page-and-preview-standards.mdc, toolbar-filter-chip.mdc.*
