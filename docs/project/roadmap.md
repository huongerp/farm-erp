# Roadmap

Cập nhật lần cuối: 22/11/2026

Ký hiệu: ✅ xong · 🔄 đang làm · ⏳ chưa làm

Chỉ ghi giai đoạn và trạng thái; chi tiết từng thay đổi xem `git log`. Yêu cầu của khách: [`yeu-cau.md`](yeu-cau.md).

## Giai đoạn 1 — Nền tảng ✅

React 19 + Vite + TypeScript (PWA) · PostgREST self-host + auth-service (JWT, mật khẩu + Google) trên VPS Dokploy · đã chuyển hẳn khỏi Supabase ([`VPS_CUTOVER.md`](../VPS_CUTOVER.md)).

## Giai đoạn 2 — Module nghiệp vụ ✅

| Nhóm | Trạng thái |
|---|---|
| Hệ thống (nhân viên, phòng ban, chức vụ, cấp bậc, chi nhánh, phân quyền, thông tin công ty, kết nối Google) | ✅ |
| Hành chính (lương, công việc, phiếu, tài sản các loại) | ✅ |
| Kho vận (hàng hoá, kho, đối tác, phiếu kho, đề xuất vật tư, kiểm kê, tồn kho, báo cáo NXT) | ✅ |
| Mua hàng (đơn đặt hàng, hợp đồng, thanh toán đối tác, báo cáo/thiết lập) | ✅ |
| Quản lý nhà sơ chế (thu hoạch, sơ chế, nhân công, giám sát chất lượng, đăng ký nhận hàng, đề xuất mua hàng, bộ kho Phân thuốc…) | ✅ |
| Tài chính (thu chi quỹ, thiết lập, thống kê) | ✅ |
| Nhóm Checklist & bảo trì, Đánh giá đầu vào, Đăng ký tham quan farm (thêm 10–11/2026) | 🔄 còn được bổ sung theo yêu cầu khách — đã có phiếu vệ sinh tuần (lưới T2–CN, migration 080); cân mẫu buồng theo chuyến ở ĐGĐV → khoá dòng 1–2 Dự báo SL đóng thùng từ 23/11/2026 (migration 091); ĐGĐV có nhóm nguyên nhân lỗi (Thu hoạch / Chăm sóc vườn / Chăm sóc buồng) + tab «Tỷ lệ lỗi» (migration 094) |
| Sơ chế: Nhật ký pha phèn, Nhật ký pha thuốc phun cùi (nhóm Phiếu, 11/2026) | ✅ xong (migration 078 đã chạy 14/11/2026) |
| Báo cáo nhân công: cột Nhóm (chia nhóm chạy năng suất), in «Danh sách theo nhóm», Excel có cột Nhóm | ✅ xong (migration 084 đã chạy 17/11/2026) |
| Báo cáo nhân công: số thùng theo nhóm, năng suất nhóm (thùng/giờ-người, mục tiêu 3) và thưởng nhóm chuyền Tỉa | ✅ xong (migration 085 đã chạy 17/11/2026) — thưởng nhóm cộng thêm vào thưởng «nhóm tỉa» của Báo cáo sơ chế (chốt 18/11/2026) |
| Báo cáo nhân công: thưởng vượt thùng cho công nhân (1.000đ × hệ số chuyền × hệ số nhóm, ngưỡng 90% mục tiêu, Ki tháng), tab «Thưởng vượt tháng», Cài đặt hệ số; Báo cáo sơ chế: ngưỡng KPI Năng suất 90% | ✅ xong (migration 087 đã chạy 20/11/2026) |
| Báo cáo nhân công: chốt thưởng vượt tháng (ảnh chụp số tiền, khoá phiếu + Ki tháng đã chốt, quản trị mở chốt) và in «Bảng thưởng vượt thùng tháng» có cột ký nhận + hàng ký | ✅ xong (migration 089 đã chạy 20/11/2026) |
| Báo cáo nhân công: đổi thưởng vượt (chốt 21/11/2026) — thùng vượt lấy từ KPI «Tỷ lệ thu hồi» của Báo cáo sơ chế, chỉ khi NS sơ chế ≥ 90%; chia theo giờ công + TC × hệ số, bỏ người xuống sớm; bỏ NS nhóm / số thùng nhóm | 🔨 code xong, chờ soát trên phiếu thật |
| Báo cáo sơ chế: hệ số quy đổi cho từng phẩm cấp / loại thùng (Tổng quy đổi = số thùng × hệ số, hệ số gõ một lần rồi bấm chọn, phiếu mới tự điền theo phẩm cấp) | ✅ xong (migration 086 đã chạy 20/11/2026) |
| Báo cáo nhân công: dòng II đổi tên «QL, nhóm trưởng» (vẫn cộng vào IV), dòng V thành «Công định biên không sản xuất, chuyền kho» | ✅ xong 22/11/2026 (chỉ đổi nhãn) |
| Báo cáo sơ chế: tồn cuối ngày (mục 10) tự tính = mục 7 − 8 − 9, khoá ô, âm tô đỏ; tính lại toàn bộ phiếu cũ | ✅ xong (migration 090 đã chạy 22/11/2026) |
| Báo cáo sơ chế: quản trị cài hệ số quy đổi theo farm × phẩm cấp (⚙ Cài đặt), form phiếu tự điền | ✅ xong (migration 092 đã chạy 22/11/2026) |
| Phiếu kho Sơ chế/Phân thuốc — tab Theo hạng mục: suy giá như NXT, luân chuyển farm đi → farm đến, theo farm, hàng chưa có giá | ✅ xong (migration 082 đã chạy 17/11/2026) |
| Phiếu kho Sơ chế/Phân thuốc — tab đổi thành «Theo phẩm cấp» (phẩm cấp cố định theo danh mục hàng hoá), lọc Phẩm cấp ở Chi tiết dòng | ✅ xong (migration 088 đã chạy 20/11/2026) |
| Giám sát chất lượng: tối thiểu 50 thùng kiểm/farm/ngày mới tính % lỗi QC (dưới mức = «Chưa đạt kiểm tra» ở Báo cáo sơ chế), cột/lọc/sắp xếp «Lỗi» ở danh sách phiếu | ✅ xong (migration 081 đã chạy 17/11/2026) |

