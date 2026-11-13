# Yêu cầu dự án

> AI đọc file này trước khi làm tính năng mới; việc được giao trái với file này thì hỏi lại,
> đừng tự chọn. Chỗ chưa biết ghi `(chưa rõ — hỏi khách)`, **không đoán**. Yêu cầu đổi thì
> sửa ở đây và ghi một dòng vào §9. Nội dung dưới đây suy ra từ code, docs và git log, chưa
> được khách xác nhận từng mục.

Cập nhật lần cuối: 14/11/2026

## 1. Khách hàng

- Tên công ty · ngành nghề · quy mô: ngành trồng và sơ chế chuối (tem in «Cavendish banana»; bản in có ảnh «HTX fp»); tên pháp lý, số nhân viên, số farm/chi nhánh/kho `(chưa rõ — hỏi khách)`. Hệ thống có sẵn khái niệm chi nhánh, farm, nhà sơ chế, kho.
- Người đầu mối (vai trò, không ghi liên hệ vào repo): `(chưa rõ — hỏi khách)`
- Đang quản lý bằng gì trước đây: `(chưa rõ — hỏi khách)`. Ghi chú: có xuất/đồng bộ Google Sheet nên nhiều khả năng từng dùng Google Sheets.
- Vấn đề lớn nhất muốn giải quyết: quản lý nội bộ gộp một chỗ — sơ chế, kho vận, mua hàng, hành chính nhân sự, sổ quỹ — có phân quyền theo chức vụ/cấp bậc và dùng được trên điện thoại. Mục tiêu cụ thể của khách `(chưa rõ — hỏi khách)`.

## 2. Người dùng

Vai trò trong app lấy từ chức vụ + cấp bậc (`cap_bac = 1` là «cấp cao», xem toàn phạm vi); ma trận thật ở [`docs/MA_TRAN_PHAN_QUYEN.md`](../MA_TRAN_PHAN_QUYEN.md).

| Vai trò | Số người | Làm gì trên app | Thiết bị chính |
|---|---|---|---|
| Quản trị / cấp bậc 1 | `(chưa rõ — hỏi khách)` | Xem toàn phạm vi, duyệt phiếu quỹ, đổi ngày phiếu, cấu hình | Máy tính + điện thoại |
| Nhân viên farm / nhà sơ chế | `(chưa rõ — hỏi khách)` | Báo cáo sơ chế, nhân công, thu hoạch, phiếu kho, đăng ký nhận hàng; chỉ xem đơn của farm mình | Điện thoại (đã tối ưu thẻ danh sách) |
| Kho, mua hàng, kế toán/quỹ, hành chính | `(chưa rõ — hỏi khách)` | Phiếu kho, đề xuất/đơn đặt hàng/hợp đồng, sổ quỹ, tài sản, lương | `(chưa rõ — hỏi khách)` |

## 3. Thước đo thành công

`(chưa rõ — hỏi khách)` — chưa có tiêu chí nghiệm thu đo được nào ghi trong repo.

## 4. Phạm vi — module

Danh sách đầy đủ và trạng thái: [`roadmap.md`](roadmap.md). Mức ưu tiên `(chưa rõ — hỏi khách)`; các nhóm dưới đây đều đã có trong app.

| Nhóm | Module | Ghi chú nghiệp vụ |
|---|---|---|
| Hệ thống | nhân viên, phòng ban, chức vụ, cấp bậc, chi nhánh, phân quyền, thông tin công ty, kết nối Google | Phân quyền hai tầng: app (`fp_var_phan_quyen`) và DB (RLS) |
| Hành chính | bảng lương, thiết lập công lương, điểm cộng trừ, công việc, phiếu hành chính, tài sản (danh mục, thiết lập, cấp phát/thu hồi, kiểm kê, khấu hao, bảo trì), nơi quản lý | |
| Kho vận | danh mục/danh sách hàng hoá, kho, đối tác, phiếu kho, phiếu đề xuất vật tư, kiểm kê, tồn kho, báo cáo nhập-xuất-tồn | Nhập/đặt hàng từng phần không vượt phiếu gốc; chặn xoá hàng hoá đang dùng |
| Mua hàng | đơn đặt hàng, hợp đồng, thanh toán đối tác, báo cáo/thiết lập đề xuất vật tư | Hợp đồng tách đợt cọc, thanh toán theo số cây, trừ cọc |
| Quản lý nhà sơ chế | thu hoạch, báo cáo sơ chế, báo cáo nhân công, thống kê sản xuất, dự báo SL đóng thùng, giám sát chất lượng, đánh giá đầu vào, đăng ký nhận hàng, đăng ký tham quan farm, nhật ký pha phèn, nhật ký pha thuốc phun cùi, đề xuất mua hàng, checklist & bảo trì, bộ kho Phân thuốc | Phân thuốc dùng lại module kho qua biến thể `fp_pt_*` |
| Tài chính | thu chi quỹ, thiết lập quỹ, thống kê quỹ | Phiếu quỹ duyệt / không duyệt; chỉ quản trị / cấp 1 đổi ngày phiếu |

