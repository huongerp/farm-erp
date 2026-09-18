/**
 * Đọc và kiểm biến môi trường một lần lúc khởi động, cùng cách auth-service làm:
 * thiếu biến thì chết ngay thay vì chạy được rồi hỏng ở request đầu tiên.
 */

function batBuoc(ten: string): string {
  const v = process.env[ten];
  if (!v) throw new Error(`Thiếu biến môi trường ${ten}.`);
  return v;
}

/** Phải khớp PGRST_JWT_SECRET và JWT_SECRET của auth-service, nếu không token người dùng bị từ chối. */
const jwtSecret = batBuoc('JWT_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET phải dài tối thiểu 32 ký tự (yêu cầu của PostgREST với HS256).');
}

/**
 * Khoá VAPID sinh một lần bằng `npx web-push generate-vapid-keys`. Thiếu khoá thì
 * service vẫn chạy và vẫn ghi thông báo vào chuông — chỉ phần đẩy ra màn hình
 * khoá là tắt. Như vậy quên cấu hình khoá không làm sập cả tính năng.
 */
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';

export const config = {
  /** Chuỗi kết nối bằng role `notify_service` — chỉ chạm được 4 bảng thông báo. */
  databaseUrl: batBuoc('DATABASE_URL'),
  jwtSecret,
  vapidPublicKey,
  vapidPrivateKey,
  /** mailto: hoặc URL liên hệ, bắt buộc theo chuẩn Web Push. */
  vapidSubject: process.env.VAPID_SUBJECT ?? 'mailto:admin@forpeasantz.vn',
  pushBat: vapidPublicKey !== '' && vapidPrivateKey !== '',
  /** Múi giờ công ty, dùng để tính giờ yên lặng. */
  muiGio: process.env.COMPANY_TZ ?? 'Asia/Ho_Chi_Minh',
  port: Number(process.env.PORT ?? 3002),
  /** Lưới an toàn khi kết nối LISTEN đứt mà không ai biết. */
  chuKyQuetMs: Number(process.env.NOTIFY_SCAN_INTERVAL_MS ?? 30_000),
  /** Bỏ qua sự kiện sau ngần này lần thất bại để không kẹt hàng đợi. */
  soLanThuToiDa: Number(process.env.NOTIFY_MAX_RETRY ?? 5),
} as const;
