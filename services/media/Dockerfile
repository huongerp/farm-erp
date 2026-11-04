FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# TypeScript 7 là binary native nằm ở gói optional `@typescript/typescript-<os>-<cpu>`. npm ci bỏ qua
# IM LẶNG nếu tải gói optional lỗi (mạng chập khi nhiều image build song song) → layer cache hỏng,
# `tsc` chết ở bước build. Kiểm tra `tsc -v` ngay trong layer này, lỗi thì xoá cache npm cài lại.
RUN npm ci && (npx tsc -v || (rm -rf node_modules && npm cache clean --force && npm ci && npx tsc -v))
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
# sharp cần 2 gói optional native `@img/sharp-linuxmusl-<cpu>` + `@img/sharp-libvips-linuxmusl-<cpu>`.
# npm ci cũng bỏ qua IM LẶNG khi tải hụt một gói (đã gặp: thiếu libvips → container crash loop,
# Traefik đẩy /media sang web → upload ảnh 405). Nạp thử sharp ngay tại đây, lỗi thì cài lại;
# vẫn lỗi thì build fail chứ không đẩy image hỏng lên.
RUN npm ci --omit=dev \
  && (node -e "require('sharp')" \
    || (rm -rf node_modules && npm cache clean --force && npm ci --omit=dev && node -e "require('sharp')")) \
  && npm cache clean --force
COPY --from=build /app/dist ./dist

# Thư mục gắn volume `media-data`: tạo sẵn và giao cho user node — volume mới tạo sẽ
# chép quyền sở hữu này ở lần mount đầu tiên.
RUN mkdir -p /data/media && chown node:node /data/media

# Không chạy bằng root.
USER node
EXPOSE 3004
CMD ["node", "dist/index.js"]
