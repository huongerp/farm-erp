/**
 * Service sheets: kết nối Google của từng nhân viên + xuất dữ liệu ra Google Sheet.
 * Traefik đưa mọi đường dẫn /sheets/* về đây (xem docker-compose.yml); dev đi qua proxy Vite.
 */

import { serve } from '@hono/node-server';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { jwtVerify } from 'jose';
import { config } from './config.ts';
import * as db from './db.ts';
import { chuanHoaTenFile, chuanHoaTenTab, kiemTraYeuCauXuat } from './core/bang-tinh.ts';
import { dinhDangOXuat, type KieuCotXuat } from './core/dinh-dang.ts';
import { DS_TAN_SUAT, doiSoatKeTiep, kiemTraYeuCauLich, lanChayKeTiep, type TanSuat } from './core/lich.ts';
import { NGUON_DONG_BO } from './core/nguon-dong-bo.ts';
import { chayMotLich } from './dong-bo/chay-mot-lich.ts';
import { docNguon } from './dong-bo/nguon.ts';
import { khoiDongWorker } from './dong-bo/worker.ts';
import { GoogleLoi } from './google/goi-google.ts';
import { docState, doiMa, KetNoiHongLoi, kyState, SCOPE_DRIVE_FILE, thuHoi, urlDongY } from './google/oauth.ts';
import { ChuaKetNoiLoi, layAccessToken } from './google/phien.ts';
import { docHeaderCacTab, ghiBang, layThongTinFile, taoFile } from './google/sheets.ts';

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

/**
 * Origin được phép nhận kết quả OAuth: production = origin của GOOGLE_OAUTH_REDIRECT_URI;
 * chưa đặt (dev) thì chỉ nhận localhost. Không tin origin tuỳ ý từ request.
 */
function originHopLe(origin: string | undefined): string | null {
  if (!origin) return null;
  if (config.googleRedirectUri) {
    return new URL(config.googleRedirectUri).origin === origin ? origin : null;
  }
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? origin : null;
}

/** Đổi lỗi Google/kết nối thành phản hồi có thông điệp tiếng Việt cho toast. */
function traLoi(c: Context, e: unknown) {
  if (e instanceof ChuaKetNoiLoi) return c.json({ loi: 'chua_ket_noi', thongDiep: e.message }, 409);
  if (e instanceof KetNoiHongLoi) return c.json({ loi: 'ket_noi_hong', thongDiep: e.message }, 409);
  if (e instanceof GoogleLoi) {
    if (e.status === 403 || e.status === 404) {
      return c.json(
        {
          loi: 'khong_truy_cap_file',
          thongDiep: 'App không mở được file này. Hãy chọn lại file bằng nút "Chọn file trên Drive" hoặc tạo file mới.',
        },
        403,
      );
    }
    console.error('[sheets] Google lỗi', e.status, e.lyDo, e.message);
    return c.json({ loi: 'google_loi', thongDiep: `Google báo lỗi: ${e.message}` }, 502);
  }
  console.error('[sheets] lỗi không lường trước:', e);
  return c.json({ loi: 'loi_may_chu', thongDiep: 'Lỗi máy chủ khi làm việc với Google Sheet.' }, 500);
}

app.get('/khoe', async (c) => {
  try {
    await db.kiemTraKetNoi();
    return c.json({ ok: true, worker: config.workerBat });
  } catch {
    return c.json({ ok: false }, 503);
  }
});

// --- Kết nối Google -------------------------------------------------------------

app.get('/google/trang-thai', async (c) => {
  const nv = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nv === null) return c.json({ loi: 'khong_xac_thuc' }, 401);
  const kn = await db.layKetNoi(nv);
  return c.json({ ketNoi: !!kn, email: kn?.email ?? null, trangThai: kn?.trangThai ?? null });
});

app.post('/google/bat-dau', async (c) => {
  const nv = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nv === null) return c.json({ loi: 'khong_xac_thuc' }, 401);
  const origin = originHopLe(c.req.header('Origin'));
  if (!origin) return c.json({ loi: 'origin_khong_hop_le', thongDiep: 'Nguồn gọi không được phép.' }, 400);
  let popup = true;
  try {
    popup = ((await c.req.json()) as { popup?: boolean }).popup !== false;
  } catch {
    /* body rỗng → mặc định popup */
  }
  const state = await kyState({ nv, popup, origin });
  return c.json({ url: urlDongY(state, origin) });
});

