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
- Chia nhóm chạy năng suất (yêu cầu chị Hương, NSC fp3, 17/11/2026): báo cáo nhân công có cột Nhóm 1–9 cho từng người (mặc định ở danh mục NV, đổi theo ngày trên phiếu), in «Danh sách theo nhóm» có tổng người/công mỗi nhóm. Năng suất nhóm (số thùng nhóm ÷ giờ, mục tiêu 3) chốt 17/11/2026 đã **bỏ** ngày 21/11/2026 — nhóm trưởng không nhập số thùng theo nhóm nữa; thưởng xem mục «Thưởng vượt thùng» ngay dưới.
- Thưởng vượt thùng cho công nhân (yêu cầu NSC, chốt 20/11/2026, thay thưởng «10.714đ × công» của nhóm Tỉa): không chia đều mà theo khâu khó/dễ, **không có tổng quỹ cố định**. **Đổi 21/11/2026 (chị Hương):** mỗi ngày thùng vượt = thực tế − mục tiêu của dòng KPI «Tỷ lệ thu hồi» trên Báo cáo sơ chế cùng ngày + nhà sơ chế (vd 211 − 196 = 15; lấy số đã lưu, nhóm trưởng không nhập); quỹ ngày = thùng vượt × 1.000đ **chỉ khi** KPI «Năng suất sơ chế» ≥ 90% mục tiêu (ngưỡng sửa ở Cài đặt), không đạt thì 0. Quỹ chia cho các nhóm của 5 chuyền theo giờ × hệ số chuyền × hệ số nhóm, trong nhóm chia theo giờ; giờ = giờ công + giờ TC, nhóm có người tăng ca thì người không tăng ca («xuống sớm») không tính và không nhận (nhóm không ai tăng ca thì tính đủ). Hệ số chuyền + hệ số nhóm 1–9 cài riêng từng nhà sơ chế, hệ số nhóm sửa được trên phiếu. Vị trí nhóm trưởng / nhóm phó / quản lý (đánh dấu trong danh mục Vị trí) không nhận và không tính giờ. Cuối tháng cộng các ngày × hệ số lỗi Ki từng người (mặc định 1). Thưởng KPI của QL / nhóm trưởng tỉa / nhóm trưởng đóng thùng ở Báo cáo sơ chế giữ nguyên, riêng dòng Năng suất sơ chế đổi ngưỡng 85% → 90% (dòng lỗi, thu hồi giữ 85%). Công nhân sơ chế không nằm trong Bảng lương hệ thống → tab «Thưởng vượt tháng» là bảng thưởng chính thức (chốt 20/11/2026): người có quyền duyệt bấm «Chốt tháng» lưu ảnh chụp số tiền từng người, tháng đã chốt không sửa được phiếu báo cáo nhân công / Ki (đổi Cài đặt hệ số không ảnh hưởng), chỉ quản trị «Mở chốt»; in «Bảng thưởng vượt thùng tháng» có cột ký nhận và hàng ký Người lập · Quản lý nhà sơ chế · Kế toán · Giám đốc (chưa chốt in dấu «Bản nháp»).
