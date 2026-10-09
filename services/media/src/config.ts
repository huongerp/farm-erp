/**
 * Đọc và kiểm biến môi trường một lần lúc khởi động, cùng cách auth/notify/sheets làm:
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

export const config = {
  jwtSecret,
  /** Thư mục gắn volume `media-data` (docker-compose.yml). */
  thuMucKho: process.env.MEDIA_DIR ?? '/data/media',
  /** Giới hạn ảnh gốc gửi lên (MB) — ảnh điện thoại chưa nén thường 3–8 MB. */
  toiDaMb: Number(process.env.MEDIA_MAX_MB ?? 15),
  port: Number(process.env.PORT ?? 3004),
};
