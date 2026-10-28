/**
 * Tuần FARM cho phiếu Đánh giá đầu vào — thuần, ngày dạng chuỗi 'YYYY-MM-DD'.
 * Tính hoàn toàn bằng UTC nên không lệch theo múi giờ trình duyệt.
 *
 * Quy ước tuần farm (KHÁC tuần ISO — module khác vẫn dùng `soTuanIso` ở lib/am-lich):
 *   - tuần bắt đầu thứ Hai, kết thúc Chủ nhật;
 *   - `nam` = năm dương lịch của Chủ nhật cuối tuần;
 *   - tuần 1 = tuần (T2–CN) chứa ngày 01/01 của `nam`;
 *   - tuan = (thứ Hai của tuần − thứ Hai của tuần chứa 01/01/nam) / 7 + 1.
 * Vd. 29/12/2025 → tuần 1/2026; 28/12/2026 → tuần 1/2027.
 * `ngayDauTuanFarm` / `tuanFarmCuaNgay` cùng công thức với `fn_dgdv_ngay_dau_tuan_farm` /
 * `fn_dgdv_tuan_farm` (migration 057).
 */
import i18n from '../../../../lib/i18n';
import type { TuanFarm } from './types';

const MOT_NGAY = 86_400_000;
const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Bảng dự thu farm: chích bắp tuần T → thu hoạch tuần T + 9. */
export const SO_TUAN_CHICH_BAP_DEN_THU_HOACH = 9;

function msTuYmd(ymd: string): number {
  const m = YMD_RE.exec(ymd);
  if (!m) throw new Error(`Ngày không hợp lệ (cần YYYY-MM-DD): ${ymd}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function ymdTuMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Thứ Hai của tuần chứa mốc (ms UTC). */
function thu2Cua(ms: number): number {
  return ms - ((new Date(ms).getUTCDay() + 6) % 7) * MOT_NGAY;
}

/** Cộng `soNgay` (âm được) vào ngày. */
export function congNgay(ymd: string, soNgay: number): string {
  return ymdTuMs(msTuYmd(ymd) + soNgay * MOT_NGAY);
}

/** Thứ Hai của tuần farm (nam, tuan): thứ Hai của tuần chứa 01/01/nam + (tuan - 1) tuần. */
export function ngayDauTuanFarm(nam: number, tuan: number): string {
  return ymdTuMs(thu2Cua(Date.UTC(nam, 0, 1)) + (tuan - 1) * 7 * MOT_NGAY);
}

/** (năm farm, tuần farm) chứa ngày. */
export function tuanFarmCuaNgay(ymd: string): TuanFarm {
  const thu2 = thu2Cua(msTuYmd(ymd));
  const nam = new Date(thu2 + 6 * MOT_NGAY).getUTCFullYear();
  const tuan = Math.round((thu2 - thu2Cua(Date.UTC(nam, 0, 1))) / (7 * MOT_NGAY)) + 1;
  return { nam, tuan };
}

/** 7 ngày của tuần farm (T2 → CN). */
export function cacNgayCuaTuanFarm(nam: number, tuan: number): string[] {
  const dau = ngayDauTuanFarm(nam, tuan);
  return Array.from({ length: 7 }, (_, i) => congNgay(dau, i));
}

/** Năm farm có 52 hay 53 tuần = khoảng cách giữa tuần 1 của năm sau và tuần 1 của năm này. */
export function soTuanTrongNamFarm(nam: number): number {
  return Math.round((msTuYmd(ngayDauTuanFarm(nam + 1, 1)) - msTuYmd(ngayDauTuanFarm(nam, 1))) / (7 * MOT_NGAY));
}

/** Tuần cách `buoc` tuần (mặc định tuần kế tiếp; âm = lùi) — dời qua ngày nên tự qua năm. */
export function tuanKeTiep(t: TuanFarm, buoc = 1): TuanFarm {
  return tuanFarmCuaNgay(congNgay(ngayDauTuanFarm(t.nam, t.tuan), buoc * 7));
}

/** Tuần thu hoạch = tuần chích bắp + 9. */
export function tuanThuHoachTuChichBap(t: TuanFarm): TuanFarm {
  return tuanKeTiep(t, SO_TUAN_CHICH_BAP_DEN_THU_HOACH);
}

/** Tuần chích bắp = tuần thu hoạch − 9. */
export function tuanChichBapTuThuHoach(t: TuanFarm): TuanFarm {
  return tuanKeTiep(t, -SO_TUAN_CHICH_BAP_DEN_THU_HOACH);
}

/** Ngày có thuộc tuần farm (nam, tuan) không. */
export function ngayThuocTuanFarm(ymd: string, nam: number, tuan: number): boolean {
  const t = tuanFarmCuaNgay(ymd);
  return t.nam === nam && t.tuan === tuan;
}

/** So sánh 2 tuần (âm nếu a trước b). */
export function soSanhTuan(a: TuanFarm, b: TuanFarm): number {
  return a.nam - b.nam || a.tuan - b.tuan;
}

/** «24/08 – 30/08» của tuần farm. */
export function khoangTuanFarm(t: TuanFarm): string {
  const dm = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;
  const dau = ngayDauTuanFarm(t.nam, t.tuan);
  return `${dm(dau)} – ${dm(congNgay(dau, 6))}`;
}

/** «Tuần 35 (24/08 – 30/08)». */
export function nhanTuanFarm(t: TuanFarm): string {
  const [tu, den] = khoangTuanFarm(t).split(' – ');
  return i18n.t('danhGiaDauVao.luoi.tuanKhoang', {
    tuan: t.tuan,
    tu,
    den,
    defaultValue: 'Tuần {{tuan}} ({{tu}} – {{den}})',
  });
}

/** Dải tuần quanh `t`: từ `t − truoc` tới `t + sau` (gồm `t`), tự qua năm. */
export function cacTuanQuanh(t: TuanFarm, truoc: number, sau: number): TuanFarm[] {
  return Array.from({ length: truoc + sau + 1 }, (_, i) => tuanKeTiep(t, i - truoc));
}

/** Khoá chuỗi của tuần farm cho bộ lọc / option: '2026-44'. */
export function khoaTuanFarm(t: TuanFarm): string {
  return `${t.nam}-${String(t.tuan).padStart(2, '0')}`;
}

/** Ngược của `khoaTuanFarm`; chuỗi sai dạng → null. */
export function docKhoaTuanFarm(k: string): TuanFarm | null {
  const m = /^(\d{4})-(\d{1,2})$/.exec(k);
  if (!m) return null;
  const t = { nam: Number(m[1]), tuan: Number(m[2]) };
  return t.tuan >= 1 && t.tuan <= soTuanTrongNamFarm(t.nam) ? t : null;
}

/** Mọi ngày từ `tu` đến `den` (gồm cả hai đầu); `den < tu` → rỗng. */
export function cacNgayTrongKhoang(tu: string, den: string): string[] {
  const a = msTuYmd(tu);
  const b = msTuYmd(den);
  const ds: string[] = [];
  for (let ms = a; ms <= b; ms += MOT_NGAY) ds.push(ymdTuMs(ms));
  return ds;
}
