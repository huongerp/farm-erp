import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import i18n from '../../../lib/i18n';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { sheetsClient, SheetsLoi, type TrangThaiGoogle } from '../../../lib/sheets-client';

type TinCallback = { type: 'farm-sheets-google'; ok: boolean; email?: string; thongDiep?: string };

function laTinCallback(d: unknown): d is TinCallback {
  return !!d && typeof d === 'object' && (d as { type?: unknown }).type === 'farm-sheets-google';
}

/**
 * Trạng thái kết nối Google của người đang đăng nhập + nút Kết nối / Ngắt.
 *
 * Kết nối mở POPUP (mở cửa sổ trắng NGAY trong click để không bị chặn, rồi mới gán URL).
 * Kết quả về qua `postMessage` hoặc `BroadcastChannel('farm-sheets')` — Google đặt COOP
 * nên `window.opener` có thể mất, kênh broadcast cùng origin là đường dự phòng.
 * Popup bị chặn hẳn → chuyển cả trang sang Google (redirect).
 */
export function useGoogleKetNoi(enabled: boolean) {
  const [trangThai, setTrangThai] = useState<TrangThaiGoogle | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [dangKetNoi, setDangKetNoi] = useState(false);
  /** Service sheets chưa bật / chưa cấu hình — ẩn hẳn lựa chọn Google Sheet. */
  const [khongKhaDung, setKhongKhaDung] = useState(false);
  const popupRef = useRef<Window | null>(null);

  const taiLai = useCallback(async () => {
    setDangTai(true);
    try {
      setTrangThai(await sheetsClient.trangThai());
      setKhongKhaDung(false);
    } catch (e) {
      if (e instanceof SheetsLoi && (e.ma === 'mang' || e.status >= 500 || e.status === 404)) setKhongKhaDung(true);
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void taiLai();
  }, [enabled, taiLai]);

  useEffect(() => {
    if (!enabled) return;
    const xuLy = (tin: TinCallback) => {
      setDangKetNoi(false);
      popupRef.current = null;
      if (tin.ok) {
        toast.success(i18n.t('shared.export.gs.connectedToast', { email: tin.email ?? '' }));
        void taiLai();
      } else {
        toast.error(tin.thongDiep ?? i18n.t('shared.export.gs.connectFailed'));
      }
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin && laTinCallback(e.data)) xuLy(e.data);
    };
    window.addEventListener('message', onMessage);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('farm-sheets');
      bc.onmessage = (e) => laTinCallback(e.data) && xuLy(e.data);
    } catch {
      /* trình duyệt cũ — còn postMessage */
    }
    // Người dùng tự đóng popup giữa chừng → thôi trạng thái "đang kết nối".
    const timer = window.setInterval(() => {
      if (popupRef.current?.closed) {
        popupRef.current = null;
        setDangKetNoi(false);
      }
    }, 800);
    return () => {
      window.removeEventListener('message', onMessage);
      bc?.close();
      window.clearInterval(timer);
    };
  }, [enabled, taiLai]);

  const ketNoi = useCallback(async () => {
    const w = 520;
    const h = 640;
    const popup = window.open(
      'about:blank',
      'farm-sheets-google',
      `width=${w},height=${h},left=${window.screenX + (window.outerWidth - w) / 2},top=${window.screenY + 80}`,
    );
    setDangKetNoi(true);
    try {
      const { url } = await sheetsClient.batDauKetNoi(!!popup);
      if (popup) {
        popup.location.href = url;
        popupRef.current = popup;
      } else {
        window.location.assign(url);
      }
    } catch (e) {
      popup?.close();
      setDangKetNoi(false);
      toast.error(e instanceof Error ? e.message : i18n.t('shared.export.gs.connectFailed'));
    }
  }, []);

  const confirm = useConfirmStore((s) => s.confirm);

  /** Ngắt = xoá kết nối = xoá luôn mọi lịch đồng bộ của người này (FK cascade) → hỏi trước, kể rõ lịch nào. */
  const ngatKetNoi = useCallback(async () => {
    let soLich = 0;
    try {
      soLich = (await sheetsClient.dsLich()).dsLich.length;
    } catch {
      /* không đếm được vẫn cho ngắt */
    }
    confirm({
      title: i18n.t('shared.export.gs.disconnectTitle'),
      message: soLich > 0 ? i18n.t('shared.export.gs.disconnectWithSchedules', { n: soLich }) : i18n.t('shared.export.gs.disconnectMessage'),
      variant: 'danger',
      confirmText: i18n.t('shared.export.gs.disconnect'),
      onConfirm: async () => {
        try {
          await sheetsClient.ngatKetNoi();
          toast.success(i18n.t('shared.export.gs.disconnectedToast'));
          await taiLai();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : i18n.t('shared.export.gs.disconnectFailed'));
        }
      },
    });
  }, [taiLai, confirm]);

  return { trangThai, dangTai, dangKetNoi, khongKhaDung, ketNoi, ngatKetNoi, taiLai };
}
