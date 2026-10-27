/**
 * Tuần ISO 8601 cho phiếu Đánh giá đầu vào — thuần, ngày dạng chuỗi 'YYYY-MM-DD'.
 * Tính hoàn toàn bằng UTC nên không lệch theo múi giờ trình duyệt.
 * `ngayDauTuanIso` cùng công thức với `fn_dgdv_ngay_dau_tuan` (migration 052).
 */
import { soTuanIso } from '../../../../lib/am-lich';
import type { TuanIso } from './types';

const MOT_NGAY = 86_400_000;
const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Số tuần cộng thêm từ tuần chích bắp để gợi ý tuần thu hoạch. */
export const SO_TUAN_CHICH_BAP_DEN_THU_HOACH = 10;

function msTuYmd(ymd: string): number {
  const m = YMD_RE.exec(ymd);
  if (!m) throw new Error(`Ngày không hợp lệ (cần YYYY-MM-DD): ${ymd}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function ymdTuMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Cộng `soNgay` (âm được) vào ngày. */
export function congNgay(ymd: string, soNgay: number): string {
  return ymdTuMs(msTuYmd(ymd) + soNgay * MOT_NGAY);
}

/** Thứ Hai của tuần ISO (nam, tuan): thứ Hai của tuần chứa 04/01 + (tuan - 1) tuần. */
export function ngayDauTuanIso(nam: number, tuan: number): string {
  const ngay4Thang1 = Date.UTC(nam, 0, 4);
  const thu2Tuan1 = ngay4Thang1 - ((new Date(ngay4Thang1).getUTCDay() + 6) % 7) * MOT_NGAY;
  return ymdTuMs(thu2Tuan1 + (tuan - 1) * 7 * MOT_NGAY);
}

/** 7 ngày của tuần (T2 → CN). */
export function cacNgayCuaTuan(nam: number, tuan: number): string[] {
  const dau = ngayDauTuanIso(nam, tuan);
  return Array.from({ length: 7 }, (_, i) => congNgay(dau, i));
}

/** (năm ISO, tuần ISO) chứa ngày. */
export function tuanIsoCuaNgay(ymd: string): TuanIso {
  const d = new Date(msTuYmd(ymd));
  return soTuanIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Năm ISO có 52 hay 53 tuần (28/12 luôn nằm trong tuần cuối). */
export function soTuanIsoTrongNam(nam: number): number {
  return tuanIsoCuaNgay(`${nam}-12-28`).tuan;
}

/** Tuần cách `buoc` tuần (mặc định tuần kế tiếp; âm = lùi), tự qua năm. */
export function tuanKeTiep(t: TuanIso, buoc = 1): TuanIso {
  return tuanIsoCuaNgay(congNgay(ngayDauTuanIso(t.nam, t.tuan), buoc * 7));
}

/** Ngày có thuộc tuần ISO (nam, tuan) không. */
export function ngayThuocTuan(ymd: string, nam: number, tuan: number): boolean {
  const t = tuanIsoCuaNgay(ymd);
  return t.nam === nam && t.tuan === tuan;
}

/** So sánh 2 tuần (âm nếu a trước b). */
export function soSanhTuan(a: TuanIso, b: TuanIso): number {
  return a.nam - b.nam || a.tuan - b.tuan;
}

/** Mọi ngày từ `tu` đến `den` (gồm cả hai đầu); `den < tu` → rỗng. */
export function cacNgayTrongKhoang(tu: string, den: string): string[] {
  const a = msTuYmd(tu);
  const b = msTuYmd(den);
  const ds: string[] = [];
  for (let ms = a; ms <= b; ms += MOT_NGAY) ds.push(ymdTuMs(ms));
  return ds;
}

/**
 * Gợi ý tuần thu hoạch = tuần chích bắp + 10 tuần: dời từng đầu khoảng chích bắp +70 ngày
 * (chích bắp T2–CN → thu hoạch T2–CN của tuần +10). Thiếu đầu nào thì đầu đó null.
 */
export function goiYThuHoach(
  chichBapTu: string | null,
  chichBapDen: string | null
): { thu_hoach_tu: string | null; thu_hoach_den: string | null } {
  const lech = SO_TUAN_CHICH_BAP_DEN_THU_HOACH * 7;
  return {
    thu_hoach_tu: chichBapTu ? congNgay(chichBapTu, lech) : null,
    thu_hoach_den: chichBapDen ? congNgay(chichBapDen, lech) : null,
  };
}
