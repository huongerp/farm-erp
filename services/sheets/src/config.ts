/**
 * Đọc và kiểm biến môi trường một lần lúc khởi động, cùng cách auth/notify làm:
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

/** 32 byte hex (`openssl rand -hex 32`). Đổi khoá = mọi người phải kết nối Google lại. */
const tokenKeyHex = batBuoc('SHEETS_TOKEN_KEY');
if (!/^[0-9a-fA-F]{64}$/.test(tokenKeyHex)) {
  throw new Error('SHEETS_TOKEN_KEY phải là 64 ký tự hex (sinh bằng: openssl rand -hex 32).');
}

export const config = {
  /** Chuỗi kết nối bằng role `sheets_service` — chỉ chạm bảng của service này. */
  databaseUrl: batBuoc('DATABASE_URL'),
  jwtSecret,
  tokenKey: Buffer.from(tokenKeyHex, 'hex'),
  googleClientId: batBuoc('GOOGLE_OAUTH_CLIENT_ID'),
  googleClientSecret: batBuoc('GOOGLE_OAUTH_CLIENT_SECRET'),
  /**
   * `https://<APP_DOMAIN>/sheets/google/callback`. Để trống thì suy từ request đầu
   * (tiện cho dev localhost) — production nên đặt cứng để khớp đúng URI đã khai với Google.
   */
  googleRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? '',
  /** PostgREST nội bộ — worker đọc dữ liệu nguồn bằng JWT của người tạo lịch (giai đoạn 3). */
  postgrestUrl: process.env.POSTGREST_URL ?? 'http://postgrest:3000',
  /** Chỉ production bật: dev và prod dùng chung DB, hai worker sẽ ghi đè nhau. */
  workerBat: process.env.SHEETS_WORKER_BAT === 'true',
  muiGio: process.env.COMPANY_TZ ?? 'Asia/Ho_Chi_Minh',
  port: Number(process.env.PORT ?? 3003),
} as const;