## 5. Nghiệp vụ đặc thù

Quy tắc đã thể hiện trong code/git log (chưa có tài liệu nghiệp vụ riêng của khách; số liệu ví dụ `(chưa rõ — hỏi khách)`):

- Luồng duyệt: phiếu kho Sơ chế/Phân thuốc khoá sau khi duyệt, sửa qua luồng «Xin sửa»; phiếu quỹ duyệt / không duyệt (trigger `fn_tc_quy_khoa_duyet`); giám sát chất lượng: nộp phiếu → đã nộp → đã xuất.
- Công thức tính: dự báo SL đóng thùng (dòng 10 cộng tồn đầu, trừ tồn cuối ngày); kết luận giám sát chất lượng theo số tiêu chí; kiểm kê tính SL sổ theo ngày bắt đầu đợt; công thức lương/công/khấu hao cụ thể `(chưa rõ — hỏi khách)`.
- Phạm vi xem: đơn đặt hàng — người không có quyền admin chỉ thấy đơn của farm mình; «cấp cao» (`cap_bac = 1` hoặc quyền admin/all) xem toàn phạm vi.
- Mẫu in bắt buộc: phiếu in dùng khung chung (khổ giấy, liên, dấu chìm, QR; có ảnh/logo HTX ở đầu phiếu); bản mẫu giấy của khách (có `Phiếu in đề xuất.docx`, `bản in phiếu kho.docx` ở gốc repo) — danh sách mẫu bắt buộc `(chưa rõ — hỏi khách)`.

## 6. Dữ liệu và tích hợp

- Dữ liệu cũ cần nhập: `(chưa rõ — hỏi khách)` (app đã có chức năng nhập Excel).
- Kết nối ngoài: Google (đăng nhập, xuất/đồng bộ Google Sheet); Web Push; tem QC quét mã. Zalo, hoá đơn điện tử, ngân hàng: không thấy trong code.
- Lưu ảnh: media-service trên volume VPS, DB chỉ lưu `/media/f/...` (không Cloudinary, không base64). Dung lượng ước tính `(chưa rõ — hỏi khách)`.

## 7. Ràng buộc

- Hạn bàn giao · các mốc: bản 1.0.0 bàn giao kỹ thuật ngày 04/10/2026 (tag `v1.0.0`); mốc tiếp theo `(chưa rõ — hỏi khách)`.
- Hạ tầng: một VPS (Dokploy + Traefik, Postgres, PostgREST, các service Node) dùng chung với app khác của bên phát triển; tên miền `(chưa rõ — hỏi khách)`; ai đứng tên/trả phí từng dịch vụ xem [`BAN_GIAO_TAI_KHOAN.md`](../BAN_GIAO_TAI_KHOAN.md).
- Bảo mật, sao lưu: sao lưu DB thủ công trước migration, không có lịch tự động; không có môi trường thử (dev dùng chung DB thật); danh sách hạn chế: [`HAN_CHE_DA_BIET.md`](../HAN_CHE_DA_BIET.md). Yêu cầu riêng của khách `(chưa rõ — hỏi khách)`.

## 8. Ngoài phạm vi

`(chưa rõ — hỏi khách)` — chưa có thoả thuận «không làm» nào ghi lại. Điều đã biết từ code: app chỉ có tiếng Việt; module chấm công đã bỏ (không tự tính lương từ chấm công).

## 9. Câu hỏi còn mở và lịch sử thay đổi

| Ngày | Nội dung | Trạng thái |
|---|---|---|
| 13/11/2026 | Tạo file từ docs/code/git log; các mục `(chưa rõ — hỏi khách)` ở §1–§8 cần khách xác nhận | Chờ khách trả lời |
