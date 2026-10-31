/**
 * Xuất Excel «Chi tiết nhân viên» theo bộ lọc danh sách — để soát người bị đổi chuyền / vị trí:
 *   - «Chi tiết NV»: mỗi người × ngày một dòng, lọc được, dòng có thay đổi tô cam nhạt + cột «Thay đổi».
 *   - «Theo dõi vị trí»: ma trận người × ngày, ô đổi so với lần có mặt trước tô cam (kèm ghi chú ô),
 *     ô vắng tô xám, cột cuối đếm số lần đổi.
 *   - Kiểu «Cả hai» thêm sheet đầu «Tổng hợp» (một dòng / phiếu, cùng cột với dialog Xuất).
 * Ghi bằng ExcelJS (tô màu được) — chunk lazy sẵn có của dialog Xuất.
 */
import type { TFunction } from 'i18next';
import type { Worksheet } from 'exceljs';
import type { FarmBaoCaoNhanCong } from '../core/types';
import { dungDongChiTietNv, dungMaTranViTri, type DongChiTietNv } from '../core/theo-doi-vi-tri';
import { getExportColumnsBaoCaoNhanCongList, mapFarmBaoCaoNhanCongListRow } from './export-bao-cao-nhan-cong-danh-sach';
import { dinhDangOXuat, mauSoExcel } from '../../../../lib/export/dinh-dang-o';
import { downloadBlob } from '../../../../lib/download-blob';
import { formatYmdToDisplay } from '../../../../lib/utils';

export type KieuXuatNv = 'chi-tiet' | 'ca-hai';

const MAU_HEADER = 'FF3B82F6';
const MAU_DOI = 'FFFDBA74';
const MAU_DONG_DOI = 'FFFFEDD5';
const MAU_VANG = 'FFE5E7EB';

/** Cột kỹ thuật không cần cho người đọc file. */
const BO_COT_TONG_HOP = new Set(['id', 'id_chi_nhanh', 'id_nguoi_tao', 'hinh_anh_urls']);

const to = (argb: string) => ({ type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb } });

function ddmm(ngay: string): string {
  return formatYmdToDisplay(ngay).slice(0, 5);
}

function kieuHeader(ws: Worksheet, soDong: number, soCot: number) {
  const row = ws.getRow(soDong);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  row.height = 22;
  for (let c = 1; c <= soCot; c++) row.getCell(c).fill = to(MAU_HEADER);
}

export function moTaThayDoi(d: DongChiTietNv, t: TFunction): string {
  const td = d.thayDoi;
  if (!td) return '';
  const phan: string[] = [];
  if (td.doiChuyen) {
    phan.push(
      t('baoCaoNhanCong.xuat.doiChuyen', {
        tu: t(`baoCaoNhanCong.chuyen.${td.tuChuyen}`),
        den: t(`baoCaoNhanCong.chuyen.${d.loaiChuyen}`),
      })
    );
  }
  if (td.doiViTri) phan.push(t('baoCaoNhanCong.xuat.doiViTri', { tu: td.tuViTri ?? '—', den: d.viTri ?? '—' }));
  return `${t('baoCaoNhanCong.xuat.soVoi', { ngay: ddmm(td.ngayTruoc) })} ${phan.join('; ')}`;
}

function sheetTongHop(ws: Worksheet, dsPhieu: readonly FarmBaoCaoNhanCong[], t: TFunction) {
  const cols = getExportColumnsBaoCaoNhanCongList(t).filter((c) => !BO_COT_TONG_HOP.has(c.key));
  ws.columns = cols.map((c) => ({ header: c.label, key: c.key, width: c.key === 'ghi_chu' ? 30 : Math.max(12, c.label.length + 2) }));
  kieuHeader(ws, 1, cols.length);
  const phieu = [...dsPhieu].sort(
    (a, b) => a.ngay.localeCompare(b.ngay) || (a.ten_chi_nhanh ?? '').localeCompare(b.ten_chi_nhanh ?? '', 'vi', { numeric: true })
  );
  for (const p of phieu) {
    const r = mapFarmBaoCaoNhanCongListRow(p, t);
    const o = cols.map((c) => dinhDangOXuat(r[c.key], c.type));
    const row = ws.addRow(o.map((x) => x.excel));
    o.forEach((x, i) => {
      const fmt = mauSoExcel(cols[i].type, x.excel);
      if (fmt) row.getCell(i + 1).numFmt = fmt;
    });
  }
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
}

function sheetChiTiet(ws: Worksheet, dong: readonly DongChiTietNv[], t: TFunction) {
  const cot: { label: string; width: number }[] = [
    { label: t('baoCaoNhanCong.form.ngay'), width: 11 },
    { label: t('baoCaoNhanCong.form.branch'), width: 14 },
    { label: t('baoCaoNhanCong.form.colTt'), width: 5 },
    { label: t('baoCaoNhanCong.form.colChuyen'), width: 30 },
    { label: t('baoCaoNhanCong.nv.hoTen'), width: 24 },
    { label: t('baoCaoNhanCong.nv.viTri'), width: 20 },
    { label: t('baoCaoNhanCong.nv.cong'), width: 10 },
    { label: t('baoCaoNhanCong.nv.gioCong'), width: 9 },
    { label: t('baoCaoNhanCong.nv.gioTc'), width: 9 },
    { label: t('baoCaoNhanCong.form.colGhiChu'), width: 20 },
    { label: t('baoCaoNhanCong.xuat.colThayDoi'), width: 60 },
  ];
  ws.columns = cot.map((c) => ({ header: c.label, width: c.width }));
  kieuHeader(ws, 1, cot.length);
  for (const d of dong) {
    const ngay = dinhDangOXuat(d.ngay, 'date');
    const row = ws.addRow([
      ngay.excel,
      d.tenChiNhanh,
      d.tt,
      t(`baoCaoNhanCong.chuyen.${d.loaiChuyen}`),
      d.hoTen,
      d.viTri ?? '',
      t(`baoCaoNhanCong.nv.chamCong.${d.chamCong}`),
      d.gioCong,
      d.gioTc,
      d.ghiChu ?? '',
      moTaThayDoi(d, t),
    ]);
    const fmt = mauSoExcel('date', ngay.excel);
    if (fmt) row.getCell(1).numFmt = fmt;
    if (d.thayDoi) {
      for (let c = 1; c <= cot.length; c++) row.getCell(c).fill = to(MAU_DONG_DOI);
      row.getCell(cot.length).font = { bold: true, color: { argb: 'FF9A3412' } };
    }
  }
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cot.length } };
}

