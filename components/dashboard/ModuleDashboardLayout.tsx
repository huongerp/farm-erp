import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import DashboardToolbar from '../shared/DashboardToolbar';
import TabGroup from '../ui/TabGroup';
import SubModuleCard, { ModuleItem } from './SubModuleCard';
import { useFavoriteModules } from '../../lib/use-favorite-modules';

export interface ModuleGroup {
  groupTitle: string;
  items: ModuleItem[];
}

/**
 * Layout dashboard cho trang submenu (vd. Hệ thống, Hành chính, Nhân sự...).
 * Quy định UI: tên nhóm module (groupTitle) luôn dùng màu primary để nhất quán giữa các submenu.
 * Có toolbar cố định khi cuộn: nút Back (cùng component listview) + ô tìm kiếm module.
 */
interface ModuleDashboardLayoutProps {
  groups: ModuleGroup[];
  /** Đường dẫn quay lại (mặc định "/") */
  backTo?: string;
  /** Khi true: ẩn toolbar (dùng khi nhúng trong Trang chủ) */
  embedded?: boolean;
}

function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

function filterGroupsBySearch(groups: ModuleGroup[], query: string): ModuleGroup[] {
  if (!query.trim()) return groups;
  const q = normalizeSearch(query);
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          normalizeSearch(item.title).includes(q) || normalizeSearch(item.description).includes(q)
      ),
    }))
    .filter((g) => g.items.length > 0);
}

const TAB_ALL = 'all';
const TAB_BOOKMARKS = 'bookmarks';

const ModuleDashboardLayout: React.FC<ModuleDashboardLayoutProps> = ({
  groups,
  backTo = '/',
  embedded = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isFavorite } = useFavoriteModules();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(TAB_ALL);

  const groupsByTab = useMemo(() => {
    if (activeTab === TAB_ALL) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.moduleId && isFavorite(item.moduleId)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, activeTab, isFavorite]);

  const filteredGroups = useMemo(
    () => (embedded ? groups : filterGroupsBySearch(groupsByTab, searchQuery)),
    [embedded, groups, groupsByTab, searchQuery]
  );

  const searchPlaceholder = t('page.home.searchPlaceholder');
  const tabs = [
    { id: TAB_ALL, label: t('page.home.tabAll') },
    { id: TAB_BOOKMARKS, label: t('page.home.tabBookmarks') },
  ];

  const searchInputClass =
    'w-full h-9 pl-8 pr-3 rounded-lg bg-muted/40 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all';

  const leadingContent = (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
      <TabGroup
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="shrink-0"
      />
      {/* Desktop: search cạnh tab, kích thước như Trang chủ */}
      <div className="relative hidden sm:block min-w-[240px] max-w-md flex-1">
        <Search
          size={16}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          aria-hidden
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className={searchInputClass}
          aria-label={searchPlaceholder}
        />
      </div>
    </div>
  );

  const mobileRow2Content = (
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
        placeholder={searchPlaceholder}
        className={searchInputClass}
        aria-label={searchPlaceholder}
      />
    </div>
  );

  return (
    <div className="space-y-4 pb-10 pt-2">
      {!embedded && (
        <div className="-mx-1.5 -mt-2 md:-mx-2 md:-mt-2 mb-2">
          <DashboardToolbar
            onBack={() => navigate(backTo)}
            leadingContent={leadingContent}
            mobileRow2Content={mobileRow2Content}
          />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6 md:space-y-8"
      >
        {filteredGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {embedded
              ? t('common.noResults')
              : activeTab === TAB_BOOKMARKS && !searchQuery.trim()
                ? t('page.home.bookmarksEmpty')
                : searchQuery.trim()
                  ? t('common.noResults')
                  : null}
          </p>
        ) : (
          filteredGroups.map((group, idx) => (
            <div key={idx} className="space-y-4 md:space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 rounded-full bg-primary/80" aria-hidden />
                <h3 className="text-sm font-semibold text-primary">{group.groupTitle}</h3>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {group.items.map((item, itemIdx) => (
                  <SubModuleCard
                    key={item.moduleId ?? `g${idx}-i${itemIdx}`}
                    {...item}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default ModuleDashboardLayout;
