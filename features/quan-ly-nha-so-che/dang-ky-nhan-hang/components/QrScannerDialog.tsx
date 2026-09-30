import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ListPlus, Loader2, ScanLine, Undo2, XCircle, Zap } from 'lucide-react';
import type QrScannerType from 'qr-scanner';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import Combobox from '../../../../components/ui/Combobox';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useHangHoaRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { cn } from '../../../../lib/utils';
import { chuanHoaMaQr, taoBoLocQuetTrung } from '../core/qr';

export interface KetQuaQuet {
  ok: boolean;
  message: string;
}

interface Props {
  /** `lien-tuc`: quét nhiều thùng liên tục; `mot-lan`: quét 1 mã rồi đóng (điền combobox). */
  mode: 'lien-tuc' | 'mot-lan';
  title: string;
  /** Nhận mã đã chuẩn hoá. Trả kết quả để hiện ngay dưới camera. */
  onDetected: (ma: string) => Promise<KetQuaQuet> | KetQuaQuet;
  /** Xoá lần ghi gần nhất; trả `true` khi có dòng bị xoá. */
  onUndoLast?: () => Promise<boolean>;
  undoPending?: boolean;
  onClose: () => void;
}

interface LichSu extends KetQuaQuet {
  id: number;
}

/** Tiếng "bíp" ngắn + rung — người quét không phải nhìn màn hình từng thùng. */
function baoHieu(ok: boolean) {
  try {
    navigator.vibrate?.(ok ? 60 : [80, 60, 80]);
  } catch {
    /* thiết bị không hỗ trợ rung */
  }
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = ok ? 1200 : 300;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.09 : 0.25));
    osc.onended = () => void ctx.close();
  } catch {
    /* không có âm thanh cũng không sao */
  }
}

/**
 * Quét QR bằng camera sau (thư viện `qr-scanner`, lazy-load khi mở dialog).
 * Danh sách sổ xuống phía dưới để chọn tay khi tem hỏng / không có camera; máy quét cầm
 * tay (gõ mã + Enter như bàn phím) gõ thẳng vào ô tìm của danh sách, Enter chọn dòng khớp.
 * Camera cần HTTPS (hoặc localhost).
 */
