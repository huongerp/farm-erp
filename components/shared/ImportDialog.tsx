import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2, Download, ArrowRight, FileWarning, RotateCcw,
} from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';
import { buildAutoMapping, normalizeHeader } from '../../lib/import-common';
import { useEnterTransition } from '../../lib/usePresenceTransition';
import { DIALOG_SIZE } from '../../lib/dialog-sizes';
import { IMPORT_ROW_KEY } from '../../lib/import-types';
import type {
  ImportMode,
  ImportRefColumn,
  ImportErrorRow,
  ImportSummary,
  ImportOptions,
} from '../../lib/import-types';

export { IMPORT_ROW_KEY };
export type { ImportMode, ImportRefColumn, ImportErrorRow, ImportSummary, ImportOptions };

type CellValue = string | number | boolean | null | undefined;

/** Trần số dòng mỗi lần import — chặn file khổng lồ làm treo trình duyệt. */
const DEFAULT_MAX_ROWS = 5000;

export interface ImportColumn {
  key: string;
  label: string;
  required?: boolean;
}

/** Sheet tham chiếu (tra cứu) đính kèm trong file mẫu. */
export interface ImportReferenceSheet {
  name: string;
  headers: string[];
  data: (string | number | null)[][];
}

/** Dòng dữ liệu mẫu hiển thị trong sheet "Nhập liệu". */
export type ImportSampleRow = (string | number | null)[];

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  columns: ImportColumn[];
  onImport: (data: Record<string, unknown>[], options: ImportOptions) => Promise<ImportSummary | void>;
  templateFileName?: string;
  /** Sheet tham chiếu thêm vào file mẫu (danh mục, kho...). */
  referenceSheets?: ImportReferenceSheet[];
  /** Dòng dữ liệu mẫu (tương ứng columns). */
  sampleRows?: ImportSampleRow[];
  /** Danh sách lỗi có cấu trúc từ `onImport` — hiển thị bảng lỗi + nút tải báo cáo. */
  importErrors?: ImportErrorRow[];
  /** Truyền để hiện khối chọn chế độ import. Không truyền → luôn chạy `create` như trước. */
  modes?: ImportMode[];
  defaultMode?: ImportMode;
  /** Truyền để hiện select cột tham chiếu. */
  refColumns?: ImportRefColumn[];
  defaultRefColumn?: string;
  maxRows?: number;
}

type Step = 'upload' | 'mapping' | 'result';

