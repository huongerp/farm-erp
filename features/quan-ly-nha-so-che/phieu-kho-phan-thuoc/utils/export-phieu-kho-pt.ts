/**
 * Xuất phiếu kho phân thuốc (PDF / DOC / XLSX) — không NCC/KH.
 *
 * - PDF  : html2canvas qua jsPDF (text là ảnh → font do trình duyệt render, hỗ trợ tiếng Việt);
 *          trang 2+ chừa chỗ và stamp header công ty rút gọn (text jsPDF → cần nhúng font Việt).
 * - DOC  : HTML table-based (Word-safe) + UTF-8 BOM + Times New Roman.
 * - XLSX : SheetJS aoa_to_sheet (Unicode gốc, Excel mở đúng).
 */
import type { PhieuKhoPT, PhieuKhoPTChiTiet, LoaiPhieuKhoPT } from '../core/types';
import { formatDateVietnameseLong, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import { sumSoLuongByPhamCap } from './sum-so-luong-by-pham-cap';

function safe(v: string | number | null | undefined): string {
  if (v == null || v === '') return '–';
  return String(v);
}

function getTrangThaiLabel(trangThai: string, t: (k: string) => string): string {
  const map: Record<string, string> = {
    'Chờ duyệt': 'phieuKhoPhanThuoc.status.pending',
    'Đã duyệt': 'phieuKhoPhanThuoc.status.approved',
    'Không duyệt': 'phieuKhoPhanThuoc.status.rejected',
  };
  return t(map[trangThai] ?? 'phieuKhoPhanThuoc.status.pending');
}

function getNoiDiNoiDen(p: PhieuKhoPT): { noiDi: string; noiDen: string } {
  switch (p.loai) {
    case 'nhập':
      return { noiDi: '—', noiDen: p.ten_kho ?? p.kho_id ?? '—' };
    case 'xuất':
      return { noiDi: p.ten_kho ?? p.kho_id ?? '—', noiDen: '—' };
    case 'chuyển':
      return { noiDi: p.ten_kho ?? p.kho_id ?? '—', noiDen: p.ten_kho_den ?? '—' };
    default:
      return { noiDi: '—', noiDen: '—' };
  }
}

function titleOf(loai: LoaiPhieuKhoPT): string {
  const w = loai === 'nhập' ? 'NHẬP' : loai === 'xuất' ? 'XUẤT' : 'LUÂN CHUYỂN';
  return `PHIẾU ${w} KHO NSC`;
}

export function fileName(p: PhieuKhoPT): string {
  const slug = `${p.so_phieu}_${p.loai}`
    .replace(/\s+/g, '_')
    .replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Phieu_kho_${slug}_${getTodayISODate()}`;
}

function colHeaders(t: (k: string) => string) {
  return [
    'TT',
    t('phieuKhoPhanThuoc.preview.danhMuc'),
    t('phieuKhoPhanThuoc.form.itemName'),
    t('phieuKhoPhanThuoc.form.phamCap'),
    t('phieuKhoPhanThuoc.form.unit'),
    t('phieuKhoPhanThuoc.form.quantity'),
    t('phieuKhoPhanThuoc.preview.soLot'),
    t('phieuKhoPhanThuoc.form.note'),
  ];
}

export async function exportPhieuKhoPTToXLSX(phieu: PhieuKhoPT, chiTiet: PhieuKhoPTChiTiet[]): Promise<void> {
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
    [t('phieuKhoPhanThuoc.form.code'), phieu.so_phieu],
    [t('phieuKhoPhanThuoc.preview.noiDi'), noiDi],
    [t('phieuKhoPhanThuoc.preview.noiDen'), noiDen],
    [t('phieuKhoPhanThuoc.form.description'), safe(phieu.mo_ta)],
    [t('phieuKhoPhanThuoc.store.statusCol'), getTrangThaiLabel(phieu.trang_thai, t)],
    [],
    colHeaders(t),
  ];

  chiTiet.forEach((c, idx) => {
    rows.push([
      idx + 1,
      safe(c.ten_danh_muc),
      safe(c.ten_hang ?? c.ten_hang_hoa),
      safe(c.pham_cap),
      safe(c.don_vi_tinh),
      Number(c.so_luong) || 0,
      safe(c.so_lot),
      safe(c.ghi_chu),
    ]);
  });

  if (chiTiet.length > 0) {
    const total = chiTiet.reduce((s, c) => s + (Number(c.so_luong) || 0), 0);
    rows.push([t('phieuKhoPhanThuoc.preview.totalQty'), '', '', '', '', total, '', '']);
    for (const { phamCap, soLuong } of sumSoLuongByPhamCap(chiTiet)) {
      rows.push([t('phieuKhoPhanThuoc.preview.totalQtyByPhamCap', { phamCap }), '', '', '', '', soLuong, '', '']);
    }
  }

  rows.push([]);
  rows.push([
    t('phieuKhoPhanThuoc.preview.signCreator'),
    t('phieuKhoPhanThuoc.preview.signChecker'),
    t('phieuKhoPhanThuoc.preview.signRelated'),
    t('phieuKhoPhanThuoc.preview.signApprover'),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 24 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu_kho_PT');
  XLSX.writeFile(wb, `${fileName(phieu)}.xlsx`);
}
