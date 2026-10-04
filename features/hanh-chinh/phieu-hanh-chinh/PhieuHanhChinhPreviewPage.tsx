/**
 * Trang in phiếu hành chính (mở tab mới) — toolbar Đóng + Tải xuống (PDF/DOC/XLSX) + In.
 * Route: /hanh-chinh/phieu-hanh-chinh/preview/:id
 *
 * Thân trang là iframe chứa đúng chuỗi HTML dùng để xuất PDF/DOC (utils/phieu-in-html.ts),
 * nên bản xem, bản in và file tải giống hệt nhau.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, Printer, Download, ChevronDown, FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { useAdminFormById } from './hooks/use-admin-form';
import { usePhieuHanhChinhViewScope } from './hooks/use-phieu-hanh-chinh-view-scope';
import { chonTabChoPhieu } from './core/deep-link';
import { soPhieuIn } from './core/phieu-in';
import { useAuthStore } from '../../../store/useStore';
import {
  buildPhieuHanhChinhHTML,
  exportPhieuHanhChinhDOC,
  exportPhieuHanhChinhPDF,
  exportPhieuHanhChinhXLSX,
  type PhieuHanhChinhExportFormat,
} from './utils/phieu-in-html';

const EXPORT_OPTIONS: { format: PhieuHanhChinhExportFormat; label: string; icon: React.ReactNode }[] = [
  { format: 'pdf', label: 'PDF', icon: <FileText size={16} /> },
  { format: 'doc', label: 'DOC', icon: <FileType size={16} /> },
  { format: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} /> },
];

const PhieuHanhChinhPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: phieu, isLoading, isError, error, refetch } = useAdminFormById(id ?? null);
  const { viewAll, isLoading: dangTaiPhamVi } = usePhieuHanhChinhViewScope();
  const currentUserId = useAuthStore((s) => s.user?.id ?? '');
  const [exporting, setExporting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Bảng phiếu chưa có RLS theo người: cổng "chỉ in phiếu của mình" nằm ở đây, giống deep-link.
  const duocXem = useMemo(
    () => !!phieu && chonTabChoPhieu({ nguoiTaoId: phieu.nguoi_tao_id, currentUserId, viewAll }).tab !== null,
    [phieu, currentUserId, viewAll]
  );
  const html = useMemo(() => (phieu && duocXem ? buildPhieuHanhChinhHTML(phieu) : ''), [phieu, duocXem]);

  useEffect(() => {
    if (!phieu) return;
    const prev = document.title;
    document.title = `${t('adminForm.print.pageTitle')} - ${soPhieuIn(phieu.id)}`;
    return () => {
      document.title = prev;
    };
  }, [phieu, t]);

  const handleClose = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // window.open(..., 'noopener') → window.opener === null, browser chặn window.close().
      navigate('/hanh-chinh/phieu-hanh-chinh', { replace: true });
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

  /** Iframe cao theo nội dung để trang preview cuộn như một tờ giấy. */
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const khiNap = () => {
      const doc = iframe.contentDocument;
      if (doc) iframe.style.height = `${doc.documentElement.scrollHeight}px`;
    };
    iframe.addEventListener('load', khiNap);
    return () => iframe.removeEventListener('load', khiNap);
  }, [html]);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.focus();
    iframeRef.current?.contentWindow?.print();
  };

  const handleExport = useCallback(
    async (format: PhieuHanhChinhExportFormat) => {
      if (!phieu) return;
      setDownloadOpen(false);
      setExporting(true);
      try {
        if (format === 'pdf') await exportPhieuHanhChinhPDF(phieu);
        else if (format === 'doc') await exportPhieuHanhChinhDOC(phieu);
        else await exportPhieuHanhChinhXLSX(phieu);
      } catch (e) {
        if (import.meta.env.DEV) console.error('Export error:', e);
        toast.error(t('common.exportError'));
      } finally {
        setExporting(false);
      }
    },
    [phieu, t]
  );

  if (isLoading || dangTaiPhamVi) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div
          className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
          aria-label={t('common.loading')}
        />
      </div>
    );
  }

  if (isError || !phieu || !duocXem) {
    const thongBao = isError
      ? ((error as Error)?.message ?? t('adminForm.print.loadError'))
      : !phieu
        ? t('adminForm.deepLink.notFound')
        : t('adminForm.deepLink.noPermission');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">{thongBao}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {isError && (
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
    <div className="fixed inset-0 z-[70] flex flex-col bg-muted/90" role="main" aria-label={t('adminForm.print.pageTitle')}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0">
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
              {t('adminForm.print.download')}
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
            {t('adminForm.print.print')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center items-start">
        <iframe
          ref={iframeRef}
          title={t('adminForm.print.pageTitle')}
          srcDoc={html}
          className="bg-white shadow-xl rounded-sm border-0 shrink-0"
          style={{ width: '210mm', minHeight: '297mm' }}
        />
      </div>
    </div>
  );
};

export default PhieuHanhChinhPreviewPage;
