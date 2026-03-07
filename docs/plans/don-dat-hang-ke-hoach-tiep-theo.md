# Kế hoạch hành động tiếp theo – Module Đơn đặt hàng

Module **Đơn đặt hàng** (Purchase Order) đã được xây dựng với đầy đủ: Danh sách, Thống kê, Form, Detail, liên kết Nhà cung cấp/Kho/Nhân viên/Phiếu đề xuất (optional). Dưới đây là kế hoạch hành động tiếp theo để hoàn thiện và mở rộng.

---

## 1. Đã hoàn thành (hiện tại)

- **Core**: `types`, `schema`, `constants` (trạng thái 0–7)
- **Service**: CRUD + enrich từ Đối tác (NCC), Kho, Nhân viên, Phiếu đề xuất, Hàng hóa
- **Store & hooks**: `useDonDatHangStore`, React Query (list, byId, create, update, delete, deleteMany)
- **Tab Danh sách**: Toolbar (lọc trạng thái, NCC, kho, người đặt), List (cột + phân trang), Form (header + dòng hàng có đơn giá), Detail drawer
- **Tab Thống kê**: StatsToolbar, StatsCards (Tổng / Nháp / Đang xử lý / Hoàn thành / Hủy), StatsCharts (Pie trạng thái, Bar theo tháng/NCC/người đặt), StatsTables (theo trạng thái, NCC, người đặt)
- **Route**: `/mua-hang/don-dat-hang` → `DonDatHangPage` (TabGroup 2 tab)
- **Locale**: vi / en cho toàn bộ module

---

## 2. Ưu tiên cao – Nên làm tiếp

### 2.1. Tạo đơn từ Phiếu đề xuất vật tư

- **Mục tiêu**: Trong form tạo PO, thêm luồng “Tạo từ phiếu đề xuất” để chọn phiếu đã duyệt và copy dòng hàng.
- **Cách làm**:
  - Thêm nút “Tạo từ phiếu đề xuất” trên toolbar hoặc trong form (khi đang tạo mới).
  - Mở modal/drawer chọn **một phiếu đề xuất** (trạng thái Đã duyệt).
  - Sau khi chọn: điền `id_phieu_de_xuat_vat_tu`, (tuỳ chọn) `ngay_giao_dk` từ `ngay_can`, và **copy toàn bộ chi tiết** (id_hang_hoa, so_luong, ghi_chu) vào `chi_tiet` form; đơn giá để trống, user nhập sau.
- **File gợi ý**: `DonDatHangForm.tsx`, hook/service lấy danh sách phiếu đã duyệt (đã có `usePhieuDeXuatVatTuList` + filter `trang_thai === 1`).

### 2.2. Liên kết Phiếu nhập kho với Đơn đặt hàng

- **Mục tiêu**: Khi tạo Phiếu nhập kho (loại nhập), cho phép chọn “Nhập từ đơn đặt hàng” và copy NCC + kho + dòng hàng từ PO.
- **Cách làm**:
  - Trong module **Phiếu kho** (tab Chi tiết phiếu / form phiếu nhập): thêm trường optional `id_don_dat_hang` (hoặc “Chọn đơn đặt hàng”).
  - Khi chọn PO (trạng thái Đã xác nhận / Đang giao): copy `id_nha_cung_cap`, `id_kho_nhan` (kho nhận), và danh sách dòng (id_hang_hoa, so_luong); số lượng có thể chỉnh khi nhập thực tế.
  - (Tuỳ chọn) Cập nhật trạng thái PO khi đã nhập đủ (ví dụ: chuyển sang Đã nhận đủ / Đã đóng).
- **File gợi ý**: `features/kho-van/phieu-kho` (form nhập kho, types, service phiếu kho).

### 2.3. Xuất báo cáo / In đơn

- **Mục tiêu**: Tab Thống kê: xuất Excel/PDF; Danh sách/Detail: in đơn đặt hàng (PDF hoặc in trang).
- **Cách làm**:
  - **Thống kê**: Implement `onExportReport` (Excel/PDF) tương tự các module khác (tham chiếu `export-bao-cao-nxt-excel`, `export-bao-cao-nxt-pdf` hoặc báo cáo nhân viên).
  - **In PO**: Thêm nút “In đơn” ở Detail (và có thể ở List): tạo layout in (hoặc PDF) với header PO + bảng dòng hàng (số PO, ngày, NCC, kho, điều khoản, bảng chi tiết).
- **File gợi ý**: `utils/export-don-dat-hang-excel.ts`, `utils/export-don-dat-hang-pdf.ts`, `DonDatHangDetail.tsx`, `StatsToolbar`/`ThongKeTab`.

---

## 3. Ưu tiên trung bình

### 3.1. Số hóa đơn / Mã tham chiếu NCC

- Thêm trường optional: “Số hóa đơn NCC”, “Mã tham chiếu” (khi NCC xác nhận) để đối soát sau này.

### 3.2. Duyệt đơn đặt hàng

- Nếu doanh nghiệp cần duyệt PO trước khi gửi: dùng sẵn trạng thái **Chờ duyệt** (1) và `id_nguoi_duyet`; thêm luồng “Gửi duyệt” (0 → 1) và “Duyệt / Từ chối” (1 → 2 hoặc 7).

### 3.3. Tổng tiền đơn hàng

- Trong Detail (và có thể List): hiển thị **tổng tiền** = tổng `thanh_tien` của các dòng (đã có `don_gia` × `so_luong` trong service). Có thể thêm cột “Tổng tiền” trong bảng list (tính từ `chi_tiet` nếu API trả về).

### 3.4. Lọc theo khoảng ngày trong Danh sách

- Toolbar tab Danh sách: thêm bộ lọc “Từ ngày – Đến ngày” (theo `ngay_dat`) giống tab Thống kê để thu hẹp danh sách.

---

## 4. Ưu tiên thấp / Mở rộng sau

- **API thật**: Thay mock service bằng API backend (REST) cho CRUD đơn đặt hàng và chi tiết.
- **Gửi email PO cho NCC**: Tích hợp gửi email (hoặc link tải PDF) khi chuyển trạng thái “Đã gửi”.
- **Lịch sử thay đổi trạng thái**: Bảng/audit log lưu lại khi nào PO chuyển trạng thái (và ai thao tác) để truy vết.
- **Tích hợp Thanh toán đối tác**: Khi module Thanh toán đối tác có sẵn, cho phép từ PO (hoặc từ Phiếu nhập liên kết PO) tạo thanh toán theo đơn.

---

## 5. Thứ tự thực hiện gợi ý

1. **Tạo từ phiếu đề xuất** (2.1) – tận dụng dữ liệu sẵn, tăng tốc tạo đơn.
2. **In đơn / Xuất báo cáo** (2.3) – nhu cầu in ấn và báo cáo thường có sớm.
3. **Liên kết Phiếu nhập kho** (2.2) – đóng vòng từ đề xuất → đặt hàng → nhập kho.
4. Các mục 3.x và 4 làm dần theo nhu cầu nghiệp vụ.

Sau khi hoàn thành từng bước, nên cập nhật lại file kế hoạch này (đánh dấu đã xong, bổ sung bước mới nếu có).
