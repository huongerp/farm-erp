---
paths:
  - "components/shared/phieu-in/**"
  - "lib/phieu-in/**"
  - "features/**/*PreviewPage.tsx"
  - "features/**/in-hang-loat.ts*"
---

# Trang in phiếu

_Tách từ mục «Lưu ý khi sửa» của CLAUDE.md gốc — tự nạp khi đọc/sửa file khớp `paths`. Đường dẫn trong file tính từ gốc repo._

## Khung `PhieuInPage` (components/shared/phieu-in/)

MỌI trang preview dùng `PhieuInPage` (`mauKey` + `macDinh`). Mẫu chỉ đưa nội dung MỘT liên; khung lo:
- **chia trang thật bằng paged.js** (`XemTruocChiaTrang.tsx`): nội dung render vào vùng nguồn ẩn, bản sao
  được chuẩn bị bảng (`lib/phieu-in/luoi-bang.ts`) rồi dựng thành `.pagedjs_page`; cùng DOM đó để xem, in, PDF;
- cài đặt in lưu trên MÁY theo `mauKey` (localStorage `phieu-in-cai-dat`, chỉ phần khác mặc định —
  `lib/phieu-in/cai-dat-in.ts` + `use-cai-dat-in-store.ts`): khổ A5/A4/A3, hướng, lề từng cạnh (khoá «lề đều»;
  `macDinh.leMm` / bản lưu cũ `leMm` = lề đều), phông, cỡ chữ (tỉ lệ), độ rộng + ẩn cột, đầu/chân trang
  («Trang x/y», giờ in, người in = margin box `@page`), lặp tiêu đề bảng, logo / ô ký, số liên 1–3, QR.
  KHÔNG có mặc định chung trong DB;
- thanh công cụ: zoom (vừa khung/100%/±), «Trang x/y» + nhảy trang, in theo khoảng trang («2-3,5»:
  in ẩn trang ngoài khoảng bằng CSS, PDF chỉ chụp trang trong khoảng);
- PDF chụp TỪNG `.pagedjs_page` (`lib/phieu-in/xuat-phieu.ts` `taiPdfTuTrang`), DOC từ vùng nguồn;
- dấu chìm: prop `dauChim` — trang truyền `useDauChim(trang_thai…)` (`use-dau-chim.ts`, luật ở
  `lib/phieu-in/dau-chim.ts`); bản chính thức → null;
- QR xác thực góc trang 1 (nằm gọn trong lề trên): prop `duongDanGoc` (route preview; phiếu hành chính dùng deep link `?phieu=`);
- nhiều liên: `nhanLien`, dòng «Liên k: …» = `<DongLien />` (KhungPhieu tự có);
- logo công ty đổi sang DATA URL trước khi dựng (`lib/phieu-in/logo-in.ts` → media-service `GET /media/logo`,
  chỉ nhận URL logo đang lưu ở `fp_var_tt_cong_ty`); mẫu lấy logo qua `usePhieuIn().logo`, KHÔNG đọc
  `companyInfo.appLogo` trực tiếp.

## Quy ước nội dung mẫu
- Không đặt width/height/padding/min-height theo khổ giấy, không `@page`, không khối `@media print` riêng,
  không viết lại HTML chuỗi để xuất PDF.
- Logo gắn `data-in-logo`; khối chữ ký `data-in-chu-ky` (`HangKyTen` đã có). Bảng bố cục / bảng không cho
  kéo-ẩn cột gắn `data-in-co-dinh`. Bảng có `<thead>` một hàng không gộp ô thì ẩn cột được.
- paged.js nhận HTML chuỗi: event handler trong nội dung MẤT — nút bấm đặt ở `toolbarExtra`.
- Ngắt trang chỉ theo CSS đưa paged.js (`lib/phieu-in/css-trang.ts`): Tailwind `break-inside-avoid` đã khai lại;
  khối khác không được tách thì gắn class `break-inside-avoid`.

## In hàng loạt
Route `/in-hang-loat?mau=<mauKey>&ids=…` (`TrangInHangLoat.tsx`). Thêm mẫu: file `in-hang-loat.ts` trong module
(default `MauInHangLoat`, CÙNG `mauKey`/`macDinh`/component nội dung với trang đơn lẻ) + một dòng ở
`DANH_MUC_IN_HANG_LOAT` (`in-hang-loat.ts`) + `<NutInHangLoat mau ids />` ở slot `bulkActions` của toolbar.

## Bẫy paged.js đã trả giá (đừng lặp lại)
- KHÔNG phóng cỡ chữ bằng CSS `zoom` (đo lệch, trang trống thừa) — `nhanCoChu` nhân font-size/line-height
  đã tính vào bản sao. Zoom XEM chỉ đặt trên `.phieu-in-dich` sau khi dàn, bỏ khi chụp PDF / in.
- KHÔNG đưa `@import` (font Google) vào stylesheet cho paged.js (không dựng ra trang nào).
- paged.js chỉ giữ nguyên dòng bảng khi Ô (td/th) có `break-inside: avoid`; đặt ở `tr` thôi vẫn bị cắt đôi.
- paged.js coi mọi phần tử có `style` inline là «undisplayed» → `break-before` qua CSS bị bỏ qua; ngắt giữa
  các liên / chứng từ gắn thẳng `data-break-before="page"`.
- Bảng đánh số `data-in-bang` THEO TỪNG LIÊN / CHỨNG TỪ; ẩn cột theo `data-in-o` (vị trí cột thật, tính
  rowSpan/colSpan), không `nth-child` trên ô.
- Gom đổi liên tiếp (~200 ms) trước khi dàn; chờ logo xong mới dàn (tránh dàn 2 lần).
- paged.js dùng requestAnimationFrame: tab/pane ẩn thì dàn trang treo — soi bằng trình duyệt phải để pane hiện
  (hoặc chụp màn hình để "bơm" khung hình).

## Băng hình đầu phiếu
Băng hình «HTX NN Công Nghệ Cao fp - ForPeasantz» (`public/phieu-in/bang-hinh-fp-2.png`, helper `lib/phieu-in/bang-hinh.ts`)
nằm TRÊN dòng công ty ở mọi đầu phiếu: `DauPhieu` tự có; phiếu tự dựng đầu đặt `<BangHinhPhieuIn />`; template HTML
chuỗi dùng `bangHinhHtml()`; Excel có dòng tên công ty ghi bằng `ghiXlsxCoBangHinh(XLSX, wb, tenFile)`
(`lib/export/xlsx-bang-hinh.ts`) thay `XLSX.writeFile`. Thêm phiếu/xuất mới có đầu công ty thì gắn theo.
