/**
 * Xuất phiếu bảo trì / sửa chữa ra XLSX. Bản in / PDF / DOC dựng từ component React
 * `components/preview/PhieuBaoTriPreview` qua khung in dùng chung.
 */
import i18n from '../../../../lib/i18n';
import { formatCurrency, formatDate, getTodayISODate } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { PhieuBaoTriSuaChua } from '../core/types';
import { duLieuPhieuIn, type DuLieuPhieuIn } from '../core/phieu-in';

const t = (k: string) => i18n.t(`baoTriSuaChua.print.${k}`);

function duLieu(p: PhieuBaoTriSuaChua): DuLieuPhieuIn {
  return duLieuPhieuIn(p, i18n.t.bind(i18n), { tien: formatCurrency, ngayGio: formatDate });
}

export function tenFilePhieuBaoTri(p: PhieuBaoTriSuaChua): string {
  return `Phieu_bao_tri_${p.ma_phieu}_${getTodayISODate()}`;
}

export async function exportPhieuBaoTriXLSX(p: PhieuBaoTriSuaChua): Promise<void> {
  const XLSX = await import('xlsx');
  const d = duLieu(p);
  const info = useUIStore.getState().companyInfo;
  const rows: (string | number)[][] = [
    [info.companyName ?? ''],
    [t('title')],
    [t('soPhieu'), d.soPhieu],
    [t('ngay'), d.ngay],
    [t('ngayLap'), d.ngayLap],
    [t('nguoiDeNghi'), d.nguoiDeNghi],
    [t('chiNhanh'), d.chiNhanh],
    [t('taiSan'), d.taiSan],
    [t('hangMuc'), d.hangMuc],
    [t('moTa'), d.moTa],
    [t('nhaCungCap'), d.nhaCungCap],
    [t('soTien'), Number(p.so_tien) || 0],
    [t('bangChu'), d.soTienChu],
    [t('ghiChu'), d.ghiChu],
    [t('trangThai'), d.trangThaiLabel],
    [t('nguoiDuyet'), d.nguoiDuyet],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 60 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu');
  XLSX.writeFile(wb, `${tenFilePhieuBaoTri(p)}.xlsx`);
}
