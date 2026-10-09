FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# Thư mục gắn volume `media-data`: tạo sẵn và giao cho user node — volume mới tạo sẽ
# chép quyền sở hữu này ở lần mount đầu tiên.
RUN mkdir -p /data/media && chown node:node /data/media

# Không chạy bằng root.
USER node
EXPOSE 3004
CMD ["node", "dist/index.js"]
