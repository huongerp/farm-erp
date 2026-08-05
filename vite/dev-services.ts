/**
 * Bật PostgREST và auth-service kèm theo `npm run dev`.
 *
 * SPA không tự chạy được: đăng nhập đi qua `/auth`, dữ liệu đi qua `/api`, và
 * proxy trong vite.config.ts chỉ forward chứ không khởi động gì. Thiếu hai
 * service này thì mọi request trả 500 (ECONNREFUSED từ proxy).
 *
 * Đặt vòng đời hai process vào plugin thay vì script riêng để một `Ctrl+C` dọn
 * sạch: process con chết theo process Vite.
 *
 * Chỉ spawn khi target proxy trỏ về máy này. Trỏ `DEV_API_PROXY_TARGET` /
 * `DEV_AUTH_PROXY_TARGET` ra VPS thì plugin tự đứng ngoài.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import type { Logger, Plugin } from 'vite';

type Options = {
  env: Record<string, string>;
  root: string;
  apiTarget: string;
  authTarget: string;
};

/**
 * Process con phải sống xuyên các lần Vite restart (sửa vite.config.ts). Vite
 * dựng server mới rồi mới đóng server cũ, nên không thể gắn việc dọn dẹp vào
 * `httpServer.close`: làm vậy thì bản mới thấy cổng còn bận nên không spawn,
 * xong bản cũ đóng và giết mất service. Registry đặt trên globalThis vì mỗi lần
 * restart là một lần module này được nạp lại.
 */
type MucRegistry = { child: ChildProcess; luc: number };
type Registry = Map<number, MucRegistry>;

/** Cho process mới ngần này thời gian khởi động trước khi coi là hỏng. */
const HAN_KHOI_DONG_MS = 20_000;

const KHOA_REGISTRY = Symbol.for('farm-erp.dev-services.registry');
const KHOA_HANG_DOI = Symbol.for('farm-erp.dev-services.hang-doi');
const KHOA_HOOK = Symbol.for('farm-erp.dev-services.hook');

function layRegistry(): Registry {
  const g = globalThis as unknown as Record<symbol, unknown>;
  if (!g[KHOA_REGISTRY]) g[KHOA_REGISTRY] = new Map<number, MucRegistry>();

  if (!g[KHOA_HOOK]) {
    g[KHOA_HOOK] = true;
    // Ctrl+C trong terminal đã gửi SIGINT cho cả process group; hook này lo nốt
    // trường hợp process Vite bị kill riêng.
    process.once('exit', () => {
      const reg = g[KHOA_REGISTRY] as Registry;
      for (const port of [...reg.keys()]) docMuc(reg, port)?.child.kill('SIGTERM');
    });
  }

  return g[KHOA_REGISTRY] as Registry;
}

/**
 * Lưu file liên tiếp làm Vite xếp hàng nhiều lần restart, các lượt
 * `configureServer` chạy đan xen nhau ở chỗ `await`. Không nối đuôi theo cổng
 * thì lượt nào cũng thấy cổng trống và spawn thêm một process thừa.
 */
function noiDuoi(port: number, viec: () => Promise<void>): Promise<void> {
  const g = globalThis as unknown as Record<symbol, unknown>;
  if (!g[KHOA_HANG_DOI]) g[KHOA_HANG_DOI] = new Map<number, Promise<void>>();
  const hangDoi = g[KHOA_HANG_DOI] as Map<number, Promise<void>>;

  const ketQua = (hangDoi.get(port) ?? Promise.resolve()).then(viec);
  hangDoi.set(port, ketQua.catch(() => undefined));
  return ketQua;
}

/**
 * Registry sống lâu hơn module này nên có thể chứa mục do một bản plugin cũ ghi
 * (khi sửa chính file này). Mục không đúng dạng thì bỏ, để phần kiểm cổng bên
 * dưới tự xử.
 */
function docMuc(registry: Registry, port: number): MucRegistry | undefined {
  const muc = registry.get(port) as Partial<MucRegistry> | undefined;
  if (muc?.child) return muc as MucRegistry;
  if (muc) registry.delete(port);
  return undefined;
}

