/**
 * Trang preview in báo cáo nhân công — toolbar Đóng + Tải xuống + In (A4 dọc).
 * Route: /quan-ly-farm/bao-cao-nhan-cong/preview/:id
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, Printer, Download, ChevronDown, FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { useBaoCaoNhanCongById } from './hooks/use-bao-cao-nhan-cong';
import {
  exportBaoCaoNhanCongToPDF,
  exportBaoCaoNhanCongToDoc,
  exportBaoCaoNhanCongToXLSX,
  type BaoCaoNhanCongExportFormat,
} from './utils/export-bao-cao-nhan-cong';
import BaoCaoNhanCongPreviewContent from './components/BaoCaoNhanCongPreviewContent';
import { formatDateShort } from '../../../lib/utils';

const EXPORT_OPTIONS: { format: BaoCaoNhanCongExportFormat; label: string; icon: React.ReactNode }[] = [
  { format: 'pdf', label: 'PDF', icon: <FileText size={16} /> },
  { format: 'doc', label: 'DOC', icon: <FileType size={16} /> },
  { format: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} /> },
];

const BaoCaoNhanCongPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useBaoCaoNhanCongById(id ?? undefined);
  const [exporting, setExporting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) return;
    const prev = document.title;
    document.title = `${t('baoCaoNhanCong.preview.title')} - ${formatDateShort(data.ngay)}`;
    return () => {
      document.title = prev;
    };
  }, [data, t]);

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
    const styleEl = document.createElement('style');
    styleEl.id = 'bao-cao-nhan-cong-print-page-override';
    styleEl.innerHTML = '@page { margin: 15mm 15mm 15mm 20mm !important; size: A4 portrait; }';
    document.head.appendChild(styleEl);
    const cleanup = () => {
      document.getElementById('bao-cao-nhan-cong-print-page-override')?.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const handleExport = useCallback(
    async (format: BaoCaoNhanCongExportFormat) => {
      if (!data) return;
      setDownloadOpen(false);
      setExporting(true);
      try {
        if (format === 'pdf') await exportBaoCaoNhanCongToPDF(data);
        else if (format === 'doc') await exportBaoCaoNhanCongToDoc(data);
        else if (format === 'xlsx') await exportBaoCaoNhanCongToXLSX(data);
      } catch (e) {
        if (import.meta.env.DEV) console.error('Export error:', e);
        toast.error(t('common.exportError'));
      } finally {
        setExporting(false);
      }
    },
    [data, t]
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

  const notFound = !isLoading && !data && !isError;
  const loadError = isError;

  if (notFound || loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">
          {loadError
            ? (error?.message ?? t('baoCaoNhanCong.preview.loadError'))
            : t('baoCaoNhanCong.preview.notFound')}
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

  return (
    <div
      className="bao-cao-nhan-cong-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
      role="main"
      aria-label={t('baoCaoNhanCong.preview.title')}
    >
      <div className="bao-cao-nhan-cong-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0 print:hidden">
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
              {t('baoCaoNhanCong.preview.download')}
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
            {t('baoCaoNhanCong.preview.print')}
          </button>
        </div>
      </div>

      <div className="bao-cao-nhan-cong-preview-body flex-1 overflow-auto p-4 md:p-6 flex justify-center items-start print:p-0 print:overflow-visible">
        <div
          className="bg-white shadow-xl rounded-sm bao-cao-nhan-cong-preview-content-wrapper"
          style={{ width: '210mm', minHeight: '297mm' }}
        >
          <BaoCaoNhanCongPreviewContent data={data!} />
        </div>
      </div>
    </div>
  );
};

export default BaoCaoNhanCongPreviewPage;
