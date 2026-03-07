/**
 * Trang preview phiếu kiểm kê (mở tab mới) – toolbar Đóng + Tải PDF + In.
 * Chuẩn như hồ sơ tài sản. Route: /phieu-kiem-ke/:id
 */
import React, { useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Printer, Download } from 'lucide-react';
import { useDotKiemKeById, useChiTietByDot } from './hooks/use-kiem-ke-tai-san';
import { exportPhieuKiemKeToPDF } from './utils/export-phieu-kiem-ke';
import PhieuKiemKePreviewContent from './components/PhieuKiemKePreviewContent';

const PhieuKiemKePreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: dot, isLoading, isError, error, refetch } = useDotKiemKeById(id ?? null);
  const { data: chiTiet = [], isLoading: chiTietLoading } = useChiTietByDot(id ?? null);

  useEffect(() => {
    if (!dot) return;
    const prev = document.title;
    document.title = `${t('kiemKeTaiSan.preview.title')} - ${dot.ma_dot} · ${dot.ten_dot}`;
    return () => {
      document.title = prev;
    };
  }, [dot, t]);

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

  const [exporting, setExporting] = React.useState(false);
  const handleDownloadPDF = useCallback(async () => {
    if (!dot) return;
    setExporting(true);
    try {
      await exportPhieuKiemKeToPDF(dot, chiTiet);
    } finally {
      setExporting(false);
    }
  }, [dot, chiTiet]);

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

  const notFound = !isLoading && !dot && !isError;
  const loadError = isError;

  if (notFound || loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">
          {loadError
            ? (error?.message ?? t('kiemKeTaiSan.preview.loadError'))
            : t('kiemKeTaiSan.preview.notFound')}
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
        className="phieu-kiem-ke-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
        role="main"
        aria-label={t('kiemKeTaiSan.preview.title')}
      >
        <div className="phieu-kiem-ke-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0">
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
              {t('kiemKeTaiSan.preview.download')} PDF
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90"
            >
              <Printer size={16} />
              {t('kiemKeTaiSan.preview.print')}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center">
          <div
            className="bg-white shadow-xl rounded-sm"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            {chiTietLoading && !chiTiet.length ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                {t('kiemKeTaiSan.loading')}
              </div>
            ) : (
              <PhieuKiemKePreviewContent dot={dot} chiTiet={chiTiet} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PhieuKiemKePreviewPage;
