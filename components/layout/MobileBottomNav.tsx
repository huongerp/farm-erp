import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, Home } from 'lucide-react';
import { useDemChuaDoc } from '../../features/thong-bao/hooks/use-thong-bao';
import { useTranslation } from 'react-i18next';
import { getParentPath } from '../shared/Breadcrumbs';
import { cn } from '../../lib/utils';

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
};

/** Bottom nav mobile: Trái Back | Giữa Trang chủ | Phải Thông báo. Chỉ hiện khi isMobile. */
const MobileBottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  // Cùng query đếm với chuông ở header (React Query dùng chung cache, không gọi thêm).
  const { data: soChuaDoc = 0 } = useDemChuaDoc();

  const parentPath = React.useMemo(
    () => getParentPath(location.pathname, t),
    [location.pathname, t]
  );
  const showBack = parentPath !== undefined;

  if (!isMobile) return null;

  return (
    <nav
      aria-label={t('nav.mainNav')}
      className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-center h-16 px-2">
        {/* Trái: Back – icon căn giữa ô */}
        <div className="flex-1 flex justify-center items-center min-w-0">
          {showBack ? (
            <button
              type="button"
              onClick={() => navigate(parentPath!)}
              aria-label={t('nav.back')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
            >
              <ChevronLeft size={24} strokeWidth={2} className="shrink-0" />
            </button>
          ) : (
            <div className="min-w-[44px] min-h-[44px]" aria-hidden />
          )}
        </div>

        {/* Giữa: Trang chủ – nút tròn nhô lên, icon only */}
        <div className="flex-1 flex justify-center items-center min-w-0 -mt-5">
          <Link
            to="/"
            aria-label={t('nav.home')}
            aria-current={location.pathname === '/' ? 'page' : undefined}
            className={cn(
              'min-h-[56px] min-w-[56px] flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95',
              location.pathname === '/'
                ? 'bg-primary text-primary-foreground shadow-primary/30'
                : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground shadow-border/50'
            )}
          >
            <Home size={26} strokeWidth={2} className="shrink-0" />
          </Link>
        </div>

        {/* Phải: Thông báo — việc duyệt phiếu trên điện thoại thường bắt đầu từ đây. */}
        <div className="flex-1 flex justify-center items-center min-w-0">
          <Link
            to="/thong-bao"
            aria-label={t('nav.notification')}
            aria-current={location.pathname === '/thong-bao' ? 'page' : undefined}
            className={cn(
              'relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all active:scale-95',
              location.pathname === '/thong-bao' ? 'text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Bell size={22} strokeWidth={2} className="shrink-0" />
            {soChuaDoc > 0 && (
              <span
                className="absolute top-1 right-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-primary text-2xs font-semibold text-primary-foreground rounded-full ring-2 ring-card"
                aria-hidden
              >
                {soChuaDoc > 99 ? '99+' : soChuaDoc}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
