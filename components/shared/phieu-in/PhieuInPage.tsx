/**
 * Khung trang xem trước phiếu in dùng chung: toolbar (Đóng / Tải xuống PDF·DOC / In),
 * tờ giấy căn giữa, trạng thái đang tải / lỗi. Nội dung phiếu truyền qua `children`
 * (thường bọc trong `KhungPhieu` của PhieuInParts, class gốc `phieu-in-content`).
 * CSS in: khối `.phieu-in-*` trong index.css. @page chèn lúc bấm In, gỡ sau `afterprint`.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronDown, Download, FileText, FileType, Printer, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { taiDocTuNode, taiPdfTuNode, type HuongGiayIn, type KhoGiayIn } from '../../../lib/phieu-in/xuat-phieu';

const PRINT_STYLE_ID = 'phieu-in-page-override';

/** Kích thước giấy (mm) theo khổ + hướng. */
export function kichThuocGiayIn(kho: KhoGiayIn, huong: HuongGiayIn): { wMm: number; hMm: number } {
  const [ngan, dai] = kho === 'a5' ? [148, 210] : [210, 297];
  return huong === 'ngang' ? { wMm: dai, hMm: ngan } : { wMm: ngan, hMm: dai };
}

interface Props {
  /** Tiêu đề trên toolbar + tiêu đề tab trình duyệt. */
  title: string;
  kho?: KhoGiayIn;
  huong?: HuongGiayIn;
  /** Lề trang (mm) khi in / xuất DOC. */
  leMm?: number;
  /** Tên file tải về (không đuôi). */
  tenFile: string;
  /** Không có lịch sử trình duyệt (mở tab mới) thì Đóng về đường dẫn này. */
  duongDanVe: string;
  isLoading?: boolean;
  /** Có lỗi / không tìm thấy: thông báo thay cho phiếu. */
  loi?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

const PhieuInPage: React.FC<Props> = ({
  title,
  kho = 'a4',
  huong = 'doc',
  leMm = 12,
  tenFile,
  duongDanVe,
  isLoading,
  loi,
  onRetry,
  children,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const { wMm, hMm } = kichThuocGiayIn(kho, huong);
  const pageSize = `${kho.toUpperCase()} ${huong === 'ngang' ? 'landscape' : 'portrait'}`;

  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => {
      document.title = prev;
    };
  }, [title]);

  const handleClose = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    // Mở bằng window.open(..., 'noopener') → không window.close() được; về trang module.
    else navigate(duongDanVe, { replace: true });
  }, [navigate, duongDanVe]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (downloadOpen) setDownloadOpen(false);
      else handleClose();
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
    document.getElementById(PRINT_STYLE_ID)?.remove();
    const styleEl = document.createElement('style');
    styleEl.id = PRINT_STYLE_ID;
    styleEl.textContent = `@page { size: ${pageSize}; margin: ${leMm}mm !important; }`;
    document.head.appendChild(styleEl);
    const cleanup = () => {
      document.getElementById(PRINT_STYLE_ID)?.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const handleExport = async (format: 'pdf' | 'doc') => {
    const node = paperRef.current?.querySelector<HTMLElement>('.phieu-in-content');
    if (!node) return;
    setDownloadOpen(false);
    setExporting(true);
    try {
      if (format === 'pdf') await taiPdfTuNode(node, { kho, huong, wMm, hMm, tenFile });
      else taiDocTuNode(node, { pageSize, leMm, tenFile });
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
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-label={t('common.loading')} />
      </div>
    );
  }

  if (loi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">{loi}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
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
    <div className="phieu-in-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90" role="main" aria-label={title}>
      <div className="phieu-in-toolbar flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-card border-b border-border shadow-sm shrink-0 print:hidden">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
          <span className="hidden sm:inline text-sm font-semibold truncate">{title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDownloadOpen((o) => !o)}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/50 disabled:opacity-70 disabled:pointer-events-none"
            >
              <Download size={16} />
              {t('common.phieuIn.taiXuong')}
              <ChevronDown size={14} className={cn('transition-transform', downloadOpen && 'rotate-180')} />
            </button>
            {downloadOpen && (
              <div className="absolute right-0 top-full mt-1 min-w-[120px] py-1 bg-card rounded-xl border border-border shadow-xl z-[100]">
                {(
                  [
                    { format: 'pdf', label: 'PDF', icon: <FileText size={16} /> },
                    { format: 'doc', label: 'DOC', icon: <FileType size={16} /> },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.format}
                    type="button"
                    onClick={() => void handleExport(opt.format)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
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
            {t('common.phieuIn.in')}
          </button>
        </div>
      </div>

      {/* Căn giữa bằng mx-auto (không dùng justify-center): tờ A4 ngang rộng hơn màn hình
          vẫn cuộn ngang tới được mép trái. */}
      <div className="phieu-in-body flex-1 overflow-auto p-4 md:p-6 flex items-start print:p-0 print:overflow-visible">
        <div
          ref={paperRef}
          className="phieu-in-content-wrapper bg-white shadow-xl rounded-sm shrink-0 mx-auto"
          style={{ width: `${wMm}mm`, minHeight: `${hMm}mm` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default PhieuInPage;