/** JSON nhúng an toàn vào <script>: chặn `</script>` và ký tự dòng JS. */
function jsonTrongScript(v: unknown): string {
  return JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function trangKetQua(kq: { ok: boolean; email?: string; thongDiep?: string }, origin: string, popup: boolean): string {
  const tin = { type: 'farm-sheets-google', ...kq };
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Kết nối Google</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;color:#334155}</style>
</head><body><p>${kq.ok ? 'Đã kết nối Google. Cửa sổ này sẽ tự đóng…' : 'Kết nối Google không thành công. Bạn có thể đóng cửa sổ này.'}</p>
<script>(function(){var tin=${jsonTrongScript(tin)},o=${jsonTrongScript(origin)},popup=${popup ? 'true' : 'false'};
try{if(window.opener)window.opener.postMessage(tin,o)}catch(e){}
try{var bc=new BroadcastChannel('farm-sheets');bc.postMessage(tin);bc.close()}catch(e){}
if(popup){setTimeout(function(){window.close()},400)}else{location.replace(o+'/?google_sheets='+(tin.ok?'ok':'loi'))}})();</script>
</body></html>`;
}

app.get('/google/callback', async (c) => {
  const s = await docState(c.req.query('state') ?? '');
  if (!s) return c.html(trangKetQua({ ok: false, thongDiep: 'Phiên kết nối đã hết hạn, hãy thử lại.' }, '', true), 400);

  const loiGoogle = c.req.query('error');
  const code = c.req.query('code');
  if (loiGoogle || !code) {
    return c.html(trangKetQua({ ok: false, thongDiep: loiGoogle === 'access_denied' ? 'Bạn đã từ chối cấp quyền.' : 'Google không trả mã xác thực.' }, s.origin, s.popup));
  }

  try {
    const t = await doiMa(code, s.origin);
    // Người dùng có thể bỏ tick quyền Drive ở màn hình đồng ý — khi đó kết nối vô dụng.
    // Ngoài lý do bỏ tick, Workspace admin chặn app bên thứ ba cũng ra ca này — log scope để phân biệt.
    if (!t.scopes.includes(SCOPE_DRIVE_FILE)) {
      console.warn('[sheets] thiếu scope drive.file', { nv: s.nv, email: t.email, scopes: t.scopes });
      await thuHoi(t.accessToken);
      return c.html(
        trangKetQua(
          {
            ok: false,
            thongDiep:
              'Bạn chưa tick quyền Google Drive. Bấm "Kết nối Google" lại và tick ô "Xem, chỉnh sửa, tạo và xoá … tệp trên Google Drive mà bạn dùng với ứng dụng này" trước khi bấm Tiếp tục.',
          },
          s.origin,
          s.popup,
        ),
      );
    }
    const daLuu = await db.luuKetNoi({ nhanVienId: s.nv, email: t.email, refreshToken: t.refreshToken, accessToken: t.accessToken, hetHan: t.hetHan });
    if (!daLuu) {
      return c.html(trangKetQua({ ok: false, thongDiep: 'Google không cấp refresh token. Gỡ quyền app ở myaccount.google.com rồi kết nối lại.' }, s.origin, s.popup));
    }
    return c.html(trangKetQua({ ok: true, email: t.email }, s.origin, s.popup));
  } catch (e) {
    console.error('[sheets] callback lỗi:', e);
    return c.html(trangKetQua({ ok: false, thongDiep: 'Không đổi được mã xác thực với Google.' }, s.origin, s.popup));
  }
});

app.delete('/google/ket-noi', async (c) => {
  const nv = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nv === null) return c.json({ loi: 'khong_xac_thuc' }, 401);
  const kn = await db.layKetNoi(nv);
  if (kn) {
    await thuHoi(kn.refreshToken);
    await db.xoaKetNoi(nv);
  }
  return c.json({ ok: true });
});

/** Access token ngắn hạn cho Google Picker ở trình duyệt (scope drive.file, không mở rộng hơn). */
app.get('/google/token-picker', async (c) => {
  const nv = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nv === null) return c.json({ loi: 'khong_xac_thuc' }, 401);
  try {
    const { accessToken } = await layAccessToken(nv);
    return c.json({ accessToken });
  } catch (e) {
    return traLoi(c, e);
  }
});

/** Thông tin file + header dòng 1 của từng tab (tối đa 50 tab) cho bước chọn tab. */
app.get('/google/bang-tinh/:id', async (c) => {
  const nv = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nv === null) return c.json({ loi: 'khong_xac_thuc' }, 401);
  const id = c.req.param('id');
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(id)) return c.json({ loi: 'id_khong_hop_le', thongDiep: 'Mã file không hợp lệ.' }, 400);
  try {
    const { accessToken } = await layAccessToken(nv);
    const file = await layThongTinFile(accessToken, id);
    const tabs = file.tabs.slice(0, 50);
    const headers = await docHeaderCacTab(accessToken, id, tabs.map((t) => t.title));
    return c.json({
      spreadsheetId: file.spreadsheetId,
      title: file.title,
      url: file.url,
      tabs: tabs.map((t) => ({ title: t.title, rowCount: t.rowCount, header: headers.get(t.title) ?? [] })),
    });
  } catch (e) {
    return traLoi(c, e);
  }
});

// --- Xuất một lần ---------------------------------------------------------------

app.post(
  '/xuat-ngay',
  // 50.000 dòng × vài chục cột JSON có thể vượt 10MB.
  bodyLimit({ maxSize: 40 * 1024 * 1024, onError: (c) => c.json({ loi: 'qua_lon', thongDiep: 'Dữ liệu quá lớn — hãy lọc bớt.' }, 413) }),
  async (c) => {
    const nv = await nhanVienTuHeader(c.req.header('Authorization'));
    if (nv === null) return c.json({ loi: 'khong_xac_thuc' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ loi: 'body_khong_hop_le', thongDiep: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
    }
    const kt = kiemTraYeuCauXuat(body);
    if ('loi' in kt) return c.json({ loi: 'du_lieu_khong_hop_le', thongDiep: kt.loi }, 400);
    const y = kt.ok;

    try {
      const { accessToken } = await layAccessToken(nv);
      const file =
        y.dich.loai === 'moi'
          ? await taoFile(accessToken, y.dich.tenFile, y.dich.tenTab)
          : await layThongTinFile(accessToken, y.dich.spreadsheetId);
      const kq = await ghiBang({
        at: accessToken,
        file,
        tenTab: y.dich.tenTab,
        // File mới tạo luôn ghi đè (tab trống) dù client gửi gì.
        cheDo: y.dich.loai === 'moi' ? 'ghi_de' : y.cheDo,
        header: y.header,
        rows: y.rows,
        mauSo: y.mauSo,
      });
      console.log(`[sheets] nv=${nv} xuất ${kq.soDong} dòng → ${file.spreadsheetId} / ${y.dich.tenTab} (${y.cheDo})`);
      return c.json({ ok: true, spreadsheetId: file.spreadsheetId, url: file.url, tenTab: y.dich.tenTab, soDong: kq.soDong, lechHeader: kq.lechHeader });
    } catch (e) {
      return traLoi(c, e);
    }
  },
);

// --- Lịch đồng bộ tự động ---------------------------------------------------------

function lichRaClient(l: db.Lich) {
  return {
    id: l.id,
    moduleId: l.moduleId,
    tenFile: l.tenFile,
    sheetTitle: l.sheetTitle,
    spreadsheetUrl: l.spreadsheetUrl,
    tanSuat: l.tanSuat,
    gio: l.gio,
    thu: l.thu,
    ngayThang: l.ngayThang,
    bat: l.bat,
    soCot: l.cot.length,
    lanChayCuoi: l.lanChayCuoi,
    ketQuaCuoi: l.ketQuaCuoi,
    thongDiepCuoi: l.thongDiepCuoi,
    soDongCuoi: l.soDongCuoi,
    lanChayKeTiep: l.lanChayKeTiep,
    choGhi: l.canChay,
    soLoiLienTiep: l.soLoiLienTiep,
  };
}

/** Ai được tạo lịch cho module: module có trong danh sách hỗ trợ + người tạo còn làm + toàn phạm vi. */
async function quyenTaoLich(nv: number, moduleId: string): Promise<{ duoc: boolean; lyDo: string | null }> {
  if (!NGUON_DONG_BO[moduleId]) return { duoc: false, lyDo: 'Module này chưa hỗ trợ đồng bộ tự động.' };
  const nt = await db.kiemNguoiTao(nv, moduleId);
  if (!nt?.conLam) return { duoc: false, lyDo: 'Tài khoản không hợp lệ.' };
  if (!nt.toanPhamVi) {
    return {
      duoc: false,
      lyDo: 'Đồng bộ tự động chỉ dành cho người xem được toàn bộ dữ liệu module (cấp bậc 1 hoặc quyền quản trị).',
    };
  }
  return { duoc: true, lyDo: null };
}

app.get('/lich', async (c) => {
  const nv = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nv === null) return c.json({ loi: 'khong_xac_thuc' }, 401);
  const moduleId = c.req.query('moduleId') || undefined;
  const ds = await db.dsLich(nv, moduleId);
  const quyen = moduleId ? await quyenTaoLich(nv, moduleId) : { duoc: false, lyDo: null };
  return c.json({ hoTro: moduleId ? !!NGUON_DONG_BO[moduleId] : false, duocTao: quyen.duoc, lyDo: quyen.lyDo, dsLich: ds.map(lichRaClient) });
});

/** 20 dòng đầu lịch sẽ ghi — dữ liệu TOÀN BỘ trong quyền, không theo bộ lọc đang xem. */
app.post('/lich/xem-thu', async (c) => {
  const nv = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nv === null) return c.json({ loi: 'khong_xac_thuc' }, 401);
  const kt = kiemTraYeuCauLich({ ...(await c.req.json().catch(() => ({}))), tanSuat: 'khi_thay_doi' });
  if ('loi' in kt) return c.json({ loi: 'du_lieu_khong_hop_le', thongDiep: kt.loi }, 400);
  const quyen = await quyenTaoLich(nv, kt.ok.moduleId);
  if (!quyen.duoc) return c.json({ loi: 'khong_duoc_phep', thongDiep: quyen.lyDo }, 403);
  try {
    const nt = await db.kiemNguoiTao(nv, kt.ok.moduleId);
    const du = await docNguon({
      nguon: NGUON_DONG_BO[kt.ok.moduleId]!.nguon,
      cot: kt.ok.cot.map((x) => x.key),
      nhanVienId: nv,
      email: nt?.email ?? null,
      gioiHan: 20,
    });
    return c.json({
      header: kt.ok.cot.map((x) => x.label),
      rows: du.map((r) => kt.ok.cot.map((x) => dinhDangOXuat(r[x.key], x.type as KieuCotXuat | undefined).hienThi)),
    });
  } catch (e) {
    return c.json({ loi: 'doc_nguon_loi', thongDiep: e instanceof Error ? e.message : 'Không đọc được dữ liệu.' }, 400);
  }
});

app.post('/lich', async (c) => {
  const nv = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nv === null) return c.json({ loi: 'khong_xac_thuc' }, 401);
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const kt = kiemTraYeuCauLich(body);
  if ('loi' in kt) return c.json({ loi: 'du_lieu_khong_hop_le', thongDiep: kt.loi }, 400);
  const y = kt.ok;
  const quyen = await quyenTaoLich(nv, y.moduleId);
  if (!quyen.duoc) return c.json({ loi: 'khong_duoc_phep', thongDiep: quyen.lyDo }, 403);

  const d = (body?.dich ?? {}) as Record<string, unknown>;
  const tenTab = chuanHoaTenTab(d.tenTab as string);
  if (!tenTab) return c.json({ loi: 'du_lieu_khong_hop_le', thongDiep: 'Tên tab không hợp lệ (1–100 ký tự).' }, 400);

  try {
    const { accessToken } = await layAccessToken(nv);
    let file;
    if (d.loai === 'moi') {
      const tenFile = chuanHoaTenFile(d.tenFile as string);
      if (!tenFile) return c.json({ loi: 'du_lieu_khong_hop_le', thongDiep: 'Tên file không hợp lệ.' }, 400);
      file = await taoFile(accessToken, tenFile, tenTab);
    } else {
      const id = String(d.spreadsheetId ?? '');
      if (!/^[A-Za-z0-9_-]{20,100}$/.test(id)) return c.json({ loi: 'du_lieu_khong_hop_le', thongDiep: 'Mã file không hợp lệ.' }, 400);
      file = await layThongTinFile(accessToken, id);
    }

    const now = new Date();
    const nguon = NGUON_DONG_BO[y.moduleId]!;
    const lich = await db.taoLich({
      nhanVienId: nv,
      moduleId: y.moduleId,
      nguon: nguon.nguon,
      bangGoc: nguon.bangGoc,
      cot: y.cot,
      spreadsheetId: file.spreadsheetId,
      spreadsheetUrl: file.url,
      tenFile: file.title,
      sheetTitle: tenTab,
      tanSuat: y.tanSuat,
      gio: y.gio,
      thu: y.thu,
      ngayThang: y.ngayThang,
      lanChayKeTiep: lanChayKeTiep(y, now),
      doiSoatKeTiep: y.tanSuat === 'khi_thay_doi' ? doiSoatKeTiep(now) : null,
    });

    // Ghi lần đầu ngay để người dùng thấy kết quả, không đợi tới lượt worker.
    const nhan = await db.nhanMotLich(lich.id, nv);
    const ketQua = nhan ? await chayMotLich(nhan, { batBuocToanBo: true }) : null;
    const moi = (await db.layLichCuaNguoi(lich.id, nv)) ?? lich;
    return c.json({ ok: true, lich: lichRaClient(moi), ketQua, url: file.url });
  } catch (e) {
    if (e instanceof db.TrungDichLoi) return c.json({ loi: 'trung_dich', thongDiep: e.message }, 409);
    return traLoi(c, e);
  }
});

app.patch('/lich/:id', async (c) => {
  const nv = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nv === null) return c.json({ loi: 'khong_xac_thuc' }, 401);
  const id = Number(c.req.param('id'));
  const cu = Number.isInteger(id) ? await db.layLichCuaNguoi(id, nv) : null;
  if (!cu) return c.json({ loi: 'khong_tim_thay', thongDiep: 'Không tìm thấy lịch.' }, 404);

  const b = ((await c.req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  const kt = kiemTraYeuCauLich({
    moduleId: cu.moduleId,
    cot: cu.cot,
    tanSuat: DS_TAN_SUAT.includes(b.tanSuat as TanSuat) ? b.tanSuat : cu.tanSuat,
    gio: b.gio ?? cu.gio,
    thu: b.thu ?? cu.thu,
    ngayThang: b.ngayThang ?? cu.ngayThang,
  });
  if ('loi' in kt) return c.json({ loi: 'du_lieu_khong_hop_le', thongDiep: kt.loi }, 400);
  const bat = typeof b.bat === 'boolean' ? b.bat : cu.bat;
  if (bat && !cu.bat) {
    const quyen = await quyenTaoLich(nv, cu.moduleId);
    if (!quyen.duoc) return c.json({ loi: 'khong_duoc_phep', thongDiep: quyen.lyDo }, 403);
  }
  const now = new Date();
  const lich = await db.capNhatLich(id, nv, {
    bat,
    tanSuat: kt.ok.tanSuat,
    gio: kt.ok.gio,
    thu: kt.ok.thu,
    ngayThang: kt.ok.ngayThang,
    lanChayKeTiep: lanChayKeTiep(kt.ok, now),
    doiSoatKeTiep: kt.ok.tanSuat === 'khi_thay_doi' ? (cu.doiSoatKeTiep ?? doiSoatKeTiep(now)) : null,
  });
  return lich ? c.json({ ok: true, lich: lichRaClient(lich) }) : c.json({ loi: 'khong_tim_thay' }, 404);
});

app.delete('/lich/:id', async (c) => {
  const nv = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nv === null) return c.json({ loi: 'khong_xac_thuc' }, 401);
  const id = Number(c.req.param('id'));
  const daXoa = Number.isInteger(id) && (await db.xoaLich(id, nv));
  return daXoa ? c.json({ ok: true }) : c.json({ loi: 'khong_tim_thay', thongDiep: 'Không tìm thấy lịch.' }, 404);
});

/** "Đồng bộ ngay": ghi lại toàn bộ (sửa luôn chỗ ai đó gõ tay làm lệch Sheet). */
app.post('/lich/:id/chay-ngay', async (c) => {
  const nv = await nhanVienTuHeader(c.req.header('Authorization'));
  if (nv === null) return c.json({ loi: 'khong_xac_thuc' }, 401);
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || !(await db.layLichCuaNguoi(id, nv))) {
    return c.json({ loi: 'khong_tim_thay', thongDiep: 'Không tìm thấy lịch.' }, 404);
  }
  const nhan = await db.nhanMotLich(id, nv);
  if (!nhan) return c.json({ loi: 'dang_chay', thongDiep: 'Lịch đang được đồng bộ, thử lại sau ít phút.' }, 409);
  const ketQua = await chayMotLich(nhan, { batBuocToanBo: true });
  const lich = await db.layLichCuaNguoi(id, nv);
  return c.json({ ok: ketQua.ok, ketQua, lich: lich ? lichRaClient(lich) : null });
});

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`[sheets] nghe trên cổng ${info.port}${config.workerBat ? '' : ' (worker đồng bộ tắt)'}`);
});

const dungWorker = await khoiDongWorker();

async function tatDep(tinHieu: string): Promise<void> {
  console.log(`[sheets] nhận ${tinHieu}, đang tắt…`);
  await dungWorker();
  server.close();
  await db.dongPool();
  process.exit(0);
}

process.on('SIGTERM', () => void tatDep('SIGTERM'));
process.on('SIGINT', () => void tatDep('SIGINT'));
