/**
 * URL trang in Bảng đánh giá: /quan-ly-nha-so-che/danh-gia-dau-vao/preview?cn=<id>&tu=YYYY-MM-DD&den=YYYY-MM-DD
 * hoặc /preview?id=<id phiếu> cho đúng một chuyến; phiếu tuần dùng đường dẫn /in-tuan riêng.
 */
import { chuanHoaKhoang } from './khoang-ngay';
import { soTuanTrongNamFarm } from '../core/tuan';
import { LOC_KSC } from '../core/tong-hop';

export const DGDV_PREVIEW_PATH = '/quan-ly-nha-so-che/danh-gia-dau-vao/preview';
export const DGDV_IN_TUAN_PATH = '/quan-ly-nha-so-che/danh-gia-dau-vao/in-tuan';

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function getDgdvPreviewUrl(tu: string, den: string, idChiNhanh: string | null): string {
  const p = new URLSearchParams({ tu, den });
  if (idChiNhanh) p.set('cn', idChiNhanh);
  return `${DGDV_PREVIEW_PATH}?${p.toString()}`;
}

/** URL in một phiếu chuyến, không cộng các chuyến khác cùng ngày. */
export function getDgdvPreviewChuyenUrl(id: string): string {
  return `${DGDV_PREVIEW_PATH}?${new URLSearchParams({ id }).toString()}`;
}

export interface DgdvPreviewNgayParams {
  loai: 'ngay';
  tu: string;
  den: string;
  idChiNhanh: string | null;
}

export interface DgdvPreviewChuyenParams {
  loai: 'chuyen';
  id: string;
}

export type DgdvPreviewParams = DgdvPreviewNgayParams | DgdvPreviewChuyenParams;

/** Đọc tham số trang in; ngày sai / thiếu → null (trang báo lỗi thay vì tải sai). */
export function docThamSoPreview(sp: URLSearchParams): DgdvPreviewParams | null {
  const id = sp.get('id')?.trim();
  if (id != null) return /^\d+$/.test(id) ? { loai: 'chuyen', id } : null;
  const tu = sp.get('tu') ?? '';
  const den = sp.get('den') || tu;
  if (!YMD_RE.test(tu) || !YMD_RE.test(den)) return null;
  const k = chuanHoaKhoang(tu, den);
  const cn = sp.get('cn')?.trim();
  return { loai: 'ngay', tu: k.tu, den: k.den, idChiNhanh: cn && /^\d+$/.test(cn) ? cn : null };
}

export interface DgdvInTuanParams {
  nam: number;
  tuan: number;
  /** Rỗng = mọi chi nhánh trong phạm vi xem. */
  idChiNhanh: string[];
  /** Khoá tên tổ trưởng (`khoaTen`), rỗng = không lọc. */
  toTruong: string[];
  /** Giá trị `LOC_KSC`, rỗng = không lọc. */
  ksc: string[];
}

function docDanhSach(sp: URLSearchParams, key: string, hopLe: (v: string) => boolean): string[] | null {
  const raw = sp.get(key);
  if (raw == null || raw === '') return [];
  const ds = raw.split(',').map((v) => v.trim());
  return ds.length > 0 && ds.every(hopLe) ? [...new Set(ds)] : null;
}

/** URL in tổng hợp tuần; danh sách bộ lọc được nén bằng dấu phẩy để mang được bộ lọc đa chọn. */
export function getDgdvInTuanUrl(
  nam: number,
  tuan: number,
  idChiNhanh: readonly string[] = [],
  toTruong: readonly string[] = [],
  ksc: readonly string[] = []
): string {
  const p = new URLSearchParams({ nam: String(nam), tuan: String(tuan) });
  if (idChiNhanh.length > 0) p.set('cn', idChiNhanh.join(','));
  if (toTruong.length > 0) p.set('tt', toTruong.join(','));
  if (ksc.length > 0) p.set('ksc', ksc.join(','));
  return `${DGDV_IN_TUAN_PATH}?${p.toString()}`;
}

/** Đọc tham số phiếu tuần; năm, tuần hay bộ lọc sai → null để không in nhầm số liệu. */
export function docThamSoInTuan(sp: URLSearchParams): DgdvInTuanParams | null {
  const nam = Number(sp.get('nam'));
  const tuan = Number(sp.get('tuan'));
  if (!Number.isInteger(nam) || !Number.isInteger(tuan) || nam < 2000 || tuan < 1 || tuan > soTuanTrongNamFarm(nam)) return null;
  const idChiNhanh = docDanhSach(sp, 'cn', (v) => /^\d+$/.test(v));
  const toTruong = docDanhSach(sp, 'tt', (v) => v.length > 0);
  const ksc = docDanhSach(sp, 'ksc', (v) => v === LOC_KSC.CO || v === LOC_KSC.KHONG);
  return idChiNhanh == null || toTruong == null || ksc == null ? null : { nam, tuan, idChiNhanh, toTruong, ksc };
}
