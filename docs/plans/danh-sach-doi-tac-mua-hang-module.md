# Kế hoạch xây dựng module "Danh sách đối tác" (Mua hàng)

## 1. Tổng quan

- **Tên module**: Danh sách đối tác (trong submenu **Mua hàng**).
- **Độc lập** với module "Danh sách đối tác" trong submenu **Kho vận** (không dùng chung code, không chia sẻ store/service).
- **Phạm vi**: Chỉ quản lý **nhà cung cấp** (NCC). Không có tab, không có trường "loại đối tác".
- **Đơn giản hóa**: **Không** có trường **nhóm** (id_nhom, ten_nhom) và **không** có trường **tag** (tag_ids, ten_tags). Căn cứ module Danh sách đối tác (Kho vận) nhưng bỏ nhóm và tag.

---

## 2. Tham chiếu module Kho vận (chỉ để tham khảo cấu trúc)

- **Kho vận – Danh sách đối tác**: `features/kho-van/danh-sach-doi-tac`
  - Có 2 tab: Nhà cung cấp | Khách hàng (`loai_doi_tac`).
  - Entity: `DoiTac` với `id_nhom`, `tag_ids`, `ten_nhom`, `ten_tags` (enrich).
  - Toolbar: lọc theo trạng thái, theo nhóm (`id_nhom`).
  - Form: Select nhóm, MultiSelect tag, truyền `loaiDoiTac`.
  - Detail: bảng con phiếu kho liên quan.
- **Module mới (Mua hàng)** không import hay phụ thuộc vào module Kho vận này; tạo bộ types/service/store/components riêng.

---

## 3. Yêu cầu chức năng

### 3.1. Một trang duy nhất (không tab, không loại)

- Một màn hình: **Danh sách** NCC.
- Không có TabGroup, không có chọn "Nhà cung cấp / Khách hàng" (mặc định chỉ NCC).

### 3.2. Bỏ nhóm và tag

- **Không** có:
  - Nhóm đối tác (id_nhom, ten_nhom, NhomDoiTac, filter theo nhóm).
  - Tag (tag_ids, ten_tags, Tag, MultiSelect tag, createTag).
- Store: không filter `id_nhom`; không cột "Nhóm", "Tag".
- Form: không ô chọn nhóm, không ô chọn tag.
- Service: không bảng NhomDoiTac, Tag; không enrich `ten_nhom`, `ten_tags`.

### 3.3. Dữ liệu nhà cung cấp (NCC)

Chỉ các trường sau:

| Trường        | Kiểu     | Bắt buộc | Ghi chú                          |
|---------------|----------|----------|----------------------------------|
| id            | string   | (hệ thống) | PK                              |
| ma_ncc        | string   | Có       | Mã NCC, unique, format (VD: A-Z, 0-9, _-) |
| ten_ncc        | string   | Có       | Tên nhà cung cấp                 |
| dia_chi       | string   | Không    | Địa chỉ                          |
| dien_thoai    | string   | Không    | Số điện thoại                    |
| email         | string   | Không    | Email                            |
| mo_ta         | string   | Không    | Mô tả / ghi chú                  |
| trang_thai    | 0 \| 1   | Có       | 0 = Ngừng, 1 = Hoạt động        |
| thu_tu        | number   | Có       | Thứ tự sắp xếp (≥ 0)             |
| tg_tao        | string   | (hệ thống) | Thời gian tạo (ISO)           |
| tg_cap_nhat   | string   | (hệ thống) | Thời gian cập nhật (ISO)      |

---

## 4. Cấu trúc thư mục đề xuất

Tạo module mới dưới **Mua hàng**, ví dụ:

