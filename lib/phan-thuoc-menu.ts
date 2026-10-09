import type { LucideIcon } from 'lucide-react';
import { PackagePlus, Package, BookOpen, ClipboardList, ClipboardCheck, Settings } from 'lucide-react';
import type { ModuleItem } from '../components/dashboard/SubModuleCard';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';
import { KHO_MODULE_SLUGS, type KhoModuleSlug } from '../features/quan-ly-nha-so-che/kho-bien-the/bien-the';

/**
 * Submenu Phân thuốc: cùng bộ module kho với Nhà sơ chế (features/quan-ly-nha-so-che/*-phan-thuoc,
 * de-xuat-mua-hang…) nhưng chạy biến thể `phan-thuoc` — bảng `fp_pt_*` riêng (migration 029).
 */
const BASE_PATH = '/phan-thuoc';

export const PHAN_THUOC_MODULE_SLUGS: string[] = [...KHO_MODULE_SLUGS];

interface PhanThuocModuleConfig {
  slug: KhoModuleSlug;
  icon: LucideIcon;
  color: string;
}

function slugToKey(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function getPhanThuocModuleTitleKeyBySlug(slug: string): string {
  return `page.phanThuoc.modules.${slugToKey(slug)}`;
}

function buildItem(
  config: PhanThuocModuleConfig,
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleItem {
  return {
    title: t(getPhanThuocModuleTitleKeyBySlug(config.slug)),
    description: t(`page.phanThuoc.descs.${slugToKey(config.slug)}`),
    icon: config.icon,
    color: config.color,
    action: () => navigate(`${BASE_PATH}/${config.slug}`),
    moduleId: `${BASE_PATH}/${config.slug}`,
  };
}

/** Nhóm và module cho submenu Phân thuốc (khớp nhóm ở màn Phân quyền). */
export function getPhanThuocGroups(t: (key: string) => string, navigate: (path: string) => void): ModuleGroup[] {
  const item = (c: PhanThuocModuleConfig) => buildItem(c, t, navigate);

  return [
    {
      groupTitle: t('page.phanThuoc.groupNhapXuat'),
      items: [
        item({ slug: 'de-xuat-mua-hang', icon: ClipboardList, color: 'bg-orange-500' }),
        item({ slug: 'phieu-kho-phan-thuoc', icon: PackagePlus, color: 'bg-lime-600' }),
        item({ slug: 'kiem-ke-kho-phan-thuoc', icon: ClipboardCheck, color: 'bg-rose-600' }),
      ],
    },
    {
      groupTitle: t('page.phanThuoc.groupBaoCao'),
      items: [item({ slug: 'ton-kho-phan-thuoc', icon: Package, color: 'bg-teal-600' })],
    },
    {
      groupTitle: t('page.phanThuoc.groupDanhMuc'),
      items: [
        item({ slug: 'hang-hoa-phan-thuoc', icon: BookOpen, color: 'bg-amber-600' }),
        item({ slug: 'thiet-lap-de-xuat-mua-hang', icon: Settings, color: 'bg-slate-500' }),
      ],
    },
  ];
}
