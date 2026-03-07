# Báo cáo & Kế hoạch: Danh sách tài sản (3 tab)

## Báo cáo đã làm

### Module: Danh sách tài sản (slug: `danh-muc-tai-san`)

- **Menu:** Hiển thị "Danh sách tài sản" (VI) / "Asset List" (EN), slug giữ `danh-muc-tai-san`.
- **Route:** Hành chính → Danh sách tài sản → `/hanh-chinh/danh-muc-tai-san`.

### 3 tab

1. **Danh sách**
   - Toàn bộ tài sản (MVP: chưa lọc theo quyền phòng/nhân viên dưới quyền).
   - Toolbar: tìm kiếm, bộ lọc (trạng thái dùng/ngưng, nhóm, nơi lưu, trạng thái tài sản), Thêm mới, xóa/đổi trạng thái hàng loạt.
   - Bảng: cột từ store (mã, tên, nhóm, nơi lưu, trạng thái, người giữ, ngày nhập, nguyên giá, cập nhật), sắp xếp, phân trang, chọn nhiều dòng.
   - Click dòng → drawer chi tiết (Đóng / Sửa / Xóa).
   - Thêm mới / Sửa → drawer form (mã, tên, nhóm, nơi lưu, trạng thái tài sản, người đang giữ, ngày nhập, nguyên giá, ghi chú, trạng thái).

2. **Của tôi**
   - Chỉ tài sản có `id_nhan_vien_dang_giu === user.id` (user hiện tại từ `useAuthStore`).
   - Toolbar đơn giản: tìm kiếm.
   - Bảng giống Danh sách nhưng không có nút Sửa/Xóa (chỉ xem).
   - Click dòng → drawer chi tiết (chỉ nút Đóng).

3. **Thống kê**
   - Thẻ: Tổng số, Đang dùng, Ngưng dùng, Tổng nguyên giá.
   - Danh sách theo nhóm / theo nơi lưu / theo trạng thái tài sản (số lượng).

### Cách dùng

- Vào **Hành chính** → **Danh sách tài sản**.
- Tab **Danh sách**: thêm/sửa/xóa, lọc, xem chi tiết.
- Tab **Của tôi**: xem tài sản mình đang giữ (user mặc định `emp-000`; mock có `ts-1`, `ts-2` gán cho `emp-000`).
- Tab **Thống kê**: xem tổng quan và phân bổ theo nhóm/nơi lưu/trạng thái.

### File đã thêm/sửa (tóm tắt)

- **Core:** `core/types.ts`, `core/schema.ts`.
- **Store:** `store/useDanhSachTaiSanStore.ts`.
- **Service:** `services/danh-muc-tai-san-service.ts`.
- **Hooks:** `hooks/use-danh-muc-tai-san.ts`.
- **Components:** `DanhSachTaiSanToolbar`, `TaiSanTable`, `TaiSanForm`, `TaiSanDetail`, `DanhSachTab`, `CuaToiTab`, `ThongKeTab`.
- **Page:** `features/hanh-chinh/danh-muc-tai-san/index.tsx`.
- **Locales:** `locales/vi/danh-sach-tai-san.json`, `locales/en/danh-sach-tai-san.json`; gộp vào `locales/vi/index.ts`, `locales/en/index.ts`.
- **Menu:** `locales/vi/pages.json`, `locales/en/pages.json` (đổi tên hiển thị).
- **Route:** `pages/SubmenuPage.tsx` (case `danh-muc-tai-san` → `DanhSachTaiSanPage`).
- **Mock:** `mocks/hanh-chinh.ts` (MOCK_TAI_SAN).

---

## Kế hoạch tiếp theo

1. **Cấp phát / Thu hồi tài sản**
   - Luồng cấp phát (chọn tài sản → gán nhân viên, ngày) và thu hồi (bỏ gán).
   - Có thể là action trong Danh sách tài sản hoặc module con (slug riêng tùy thiết kế).

2. **Kiểm kê tài sản**
   - Phiếu kiểm kê, đối chiếu thực tế vs sổ (trạng thái, nơi lưu, người giữ).
   - Báo cáo chênh lệch, xác nhận/cập nhật.

3. **Phân quyền theo phòng / nhân viên dưới quyền**
   - Tab Danh sách: chỉ hiển thị tài sản user được quyền (theo phòng ban hoặc cây quản lý).
   - Tích hợp với hệ thống quyền hiện có (role, id_phong_ban, nhân viên dưới quyền).

4. **Tùy chọn bổ sung**
   - Xuất Excel/PDF danh sách tài sản, báo cáo thống kê.
   - Lịch sử thay đổi (người giữ, trạng thái).
   - Cảnh báo bảo trì / hết hạn bảo hành (nếu có trường ngày).

Ưu tiên gợi ý: (1) Cấp phát/Thu hồi, (2) Phân quyền, (3) Kiểm kê, (4) Các tùy chọn còn lại.
