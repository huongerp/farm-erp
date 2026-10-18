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
import { tongTheoDvt, tongTheoPhamCap } from '../../../../lib/phieu-in/tong-so-luong';
import { tenFileAnToan } from '../../../../lib/phieu-in/ten-file';
import type { KhoBienTheKey } from '../../kho-bien-the/bien-the';
import { tieuDePhieuKhoPTKey, trangThaiPhieuKhoPTKey } from './phieu-kho-pt-in';

function safe(v: string | number | null | undefined): string {
  if (v == null || v === '') return '–';
  return String(v);
}

function getTrangThaiLabel(trangThai: string, t: (k: string) => string): string {
  return t(trangThaiPhieuKhoPTKey(trangThai));
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

function titleOf(loai: LoaiPhieuKhoPT, bienThe: KhoBienTheKey): string {
  const t = i18n.t.bind(i18n);
  return t(tieuDePhieuKhoPTKey(loai), { kho: t(`phieuKhoPhanThuoc.preview.tenKho_${bienThe}`) }).toLocaleUpperCase('vi');
}

export function fileName(p: PhieuKhoPT): string {
  const slug = tenFileAnToan(`${p.so_phieu}_${p.loai}`);
  return `Phieu_kho_${slug}_${getTodayISODate()}`;
}

function colHeaders(t: (k: string) => string) {
  return [
    i18n.t('common.phieuIn.stt'),
    t('phieuKhoPhanThuoc.preview.danhMuc'),
    t('phieuKhoPhanThuoc.form.itemName'),
    t('phieuKhoPhanThuoc.form.phamCap'),
    t('phieuKhoPhanThuoc.form.unit'),
    t('phieuKhoPhanThuoc.form.quantity'),
    t('phieuKhoPhanThuoc.preview.soLot'),
    t('phieuKhoPhanThuoc.form.note'),
  ];
}

export async function exportPhieuKhoPTToXLSX(
  phieu: PhieuKhoPT,
  chiTiet: PhieuKhoPTChiTiet[],
  bienThe: KhoBienTheKey
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
    [titleOf(phieu.loai, bienThe)],
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
    for (const d of tongTheoDvt(chiTiet)) {
      rows.push([t('phieuKhoPhanThuoc.preview.totalQty'), '', '', '', d.dvt ?? '', d.soLuong, '', '']);
    }
    for (const d of tongTheoPhamCap(chiTiet)) {
      const phamCap = d.phamCap ?? t('phieuKhoPhanThuoc.preview.chuaPhanCap');
      rows.push([t('phieuKhoPhanThuoc.preview.totalQtyByPhamCap', { phamCap }), '', '', '', d.dvt ?? '', d.soLuong, '', '']);
    }
  }

  rows.push([]);
  rows.push([
    t('common.phieuIn.ky.nguoiLap'),
    t(phieu.loai === 'nhập' ? 'common.phieuIn.ky.nguoiGiao' : 'common.phieuIn.ky.nguoiNhan'),
    t('common.phieuIn.ky.thuKho'),
    t('common.phieuIn.ky.nguoiDuyet'),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 24 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Phieu_kho_PT');
  XLSX.writeFile(wb, `${fileName(phieu)}.xlsx`);
}
