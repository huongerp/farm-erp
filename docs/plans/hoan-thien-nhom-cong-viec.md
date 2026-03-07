# Kế hoạch hoàn thiện nhóm module Công việc theo quy chuẩn

**Phạm vi:** Thiết lập công việc, Dự án, Công việc, Báo cáo (nhóm Công việc – Hành chính).

**Chuẩn tham chiếu:** Module Nhân viên (he-thong/nhan-vien), GenericTable/GenericToolbar, DashboardToolbar, shared/stats, UI-CONVENTIONS.

---

## 1. Tổng quan thiếu sót

| Hạng mục | Thiết lập CV | Dự án | Công việc | Báo cáo |
|----------|--------------|-------|-----------|---------|
| Loading/Empty thống nhất | Một phần | Thiếu empty custom | Có | Có |
| Error boundary / xử lý lỗi | Chưa | Chưa | Chưa | Chưa |
| Schema test (unit) | Chưa | Chưa | Chưa | — |
| i18n đủ key (vi/en) | Kiểm tra | Kiểm tra | Có | Có |
| Mobile filter (FilterGroups) | Có | Có | Có | Có |
| Export (Excel/PDF) | — | Chưa | Chưa | Excel |
| Breadcrumb / title trang | — | — | — | — |
| Validation form đầy đủ | Kiểm tra | Kiểm tra | Có | — |
| Detail drawer chuẩn (DetailSection, DetailField) | — | Có | Có | — |
| Pagination footer (records label i18n) | Có | Trong GenericTable | Có | — |

---

## 2. Chi tiết theo từng module

### 2.1. Thiết lập công việc (thiet-lap-cong-viec)

**Hiện trạng:** Tab Cảnh báo + Tab Mẫu công việc, store, GenericToolbar, bảng, form.

**Cần làm:**

- **Cảnh báo (canh-bao-tab):**
  - Loading: dùng `LoadingSpinnerWithText` khi `loadingConfig` (nhất quán với các tab khác).
  - Empty: nếu chưa có – không bắt buộc vì form luôn hiển thị.
- **Mẫu công việc (mau-cong-viec-tab):**
  - Empty state: khi `sortedList.length === 0` và không loading, hiển thị `EmptyState` với `title`/`description`/`action` từ i18n (ví dụ `thietLapCongViec.mau.empty`, `thietLapCongViec.mau.emptyHint`, nút "Thêm mẫu").
  - Kiểm tra i18n: đủ key cho validation (mau form), toast, confirm delete (single + bulk).
- **Chuẩn code:**
  - Confirm delete dùng `CONFIRM_DELETE` / `CONFIRM_DELETE_ALL` từ `lib/button-labels` (đã có thì giữ nguyên).
  - Toolbar: đảm bảo có `showBack`, column manager (toggle/reorder/reset) nếu dùng GenericToolbar.

---

### 2.2. Dự án (du-an)

**Hiện trạng:** List + Table + Form + Detail, store, filter, sort, pagination qua GenericTable.

**Cần làm:**

- **Empty state:**
  - GenericTable đang dùng `<EmptyState />` mặc định (shared.empty.title). Nên truyền `emptyTitle`/`emptyDescription` (hoặc tương đương) nếu GenericTable hỗ trợ; nếu không, bọc table: khi `!isLoading && data.length === 0` thì render `<EmptyState title={t('duAn.empty')} description={t('duAn.emptyHint')} action={...} />` thay vì table.
  - Thêm i18n: `duAn.empty`, `duAn.emptyHint` (vi/en).
- **Loading:**
  - Giữ `loadingText={t('duAn.loading')}` trong GenericTable (đã có).
- **Error:**
  - Trang (index) bọc nội dung bằng ErrorBoundary (hoặc dùng ErrorBoundary ở layout) để lỗi render không làm sập cả app.
- **Export:**
  - Thêm nút "Xuất Excel" trên toolbar (giống Báo cáo): dùng `exportToExcel` với `sortedList` (map sang object có key i18n), file name `du_an`.
  - i18n: `duAn.export` (vi/en).
- **Validation:**
  - Form: kiểm tra schema (du-an/core/schema) đủ required, message i18n; ngày bắt đầu ≤ ngày kết thúc (nếu chưa có).
