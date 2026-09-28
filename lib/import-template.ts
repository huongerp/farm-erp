/**
 * Dựng nội dung file mẫu import (thuần, không phụ thuộc xlsx) → test trực tiếp.
 *
 * Bố cục cố định cho mọi module:
 *   1. "Nhập liệu"  — CHỈ dòng tiêu đề. Dòng mẫu không đặt ở đây: quên xoá là thành dữ liệu thật.
 *   2. "Hướng dẫn"  — sinh từ `columns`: bắt buộc, quy tắc (`hint`), ví dụ lấy từ `sampleRows`.
 *   3. "Ví dụ mẫu"  — tiêu đề + `sampleRows` (nếu có).
 *   4. Các sheet tra cứu của module.
 * ImportDialog đọc sheet "Nhập liệu" mặc định nên các sheet còn lại không bị import nhầm.
 */
import type { ImportColumn, ImportReferenceSheet, ImportSampleRow } from './import-types';

export type TemplateCell = string | number | null;

export interface TemplateSheet {
  name: string;
  rows: TemplateCell[][];
  /** Bề rộng cột theo ký tự (`!cols[].wch`). */
  widths: number[];
}

export interface TemplateLabels {
  inputSheet: string;
  guideSheet: string;
  exampleSheet: string;
  guideColumn: string;
  guideRequired: string;
  guideRule: string;
  guideExample: string;
  yes: string;
  no: string;
  notes: string[];
}

export interface BuildTemplateInput {
  columns: ImportColumn[];
  sampleRows?: ImportSampleRow[];
  referenceSheets?: ImportReferenceSheet[];
  labels: TemplateLabels;
}

/** Excel giới hạn tên sheet 31 ký tự và không được trùng. */
const MAX_SHEET_NAME = 31;

function widthsOf(rows: TemplateCell[][], max = 40): number[] {
  const cols = Math.max(0, ...rows.map((r) => r.length));
  return Array.from({ length: cols }, (_, i) => {
    const longest = Math.max(0, ...rows.map((r) => String(r[i] ?? '').length));
    return Math.min(Math.max(longest + 2, 12), max);
  });
}

function isFilled(v: TemplateCell | undefined): boolean {
  return v !== null && v !== undefined && String(v).trim() !== '';
}

export function buildImportTemplate({ columns, sampleRows = [], referenceSheets = [], labels }: BuildTemplateInput): TemplateSheet[] {
  const header = columns.map((c) => c.label);
  const used = new Set<string>();
  const uniqueName = (raw: string) => {
    const base = raw.slice(0, MAX_SHEET_NAME);
    let name = base;
    for (let i = 2; used.has(name.toLowerCase()); i++) name = `${base.slice(0, MAX_SHEET_NAME - 3)} ${i}`;
    used.add(name.toLowerCase());
    return name;
  };

  const sheets: TemplateSheet[] = [];

  sheets.push({ name: uniqueName(labels.inputSheet), rows: [header], widths: widthsOf([header, ...sampleRows]) });

  const guideRows: TemplateCell[][] = [
    [labels.guideColumn, labels.guideRequired, labels.guideRule, labels.guideExample],
    ...columns.map((c, i) => [
      c.label,
      c.required ? labels.yes : (c.requiredWhen ?? labels.no),
      c.hint ?? '',
      sampleRows.map((r) => r[i]).find(isFilled) ?? '',
    ]),
  ];
  if (labels.notes.length > 0) {
    guideRows.push(['', '', '', '']);
    labels.notes.forEach((n) => guideRows.push([n, '', '', '']));
  }
  // Dòng ghi chú dài nằm ở cột A — không cho nó kéo bề rộng cột A ra hết cỡ.
  const guideWidths = widthsOf(guideRows.slice(0, columns.length + 1), 70);
  sheets.push({ name: uniqueName(labels.guideSheet), rows: guideRows, widths: guideWidths });

  if (sampleRows.length > 0) {
    sheets.push({ name: uniqueName(labels.exampleSheet), rows: [header, ...sampleRows], widths: widthsOf([header, ...sampleRows]) });
  }

  referenceSheets.forEach((ref) => {
    const rows = [ref.headers, ...ref.data];
    sheets.push({ name: uniqueName(ref.name), rows, widths: widthsOf(rows) });
  });

  return sheets;
}
