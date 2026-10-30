/**
 * Xuất Excel «chi tiết dạng dòng» — đúng khuôn file import (sheet «Nhập liệu» + Hướng dẫn + sheet tra cứu),
 * nên tải về sửa rồi Nhập Excel ngược lại được (chế độ «Thay số các chuyến trong file»).
 * Mỗi ô lưới (lô × dây × dòng) = 1 dòng; đứt dây của lô = 1 dòng «Màu dây 1 = Đứt dây».
 * Phần dựng dòng thuần — test round-trip với utils/import-dong.
 *
 * Ghi bằng `XLSX.writeFile` (KHÔNG chèn băng hình công ty): tiêu đề phải nằm ở dòng 1 sheet «Nhập liệu»
 * thì ImportDialog mới đọc lại được.
 */
import { buildImportTemplate, type TemplateCell, type TemplateLabels, type TemplateSheet } from '../../../../lib/import-template';
import type { ImportColumn, ImportReferenceSheet } from '../../../../lib/import-types';
import { formatYmdToDisplay } from '../../../../lib/utils';
import type { DgdvPhieuDayDu, VarMauDay } from '../core/types';
import { dongPhangCuaPhieu } from '../core/chi-tiet-dong';
import { COT_IMPORT_DGDV, GIA_TRI_DUT_DAY, type CotImportDgdv } from './import-dong';

export interface RefXuatChiTiet {
  /** Giá trị ô «Chi nhánh» — mã chi nhánh (khớp sheet Chi nhánh); không có thì tên trên phiếu. */
  chiNhanh: (idChiNhanh: string, tenTrenPhieu: string | null | undefined) => string;
  mauTheoId: ReadonlyMap<string, Pick<VarMauDay, 'ten'>>;
}

/** Phiếu theo ngày → chi nhánh → chuyến (thứ tự đọc tự nhiên trong file). */
function sapXepPhieu(ds: readonly DgdvPhieuDayDu[]): DgdvPhieuDayDu[] {
  return [...ds].sort(
    (a, b) =>
      a.ngay.localeCompare(b.ngay) ||
      a.id_chi_nhanh.localeCompare(b.id_chi_nhanh, undefined, { numeric: true }) ||
      a.chuyen - b.chuyen
  );
}

/** Các dòng dữ liệu (chưa có tiêu đề), mỗi dòng theo đúng thứ tự `COT_IMPORT_DGDV`. */
export function dungDongXuatChiTiet(dsPhieu: readonly DgdvPhieuDayDu[], ref: RefXuatChiTiet): TemplateCell[][] {
  const tenMau = (id: string | null | undefined) => (id ? (ref.mauTheoId.get(id)?.ten ?? '') : '');
  const rows: TemplateCell[][] = [];
  for (const p of sapXepPhieu(dsPhieu)) {
    const cotTheoId = new Map(p.cot.map((c) => [c.id, c]));
    const chiNhanh = ref.chiNhanh(p.id_chi_nhanh, p.ten_chi_nhanh);
    for (const r of dongPhangCuaPhieu(p)) {
      const c = r.id_cot ? cotTheoId.get(r.id_cot) : undefined;
      const dutDay = r.loai === 'dut_day' || !c;
      const o: Record<CotImportDgdv, TemplateCell> = {
        ngay: formatYmdToDisplay(p.ngay),
        chuyen: p.chuyen,
        chi_nhanh: chiNhanh,
        lo: r.ten_lo ?? '',
        to_truong: r.to_truong ?? '',
        mau_1: dutDay ? GIA_TRI_DUT_DAY : tenMau(c.id_mau_1),
        mau_2: dutDay ? '' : tenMau(c.id_mau_2),
        xe_doi: !dutDay && c.xe_doi ? 'x' : '',
        tuan_thu_hoach: dutDay ? '' : c.th_tuan,
        so_luong: r.so_luong,
        danh_gia: dutDay ? '' : (r.danh_gia ?? ''),
        so_luong_huy: dutDay || !r.so_luong_huy ? '' : r.so_luong_huy,
        ly_do_huy: dutDay ? '' : (r.ly_do_huy ?? ''),
      };
      rows.push(COT_IMPORT_DGDV.map((k) => o[k]));
    }
  }
  return rows;
}

/** Bộ sheet của file xuất: «Nhập liệu» (tiêu đề + dữ liệu) + Hướng dẫn + sheet tra cứu — builder của file mẫu. */
export function dungSheetXuatChiTiet(input: {
  columns: ImportColumn[];
  referenceSheets: ImportReferenceSheet[];
  labels: TemplateLabels;
  dong: TemplateCell[][];
}): TemplateSheet[] {
  return buildImportTemplate({
    columns: input.columns,
    referenceSheets: input.referenceSheets,
    labels: input.labels,
    inputRows: input.dong,
  });
}

/** `danh-gia-dau-vao-chi-tiet-2026-10-26` / `…-2026-10-01_2026-10-31`. */
export function tenFileXuatChiTiet(dsPhieu: readonly Pick<DgdvPhieuDayDu, 'ngay'>[]): string {
  const ngay = dsPhieu.map((p) => p.ngay).sort();
  const tu = ngay[0] ?? '';
  const den = ngay[ngay.length - 1] ?? '';
  return tu === den ? `danh-gia-dau-vao-chi-tiet-${tu}` : `danh-gia-dau-vao-chi-tiet-${tu}_${den}`;
}

export async function taiXlsxChiTiet(sheets: TemplateSheet[], tenFile: string): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    ws['!cols'] = sheet.widths.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });
  XLSX.writeFile(wb, `${tenFile}.xlsx`);
}
