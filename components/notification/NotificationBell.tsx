import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useDemChuaDoc, napSanNoiDungChuong } from '../../features/thong-bao/hooks/use-thong-bao';
import { useAppBadge } from '../../features/thong-bao/hooks/use-app-badge';
import { cn } from '../../lib/utils';

/**
 * Panel nằm trong chunk riêng: chuông có mặt trên MỌI trang nên mọi thứ nó kéo
 * theo đều vào bundle chính. Phần lớn phiên làm việc người dùng không mở panel
 * lần nào, nên chỉ tải khi thật sự bấm vào.
 */
const NotificationDropdown = lazy(() => import('./NotificationDropdown'));

interface NotificationBellProps {
  /** Khi 'top', dropdown mở phía trên (dùng trong bottom nav). */
  placement?: 'default' | 'top';
}

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
};

const NotificationBell: React.FC<NotificationBellProps> = ({ placement = 'default' }) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [viTri, setViTri] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const daNapNen = useRef(false);
  // Query đếm riêng, gọi với head:true nên gần như không tốn băng thông; danh
  // sách đầy đủ chỉ tải khi panel mở.
  const { data: count = 0 } = useDemChuaDoc();
  const queryClient = useQueryClient();

  // Chuông có mặt ở mọi trang nên đây là chỗ duy nhất cần gắn: badge trên icon
  // app luôn khớp con số đang hiện trên chuông.
  useAppBadge(count);

  /**
   * Nạp sẵn nội dung panel ngay khi con trỏ chạm vào chuông (hoặc khi nút nhận
   * tiêu điểm bàn phím). Quãng vài trăm mili-giây từ lúc rê tới lúc bấm đủ để
   * tải xong, nên panel mở ra là đã có dữ liệu thay vì hiện vòng quay.
   */
  const napSan = useCallback(() => {
    napSanNoiDungChuong(queryClient);
    void import('./NotificationDropdown');
  }, [queryClient]);

  /**
   * Trên điện thoại không có thao tác rê chuột nên `onPointerEnter` chẳng bao
   * giờ chạy trước cú chạm. Bù lại bằng cách nạp mã panel lúc trình duyệt rảnh —
   * nhưng chỉ khi người dùng thực sự có thông báo chưa đọc, để người không dùng
   * tới chuông không phải tải thêm gì.
   */
  useEffect(() => {
    if (count <= 0 || daNapNen.current) return;
    daNapNen.current = true;

    const nap = () => void import('./NotificationDropdown');
    const wnd = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof wnd.requestIdleCallback === 'function') {
      const id = wnd.requestIdleCallback(nap, { timeout: 4000 });
      return () => wnd.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(nap, 2500);
    return () => window.clearTimeout(id);
  }, [count]);

  /**
   * Panel phải đi qua portal: phía trên nút có <main overflow:auto> và một
   * container overflow-x:hidden, nên panel neo bằng `absolute` sẽ bị cắt.
   *
   * Toạ độ đo NGAY trong handler bấm rồi set cùng lúc với trạng thái mở. Bản
   * trước đo trong useLayoutEffect sau khi mở — hướng đó để lại một lần render
   * mà panel chưa có toạ độ nên chưa được gắn vào cây, và khi effect không kịp
   * chạy thì bấm chuông không ra gì cả.
   */
  const doViTri = useCallback((): { top: number; right: number } | null => {
    const nut = buttonRef.current;
    if (!nut || typeof window === 'undefined') return null;
    const o = nut.getBoundingClientRect();
    return { top: o.bottom + 8, right: Math.max(8, window.innerWidth - o.right) };
  }, []);

  const doiTrangThaiMo = useCallback(() => {
    // Không lồng setViTri vào trong updater của setIsOpen: hàm updater phải
    // thuần, React được phép gọi lại nó nên lời gọi setState lồng bên trong có
    // thể bị bỏ qua — đúng cái làm panel không bao giờ có toạ độ để mở.
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setViTri(doViTri());
    setIsOpen(true);
  }, [isOpen, doViTri]);

  // Cuộn trang hay đổi kích thước cửa sổ khi panel đang mở thì neo lại cho khớp.
  useEffect(() => {
    if (!isOpen || placement !== 'default') return;
    const capNhat = () => setViTri(doViTri());
    window.addEventListener('resize', capNhat);
    window.addEventListener('scroll', capNhat, true);
    return () => {
      window.removeEventListener('resize', capNhat);
      window.removeEventListener('scroll', capNhat, true);
    };
  }, [isOpen, placement, doViTri]);

  // Esc đóng panel — thói quen chung của mọi lớp nổi.
  useEffect(() => {
    if (!isOpen) return;
    const onPhim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onPhim);
    return () => document.removeEventListener('keydown', onPhim);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        const dropdown = document.querySelector('[data-notification-dropdown]');
        if (dropdown && dropdown.contains(event.target as Node)) return;
        // Combobox lọc module bung danh sách qua portal riêng ở body, nên click
        // vào một mục trong đó không phải là click ra ngoài panel.
        if ((event.target as Element).closest?.('[data-combobox-dropdown]')) return;
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const wrapperClass =
    placement === 'top'
      ? 'absolute right-0 bottom-full z-50 mb-2'
      : isMobile
        ? 'fixed left-4 right-4 z-50'
        : 'absolute right-0 top-full z-50 mt-2';

  const wrapperStyle =
    placement === 'default' && isMobile && viTri ? { top: `${viTri.top}px` } : undefined;

  const dropdownContent = isOpen ? (
    <Suspense fallback={null}>
      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={buttonRef}
        placement={placement}
      />
    </Suspense>
  ) : null;

  const dungPortal = placement === 'default' && !isMobile && isOpen && viTri !== null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={t('nav.notification')}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={doiTrangThaiMo}
        onPointerEnter={napSan}
        onPointerDown={napSan}
        onFocus={napSan}
        className={cn(
          'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 md:h-10 md:w-10',
          'flex items-center justify-center rounded-xl',
          'text-muted-foreground hover:bg-muted hover:text-foreground transition-all relative active:scale-95',
          isOpen && 'bg-muted text-foreground'
        )}
      >
        <Bell size={20} strokeWidth={1.8} className="shrink-0" />
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-primary text-2xs font-semibold text-primary-foreground rounded-full shadow-sm ring-2 ring-card"
            aria-hidden
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Desktop: render dropdown in portal to avoid being clipped by main overflow */}
      {dungPortal &&
        viTri &&
        typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            <div
              data-notification-dropdown
              className="fixed z-[9999] w-[min(calc(100vw-2rem),380px)]"
              style={{ top: viTri.top, right: viTri.right }}
            >
              {dropdownContent}
            </div>
          </AnimatePresence>,
          document.body
        )}

      {/* Mobile / placement top: render inline (skip inline when desktop waiting for portal position to avoid clipped flash) */}
      {!dungPortal && (
        <AnimatePresence>
          {isOpen && (isMobile || placement === 'top') && (
            <div
              data-notification-dropdown
              className={wrapperClass}
              style={wrapperStyle}
            >
              {dropdownContent}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default NotificationBell;
