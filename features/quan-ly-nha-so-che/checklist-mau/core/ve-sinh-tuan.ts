/**
 * Phiếu vệ sinh tuần (mẫu loai = 've_sinh_tuan', migration 080): lưới T2–CN, mỗi hạng mục chỉ
 * tích những ngày có lịch theo tần suất của mẫu. Khớp hàm SQL fn_cl_vs_lich / fn_cl_vs_tinh_kq.
 *
 * Quy ước thứ: 2..7 = T2..T7, 8 = CN. Phiếu lưu `ngay` = thứ Hai đầu tuần.
 */
import type { TanSuatVeSinh } from './types';

/** Kết quả một ô (trùng KetQuaCl của checklist-ban-giao; khai riêng để mẫu không phụ thuộc module phiếu). */
type KetQuaCl = 'dat' | 'khong_dat';

export const THU_TRONG_TUAN = [2, 3, 4, 5, 6, 7, 8] as const;

/** Kết quả từng ngày: khoá là thứ ("2".."8"). */
export type KqNgay = Partial<Record<string, KetQuaCl>>;

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Cộng ngày trên chuỗi YYYY-MM-DD. */
export function congNgay(ymd: string, so: number): string {
  const d = parseYmd(ymd);
  d.setUTCDate(d.getUTCDate() + so);
  return toYmd(d);
}

/** Thứ Hai của tuần chứa ngày (tuần T2–CN, như date_trunc('week') của Postgres). */
export function dauTuan(ymd: string): string {
  const d = parseYmd(ymd);
  const lech = (d.getUTCDay() + 6) % 7; // T2 → 0, CN → 6
  return congNgay(ymd, -lech);
}

/** Ngày (YYYY-MM-DD) của một thứ trong tuần bắt đầu `tuan` (thứ Hai). */
export function ngayCuaThu(tuan: string, thu: number): string {
  return congNgay(tuan, thu - 2);
}

/** Các thứ có lịch làm trong tuần. Không có tần suất = hằng ngày. */
export function lichVeSinh(tanSuat: TanSuatVeSinh | null | undefined, tuan: string): number[] {
  if (!tanSuat || tanSuat.kieu === 'hang_ngay') return [...THU_TRONG_TUAN];
  if (tanSuat.kieu === 'thu') {
    return [...new Set(tanSuat.thu)].filter((t) => t >= 2 && t <= 8).sort((a, b) => a - b);
  }
  // cuoi_thang: chỉ làm nếu thứ đó là thứ cùng loại cuối cùng của tháng (7 ngày sau đã sang tháng khác).
  const t = tanSuat.thu;
  if (t < 2 || t > 8) return [];
  const ngay = ngayCuaThu(tuan, t);
  return congNgay(ngay, 7).slice(5, 7) !== ngay.slice(5, 7) ? [t] : [];
}

/**
 * Kết quả cả dòng từ các ô ngày: đủ mọi ngày có lịch → K.Đạt nếu có ngày K.Đạt, ngược lại Đạt;
 * còn thiếu ngày → null (chưa tích). Lịch rỗng → null (dòng như vậy không được tạo trên phiếu).
 */
export function tinhKqVeSinh(lich: readonly number[], kqNgay: KqNgay | null | undefined): KetQuaCl | null {
  if (lich.length === 0) return null;
  let khongDat = false;
  for (const t of lich) {
    const v = kqNgay?.[String(t)];
    if (v !== 'dat' && v !== 'khong_dat') return null;
    if (v === 'khong_dat') khongDat = true;
  }
  return khongDat ? 'khong_dat' : 'dat';
}

/** Số ô ngày có lịch nhưng chưa tích. */
export function soOChuaTich(lich: readonly number[], kqNgay: KqNgay | null | undefined): number {
  return lich.filter((t) => {
    const v = kqNgay?.[String(t)];
    return v !== 'dat' && v !== 'khong_dat';
  }).length;
}

/** Ô kế tiếp khi bấm: trống → Đạt → K.Đạt → trống. */
export function kqKeTiep(v: KetQuaCl | null | undefined): KetQuaCl | null {
  if (v == null) return 'dat';
  if (v === 'dat') return 'khong_dat';
  return null;
}

/** Nhãn ngắn của thứ: T2..T7, CN. */
export function nhanThu(thu: number): string {
  return thu === 8 ? 'CN' : `T${thu}`;
}

/** Hàm dịch tối thiểu (i18next `t`) — để core không phụ thuộc React. */
export type DichFn = (key: string, opts?: Record<string, unknown>) => string;

/** Mô tả tần suất để hiện trên phiếu / mẫu: "Hằng ngày", "T2, T4, T6", "T7 cuối tháng". */
export function moTaTanSuat(
  tanSuat: TanSuatVeSinh | null | undefined,
  t: DichFn,
): string {
  // Key của checklist-mau — module phiếu nạp kèm locale này (FEATURE_I18N_DEPS).
  if (!tanSuat || tanSuat.kieu === 'hang_ngay') return t('checklistMau.hangMuc.tanSuatKieu.hang_ngay');
  if (tanSuat.kieu === 'thu') {
    const ds = lichVeSinh(tanSuat, '2026-01-05');
    return ds.length === 7 ? t('checklistMau.hangMuc.tanSuatKieu.hang_ngay') : ds.map(nhanThu).join(', ');
  }
  return t('checklistMau.hangMuc.cuoiThangMoTa', { thu: nhanThu(tanSuat.thu) });
}

/** Đọc tan_suat jsonb từ DB; sai dạng → null (= hằng ngày). */
export function parseTanSuat(raw: unknown): TanSuatVeSinh | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as { kieu?: unknown; thu?: unknown };
  if (o.kieu === 'hang_ngay') return { kieu: 'hang_ngay' };
  if (o.kieu === 'thu' && Array.isArray(o.thu)) {
    return { kieu: 'thu', thu: o.thu.map(Number).filter((n) => Number.isInteger(n) && n >= 2 && n <= 8) };
  }
  if (o.kieu === 'cuoi_thang' && Number.isInteger(Number(o.thu))) return { kieu: 'cuoi_thang', thu: Number(o.thu) };
  return null;
}
