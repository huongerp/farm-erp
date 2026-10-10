/** Chuẩn hoá danh sách khách trước khi lưu / in. Thuần. */
import { GIOI_TINH, type GioiTinh, type KhachThamQuan } from './types';

export type KhachNhap = {
  [K in keyof Omit<KhachThamQuan, 'stt'>]?: KhachThamQuan[K] | string | null;
};

const sach = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '';
  return s === '' ? null : s;
};

/** Số điện thoại: bỏ khoảng trắng, chấm, gạch; giữ dấu + ở đầu. */
export function chuanHoaSdt(v: unknown): string | null {
  const s = sach(v);
  if (!s) return null;
  const goc = s.startsWith('+') ? '+' : '';
  const so = s.replace(/[^\d]/g, '');
  return so ? goc + so : null;
}

/** Dòng nào cũng trống (kể cả họ tên) → bỏ; đánh lại STT liên tục từ 1. */
export function chuanHoaDanhSachKhach(rows: KhachNhap[]): KhachThamQuan[] {
  const out: KhachThamQuan[] = [];
  for (const r of rows) {
    const ho_ten = sach(r.ho_ten);
    const k = {
      gioi_tinh: (GIOI_TINH as readonly string[]).includes(r.gioi_tinh ?? '') ? (r.gioi_tinh as GioiTinh) : null,
      quoc_tich: sach(r.quoc_tich),
      so_dien_thoai: chuanHoaSdt(r.so_dien_thoai),
      nguoi_gioi_thieu: sach(r.nguoi_gioi_thieu),
      khu_vuc_tham_quan: sach(r.khu_vuc_tham_quan),
      don_vi_lam_viec: sach(r.don_vi_lam_viec),
    };
    if (!ho_ten && Object.values(k).every((v) => v == null)) continue;
    out.push({ stt: out.length + 1, ho_ten: ho_ten ?? '', ...k });
  }
  return out;
}

/** Bảng khách trên phiếu in: đủ khách thật + dòng trống cho tới `toiThieu` để ghi tay thêm. */
export function dongKhachIn(khach: KhachThamQuan[], toiThieu: number): (KhachThamQuan | null)[] {
  const out: (KhachThamQuan | null)[] = [...khach];
  while (out.length < toiThieu) out.push(null);
  return out;
}

/** Người đại diện mặc định: khách đầu tiên. */
export function nguoiDaiDienMacDinh(khach: KhachThamQuan[], nhap: string | null | undefined): string | null {
  return sach(nhap) ?? khach[0]?.ho_ten ?? null;
}
