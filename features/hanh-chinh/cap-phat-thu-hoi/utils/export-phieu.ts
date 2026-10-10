/**
 * Xuất phiếu cấp phát/thu hồi ra PDF, DOC, XLSX.
 * PDF: jsPDF + autotable. DOC: HTML table (Word). XLSX: SheetJS.
 */
import type { PhieuCapPhatThuHoi } from '../core/types';
import { formatDate, formatDateTimeShort, formatDateVietnameseLong, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import { getLoaiPhieuLabel } from '../core/constants';

function safe(v: string | null | undefined): string {
  if (v == null || v === '') return '–';
  return String(v);
}

export function fileName(phieu: PhieuCapPhatThuHoi): string {
  const slug = `${phieu.ma_phieu}_${phieu.loai_phieu}`.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Phieu_CPTH_${slug}_${getTodayISODate()}`;
}

export interface PhieuExportRow {
  ma_phieu: string;
  loai_phieu: string;
  ten_nguoi_giu_truoc: string;
  ten_nguoi_giu_sau: string;
  ngay_thuc_hien: string;
  ten_nguoi_thuc_hien: string;
  ghi_chu: string;
  tg_cap_nhat: string;
}

export function phieuToExportRow(p: PhieuCapPhatThuHoi): PhieuExportRow {
  return {
    ma_phieu: p.ma_phieu,
    loai_phieu: getLoaiPhieuLabel(p.loai_phieu, i18n.t),
    ten_nguoi_giu_truoc: p.ten_nguoi_giu_truoc ?? '',
    ten_nguoi_giu_sau: p.ten_nguoi_giu_sau ?? '',
    ngay_thuc_hien: formatDate(p.ngay_thuc_hien),
    ten_nguoi_thuc_hien: p.ten_nguoi_thuc_hien ?? '',
    ghi_chu: p.ghi_chu ?? '',
    tg_cap_nhat: formatDateTimeShort(p.tg_cap_nhat),
  };
}

export const PHIEU_EXPORT_COLUMNS: { key: keyof PhieuExportRow; label: string }[] = [
  { key: 'ma_phieu', label: i18n.t('capPhatThuHoi.store.maPhieuCol') },
  { key: 'loai_phieu', label: i18n.t('capPhatThuHoi.store.loaiCol') },
  { key: 'ten_nguoi_giu_truoc', label: i18n.t('capPhatThuHoi.store.nguoiGiuTruocCol') },
  { key: 'ten_nguoi_giu_sau', label: i18n.t('capPhatThuHoi.store.nguoiGiuSauCol') },
  { key: 'ngay_thuc_hien', label: i18n.t('capPhatThuHoi.store.ngayCol') },
  { key: 'ten_nguoi_thuc_hien', label: i18n.t('capPhatThuHoi.store.nguoiThucHienCol') },
  { key: 'ghi_chu', label: i18n.t('capPhatThuHoi.store.ghiChuCol') },
  { key: 'tg_cap_nhat', label: i18n.t('capPhatThuHoi.store.updatedCol') },
];

/* ------------------------------------------------------------------ */
/*  DOC: table-based HTML (Word)                                       */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  XLSX                                                               */
/* ------------------------------------------------------------------ */

export async function exportPhieuToXLSX(phieu: PhieuCapPhatThuHoi): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const chiTiet = phieu.chi_tiet ?? [];
  const loaiLabel = getLoaiPhieuLabel(phieu.loai_phieu, t);

  const rows: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[i18n.t('company.address'), info.address]] : []),
    ...(info.email ? [[i18n.t('company.email'), info.email]] : []),
    ...(info.phone ? [[i18n.t('company.phone'), info.phone]] : []),
    [],
    [formatDateVietnameseLong(phieu.ngay_thuc_hien)],
    [`PHIẾU ${loaiLabel.toUpperCase()}`],
    [t('capPhatThuHoi.store.maPhieuCol'), phieu.ma_phieu],
    [t('capPhatThuHoi.preview.nguoiGiao'), safe(phieu.ten_nguoi_giu_truoc)],
    [t('capPhatThuHoi.preview.nguoiNhan'), safe(phieu.ten_nguoi_giu_sau)],
    [t('capPhatThuHoi.store.nguoiThucHienCol'), safe(phieu.ten_nguoi_thuc_hien)],
    [t('capPhatThuHoi.store.ghiChuCol'), safe(phieu.ghi_chu)],
    [],
    ['TT', t('capPhatThuHoi.store.maTaiSanCol'), t('capPhatThuHoi.store.taiSanCol'), t('capPhatThuHoi.store.noiLuuTruocCol'), t('capPhatThuHoi.store.noiLuuSauCol'), t('capPhatThuHoi.store.ghiChuCol')],
  ];

  chiTiet.forEach((ct, idx) => {
    rows.push([
      idx + 1,
      safe(ct.ma_tai_san),
      safe(ct.ten_tai_san),
      safe(ct.ten_noi_luu_truoc),
      safe(ct.ten_noi_luu_sau),
      safe(ct.ghi_chu),
    ]);
  });

  if (chiTiet.length > 0) {
    rows.push([t('capPhatThuHoi.preview.totalAssets'), chiTiet.length, '', '', '', '']);
  }

  rows.push([]);
  rows.push([t('capPhatThuHoi.preview.signNguoiGiao'), t('capPhatThuHoi.preview.signNguoiNhan'), t('capPhatThuHoi.preview.signNguoiThucHien')]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 32 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu_CPTH');
  XLSX.writeFile(wb, `${fileName(phieu)}.xlsx`);
}