## Giai đoạn 3 — Năng lực dùng chung ✅

Thông báo trong app + Web Push ([`THONG_BAO_PUSH.md`](../THONG_BAO_PUSH.md)) · xuất Excel/CSV/PDF/Google Sheet và đồng bộ tự động ([`GOOGLE_SHEETS.md`](../GOOGLE_SHEETS.md)) · phiếu in khung chung (khổ giấy, liên, dấu chìm, QR, PDF/DOC, in hàng loạt) · lưu ảnh trên VPS (media-service, bỏ Cloudinary, 10/2026) · nhật ký thay đổi DB · thao tác hàng loạt · giao diện thẻ trên điện thoại.

## Giai đoạn 4 — Bàn giao và vận hành 🔄

| Việc | Trạng thái |
|---|---|
| Bản 1.0.0, runbook, hạn chế đã biết, ma trận phân quyền (04/10/2026) | ✅ |
| Siết bảo mật đăng nhập, vá phân quyền DB, CI | ✅ |
| Siết RLS dần theo module (sổ quỹ, phiếu kho trước) — [`HAN_CHE_DA_BIET.md`](../HAN_CHE_DA_BIET.md) #1 | ⏳ |
| Sao lưu tự động theo lịch, giám sát uptime — #7, #8 | ⏳ |
| Môi trường thử (staging) — #6 | ⏳ |
| Điền bảng bàn giao tài khoản dịch vụ ([`BAN_GIAO_TAI_KHOAN.md`](../BAN_GIAO_TAI_KHOAN.md)) | ⏳ cột đứng tên/trả phí còn trống |
| Dọn code không dùng (tính lương từ chấm công cũ, dashboard mẫu) — #13 | ⏳ |
| Cập nhật docs bàn giao + hạn chế #5 sau khi bỏ Cloudinary | ✅ |
