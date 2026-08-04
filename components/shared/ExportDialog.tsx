import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Download, X, FileSpreadsheet, FileText, Check } from 'lucide-react';
import Button from '../ui/Button';
import { cn, getTodayISODate } from '../../lib/utils';
import { downloadBlob } from '../../lib/download-blob';
import { useEnterTransition } from '../../lib/usePresenceTransition';

function escapeCsvCell(val: unknown): string {
  let cell = val == null ? '' : String(val);
  cell = cell.replace(/"/g, '""');
  if (cell.search(/("|,|\n|\r)/g) >= 0) return `"${cell}"`;
  return cell;
}

/** Excel giới hạn 31 ký tự; không dùng [] * ? : \\ / */
function safeExcelSheetName(name: string): string {
  const t = name.replace(/[[\]*?:\\/]/g, '_').trim() || 'Data';
  return t.length > 31 ? t.slice(0, 31) : t;
}
import { ensureJsPDFVietnameseFont, JSPDF_VI_FONT_FAMILY } from '../../lib/jspdf-vietnamese-font';
import { DIALOG_SIZE } from '../../lib/dialog-sizes';

export interface ExportColumn {
  key: string;
  label: string;
}

type ExportFormat = 'xlsx' | 'csv' | 'pdf';
type ExportScope = 'all' | 'page' | 'selected';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  columns: ExportColumn[];
  data: Record<string, any>[];
  selectedData?: Record<string, any>[];
  paginatedData?: Record<string, any>[];
  fileName: string;
  visibleColumnKeys?: string[];
  /** Tên sheet Excel (mặc định Data). Tối đa 31 ký tự sau khi làm sạch. */
  sheetName?: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  columns,
  data,
  selectedData = [],
  paginatedData = [],
  fileName,
  visibleColumnKeys,
  sheetName,
}) => {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [scope, setScope] = useState<ExportScope>('all');
  const [selectedCols, setSelectedCols] = useState<Set<string>>(() => {
    const allKeys = columns.map((c) => c.key);
    if (visibleColumnKeys != null && visibleColumnKeys.length > 0) {
      const allowed = new Set(allKeys);
      const picked = visibleColumnKeys.filter((k) => allowed.has(k));
      return new Set(picked.length > 0 ? picked : allKeys);
    }
    return new Set(allKeys);
  });
  const [exporting, setExporting] = useState(false);
  const visible = useEnterTransition();

  const toggleCol = (key: string) => {
    const next = new Set(selectedCols);
    if (next.has(key)) {
      if (next.size > 1) next.delete(key); // keep at least 1
    } else {
      next.add(key);
    }
    setSelectedCols(next);
  };

  const selectAllCols = () => {
    if (selectedCols.size === columns.length) {
      setSelectedCols(new Set([columns[0].key])); // keep first
    } else {
      setSelectedCols(new Set(columns.map(c => c.key)));
    }
  };

  const getExportData = (): Record<string, any>[] => {
    switch (scope) {
      case 'selected': return selectedData;
      case 'page': return paginatedData;
      default: return data;
    }
  };

  const exportCols = columns.filter(c => selectedCols.has(c.key));

  const handleExport = async () => {
    const rows = getExportData();
    if (rows.length === 0) {
      toast.warning(t('shared.export.noData'));
      return;
    }
    setExporting(true);
    const dateStr = getTodayISODate();
    const fullName = `${fileName}_${dateStr}`;

    try {
      if (format === 'xlsx' || format === 'csv') {
        const XLSX = await import('xlsx');
        const wsData = [
          exportCols.map((c) => c.label),
          ...rows.map((row) => exportCols.map((c) => row[c.key] ?? '')),
        ];

        if (format === 'csv') {
          const headerLine = exportCols.map((c) => escapeCsvCell(c.label)).join(',');
          const dataLines = rows.map((row) =>
            exportCols.map((c) => escapeCsvCell(row[c.key] ?? '')).join(',')
          );
          const blob = new Blob([`\uFEFF${[headerLine, ...dataLines].join('\n')}`], {
            type: 'text/csv;charset=utf-8;',
          });
          downloadBlob(blob, `${fullName}.csv`);
        } else {
          const ws = XLSX.utils.aoa_to_sheet(wsData);
          ws['!cols'] = exportCols.map((col) => ({
            wch:
              Math.max(
                col.label.length,
                ...rows.slice(0, 50).map((r) => String(r[col.key] ?? '').length)
              ) + 2,
          }));
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, safeExcelSheetName(sheetName ?? 'Data'));
          XLSX.writeFile(wb, `${fullName}.xlsx`);
        }
      } else if (format === 'pdf') {
        const [{ jsPDF }, autoTableMod] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable'),
        ]);
        const autoTable = autoTableMod.default;
        const doc = new jsPDF({ orientation: exportCols.length > 5 ? 'l' : 'p', unit: 'mm', format: 'a4' });
        await ensureJsPDFVietnameseFont(doc);

        // Title
        doc.setFontSize(12);
        doc.text(fileName.replace(/_/g, ' '), 14, 15);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(t('shared.export.pdfHeader', { date: dateStr, count: rows.length }), 14, 21);

        autoTable(doc, {
          head: [exportCols.map(c => c.label)],
          body: rows.map(row => exportCols.map(c => String(row[c.key] ?? ''))),
          startY: 26,
          styles: { font: JSPDF_VI_FONT_FAMILY, fontSize: 7, cellPadding: 2 },
          headStyles: {
            font: JSPDF_VI_FONT_FAMILY,
            fillColor: [59, 130, 246],
            fontSize: 7,
            fontStyle: 'bold',
          },
          alternateRowStyles: { fillColor: [248, 250, 252], font: JSPDF_VI_FONT_FAMILY },
        });

        doc.save(`${fullName}.pdf`);
      }
      toast.success(t('shared.export.success'));
      onClose();
    } catch (e) {
      if (import.meta.env.DEV) console.error('Export error:', e);
      toast.error(t('shared.export.error'));
    } finally {
      setExporting(false);
    }
  };

  if (!open) return null;

  const formats: { id: ExportFormat; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'xlsx', label: 'Excel', icon: FileSpreadsheet, desc: '.xlsx' },
    { id: 'csv', label: 'CSV', icon: FileText, desc: '.csv' },
    { id: 'pdf', label: 'PDF', icon: FileText, desc: '.pdf' },
  ];

  const scopes: { id: ExportScope; label: string; count: number }[] = [
    { id: 'all', label: t('shared.export.scopeAll'), count: data.length },
    { id: 'page', label: t('shared.export.scopeCurrentPage'), count: paginatedData.length },
    { id: 'selected', label: t('shared.export.scopeSelected'), count: selectedData.length },
  ];

  return (
    <>
      <div
        onClick={onClose}
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
          <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><Download size={16} /></div>
              <h3 className="text-sm font-semibold text-foreground">{t('shared.export.title')}</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

            {/* Format */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('shared.export.format')}</p>
              <div className="flex gap-2">
                {formats.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all",
                      format === f.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <f.icon size={18} />
                    <span>{f.label}</span>
                    <span className="text-2xs opacity-60">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scope */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('shared.export.scope')}</p>
              <div className="flex gap-2">
                {scopes.filter(s => s.count > 0 || s.id === 'all').map(s => (
                  <button
                    key={s.id}
                    onClick={() => setScope(s.id)}
                    disabled={s.count === 0}
                    className={cn(
                      "flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all",
                      scope === s.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30",
                      s.count === 0 && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <span>{s.label}</span>
                    <span className="block text-2xs tabular-nums opacity-60 mt-0.5">{s.count} {t('shared.export.rows')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Column selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">{t('shared.export.selectColumns')}</p>
                <button onClick={selectAllCols} className="text-2xs text-primary hover:underline">
                  {selectedCols.size === columns.length ? t('shared.export.deselectAll') : t('shared.export.selectAll')}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {columns.map(col => (
                  <div
                    key={col.key}
                    onClick={() => toggleCol(col.key)}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all text-xs",
                      selectedCols.has(col.key) ? "bg-primary/5 text-foreground" : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all shrink-0",
                      selectedCols.has(col.key) ? "bg-primary border-primary text-white" : "border-border"
                    )}>
                      {selectedCols.has(col.key) && <Check size={8} className="stroke-[3px]" />}
                    </div>
                    <span className="truncate">{col.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0">
            <Button variant="outline" onClick={onClose} className="text-xs h-9">{t('common.cancel')}</Button>
            <Button
              onClick={handleExport}
              disabled={exporting || getExportData().length === 0}
              className="bg-primary text-white text-xs h-9 px-4"
            >
              <Download size={13} className="mr-1.5" />
              {exporting ? t('shared.export.exporting') : t('shared.export.exportRows', { count: getExportData().length })}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportDialog;
