/**
 * Service media: lưu ảnh của app vào volume VPS và phục vụ lại bằng link công khai.
 * Traefik đưa mọi đường dẫn /media/* về đây (xem docker-compose.yml), strip tiền tố `/media`.
 *
 *   POST /upload   (Bearer JWT app) multipart: file, thu_muc → { url: '/media/f/...' }
 *   GET  /f/<...>  ảnh đã lưu — tên file 128 bit ngẫu nhiên, cache 1 năm (file không bao giờ đổi)
 *   GET  /logo?url=<logo công ty>  (Bearer JWT app) → { dataUrl } — tải hộ logo ở tên miền khác
 *        cho bản in / PDF; CHỈ nhận URL đang lưu ở thông tin công ty (core/logo.ts).
 */
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { jwtVerify } from 'jose';
import { config } from './config.ts';
import { kieuAnh, laUrlLogoDuocPhep, LOGO_HET_GIO_MS, LOGO_TOI_DA_BYTE } from './core/logo.ts';
import { docDuongDanPhucVu, laThuMucHopLe, taoDuongDanLuu, urlCongKhai } from './core/duong-dan.ts';
import { chuanHoaAnh, KhongPhaiAnhLoi } from './xu-ly-anh.ts';

const secretKey = new TextEncoder().encode(config.jwtSecret);
const app = new Hono();

/** Lấy nhân viên từ access token của app — cùng secret HS256 với auth-service và PostgREST. */
async function nhanVienTuHeader(header: string | undefined): Promise<number | null> {
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(header.slice(7), secretKey);
    const id = Number(payload['nv']);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

app.get('/khoe', async (c) => {
  try {
    await mkdir(config.thuMucKho, { recursive: true });
    return c.json({ ok: true });
  } catch {
    return c.json({ ok: false }, 503);
  }
});

app.post(
  '/upload',
  bodyLimit({
    maxSize: config.toiDaMb * 1024 * 1024,
    onError: (c) => c.json({ loi: 'qua_lon', thongDiep: `Ảnh vượt quá ${config.toiDaMb} MB.` }, 413),
  }),
  async (c) => {
    const nv = await nhanVienTuHeader(c.req.header('Authorization'));
    if (!nv) return c.json({ loi: 'chua_dang_nhap', thongDiep: 'Phiên đăng nhập hết hạn, hãy đăng nhập lại.' }, 401);

    let form: FormData;
    try {
      form = await c.req.formData();
    } catch {
      return c.json({ loi: 'sai_du_lieu', thongDiep: 'Dữ liệu tải lên không hợp lệ.' }, 400);
    }
    const thuMuc = form.get('thu_muc');
    const file = form.get('file');
    if (!laThuMucHopLe(thuMuc)) return c.json({ loi: 'sai_thu_muc', thongDiep: 'Thư mục ảnh không hợp lệ.' }, 400);
    if (!(file instanceof File) || file.size === 0) {
      return c.json({ loi: 'thieu_file', thongDiep: 'Chưa chọn ảnh.' }, 400);
    }

    try {
      const { data, duoi } = await chuanHoaAnh(Buffer.from(await file.arrayBuffer()));
      const duongDan = taoDuongDanLuu(thuMuc, new Date(), randomBytes(16).toString('hex'), duoi);
      const dich = path.join(config.thuMucKho, duongDan);
      await mkdir(path.dirname(dich), { recursive: true });
      // Ghi file tạm rồi đổi tên: không bao giờ phục vụ ra một ảnh ghi dở.
      const tam = `${dich}.${process.pid}.tmp`;
      await writeFile(tam, data);
      await rename(tam, dich);
      console.log(`[media] nv=${nv} lưu ${duongDan} (${Math.round(file.size / 1024)} KB → ${Math.round(data.length / 1024)} KB)`);
      return c.json({ url: urlCongKhai(duongDan) });
    } catch (e) {
      if (e instanceof KhongPhaiAnhLoi) return c.json({ loi: 'khong_phai_anh', thongDiep: e.message }, 415);
      console.error('[media] lỗi lưu ảnh:', e);
      return c.json({ loi: 'loi_may_chu', thongDiep: 'Lỗi máy chủ khi lưu ảnh.' }, 500);
    }
  },
);

app.get('/f/*', async (c) => {
  const yeuCau = docDuongDanPhucVu(c.req.path.replace(/^\/f\//, ''));
  if (!yeuCau) return c.body(null, 404);
  try {
    const data = await readFile(path.join(config.thuMucKho, yeuCau.duongDan));
    return c.body(data, 200, {
      'Content-Type': yeuCau.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
  } catch {
    return c.body(null, 404);
  }
});

/** Logo công ty đang lưu, đọc bằng token của người gọi (RLS của PostgREST quyết định). */
async function dsLogoCongTy(authHeader: string): Promise<string[]> {
  const r = await fetch(`${config.postgrestUrl}/fp_var_tt_cong_ty?select=logo`, {
    headers: { Authorization: authHeader, Accept: 'application/json' },
    signal: AbortSignal.timeout(5_000),
  });
  if (!r.ok) return [];
  const rows = (await r.json()) as { logo?: unknown }[];
  return rows.map((x) => x.logo).filter((x): x is string => typeof x === 'string');
}

app.get('/logo', async (c) => {
  const auth = c.req.header('Authorization');
  const nv = await nhanVienTuHeader(auth);
  if (!nv || !auth) return c.json({ loi: 'chua_dang_nhap', thongDiep: 'Phiên đăng nhập hết hạn, hãy đăng nhập lại.' }, 401);
  const url = (c.req.query('url') ?? '').trim();
  let dsLogo: string[] = [];
  try {
    dsLogo = await dsLogoCongTy(auth);
  } catch (e) {
    console.error('[media] không đọc được logo công ty:', e);
  }
  if (!laUrlLogoDuocPhep(url, dsLogo)) {
    return c.json({ loi: 'khong_duoc_phep', thongDiep: 'Chỉ tải được logo đã khai ở Thông tin công ty.' }, 400);
  }
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(LOGO_HET_GIO_MS), redirect: 'follow' });
    if (!r.ok) return c.json({ loi: 'nguon_loi', thongDiep: `Máy chủ nguồn trả ${r.status}.` }, 502);
    const kieu = kieuAnh(r.headers.get('content-type'));
    if (!kieu) return c.json({ loi: 'khong_phai_anh', thongDiep: 'Đường dẫn logo không phải ảnh.' }, 502);
    if (Number(r.headers.get('content-length') ?? 0) > LOGO_TOI_DA_BYTE) {
      return c.json({ loi: 'qua_lon', thongDiep: 'Logo quá lớn (trên 3 MB).' }, 502);
    }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > LOGO_TOI_DA_BYTE) return c.json({ loi: 'qua_lon', thongDiep: 'Logo quá lớn (trên 3 MB).' }, 502);
    c.header('Cache-Control', 'private, max-age=3600');
    return c.json({ dataUrl: `data:${kieu};base64,${buf.toString('base64')}` });
  } catch {
    return c.json({ loi: 'nguon_loi', thongDiep: 'Không tải được logo từ máy chủ nguồn.' }, 502);
  }
});

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`[media] nghe trên cổng ${info.port}, kho ảnh: ${config.thuMucKho}`);
});

for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
