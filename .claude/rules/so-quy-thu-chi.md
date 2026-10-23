---
paths:
  - "features/tai-chinh/**"
---

# Sổ quỹ (thu chi quỹ) — trạng thái duyệt

_Tách từ mục «Lưu ý khi sửa» của CLAUDE.md gốc — tự nạp khi đọc/sửa file khớp `paths`. Đường dẫn trong file tính từ gốc repo._

- Sổ quỹ (`features/tai-chinh/thu-chi-quy`) có trạng thái duyệt: `cho_duyet` / `da_duyet` / `khong_duyet`
  (migration 036). Luật thuần ở `core/trang-thai.ts` (có test), cổng theo người dùng ở
  `hooks/use-thu-chi-quy-permissions.ts`; DB chặn lại bằng trigger `fn_tc_quy_khoa_duyet`. Duyệt / không duyệt
  chỉ dành cho `cap_bac = 1` / quản trị; phiếu đã xét phải chặn cả ở `ThuChiLienQuanSection` (bảng nhúng
  trong drawer của 3 module khác, KHÔNG đọc được ModulePermissionGuard của quỹ). Phiếu `khong_duyet` KHÔNG
  tính vào tồn quỹ / số dư / thống kê — view `v_tc_quy_*` và `rpc_tc_quy_thu_chi_stats` lọc cùng luật `tinhVaoTonQuy`.
