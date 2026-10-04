/**
 * Đọc dữ liệu nguồn của lịch qua PostgREST bằng JWT của NGƯỜI TẠO LỊCH — RLS và view
 * security_invoker áp đúng như khi chính người đó mở app. Role sheets_service không được
 * cấp quyền đọc bảng nghiệp vụ nào.
 */
import { SignJWT } from 'jose';
import { config } from '../config.ts';
import { GIOI_HAN } from '../core/bang-tinh.ts';
import { LoiVinhVien } from './loi.ts';

const secretKey = new TextEncoder().encode(config.jwtSecret);
/** Khớp DB_PAGE_SIZE của app (lib/db.ts) — PostgREST có thể đặt trần max-rows. */
const TRANG = 1000;

async function jwtNguoiTao(nhanVienId: number, email: string | null): Promise<string> {
  // Cùng dạng claim auth-service ký: RLS đọc `nv`, vài hàm cũ còn đọc `email`.
  return new SignJWT({ role: 'authenticated', nv: nhanVienId, email: email ?? undefined })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(secretKey);
}

export async function docNguon(opts: {
  nguon: string;
  cot: string[];
  nhanVienId: number;
  email: string | null;
  /** Xem thử: chỉ lấy ngần này dòng. */
  gioiHan?: number;
}): Promise<Record<string, unknown>[]> {
  const token = await jwtNguoiTao(opts.nhanVienId, opts.email);
  const select = encodeURIComponent(opts.cot.join(','));
  const out: Record<string, unknown>[] = [];
  const toiDa = opts.gioiHan ?? GIOI_HAN.soDong + 1;

  for (let offset = 0; offset < toiDa; offset += TRANG) {
    const limit = Math.min(TRANG, toiDa - offset);
    let res: Response;
    try {
      res = await fetch(`${config.postgrestUrl}/${opts.nguon}?select=${select}&order=id.asc&limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(60_000),
      });
    } catch (e) {
      throw new Error(`Không gọi được PostgREST: ${(e as Error).message}`);
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
      if (res.status === 400 && (body.code === '42703' || body.code === 'PGRST100' || body.code === 'PGRST204')) {
        throw new LoiVinhVien(`Nguồn dữ liệu không còn cột đã chọn (${body.message ?? body.code}). Hãy tạo lại lịch.`);
      }
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        throw new LoiVinhVien('Không đọc được dữ liệu nguồn bằng quyền của người tạo lịch.');
      }
      throw new Error(`PostgREST lỗi ${res.status}: ${body.message ?? ''}`);
    }
    const trang = (await res.json()) as Record<string, unknown>[];
    out.push(...trang);
    if (trang.length < limit) break;
  }

  if (opts.gioiHan === undefined && out.length > GIOI_HAN.soDong) {
    throw new LoiVinhVien(`Dữ liệu vượt ${GIOI_HAN.soDong.toLocaleString('vi-VN')} dòng — Google Sheet không phù hợp để đồng bộ khối lượng này.`);
  }
  return out;
}
