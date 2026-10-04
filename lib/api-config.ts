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
export const NOTIFY_URL = import.meta.env.VITE_NOTIFY_URL ?? '/notify';
export const SHEETS_URL = import.meta.env.VITE_SHEETS_URL ?? '/sheets';

/**
 * Google Picker (chọn file Sheet có sẵn). Thiếu một trong hai thì dialog Xuất chỉ
 * cho "Tạo file mới" — với scope drive.file app không mở được file chưa qua Picker.
 */
export const GOOGLE_PICKER_API_KEY = import.meta.env.VITE_GOOGLE_PICKER_API_KEY ?? '';
export const GOOGLE_APP_ID = import.meta.env.VITE_GOOGLE_APP_ID ?? '';

/** Rỗng thì trang đăng nhập ẩn luôn nút Google. */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

/**
 * Khoá công khai VAPID cho Web Push. Rỗng thì trang cài đặt ẩn công tắc push và
 * chuông trong app vẫn chạy bình thường — thiếu cấu hình không được làm hỏng
 * phần còn lại của tính năng.
 */
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';
