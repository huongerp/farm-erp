/**
 * Xuất phiếu hành chính ra XLSX. Bản in / PDF / DOC dựng từ component React
 * `components/preview/PhieuHanhChinhPreview` qua khung in dùng chung.
 */
import i18n from '../../../../lib/i18n';
import { formatDate, getTodayISODate } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { AdminFormRequest } from '../core/types';
import { duLieuPhieuIn } from '../core/phieu-in';

export function tenFilePhieuHanhChinh(p: AdminFormRequest): string {
  return `Phieu_hanh_chinh_PHC-${p.id.padStart(5, '0')}_${getTodayISODate()}`;
}

export async function exportPhieuHanhChinhXLSX(p: AdminFormRequest): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const d = duLieuPhieuIn(p, t, formatDate);
  const info = useUIStore.getState().companyInfo;
  const rows: string[][] = [
    [info.companyName ?? ''],
    [d.tieuDe],
    [t('adminForm.print.soPhieu'), d.soPhieu],
    [t('adminForm.print.ngayLap'), d.ngayLap],
    [t('adminForm.print.hoTen'), d.nguoiDeNghi],
    [t('adminForm.print.phongBan'), d.phongBan],
    [t('adminForm.print.loaiPhieu'), d.loaiPhieu],
    [t('adminForm.print.thoiGian'), d.thoiGian],
    ...(d.soNgay != null ? [[t('adminForm.print.soNgay'), d.soNgay]] : []),
    [t('adminForm.print.lyDo'), d.lyDo],
    [t('adminForm.print.trangThai'), t(`adminForm.print.dau.${d.ketQua}`)],
    [t('adminForm.print.ghiChu'), d.ghiChu],
    [t('adminForm.print.ngayXuLy'), d.ngayXuLy ?? ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 60 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu');
  XLSX.writeFile(wb, `${tenFilePhieuHanhChinh(p)}.xlsx`);
}
