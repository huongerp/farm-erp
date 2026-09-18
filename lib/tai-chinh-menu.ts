import type { LucideIcon } from 'lucide-react';
import { Wallet, BarChart3, Settings } from 'lucide-react';
import type { ModuleItem } from '../components/dashboard/SubModuleCard';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';

const BASE_PATH = '/tai-chinh';

export interface TaiChinhModuleConfig {
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
}

function slugToTitleKey(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function getTaiChinhModuleTitleKeyBySlug(slug: string): string {
  const key = slugToTitleKey(slug);
  return `page.taiChinh.modules.${key}`;
}

/** Slug module Tài chính (dashboard, breadcrumb, route submenu). */
export const TAI_CHINH_MODULE_SLUGS: string[] = [
  'thu-chi-quy',
  'thong-ke-quy',
  'thiet-lap-quy',
];

function buildItem(
  config: TaiChinhModuleConfig,
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleItem {
  return {
    title: t(config.titleKey),
    description: t(config.descKey),
    icon: config.icon,
    color: config.color,
    action: () => navigate(`${BASE_PATH}/${config.slug}`),
    moduleId: `${BASE_PATH}/${config.slug}`,
  };
}

/**
 * Nhóm và module cho submenu Tài chính.
 * Hiện có nhóm "Quỹ farm": sổ quỹ tiền mặt theo chi nhánh + thống kê + thiết lập.
 */
export function getTaiChinhGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const item = (c: TaiChinhModuleConfig) => buildItem(c, t, navigate);

  return [
    {
      groupTitle: t('page.taiChinh.groupQuyFarm'),
      items: [
        item({
          slug: 'thu-chi-quy',
          titleKey: 'page.taiChinh.modules.thuChiQuy',
          descKey: 'page.taiChinh.descs.thuChiQuy',
          icon: Wallet,
          color: 'bg-rose-600',
        }),
        item({
          slug: 'thong-ke-quy',
          titleKey: 'page.taiChinh.modules.thongKeQuy',
          descKey: 'page.taiChinh.descs.thongKeQuy',
          icon: BarChart3,
          color: 'bg-indigo-600',
        }),
        item({
          slug: 'thiet-lap-quy',
          titleKey: 'page.taiChinh.modules.thietLapQuy',
          descKey: 'page.taiChinh.descs.thietLapQuy',
          icon: Settings,
          color: 'bg-slate-500',
        }),
      ],
    },
  ];
}
