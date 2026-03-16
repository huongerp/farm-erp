import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import MainCard from '../components/dashboard/MainCard';
import TabGroup from '../components/ui/TabGroup';
import ModuleDashboardLayout from '../components/dashboard/ModuleDashboardLayout';
import EmptyState from '../components/shared/EmptyState';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';
import { useAuthStore } from '../store/useStore';
import { SIDEBAR_MENU } from '../lib/sidebar-menu';
import {
  useSubmenuVisible,
  isSubmenuWithPermission,
  useModulesWithViewPermission,
  getPermissionModuleIdFromPath,
} from '../features/he-thong/phan-quyen/hooks/use-module-permission';
import { useFavoriteModules } from '../lib/use-favorite-modules';
import { getAllSubmenuGroups } from '../lib/all-submenu-groups';
import 'dayjs/locale/vi';

const TAB_FUNCTIONS = 'functions';
const TAB_ALL = 'all';
const TAB_BOOKMARKS = 'bookmarks';

/** Trả về key greeting theo giờ (0-23): morning / afternoon / evening */
function getGreetingKey(hour: number): string {
  if (hour >= 5 && hour < 12) return 'page.home.greetingMorning';
  if (hour >= 12 && hour < 18) return 'page.home.greetingAfternoon';
  return 'page.home.greetingEvening';
}

function matchesSearch(text: string, q: string): boolean {
  return text.toLowerCase().includes(q);
}

function filterGroupsBySearch(groups: ModuleGroup[], q: string): ModuleGroup[] {
  if (!q) return groups;
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (it) => matchesSearch(it.title, q) || matchesSearch(it.description, q)
      ),
    }))
    .filter((g) => g.items.length > 0);
}

const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { favoriteIds } = useFavoriteModules();
  const [activeTab, setActiveTab] = useState<string>(TAB_FUNCTIONS);
  const [searchQuery, setSearchQuery] = useState('');

  const hour = new Date().getHours();
  const greetingKey = getGreetingKey(hour);
  const q = searchQuery.trim().toLowerCase();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  const showHanhChinh = useSubmenuVisible('/hanh-chinh');
  const showMuaHang = useSubmenuVisible('/mua-hang');
  const showHeThong = useSubmenuVisible('/he-thong');
  const viewableHanhChinh = useModulesWithViewPermission('/hanh-chinh');
  const viewableMuaHang = useModulesWithViewPermission('/mua-hang');
  const viewableIds = useMemo(
    () => new Set([...viewableHanhChinh, ...viewableMuaHang]),
    [viewableHanhChinh, viewableMuaHang]
  );
  const visibleMenu = useMemo(
    () =>
      SIDEBAR_MENU.filter((m) => {
        if (m.path === '/') return false;
        if (!isSubmenuWithPermission(m.path)) return true;
        if (m.path === '/hanh-chinh') return showHanhChinh;
        if (m.path === '/mua-hang') return showMuaHang;
        if (m.path === '/he-thong') return showHeThong;
        return true;
      }),
    [showHanhChinh, showMuaHang, showHeThong]
  );
  /** Thẻ chức năng: bỏ Trang chủ (path === '/'), ẩn submenu không có quyền xem module nào */
  const modules = useMemo(
    () =>
      visibleMenu.map((m) => ({
        title: t(m.nameKey),
        description: m.descriptionKey ? t(m.descriptionKey) : '',
        icon: m.icon,
        path: m.path,
        gradient: m.gradient,
      })),
    [t, visibleMenu]
  );

  /** Tất cả nhóm module (Hành chính + Mua hàng), chỉ hiển thị module user có quyền xem */
  const allGroups = useMemo(() => {
    const raw = getAllSubmenuGroups(t, navigate);
    return raw
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => {
          const permId = it.moduleId ? getPermissionModuleIdFromPath(it.moduleId) : '';
          return !permId || viewableIds.has(permId);
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [t, navigate, viewableIds]);

  /** Nhóm module đã đánh dấu, bỏ nhóm rỗng */
  const bookmarkGroups = useMemo(() => {
    const favoriteSet = new Set(favoriteIds);
    return allGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((it) => it.moduleId && favoriteSet.has(it.moduleId)),
      }))
      .filter((group) => group.items.length > 0);
  }, [allGroups, favoriteIds]);

  const filteredAllGroups = useMemo(() => filterGroupsBySearch(allGroups, q), [allGroups, q]);
  const filteredBookmarkGroups = useMemo(
    () => filterGroupsBySearch(bookmarkGroups, q),
    [bookmarkGroups, q]
  );

  const tabs = [
    { id: TAB_FUNCTIONS, label: t('page.home.tabFunctions') },
    { id: TAB_BOOKMARKS, label: t('page.home.tabBookmarks') },
    { id: TAB_ALL, label: t('page.home.tabAll') },
  ];

  return (
    <div className="space-y-6 pb-10 pt-2 min-h-[calc(100vh-100px)] flex flex-col">

      <div>
        <h1 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">
          {t(greetingKey)}, <span className="text-primary">{user?.full_name || t('page.home.adminFallback')}</span> 👋
        </h1>
      </div>

      <div className="space-y-1.5">
        <div className="h-px bg-border w-full" />
        <div className="sticky top-12 md:top-14 z-20 py-2 -mx-1 px-1 bg-background/95 backdrop-blur-sm border-b border-border/50 -mb-px">
          {/* Desktop: tabs + search cạnh nhau */}
          <div className="hidden sm:flex sm:items-center sm:gap-3">
            <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            {(activeTab === TAB_ALL || activeTab === TAB_BOOKMARKS) && (
              <div className="relative min-w-[240px] max-w-md shrink-0 flex-1">
                <Search
                  size={16}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('page.home.searchPlaceholder')}
                  className="w-full h-9 pl-8 pr-3 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  aria-label={t('page.home.searchPlaceholder')}
                />
              </div>
            )}
          </div>
          {/* Mobile: toolbar row, search below */}
          <div className="flex flex-col gap-2 sm:hidden">
            <div className="flex items-center gap-2">
              <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            </div>
            {(activeTab === TAB_ALL || activeTab === TAB_BOOKMARKS) && (
              <div className="relative w-full">
                <Search
                  size={16}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('page.home.searchPlaceholder')}
                  className="w-full h-9 pl-8 pr-3 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  aria-label={t('page.home.searchPlaceholder')}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* pt ~ chiều cao thanh tab (py-2 + TabGroup) để khi sticky không đè lên hàng icon */}
      <div className="flex-1 pt-3">
        {activeTab === TAB_FUNCTIONS && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 h-full items-start content-start"
          >
            {modules.map((mod) => (
              <motion.div key={mod.path} variants={item}>
                <MainCard
                  title={mod.title}
                  description={mod.description}
                  icon={mod.icon}
                  gradient={mod.gradient}
                  onClick={() => navigate(mod.path)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === TAB_BOOKMARKS && (
          <>
            {bookmarkGroups.length > 0 ? (
              <ModuleDashboardLayout groups={filteredBookmarkGroups} embedded />
            ) : (
              <EmptyState
                title={t('page.home.tabBookmarks')}
                description={t('page.home.bookmarksEmpty')}
              />
            )}
          </>
        )}

        {activeTab === TAB_ALL && (
          <>
            {filteredAllGroups.length > 0 ? (
              <ModuleDashboardLayout groups={filteredAllGroups} embedded />
            ) : (
              <EmptyState
                title={t('page.home.tabAll')}
                description={t('page.home.searchPlaceholder')}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
