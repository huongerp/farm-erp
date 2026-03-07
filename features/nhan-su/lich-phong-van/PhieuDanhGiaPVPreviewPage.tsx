/**
 * Trang preview phiếu đánh giá phỏng vấn (mở tab mới) – toolbar Đóng + Tải PDF + In.
 * Route: /phieu-danh-gia-pv/:id
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Printer, Download } from 'lucide-react';
import { useLichPhongVans } from './hooks/use-lich-phong-van';
import { exportPhieuDanhGiaPVToPDF } from './utils/export-phieu-danh-gia';
import PhieuDanhGiaPVPreviewContent from './components/PhieuDanhGiaPVPreviewContent';

const PhieuDanhGiaPVPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: list = [], isLoading, isError, error, refetch } = useLichPhongVans();
  const record = id ? list.find((a) => a.id === id) : undefined;
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!record) return;
    const prev = document.title;
    document.title = `${t('lichPhongVan.preview.title')} - ${record.ten_ung_vien ?? record.id} · V${record.so_vong}`;
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
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!record) return;
    setExporting(true);
    try {
      await exportPhieuDanhGiaPVToPDF(record);
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
            ? (error?.message ?? t('lichPhongVan.preview.loadError'))
            : t('lichPhongVan.preview.notFound')}
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
        className="phieu-danh-gia-pv-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
        role="main"
        aria-label={t('lichPhongVan.preview.title')}
      >
        <div className="phieu-danh-gia-pv-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0 print:hidden">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/50 disabled:opacity-70 disabled:pointer-events-none"
            >
              <Download size={16} />
              {t('lichPhongVan.preview.download')} PDF
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90"
            >
              <Printer size={16} />
              {t('lichPhongVan.preview.print')}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center print:p-0 print:overflow-visible">
          <div
            className="bg-white shadow-xl rounded-sm print:shadow-none"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            <PhieuDanhGiaPVPreviewContent record={record!} />
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          .phieu-danh-gia-pv-preview-backdrop { background: #fff; }
          .phieu-danh-gia-pv-preview-toolbar { display: none !important; }
          .phieu-danh-gia-pv-preview-content { box-shadow: none; }
        }
      `}</style>
    </>
  );
};

export default PhieuDanhGiaPVPreviewPage;
