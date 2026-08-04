# Quy ước giao diện (UI Conventions)

Tài liệu này ghi lại các quy ước dùng chung cho toàn app, để màn hình mới không lệch chuẩn và
code review có căn cứ đối chiếu. Được tham chiếu từ [README.md](../README.md) và
[`components/shared/Section.tsx`](../components/shared/Section.tsx).

## 1. Thang cỡ chữ

Cỡ chữ toàn app dùng token định nghĩa trong `index.css` (`@theme`), **không** dùng giá trị px cứng
kiểu `text-[13px]` — vì các token này co giãn theo nút Nhỏ/Vừa/Lớn trong Cài đặt
(`html[data-text-size]`), còn giá trị cứng thì không.

| Vai trò | Token | px | Dùng ở |
|---|---|---|---|
| Nhãn (form label, detail label, table header) | `text-xs` | 12 | `Input`, `Select`, `Combobox`, cột header bảng |
| Giá trị dữ liệu (input, detail value, ô bảng) | `text-body-sm` | 13 | control trong form, `GenericTable`, detail value |
| Chữ phụ, badge nhỏ, chú thích | `text-caption` | 11 | timestamp, ghi chú phụ, sub-label |
| Số liệu rất nhỏ trong thẻ thống kê | `text-2xs` | 10 | badge đếm số (`+N`), chỉ số nhỏ trong card KPI |
| Tiêu đề mục / drawer | `text-sm` / `text-base` | 14 / 16 | tiêu đề Section, tiêu đề drawer |

**Chuẩn form/detail:** form và detail dùng cùng một thang chữ (label 12px, giá trị 13px) — form
**không** to hơn detail. Đây là quyết định đã chốt: giảm form xuống bằng detail, không phải nới
detail lên bằng form.

**Ngoại lệ – nội dung in ấn:** các file `*PreviewContent.tsx` (nội dung phiếu in PDF/Word) dùng đơn
vị `pt` (`text-[10pt]`, `text-[11pt]`, …) vì đó là đơn vị đúng cho in ấn trên trang A4, không co
giãn theo cỡ chữ màn hình. **Không** đổi các chỗ này sang token `text-*`.

## 2. Border radius

- Input, select, button, card nội dung: `rounded-lg`.
- Dialog/Drawer footer, badge nhỏ: `rounded-md`.
- Tránh trộn `rounded-lg` và `rounded-xl` cho cùng một loại control trong cùng một màn.

## 3. Chiều cao control

| Loại | Chiều cao | Ghi chú |
|---|---|---|
| Input/Select/nút chuẩn | `h-10` (40px) | mặc định `components/ui/*` |
| Nút "Thêm" ở list, nút footer form/detail | `h-9` (36px, `size="sm"`) | khớp toolbar |
| Filter chip (ngày, multi-select) | `h-8` (32px) | khớp `DateRangePicker`, `GenericToolbar` |

Footer của form/detail **phải** cùng chiều cao với nút "Thêm" ở list (36px) — không dùng chiều cao
mặc định 40px của `Button`.

## 4. Màu badge trạng thái

Dùng `lib/status-badge.ts` (`getStatusBadgeClass`) cho badge trạng thái mới — không tự pha màu
Tailwind trực tiếp trong component. Xem chi tiết bảng màu theo semantic trong file đó.

## 5. Dialog/Drawer

- Đóng bằng Escape/backdrop/nút X đều phải đi qua `requestClose` (kiểm tra `isDirty` trước khi
  đóng) nếu form có khả năng còn dữ liệu chưa lưu — không gọi `onClose` trực tiếp.
- Chỉ overlay đang ở trên cùng (theo `lib/overlay-stack.ts`) mới được đóng bằng Escape.

## 6. Section

`components/shared/Section.tsx`: tiêu đề section luôn màu `primary` (variant mặc định `'primary'`),
cỡ chữ tiêu đề dùng `text-caption sm:text-xs` — không hardcode `text-[11px]`.