function conDangChay(muc: MucRegistry | undefined): muc is MucRegistry {
  return muc !== undefined && muc.child.exitCode === null && muc.child.signalCode === null;
}

/** Cổng nếu target nằm trên máy này, null nếu trỏ ra ngoài (khi đó khỏi spawn). */
function localPort(target: string): number | null {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return null;
  }
  if (!['127.0.0.1', 'localhost', '[::1]', '::1'].includes(url.hostname)) return null;
  const port = Number(url.port);
  return Number.isFinite(port) && port > 0 ? port : null;
}

/** Có ai đang nghe cổng chưa — service chạy tay từ terminal khác thì không spawn đè. */
function portDangDung(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    const xong = (ketQua: boolean) => {
      socket.destroy();
      resolve(ketQua);
    };
    socket.setTimeout(500);
    socket.once('connect', () => xong(true));
    socket.once('error', () => xong(false));
    socket.once('timeout', () => xong(false));
  });
}

/** Tách `host:port` và tên DB từ VPS_DB_URL để ghép chuỗi kết nối cho từng role. */
function thongTinDb(dbUrl: string): { hostPort: string; dbName: string } | null {
  try {
    const url = new URL(dbUrl);
    const dbName = url.pathname.replace(/^\//, '');
    return url.host && dbName ? { hostPort: url.host, dbName } : null;
  } catch {
    return null;
  }
}

/**
 * Đợi service trả lời trước khi Vite mở cổng. PostgREST mất vài giây nạp schema
 * cache và trong lúc đó trả 503, nên không đợi thì lần tải trang đầu tiên bắn ra
 * một loạt request hỏng.
 */
async function doiSanSang(port: number, duongDan: string, nhan: string, logger: Logger) {
  const hetHan = Date.now() + HAN_KHOI_DONG_MS;
  while (Date.now() < hetHan) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}${duongDan}`);
      await res.body?.cancel();
      if (res.status !== 503) return;
    } catch {
      // chưa listen — thử lại
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  logger.warn(`${nhan} chưa sẵn sàng sau ${HAN_KHOI_DONG_MS / 1000}s — vài request đầu có thể lỗi.`);
}

function gan(nhan: string, child: ChildProcess, logger: Logger) {
  for (const luong of [child.stdout, child.stderr]) {
    luong?.setEncoding('utf8').on('data', (chunk: string) => {
      for (const dong of chunk.split('\n')) {
        const noiDung = dong.trimEnd();
        if (!noiDung.trim()) continue;
        // auth-service tự in `[auth]` rồi, đừng gắn nhãn hai lần.
        logger.info(noiDung.startsWith(nhan) ? noiDung : `${nhan} ${noiDung}`);
      }
    });
  }
}

export function devServices({ env, root, apiTarget, authTarget }: Options): Plugin {
  return {
    name: 'farm-erp:dev-services',
    apply: 'serve',
    async configureServer(server) {
      const logger = server.config.logger;
      if (env.DEV_SKIP_SERVICES === '1') return;

      const apiPort = localPort(apiTarget);
      const authPort = localPort(authTarget);
      if (apiPort === null && authPort === null) return;

      const db = thongTinDb(env.VPS_DB_URL ?? '');
      if (!db) {
        logger.warn('[dev-services] VPS_DB_URL trống hoặc sai định dạng — bỏ qua, xem README.');
        return;
      }
      const ketNoi = (role: string, matKhau: string) =>
        `postgresql://${role}:${matKhau}@${db.hostPort}/${db.dbName}`;

      const registry = layRegistry();

      // Đổi cổng trong .env rồi restart: process cũ không còn ai proxy tới nữa.
      for (const port of [...registry.keys()]) {
        if (port !== apiPort && port !== authPort) {
          docMuc(registry, port)?.child.kill('SIGTERM');
          registry.delete(port);
        }
      }

      const canDoi: Array<Promise<void>> = [];

      const batDau = (port: number, nhan: string, duongDanKhoe: string, goiY: string, tao: () => ChildProcess) =>
        noiDuoi(port, async () => {
          canDoi.push(doiSanSang(port, duongDanKhoe, nhan, logger));
          const cu = docMuc(registry, port);

          // Ai đang nghe cổng cũng được — process của lần dev trước, hoặc service
          // chạy tay ở terminal khác. Đây mới là dấu hiệu đáng tin, không phải
          // "process con còn sống": `node --watch` giữ watcher chạy cả khi app
          // bên trong đã chết.
          if (await portDangDung(port)) {
            if (!conDangChay(cu)) logger.info(`${nhan} đã chạy sẵn ở cổng ${port} — dùng lại.`);
            return;
          }
          if (conDangChay(cu)) {
            if (Date.now() - cu.luc < HAN_KHOI_DONG_MS) return; // vừa spawn, đang lên
            cu.child.kill('SIGTERM');
            registry.delete(port);
            logger.warn(`${nhan} còn process nhưng không nghe cổng ${port} — khởi động lại.`);
          }

          const child = tao();
          registry.set(port, { child, luc: Date.now() });
          gan(nhan, child, logger);
          child.on('error', (err: NodeJS.ErrnoException) => {
            logger.error(`${nhan} không chạy được: ${err.message}${err.code === 'ENOENT' ? ` — ${goiY}` : ''}`);
          });
          child.on('exit', () => {
            if (docMuc(registry, port)?.child === child) registry.delete(port);
          });
        });

      if (apiPort !== null) {
        if (!env.PGRST_AUTHENTICATOR_PASSWORD || !env.PGRST_JWT_SECRET) {
          logger.warn('[postgrest] thiếu PGRST_AUTHENTICATOR_PASSWORD hoặc PGRST_JWT_SECRET — bỏ qua.');
        } else {
          await batDau(apiPort, '[postgrest]', '/', 'cài bằng `brew install postgrest`', () =>
            spawn('postgrest', [], {
              stdio: ['ignore', 'pipe', 'pipe'],
              env: {
                ...process.env,
                PGRST_DB_URI: ketNoi('authenticator', env.PGRST_AUTHENTICATOR_PASSWORD),
                PGRST_DB_SCHEMAS: 'public',
                PGRST_DB_ANON_ROLE: 'anon',
                PGRST_JWT_SECRET: env.PGRST_JWT_SECRET,
                PGRST_DB_EXTRA_SEARCH_PATH: 'public, extensions',
                PGRST_SERVER_PORT: String(apiPort),
                PGRST_OPENAPI_MODE: 'disabled',
              },
            }),
          );
        }
      }

      if (authPort !== null) {
        const authDir = path.join(root, 'services', 'auth');
        if (!env.AUTH_SERVICE_DB_PASSWORD || !env.PGRST_JWT_SECRET) {
          logger.warn('[auth] thiếu AUTH_SERVICE_DB_PASSWORD hoặc PGRST_JWT_SECRET — bỏ qua.');
        } else if (!existsSync(path.join(authDir, 'node_modules'))) {
          logger.warn('[auth] chưa cài phụ thuộc — chạy `npm ci --prefix services/auth` rồi mở lại dev.');
        } else {
          await batDau(authPort, '[auth]', '/khoe', 'cần Node >= 22.6 (--experimental-strip-types)', () =>
            spawn(process.execPath, ['--watch', '--experimental-strip-types', 'src/index.ts'], {
              cwd: authDir,
              stdio: ['ignore', 'pipe', 'pipe'],
              env: {
                ...process.env,
                DATABASE_URL: ketNoi('auth_service', env.AUTH_SERVICE_DB_PASSWORD),
                JWT_SECRET: env.PGRST_JWT_SECRET,
                PORT: String(authPort),
                GOOGLE_CLIENT_ID: env.VITE_GOOGLE_CLIENT_ID ?? '',
              },
            }),
          );
        }
      }

      await Promise.all(canDoi);
    },
  };
}