const QrScannerDialog: React.FC<Props> = ({ mode, title, onDetected, onUndoLast, undoPending, onClose }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerType | null>(null);
  const boLocRef = useRef(taoBoLocQuetTrung());
  const hangDoiRef = useRef<Promise<unknown>>(Promise.resolve());
  const doneRef = useRef(false);
  const [camState, setCamState] = useState<'loading' | 'on' | 'error'>('loading');
  const [camError, setCamError] = useState('');
  const [hasFlash, setHasFlash] = useState(false);
  const [lichSu, setLichSu] = useState<LichSu[]>([]);
  const [soThanhCong, setSoThanhCong] = useState(0);
  const [chonKey, setChonKey] = useState(0);
  const { data: hangHoaList = [] } = useHangHoaRefQuery();
  const options = useMemo(
    () =>
      hangHoaList
        .filter((h) => h.ma_hang && h.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .map((h) => ({ value: h.id, label: `${h.ma_hang} - ${h.ten_hang}`, subLabel: h.don_vi_tinh || undefined })),
    [hangHoaList]
  );

  const xuLyMa = useCallback(
    (raw: string, boQuaTrung = false) => {
      const ma = chuanHoaMaQr(raw);
      if (!ma || doneRef.current) return;
      const now = Date.now();
      if (boQuaTrung) boLocRef.current.datLai();
      if (!boLocRef.current.thay(ma, now)) return;
      if (mode === 'mot-lan') doneRef.current = true;

      // Ghi tuần tự: quét nhanh 2 thùng liền nhau vẫn ra đúng thứ tự, không chen nhau.
      hangDoiRef.current = hangDoiRef.current.then(async () => {
        let kq: KetQuaQuet;
        try {
          kq = await onDetected(ma);
        } catch (e) {
          kq = { ok: false, message: e instanceof Error ? e.message : String(e) };
        }
        baoHieu(kq.ok);
        if (kq.ok) setSoThanhCong((n) => n + 1);
        setLichSu((cur) => [{ ...kq, id: now }, ...cur].slice(0, 8));
        if (mode === 'mot-lan') {
          if (kq.ok) onClose();
          else doneRef.current = false;
        }
      });
    },
    [mode, onDetected, onClose]
  );
  // Camera khởi tạo một lần — callback của nó phải luôn gọi bản xuLyMa mới nhất
  // (danh mục hàng hoá có thể tải xong sau khi mở dialog).
  const xuLyMaRef = useRef(xuLyMa);
  xuLyMaRef.current = xuLyMa;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: QrScanner } = await import('qr-scanner');
        if (cancelled || !videoRef.current) return;
        const scanner = new QrScanner(videoRef.current, (r) => xuLyMaRef.current(r.data), {
          // Khung đọc xong mà không có mã = camera đã rời tem (xem taoBoLocQuetTrung).
          onDecodeError: () => boLocRef.current.trong(Date.now()),
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 8,
          returnDetailedScanResult: true,
        });
        scannerRef.current = scanner;
        await scanner.start();
        if (cancelled) return;
        setCamState('on');
        setHasFlash(await scanner.hasFlash().catch(() => false));
      } catch (e) {
        if (cancelled) return;
        setCamState('error');
        setCamError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, []);

  /** Chọn từ danh sách = ghi nhận mã đó ngay (không cần camera). */
  const chonTuDanhSach = (id: string | number | null) => {
    const hh = id != null ? hangHoaList.find((h) => h.id === String(id)) : undefined;
    if (hh?.ma_hang) xuLyMa(hh.ma_hang, true);
    setChonKey((k) => k + 1); // xoá lựa chọn để chọn lại cùng mã cho thùng kế tiếp
  };

  return (
    <GenericDrawer
      title={title}
      subtitle={t(mode === 'lien-tuc' ? 'dangKyNhanHang.qr.subtitleLienTuc' : 'dangKyNhanHang.qr.subtitleMotLan')}
      icon={<ScanLine className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.MEDIUM}
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          {mode === 'lien-tuc' && onUndoLast ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                boLocRef.current.datLai();
                const daXoa = await onUndoLast().catch(() => false);
                if (!daXoa) return;
                setSoThanhCong((n) => Math.max(0, n - 1));
                setLichSu((cur) =>
                  [{ ok: false, message: t('dangKyNhanHang.toast.hoanTacDongSuccess'), id: Date.now() }, ...cur].slice(0, 8)
                );
              }}
              disabled={undoPending}
            >
              <Undo2 size={14} className="mr-1.5" />
              {t('dangKyNhanHang.hangHoa.hoanTacCuoi')}
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" size="sm" onClick={onClose}>
            {t(mode === 'lien-tuc' ? 'dangKyNhanHang.qr.xong' : 'common.close')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {camState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm gap-2">
              <Loader2 className="animate-spin" size={18} />
              {t('dangKyNhanHang.qr.dangMoCamera')}
            </div>
          )}
          {camState === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white/90 text-sm gap-1 p-4">
              <XCircle size={22} className="text-rose-400" />
              <span>{t('dangKyNhanHang.qr.khongMoDuocCamera')}</span>
              <span className="text-white/60 text-xs">{camError}</span>
            </div>
          )}
          {mode === 'lien-tuc' && (
            <div className="absolute top-2 left-2 rounded-full bg-black/60 text-white text-sm font-semibold px-3 py-1 tabular-nums">
              {t('dangKyNhanHang.qr.daQuet', { n: soThanhCong })}
            </div>
          )}
          {hasFlash && (
            <button
              type="button"
              onClick={() => void scannerRef.current?.toggleFlash()}
              className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center"
              aria-label={t('dangKyNhanHang.qr.den')}
            >
              <Zap size={16} />
            </button>
          )}
        </div>

        <Combobox
          key={chonKey}
          label={t('dangKyNhanHang.qr.nhapTay')}
          icon={<ListPlus size={16} className="text-muted-foreground" />}
          placeholder={t(mode === 'lien-tuc' ? 'dangKyNhanHang.qr.chonDeThem' : 'dangKyNhanHang.hangHoa.chonHangHoa')}
          searchPlaceholder={t('dangKyNhanHang.qr.timMaHoacTen')}
          options={options}
          value={null}
          onChange={chonTuDanhSach}
        />

        {lichSu.length > 0 && (
          <ul className="space-y-1">
            {lichSu.map((l, i) => (
              <li
                key={l.id}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm',
                  l.ok
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                  i > 0 && 'opacity-70'
                )}
              >
                {l.ok ? <CheckCircle2 size={14} className="shrink-0" /> : <XCircle size={14} className="shrink-0" />}
                <span className="min-w-0 truncate">{l.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </GenericDrawer>
  );
};

export default QrScannerDialog;
