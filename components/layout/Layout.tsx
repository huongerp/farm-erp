
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  User, Sparkles, LogOut, Lock, Eye, EyeOff,
  Settings,
  PanelLeftClose, PanelLeft, ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useUIStore } from '../../store/useStore';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';
import Breadcrumbs from '../shared/Breadcrumbs';
import LiveClock from './LiveClock';
import MobileBottomNav from './MobileBottomNav';
import { SIDEBAR_MENU } from '../../lib/sidebar-menu';
import { useSubmenuVisible, isSubmenuWithPermission } from '../../features/he-thong/phan-quyen/hooks/use-module-permission';
import { signOut, updatePassword } from '../../lib/auth';
import { toast } from 'sonner';
import { useCompanyInfo } from '../../features/he-thong/thong-tin-cong-ty/hooks/use-thong-tin-cong-ty';
import { warmupNavigationTarget } from '../../lib/submenu-prefetch';

/** Sidebar width: expanded 240px (gọn), collapsed 64px (4rem, 8px grid) */
const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 64;

/** Reactive media query hook – replaces direct window.innerWidth in render */
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() =>
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

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, companyInfo } = useUIStore();
  useCompanyInfo();
  const location = useLocation();
  const navigate = useNavigate();
  // NOTE: không dùng `useNavigation()` vì ứng dụng đang dùng <BrowserRouter>
  // (legacy router) chứ không phải data router (createBrowserRouter).
  // Thay vào đó, phát hiện "đang chuyển route" bằng `useLocation` + React Suspense.
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  useEffect(() => {
    setIsRouteLoading(true);
    const id = window.setTimeout(() => setIsRouteLoading(false), 400);
    return () => window.clearTimeout(id);
  }, [location.pathname]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordNew, setChangePasswordNew] = useState('');
  const [changePasswordConfirm, setChangePasswordConfirm] = useState('');
  const [changePasswordShowNew, setChangePasswordShowNew] = useState(false);
  const [changePasswordShowConfirm, setChangePasswordShowConfirm] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [sidebarTooltip, setSidebarTooltip] = useState<{ name: string; top: number; left: number } | null>(null);
  const [logoError, setLogoError] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef(location.pathname);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** Cmd/Ctrl+B toggles sidebar */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  /** On mobile, close sidebar when route changes (e.g. NavLink or header Link to /cai-dat, /ho-so) */
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      if (isMobile && sidebarOpen) toggleSidebar();
    }
  }, [location.pathname, isMobile, sidebarOpen, toggleSidebar]);

  /** Reset logo error when app logo URL changes (e.g. from settings) */
  useEffect(() => {
    setLogoError(false);
  }, [companyInfo.appLogo]);

  const handleLogout = async () => {
    await signOut();
    logout();
    setShowLogoutDialog(false);
    setIsUserMenuOpen(false);
    navigate('/dang-nhap');
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePasswordNew.length < 6) {
      toast.error(t('nav.changePasswordMin'));
      return;
    }
    if (changePasswordNew !== changePasswordConfirm) {
      toast.error(t('nav.changePasswordMismatch'));
      return;
    }
    setChangePasswordLoading(true);
    try {
      await updatePassword(changePasswordNew);
      toast.success(t('nav.changePasswordSuccess'));
      setShowChangePasswordModal(false);
      setChangePasswordNew('');
      setChangePasswordConfirm('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('nav.changePasswordError'));
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const showHanhChinh = useSubmenuVisible('/hanh-chinh');
  const showMuaHang = useSubmenuVisible('/mua-hang');
  const showQuanLyFarm = useSubmenuVisible('/quan-ly-farm');
  const showHeThong = useSubmenuVisible('/he-thong');
  const visibleMenu = React.useMemo(
    () =>
      SIDEBAR_MENU.filter((m) => {
        if (!isSubmenuWithPermission(m.path)) return true;
        if (m.path === '/hanh-chinh') return showHanhChinh;
        if (m.path === '/mua-hang') return showMuaHang;
        if (m.path === '/quan-ly-farm') return showQuanLyFarm;
        if (m.path === '/he-thong') return showHeThong;
        return true;
      }),
    [showHanhChinh, showMuaHang, showQuanLyFarm, showHeThong]
  );
  const navItems = visibleMenu.map(({ path, nameKey, icon }) => ({ name: t(nameKey), icon, path }));

  const sidebarTransition: Transition = { duration: 0.15, ease: 'circOut' };

  return (
    <div className="flex h-[100dvh] bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary overflow-x-hidden min-h-0">
      {/* Skip-to-content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium"
      >
        {t('nav.skipToMain')}
      </a>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSidebar(); } }}
            role="button"
            tabIndex={0}
            aria-label={t('nav.closeOverlay')}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ===== SIDEBAR ===== */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED }}
        transition={sidebarTransition}
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-card border-r border-border/40 flex flex-col overflow-hidden md:relative",
          isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {/* Logo + tên app: lấy từ cài đặt module "Thông tin công ty" (companyInfo trong store, đồng bộ bởi useCompanyInfo) */}
        <div className="flex h-12 md:h-14 items-center px-3 shrink-0 overflow-hidden border-b border-border/50">
          <div className="flex items-center gap-3 min-w-[200px]">
            {companyInfo.appLogo && !logoError ? (
              <img
                src={companyInfo.appLogo}
                alt={companyInfo.appName || 'App Logo'}
                className="h-8 w-8 rounded-lg object-contain shadow-sm shrink-0 bg-card border border-border/50"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary shadow-sm flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-white" />
              </div>
            )}
            <motion.div
              animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -10 }}
              transition={sidebarTransition}
              className="min-w-0"
            >
              <h2 className="text-xs font-bold text-foreground leading-tight truncate">{companyInfo.appName}</h2>
              <p className="text-xs text-muted-foreground truncate leading-tight">{companyInfo.appDescription || t('nav.defaultAppDescription')}</p>
            </motion.div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 min-h-0 flex flex-col py-3 relative">
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
            <nav className="px-2 space-y-1" aria-label={t('nav.mainNav')}>
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  aria-label={item.name}
                  title={item.name}
                  onClick={() => {
                    if (isMobile && sidebarOpen) toggleSidebar();
                  }}
                  onPointerEnter={() => warmupNavigationTarget(item.path)}
                  onMouseEnter={(e) => {
                    if (!sidebarOpen) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setSidebarTooltip({ name: item.name, top: rect.top + rect.height / 2, left: rect.right });
                    }
                  }}
                  onMouseLeave={() => setSidebarTooltip(null)}
                  className={({ isActive }) => cn(
                    "group flex items-center gap-3 rounded-lg transition-all relative min-h-[44px] h-11",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    isActive
                      ? 'bg-primary/5 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="navIndicator"
                          className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary rounded-r-full z-10"
                          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                        />
                      )}

                      <div className="w-[60px] md:w-[56px] flex justify-center shrink-0">
                        <div className={cn(
                          "flex items-center justify-center rounded-lg transition-all duration-200",
                          isActive
                            ? "w-8 h-8 bg-primary text-white shadow-sm"
                            : "w-8 h-8 bg-transparent text-inherit group-hover:bg-card group-hover:shadow-sm"
                        )}>
                          <item.icon size={16} className={cn("transition-all", isActive ? "stroke-[2.5px]" : "stroke-[1.8px]")} />
                        </div>
                      </div>

                      <motion.span
                        animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -5 }}
                        transition={sidebarTransition}
                        className={cn(
                          "text-sm font-medium transition-colors whitespace-nowrap",
                          isActive ? "text-primary font-bold" : "text-inherit",
                          !sidebarOpen && "pointer-events-none"
                        )}
                      >
                        {item.name}
                      </motion.span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
          {/* Fade hint when nav is scrollable */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none shrink-0" aria-hidden />
        </div>
      </motion.aside>

      {/* Sidebar collapsed tooltip — rendered via portal to escape overflow-hidden */}
      {sidebarTooltip && !sidebarOpen && createPortal(
        <div
          className="fixed z-[9999] px-2.5 py-1 bg-popover text-popover-foreground text-xs font-medium rounded-lg shadow-md border border-border/60 whitespace-nowrap pointer-events-none"
          style={{ top: sidebarTooltip.top, left: sidebarTooltip.left + 8, transform: 'translateY(-50%)' }}
        >
          {sidebarTooltip.name}
        </div>,
        document.body
      )}

      {/* Thanh trạng thái chuyển route — phản hồi tức thì khi URL đang đổi (lazy chunk). */}
      {isRouteLoading && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-primary/40 animate-pulse pointer-events-none"
          aria-hidden
        />
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main id="main-content" className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto overscroll-contain no-scrollbar bg-muted/30 relative">

        {/* ===== HEADER TOP BAR ===== */}
        <header className="h-12 md:h-14 shrink-0 border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-40 px-3 md:px-5 flex items-center justify-between gap-3 safe-area-top">

          {/* Left: Toggle + Breadcrumbs */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <button
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? t('nav.collapseSidebar') : t('nav.expandSidebar')}
              className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 flex items-center justify-center rounded-lg bg-muted/60 border border-border/80 text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/20 transition-all active:scale-90 shrink-0"
            >
              {sidebarOpen ? <PanelLeftClose size={12} /> : <PanelLeft size={12} />}
            </button>

            <div className="flex-1 min-w-0">
              <Breadcrumbs />
            </div>
          </div>

          {/* Right: Clock + User */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <LiveClock />

            {/* User Profile Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label={t('nav.userMenu')}
                aria-expanded={isUserMenuOpen}
                className="min-h-[44px] flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-muted border border-transparent hover:border-border transition-all group"
              >
                <div className="relative shrink-0">
                  <img
                    src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name || 'User'}&background=random`}
                    alt="Avatar"
                    className="h-7 w-7 rounded-lg ring-1 ring-border shadow-sm object-cover"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-[1.5px] border-card rounded-full"></div>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-foreground leading-tight">{user?.full_name || t('nav.guestUser')}</p>
                  <p className="text-xs font-normal text-muted-foreground leading-tight">{user?.role === 'admin' ? t('nav.roleAdmin') : t('nav.roleMember')}</p>
                </div>
                <ChevronDown size={12} className={cn("text-muted-foreground/50 hidden md:block transition-transform", isUserMenuOpen ? "rotate-180" : "")} />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-card/95 backdrop-blur-xl rounded-xl shadow-xl border border-border overflow-hidden z-50 p-1.5"
                  >
                    <div className="px-3 py-2.5 border-b border-border md:hidden">
                      <p className="text-xs font-semibold text-foreground">{user?.full_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                    </div>
                    <div className="space-y-0.5">
                      <Link to="/ho-so" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary rounded-lg transition-all group">
                        <User size={15} className="text-muted-foreground group-hover:text-primary transition-colors" /> {t('nav.profile')}
                      </Link>
                      <Link to="/cai-dat" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary rounded-lg transition-all group">
                        <Settings size={15} className="text-muted-foreground group-hover:text-primary transition-colors" /> {t('nav.settings')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setIsUserMenuOpen(false); setShowChangePasswordModal(true); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary rounded-lg transition-all group text-left"
                      >
                        <Lock size={15} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" /> {t('nav.changePassword')}
                      </button>
                      <div className="h-px bg-border my-1 mx-2" />
                      <button
                        onClick={() => setShowLogoutDialog(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all group"
                      >
                        <LogOut size={15} className="text-rose-300 group-hover:text-rose-500 transition-colors" /> {t('nav.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area - scroll trên main nên sticky hoạt động */}
        <div className="flex-1 min-h-0">
          <div className="p-1.5 md:p-2 min-h-full pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="h-full">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom nav: Back | Trang chủ (chỉ mobile) */}
      <MobileBottomNav />

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowChangePasswordModal(false); setChangePasswordNew(''); setChangePasswordConfirm(''); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-card rounded-xl p-6 max-w-md w-full shadow-2xl border border-border/40"
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 id="change-password-title" className="text-lg font-bold text-foreground">{t('nav.changePasswordTitle')}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{t('nav.changePasswordDesc')}</p>
                </div>
              </div>
              <form onSubmit={handleChangePasswordSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">{t('nav.changePasswordNew')} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={changePasswordShowNew ? 'text' : 'password'}
                      value={changePasswordNew}
                      onChange={(e) => setChangePasswordNew(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full h-10 rounded-lg border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    />
                    <button
                      type="button"
                      onClick={() => setChangePasswordShowNew((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-muted-foreground hover:text-foreground"
                      aria-label={changePasswordShowNew ? t('page.login.hidePassword') : t('page.login.showPassword')}
                    >
                      {changePasswordShowNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">{t('nav.changePasswordConfirm')} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={changePasswordShowConfirm ? 'text' : 'password'}
                      value={changePasswordConfirm}
                      onChange={(e) => setChangePasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full h-10 rounded-lg border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    />
                    <button
                      type="button"
                      onClick={() => setChangePasswordShowConfirm((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-muted-foreground hover:text-foreground"
                      aria-label={changePasswordShowConfirm ? t('page.login.hidePassword') : t('page.login.showPassword')}
                    >
                      {changePasswordShowConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-lg h-10 text-sm font-medium"
                    onClick={() => { setShowChangePasswordModal(false); setChangePasswordNew(''); setChangePasswordConfirm(''); }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" className="flex-1 rounded-lg h-10 text-sm font-medium" isLoading={changePasswordLoading}>
                    {t('nav.changePasswordSubmit')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLogoutDialog(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-xl p-6 max-w-sm w-full shadow-2xl border border-border/40 text-center"
            >
              <div className="h-12 w-12 bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t('nav.logoutConfirmTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{t('nav.logoutConfirmMessage')}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-lg h-9 text-sm font-medium" onClick={() => setShowLogoutDialog(false)}>{t('nav.logoutCancel')}</Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-9 text-sm font-medium shadow-sm" onClick={handleLogout}>{t('nav.logout')}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
