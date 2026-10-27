/**
 * URL trang in Bảng đánh giá: /quan-ly-nha-so-che/danh-gia-dau-vao/preview?cn=<id>&tu=YYYY-MM-DD&den=YYYY-MM-DD
 * In một ngày (tu = den) hoặc khoảng ngày (mỗi ngày một trang). `cn` rỗng = mọi chi nhánh trong phạm vi.
 */
import { chuanHoaKhoang } from './khoang-ngay';

export const DGDV_PREVIEW_PATH = '/quan-ly-nha-so-che/danh-gia-dau-vao/preview';

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function getDgdvPreviewUrl(tu: string, den: string, idChiNhanh: string | null): string {
  const p = new URLSearchParams({ tu, den });
  if (idChiNhanh) p.set('cn', idChiNhanh);
  return `${DGDV_PREVIEW_PATH}?${p.toString()}`;
}

/** Đọc tham số trang in; ngày sai / thiếu → null (trang báo lỗi thay vì tải sai). */
export function docThamSoPreview(sp: URLSearchParams): { tu: string; den: string; idChiNhanh: string | null } | null {
  const tu = sp.get('tu') ?? '';
  const den = sp.get('den') || tu;
  if (!YMD_RE.test(tu) || !YMD_RE.test(den)) return null;
  const k = chuanHoaKhoang(tu, den);
  const cn = sp.get('cn')?.trim();
  return { tu: k.tu, den: k.den, idChiNhanh: cn && /^\d+$/.test(cn) ? cn : null };
}
