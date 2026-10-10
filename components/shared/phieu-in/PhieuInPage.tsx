/**
 * Khung trang xem trước phiếu in dùng chung cho MỌI phiếu: toolbar (Đóng / Cài đặt / Tải
 * xuống PDF·DOC… / In), tờ giấy căn giữa, bảng cài đặt in (khổ, hướng, lề, phông, cỡ chữ,
 * độ rộng cột — nhớ riêng theo `mauKey`), trạng thái đang tải / lỗi.
 *
 * - Lề: padding của tờ giấy trên màn hình; khi in do `@page { margin }` lo (chèn lúc bấm In).
 * - Cỡ chữ: lớp `.phieu-in-zoom` đặt `zoom: k` + `width: 100/k %` → chữ to/nhỏ mà bố cục vẫn
 *   vừa khổ, áp được cho cả mẫu cũ đang cố định pt.
 * - Cột: `useKeoCotBangIn` soi mọi bảng trong phiếu, tay kéo vẽ ở lớp phủ không in.
 * Mẫu phiếu đọc khổ đang chọn qua `usePhieuIn()`; CSS in: khối `.phieu-in-*` trong index.css.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronDown, Download, FileText, FileType, Printer, Settings2, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { taiDocTuNode, taiPdfTuNode } from '../../../lib/phieu-in/xuat-phieu';
import {
  FONT_IN_CSS,
  chuanHoaCaiDatIn,
  cssPageSize,
  kichThuocGiayIn,
  type CaiDatIn,
} from '../../../lib/phieu-in/cai-dat-in';
import { useCaiDatInStore } from '../../../lib/phieu-in/use-cai-dat-in-store';
import type { KhoGiayIn } from '../../../lib/phieu-in/xuat-phieu';
import { PhieuInContext, type PhieuInCtx } from './phieu-in-context';
import { useKeoCotBangIn } from './use-keo-cot-bang-in';
import BangCaiDatIn from './BangCaiDatIn';

export { kichThuocGiayIn } from '../../../lib/phieu-in/cai-dat-in';
export { usePhieuIn } from './phieu-in-context';

const PRINT_STYLE_ID = 'phieu-in-page-override';

export interface MucTaiThem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void | Promise<void>;
}

interface Props {
  /** Tiêu đề trên toolbar + tiêu đề tab trình duyệt. */
  title: string;
  /** Khoá nhớ cài đặt in của mẫu này (vd `phieu-kho`). */
  mauKey: string;
  /** Mặc định của mẫu: khổ, hướng, lề… (người dùng đổi thì lưu đè). */
  macDinh?: Partial<CaiDatIn>;
  /** Cỡ chữ gốc (pt) của mẫu theo khổ — chỉ để hiển thị "10.5 pt" trên bảng cài đặt. */
  coChuGocPt?: number | ((kho: KhoGiayIn) => number);
  /** Tên file tải về (không đuôi). */
  tenFile: string;
  /** Không có lịch sử trình duyệt (mở tab mới) thì Đóng về đường dẫn này. */
  duongDanVe: string;
  isLoading?: boolean;
  /** Có lỗi / không tìm thấy: thông báo thay cho phiếu. */
  loi?: string | null;
  onRetry?: () => void;
  /** Định dạng tải thêm (vd XLSX) ngoài PDF / DOC. */
  taiThem?: MucTaiThem[];
  /** Ẩn PDF / DOC (mẫu chỉ có định dạng riêng). */
  anPdfDoc?: boolean;
  /** Nút phụ trên toolbar, đặt trước Cài đặt (vd chọn loại phiếu). */
  toolbarExtra?: React.ReactNode;
  children: React.ReactNode;
}

