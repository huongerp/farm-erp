# Hạn chế đã biết — tại bản 1.0.0 (04/10/2026)

Những điểm hệ thống CHƯA làm hoặc làm một phần, kèm mức ảnh hưởng và hướng xử lý. Liệt kê để hai bên
cùng biết rủi ro, không phải lỗi đang xảy ra.

## Bảo mật & phân quyền

| # | Hạn chế | Ảnh hưởng | Đã giảm nhẹ bằng | Hướng xử lý |
|---|---|---|---|---|
| 1 | Phần lớn bảng nghiệp vụ (phiếu kho, đơn hàng, tài sản, quỹ…) cho **mọi tài khoản đã đăng nhập** đọc/ghi ở tầng DB; phạm vi theo chi nhánh / phòng ban / người tạo chỉ áp ở giao diện | Nhân viên rành kỹ thuật có thể gọi thẳng API xem hoặc sửa dữ liệu ngoài phạm vi được giao | Nhật ký thay đổi ghi lại mọi thao tác kèm người làm thật (migration 016). Đã khoá ở DB: bảng nhân viên (cột cấp bậc, chức vụ, trạng thái…), phân quyền, chức vụ, cấp bậc, bảng lương, tiêu chí giám sát chất lượng; người chưa đăng nhập không truy cập được gì | Siết RLS dần theo module, ưu tiên sổ quỹ và phiếu kho |
| 2 | Thông tin cá nhân nhân viên (CCCD, số tài khoản, BHXH) đọc được bởi mọi tài khoản đăng nhập qua API | Lộ thông tin cá nhân trong nội bộ | Giao diện chỉ hiện cho người có quyền module Nhân viên | Tách cột nhạy cảm ra bảng / view có kiểm quyền |
| 3 | Phiên đăng nhập lưu trong localStorage của trình duyệt | Nếu trang bị chèn mã độc thì mất phiên | Đã escape dữ liệu ở mọi bản in/xuất; header bảo mật; CSP (đang ở chế độ chỉ ghi nhận) | Bật CSP chặn ([VAN_HANH.md](VAN_HANH.md) mục 7); về lâu dài chuyển sang cookie httpOnly |
| 4 | "Bắt buộc đổi mật khẩu lần đầu" chỉ kiểm ở giao diện | Người dùng rành kỹ thuật có thể bỏ qua bước đổi mật khẩu tạm | Mật khẩu tạm ngẫu nhiên, mỗi người một mật khẩu, chỉ admin thấy một lần | Kiểm cờ ở auth-service khi cấp phiên |
| 5 | Upload ảnh (Cloudinary) dùng preset không ký | Người ngoài biết tên preset có thể đẩy ảnh lên tài khoản Cloudinary | Giới hạn loại ảnh 2 MB ở giao diện | Chuyển sang upload có chữ ký từ server |

## Vận hành

| # | Hạn chế | Ảnh hưởng | Hướng xử lý |
|---|---|---|---|
| 6 | Không có môi trường thử (staging) — môi trường dev dùng chung DB thật | Migration và thử nghiệm chạm dữ liệu thật | Mỗi migration đều sao lưu + chạy thử trong transaction rồi huỷ trước khi chạy thật; nên dựng DB thử khi ngân sách cho phép |
| 7 | Sao lưu chạy thủ công trước mỗi migration, không có lịch tự động | Sự cố phần cứng VPS giữa hai lần sao lưu có thể mất dữ liệu trong khoảng đó | Theo quyết định hiện tại của bên vận hành |
| 8 | Chưa có giám sát uptime tự động | Service ngừng thì không ai được báo | Đăng ký dịch vụ uptime theo [VAN_HANH.md](VAN_HANH.md) mục 3 |
| 9 | Xoá dữ liệu là xoá hẳn (không có thùng rác) | Xoá nhầm phải khôi phục thủ công | Dòng bị xoá lưu trong nhật ký thay đổi, khôi phục bằng SQL (trừ ảnh dài) |

## Giao diện & chất lượng

| # | Hạn chế | Ghi chú |
|---|---|---|
| 10 | Khoảng 40 hộp thoại tự viết chưa đóng được bằng phím Esc / chưa giữ focus bên trong | Dùng chuột bình thường; ảnh hưởng người dùng bàn phím |
| 11 | Một số chuỗi hiển thị còn ghi cứng trong code (chưa qua file ngôn ngữ) | App chỉ có tiếng Việt nên người dùng không thấy khác biệt |
| 12 | Chưa có test giao diện tự động end-to-end | Có ~900 test logic (quyền, ngày–kỳ, import/export, mật khẩu, lỗi DB) chạy trong CI |
| 13 | Còn code không dùng: tính lương tự động từ chấm công (module chấm công đã bỏ), vài tab cấu hình cũ, 5 dashboard mẫu | Không hiện trên giao diện; dọn ở bản sau |
| 14 | 2 cảnh báo mức trung bình của thư viện `uuid` (nằm trong exceljs) | Lỗi chỉ khai thác được khi gọi uuid kèm buffer — exceljs không gọi kiểu đó |
