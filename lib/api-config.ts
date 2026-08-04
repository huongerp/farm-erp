/**
 * Địa chỉ hai service self-host. Mặc định là đường dẫn TƯƠNG ĐỐI vì cả ba
 * thành phần (SPA, PostgREST, auth-service) chạy sau cùng một domain qua Traefik
 * — nhờ vậy không có CORS và đổi domain không phải build lại bundle.
 *
 * Chỉ khai biến môi trường khi cần trỏ ra ngoài (vd chạy `vite preview` đối
 * với API trên VPS). Lúc `npm run dev`, proxy trong vite.config.ts lo phần này.
 */
export const API_URL = import.meta.env.VITE_API_URL ?? '/api';
export const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? '/auth';

/** Rỗng thì trang đăng nhập ẩn luôn nút Google. */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
