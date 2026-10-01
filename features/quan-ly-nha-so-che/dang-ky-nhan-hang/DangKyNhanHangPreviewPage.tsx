/**
 * Trang preview in phiếu đăng ký nhận hàng — toolbar Đóng + (khổ / hướng) + Tải xuống + In.
 * Route: /quan-ly-nha-so-che/dang-ky-nhan-hang/preview/:id?loai=dang-ky|kiem-hang|tong-hop&kho=a4|a5&huong=doc|ngang
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronDown, Download, FileSpreadsheet, FileText, FileType, Printer, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useDangKyNhanHangById, useDangKyNhanHangChiTiet } from './hooks/use-dang-ky-nhan-hang';
import { gopTheoHangHoa } from './core/gop-hang-hoa';
import {
  HUONG_GIAY,
  KHO_GIAY,
  cssPageSize,
  docThamSoIn,
  kichThuocGiay,
  leTrang,
  type HuongGiay,
  type KhoGiay,
} from './core/mau-in';
import { taiDoc, taiPdf, taiXlsx, type DinhDangTai } from './utils/export-phieu-in';
import { PhieuDangKyPreview, PhieuKiemHangPreview, PhieuTongHopPreview } from './components/preview/MauPhieu';

const DINH_DANG: { format: DinhDangTai; label: string; icon: React.ReactNode }[] = [
  { format: 'pdf', label: 'PDF', icon: <FileText size={16} /> },
  { format: 'doc', label: 'DOC', icon: <FileType size={16} /> },
  { format: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} /> },
];

const PRINT_STYLE_ID = 'dknh-print-page-override';

function NutGatNho<T extends string>({
  options,
  value,
  onChange,
  labelOf,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelOf: (v: T) => string;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={cn(
            'px-2.5 py-1 text-xs font-medium rounded-md transition',
            value === o ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {labelOf(o)}
        </button>
      ))}
    </div>
  );
}

const DangKyNhanHangPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const ts = useMemo(() => docThamSoIn(searchParams), [searchParams]);
  const { data, isLoading, isError, error, refetch } = useDangKyNhanHangById(id);
  const { data: chiTiet = [], isLoading: ctLoading } = useDangKyNhanHangChiTiet(id);
  const nhom = useMemo(() => gopTheoHangHoa(chiTiet), [chiTiet]);
  const [exporting, setExporting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const { wMm, hMm } = kichThuocGiay(ts.kho, ts.huong);

  useEffect(() => {
    if (!data) return;
    const prev = document.title;
    document.title = `${t(`dangKyNhanHang.preview.title.${ts.loai}`)} - ${data.so_xe || data.so_cont || data.id}`;
    return () => {
      document.title = prev;
    };
  }, [data, t, ts.loai]);

  const handleClose = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    // Mở bằng window.open(..., 'noopener') → không window.close() được; về danh sách module.
    else navigate('/quan-ly-nha-so-che/dang-ky-nhan-hang', { replace: true });
  }, [navigate]);

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

  const doiThamSo = (patch: { kho?: KhoGiay; huong?: HuongGiay }) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (patch.kho) next.set('kho', patch.kho);
        if (patch.huong) next.set('huong', patch.huong);
        return next;
      },
      { replace: true }
    );

  /** Chèn @page đúng khổ / hướng đang xem; dọn sau khi in. */
  const handlePrint = () => {
    document.getElementById(PRINT_STYLE_ID)?.remove();
    const styleEl = document.createElement('style');
    styleEl.id = PRINT_STYLE_ID;
    styleEl.innerHTML = `@page { size: ${cssPageSize(ts.kho, ts.huong)}; margin: ${leTrang(ts.kho)}mm !important; }`;
    document.head.appendChild(styleEl);
    const cleanup = () => {
      document.getElementById(PRINT_STYLE_ID)?.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const handleExport = async (format: DinhDangTai) => {
    const node = paperRef.current?.querySelector<HTMLElement>('.dknh-preview-content');
    if (!data || !node) return;
    setDownloadOpen(false);
    setExporting(true);
    try {
      if (format === 'pdf') await taiPdf(node, data, ts);
      else if (format === 'doc') taiDoc(node, data, ts);
      else await taiXlsx(data, nhom, ts, t);
    } catch (e) {
      if (import.meta.env.DEV) console.error('Export error:', e);
      toast.error(t('common.exportError'));
    } finally {
      setExporting(false);
    }
  };

  if (isLoading || ctLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-label={t('common.loading')} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">
          {isError ? (error?.message ?? t('dangKyNhanHang.preview.loadError')) : t('dangKyNhanHang.preview.notFound')}
        </p>
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

  const Mau = ts.loai === 'kiem-hang' ? PhieuKiemHangPreview : ts.loai === 'tong-hop' ? PhieuTongHopPreview : PhieuDangKyPreview;

  return (
    <div
      className="dknh-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
      role="main"
      aria-label={t(`dangKyNhanHang.preview.title.${ts.loai}`)}
    >
      <div className="dknh-preview-toolbar flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-card border-b border-border shadow-sm shrink-0 print:hidden">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
          <span className="hidden sm:inline text-sm font-semibold truncate">{t(`dangKyNhanHang.preview.title.${ts.loai}`)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ts.loai === 'dang-ky' && (
            <>
              <NutGatNho options={KHO_GIAY} value={ts.kho} onChange={(kho) => doiThamSo({ kho })} labelOf={(v) => v.toUpperCase()} />
              <NutGatNho
                options={HUONG_GIAY}
                value={ts.huong}
                onChange={(huong) => doiThamSo({ huong })}
                labelOf={(v) => t(`dangKyNhanHang.preview.huong_${v}`)}
              />
            </>
          )}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDownloadOpen((o) => !o)}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/50 disabled:opacity-70 disabled:pointer-events-none"
            >
              <Download size={16} />
              {t('dangKyNhanHang.preview.taiXuong')}
              <ChevronDown size={14} className={cn('transition-transform', downloadOpen && 'rotate-180')} />
            </button>
            {downloadOpen && (
              <div className="absolute right-0 top-full mt-1 min-w-[120px] py-1 bg-card rounded-xl border border-border shadow-xl z-[100]">
                {DINH_DANG.map((opt) => (
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
            {t('dangKyNhanHang.preview.in')}
          </button>
        </div>
      </div>

      {/* Căn giữa bằng mx-auto (không dùng justify-center): tờ A4 ngang rộng hơn màn hình
          vẫn cuộn ngang tới được mép trái. */}
      <div className="dknh-preview-body flex-1 overflow-auto p-4 md:p-6 flex items-start print:p-0 print:overflow-visible">
        <div
          ref={paperRef}
          className="dknh-preview-content-wrapper bg-white shadow-xl rounded-sm shrink-0 mx-auto"
          style={{ width: `${wMm}mm`, minHeight: `${hMm}mm` }}
        >
          <Mau phieu={data} nhom={nhom} kho={ts.kho} huong={ts.huong} />
        </div>
      </div>
    </div>
  );
};

export default DangKyNhanHangPreviewPage;