- **Schema test (tùy chọn):**
  - `du-an/core/__tests__/schema.test.ts`: test validation hợp lệ/không hợp lệ.

---

### 2.3. Công việc (cong-viec)

**Hiện trạng:** Dashboard + Tab list (cây + Kanban + Gantt), form, detail, báo cáo/bình luận, thông báo, badge Sắp hạn/Quá hạn, seed data.

**Cần làm:**

- **Error boundary:**
  - Trang cong-viec (index) hoặc layout Hành chính bọc ErrorBoundary.
- **Empty state thống nhất:**
  - View Gantt: đã dùng `t('congViec.empty')`.
  - View Kanban: khi tất cả cột trống, có thể hiển thị một dòng empty chung (ví dụ "Chưa có công việc" với nút Thêm) thay vì chỉ nhiều cột trống.
  - List (HierarchyTable): đã có EmptyState với congViec.empty / congViec.emptyHint.
- **Validation báo cáo:**
  - Form báo cáo kết quả: nếu schema có `links: z.array(z.string().url())` (hoặc từng phần tử url), đảm bảo form validate URL hợp lệ; hiện tại có thể đang optional/string. Chuẩn hóa: link không rỗng thì phải là URL hợp lệ (Zod url() hoặc regex).
- **i18n:**
  - Kiểm tra đủ key cho Gantt (đã có congViec.viewGantt, congViec.empty).
- **Export:**
  - Tab Công việc: thêm nút "Xuất Excel" (filtered/sorted list hoặc flattened list), file name `cong_viec`. Có thể đặt trên toolbar cạnh view mode (list/kanban/gantt).
  - i18n: `congViec.export` (vi/en).
- **Dashboard tab:**
  - Khi không có dữ liệu (myList/dueList/waitReportList trống theo view): hiển thị EmptyState với message phù hợp (ví dụ "Bạn chưa có công việc nào", "Không có công việc đến hạn").
- **Schema test (tùy chọn):**
  - `cong-viec/core/__tests__/schema.test.ts`: test congViecSchema, baoCaoKetQuaSchema, binhLuanSchema.

---

### 2.4. Báo cáo (bao-cao)

**Hiện trạng:** Đã chuẩn hóa DashboardToolbar + StatsKpiGrid + StatsTableCard, filter, export Excel.

**Cần làm:**

- **Error boundary:**
  - Trang báo cáo bọc ErrorBoundary (hoặc dùng chung layout).
- **Export PDF (tùy chọn):**
  - Thêm tùy chọn "Xuất PDF" (dropdown hoặc nút thứ hai) tương tự module Nhân viên stats; dùng thư viện hiện có (vd. jspdf) hoặc export HTML → PDF. Nếu chưa có lib thì có thể bỏ qua hoặc ghi trong backlog.
- **Empty state:**
  - Khi `filtered.length === 0`: đã có xử lý trong DashboardToolbar/clear filters; đảm bảo nội dung giữa toolbar và phần stats hiển thị rõ "Không có dữ liệu" với gợi ý xóa bộ lọc (đã có thể đã ổn).
- **i18n:**
  - Đủ key cho filters, summary, bảng (đã có).

---

## 3. Quy chuẩn chung áp dụng cho cả nhóm

### 3.1. Loading

- Màn list/dashboard: dùng `LoadingSpinnerWithText` với text i18n (vd. `module.loading`) khi `isLoading`.
- Table: GenericTable nhận `isLoading` + `loadingText` (đã có).

### 3.2. Empty

- Khi `!isLoading && data.length === 0`: dùng component `EmptyState` với `title`, `description` (i18n), có thể `action` (nút Thêm mới).
- Key i18n thống nhất: `module.empty`, `module.emptyHint` (vi/en).

### 3.3. Error

- Trang module (index) hoặc layout cha bọc bằng `<ErrorBoundary>` để lỗi render không làm sập app.
- Gọi API/mutation: giữ xử lý `onError` (toast) trong hook (đã có).

### 3.4. Form validation

- Schema Zod với message i18n; đủ trường required; quy tắc nghiệp vụ (ngày, ràng buộc).
- Form dùng `zodResolver(schema)`, hiển thị lỗi dưới field.

### 3.5. Toolbar

