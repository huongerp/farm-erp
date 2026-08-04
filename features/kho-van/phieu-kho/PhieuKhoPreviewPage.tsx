/**
 * Trang preview phiếu kho (mở tab mới) – toolbar Đóng + Tải (PDF / …) + In.
 * Route: /mua-hang/phieu-kho/preview/:id
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Printer, Download, ChevronDown, FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { usePhieuKhoById } from './hooks/use-phieu-kho';
import { exportPhieuKhoToPDF, exportPhieuKhoToDoc, exportPhieuKhoToXLSX } from './utils/export-phieu-kho';
import PhieuKhoPreviewContent from './components/PhieuKhoPreviewContent';

export type PhieuKhoExportFormat = 'pdf' | 'doc' | 'xlsx';

const EXPORT_OPTIONS: { format: PhieuKhoExportFormat; label: string; icon: React.ReactNode }[] = [
  { format: 'pdf', label: 'PDF', icon: <FileText size={16} /> },
  { format: 'doc', label: 'DOC', icon: <FileType size={16} /> },
  { format: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} /> },
];

const PhieuKhoPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: phieu, isLoading, isError, error, refetch } = usePhieuKhoById(id ?? undefined);
  const [exporting, setExporting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!phieu) return;
    const prev = document.title;
    document.title = `${t('phieuKho.preview.title')} - ${phieu.so_phieu}`;
    return () => {
      document.title = prev;
    };
  }, [phieu, t]);

  const handleClose = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      window.close();
    }
  }, [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (downloadOpen) setDownloadOpen(false);
        else handleClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose, downloadOpen]);

  useEffect(() => {
    if (!downloadOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDownloadOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [downloadOpen]);

  const handlePrint = () => {
    // Inject @page override: lề do @page; content dùng print:p-0
    // T:15mm R:15mm B:15mm L:20mm — khớp pt/pr/pb/pl trong PreviewContent
    const styleEl = document.createElement('style');
    styleEl.id = 'phieu-kho-print-page-override';
    styleEl.innerHTML = '@page { margin: 15mm 15mm 15mm 20mm !important; size: A4 portrait; }';
    document.head.appendChild(styleEl);

    const cleanup = () => {
      document.getElementById('phieu-kho-print-page-override')?.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    window.print();
  };

  const handleExport = useCallback(
    async (format: PhieuKhoExportFormat) => {
      if (!phieu) return;
      setDownloadOpen(false);
      setExporting(true);
      try {
        const chiTiet = phieu.chi_tiet ?? [];
        if (format === 'pdf') await exportPhieuKhoToPDF(phieu, chiTiet);
        else if (format === 'doc') await exportPhieuKhoToDoc(phieu, chiTiet);
        else if (format === 'xlsx') await exportPhieuKhoToXLSX(phieu, chiTiet);
      } finally {
        setExporting(false);
      }
    },
    [phieu]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div
          className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
          aria-label={t('common.loading')}
        />
      </div>
    );
  }

  const notFound = !isLoading && !phieu && !isError;
  const loadError = isError;

  if (notFound || loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">
          {loadError
            ? (error?.message ?? t('phieuKho.preview.loadError'))
            : t('phieuKho.preview.notFound')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {loadError && (
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted/50 font-medium"
            >
              {t('common.retry')}
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
          >
            <X size={16} />
            {t('common.close')}
          </button>
        </div>
      </div>
    );
  }

  if (!phieu) return null;

  return (
    <>
      <div
        className="phieu-kho-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
        role="main"
        aria-label={t('phieuKho.preview.title')}
      >
        <div className="phieu-kho-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0 print:hidden">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDownloadOpen((o) => !o)}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/50 disabled:opacity-70 disabled:pointer-events-none"
              >
                <Download size={16} />
                {t('phieuKho.preview.download')}
                <ChevronDown size={14} className={`transition-transform ${downloadOpen ? 'rotate-180' : ''}`} />
              </button>
              {downloadOpen && (
                <div className="absolute right-0 top-full mt-1 min-w-[120px] py-1 bg-card rounded-xl border border-border shadow-xl z-[100]">
                  {EXPORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.format}
                      type="button"
                      onClick={() => handleExport(opt.format)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60 rounded-none first:rounded-t-xl last:rounded-b-xl"
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90"
            >
              <Printer size={16} />
              {t('phieuKho.preview.print')}
            </button>
          </div>
        </div>

        <div className="phieu-kho-preview-body flex-1 overflow-auto p-4 md:p-6 flex justify-center items-start print:p-0 print:overflow-visible">
          <div className="bg-white shadow-xl rounded-sm phieu-kho-preview-content-wrapper" style={{ width: '210mm', minHeight: '297mm' }}>
            <PhieuKhoPreviewContent phieu={phieu} />
          </div>
        </div>
      </div>
    </>
  );
};

export default PhieuKhoPreviewPage;
