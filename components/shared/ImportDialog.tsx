import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2, Download, ArrowRight, FileWarning } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';
import { useEnterTransition } from '../../lib/usePresenceTransition';
import { DIALOG_SIZE } from '../../lib/dialog-sizes';

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
  onImport: (data: Record<string, any>[]) => Promise<void>;
  templateFileName?: string;
  /** Sheet tham chiếu thêm vào file mẫu (danh mục, kho...). */
  referenceSheets?: ImportReferenceSheet[];
  /** Dòng dữ liệu mẫu (tương ứng columns). */
  sampleRows?: ImportSampleRow[];
  /** Structured error list from onImport — hiển thị bảng lỗi chi tiết + nút tải báo cáo. */
  importErrors?: Array<{ row: number; ma_hang_hoa?: string; ten_hang_hoa?: string; msg: string }>;
}

type Step = 'upload' | 'mapping' | 'result';

const ImportDialog: React.FC<ImportDialogProps> = ({
  open, onClose, columns, onImport, templateFileName = 'template',
  referenceSheets, sampleRows, importErrors,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const visible = useEnterTransition();

  const reset = () => {
    setStep('upload');
    setFile(null);
    setSheetHeaders([]);
    setSheetData([]);
    setMapping({});
    setImporting(false);
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const parseFile = useCallback(async (f: File) => {
    setFile(f);
    try {
      const XLSX = await import('xlsx');
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

      if (json.length < 2) {
        setResult({ success: 0, errors: [t('shared.import.noDataOrHeader')] });
        setStep('result');
        return;
      }

      const headers = (json[0] as string[]).map(h => String(h || '').trim());
      const data = json.slice(1).filter(row => (row as any[]).some(cell => cell !== null && cell !== undefined && cell !== ''));
      setSheetHeaders(headers);
      setSheetData(data as any[][]);

      const autoMap: Record<string, string> = {};
      columns.forEach(col => {
        const match = headers.find(h =>
          h.toLowerCase() === col.label.toLowerCase() ||
          h.toLowerCase().includes(col.label.toLowerCase()) ||
          col.label.toLowerCase().includes(h.toLowerCase())
        );
        if (match) autoMap[col.key] = match;
      });
      setMapping(autoMap);
      setStep('mapping');
    } catch {
      setResult({ success: 0, errors: [t('shared.import.cannotReadFile')] });
      setStep('result');
    }
  }, [columns, t]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) parseFile(f);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
  };

  const handleImport = async () => {
    setImporting(true);
    const errors: string[] = [];
    const parsed: Record<string, any>[] = [];

    const unmapped = columns.filter(c => c.required && !mapping[c.key]);
    if (unmapped.length > 0) {
      setResult({ success: 0, errors: [t('shared.import.missingRequiredColumns', { columns: unmapped.map(c => c.label).join(', ') })] });
      setStep('result');
      setImporting(false);
      return;
    }

    sheetData.forEach((row, rowIdx) => {
      const record: Record<string, any> = {};
      let hasError = false;

      columns.forEach(col => {
        const headerName = mapping[col.key];
        if (!headerName) return;
        const colIdx = sheetHeaders.indexOf(headerName);
        if (colIdx === -1) return;
        const value = row[colIdx];

        if (col.required && (value === null || value === undefined || value === '')) {
          errors.push(t('shared.import.rowEmptyField', { row: rowIdx + 2, column: col.label }));
          hasError = true;
          return;
        }
        record[col.key] = value ?? '';
      });

      if (!hasError) parsed.push(record);
    });

    try {
      if (parsed.length > 0) await onImport(parsed);
      setResult({ success: parsed.length, errors });
    } catch (err: any) {
      setResult({ success: 0, errors: [err?.message || t('shared.import.importError')] });
    }
    setStep('result');
    setImporting(false);
  };

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const headerRow = columns.map(c => c.label);
    const templateData: any[][] = [headerRow];
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
        const refData: any[][] = [ref.headers, ...ref.data];
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

  const downloadErrorReport = async () => {
    if (!importErrors || importErrors.length === 0) return;
    const XLSX = await import('xlsx');
    const headers = [t('shared.import.errorReportRow'), t('shared.import.errorReportCode'), t('shared.import.errorReportName'), t('shared.import.errorReportMsg')];
    const data = importErrors.map((e) => [e.row, e.ma_hang_hoa ?? '', e.ten_hang_hoa ?? '', e.msg]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = [{ wch: 8 }, { wch: 16 }, { wch: 30 }, { wch: 50 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');
    XLSX.writeFile(wb, `${templateFileName}_errors.xlsx`);
  };

  if (!open) return null;

  const hasStructuredErrors = importErrors && importErrors.length > 0;

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
                      "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all",
                      dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/20"
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {t('shared.import.rowsRead', { count: sheetData.length })}
                    </p>
                  </div>

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
                                  "w-full h-7 px-2 text-xs border rounded-lg bg-background outline-none transition-all cursor-pointer",
                                  mapping[col.key] ? "border-primary/30 text-foreground" : "border-border text-muted-foreground"
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

            {step === 'result' && result && (
              <div key="result" className="text-center py-6">
                  {result.success > 0 ? (
                    <div className="space-y-3">
                      <CheckCircle2 size={48} className="mx-auto text-primary" />
                      <p className="text-sm font-semibold text-foreground">{t('shared.import.success')}</p>
                      <p className="text-xs text-muted-foreground">{t('shared.import.successCount', { count: result.success })}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AlertCircle size={48} className="mx-auto text-destructive" />
                      <p className="text-sm font-semibold text-foreground">{t('shared.import.error')}</p>
                    </div>
                  )}

                  {/* Structured error table */}
                  {hasStructuredErrors && (
                    <div className="mt-4 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-destructive flex items-center gap-1.5">
                          <FileWarning size={13} />
                          {t('shared.import.errorCount', { count: importErrors!.length })}
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
                              <th className="px-2 py-1.5 text-left font-medium text-destructive">{t('shared.import.errorReportCode')}</th>
                              <th className="px-2 py-1.5 text-left font-medium text-destructive">{t('shared.import.errorReportMsg')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-destructive/10">
                            {importErrors!.slice(0, 50).map((err, i) => (
                              <tr key={i} className="hover:bg-destructive/5">
                                <td className="px-2 py-1 text-destructive/80 font-mono">{err.row}</td>
                                <td className="px-2 py-1 text-foreground font-mono">{err.ma_hang_hoa}</td>
                                <td className="px-2 py-1 text-destructive/80">{err.msg}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {importErrors!.length > 50 && (
                          <p className="text-2xs text-muted-foreground text-center py-1.5">
                            {t('shared.import.moreErrors', { count: importErrors!.length - 50 })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fallback string errors */}
                  {!hasStructuredErrors && result.errors.length > 0 && (
                    <div className="mt-4 text-left bg-destructive/5 border border-destructive/20 rounded-lg p-3 max-h-[150px] overflow-y-auto custom-scrollbar">
                      {result.errors.map((err, i) => (
                        <p key={i} className="text-xs text-destructive py-0.5">{err}</p>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0">
            <Button variant="outline" onClick={handleClose} className="text-xs h-8">
              {step === 'result' ? t('common.close') : t('common.cancel')}
            </Button>
            <div className="flex gap-2">
              {step === 'mapping' && (
                <>
                  <Button variant="outline" onClick={() => { setStep('upload'); setFile(null); }} className="text-xs h-8">
                    {t('common.selectFile')}
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={importing}
                    className="bg-primary text-white text-xs h-8 px-4"
                  >
                    {importing ? t('common.processing') : t('shared.import.importRows', { count: sheetData.length })}
                  </Button>
                </>
              )}
              {step === 'result' && result && result.success > 0 && (
                <Button onClick={handleClose} className="bg-primary text-white text-xs h-8 px-4">
                  {t('common.finish')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImportDialog;