function sheetMaTran(ws: Worksheet, dong: readonly DongChiTietNv[], t: TFunction) {
  const mt = dungMaTranViTri(dong);
  const soCot = 2 + mt.ngays.length + 1;

  // Chú thích: TT → tên chuyền, rồi ý nghĩa màu.
  const chuyen = new Map<string, DongChiTietNv>();
  for (const d of [...dong].sort((a, b) => a.thuTuChuyen - b.thuTuChuyen)) if (!chuyen.has(d.tt)) chuyen.set(d.tt, d);
  ws.addRow([t('baoCaoNhanCong.xuat.maTranTieuDe')]).font = { bold: true, size: 13 };
  ws.addRow([[...chuyen.values()].map((d) => `${d.tt} = ${t(`baoCaoNhanCong.chuyen.${d.loaiChuyen}`)}`).join('   ·   ')]);
  const chuThich = ws.addRow(['', t('baoCaoNhanCong.xuat.chuThichDoi'), t('baoCaoNhanCong.xuat.chuThichVang')]);
  chuThich.getCell(2).fill = to(MAU_DOI);
  chuThich.getCell(3).fill = to(MAU_VANG);
  ws.addRow([]);

  const DONG_HEADER = 5;
  ws.addRow([
    t('baoCaoNhanCong.form.branch'),
    t('baoCaoNhanCong.nv.hoTen'),
    ...mt.ngays.map(ddmm),
    t('baoCaoNhanCong.xuat.soLanDoi'),
  ]);
  kieuHeader(ws, DONG_HEADER, soCot);
  ws.getColumn(1).width = 14;
  ws.getColumn(2).width = 24;
  mt.ngays.forEach((_, i) => (ws.getColumn(3 + i).width = 18));
  ws.getColumn(soCot).width = 10;

  for (const h of mt.hang) {
    const row = ws.addRow([h.tenChiNhanh, h.hoTen]);
    row.alignment = { vertical: 'top', wrapText: true };
    mt.ngays.forEach((ngay, i) => {
      const cell = row.getCell(3 + i);
      const ds = h.o.get(ngay);
      if (!ds) {
        if (mt.coDuLieu(h.idChiNhanh, ngay)) {
          cell.value = t('baoCaoNhanCong.xuat.vang');
          cell.fill = to(MAU_VANG);
          cell.font = { color: { argb: 'FF6B7280' }, italic: true };
        }
        return;
      }
      cell.value = ds.map((d) => `${d.tt} · ${d.viTri ?? '—'}`).join('\n');
      const doi = ds.filter((d) => d.thayDoi);
      if (doi.length > 0) {
        cell.fill = to(MAU_DOI);
        cell.font = { bold: true };
        cell.note = doi.map((d) => moTaThayDoi(d, t)).join('\n');
      }
    });
    const tong = row.getCell(soCot);
    tong.value = h.soLanDoi;
    tong.alignment = { horizontal: 'center', vertical: 'top' };
    if (h.soLanDoi > 0) tong.font = { bold: true, color: { argb: 'FF9A3412' } };
  }
  ws.views = [{ state: 'frozen', xSplit: 2, ySplit: DONG_HEADER }];
}

export function tenFileXuatNv(kieu: KieuXuatNv, dong: readonly DongChiTietNv[]): string {
  const ngays = dong.map((d) => d.ngay).sort();
  const tu = ngays[0] ?? '';
  const den = ngays[ngays.length - 1] ?? '';
  const khoang = tu === den ? tu : `${tu}_${den}`;
  return kieu === 'ca-hai'
    ? `Bao_cao_nhan_cong_tong_hop_va_chi_tiet_NV_${khoang}`
    : `Bao_cao_nhan_cong_chi_tiet_NV_${khoang}`;
}

/** Trả số dòng tên đã ghi; 0 = không có tên nào → không tải file. */
export async function xuatExcelChiTietNv(
  dsPhieu: readonly FarmBaoCaoNhanCong[],
  kieu: KieuXuatNv,
  t: TFunction
): Promise<number> {
  const dong = dungDongChiTietNv(dsPhieu);
  if (dong.length === 0) return 0;

  const mod = await import('exceljs');
  const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  if (kieu === 'ca-hai') sheetTongHop(wb.addWorksheet(t('baoCaoNhanCong.xuat.sheetTongHop')), dsPhieu, t);
  sheetMaTran(wb.addWorksheet(t('baoCaoNhanCong.xuat.sheetMaTran')), dong, t);
  sheetChiTiet(wb.addWorksheet(t('baoCaoNhanCong.xuat.sheetChiTiet')), dong, t);

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${tenFileXuatNv(kieu, dong)}.xlsx`
  );
  return dong.length;
}
