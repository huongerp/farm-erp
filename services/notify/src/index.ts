/**
 * Service thông báo: HTTP cho việc đăng ký push + worker xử lý outbox.
 *
 * Gộp hai vai vào một process vì cả hai đều nhỏ và dùng chung pool. Traefik đưa
 * mọi đường dẫn /notify/* về đây (xem docker-compose.yml).
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { jwtVerify } from 'jose';
import { config } from './config.ts';
import * as db from './db.ts';
import { khoiDongWorker } from './worker.ts';
import { doanTenThietBi } from './ten-thiet-bi.ts';
import { guiToiTatCaThietBi } from './push.ts';

const secretKey = new TextEncoder().encode(config.jwtSecret);
const app = new Hono();

/**
 * Lấy nhân viên từ access token. Cùng secret HS256 với auth-service và PostgREST
 * nên không phải phát hành thêm loại token nào.
 */
async function nhanVienTuHeader(header: string | undefined): Promise<number | null> {
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(header.slice(7), secretKey);
    const nv = payload['nv'];
    const id = typeof nv === 'number' ? nv : Number(nv);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

app.get('/khoe', async (c) => {
  try {
    await db.kiemTraKetNoi();
    return c.json({ ok: true, push: config.pushBat });
  } catch {
    return c.json({ ok: false }, 503);
  }
});

/**
 * Khoá công khai VAPID cho trình duyệt đăng ký. Không bí mật — nó nằm sẵn trong
 * mọi subscription phía client.
 */
app.get('/vapid-public-key', (c) =>
  c.json({ publicKey: config.pushBat ? config.vapidPublicKey : null, enabled: config.pushBat })
);

app.post('/subscribe', async (c) => {
  const nhanVienId = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nhanVienId === null) return c.json({ loi: 'khong_xac_thuc' }, 401);

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ loi: 'body_khong_hop_le' }, 400);
  }

  const endpoint = body.endpoint;
  const p256dh = body.keys?.p256dh;
  const authKey = body.keys?.auth;
  if (!endpoint || !p256dh || !authKey) return c.json({ loi: 'thieu_thong_tin_dang_ky' }, 400);

  const userAgent = c.req.header('User-Agent') ?? null;
  await db.luuSubscription({
    nhanVienId,
    endpoint,
    p256dh,
    authKey,
    userAgent,
    tenThietBi: doanTenThietBi(userAgent),
  });

  return c.json({ ok: true });
});

app.post('/unsubscribe', async (c) => {
  const nhanVienId = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nhanVienId === null) return c.json({ loi: 'khong_xac_thuc' }, 401);

  let body: { endpoint?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ loi: 'body_khong_hop_le' }, 400);
  }
  if (!body.endpoint) return c.json({ loi: 'thieu_endpoint' }, 400);

  // Chỉ xoá được endpoint của chính mình: đọc danh sách của người gọi rồi mới xoá.
  const cua = await db.laySubscription(nhanVienId);
  if (!cua.some((s) => s.endpoint === body.endpoint)) return c.json({ ok: true });

  await db.xoaSubscriptionTheoEndpoint(body.endpoint);
  return c.json({ ok: true });
});

/** Gửi thử cho chính mình — nút "Gửi thử" trong trang cài đặt. */
app.post('/test', async (c) => {
  const nhanVienId = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nhanVienId === null) return c.json({ loi: 'khong_xac_thuc' }, 401);
  if (!config.pushBat) return c.json({ loi: 'push_chua_cau_hinh' }, 503);

  const ds = await db.laySubscription(nhanVienId);
  if (ds.length === 0) return c.json({ loi: 'chua_dang_ky_thiet_bi' }, 400);

  const soThanhCong = await guiToiTatCaThietBi(ds, {
    tieuDe: 'Thông báo thử',
    noiDung: 'Nếu bạn thấy tin này thì thông báo đẩy đang hoạt động.',
    link: '/thong-bao',
    tag: 'thong-bao-thu',
    muc: 'cao',
  });

  return c.json({ ok: soThanhCong > 0, soThietBi: ds.length, soThanhCong });
});

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`[notify] nghe trên cổng ${info.port}${config.pushBat ? '' : ' (push tắt: thiếu khoá VAPID)'}`);
});

const dungWorker = await khoiDongWorker();

async function tatDep(tinHieu: string): Promise<void> {
  console.log(`[notify] nhận ${tinHieu}, đang tắt…`);
  await dungWorker();
  server.close();
  await db.dongPool();
  process.exit(0);
}

process.on('SIGTERM', () => void tatDep('SIGTERM'));
process.on('SIGINT', () => void tatDep('SIGINT'));