```
features/mua-hang/danh-sach-doi-tac-mua-hang/
├── core/
│   ├── types.ts      # NhaCungCap (không loai_doi_tac, id_nhom, tag_ids)
│   └── schema.ts     # Zod: ma_ncc, ten_ncc, dia_chi, dien_thoai, email, mo_ta, trang_thai, thu_tu
├── services/
│   └── nha-cung-cap-service.ts   # CRUD + mock (không NhomDoiTac, Tag)
├── store/
│   └── useNhaCungCapStore.ts      # filters: status only; columns không có nhóm/tag
├── hooks/
│   └── use-nha-cung-cap.ts        # useNhaCungCapList, useNhaCungCapById, useCreate/Update/Delete/DeleteMany
├── components/
│   ├── NhaCungCapToolbar.tsx      # Search, filter trạng thái (Active/Inactive), không filter nhóm
│   ├── NhaCungCapList.tsx         # Bảng: thu_tu, ma_ncc, ten_ncc, dia_chi, dien_thoai, email, trang_thai, tg_cap_nhat
│   ├── NhaCungCapForm.tsx         # Form: ma_ncc, ten_ncc, dia_chi, dien_thoai, email, mo_ta, trang_thai, thu_tu (không nhóm, không tag)
│   └── NhaCungCapDetail.tsx       # Xem chi tiết; (tuỳ chọn) bảng con Đơn đặt hàng liên quan
├── index.tsx                      # Một trang duy nhất: Toolbar + List + Form drawer + Detail drawer (không TabGroup)
└── locales/
    ├── vi.json
    └── en.json
```

**Lưu ý tên slug route**: Menu Mua hàng hiện dùng slug `danh-sach-doi-tac`. Có hai cách:

- **A)** Đặt tên folder feature là `danh-sach-doi-tac` (ví dụ `features/mua-hang/danh-sach-doi-tac`) và route `/mua-hang/danh-sach-doi-tac` trỏ vào page mới này (page Mua hàng thay thế nội dung "danh sách đối tác" của Mua hàng).
- **B)** Đặt tên folder khác (ví dụ `danh-sach-nha-cung-cap`) để tránh nhầm với Kho vận, nhưng vẫn đăng ký route `/mua-hang/danh-sach-doi-tac` trong `SubmenuPage` để giữ đúng menu.

Nên thống nhất: **route** = `/mua-hang/danh-sach-doi-tac`; **tên folder** có thể là `danh-sach-doi-tac` (dưới `features/mua-hang/`) để trùng slug và dễ nhớ.

---

## 5. Chi tiết từng phần

### 5.1. Core

- **types.ts**
  - Định nghĩa `NhaCungCap`: id, ma_ncc, ten_ncc, dia_chi?, dien_thoai?, email?, mo_ta?, trang_thai (0|1), thu_tu, tg_tao, tg_cap_nhat.
  - Không có `LoaiDoiTac`, `NhomDoiTac`, `Tag`, `id_nhom`, `tag_ids`, `ten_nhom`, `ten_tags`.
- **schema.ts**
  - Zod: ma_ncc (required, max 50, regex format), ten_ncc (required, max 255), dia_chi, dien_thoai, email, mo_ta (optional); trang_thai (0|1), thu_tu (number >= 0).
  - Không có `loai_doi_tac`, `id_nhom`, `tag_ids`.

### 5.2. Service

- **nha-cung-cap-service.ts**
  - Seed/mock chỉ bản ghi NCC (không seed NhomDoiTac, Tag).
  - `getAllNhaCungCap()`: trả về danh sách, sort theo thu_tu rồi ma_ncc (không enrich nhóm/tag).
  - `getNhaCungCapById(id)`, `createNhaCungCap(data)`, `updateNhaCungCap(id, data)`, `deleteNhaCungCap(id)`, `deleteNhaCungCapMany(ids)`.
  - Không có `getAllNhomDoiTac`, `getAllTag`, `createTag`, không có `enrichDoiTac` với nhóm/tag.

### 5.3. Store

- **useNhaCungCapStore**
  - Filters: chỉ `status: string[]` (Active/Inactive) — không `id_nhom`.
  - Columns: thu_tu, ma_ncc, ten_ncc, dia_chi, dien_thoai, email, trang_thai, tg_cap_nhat (bỏ cột Nhóm, cột Tag).

### 5.4. Hooks

- React Query: `useNhaCungCapList`, `useNhaCungCapById`, `useCreateNhaCungCap`, `useUpdateNhaCungCap`, `useDeleteNhaCungCap`, `useDeleteNhaCungCapMany`.
- Không cần `useNhomDoiTacList`, `useTagList`, `useCreateTag`.

### 5.5. Components

- **NhaCungCapToolbar**
  - Search (ma_ncc, ten_ncc, địa chỉ, SĐT, email…).
  - Filter: trạng thái (Active / Inactive).
  - Nút Thêm mới, Xóa nhiều.
  - Không filter nhóm, không có MultiSelect tag.
