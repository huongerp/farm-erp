/**
 * Đọc và kiểm biến môi trường một lần lúc khởi động. Thiếu biến thì chết ngay
 * thay vì chạy được rồi 500 ở request đầu tiên.
 */

function batBuoc(ten: string): string {
  const v = process.env[ten];
  if (!v) throw new Error(`Thiếu biến môi trường ${ten}.`);
  return v;
}

/** JWT ký bằng secret này phải khớp PGRST_JWT_SECRET của PostgREST, nếu không mọi request dữ liệu đều 401. */
const jwtSecret = batBuoc('JWT_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET phải dài tối thiểu 32 ký tự (yêu cầu của PostgREST với HS256).');
}

export const config = {
  /** Chuỗi kết nối bằng role `auth_service` — chỉ EXECUTE được mấy RPC đăng nhập. */
  databaseUrl: batBuoc('DATABASE_URL'),
  jwtSecret,
  /** Rỗng thì tắt đăng nhập Google thay vì chấp nhận token không kiểm được `aud`. */
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900),
  port: Number(process.env.PORT ?? 3001),
} as const;
