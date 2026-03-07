/**
 * Trang preview / in phiếu thu chi (mở tab mới) – toolbar Đóng, In.
 * Chuẩn văn bản Việt Nam, header lấy từ Thông tin công ty.
 * Route: /tai-chinh/thu-chi/preview/:id
 */
import React, { useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Printer } from 'lucide-react';
import { useThuChiById } from './hooks/use-thu-chi';
import ThuChiPhieuPreviewContent from './components/ThuChiPhieuPreviewContent';

const ThuChiPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: record, isLoading, isError, error, refetch } = useThuChiById(id ?? undefined);

  useEffect(() => {
    if (!record) return;
    const prev = document.title;
    document.title = `${t('thuChi.preview.title')} - ${record.ma_giao_dich}`;
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
            ? (error?.message ?? t('thuChi.preview.loadError'))
            : t('thuChi.preview.notFound')}
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
            {t('thuChi.preview.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="thu-chi-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
        role="main"
        aria-label={t('thuChi.preview.title')}
      >
        <div className="thu-chi-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0 print:hidden">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('thuChi.preview.close')}
          >
            <X size={20} />
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90"
          >
            <Printer size={16} />
            {t('thuChi.preview.print')}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center print:p-0 print:overflow-visible">
          <div
            className="bg-white shadow-xl rounded-sm print:shadow-none thu-chi-phieu-preview-content-wrapper"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            <ThuChiPhieuPreviewContent data={record!} />
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          .thu-chi-preview-backdrop { background: #fff; }
          .thu-chi-preview-toolbar { display: none !important; }
          .thu-chi-phieu-preview-content-wrapper { box-shadow: none; }
        }
      `}</style>
    </>
  );
};

export default ThuChiPreviewPage;
