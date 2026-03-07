import type { LucideIcon } from 'lucide-react';
import { Compass, TrendingUp, Grid2X2, PieChart, Target, Zap, BarChart3, ClipboardCheck } from 'lucide-react';
import type { ModuleItem } from '../components/dashboard/SubModuleCard';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';

const BASE_PATH = '/dieu-hanh';

export interface DieuHanhModuleConfig {
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
}

/** Danh sách slug module Điều hành (breadcrumb, SubmenuPage). */
export const DIEU_HANH_MODULE_SLUGS: string[] = [
  'su-menh-tam-nhin',
  'tam-nhin-quy-mo-thi-phan',
  'phan-tich-doi-thu',
  'phan-tich-swot',
  'chien-luoc',
  'hanh-dong-cot-loi',
  'tieu-chi-kpi',
  'theo-doi-danh-gia',
];

function slugToTitleKey(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function getDieuHanhModuleTitleKeyBySlug(slug: string): string {
  const key = slugToTitleKey(slug);
  return `page.dieuHanh.modules.${key}`;
}

function buildItem(
  config: DieuHanhModuleConfig,
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
 * Nhóm và module cho submenu Điều hành (Ban Giám đốc).
 * Chỉ giữ nhóm Định hướng & Phân tích.
 */
export function getDieuHanhGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const item = (c: DieuHanhModuleConfig) => buildItem(c, t, navigate);

  return [
    {
      groupTitle: t('page.dieuHanh.groupDinhHuongPhanTich'),
      items: [
        item({
          slug: 'su-menh-tam-nhin',
          titleKey: 'page.dieuHanh.modules.suMenhTamNhin',
          descKey: 'page.dieuHanh.descs.suMenhTamNhin',
          icon: Compass,
          color: 'bg-amber-500',
        }),
        item({
          slug: 'tam-nhin-quy-mo-thi-phan',
          titleKey: 'page.dieuHanh.modules.tamNhinQuyMoThiPhan',
          descKey: 'page.dieuHanh.descs.tamNhinQuyMoThiPhan',
          icon: PieChart,
          color: 'bg-teal-500',
        }),
        item({
          slug: 'phan-tich-doi-thu',
          titleKey: 'page.dieuHanh.modules.phanTichDoiThu',
          descKey: 'page.dieuHanh.descs.phanTichDoiThu',
          icon: TrendingUp,
          color: 'bg-emerald-500',
        }),
        item({
          slug: 'phan-tich-swot',
          titleKey: 'page.dieuHanh.modules.phanTichSwot',
          descKey: 'page.dieuHanh.descs.phanTichSwot',
          icon: Grid2X2,
          color: 'bg-fuchsia-500',
        }),
      ],
    },
    {
      groupTitle: t('page.dieuHanh.groupChienLuocVaKpi'),
      items: [
        item({
          slug: 'chien-luoc',
          titleKey: 'page.dieuHanh.modules.chienLuoc',
          descKey: 'page.dieuHanh.descs.chienLuoc',
          icon: Target,
          color: 'bg-indigo-500',
        }),
        item({
          slug: 'hanh-dong-cot-loi',
          titleKey: 'page.dieuHanh.modules.hanhDongCotLoi',
          descKey: 'page.dieuHanh.descs.hanhDongCotLoi',
          icon: Zap,
          color: 'bg-amber-500',
        }),
        item({
          slug: 'tieu-chi-kpi',
          titleKey: 'page.dieuHanh.modules.tieuChiKpi',
          descKey: 'page.dieuHanh.descs.tieuChiKpi',
          icon: BarChart3,
          color: 'bg-sky-500',
        }),
        item({
          slug: 'theo-doi-danh-gia',
          titleKey: 'page.dieuHanh.modules.theoDoiDanhGia',
          descKey: 'page.dieuHanh.descs.theoDoiDanhGia',
          icon: ClipboardCheck,
          color: 'bg-emerald-500',
        }),
      ],
    },
  ];
}