- List có GenericToolbar: search, filters, filterGroups (mobile), column manager (nếu table), actions (Thêm, Xuất, Xóa nhiều), `showBack` nếu cần.
- Báo cáo/Thống kê: DashboardToolbar với filters, filterGroups, onClearFilters, onBack, actions (Export).

### 3.6. Export

- Có nút Xuất Excel cho màn danh sách (Dự án, Công việc); Báo cáo đã có.
- Dữ liệu xuất: từ danh sách đã lọc/sắp xếp; cột map sang label i18n (vd. `t('congViec.store.tieuDeCol')`).

### 3.7. i18n

- Mỗi module có namespace riêng (du-an, cong-viec, thiet-lap-cong-viec, bao-cao); đủ key cho: title, filter, column, validation, toast, confirm, empty, loading, export.
- Cả vi và en.

### 3.8. Breadcrumb / title

- Nếu app có breadcrumb theo route: đảm bảo route hanh-chinh/du-an, cong-viec, thiet-lap-cong-viec, bao-cao có title/breadcrumb key (vd. `page.hanhChinh.modules.duAn`). Hiện tại có thể đã dùng `getModuleTitleKeyBySlug` – kiểm tra và bổ sung nếu thiếu.

---

## 4. Thứ tự triển khai đề xuất

1. **i18n:** Bổ sung toàn bộ key còn thiếu (empty, emptyHint, export, v.v.) cho du-an, thiet-lap-cong-viec, cong-viec, bao-cao (vi + en).
2. **Empty state:** Dự án (EmptyState khi không có dữ liệu); Thiết lập Mẫu CV; Công việc Kanban/Gantt/Dashboard; Báo cáo (nếu còn chỗ thiếu).
3. **Export Excel:** Dự án, Công việc (toolbar thêm nút Xuất).
4. **Error boundary:** Bọc 4 trang (Thiết lập CV, Dự án, Công việc, Báo cáo) bằng ErrorBoundary (tại index từng module hoặc tại SubmenuPage cho từng route).
5. **Validation:** Kiểm tra và bổ sung validation form (ngày bắt đầu/kết thúc Dự án; link URL trong báo cáo kết quả Công việc).
6. **Schema test (tùy chọn):** Viết test cho schema du-an, cong-viec, thiet-lap-cong-viec nếu muốn đảm bảo lâu dài.
7. **Export PDF Báo cáo (backlog):** Khi cần, thêm tùy chọn xuất PDF tương tự nhân viên stats.

---

## 5. File cần tạo/sửa (tóm tắt)

| Hạng mục | File / việc |
|----------|-------------|
| i18n | `locales/vi/du-an.json`, `locales/en/du-an.json`: empty, emptyHint, export. Tương tự thiet-lap-cong-viec (mau.empty, mau.emptyHint nếu chưa có). cong-viec: export. |
| Dự án empty | `du-an/index.tsx` hoặc `du-an-table`: khi !isLoading && data.length === 0 render EmptyState với title/description/action. |
| Dự án export | `du-an-toolbar.tsx`: thêm nút Export, gọi exportToExcel(sortedList map, 'du_an'). |
| Công việc export | `cong-viec-toolbar.tsx`: thêm nút Export (list view), export flattened hoặc sortedList. |
| Công việc Kanban empty | `cong-viec-kanban.tsx`: khi data.length === 0 hiển thị EmptyState giữa khu vực cột. |
| Error boundary | `du-an/index.tsx`, `cong-viec/index.tsx`, `thiet-lap-cong-viec/index.tsx`, `bao-cao/index.tsx`: bọc nội dung bằng <ErrorBoundary>. |
| Validation link URL | `cong-viec/core/schema.ts`: links từng phần tử z.string().url().optional() hoặc refine; form báo cáo giữ useFieldArray. |
| Schema test | Tạo `du-an/core/__tests__/schema.test.ts`, `cong-viec/core/__tests__/schema.test.ts` (optional). |

---

## 6. Kiểm tra cuối

- [ ] Tất cả màn list có Loading + Empty thống nhất.
- [ ] Tất cả form có validation + message i18n.
- [ ] Dự án, Công việc có nút Xuất Excel.
- [ ] Bốn trang (Thiết lập, Dự án, Công việc, Báo cáo) có ErrorBoundary.
- [ ] i18n vi/en đủ key cho từng module.
- [ ] Mobile: filter qua FilterGroups + MobileFilterSheet hoạt động đúng.
