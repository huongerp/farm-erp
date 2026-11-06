/**
 * KHUNG IN DÙNG CHUNG cho MỌI trang xem trước / in phiếu.
 *
 * Trang chỉ đưa: `mauKey` (khoá lưu cài đặt), `macDinh` (khổ/hướng/lề của mẫu), nội dung MỘT
 * liên (`children`), và tuỳ chọn `dauChim` (theo trạng thái), `duongDanGoc` (QR), `nhanLien`.
 * Khung lo: chia trang thật (paged.js, `XemTruocChiaTrang`), cài đặt in lưu trên máy theo mẫu
 * (`useCaiDatIn`), kéo / ẩn cột, zoom, điều hướng trang, in theo khoảng trang, đầu/chân trang
 * (margin box `@page`), dấu chìm, nhiều liên, QR, PDF (chụp từng trang) / DOC, in trình duyệt.
 *
 * Nội dung phiếu: không đặt width/padding/`@page` cứng theo khổ; logo gắn `data-in-logo`, khối ký
 * `data-in-chu-ky`; bảng không cho kéo/ẩn cột thì `data-in-co-dinh`. paged.js nhận HTML chuỗi —
 * event handler trong nội dung bị mất, nút bấm đặt ở `toolbarExtra`.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { FileText, FileType, X } from 'lucide-react';
import { formatDateTime } from '../../../lib/utils';
import { useAuthStore } from '../../../store/useStore';
import { cssPageSize, kichThuocGiayIn, type MacDinhMau } from '../../../lib/phieu-in/cai-dat-in';
import { dongChanTrai } from '../../../lib/phieu-in/css-trang';
import { docKhoangTrang } from '../../../lib/phieu-in/khoang-trang';
import { useLogoCongTyIn } from '../../../lib/phieu-in/logo-in';
import { useCaiDatIn } from '../../../lib/phieu-in/use-cai-dat-in-store';
import type { KhoGiayIn } from '../../../lib/phieu-in/cai-dat-in';
import type { ThongTinBang } from '../../../lib/phieu-in/luoi-bang';
import { LienContext, PhieuInContext, type PhieuInCtx } from './phieu-in-context';
import { useKeoCotBangIn } from './use-keo-cot-bang-in';
import { XemTruocChiaTrang, type KetQuaChiaTrang } from './XemTruocChiaTrang';
import { ThanhCongCuIn, type MucTaiThem } from './ThanhCongCuIn';
import BangCaiDatIn from './BangCaiDatIn';

export { kichThuocGiayIn } from '../../../lib/phieu-in/cai-dat-in';
export { usePhieuIn, useLienIn, DongLien } from './phieu-in-context';
export type { MucTaiThem } from './ThanhCongCuIn';

const PX_MOI_MM = 96 / 25.4;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2.5;
const PRINT_STYLE_ID = 'phieu-in-page-size';

interface Props {
  /** Tiêu đề trên toolbar + tiêu đề tab trình duyệt. */
  title: string;
  /** Khoá nhớ cài đặt in của mẫu này (vd `phieu-kho`). */
  mauKey: string;
  /** Mặc định của mẫu: khổ, hướng, lề (`leMm` đều hoặc `le` từng cạnh)… người dùng đổi thì lưu đè. */
  macDinh?: MacDinhMau;
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
  /** Chữ chìm in chéo mọi trang («BẢN NHÁP», «ĐÃ HUỶ»…) — trang tự quyết theo trạng thái; null = bản chính thức. */
  dauChim?: string | null;
  /** Đường dẫn (pathname + query) mở bản gốc — có thì cho bật QR xác thực ở góc trang 1. */
  duongDanGoc?: string | null;
  /** Nhãn từng liên khi in nhiều liên (mặc định «Lưu», «Giao người nhận», «Kế toán»). */
  nhanLien?: string[];
  /** Định dạng tải thêm (vd XLSX) ngoài PDF / DOC. */
  taiThem?: MucTaiThem[];
  /** Ẩn PDF / DOC (mẫu chỉ có định dạng riêng). */
  anPdfDoc?: boolean;
  /** Nút phụ trên toolbar (vd chọn loại phiếu) — không in. */
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
  dauChim,
  duongDanGoc,
  nhanLien,
  taiThem,
  anPdfDoc,
  toolbarExtra,
  children,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const nguoiIn = useAuthStore((s) => s.user?.full_name ?? null);
  const { caiDat, doi, khoiPhuc, coThayDoi } = useCaiDatIn(mauKey, macDinh);
  const { logo, xong: logoXong } = useLogoCongTyIn();
  const cuonRef = useRef<HTMLDivElement>(null);
  const dichRef = useRef<HTMLDivElement>(null);
  const nguonRef = useRef<HTMLDivElement>(null);
  const [moCaiDat, setMoCaiDat] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [zoom, setZoom] = useState(1);
  const [vuaKhung, setVuaKhung] = useState(true);
  const [kq, setKq] = useState<KetQuaChiaTrang>({ soTrang: 0, bang: [] });
  const [phienDan, setPhienDan] = useState(0);
  const [trangHienTai, setTrangHienTai] = useState(1);
  const [khoangTrang, setKhoangTrang] = useState('');
  const [dangTaiXuong, setDangTaiXuong] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [gioIn] = useState(() => formatDateTime(new Date()));

  const { kho, huong } = caiDat;
  const { wMm, hMm } = kichThuocGiayIn(kho, huong);
  const coChuGoc = typeof coChuGocPt === 'function' ? coChuGocPt(kho) : coChuGocPt;
  const ctx = useMemo<PhieuInCtx>(
    () => ({ kho, huong, wMm, hMm, le: caiDat.le, compact: kho === 'a5', logo }),
    [kho, huong, wMm, hMm, caiDat.le, logo]
  );
  const chanTrai = dongChanTrai(caiDat, gioIn, nguoiIn, { inLuc: t('common.phieuIn.inLuc'), nguoiIn: t('common.phieuIn.nguoiIn') });
  const sanSang = kq.soTrang > 0 && !isLoading && !loi;
  const nhanLienDung = useMemo(
    () => nhanLien ?? [t('common.phieuIn.lien_luu'), t('common.phieuIn.lien_giao'), t('common.phieuIn.lien_keToan')],
    [nhanLien, t]
  );

  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => {
      document.title = prev;
    };
  }, [title]);

  // Khổ giấy khi in trình duyệt: mỗi `.pagedjs_page` đã đúng khổ + lề → @page lề 0. Gắn sau CSS
  // của app (index.css có @page A4 12mm) nên thắng.
  useEffect(() => {
    document.getElementById(PRINT_STYLE_ID)?.remove();
    const el = document.createElement('style');
    el.id = PRINT_STYLE_ID;
    el.textContent = `@page { size: ${wMm}mm ${hMm}mm; margin: 0 !important; }`;
    document.head.appendChild(el);
    return () => el.remove();
  }, [wMm, hMm]);

  useEffect(() => {
    if (!caiDat.qr || !duongDanGoc) {
      setQr(null);
      return;
    }
    let huy = false;
    void QRCode.toDataURL(`${window.location.origin}${duongDanGoc}`, { margin: 0, width: 240 }).then((u) => !huy && setQr(u));
    return () => {
      huy = true;
    };
  }, [caiDat.qr, duongDanGoc]);

  const onXong = useCallback((r: KetQuaChiaTrang) => {
    setKq(r);
    setPhienDan((n) => n + 1);
  }, []);

  // Zoom «vừa khung»: tính lại khi đổi khổ / mở đóng cài đặt / đổi cỡ cửa sổ.
  useEffect(() => {
    if (!vuaKhung) return;
    const cuon = cuonRef.current;
    if (!cuon) return;
    const tinh = () => {
      const w = cuon.clientWidth;
      if (w > 0) setZoom(Math.max(ZOOM_MIN, Math.min(1.25, Math.floor(((w - 32) / (wMm * PX_MOI_MM)) * 100) / 100)));
    };
    tinh();
    const ro = new ResizeObserver(tinh);
    ro.observe(cuon);
    return () => ro.disconnect();
  }, [vuaKhung, wMm, moCaiDat, isLoading, loi]);

  const onZoom = useCallback((z: number | 'vua') => {
    if (z === 'vua') {
      setVuaKhung(true);
      return;
    }
    setVuaKhung(false);
    setZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(z * 100) / 100)));
  }, []);

  // Trang đang xem = trang có đỉnh gần mép trên vùng cuộn nhất.
  useEffect(() => {
    const cuon = cuonRef.current;
    if (!cuon) return;
    const onScroll = () => {
      const top = cuon.getBoundingClientRect().top + 40;
      let hienTai = 1;
      cuon.querySelectorAll<HTMLElement>('.pagedjs_page').forEach((p, i) => {
        if (p.getBoundingClientRect().top <= top) hienTai = i + 1;
      });
      setTrangHienTai(hienTai);
    };
    cuon.addEventListener('scroll', onScroll, { passive: true });
    return () => cuon.removeEventListener('scroll', onScroll);
  }, [isLoading, loi]);

  const nhayTrang = useCallback((n: number) => {
    dichRef.current?.querySelector(`.pagedjs_page[data-trang="${n}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useKeoCotBangIn({
    dichRef,
    phienDan,
    bang: kq.bang as ThongTinBang[],
    caiDat,
    zoom,
    batTat: sanSang,
    nhan: t('common.phieuIn.keoCot'),
    doi,
  });

  const khoang = useMemo(() => docKhoangTrang(khoangTrang, Math.max(1, kq.soTrang)), [khoangTrang, kq.soTrang]);
  const loiKhoang =
    khoang.loi === 'cu-phap'
      ? t('common.phieuIn.khoangLoi_cuPhap', { phan: khoang.phan })
      : khoang.loi === 'ngoai-pham-vi'
        ? t('common.phieuIn.khoangLoi_ngoaiPhamVi', { tong: khoang.tong })
        : null;

  const tatCaTrang = () => Array.from(dichRef.current?.querySelectorAll<HTMLElement>('.pagedjs_page') ?? []);
  const trangTrongKhoang = (): HTMLElement[] => {
    const ds = tatCaTrang();
    const chon = khoang.trang;
    return chon ? ds.filter((_, i) => chon.includes(i + 1)) : ds;
  };

  const handleClose = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    // Mở bằng window.open(..., 'noopener') → không window.close() được; về trang module.
    else navigate(duongDanVe, { replace: true });
  }, [navigate, duongDanVe]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if ((e.target as HTMLElement | null)?.closest?.('input, select, textarea')) return;
      if (moCaiDat && window.innerWidth < 768) setMoCaiDat(false);
      else handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose, moCaiDat]);

  const handlePrint = () => {
    if (loiKhoang) {
      toast.error(loiKhoang);
      return;
    }
    const tat = tatCaTrang();
    const giu = new Set(trangTrongKhoang());
    tat.forEach((p) => !giu.has(p) && p.setAttribute('data-ngoai-khoang', ''));
    const xong = () => {
      tat.forEach((p) => p.removeAttribute('data-ngoai-khoang'));
      window.removeEventListener('afterprint', xong);
    };
    window.addEventListener('afterprint', xong);
    window.print();
  };

  const chay = async (viec: () => void | Promise<void>) => {
    setDangTaiXuong(true);
    try {
      await viec();
    } catch (e) {
      if (import.meta.env.DEV) console.error('Export error:', e);
      toast.error(t('common.exportError'));
    } finally {
      setDangTaiXuong(false);
    }
  };

  const handlePdf = () => {
    if (loiKhoang) {
      toast.error(loiKhoang);
      return;
    }
    void chay(async () => {
      const dich = dichRef.current;
      const zoomCu = dich?.style.zoom ?? '';
      // html2canvas đo theo bố cục thật — bỏ zoom hiển thị trong lúc chụp.
      if (dich) dich.style.zoom = '1';
      try {
        const { taiPdfTuTrang } = await import('../../../lib/phieu-in/xuat-phieu');
        await taiPdfTuTrang(trangTrongKhoang(), { kho, huong, tenFile });
      } finally {
        if (dich) dich.style.zoom = zoomCu;
      }
    });
  };

  const handleDoc = () => {
    void chay(async () => {
      const lien = nguonRef.current?.querySelector<HTMLElement>('.phieu-in-lien');
      if (!lien) throw new Error('no content');
      const { taiDocTuNode } = await import('../../../lib/phieu-in/xuat-phieu');
      taiDocTuNode(lien, { pageSize: cssPageSize(kho, huong), le: caiDat.le, tiLe: caiDat.tiLeChu, tenFile });
    });
  };

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
          { key: 'pdf', label: 'PDF', icon: <FileText size={16} />, onClick: handlePdf },
          { key: 'doc', label: 'DOC', icon: <FileType size={16} />, onClick: handleDoc },
        ]),
    ...(taiThem ?? []).map((m) => ({ ...m, onClick: () => chay(m.onClick) })),
  ];

  const lien = Array.from({ length: caiDat.soLien }, (_, k) => (
    <section key={k} className="phieu-in-lien">
      <LienContext.Provider value={{ lien: k + 1, soLien: caiDat.soLien, nhan: nhanLienDung[k] ?? '' }}>{children}</LienContext.Provider>
    </section>
  ));

  return (
    <div className="phieu-in-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90" role="main" aria-label={title}>
      <ThanhCongCuIn
        title={title}
        onDong={handleClose}
        zoom={zoom}
        vuaKhung={vuaKhung}
        onZoom={onZoom}
        trangHienTai={trangHienTai}
        soTrang={Math.max(1, kq.soTrang)}
        onNhayTrang={nhayTrang}
        khoangTrang={khoangTrang}
        onKhoangTrang={setKhoangTrang}
        loiKhoang={loiKhoang}
        moCaiDat={moCaiDat}
        onCaiDat={() => setMoCaiDat((o) => !o)}
        dinhDang={dinhDang}
        dangTaiXuong={dangTaiXuong}
        sanSang={sanSang}
        onIn={handlePrint}
        toolbarExtra={toolbarExtra}
      />
      <div className="phieu-in-main flex-1 min-h-0 flex">
        <div ref={cuonRef} className="phieu-in-cuon relative flex-1 min-w-0 overflow-auto">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-label={t('common.loading')} />
            </div>
          ) : (
            <>
              <div ref={dichRef} className="phieu-in-dich" style={{ zoom }} />
              <PhieuInContext.Provider value={ctx}>
                <XemTruocChiaTrang
                  caiDat={caiDat}
                  chanTrai={chanTrai}
                  dauChim={dauChim}
                  qrDataUrl={qr}
                  tamDung={!logoXong || (caiDat.qr && !!duongDanGoc && !qr)}
                  dichRef={dichRef}
                  nguonRef={nguonRef}
                  onXong={onXong}
                >
                  {lien}
                </XemTruocChiaTrang>
              </PhieuInContext.Provider>
            </>
          )}
        </div>
        {moCaiDat && (
          <BangCaiDatIn
            caiDat={caiDat}
            coChuGocPt={coChuGoc}
            doi={doi}
            khoiPhuc={khoiPhuc}
            coThayDoi={coThayDoi}
            bang={kq.bang}
            coQr={!!duongDanGoc}
            onDong={() => setMoCaiDat(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PhieuInPage;