const ImportDialog: React.FC<ImportDialogProps> = ({
  open, onClose, columns, onImport, templateFileName = 'template',
  referenceSheets, sampleRows, importErrors,
  modes, defaultMode, refColumns, defaultRefColumn, maxRows = DEFAULT_MAX_ROWS,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [sheetData, setSheetData] = useState<CellValue[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [clientErrors, setClientErrors] = useState<ImportErrorRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [parsedCount, setParsedCount] = useState(0);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState<ImportMode>(defaultMode ?? modes?.[0] ?? 'create');
  const [refColumn, setRefColumn] = useState<string>(defaultRefColumn ?? refColumns?.[0]?.key ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workbookRef = useRef<import('xlsx').WorkBook | null>(null);
  const visible = useEnterTransition();

  /** Gộp lỗi client (thiếu ô bắt buộc) và lỗi service — trước đây lỗi client bị ẩn mất. */
  const mergedErrors = useMemo<ImportErrorRow[]>(
    () => [...clientErrors, ...(importErrors ?? [])].sort((a, b) => a.row - b.row),
    [clientErrors, importErrors]
  );

  /** Quay về bước chọn file nhưng giữ chế độ + cột tham chiếu, để chạy vòng sửa-nhập-lại. */
  const restartUpload = () => {
    setStep('upload');
    setFile(null);
    setSheetNames([]);
    setActiveSheet('');
    setSheetHeaders([]);
    setSheetData([]);
    setMapping({});
    setMappingError(null);
    setClientErrors([]);
    setSummary(null);
    setParsedCount(0);
    setFatalError(null);
    workbookRef.current = null;
  };

  const handleClose = () => {
    restartUpload();
    setMode(defaultMode ?? modes?.[0] ?? 'create');
    setRefColumn(defaultRefColumn ?? refColumns?.[0]?.key ?? '');
    onClose();
  };

  const loadSheet = useCallback(async (name: string) => {
    const wb = workbookRef.current;
    if (!wb) return;
    const XLSX = await import('xlsx');
    const sheet = wb.Sheets[name];
    if (!sheet) {
      setFatalError(t('shared.import.noDataOrHeader'));
      setStep('result');
      return;
    }
    const json = XLSX.utils.sheet_to_json<CellValue[]>(sheet, { header: 1, blankrows: false });
    if (json.length < 2) {
      setFatalError(t('shared.import.noDataOrHeader'));
      setStep('result');
      return;
    }
    const headers = (json[0] as string[]).map((h) => String(h ?? '').trim());
    const data = json
      .slice(1)
      .filter((row) => (row as CellValue[]).some((cell) => cell !== null && cell !== undefined && cell !== '')) as CellValue[][];

    if (data.length > maxRows) {
      setFatalError(t('shared.import.tooManyRows', { count: data.length, max: maxRows }));
      setStep('result');
      return;
    }

    setActiveSheet(name);
    setSheetHeaders(headers);
    setSheetData(data);
    setMapping(buildAutoMapping(columns, headers));
    setMappingError(null);
    setStep('mapping');
  }, [columns, maxRows, t]);

  const parseFile = useCallback(async (f: File) => {
    setFile(f);
    setFatalError(null);
    setClientErrors([]);
    setSummary(null);
    try {
      const XLSX = await import('xlsx');
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      workbookRef.current = workbook;
      setSheetNames(workbook.SheetNames);
      // File mẫu có kèm sheet tra cứu → ưu tiên đúng sheet nhập liệu thay vì sheet đầu tiên.
      const preferred =
        workbook.SheetNames.find(
          (n) => normalizeHeader(n) === normalizeHeader(t('shared.import.templateSheetName'))
        ) ?? workbook.SheetNames[0];
      await loadSheet(preferred);
    } catch {
      setFatalError(t('shared.import.cannotReadFile'));
      setStep('result');
    }
  }, [loadSheet, t]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) parseFile(f);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
    e.target.value = '';
  };

  const handleImport = async () => {
    const unmapped = columns.filter((c) => c.required && !mapping[c.key]);
    if (unmapped.length > 0) {
      setMappingError(t('shared.import.missingRequiredColumns', { columns: unmapped.map((c) => c.label).join(', ') }));
      return;
    }
    setMappingError(null);
    setImporting(true);

    const rowErrors: ImportErrorRow[] = [];
    const parsed: Record<string, unknown>[] = [];

    sheetData.forEach((row, rowIdx) => {
      const excelRow = rowIdx + 2;
      const record: Record<string, unknown> = {};
      const missing: string[] = [];

      columns.forEach((col) => {
        const headerName = mapping[col.key];
        const colIdx = headerName ? sheetHeaders.indexOf(headerName) : -1;
        const value = colIdx === -1 ? undefined : row[colIdx];
        record[col.key] = value ?? '';
        if (col.required && (value === null || value === undefined || String(value).trim() === '')) {
          missing.push(col.label);
        }
      });

      if (missing.length > 0) {
        rowErrors.push({
          row: excelRow,
          msg: t('shared.import.rowEmptyFields', { columns: missing.join(', ') }),
          values: record,
        });
        return;
      }
      parsed.push({ ...record, [IMPORT_ROW_KEY]: excelRow });
    });

    setClientErrors(rowErrors);
    setParsedCount(parsed.length);

    try {
      const result = parsed.length > 0 ? await onImport(parsed, { mode, refColumn: refColumn || undefined }) : undefined;
      setSummary(result ?? null);
    } catch (err: unknown) {
      setFatalError(err instanceof Error ? err.message : t('shared.import.importError'));
    }
    setStep('result');
    setImporting(false);
  };

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const headerRow = columns.map((c) => c.label);
    const templateData: CellValue[][] = [headerRow];
    if (sampleRows && sampleRows.length > 0) {
      sampleRows.forEach((sr) => templateData.push(sr));
    }
    const ws = XLSX.utils.aoa_to_sheet(templateData);

    const colWidths = columns.map((c, i) => {
      let max = c.label.length;
      if (sampleRows) sampleRows.forEach((sr) => { max = Math.max(max, String(sr[i] ?? '').length); });
      return { wch: Math.min(Math.max(max + 2, 12), 40) };
    });
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, t('shared.import.templateSheetName'));

    if (referenceSheets) {
      referenceSheets.forEach((ref) => {
        const refData: CellValue[][] = [ref.headers, ...ref.data];
        const refWs = XLSX.utils.aoa_to_sheet(refData);
        refWs['!cols'] = ref.headers.map((h, i) => {
          let max = h.length;
          ref.data.forEach((row) => { max = Math.max(max, String(row[i] ?? '').length); });
          return { wch: Math.min(Math.max(max + 2, 12), 40) };
        });
        XLSX.utils.book_append_sheet(wb, refWs, ref.name);
      });
    }

    XLSX.writeFile(wb, `${templateFileName}.xlsx`);
  };

  /**
   * File báo lỗi giữ nguyên các cột gốc + thêm cột "Lỗi" ở cuối → sửa xong kéo thẳng lại vào dialog
   * là import tiếp được (cột "Lỗi" không khớp cột hệ thống nào nên tự động bị bỏ qua).
   */
  const downloadErrorReport = async () => {
    if (mergedErrors.length === 0) return;
    const XLSX = await import('xlsx');
    const errLabel = t('shared.import.errorReportErrCol');
    const reImportable = mergedErrors.some((e) => e.values != null);

    let headers: string[];
    let data: CellValue[][];
    if (reImportable) {
      headers = [...columns.map((c) => c.label), errLabel];
      data = mergedErrors.map((e) => [
        ...columns.map((c) => (e.values?.[c.key] ?? '') as CellValue),
        e.msg,
      ]);
    } else {
      headers = [
        t('shared.import.errorReportRow'),
        t('shared.import.errorReportCode'),
        t('shared.import.errorReportName'),
        errLabel,
      ];
      data = mergedErrors.map((e) => [e.row, e.ma_hang_hoa ?? '', e.ten_hang_hoa ?? '', e.msg]);
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = headers.map((h, i) => {
      let max = h.length;
      data.forEach((row) => { max = Math.max(max, String(row[i] ?? '').length); });
      return { wch: Math.min(Math.max(max + 2, 12), 60) };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('shared.import.templateSheetName'));
    XLSX.writeFile(wb, `${templateFileName}_loi.xlsx`);
  };

  if (!open) return null;

  const createdCount = summary?.created ?? 0;
  const updatedCount = summary?.updated ?? 0;
  const okCount = summary ? createdCount + updatedCount : Math.max(0, parsedCount - (importErrors?.length ?? 0));
  const hasErrors = mergedErrors.length > 0;
  const showModePicker = modes != null && modes.length > 1;
  // Cột tham chiếu áp dụng cho cả hai chế độ: 'create' dùng nó để phát hiện trùng,
  // 'upsert' dùng nó để tìm dòng cần ghi đè.
  const showRefPicker = refColumns != null && refColumns.length > 1;

  return (
    <>
      <div
        onClick={handleClose}
        className={cn(
          'fixed inset-0 z-[60] bg-black/20 backdrop-blur-md presence-overlay',
          visible && 'presence-visible',
        )}
      />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'w-full bg-card rounded-2xl shadow-2xl border border-border pointer-events-auto flex flex-col max-h-[85vh] presence-dialog-center',
            visible && 'presence-visible',
            DIALOG_SIZE.LARGE,
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Upload size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t('shared.import.title')}</h3>
                <p className="text-xs text-muted-foreground">{file ? file.name : t('shared.import.subtitle')}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {step === 'upload' && (
              <div key="upload">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
                    dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/20'
                  )}
                >
                  <FileSpreadsheet size={40} className="mx-auto text-primary/40 mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">{t('shared.import.dropHere')}</p>
                  <p className="text-xs text-muted-foreground mb-4">{t('shared.import.orClickToSelect')}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <div className="mt-4 flex justify-center gap-4">
                  <button onClick={downloadTemplate} className="text-xs text-primary hover:underline flex items-center gap-1.5">
                    <Download size={13} /> {t('shared.import.downloadTemplate')}
                  </button>
                </div>
                {referenceSheets && referenceSheets.length > 0 && (
                  <p className="text-2xs text-muted-foreground text-center mt-2">
                    {t('shared.import.templateHasRefSheets', { count: referenceSheets.length })}
                  </p>
                )}
              </div>
            )}

            {step === 'mapping' && (
              <div key="mapping" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {t('shared.import.rowsRead', { count: sheetData.length })}
                  </p>
                  {sheetNames.length > 1 && (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      {t('shared.import.sheetLabel')}
                      <select
                        value={activeSheet}
                        onChange={(e) => loadSheet(e.target.value)}
                        className="h-7 px-2 text-xs border border-border rounded-lg bg-background text-foreground outline-none cursor-pointer"
                      >
                        {sheetNames.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                {(showModePicker || showRefPicker) && (
                  <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
                    {showModePicker && (
                      <div>
                        <p className="text-xs font-medium text-foreground mb-2">{t('shared.import.modeLabel')}</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {modes!.map((m) => (
                            <label
                              key={m}
                              className={cn(
                                'flex items-start gap-2 rounded-lg border p-2.5 cursor-pointer transition-all',
                                mode === m ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                              )}
                            >
                              <input
                                type="radio"
                                name="import-mode"
                                checked={mode === m}
                                onChange={() => setMode(m)}
                                className="mt-0.5 accent-primary"
                              />
                              <span>
                                <span className="block text-xs font-medium text-foreground">
                                  {m === 'upsert' ? t('shared.import.modeUpsert') : t('shared.import.modeCreate')}
                                </span>
                                <span className="block text-2xs text-muted-foreground mt-0.5">
                                  {m === 'upsert' ? t('shared.import.modeUpsertDesc') : t('shared.import.modeCreateDesc')}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {showRefPicker && (
                      <div>
                        <p className="text-xs font-medium text-foreground mb-1">{t('shared.import.refColumnLabel')}</p>
                        <select
                          value={refColumn}
                          onChange={(e) => setRefColumn(e.target.value)}
                          className="w-full sm:w-64 h-8 px-2 text-xs border border-border rounded-lg bg-background text-foreground outline-none cursor-pointer"
                        >
                          {refColumns!.map((rc) => (
                            <option key={rc.key} value={rc.key}>{rc.label}</option>
                          ))}
                        </select>
                        <p className="text-2xs text-muted-foreground mt-1">{t('shared.import.refColumnHint')}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('shared.import.systemColumn')}</th>
                        <th className="px-2 py-2 text-center w-8"><ArrowRight size={12} className="mx-auto text-muted-foreground/50" /></th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('shared.import.fileColumn')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
                      {columns.map(col => (
                        <tr key={col.key} className="hover:bg-muted/20">
                          <td className="px-3 py-2">
                            <span className="font-medium text-foreground">{col.label}</span>
                            {col.required && <span className="text-destructive ml-1">*</span>}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <ArrowRight size={11} className="mx-auto text-muted-foreground/30" />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={mapping[col.key] || ''}
                              onChange={(e) => setMapping(prev => ({ ...prev, [col.key]: e.target.value }))}
                              className={cn(
                                'w-full h-7 px-2 text-xs border rounded-lg bg-background outline-none transition-all cursor-pointer',
                                mapping[col.key] ? 'border-primary/30 text-foreground' : 'border-border text-muted-foreground'
                              )}
                            >
                              <option value="">{t('shared.import.skipColumn')}</option>
                              {sheetHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {mappingError && (
                  <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-2.5">
                    {mappingError}
                  </p>
                )}

                {sheetData.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{t('shared.import.preview')}</p>
                    <div className="border border-border rounded-lg overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/20">
                            {sheetHeaders.map((h, i) => (
                              <th key={i} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap border-b border-border">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sheetData.slice(0, 5).map((row, ri) => (
                            <tr key={ri} className="border-b border-border/30">
                              {sheetHeaders.map((_, ci) => (
                                <td key={ci} className="px-2 py-1.5 text-foreground whitespace-nowrap max-w-[150px] truncate">
                                  {row[ci] ?? <span className="text-muted-foreground/40">--</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 'result' && (
              <div key="result" className="py-2">
                <div className="text-center">
                  {okCount > 0 ? (
                    <div className="space-y-2">
                      <CheckCircle2 size={44} className="mx-auto text-primary" />
                      <p className="text-sm font-semibold text-foreground">
                        {hasErrors ? t('shared.import.partialSuccess') : t('shared.import.success')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <AlertCircle size={44} className="mx-auto text-destructive" />
                      <p className="text-sm font-semibold text-foreground">{t('shared.import.error')}</p>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {summary ? (
                      <>
                        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs">
                          {t('shared.import.summaryCreated', { count: createdCount })}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs">
                          {t('shared.import.summaryUpdated', { count: updatedCount })}
                        </span>
                      </>
                    ) : (
                      okCount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs">
                          {t('shared.import.successCount', { count: okCount })}
                        </span>
                      )
                    )}
                    {hasErrors && (
                      <span className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs">
                        {t('shared.import.summaryFailed', { count: mergedErrors.length })}
                      </span>
                    )}
                  </div>
                </div>

                {fatalError && (
                  <div className="mt-4 bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                    <p className="text-xs text-destructive">{fatalError}</p>
                  </div>
                )}

                {hasErrors && (
                  <div className="mt-4 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-destructive flex items-center gap-1.5">
                        <FileWarning size={13} />
                        {t('shared.import.errorCount', { count: mergedErrors.length })}
                      </p>
                      <button
                        onClick={downloadErrorReport}
                        className="text-caption text-primary hover:underline flex items-center gap-1"
                      >
                        <Download size={12} /> {t('shared.import.downloadErrors')}
                      </button>
                    </div>
                    <div className="border border-destructive/20 rounded-lg overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-destructive/5 border-b border-destructive/10">
                            <th className="px-2 py-1.5 text-left font-medium text-destructive w-12">{t('shared.import.errorReportRow')}</th>
                            <th className="px-2 py-1.5 text-left font-medium text-destructive">{t('shared.import.errorReportMsg')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-destructive/10">
                          {mergedErrors.slice(0, 50).map((err, i) => (
                            <tr key={i} className="hover:bg-destructive/5">
                              <td className="px-2 py-1 text-destructive/80 font-mono align-top">{err.row}</td>
                              <td className="px-2 py-1 text-destructive/80">{err.msg}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {mergedErrors.length > 50 && (
                        <p className="text-2xs text-muted-foreground text-center py-1.5">
                          {t('shared.import.moreErrors', { count: mergedErrors.length - 50 })}
                        </p>
                      )}
                    </div>
                    <p className="text-2xs text-muted-foreground mt-2">{t('shared.import.fixAndRetry')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0">
            <Button variant="outline" onClick={handleClose} className="text-xs h-9">
              {step === 'result' ? t('common.close') : t('common.cancel')}
            </Button>
            <div className="flex gap-2">
              {step === 'mapping' && (
                <>
                  <Button variant="outline" onClick={restartUpload} className="text-xs h-9">
                    {t('common.selectFile')}
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={importing}
                    className="bg-primary text-white text-xs h-9 px-4"
                  >
                    {importing ? t('common.processing') : t('shared.import.importRows', { count: sheetData.length })}
                  </Button>
                </>
              )}
              {step === 'result' && (
                <>
                  <Button variant="outline" onClick={restartUpload} className="text-xs h-9">
                    <RotateCcw size={13} className="mr-1.5" />
                    {t('shared.import.importAgain')}
                  </Button>
                  {okCount > 0 && !hasErrors && (
                    <Button onClick={handleClose} className="bg-primary text-white text-xs h-9 px-4">
                      {t('common.finish')}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImportDialog;
