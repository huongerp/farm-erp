/**
 * Ghi file tải về cho dialog Xuất — không chứa JSX, thư viện nặng nạp bằng `import()`.
 * Giá trị từng ô đi qua `dinhDangOXuat` để xlsx nhận số/ngày thật, csv/pdf nhận chữ dễ đọc.
 */
import { downloadBlob } from '../../../lib/download-blob';
import { dinhDangOXuat, mauSoExcel, type ExportColumn } from '../../../lib/export/dinh-dang-o';
import { ensureJsPDFVietnameseFont, JSPDF_VI_FONT_FAMILY } from '../../../lib/jspdf-vietnamese-font';

type Dong = Record<string, unknown>;

/** Màu header dùng chung xlsx + pdf (blue-500). */
const MAU_HEADER_RGB: [number, number, number] = [59, 130, 246];
const MAU_HEADER_ARGB = 'FF3B82F6';

/** Excel giới hạn 31 ký tự; không dùng [] * ? : \ / */
export function tenSheetHopLe(name: string): string {
  const t = name.replace(/[[\]*?:\\/]/g, '_').trim() || 'Data';
  return t.length > 31 ? t.slice(0, 31) : t;
}

function escapeCsvCell(val: string): string {
  const cell = val.replace(/"/g, '""');
  return /[",\n\r]/.test(cell) ? `"${cell}"` : cell;
}

export async function xuatExcel(opts: {
  cols: ExportColumn[];
  rows: Dong[];
  sheetName: string;
  fullName: string;
}): Promise<void> {
  const { cols, rows, sheetName, fullName } = opts;
  const mod = await import('exceljs');
  const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;

  const wb = new ExcelJS.Workbook();
  wb.created = new Date();
  const ws = wb.addWorksheet(tenSheetHopLe(sheetName), {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // Độ rộng: theo chữ hiển thị của 200 dòng đầu, chặn 8..60 ký tự.
  const mau = rows.slice(0, 200);
  ws.columns = cols.map((c) => {
    let w = c.label.length;
    for (const r of mau) {
      const s = dinhDangOXuat(r[c.key], c.type).hienThi;
      const dong = s.includes('\n') ? Math.max(...s.split('\n').map((x) => x.length)) : s.length;
      if (dong > w) w = dong;
    }
    return { header: c.label, key: c.key, width: Math.min(60, Math.max(8, w + 2)) };
  });

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.alignment = { vertical: 'middle', wrapText: true };
  header.height = 22;
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MAU_HEADER_ARGB } };
  });

  for (const r of rows) {
    const o = cols.map((c) => dinhDangOXuat(r[c.key], c.type));
    const row = ws.addRow(o.map((x) => x.excel));
    o.forEach((x, i) => {
      const fmt = mauSoExcel(cols[i].type, x.excel);
      const cell = row.getCell(i + 1);
      if (fmt) cell.numFmt = fmt;
      if (typeof x.excel === 'string' && x.excel.includes('\n')) {
        cell.alignment = { wrapText: true, vertical: 'top' };
      }
    });
  }

  if (cols.length > 0) {
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  }

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${fullName}.xlsx`,
  );
}

export function xuatCsv(opts: { cols: ExportColumn[]; rows: Dong[]; fullName: string }): void {
  const { cols, rows, fullName } = opts;
  const lines = [
    cols.map((c) => escapeCsvCell(c.label)).join(','),
    ...rows.map((r) => cols.map((c) => escapeCsvCell(dinhDangOXuat(r[c.key], c.type).hienThi)).join(',')),
  ];
  downloadBlob(new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' }), `${fullName}.csv`);
}

export async function xuatPdf(opts: {
  cols: ExportColumn[];
  rows: Dong[];
  fullName: string;
  title: string;
  subtitle: string;
}): Promise<void> {
  const { cols, rows, fullName, title, subtitle } = opts;
  const [{ jsPDF }, autoTableMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const autoTable = autoTableMod.default;
  const doc = new jsPDF({ orientation: cols.length > 5 ? 'l' : 'p', unit: 'mm', format: 'a4' });
  await ensureJsPDFVietnameseFont(doc);

  doc.setFontSize(12);
  doc.text(title, 14, 15);
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(subtitle, 14, 21);

  autoTable(doc, {
    head: [cols.map((c) => c.label)],
    body: rows.map((r) => cols.map((c) => dinhDangOXuat(r[c.key], c.type).hienThi)),
    startY: 26,
    styles: { font: JSPDF_VI_FONT_FAMILY, fontSize: 7, cellPadding: 2 },
    headStyles: { font: JSPDF_VI_FONT_FAMILY, fillColor: MAU_HEADER_RGB, fontSize: 7, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252], font: JSPDF_VI_FONT_FAMILY },
  });

  doc.save(`${fullName}.pdf`);
}
