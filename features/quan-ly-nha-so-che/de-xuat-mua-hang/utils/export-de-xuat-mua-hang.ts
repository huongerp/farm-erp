/**
 * Xuất phiếu đề xuất vật tư ra PDF, DOC, XLSX.
 *
 * - PDF  : html2canvas qua jsPDF (font Arial, hỗ trợ tiếng Việt).
 * - DOC  : HTML table-based (Word) + UTF-8 BOM + Times New Roman.
 * - XLSX : SheetJS aoa_to_sheet (Unicode).
 */
import type { DeXuatMuaHang, DeXuatMuaHangChiTiet } from '../core/types';
import { formatDate, formatDateVietnameseLong, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function safe(v: string | number | null | undefined): string {
  if (v == null || v === '') return '–';
  return String(v);
}

export function fileName(p: DeXuatMuaHang): string {
  const slug = p.so_phieu.replace(/\s+/g, '_').replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `De_xuat_mua_hang_${slug}_${getTodayISODate()}`;
}

function colHeaders(t: (k: string) => string) {
  return [
    'TT',
    t('deXuatMuaHang.form.itemName'),
    t('deXuatMuaHang.form.specs'),
    t('deXuatMuaHang.form.unit'),
    t('deXuatMuaHang.form.quantity'),
    t('deXuatMuaHang.form.note'),
  ];
}

/* ------------------------------------------------------------------ */
/*  HTML builder – cho PDF (html2canvas)                               */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  DOC: table-based HTML (Word)                                      */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Export: PDF                                                        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Export: DOC                                                        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Export: XLSX                                                       */
/* ------------------------------------------------------------------ */

export async function exportDeXuatMuaHangToXLSX(
  phieu: DeXuatMuaHang,
  chiTiet: DeXuatMuaHangChiTiet[],
): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;

  const rows: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    ...(info.email ? [[t('company.email'), info.email]] : []),
    ...(info.phone ? [[t('company.phone'), info.phone]] : []),
    [],
    [formatDateVietnameseLong(phieu.ngay)],
    ['ĐỀ XUẤT VẬT TƯ'],
    [t('deXuatMuaHang.form.code'), phieu.so_phieu],
    [t('deXuatMuaHang.preview.donVi'), phieu.ten_noi_de_xuat ?? '–'],
    [t('deXuatMuaHang.preview.nguoiTao'), phieu.ten_nguoi_de_xuat ?? '–'],
    [t('deXuatMuaHang.preview.ngayLap'), formatDate(phieu.ngay)],
    [t('deXuatMuaHang.form.requiredDate'), formatDate(phieu.ngay_can)],
    [t('deXuatMuaHang.form.notes'), safe(phieu.ghi_chu)],
    [],
    colHeaders(t),
  ];

  chiTiet.forEach((c, idx) => {
    rows.push([
      idx + 1,
      safe(c.ten_hang),
      safe(c.thong_so),
      safe(c.don_vi_tinh),
      Number(c.so_luong) || 0,
      safe(c.ghi_chu),
    ]);
  });

  rows.push([]);
  rows.push([
    t('deXuatMuaHang.preview.signCreator'),
    t('deXuatMuaHang.preview.signChecker'),
    t('deXuatMuaHang.preview.signRelated'),
    t('deXuatMuaHang.preview.signApprover'),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 28 },
    { wch: 20 },
    { wch: 10 },
    { wch: 12 },
    { wch: 22 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'De_xuat_mua_hang');
  XLSX.writeFile(wb, `${fileName(phieu)}.xlsx`);
}
