import React, { useCallback, useEffect, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useLocation } from 'react-router-dom';
import { useIsMutating } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isAppBusy, setMutationCount, subscribe as subscribeAppBusy } from '../../lib/app-busy';
import {
  APPLY_TOAST_MS,
  HIDDEN_THRESHOLD_MS,
  PRELOAD_ERROR_RELOAD_KEY,
  SAFE_MOMENT_DEBOUNCE_MS,
  UPDATE_CHECK_INTERVAL_MS,
  decideUpdateAction,
  getPendingReloadAt,
  type UpdateTrigger,
} from '../../lib/app-update';

/**
 * Bump chuỗi này khi nghi ngờ Service Worker cũ đang cache và gây "ma API"
 * (vd: request Supabase cũ vẫn bị SW bắt → đốt egress). Thay đổi giá trị sẽ
 * kích hoạt logic unregister SW cũ **một lần duy nhất** trên mỗi trình duyệt
 * (kiểm tra qua localStorage). Lần sau bạn deploy bản vá thực sự, bump tiếp
 * giá trị này hoặc giữ nguyên.
 */
const SW_UNREGISTER_BUSTER = 'v2-pwa-precache-shell-2026-04';
const SW_UNREGISTER_LS_KEY = 'pwa-sw-unregistered-once';

async function unregisterLegacyServiceWorkersOnce(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const applied = window.localStorage.getItem(SW_UNREGISTER_LS_KEY);
    if (applied === SW_UNREGISTER_BUSTER) return;
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
    // Xoá caches cũ do SW trước đó tạo — tránh cache response Supabase cũ.
    if (typeof caches !== 'undefined') {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    window.localStorage.setItem(SW_UNREGISTER_LS_KEY, SW_UNREGISTER_BUSTER);
  } catch {
    /* im lặng — nếu fail cũng không block app */
  }
}

/**
 * Đăng ký Service Worker (PWA) và **tự áp bản cập nhật mới vào thời điểm an toàn**.
 *
 * Trước đây chỗ này hiện toast "Nhấn Tải lại" và chờ người dùng bấm — phần lớn bỏ qua
 * toast rồi chạy bản cũ cả ngày. Giờ:
 * - Chủ động hỏi server xem có bản mới chưa (SPA không navigate nên SW không tự hỏi).
 * - Khi có bản mới, KHÔNG reload ngay. Chờ tới lúc người dùng vừa xong việc — lưu xong
 *   phiếu, đóng drawer, đổi trang, hoặc quay lại tab — và `isAppBusy()` là false.
 * - Không bao giờ reload khi đang có form mở hoặc đang nhập dở (xem `lib/app-busy.ts`).
 * - Ngồi lì trong một form quá lâu thì chỉ nhắc mềm bằng toast, không ép.
 */
