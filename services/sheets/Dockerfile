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
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# Không chạy bằng root.
USER node
EXPOSE 3003
CMD ["node", "dist/index.js"]
