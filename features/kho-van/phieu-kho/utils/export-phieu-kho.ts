/**
 * Xuất phiếu kho (nhập / xuất / chuyển) ra PDF, DOC, XLSX.
 *
 * - PDF  : html2canvas qua jsPDF (text là ảnh → font do trình duyệt render, hỗ trợ tiếng Việt).
 * - DOC  : HTML table-based (Word-safe) + UTF-8 BOM + Times New Roman.
 * - XLSX : SheetJS aoa_to_sheet (Unicode gốc, Excel mở đúng).
 */
import type { PhieuKho, PhieuKhoChiTiet, LoaiPhieuKho } from '../core/types';
import { trangThaiToI18nKey } from '../core/constants';
import { formatDateVietnameseLong, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import { sumSoLuongByPhamCap } from './sum-so-luong-by-pham-cap';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function safe(v: string | number | null | undefined): string {
  if (v == null || v === '') return '–';
  return String(v);
}

function getTrangThaiLabel(
  trangThai: string,
  t: (k: string) => string,
): string {
  return t(`phieuKho.status.${trangThaiToI18nKey(trangThai)}`);
}

function getNoiDiNoiDen(p: PhieuKho) {
  switch (p.loai) {
    case 'nhập':
      return { noiDi: p.ten_nha_cung_cap ?? '–', noiDen: p.ten_kho ?? p.kho_id ?? '–' };
    case 'xuất':
      return { noiDi: p.ten_kho ?? p.kho_id ?? '–', noiDen: p.ten_khach_hang ?? '–' };
    case 'chuyển':
      return { noiDi: p.ten_kho ?? p.kho_id ?? '–', noiDen: p.ten_kho_den ?? '–' };
    default:
      return { noiDi: '–', noiDen: '–' };
  }
}

function titleOf(loai: LoaiPhieuKho): string {
  const w = loai === 'nhập' ? 'NHẬP' : loai === 'xuất' ? 'XUẤT' : 'CHUYỂN';
  return `PHIẾU ${w} KHO`;
}

export function fileName(p: PhieuKho): string {
  const slug = `${p.so_phieu}_${p.loai}`
    .replace(/\s+/g, '_')
    .replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Phieu_kho_${slug}_${getTodayISODate()}`;
}

function colHeaders(t: (k: string) => string) {
  return [
    'TT',
    t('phieuKho.preview.danhMuc'),
    t('phieuKho.form.itemName'),
    t('phieuKho.form.phamCap'),
    t('phieuKho.form.unit'),
    t('phieuKho.form.quantity'),
    t('phieuKho.preview.soLot'),
    t('phieuKho.form.note'),
  ];
}

/** Dòng PO chỉ hiện với phiếu nhập có liên kết đơn đặt hàng. */
function getPoDisplay(phieu: PhieuKho): string | null {
  if (phieu.loai !== 'nhập') return null;
  const soPo = phieu.so_po_don_dat_hang?.trim();
  if (soPo) return soPo;
  if (phieu.id_don_dat_hang) return `#${phieu.id_don_dat_hang}`;
  return null;
}

/* ------------------------------------------------------------------ */
/*  HTML builder – dùng cho preview trên web & cho PDF (html2canvas)   */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  DOC: table-based HTML (Word không hỗ trợ flex / blob URL)          */
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

export async function exportPhieuKhoToXLSX(
  phieu: PhieuKho,
  chiTiet: PhieuKhoChiTiet[],
): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const { noiDi, noiDen } = getNoiDiNoiDen(phieu);

  const rows: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    ...(info.email ? [[t('company.email'), info.email]] : []),
    ...(info.phone ? [[t('company.phone'), info.phone]] : []),
    [],
    [formatDateVietnameseLong(phieu.ngay)],
    [titleOf(phieu.loai)],
    [t('phieuKho.form.code'), phieu.so_phieu],
    ...(getPoDisplay(phieu) ? [[t('phieuKho.detail.linkPo'), getPoDisplay(phieu)!]] : []),
    [t('phieuKho.preview.noiDi'), noiDi],
    [t('phieuKho.preview.noiDen'), noiDen],
    [t('phieuKho.form.description'), safe(phieu.mo_ta)],
    [t('phieuKho.store.statusCol'), getTrangThaiLabel(phieu.trang_thai, t)],
    [],
    colHeaders(t),
  ];

  chiTiet.forEach((c, idx) => {
    rows.push([
      idx + 1,
      safe(c.ten_danh_muc),
      safe(c.ten_hang),
      safe(c.pham_cap),
      safe(c.don_vi_tinh),
      Number(c.so_luong) || 0,
      safe(c.so_lot),
      safe(c.ghi_chu),
    ]);
  });

  if (chiTiet.length > 0) {
    const total = chiTiet.reduce((s, c) => s + (Number(c.so_luong) || 0), 0);
    rows.push([t('phieuKho.preview.totalQty'), '', '', '', '', total, '', '']);
    for (const { phamCap, soLuong } of sumSoLuongByPhamCap(chiTiet)) {
      rows.push([t('phieuKho.preview.totalQtyByPhamCap', { phamCap }), '', '', '', '', soLuong, '', '']);
    }
  }

  rows.push([]);
  rows.push([
    t('phieuKho.preview.signCreator'),
    t('phieuKho.preview.signChecker'),
    t('phieuKho.preview.signRelated'),
    t('phieuKho.preview.signApprover'),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 20 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu_kho');
  XLSX.writeFile(wb, `${fileName(phieu)}.xlsx`);
}
