/**
 * Trang preview / in phiếu thanh lý (mở tab mới) – toolbar Đóng, Tải (PDF/DOC), In.
 * Route: /nhan-su/hop-dong/thanh-ly/preview/:id
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Printer, Download, ChevronDown } from 'lucide-react';
import { usePhieuThanhLyList } from './hooks/use-hop-dong';
import { useHopDongs } from './hooks/use-hop-dong';
import {
  exportPhieuThanhLyToPDF,
  exportPhieuThanhLyToDoc,
} from './utils/export-phieu-thanh-ly';
import PhieuThanhLyPreviewContent from './components/PhieuThanhLyPreviewContent';

const PhieuThanhLyPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: phieuList = [], isLoading: loadingPhieu, isError: errorPhieu, error: errPhieu, refetch: refetchPhieu } = usePhieuThanhLyList();
  const { data: hopDongList = [], isLoading: loadingHd } = useHopDongs();

  const phieu = id ? phieuList.find((p) => p.id === id) : undefined;
  const hopDong = phieu ? hopDongList.find((h) => h.id === phieu.id_hop_dong) : undefined;
  const record = phieu && hopDong ? { phieu, hopDong } : undefined;

  const [exporting, setExporting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  useEffect(() => {
    if (!record) return;
    const prev = document.title;
    document.title = `${t('hopDong.phieuThanhLy.preview.title')} - ${record.phieu.so_phieu}`;
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

  const handleExportPdf = async () => {
    if (!record) return;
    setDownloadOpen(false);
    setExporting(true);
    try {
      await exportPhieuThanhLyToPDF(record.phieu, record.hopDong);
    } finally {
      setExporting(false);
    }
  };

  const handleExportDoc = async () => {
    if (!record) return;
    setDownloadOpen(false);
    setExporting(true);
    try {
      await exportPhieuThanhLyToDoc(record.phieu, record.hopDong);
    } finally {
      setExporting(false);
    }
  };

  const isLoading = loadingPhieu || loadingHd;
  const notFound = !isLoading && !record && !errorPhieu;
  const loadError = errorPhieu;

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

  if (notFound || loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">
          {loadError
            ? (errPhieu?.message ?? t('hopDong.phieuThanhLy.preview.loadError'))
            : t('hopDong.phieuThanhLy.preview.notFound')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {loadError && (
            <button
              type="button"
              onClick={() => refetchPhieu()}
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
        className="phieu-thanh-ly-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
        role="main"
        aria-label={t('hopDong.phieuThanhLy.preview.title')}
      >
        <div className="phieu-thanh-ly-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0 print:hidden">
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
                  <div className="absolute right-0 top-full mt-1 py-1 rounded-lg border border-border bg-card shadow-lg z-10 min-w-[100px]">
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 rounded-t-lg"
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleExportDoc}
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
            <PhieuThanhLyPreviewContent phieu={record!.phieu} hopDong={record!.hopDong} />
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          .phieu-thanh-ly-preview-backdrop { background: #fff; }
          .phieu-thanh-ly-preview-toolbar { display: none !important; }
          .phieu-thanh-ly-preview-content { box-shadow: none; }
        }
      `}</style>
    </>
  );
};

export default PhieuThanhLyPreviewPage;
