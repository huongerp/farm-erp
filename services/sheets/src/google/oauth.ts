/**
 * OAuth 2.0 (authorization code) cho từng nhân viên — chỉ xin `openid email drive.file`.
 *
 * `drive.file` là scope KHÔNG nhạy cảm: app publish In production mà không phải
 * chờ Google xác minh, kể cả người dùng Gmail cá nhân. Đổi lại app chỉ đụng được
 * file do chính app tạo hoặc file người dùng chọn qua Google Picker.
 */
import { createHmac } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';
import { config } from '../config.ts';
import { goiGoogle, GoogleLoi } from './goi-google.ts';

export const SCOPE_DRIVE_FILE = 'https://www.googleapis.com/auth/drive.file';
const SCOPES = ['openid', 'email', SCOPE_DRIVE_FILE];

/**
 * Khoá ký `state` TÁCH khỏi JWT_SECRET: state đi qua URL của Google, nếu ký bằng
 * đúng JWT_SECRET thì về lý thuyết PostgREST cũng chấp nhận nó như một token.
 */
const khoaState = createHmac('sha256', config.jwtSecret).update('sheets-oauth-state').digest();

export interface NoiDungState {
  nv: number;
  /** Mở bằng popup → callback trả trang postMessage rồi tự đóng; không thì redirect. */
  popup: boolean;
  /** Origin của app lúc bắt đầu — để callback biết trả kết quả về đâu. */
  origin: string;
}

export async function kyState(s: NoiDungState): Promise<string> {
  return new SignJWT({ nv: s.nv, p: s.popup ? 1 : 0, o: s.origin })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .setAudience('sheets-oauth-state')
    .sign(khoaState);
}

export async function docState(token: string): Promise<NoiDungState | null> {
  try {
    const { payload } = await jwtVerify(token, khoaState, { audience: 'sheets-oauth-state' });
    const nv = Number(payload['nv']);
    const origin = String(payload['o'] ?? '');
    if (!Number.isFinite(nv) || nv <= 0 || !/^https?:\/\//.test(origin)) return null;
    return { nv, popup: payload['p'] === 1, origin };
  } catch {
    return null;
  }
}

export function redirectUri(origin: string): string {
  return config.googleRedirectUri || `${origin}/sheets/google/callback`;
}

export function urlDongY(state: string, origin: string): string {
  const q = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: redirectUri(origin),
    response_type: 'code',
    scope: SCOPES.join(' '),
    // offline + consent: Google mới trả refresh_token (cần cho đồng bộ nền).
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
}

interface PhanHoiToken {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export interface KetQuaDoiMa {
  accessToken: string;
  hetHan: Date;
  refreshToken: string | null;
  email: string;
  scopes: string[];
}

/** Payload id_token — lấy thẳng từ endpoint token của Google qua TLS nên không cần verify chữ ký. */
function emailTuIdToken(idToken: string | undefined): string {
  if (!idToken) return '';
  try {
    const part = idToken.split('.')[1] ?? '';
    const json = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as { email?: string };
    return json.email ?? '';
  } catch {
    return '';
  }
}

export async function doiMa(code: string, origin: string): Promise<KetQuaDoiMa> {
  const t = await goiGoogle<PhanHoiToken>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    idempotent: false,
    form: {
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: redirectUri(origin),
      grant_type: 'authorization_code',
    },
  });
  return {
    accessToken: t.access_token,
    hetHan: new Date(Date.now() + t.expires_in * 1000),
    refreshToken: t.refresh_token ?? null,
    email: emailTuIdToken(t.id_token),
    scopes: (t.scope ?? '').split(' ').filter(Boolean),
  };
}

/** Refresh token bị thu hồi / hết hạn — phải kết nối lại. */
export class KetNoiHongLoi extends Error {}

export async function lamMoiAccessToken(refreshToken: string): Promise<{ accessToken: string; hetHan: Date }> {
  try {
    const t = await goiGoogle<PhanHoiToken>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      idempotent: true,
      form: {
        refresh_token: refreshToken,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        grant_type: 'refresh_token',
      },
    });
    return { accessToken: t.access_token, hetHan: new Date(Date.now() + t.expires_in * 1000) };
  } catch (e) {
    if (e instanceof GoogleLoi && e.lyDo === 'invalid_grant') {
      throw new KetNoiHongLoi('Kết nối Google đã hết hiệu lực — hãy kết nối lại.');
    }
    throw e;
  }
}

/** Thu hồi ở phía Google khi người dùng bấm Ngắt kết nối. Lỗi thì bỏ qua — xoá DB vẫn tiếp. */
export async function thuHoi(token: string): Promise<void> {
  try {
    await goiGoogle('https://oauth2.googleapis.com/revoke', { method: 'POST', idempotent: true, form: { token } });
  } catch {
    /* token đã chết sẵn cũng được */
  }
}
