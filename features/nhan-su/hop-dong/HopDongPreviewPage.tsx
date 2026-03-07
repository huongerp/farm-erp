/**
 * Trang preview / in hợp đồng (mở tab mới) – toolbar Đóng, Tải (PDF/XLSX/DOC), In.
 * Route: /nhan-su/hop-dong/preview/:id
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Printer, Download, ChevronDown } from 'lucide-react';
import { useHopDongs } from './hooks/use-hop-dong';
import {
  exportHopDongToPDF,
  exportHopDongToXLSX,
  exportHopDongToDoc,
  type HopDongExportFormat,
} from './utils/export-hop-dong';
import HopDongPreviewContent from './components/HopDongPreviewContent';

const HopDongPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: list = [], isLoading, isError, error, refetch } = useHopDongs();
  const record = id ? list.find((h) => h.id === id) : undefined;
  const [exporting, setExporting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  useEffect(() => {
    if (!record) return;
    const prev = document.title;
    document.title = `${t('hopDong.preview.title')} - ${record.so_hop_dong} · ${record.ten_ung_vien ?? record.id}`;
    return () => {
      document.title = prev;
    };
  }, [record, t]);

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
        setDownloadOpen(false);
        handleClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async (format: HopDongExportFormat) => {
    if (!record) return;
    setDownloadOpen(false);
    setExporting(true);
    try {
      if (format === 'pdf') await exportHopDongToPDF(record);
      else if (format === 'xlsx') await exportHopDongToXLSX(record);
      else if (format === 'doc') await exportHopDongToDoc(record);
    } finally {
      setExporting(false);
    }
  };

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

  const notFound = !isLoading && !record && !isError;
  const loadError = isError;

  if (notFound || loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">
          {loadError
            ? (error?.message ?? t('hopDong.preview.loadError'))
            : t('hopDong.preview.notFound')}
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
    <>
      <div
        className="hop-dong-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
        role="main"
        aria-label={t('hopDong.preview.title')}
      >
        <div className="hop-dong-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0 print:hidden">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setDownloadOpen((o) => !o)}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/50 disabled:opacity-70"
              >
                <Download size={16} />
                {t('hopDong.preview.download')}
                <ChevronDown size={14} />
              </button>
              {downloadOpen && (
                <>
                  <div
                    className="fixed inset-0 z-0"
                    aria-hidden
                    onClick={() => setDownloadOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 py-1 rounded-lg border border-border bg-card shadow-lg z-10 min-w-[120px]">
                    <button
                      type="button"
                      onClick={() => handleExport('pdf')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 rounded-t-lg"
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('xlsx')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                    >
                      XLSX
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('doc')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 rounded-b-lg"
                    >
                      DOC
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90"
            >
              <Printer size={16} />
              {t('hopDong.preview.print')}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center print:p-0 print:overflow-visible">
          <div
            className="bg-white shadow-xl rounded-sm print:shadow-none"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            <HopDongPreviewContent data={record!} />
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          .hop-dong-preview-backdrop { background: #fff; }
          .hop-dong-preview-toolbar { display: none !important; }
          .hop-dong-preview-content { box-shadow: none; }
        }
      `}</style>
    </>
  );
};

export default HopDongPreviewPage;
