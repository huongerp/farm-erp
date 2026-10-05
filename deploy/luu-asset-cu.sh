#!/bin/sh
# Kho asset cũ — "skew protection" kiểu Vercel/Netlify cho nginx tự host.
#
# Mỗi lần deploy, image mới chỉ chứa chunk JS/CSS của bản mới. Tab mở từ trước vẫn chạy bundle
# cũ, cần tải một chunk lazy (hash cũ) là 404 → trước đây phải hiện toast bắt tải lại trang.
# Script này chép chunk của bản đang chạy vào một volume bền qua các lần deploy; nginx tra
# thư mục của image trước, hụt mới tra kho (xem deploy/nginx.conf, location @asset_cu). Tab cũ
# vẫn chạy trơn, rồi Service Worker tự chuyển sang bản mới vào lúc an toàn.
#
# Image nginx tự chạy mọi script trong /docker-entrypoint.d/ trước khi bật nginx, và DỪNG
# container nếu script lỗi — nên ở đây cố ý không `set -e`, lệnh nào hụt cũng bỏ qua: thiếu
# volume chỉ mất khả năng phục vụ tab cũ, không được làm sập web.

KHO=/var/cache/farm-assets/assets
GIU_NGAY="${GIU_ASSET_CU_NGAY:-30}"

mkdir -p "$KHO" 2>/dev/null || exit 0

# Chép đè: file trùng tên (chunk không đổi giữa hai bản) được làm mới mtime, nên đợt dọn bên
# dưới không xoá nhầm chunk vẫn đang dùng.
cp -rf /usr/share/nginx/html/assets/. "$KHO"/ 2>/dev/null || true

# Dọn chunk của các bản quá cũ để kho không phình (~9 MB mỗi bản). Tab treo lâu hơn mức này
# thì đã được Service Worker đưa lên bản mới từ lâu.
find "$KHO" -type f -mtime +"$GIU_NGAY" -delete 2>/dev/null || true

exit 0