- **NhaCungCapList**
  - Cột: checkbox, thu_tu, ma_ncc, ten_ncc, dia_chi, dien_thoai, email, trang_thai, tg_cap_nhat, actions (Xem/Sửa/Xóa).
  - Không cột ten_nhom, không cột tags.
- **NhaCungCapForm**
  - Trường: Mã NCC, Tên NCC, Địa chỉ, Điện thoại, Email, Mô tả, Trạng thái (toggle hoặc select), Thứ tự.
  - Không Select nhóm, không MultiSelect tag.
- **NhaCungCapDetail**
  - Hiển thị đọc: mã, tên, địa chỉ, SĐT, email, mô tả, trạng thái, thứ tự, tg_tao, tg_cap_nhat.
  - (Tuỳ chọn) Bảng con "Đơn đặt hàng liên quan" (lấy theo id_nha_cung_cap từ module Đơn đặt hàng) — nếu cần sau.

### 5.6. Trang chính (index.tsx)

- **Không** dùng `TabGroup`; không state `activeTab`.
- Layout: Toolbar + List + Form (drawer) + Detail (drawer).
- Khi "Thêm mới" / "Sửa" → mở Form drawer; khi click xem hàng → mở Detail drawer.
- Đăng ký route: trong `SubmenuPage`, với `basePath === '/mua-hang'` và `decodedSlug === 'danh-sach-doi-tac'` render page này (thay cho hoặc tách riêng với page Kho vận).

---

## 6. Locale

- Namespace riêng (ví dụ `nhaCungCapMuaHang` hoặc `danhSachDoiTacMuaHang`) để không đè lên locale của Kho vận (`doiTac`).
- Key cho: tabs (nếu sau này có thêm tab khác thì dùng), form (mã, tên, địa chỉ, SĐT, email, mô tả, trạng thái, thứ tự), list (tiêu đề cột), validation, toast, delete confirm, v.v.

---

## 7. Đăng ký route & menu

- Menu Mua hàng đã có mục "Danh sách đối tác" với slug `danh-sach-doi-tac`.
- Trong `pages/SubmenuPage.tsx`: thêm nhánh `basePath === '/mua-hang' && decodedSlug === 'danh-sach-doi-tac'` → render component page của module mới (ví dụ `DanhSachDoiTacMuaHangPage`).
- Đảm bảo không render nhầm module Kho vận khi đang ở `/mua-hang/danh-sach-doi-tac`.

---

## 8. Tóm tắt khác biệt so với Kho vận

| Hạng mục           | Kho vận – Danh sách đối tác | Mua hàng – Danh sách đối tác (mới) |
|--------------------|-----------------------------|-------------------------------------|
| Tab / loại         | 2 tab: NCC \| Khách hàng    | Không tab; chỉ NCC                  |
| Nhóm (id_nhom)     | Có (entity, filter, form)   | Không                               |
| Tag (tag_ids)      | Có (entity, form MultiSelect) | Không                             |
| Entity             | DoiTac (loai, id_nhom, tag_ids) | NhaCungCap (chỉ trường cơ bản)  |
| Filter toolbar     | Trạng thái + Nhóm          | Chỉ trạng thái                      |
| Cột bảng           | Có cột Nhóm, Tag           | Không cột nhóm, tag                 |
| Detail             | Có bảng con Phiếu kho      | (Tuỳ chọn) Bảng con Đơn đặt hàng    |

---

## 9. Thứ tự triển khai gợi ý

1. **Core**: types + schema (NhaCungCap, không nhóm/tag).
2. **Service**: CRUD + mock data (chỉ NCC).
3. **Store + hooks**: useNhaCungCapStore (filter status), React Query hooks.
4. **Components**: Toolbar (search + status), List, Form (không nhóm/tag), Detail.
5. **index.tsx**: Một trang, không TabGroup; tích hợp Toolbar, List, Form, Detail.
6. **Locales**: vi.json, en.json; đăng ký vào locales chính.
7. **Route**: SubmenuPage nhánh `/mua-hang/danh-sach-doi-tac` → page mới.
8. (Tuỳ chọn) Detail: bảng con "Đơn đặt hàng" theo id_nha_cung_cap.

Sau khi triển khai xong, có thể đổi tên entity/component từ "NhaCungCap" sang "DoiTac" nếu muốn thống nhất tên gọi với menu ("Danh sách đối tác"), nhưng trong code vẫn không có nhóm/tag để tránh nhầm với module Kho vận.