const PhieuInPage: React.FC<Props> = ({
  title,
  mauKey,
  macDinh,
  coChuGocPt = 10,
  tenFile,
  duongDanVe,
  isLoading,
  loi,
  onRetry,
  taiThem,
  anPdfDoc,
  toolbarExtra,
  children,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [moCaiDat, setMoCaiDat] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);

  const daLuu = useCaiDatInStore((s) => s.theoMau[mauKey]);
  const datCaiDat = useCaiDatInStore((s) => s.datCaiDat);
  const datCot = useCaiDatInStore((s) => s.datCot);
  const datLaiCot = useCaiDatInStore((s) => s.datLaiCot);
  const khoiPhucMacDinh = useCaiDatInStore((s) => s.khoiPhucMacDinh);
  const caiDat = useMemo(() => chuanHoaCaiDatIn(daLuu, macDinh), [daLuu, macDinh]);

  const { kho, huong, leMm, tiLeChu: k, font } = caiDat;
  const { wMm, hMm } = kichThuocGiayIn(kho, huong);
  const pageSize = cssPageSize(kho, huong);
  const coChuGoc = typeof coChuGocPt === 'function' ? coChuGocPt(kho) : coChuGocPt;
  const ctx = useMemo<PhieuInCtx>(() => ({ kho, huong, wMm, hMm, leMm, compact: kho === 'a5' }), [kho, huong, wMm, hMm, leMm]);

  const onDoiCot = useCallback((bang: string, rong: number[]) => datCot(mauKey, bang, rong), [datCot, mauKey]);
  const onDatLaiBang = useCallback((bang: string) => datLaiCot(mauKey, bang), [datLaiCot, mauKey]);
  const { tayKeo, batDauKeo, keoBangPhim } = useKeoCotBangIn({
    rootRef: zoomRef,
    khungRef: paperRef,
    cot: caiDat.cot,
    onDoi: onDoiCot,
    onDatLai: onDatLaiBang,
    phuThuoc: `${kho}-${huong}-${leMm}-${k}-${font}-${moCaiDat}-${isLoading ? 1 : 0}-${loi ?? ''}`,
  });

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
      else if (moCaiDat && window.innerWidth < 768) setMoCaiDat(false);
      else handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose, downloadOpen, moCaiDat]);

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

  const chay = async (viec: () => void | Promise<void>) => {
    setDownloadOpen(false);
    setExporting(true);
    try {
      await viec();
    } catch (e) {
      if (import.meta.env.DEV) console.error('Export error:', e);
      toast.error(t('common.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleExport = (format: 'pdf' | 'doc') => {
    const node = zoomRef.current;
    if (!node) return;
    void chay(async () => {
      if (format === 'pdf') await taiPdfTuNode(node, { kho, huong, wMm, hMm, leMm, tiLe: k, tenFile });
      else taiDocTuNode(node, { pageSize, wMm, leMm, tiLe: k, tenFile });
    });
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

  const dinhDang: MucTaiThem[] = [
    ...(anPdfDoc
      ? []
      : [
          { key: 'pdf', label: 'PDF', icon: <FileText size={16} />, onClick: () => handleExport('pdf') },
          { key: 'doc', label: 'DOC', icon: <FileType size={16} />, onClick: () => handleExport('doc') },
        ]),
    ...(taiThem ?? []).map((m) => ({ ...m, onClick: () => chay(m.onClick) })),
  ];

  const fontCss = font === 'mac-dinh' ? undefined : FONT_IN_CSS[font];

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
          {toolbarExtra}
          <button
            type="button"
            onClick={() => setMoCaiDat((o) => !o)}
            aria-pressed={moCaiDat}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted/50',
              moCaiDat ? 'bg-muted' : 'bg-card'
            )}
          >
            <Settings2 size={16} />
            <span className="hidden sm:inline">{t('common.phieuIn.caiDat')}</span>
          </button>
          {dinhDang.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDownloadOpen((o) => !o)}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/50 disabled:opacity-70 disabled:pointer-events-none"
              >
                <Download size={16} />
                <span className="hidden sm:inline">{t('common.phieuIn.taiXuong')}</span>
                <ChevronDown size={14} className={cn('transition-transform', downloadOpen && 'rotate-180')} />
              </button>
              {downloadOpen && (
                <div className="absolute right-0 top-full mt-1 min-w-[120px] py-1 bg-card rounded-xl border border-border shadow-xl z-[100]">
                  {dinhDang.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => void opt.onClick()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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

      <div className="phieu-in-main flex-1 min-h-0 flex">
        {/* Căn giữa bằng mx-auto (không dùng justify-center): tờ A4 ngang rộng hơn màn hình
            vẫn cuộn ngang tới được mép trái. */}
        <div className="phieu-in-body flex-1 min-w-0 overflow-auto p-4 md:p-6 flex items-start print:p-0 print:overflow-visible">
          <div
            ref={paperRef}
            className="phieu-in-content-wrapper relative bg-white text-gray-900 shadow-xl rounded-sm shrink-0 mx-auto box-border print:p-0"
            style={{ width: `${wMm}mm`, minHeight: `${hMm}mm`, padding: `${leMm}mm` }}
          >
            <div
              ref={zoomRef}
              className="phieu-in-zoom"
              data-font={fontCss ? font : undefined}
              style={
                {
                  zoom: k,
                  width: `${100 / k}%`,
                  '--in-font': fontCss,
                  '--in-trang-h': `${(hMm - 2 * leMm) / k}mm`,
                } as React.CSSProperties
              }
            >
              <PhieuInContext.Provider value={ctx}>{children}</PhieuInContext.Provider>
            </div>
            <div className="phieu-in-lop-keo absolute inset-0 pointer-events-none print:hidden" data-phieu-in-bo-khi-xuat>
              {tayKeo.map((tk) => (
                <div
                  key={tk.key}
                  role="slider"
                  aria-orientation="horizontal"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={tk.rongPct}
                  aria-label={t('common.phieuIn.keoCot')}
                  tabIndex={0}
                  title={t('common.phieuIn.keoCot')}
                  onPointerDown={(e) => batDauKeo(e, tk)}
                  onKeyDown={(e) => keoBangPhim(e, tk)}
                  onDoubleClick={() => onDatLaiBang(tk.bang)}
                  className="group absolute pointer-events-auto cursor-col-resize touch-none flex justify-center outline-none"
                  style={{ left: tk.left - 4, top: tk.top, height: tk.height, width: 9 }}
                >
                  <span className="w-0.5 h-full rounded-full bg-primary/0 group-hover:bg-primary/70 group-focus-visible:bg-primary transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {moCaiDat && (
          <BangCaiDatIn
            caiDat={caiDat}
            coChuGocPt={coChuGoc}
            coCotDaChinh={Object.keys(daLuu?.cot ?? {}).length > 0}
            onDoi={(patch) => datCaiDat(mauKey, patch)}
            onDatLaiCot={() => datLaiCot(mauKey)}
            onKhoiPhuc={() => khoiPhucMacDinh(mauKey)}
            onDong={() => setMoCaiDat(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PhieuInPage;
