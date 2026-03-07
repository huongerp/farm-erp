/**
 * Trang preview / in thư mời phỏng vấn theo mẫu thiết lập (Mẫu phản hồi – Mời phỏng vấn).
 * Route: /thu-moi-phong-van/:id
 */
import React, { useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Printer } from 'lucide-react';
import { useLichPhongVans } from './hooks/use-lich-phong-van';
import { useMauPhanHois } from '@/features/nhan-su/thiet-lap-tuyen-dung/hooks/use-mau-phan-hoi';
import { useUIStore } from '@/store/useStore';
import { fillThuMoiContent, fillThuMoiTitle } from './utils/thu-moi-phong-van';

const TEMPLATE_MA_MOI_PV = 'MOI_PV';

const ThuMoiPhongVanPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const { data: list = [], isLoading, isError, error, refetch } = useLichPhongVans();
  const { data: mauPhanHoiList = [] } = useMauPhanHois();
  const record = id ? list.find((a) => a.id === id) : undefined;

  const template = useMemo(
    () => mauPhanHoiList.find((m) => m.ma === TEMPLATE_MA_MOI_PV && m.trang_thai === 1),
    [mauPhanHoiList]
  );

  const company = useMemo(
    () => ({
      companyName: companyInfo.companyName,
      phone: companyInfo.phone,
      email: companyInfo.email,
    }),
    [companyInfo.companyName, companyInfo.phone, companyInfo.email]
  );

  const [title, bodyHtml] = useMemo(() => {
    if (!record || !template) return ['', ''];
    const filledTitle = fillThuMoiTitle(template.tieu_de, record, company);
    const filledBody = fillThuMoiContent(template.noi_dung_mau, record, company);
    return [filledTitle, filledBody];
  }, [record, template, company]);

  useEffect(() => {
    if (!record) return;
    const prev = document.title;
    document.title = `${t('lichPhongVan.thuMoi.previewTitle')} - ${record.ten_ung_vien ?? record.id}`;
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
  const noTemplate = record && !template;

  if (notFound || loadError || noTemplate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">
          {loadError
            ? (error?.message ?? t('lichPhongVan.preview.loadError'))
            : noTemplate
              ? t('lichPhongVan.thuMoi.noTemplate')
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
        className="thu-moi-pv-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
        role="main"
        aria-label={t('lichPhongVan.thuMoi.previewTitle')}
      >
        <div className="thu-moi-pv-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0 print:hidden">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('common.close')}
          >
            <X size={20} />
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

        <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center print:p-0 print:overflow-visible">
          <div
            className="bg-white shadow-xl rounded-sm text-gray-900 font-sans text-[10pt] print:shadow-none"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            <div className="thu-moi-pv-preview-content p-6 min-h-full">
              {title && <h1 className="text-[14pt] font-bold mb-4">{title}</h1>}
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          .thu-moi-pv-preview-backdrop { background: #fff; }
          .thu-moi-pv-preview-toolbar { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default ThuMoiPhongVanPreviewPage;
