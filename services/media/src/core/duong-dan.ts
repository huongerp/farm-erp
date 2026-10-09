/**
 * Luật thuần của service ảnh: thư mục được phép, tên file lưu, kiểm đường dẫn khi phục vụ.
 * Không đụng ổ đĩa / mạng — test cạnh file.
 */

/** Mỗi module tải ảnh lên một thư mục riêng. Thêm module mới → thêm tên ở đây. */
export const THU_MUC_HOP_LE = [
  'hang-hoa',
  'tai-san',
  'nhan-vien',
  'hop-dong',
  'dang-ky-nhan-hang',
  'bao-cao-nhan-cong',
  'giam-sat-chat-luong',
  'cong-ty',
] as const;
export type ThuMuc = (typeof THU_MUC_HOP_LE)[number];

export function laThuMucHopLe(v: unknown): v is ThuMuc {
  return typeof v === 'string' && (THU_MUC_HOP_LE as readonly string[]).includes(v);
}

export type DinhDangLuu = 'jpg' | 'png';

/** Ảnh có kênh trong suốt (logo PNG) giữ PNG để không thành nền đen; còn lại JPEG. */
export function chonDinhDang(coKenhAlpha: boolean): DinhDangLuu {
  return coKenhAlpha ? 'png' : 'jpg';
}

/**
 * Đường dẫn tương đối trong kho: `<thu_muc>/<yyyy>/<mm>/<ma>.<duoi>`.
 * `ma` là 32 ký tự hex ngẫu nhiên (128 bit) — link công khai nhưng không đoán được.
 */
export function taoDuongDanLuu(thuMuc: ThuMuc, ngay: Date, ma: string, duoi: DinhDangLuu): string {
  if (!/^[0-9a-f]{32}$/.test(ma)) throw new Error('Mã file phải là 32 ký tự hex.');
  const nam = String(ngay.getUTCFullYear());
  const thang = String(ngay.getUTCMonth() + 1).padStart(2, '0');
  return `${thuMuc}/${nam}/${thang}/${ma}.${duoi}`;
}

const MAU_DUONG_DAN = /^([a-z0-9-]+)\/(\d{4})\/(\d{2})\/([0-9a-f]{32})\.(jpg|png)$/;

/**
 * Đường dẫn xin phục vụ (sau `/f/`) chỉ hợp lệ khi đúng khuôn `taoDuongDanLuu` tạo ra —
 * chặn mọi `..`, `/` thừa, ký tự lạ thay vì cố "làm sạch" chuỗi.
 */
export function docDuongDanPhucVu(p: string): { duongDan: string; contentType: string } | null {
  const m = MAU_DUONG_DAN.exec(p);
  if (!m || !laThuMucHopLe(m[1])) return null;
  return { duongDan: p, contentType: m[5] === 'png' ? 'image/png' : 'image/jpeg' };
}

/** URL công khai trả về cho app (tương đối — đổi domain không phải sửa dữ liệu). */
export function urlCongKhai(duongDan: string): string {
  return `/media/f/${duongDan}`;
}
