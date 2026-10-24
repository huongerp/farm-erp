---
paths:
  - "components/shared/phieu-in/**"
  - "lib/phieu-in/**"
---

# Trang in phiếu

_Tách từ mục «Lưu ý khi sửa» của CLAUDE.md gốc — tự nạp khi đọc/sửa file khớp `paths`. Đường dẫn trong file tính từ gốc repo._

- Trang in phiếu: MỌI trang preview dùng `components/shared/phieu-in/PhieuInPage` (`mauKey` + `macDinh` khổ/hướng/lề).
  Khung lo lề, `@page`, cỡ chữ (zoom), phông, kéo cột mọi `<table>` (bỏ qua `data-in-co-dinh`), PDF/DOC chụp từ
  bản xem trước; cài đặt nhớ theo mẫu ở `lib/phieu-in/`. Nội dung phiếu KHÔNG đặt width/padding cứng, không thêm
  khối `@media print` riêng, không viết lại HTML chuỗi để xuất PDF.
- Băng hình «cây chuối + fp ForPeasantz» (`public/phieu-in/bang-hinh-fp.png`, helper `lib/phieu-in/bang-hinh.ts`)
  nằm TRÊN dòng công ty ở mọi đầu phiếu: `DauPhieu` tự có; phiếu tự dựng đầu đặt `<BangHinhPhieuIn />`; template HTML
  chuỗi dùng `bangHinhHtml()`; Excel có dòng tên công ty ghi bằng `ghiXlsxCoBangHinh(XLSX, wb, tenFile)`
  (`lib/export/xlsx-bang-hinh.ts`) thay `XLSX.writeFile`. Thêm phiếu/xuất mới có đầu công ty thì gắn theo.
