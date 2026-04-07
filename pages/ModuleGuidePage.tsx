import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Shield,
  GitBranch,
  Zap,
  BookMarked,
  HelpCircle,
  Mail,
  List,
} from 'lucide-react';
import { cn } from '../lib/utils';
import DashboardToolbar from '../components/shared/DashboardToolbar';
import Section from '../components/shared/Section';
import { getModuleTitleKeyBySlug, HANH_CHINH_MODULE_SLUGS } from '../lib/hanh-chinh-menu';
import { getNhanSuModuleTitleKeyBySlug, NHAN_SU_MODULE_SLUGS } from '../lib/nhan-su-menu';
import { getMarketingModuleTitleKeyBySlug, MARKETING_MODULE_SLUGS } from '../lib/marketing-menu';
import { getTaiChinhModuleTitleKeyBySlug, TAI_CHINH_MODULE_SLUGS } from '../lib/tai-chinh-menu';
import { getMuaHangModuleTitleKeyBySlug, MUA_HANG_MODULE_SLUGS } from '../lib/mua-hang-menu';
import { KHO_VAN_MODULE_SLUGS } from '../lib/kho-van-menu';
import { getQuanLyFarmModuleTitleKeyBySlug, QUAN_LY_FARM_MODULE_SLUGS } from '../lib/quan-ly-farm-menu';
import { getDieuHanhModuleTitleKeyBySlug, DIEU_HANH_MODULE_SLUGS } from '../lib/dieu-hanh-menu';

const SUBMENU_PATH = ['hanh-chinh', 'nhan-su', 'marketing', 'tai-chinh', 'mua-hang', 'quan-ly-farm', 'dieu-hanh'] as const;

/** Convert slug (cham-cong) to camelCase (chamCong) for i18n key */
function slugToCamel(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/** Resolve module display title from submenu path and module slug */
function getModuleTitle(
  submenu: string,
  moduleSlug: string,
  t: (key: string) => string
): string {
  const decoded = decodeURIComponent(moduleSlug);
  if (submenu === 'hanh-chinh' && HANH_CHINH_MODULE_SLUGS.includes(decoded)) {
    return t(getModuleTitleKeyBySlug(decoded));
  }
  if (submenu === 'nhan-su' && NHAN_SU_MODULE_SLUGS.includes(decoded)) {
    return t(getNhanSuModuleTitleKeyBySlug(decoded));
  }
  if (submenu === 'marketing' && MARKETING_MODULE_SLUGS.includes(decoded)) {
    return t(getMarketingModuleTitleKeyBySlug(decoded));
  }
  if (submenu === 'tai-chinh' && TAI_CHINH_MODULE_SLUGS.includes(decoded)) {
    return t(getTaiChinhModuleTitleKeyBySlug(decoded));
  }
  if (submenu === 'mua-hang' && MUA_HANG_MODULE_SLUGS.includes(decoded)) {
    return t(getMuaHangModuleTitleKeyBySlug(decoded));
  }
  if (submenu === 'quan-ly-farm' && QUAN_LY_FARM_MODULE_SLUGS.includes(decoded)) {
    return t(getQuanLyFarmModuleTitleKeyBySlug(decoded));
  }
  if (submenu === 'dieu-hanh' && DIEU_HANH_MODULE_SLUGS.includes(decoded)) {
    return t(getDieuHanhModuleTitleKeyBySlug(decoded));
  }
  return decoded;
}

const SECTION_KEYS = [
  'overview',
  'permissions',
  'workflow',
  'quickStart',
  'glossary',
  'faq',
  'contact',
] as const;

/** Hook: which section id is in view (for TOC highlight) */
function useActiveSection(sectionIds: readonly string[]) {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length > 0) {
          const last = intersecting[intersecting.length - 1];
          setActiveId(last.target.id);
        }
      },
      { rootMargin: '-80px 0px -55% 0px', threshold: 0 }
    );
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const observer = observerRef.current;
    if (!observer) return;
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.unobserve(el);
    });
  }, [sectionIds]);

  return activeId;
}

