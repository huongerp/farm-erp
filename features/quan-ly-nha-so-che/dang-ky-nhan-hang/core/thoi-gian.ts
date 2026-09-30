/**
 * Tính thời gian vào/ra so với giờ đăng ký. Giờ đăng ký (`HH:mm`) hiểu theo ngày
 * đăng ký ở múi giờ `tz` (mặc định Asia/Ho_Chi_Minh); giờ thực tế là timestamptz ISO.
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const TZ_MAC_DINH = 'Asia/Ho_Chi_Minh';

/** Chuẩn hoá `HH:mm[:ss]` từ Postgres `time` → `HH:mm`; không hợp lệ → null. */
export function chuanHoaGio(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(v.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const p = Number(m[2]);
  if (h > 23 || p > 59) return null;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

/** Mốc thời gian (ms) của `ngay` + `gio` tại múi giờ `tz`. */
export function mocGioDangKy(ngay: string, gio: string | null | undefined, tz = TZ_MAC_DINH): number | null {
  const g = chuanHoaGio(gio);
  if (!ngay || !g) return null;
  const d = dayjs.tz(`${ngay} ${g}`, 'YYYY-MM-DD HH:mm', tz);
  return d.isValid() ? d.valueOf() : null;
}

function ms(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

/** Số phút xe ở trong farm (vào → ra). Thiếu một đầu → null. */
export function soPhutTrongFarm(vao: string | null | undefined, ra: string | null | undefined): number | null {
  const a = ms(vao);
  const b = ms(ra);
  if (a == null || b == null || b < a) return null;
  return Math.round((b - a) / 60000);
}

/** Số phút đã ở trong farm tính tới `bayGio` (xe chưa ra). */
export function soPhutDangOTrongFarm(vao: string | null | undefined, bayGio: number = Date.now()): number | null {
  const a = ms(vao);
  if (a == null || bayGio < a) return null;
  return Math.round((bayGio - a) / 60000);
}

/** Vào thực tế so với "từ giờ" đăng ký: dương = trễ, âm = sớm, null = thiếu dữ liệu. */
export function soPhutVaoTre(
  ngay: string,
  gioTu: string | null | undefined,
  vao: string | null | undefined,
  tz = TZ_MAC_DINH
): number | null {
  const moc = mocGioDangKy(ngay, gioTu, tz);
  const a = ms(vao);
  if (moc == null || a == null) return null;
  return Math.round((a - moc) / 60000);
}

/**
 * Ra thực tế so với "đến giờ" đăng ký: dương = quá giờ. "Đến giờ" nhỏ hơn "từ giờ"
 * nghĩa là khung giờ vắt qua nửa đêm → tính sang ngày hôm sau.
 */
export function soPhutRaQuaGio(
  ngay: string,
  gioTu: string | null | undefined,
  gioDen: string | null | undefined,
  ra: string | null | undefined,
  tz = TZ_MAC_DINH
): number | null {
  let moc = mocGioDangKy(ngay, gioDen, tz);
  const b = ms(ra);
  if (moc == null || b == null) return null;
  const tu = mocGioDangKy(ngay, gioTu, tz);
  if (tu != null && moc < tu) moc += 24 * 60 * 60000;
  return Math.round((b - moc) / 60000);
}

/** Ngưỡng coi là "trễ/quá giờ" (phút) — lệch vài phút không tính. */
export const NGUONG_TRE_PHUT = 15;

/** "2 giờ 15 phút" / "45 phút" / "1 ngày 3 giờ". */
export function formatThoiLuong(phut: number | null | undefined): string {
  if (phut == null || !Number.isFinite(phut)) return '—';
  const p = Math.abs(Math.round(phut));
  const ngay = Math.floor(p / 1440);
  const gio = Math.floor((p % 1440) / 60);
  const phutLe = p % 60;
  const parts: string[] = [];
  if (ngay) parts.push(`${ngay} ngày`);
  if (gio) parts.push(`${gio} giờ`);
  if (phutLe || parts.length === 0) parts.push(`${phutLe} phút`);
  return parts.join(' ');
}

/** Giá trị cho `<input type="datetime-local">` (YYYY-MM-DDTHH:mm) tại múi giờ `tz`. */
export function toDateTimeLocalValue(iso: string | number | Date, tz = TZ_MAC_DINH): string {
  return dayjs(iso).tz(tz).format('YYYY-MM-DDTHH:mm');
}

/** Ngược lại: chuỗi datetime-local (hiểu theo `tz`) → ISO UTC; không hợp lệ → null. */
export function fromDateTimeLocalValue(v: string, tz = TZ_MAC_DINH): string | null {
  if (!v) return null;
  const d = dayjs.tz(v, 'YYYY-MM-DDTHH:mm', tz);
  return d.isValid() ? d.toISOString() : null;
}
