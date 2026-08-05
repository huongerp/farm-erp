/**
 * Auth service thay Supabase Auth.
 *
 * Việc duy nhất: xác định người dùng là ai, rồi ký một JWT mà PostgREST tin.
 * Không có endpoint nào đọc/ghi dữ liệu nghiệp vụ — phần đó frontend gọi thẳng
 * PostgREST với token do đây cấp.
 *
 * Vì sao phải là một service riêng thay vì ký JWT ngay trong Postgres: Google
 * trả ID token ký RS256, xác minh cần khoá công khai RSA của Google mà pgcrypto
 * không làm được. Chi tiết: docs/VPS_POSTGREST_PLAN.md
 *
 * Client gọi `/auth/dang-nhap`. Traefik có thể strip `/auth` (giống `/api`) hoặc
 * forward nguyên path — đăng ký cả hai để không phụ thuộc cấu hình Dokploy.
 */
import { createHash } from 'node:crypto';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { SignJWT } from 'jose';
import { OAuth2Client } from 'google-auth-library';
import { config } from './config.ts';
import {
  dangNhapGoogle,
  dangNhapMatKhau,
  dongPool,
  kiemTraKetNoi,
  lamMoiPhien,
  thuHoiPhien,
  type KetQuaDangNhap,
} from './db.ts';

const secretKey = new TextEncoder().encode(config.jwtSecret);
const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

/**
 * Claim `role` phải là tên một role thật trong Postgres — PostgREST đọc claim
 * này rồi SET ROLE. `email` là claim duy nhất mà SQL phía sau cần
 * (`auth.jwt() ->> 'email'` trong is_admin_current_user và rpc_set_mat_khau).
 */
