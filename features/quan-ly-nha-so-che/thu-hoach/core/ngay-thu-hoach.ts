/**
 * Quy mỗi ô (năm, tuần ISO, thứ) của bản ghi thu hoạch về một ngày lịch thật — nền cho lọc
 * theo khoảng ngày và gộp theo tuần / tháng (tuần vắt hai tháng tự tách đúng).
 */
import type { FarmThuHoach, ThuHoachDaySuffix } from './types';
import { THU_HOACH_DAY_SUFFIXES } from './types';

const MOT_NGAY = 86_400_000;

/** Khoá farm khi bản ghi chưa gán chi nhánh. */
export const FARM_KHONG_GAN = '__none__';

/** Ngày (YYYY-MM-DD) của thứ `thu` trong tuần ISO `tuan` của năm ISO `nam`. */
export function ngayCuaThu(nam: number, tuan: number, thu: ThuHoachDaySuffix): string {
  const ngay4Thang1 = Date.UTC(nam, 0, 4);
  const thu2Tuan1 = ngay4Thang1 - ((new Date(ngay4Thang1).getUTCDay() + 6) % 7) * MOT_NGAY;
  const lech = (tuan - 1) * 7 + THU_HOACH_DAY_SUFFIXES.indexOf(thu);
  return new Date(thu2Tuan1 + lech * MOT_NGAY).toISOString().slice(0, 10);
}

/** Khoảng ngày của tuần ISO để hiện cạnh số tuần, vd "05/10 – 11/10" (thứ Hai → Chủ nhật, không kèm năm). */
export function khoangNgayTuan(nam: number, tuan: number): string {
  const dd_mm = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;
  return `${dd_mm(ngayCuaThu(nam, tuan, 't2'))} – ${dd_mm(ngayCuaThu(nam, tuan, 'cn'))}`;
}

/** Một ô ngày của một bản ghi. `nam`/`tuan` là tuần ISO của bản ghi; `thang` theo ngày lịch thật. */
export interface DongNgay {
  farmKey: string;
  farmLabel: string;
  ngay: string;
  thu: ThuHoachDaySuffix;
  nam: number;
  tuan: number;
  namLich: number;
  thang: number;
  keHoach: number;
  thucTe: number;
}

export function farmKeyCua(row: Pick<FarmThuHoach, 'id_chi_nhanh'>): string {
  return row.id_chi_nhanh != null && String(row.id_chi_nhanh) !== '' ? String(row.id_chi_nhanh) : FARM_KHONG_GAN;
}

/** Trải mỗi bản ghi thành 7 ô ngày (giữ cả ô 0 để farm vẫn có mặt trong bảng). */
export function traiPhangNgay(rows: FarmThuHoach[]): DongNgay[] {
  const out: DongNgay[] = [];
  for (const row of rows) {
    const farmKey = farmKeyCua(row);
    const farmLabel = row.ten_chi_nhanh?.trim() || (farmKey === FARM_KHONG_GAN ? '—' : farmKey);
    for (const thu of THU_HOACH_DAY_SUFFIXES) {
      const ngay = ngayCuaThu(row.nam, row.tuan, thu);
      out.push({
        farmKey,
        farmLabel,
        ngay,
        thu,
        nam: row.nam,
        tuan: row.tuan,
        namLich: Number(ngay.slice(0, 4)),
        thang: Number(ngay.slice(5, 7)),
        keHoach: Number(row[`ke_hoach_${thu}`] ?? 0),
        thucTe: Number(row[`thuc_te_${thu}`] ?? 0),
      });
    }
  }
  return out;
}
