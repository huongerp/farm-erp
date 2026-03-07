/**
 * Trang preview phiếu đề xuất vật tư (mở tab mới) – toolbar Đóng + Tải PDF + In.
 * Route: /mua-hang/phieu-de-xuat-vat-tu/preview/:id
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Printer, FileDown, FileText, Table } from 'lucide-react';
import { usePhieuDeXuatVatTuById } from './hooks/use-phieu-de-xuat-vat-tu';
import { exportPhieuDeXuatVatTuToPDF, exportPhieuDeXuatVatTuToDoc, exportPhieuDeXuatVatTuToXLSX } from './utils/export-phieu-de-xuat-vat-tu';
import PhieuDeXuatVatTuPreviewContent from './components/PhieuDeXuatVatTuPreviewContent';

const PhieuDeXuatVatTuPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: phieu, isLoading, isError, error, refetch } = usePhieuDeXuatVatTuById(id ?? undefined);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!phieu) return;
    const prev = document.title;
    document.title = `${t('phieuDeXuatVatTu.preview.title')} - ${phieu.so_phieu}`;
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
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = useCallback(async () => {
    if (!phieu) return;
    setExporting(true);
    try {
      await exportPhieuDeXuatVatTuToPDF(phieu, phieu.chi_tiet ?? []);
    } finally {
      setExporting(false);
    }
  }, [phieu]);

  const handleDownloadDoc = useCallback(() => {
    if (!phieu) return;
    exportPhieuDeXuatVatTuToDoc(phieu, phieu.chi_tiet ?? []);
  }, [phieu]);

  const handleDownloadXlsx = useCallback(async () => {
    if (!phieu) return;
    setExporting(true);
    try {
      await exportPhieuDeXuatVatTuToXLSX(phieu, phieu.chi_tiet ?? []);
    } finally {
      setExporting(false);
    }
  }, [phieu]);

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
            ? (error?.message ?? t('phieuDeXuatVatTu.preview.loadError'))
            : t('phieuDeXuatVatTu.preview.notFound')}
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
        className="phieu-de-xuat-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
        role="main"
        aria-label={t('phieuDeXuatVatTu.preview.title')}
      >
        <div className="phieu-de-xuat-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/50 disabled:opacity-70 disabled:pointer-events-none"
            >
              <FileDown size={16} />
              {t('phieuDeXuatVatTu.preview.downloadPdf')}
            </button>
            <button
              type="button"
              onClick={handleDownloadDoc}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/50 disabled:opacity-70 disabled:pointer-events-none"
            >
              <FileText size={16} />
              {t('phieuDeXuatVatTu.preview.downloadDoc')}
            </button>
            <button
              type="button"
              onClick={handleDownloadXlsx}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/50 disabled:opacity-70 disabled:pointer-events-none"
            >
              <Table size={16} />
              {t('phieuDeXuatVatTu.preview.downloadXlsx')}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90"
            >
              <Printer size={16} />
              {t('phieuDeXuatVatTu.preview.print')}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center">
          <div className="bg-white shadow-xl rounded-sm print:shadow-none" style={{ width: '210mm', minHeight: '297mm' }}>
            <PhieuDeXuatVatTuPreviewContent phieu={phieu!} />
          </div>
        </div>
      </div>
    </>
  );
};

export default PhieuDeXuatVatTuPreviewPage;
