# Roadmap

Cập nhật lần cuối: 14/11/2026

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
| Nhóm Checklist & bảo trì, Đánh giá đầu vào, Đăng ký tham quan farm (thêm 10–11/2026) | 🔄 còn được bổ sung theo yêu cầu khách — đã có phiếu vệ sinh tuần (lưới T2–CN, migration 080) |
| Sơ chế: Nhật ký pha phèn, Nhật ký pha thuốc phun cùi (nhóm Phiếu, 11/2026) | 🔄 xong code, chờ chạy migration 078 |

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