const PwaRegister: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const mutatingCount = useIsMutating();

  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  /** Thời điểm SW báo có bản mới; null = chưa có gì để áp. */
  const readyAtRef = useRef<number | null>(null);
  const notifiedRef = useRef(false);
  const applyingRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  // Cầu nối React Query → app-busy, để cả index.tsx cũng biết đang có mutation chạy dở.
  useEffect(() => {
    setMutationCount(mutatingCount);
  }, [mutatingCount]);

  const applyUpdate = useCallback(() => {
    if (applyingRef.current) return;
    applyingRef.current = true;
    // Có bản mới từ SW thì kích hoạt worker đang chờ rồi mới reload; còn nếu chỉ là yêu
    // cầu treo do chunk cũ 404 thì không có worker nào chờ cả, reload thẳng.
    const viaServiceWorker = readyAtRef.current != null;
    toast.success(t('app.updating'), { duration: APPLY_TOAST_MS });
    window.setTimeout(() => {
      if (viaServiceWorker) {
        void updateSWRef.current?.(true);
        return;
      }
      window.sessionStorage.setItem(PRELOAD_ERROR_RELOAD_KEY, '1');
      window.location.reload();
    }, APPLY_TOAST_MS);
  }, [t]);

  const notifyManually = useCallback(() => {
    if (notifiedRef.current) return;
    notifiedRef.current = true;
    toast.info(t('app.updateAvailable'), {
      description: t('app.updateAvailableDesc'),
      action: { label: t('app.reloadNow'), onClick: () => applyUpdate() },
      duration: Infinity,
    });
  }, [t, applyUpdate]);

  const evaluate = useCallback(
    (trigger: UpdateTrigger) => {
      const readyAt = readyAtRef.current ?? getPendingReloadAt();
      if (readyAt == null || applyingRef.current) return;
      const decision = decideUpdateAction({
        updateReady: true,
        busy: isAppBusy(),
        trigger,
        msSinceReady: Date.now() - readyAt,
        alreadyNotified: notifiedRef.current,
      });
      if (decision === 'apply') applyUpdate();
      else if (decision === 'notify') notifyManually();
    },
    [applyUpdate, notifyManually]
  );

  /**
   * Chờ một nhịp rồi mới xét: lúc drawer vừa đóng còn animation, và toast "Lưu thành công"
   * vừa hiện — reload ngay lập tức sẽ như một cú giật.
   */
  const scheduleEvaluate = useCallback(
    (trigger: UpdateTrigger) => {
      if (readyAtRef.current == null && getPendingReloadAt() == null) return;
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        evaluate(trigger);
      }, SAFE_MOMENT_DEBOUNCE_MS);
    },
    [evaluate]
  );

  // Giữ tham chiếu mới nhất cho các effect chỉ chạy một lần (đăng ký SW, listener toàn cục).
  const scheduleEvaluateRef = useRef(scheduleEvaluate);
  useEffect(() => {
    scheduleEvaluateRef.current = scheduleEvaluate;
  }, [scheduleEvaluate]);
  const evaluateRef = useRef(evaluate);
  useEffect(() => {
    evaluateRef.current = evaluate;
  }, [evaluate]);

  // Đăng ký SW một lần + chủ động đi tìm bản mới.
  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    unregisterLegacyServiceWorkersOnce().finally(() => {
      if (cancelled) return;
      updateSWRef.current = registerSW({
        onNeedRefresh() {
          readyAtRef.current = Date.now();
          scheduleEvaluateRef.current('ready');
        },
        onOfflineReady() {
          toast.success('Ứng dụng sẵn sàng dùng offline.');
        },
        onRegisteredSW(_swUrl, registration) {
          registrationRef.current = registration ?? null;
          // SW chỉ tự kiểm tra bản mới khi có navigation thật, mà SPA thì không bao giờ
          // navigate — nên phải tự hỏi theo nhịp.
          intervalId = window.setInterval(() => {
            void registrationRef.current?.update();
            evaluateRef.current('tick');
          }, UPDATE_CHECK_INTERVAL_MS);
        },
      });
    });

    return () => {
      cancelled = true;
      if (intervalId != null) window.clearInterval(intervalId);
    };
  }, []);

  // Đổi route — người dùng vừa rời màn hình cũ, thời điểm đẹp để reload.
  useEffect(() => {
    scheduleEvaluateRef.current('route');
  }, [location.pathname]);

  // App vừa hết bận: lưu xong (CRUD), đóng drawer/dialog cuối cùng, mutation chạy xong.
  useEffect(() => {
    let wasBusy = isAppBusy();
    return subscribeAppBusy(() => {
      const busy = isAppBusy();
      if (wasBusy && !busy) scheduleEvaluateRef.current('idle');
      wasBusy = busy;
    });
  }, []);

  // Tab ẩn đủ lâu rồi hiện lại: vừa là lúc hỏi server, vừa là lúc người dùng đã rời việc.
  useEffect(() => {
    let hiddenAt: number | null = null;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      void registrationRef.current?.update();
      if (hiddenAt != null && Date.now() - hiddenAt >= HIDDEN_THRESHOLD_MS) {
        scheduleEvaluateRef.current('visible');
      }
      hiddenAt = null;
    };
    const onOnline = () => {
      void registrationRef.current?.update();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  // Dọn debounce khi unmount.
  useEffect(
    () => () => {
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    },
    []
  );

  return null;
};

export default PwaRegister;
