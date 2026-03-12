# Tạo Upload Preset (Unsigned) trên Cloudinary

Khi gặp lỗi **"Upload preset not found"**, cần tạo đúng preset trong Cloudinary và khớp tên với file `.env`.

## Bước 1: Vào Cloudinary Dashboard

1. Đăng nhập https://console.cloudinary.com
2. Chọn đám mây **fp-farm** (cloud name: `dnfp1rcce`)

## Bước 2: Mở Upload settings

1. Bấm **Settings** (icon bánh răng) góc trên phải
2. Chọn tab **Upload**

## Bước 3: Tạo hoặc kiểm tra Upload preset

1. Kéo xuống mục **Upload presets**
2. Bấm **Add upload preset**
3. Điền:
   - **Preset name:** gõ chính xác `fp-farm` (chữ thường, gạch ngang; phải trùng với tên trong Dashboard)
   - **Signing Mode:** chọn **Unsigned**
   - Các mục khác để mặc định
4. Bấm **Save**

## Bước 4: Khớp với file `.env`

Trong `.env` phải có dòng:

```env
VITE_CLOUDINARY_UPLOAD_PRESET=fp-farm
```

Tên sau dấu `=` **phải giống hệt** Preset name trong Dashboard (phân biệt hoa/thường).

Nếu bạn đặt tên preset khác (ví dụ `FarmERP`), thì trong `.env` ghi:

```env
VITE_CLOUDINARY_UPLOAD_PRESET=FarmERP
```

## Bước 5: Restart app

Sau khi sửa `.env`, tắt và chạy lại:

```bash
npm run dev
```

Rồi thử tải ảnh lại.

## Nếu vẫn lỗi

- Kiểm tra lại đang đăng nhập đúng tài khoản/cloud (dnfp1rcce).
- Trong **Settings → Upload → Upload presets**, xem cột "Name" và copy đúng tên đó vào `VITE_CLOUDINARY_UPLOAD_PRESET`.