async function kyAccessToken(email: string, nhanVienId: number): Promise<string> {
  return new SignJWT({ role: 'authenticated', email, nv: nhanVienId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${config.accessTokenTtlSeconds}s`)
    .sign(secretKey);
}

/** DB chỉ lưu SHA-256 của refresh token; token thô không bao giờ được ghi. */
function bam(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const app = new Hono();

/** Header để xác nhận request đã tới bản auth-service mới sau deploy. */
app.use('*', async (c, next) => {
  await next();
  c.header('X-Farm-Auth', '1');
});

function ip(c: { req: { header: (n: string) => string | undefined } }): string | null {
  const xff = c.req.header('x-forwarded-for');
  return xff ? (xff.split(',')[0]?.trim() ?? null) : null;
}

function userAgent(c: { req: { header: (n: string) => string | undefined } }): string | null {
  return c.req.header('user-agent') ?? null;
}

/** Đọc JSON body, trả null nếu body không phải JSON hợp lệ. */
async function docJson(c: { req: { json: () => Promise<unknown> } }): Promise<Record<string, unknown> | null> {
  try {
    const body = await c.req.json();
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function chuoi(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** Ly do → HTTP status. Frontend map tiếp sang thông báo i18n. */
const MA_LOI: Record<string, 401 | 403 | 429> = {
  sai_thong_tin: 401,
  phien_khong_hop_le: 401,
  bi_chan: 429,
  nghi_viec: 403,
  khong_co_ho_so: 403,
};

async function traVePhien(kq: Extract<KetQuaDangNhap, { ok: true }>) {
  return {
    access_token: await kyAccessToken(kq.email, kq.nhan_vien_id),
    expires_in: config.accessTokenTtlSeconds,
    refresh_token: kq.refresh_token,
    email: kq.email,
    nhan_vien_id: kq.nhan_vien_id,
    ho_va_ten: kq.ho_va_ten,
    phai_doi_mat_khau: kq.phai_doi_mat_khau,
  };
}

type Ctx = {
  req: {
    header: (n: string) => string | undefined;
    json: () => Promise<unknown>;
  };
  json: (body: unknown, status?: number) => Response;
  body: (data: null, status: 204) => Response;
};

async function xuLyKhoe(c: Ctx) {
  try {
    await kiemTraKetNoi();
    return c.json({ ok: true, service: 'farm-erp-auth' });
  } catch {
    return c.json({ ok: false, service: 'farm-erp-auth' }, 503);
  }
}

async function xuLyDangNhap(c: Ctx) {
  const body = await docJson(c);
  const email = chuoi(body?.email).trim();
  const matKhau = chuoi(body?.mat_khau);

  if (!email || !matKhau) {
    return c.json({ ly_do: 'thieu_thong_tin' }, 400);
  }

  const kq = await dangNhapMatKhau(email, matKhau, userAgent(c), ip(c));
  if (!kq.ok) return c.json({ ly_do: kq.ly_do }, MA_LOI[kq.ly_do] ?? 401);
  return c.json(await traVePhien(kq));
}

async function xuLyDangNhapGoogle(c: Ctx) {
  if (!googleClient) {
    return c.json({ ly_do: 'google_chua_cau_hinh' }, 503);
  }

  const body = await docJson(c);
  const idToken = chuoi(body?.id_token);
  if (!idToken) return c.json({ ly_do: 'thieu_thong_tin' }, 400);

  // Bước không được phép bỏ: xác minh chữ ký RS256 bằng khoá công khai Google
  // và đối chiếu `aud` với client id của mình. Thiếu bước này thì ai cũng tự
  // tạo được token ghi email bất kỳ.
  let email: string;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || payload.email_verified !== true) {
      return c.json({ ly_do: 'google_khong_hop_le' }, 401);
    }
    email = payload.email;
  } catch {
    return c.json({ ly_do: 'google_khong_hop_le' }, 401);
  }

  const kq = await dangNhapGoogle(email, userAgent(c), ip(c));
  if (!kq.ok) return c.json({ ly_do: kq.ly_do }, MA_LOI[kq.ly_do] ?? 401);
  return c.json(await traVePhien(kq));
}

async function xuLyLamMoi(c: Ctx) {
  const body = await docJson(c);
  const refreshToken = chuoi(body?.refresh_token);
  if (!refreshToken) return c.json({ ly_do: 'thieu_thong_tin' }, 400);

  const kq = await lamMoiPhien(bam(refreshToken), userAgent(c), ip(c));
  if (!kq.ok) return c.json({ ly_do: kq.ly_do }, MA_LOI[kq.ly_do] ?? 401);

  return c.json({
    access_token: await kyAccessToken(kq.email, kq.nhan_vien_id),
    expires_in: config.accessTokenTtlSeconds,
    refresh_token: kq.refresh_token,
    email: kq.email,
    nhan_vien_id: kq.nhan_vien_id,
  });
}

async function xuLyDangXuat(c: Ctx) {
  const body = await docJson(c);
  const refreshToken = chuoi(body?.refresh_token);
  // Đăng xuất luôn thành công dưới góc nhìn client: token rác cũng coi như xong.
  if (refreshToken) await thuHoiPhien(bam(refreshToken));
  return c.body(null, 204);
}

/** Đăng ký cùng handler cho path đã strip (`/dang-nhap`) và path đầy đủ (`/auth/dang-nhap`). */
function dangKy(prefix: '' | '/auth') {
  app.get(`${prefix}/khoe`, (c) => xuLyKhoe(c));
  app.post(`${prefix}/dang-nhap`, (c) => xuLyDangNhap(c));
  app.post(`${prefix}/dang-nhap-google`, (c) => xuLyDangNhapGoogle(c));
  app.post(`${prefix}/lam-moi`, (c) => xuLyLamMoi(c));
  app.post(`${prefix}/dang-xuat`, (c) => xuLyDangXuat(c));
}

dangKy('');
dangKy('/auth');

app.onError((err, c) => {
  // Không trả chi tiết lỗi DB ra ngoài.
  console.error('[auth] lỗi không lường trước:', err);
  return c.json({ ly_do: 'loi_he_thong' }, 500);
});

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`[auth] đang nghe cổng ${info.port}`);
  if (!googleClient) {
    console.warn('[auth] GOOGLE_CLIENT_ID rỗng — đăng nhập Google bị tắt.');
  }
});

for (const tin_hieu of ['SIGTERM', 'SIGINT'] as const) {
  process.on(tin_hieu, () => {
    server.close(() => {
      void dongPool().finally(() => process.exit(0));
    });
  });
}
