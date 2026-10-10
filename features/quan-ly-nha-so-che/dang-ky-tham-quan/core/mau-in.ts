/** Mẫu in phiếu đăng ký tham quan: URL preview, tên file, khổ mặc định, tách giờ/phút/ngày. Thuần. */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { TZ_MAC_DINH } from '../../dang-ky-nhan-hang/core/thoi-gian';

dayjs.extend(utc);
dayjs.extend(timezone);

const GOC = '/quan-ly-nha-so-che/dang-ky-tham-quan';
/** id đặc biệt trên URL preview: phiếu trắng để khách vãng lai điền tay. */
export const ID_PHIEU_TRANG = 'trang';

/** Mặc định A5 ngang, lề hẹp — đúng cỡ phiếu giấy đang dùng ở cổng. */
export const MAC_DINH_IN = { kho: 'a5', huong: 'ngang', leMm: 8 } as const;
/** Phiếu giấy có sẵn 5 dòng khách; phiếu in đệm dòng trống tới số này để ghi tay thêm. */
export const SO_DONG_KHACH_TOI_THIEU = 5;

export const taoUrlPreview = (id: string) => `${GOC}/preview/${encodeURIComponent(id)}`;

export function tenFileIn(phieu: { id: string; ngay_dang_ky: string } | null): string {
  return phieu ? `phieu-tham-quan-${phieu.id}-${phieu.ngay_dang_ky.replace(/-/g, '')}` : 'phieu-tham-quan-trang';
}

export interface GioPhutNgay {
  gio: string;
  phut: string;
  /** dd/mm/yyyy */
  ngay: string;
}

/** Tách mốc thời gian theo múi giờ farm cho dòng "Từ: … giờ … phút, ngày …". */
export function tachGioPhutNgay(iso: string | null | undefined, tz = TZ_MAC_DINH): GioPhutNgay | null {
  if (!iso) return null;
  const d = dayjs(iso).tz(tz);
  if (!d.isValid()) return null;
  return { gio: d.format('HH'), phut: d.format('mm'), ngay: d.format('DD/MM/YYYY') };
}
