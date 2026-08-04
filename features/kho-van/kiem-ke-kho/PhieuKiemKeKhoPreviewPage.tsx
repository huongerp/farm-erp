/**
 * Trang preview phiếu kiểm kê kho (mở tab mới) – toolbar Đóng + Tải (PDF/DOC/XLSX) + In.
 * Route: /mua-hang/kiem-ke-kho/preview/:id
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Printer, Download, ChevronDown, FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { useDotKiemKeKhoById, useChiTietByDot } from './hooks/use-kiem-ke-kho';
import {
  exportPhieuKiemKeKhoToPDF,
  exportPhieuKiemKeKhoToDoc,
  exportPhieuKiemKeKhoToXLSX,
} from './utils/export-phieu-kiem-ke-kho';
import PhieuKiemKeKhoPreviewContent from './components/PhieuKiemKeKhoPreviewContent';

export type PhieuKiemKeKhoExportFormat = 'pdf' | 'doc' | 'xlsx';

const EXPORT_OPTIONS: { format: PhieuKiemKeKhoExportFormat; label: string; icon: React.ReactNode }[] = [
  { format: 'pdf', label: 'PDF', icon: <FileText size={16} /> },
  { format: 'doc', label: 'DOC', icon: <FileType size={16} /> },
  { format: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} /> },
];

const PhieuKiemKeKhoPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: dot, isLoading, isError, error, refetch } = useDotKiemKeKhoById(id ?? null);
  const { data: chiTiet = [], isLoading: chiTietLoading } = useChiTietByDot(id ?? null);
  const [exporting, setExporting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dot) return;
    const prev = document.title;
    document.title = `${t('kiemKeKho.preview.title')} - ${dot.ma_dot} · ${dot.ten_dot}`;
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
    // Inject @page override: lề 0 để content tự chứa margin qua padding
    // (L:20mm R:15mm T:15mm B:15mm được đặt trong PhieuKiemKeKhoPreviewContent)
    const styleEl = document.createElement('style');
    styleEl.id = 'kkk-print-page-override';
    // T:15mm R:15mm B:15mm L:20mm — khớp pt-[15mm]/pr-[15mm]/pb-[15mm]/pl-[20mm] trong preview content
    // print:p-0 trên content div sẽ loại padding ra, @page margin kiểm soát lề từng trang
    styleEl.innerHTML = '@page { margin: 15mm 15mm 15mm 20mm !important; size: A4 portrait; }';
    document.head.appendChild(styleEl);

    const cleanup = () => {
      document.getElementById('kkk-print-page-override')?.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    window.print();
  };

  const handleExport = useCallback(async (format: PhieuKiemKeKhoExportFormat) => {
    if (!dot) return;
    setDownloadOpen(false);
    setExporting(true);
    try {
      if (format === 'pdf') await exportPhieuKiemKeKhoToPDF(dot, chiTiet);
      else if (format === 'doc') await exportPhieuKiemKeKhoToDoc(dot, chiTiet);
      else if (format === 'xlsx') await exportPhieuKiemKeKhoToXLSX(dot, chiTiet);
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
            ? (error?.message ?? t('kiemKeKho.preview.loadError'))
            : t('kiemKeKho.preview.notFound')}
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

  if (!dot) return null;

  return (
    <>
      <div
        className="phieu-kiem-ke-kho-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
        role="main"
        aria-label={t('kiemKeKho.preview.title')}
      >
        <div className="phieu-kiem-ke-kho-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0 print:hidden">
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
                disabled={exporting || chiTietLoading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/50 disabled:opacity-70 disabled:pointer-events-none"
              >
                <Download size={16} />
                {t('kiemKeKho.preview.download')}
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
              {t('kiemKeKho.preview.print')}
            </button>
          </div>
        </div>

        <div className="phieu-kiem-ke-kho-preview-body flex-1 overflow-auto p-4 md:p-6 flex justify-center items-start print:p-0 print:overflow-visible">
          <div className="bg-white shadow-xl rounded-sm phieu-kiem-ke-kho-preview-content-wrapper print:shadow-none" style={{ width: '210mm', minHeight: '297mm' }}>
            {chiTietLoading && !chiTiet.length ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                {t('kiemKeKho.loading')}
              </div>
            ) : (
              <PhieuKiemKeKhoPreviewContent dot={dot} chiTiet={chiTiet} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PhieuKiemKeKhoPreviewPage;
