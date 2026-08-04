# SPA Vite → nginx tĩnh. Không có API nào ở đây: /api và /auth do Traefik
# route sang service khác (xem docker-compose.yml).

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite nhúng biến vào bundle lúc build nên phải nhận qua ARG.
# URL của API không cần khai: frontend gọi đường dẫn tương đối /api và /auth.
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET
ARG VITE_SENTRY_DSN
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME \
    VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN

RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
