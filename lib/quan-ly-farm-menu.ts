import type { LucideIcon } from 'lucide-react';
import { Sprout, PackagePlus, Package, BookOpen } from 'lucide-react';
import type { ModuleItem } from '../components/dashboard/SubModuleCard';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';

const BASE_PATH = '/quan-ly-farm';

export interface QuanLyFarmModuleConfig {
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
}

function slugToTitleKey(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function getQuanLyFarmModuleTitleKeyBySlug(slug: string): string {
  const key = slugToTitleKey(slug);
  return `page.quanLyFarm.modules.${key}`;
}

/** Slug module Quản lý farm (dashboard, breadcrumb, hướng dẫn). Kho phân thuốc dùng slug riêng để không trùng kho vận /mua-hang. */
export const QUAN_LY_FARM_MODULE_SLUGS: string[] = [
  'thu-hoach',
  'phieu-kho-phan-thuoc',
  'ton-kho-phan-thuoc',
  'hang-hoa-phan-thuoc',
];

function buildItem(
  config: QuanLyFarmModuleConfig,
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
 * Nhóm và module cho submenu Quản lý farm.
 */
export function getQuanLyFarmGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const item = (c: QuanLyFarmModuleConfig) => buildItem(c, t, navigate);

  return [
    {
      groupTitle: t('page.quanLyFarm.groupKeHoach'),
      items: [
        item({
          slug: 'thu-hoach',
          titleKey: 'page.quanLyFarm.modules.thuHoach',
          descKey: 'page.quanLyFarm.descs.thuHoach',
          icon: Sprout,
          color: 'bg-emerald-500',
        }),
      ],
    },
    {
      groupTitle: t('page.quanLyFarm.groupKhoPhanThuoc'),
      items: [
        item({
          slug: 'phieu-kho-phan-thuoc',
          titleKey: 'page.quanLyFarm.modules.phieuKhoPhanThuoc',
          descKey: 'page.quanLyFarm.descs.phieuKhoPhanThuoc',
          icon: PackagePlus,
          color: 'bg-lime-600',
        }),
        item({
          slug: 'ton-kho-phan-thuoc',
          titleKey: 'page.quanLyFarm.modules.tonKhoPhanThuoc',
          descKey: 'page.quanLyFarm.descs.tonKhoPhanThuoc',
          icon: Package,
          color: 'bg-teal-600',
        }),
        item({
          slug: 'hang-hoa-phan-thuoc',
          titleKey: 'page.quanLyFarm.modules.hangHoaPhanThuoc',
          descKey: 'page.quanLyFarm.descs.hangHoaPhanThuoc',
          icon: BookOpen,
          color: 'bg-amber-600',
        }),
      ],
    },
  ];
}
