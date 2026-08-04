/**
 * Trang preview hồ sơ tài sản (mở tab mới) – toolbar Đóng + Tải (PDF/Excel/Doc) + In.
 * Route: /ho-so-tai-san/:id
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, Printer, Download, ChevronDown, FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTaiSanList } from './hooks/use-danh-muc-tai-san';
import type { HoSoTaiSanExportFormat } from './utils/export-ho-so-tai-san';
import { exportHoSoTaiSanPDF, exportHoSoTaiSanExcel, exportHoSoTaiSanDoc } from './utils/export-ho-so-tai-san';
import HoSoTaiSanPreviewContent from './components/HoSoTaiSanPreviewContent';

const FORMATS: { format: HoSoTaiSanExportFormat; labelKey: string; icon: React.ReactNode }[] = [
  { format: 'doc', labelKey: 'danhSachTaiSan.export.doc', icon: <FileType size={16} /> },
  { format: 'excel', labelKey: 'danhSachTaiSan.export.excel', icon: <FileSpreadsheet size={16} /> },
  { format: 'pdf', labelKey: 'danhSachTaiSan.export.pdf', icon: <FileText size={16} /> },
];

const HoSoTaiSanPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: list = [], isLoading, isError, error, refetch } = useTaiSanList();
  const record = id ? list.find((a) => a.id === id) : undefined;
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!record) return;
    const prev = document.title;
    document.title = `${t('danhSachTaiSan.preview.title')} - ${record.ma_tai_san} · ${record.ten_tai_san}`;
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
        if (downloadOpen) setDownloadOpen(false);
        else handleClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [downloadOpen, handleClose]);

  useEffect(() => {
    if (!downloadOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDownloadOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [downloadOpen]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (format: HoSoTaiSanExportFormat) => {
    if (!record) return;
    setExporting(true);
    setDownloadOpen(false);
    try {
      if (format === 'pdf') await exportHoSoTaiSanPDF(record);
      else if (format === 'excel') await exportHoSoTaiSanExcel(record);
      else await exportHoSoTaiSanDoc(record);
    } catch (e) {
      if (import.meta.env.DEV) console.error('Export error:', e);
      toast.error(t('common.exportError'));
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
            ? (error?.message ?? t('danhSachTaiSan.preview.loadError'))
            : t('danhSachTaiSan.preview.notFound')}
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

  if (!record) return null;

  return (
    <>
      <div
        className="ho-so-tai-san-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
        role="main"
        aria-label={t('danhSachTaiSan.preview.title')}
      >
        <div className="ho-so-tai-san-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0">
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
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/50',
                  exporting && 'opacity-70 pointer-events-none'
                )}
              >
                <Download size={16} />
                {t('danhSachTaiSan.preview.download')}
                <ChevronDown size={14} className={cn('transition-transform', downloadOpen && 'rotate-180')} />
              </button>
              {downloadOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-card rounded-xl border border-border shadow-xl z-10">
                  {FORMATS.map((f) => (
                    <button
                      key={f.format}
                      type="button"
                      onClick={() => handleDownload(f.format)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
                    >
                      {f.icon}
                      {t(f.labelKey)}
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
              {t('danhSachTaiSan.preview.print')}
            </button>
          </div>
        </div>

        <div className="ho-so-tai-san-preview-body flex-1 overflow-auto p-4 md:p-6 flex justify-center">
          <div
            className="bg-white shadow-xl rounded-sm ho-so-tai-san-preview-content-wrapper"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            <HoSoTaiSanPreviewContent record={record} />
          </div>
        </div>
      </div>
    </>
  );
};

export default HoSoTaiSanPreviewPage;
