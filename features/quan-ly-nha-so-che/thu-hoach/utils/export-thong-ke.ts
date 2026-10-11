/**
 * Tải báo cáo thống kê thu hoạch dạng XLSX (PDF / DOC do khung in dùng chung chụp từ bản xem trước).
 */
import type { TFunction } from 'i18next';
import type { PivotThongKe } from '../core/stats-pivot';
import type { CheDoThongKe } from '../core/stats-pivot';
import { taoAoaThongKe } from '../core/thong-ke-xlsx';
import { getTodayISO } from '../../../../lib/utils';

export function tenFileThongKe(cheDo: CheDoThongKe): string {
  return `bao-cao-thu-hoach-theo-${cheDo}-${getTodayISO()}`;
}

export async function taiXlsxThongKe(
  pivot: PivotThongKe,
  cheDo: CheDoThongKe,
  nhanCot: string[],
  tenFarm: (fk: string) => string,
  tieuDe: string,
  moTaLoc: string,
  t: TFunction
): Promise<void> {
  const XLSX = await import('xlsx');
  const aoa = taoAoaThongKe(pivot, nhanCot, tenFarm, {
    tieuDe,
    moTaLoc,
    farm: t('thuHoach.stats.colFarm'),
    chiTieu: t('thuHoach.stats.colChiTieu'),
    kh: t('thuHoach.stats.metricKH'),
    tt: t('thuHoach.stats.metricTT'),
    cl: t('thuHoach.stats.metricCL'),
    tongCot: t('thuHoach.stats.colTotalKy'),
    tongHang: t(`thuHoach.stats.rowTotal.${cheDo}`),
  });
  const soCot = nhanCot.length + 3;
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: soCot - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: soCot - 1 } },
  ];
  ws['!cols'] = [{ wch: 22 }, { wch: 20 }, ...nhanCot.map(() => ({ wch: 11 })), { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t(`thuHoach.stats.cheDo.${cheDo}`).slice(0, 31));
  XLSX.writeFile(wb, `${tenFileThongKe(cheDo)}.xlsx`);
}