const ModuleGuidePage: React.FC = () => {
  const { t } = useTranslation();
  const { moduleId } = useParams<{ moduleId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const segments = pathname.split('/').filter(Boolean);
  const isGuidePath = segments[segments.length - 1] === 'huong-dan' && segments.length >= 3;
  const submenu = isGuidePath ? segments[0] : '';
  const moduleSlug = moduleId ?? '';

  const moduleTitle = getModuleTitle(submenu, moduleSlug, t);

  const decodedSlug = decodeURIComponent(moduleSlug || '');
  const moduleKey =
    submenu && moduleSlug
      ? submenu === 'mua-hang' && KHO_VAN_MODULE_SLUGS.includes(decodedSlug)
        ? `khoVan_${slugToCamel(decodedSlug)}`
        : `${slugToCamel(submenu)}_${slugToCamel(decodedSlug)}`
      : '';

  const getSectionContent = (section: (typeof SECTION_KEYS)[number]): string => {
    const key = `guide.modules.${moduleKey}.${section}`;
    const value = t(key);
    if (value === key) return t('guide.fallback');
    return value;
  };

  const getIntro = (): string => {
    const key = `guide.modules.${moduleKey}.intro`;
    const value = t(key);
    return value === key ? '' : value;
  };

  const sectionTitleKeys: Record<(typeof SECTION_KEYS)[number], string> = {
    overview: 'guide.sectionOverview',
    permissions: 'guide.sectionPermissions',
    workflow: 'guide.sectionWorkflow',
    quickStart: 'guide.sectionQuickStart',
    glossary: 'guide.sectionGlossary',
    faq: 'guide.sectionFaq',
    contact: 'guide.sectionContact',
  };

  const sectionIcons: Record<(typeof SECTION_KEYS)[number], React.ReactNode> = {
    overview: <BookOpen size={14} className="shrink-0 text-primary" aria-hidden />,
    permissions: <Shield size={14} className="shrink-0 text-primary" aria-hidden />,
    workflow: <GitBranch size={14} className="shrink-0 text-primary" aria-hidden />,
    quickStart: <Zap size={14} className="shrink-0 text-primary" aria-hidden />,
    glossary: <BookMarked size={14} className="shrink-0 text-primary" aria-hidden />,
    faq: <HelpCircle size={14} className="shrink-0 text-primary" aria-hidden />,
    contact: <Mail size={14} className="shrink-0 text-primary" aria-hidden />,
  };

  const activeSection = useActiveSection(SECTION_KEYS as unknown as string[]);

  if (!moduleId || !SUBMENU_PATH.includes(submenu as (typeof SUBMENU_PATH)[number])) {
    return (
      <div className="min-h-[calc(100vh-100px)] flex flex-col pb-10 pt-2">
        <div className="sticky top-0 z-30 -mx-1.5 -mt-2 md:-mx-2 md:-mt-2 mb-4 shrink-0 bg-card">
          <DashboardToolbar onBack={() => navigate('/')} />
        </div>
        <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          <p className="text-sm text-muted-foreground">{t('guide.fallback')}</p>
        </div>
      </div>
    );
  }

  const intro = getIntro();

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col pb-10 pt-2">
      <div className="sticky top-0 z-30 -mx-1.5 -mt-2 md:-mx-2 md:-mt-2 mb-4 shrink-0 bg-card">
        <DashboardToolbar
          onBack={() => navigate(-1)}
          leadingContent={
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen size={16} className="shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex items-baseline gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {t('guide.breadcrumbLabel')}
                </span>
                <span className="text-muted-foreground/50" aria-hidden>·</span>
                <span className="text-sm font-semibold text-foreground truncate" title={moduleTitle}>
                  {moduleTitle}
                </span>
              </div>
            </div>
          }
        />
      </div>

      <div className="flex-1 flex flex-col md:flex-row md:gap-8 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        {/* TOC – desktop only */}
        <aside
          className="hidden md:block w-52 shrink-0"
          aria-label={t('guide.breadcrumbLabel')}
        >
          <div className="sticky top-24 pt-1 border-l border-border pl-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
              <List size={12} aria-hidden />
              {t('guide.tocTitle')}
            </p>
            <nav className="flex flex-col gap-0.5">
              {SECTION_KEYS.map((section, index) => {
                const label = t(sectionTitleKeys[section]);
                const isActive = activeSection === section;
                const handleTocClick = () => {
                  const el = document.getElementById(section);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    window.history.replaceState(null, '', `${pathname}#${section}`);
                  }
                };
                return (
                  <button
                    key={section}
                    type="button"
                    onClick={handleTocClick}
                    className={cn(
                      'w-full text-left text-xs py-1.5 pr-2 rounded-r-md -ml-4 pl-4 transition-colors line-clamp-2 cursor-pointer border-none bg-transparent',
                      isActive
                        ? 'font-semibold text-primary bg-primary/10 border-l-2 border-primary -ml-[17px] pl-[17px]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <span className="text-muted-foreground/80 tabular-nums">{index + 1}.</span>{' '}
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content + document spine */}
        <div className="flex-1 min-w-0 border-l border-primary/20 pl-0 md:pl-6 xl:max-w-4xl">
          {/* Hero / intro */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-1">{moduleTitle}</h2>
            {intro && (
              <p className="text-sm text-muted-foreground leading-relaxed">{intro}</p>
            )}
          </div>

          <div className="space-y-6 md:space-y-8">
            {SECTION_KEYS.map((section, index) => {
              const title = t(sectionTitleKeys[section]);
              const numberedTitle = `${index + 1}. ${title}`;
              const isOverview = section === 'overview';
              return (
                <Section
                  key={section}
                  id={section}
                  title={numberedTitle}
                  icon={sectionIcons[section]}
                  className={isOverview ? 'border-l-4 border-primary bg-muted/10' : undefined}
                >
                  <div className="text-sm md:text-base text-foreground whitespace-pre-line leading-relaxed">
                    {getSectionContent(section)}
                  </div>
                </Section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleGuidePage;
