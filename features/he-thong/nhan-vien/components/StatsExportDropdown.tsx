import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileDown, ChevronDown, Loader2, FileSpreadsheet, FileText } from 'lucide-react';
import { cn } from '../../../../lib/utils';

export type StatsExportFormat = 'excel' | 'pdf';

export interface StatsExportDropdownProps {
  onExport: (format: StatsExportFormat) => Promise<void>;
  disabled?: boolean;
  /** true = chỉ hiển thị nút icon (mobile), false = nút đầy đủ (desktop) */
  compact?: boolean;
}

const StatsExportDropdown: React.FC<StatsExportDropdownProps> = ({
  onExport,
  disabled = false,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = async (format: StatsExportFormat) => {
    setIsExporting(true);
    setOpen(false);
    try {
      await onExport(format);
    } finally {
      setIsExporting(false);
    }
  };

  if (compact) {
    return (
      <div className="relative shrink-0" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={disabled || isExporting}
          className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-white shadow-sm active:scale-95"
        >
          {isExporting ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1.5 w-52 bg-card rounded-xl shadow-xl border border-border z-50 overflow-hidden">
            <div className="p-1.5">
              <button
                type="button"
                onClick={() => handleSelect('excel')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 text-left"
              >
                <FileSpreadsheet size={16} className="text-emerald-600" /> Excel
              </button>
              <button
                type="button"
                onClick={() => handleSelect('pdf')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 text-left"
              >
                <FileText size={16} className="text-red-600" /> PDF
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled || isExporting}
        className={cn(
          'h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium border shadow-sm active:scale-95',
          'bg-primary text-white border-primary hover:bg-primary/90'
        )}
      >
        {isExporting ? (
          <Loader2 size={14} className="animate-spin shrink-0" />
        ) : (
          <FileDown size={14} className="shrink-0" />
        )}
        <span>{isExporting ? t('employee.stats.exporting') : t('employee.stats.exportReport')}</span>
        {!isExporting && (
          <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-card rounded-xl shadow-xl border border-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('employee.stats.selectFormat')}
            </p>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              onClick={() => handleSelect('excel')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={16} className="text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  Excel (.xlsx)
                </p>
                <p className="text-2xs text-muted-foreground">{t('employee.stats.dataAndMeta')}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleSelect('pdf')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  PDF (.pdf)
                </p>
                <p className="text-2xs text-muted-foreground">{t('employee.stats.printReport')}</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsExportDropdown;
