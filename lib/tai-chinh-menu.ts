import type { LucideIcon } from 'lucide-react';
import {
  Send,
  Calendar,
  List,
  Wallet,
  ArrowRightLeft,
  BarChart3,
} from 'lucide-react';
import type { ModuleItem } from '../components/dashboard/SubModuleCard';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';

const BASE_PATH = '/tai-chinh';

function slugToTitleKey(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/** Dùng khi có slug (vd. breadcrumb). */
export function getTaiChinhModuleTitleKeyBySlug(slug: string): string {
  const key = slugToTitleKey(slug);
  return `page.taiChinh.modules.${key}`;
}

/** Danh sách slug module Tài chính. */
export const TAI_CHINH_MODULE_SLUGS: string[] = [
  'de-xuat-chi-phi',
  'ke-hoach-chi-phi',
  'danh-muc-tai-chinh',
  'tai-khoan',
  'thu-chi',
  'bao-cao-tai-chinh',
];

export interface TaiChinhModuleConfig {
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
}

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
 * - Quản lý chi phí: Đề xuất chi phí, Kế hoạch chi phí
 * - Quản lý tài chính: Danh mục tài chính, Tài khoản, Thu chi, Báo cáo tài chính
 */
export function getTaiChinhGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const item = (c: TaiChinhModuleConfig) => buildItem(c, t, navigate);

  return [
    {
      groupTitle: t('page.taiChinh.groupQuanLyChiPhi'),
      items: [
        item({
          slug: 'de-xuat-chi-phi',
          titleKey: 'page.taiChinh.modules.deXuatChiPhi',
          descKey: 'page.taiChinh.descs.deXuatChiPhi',
          icon: Send,
          color: 'bg-teal-500',
        }),
        item({
          slug: 'ke-hoach-chi-phi',
          titleKey: 'page.taiChinh.modules.keHoachChiPhi',
          descKey: 'page.taiChinh.descs.keHoachChiPhi',
          icon: Calendar,
          color: 'bg-blue-500',
        }),
      ],
    },
    {
      groupTitle: t('page.taiChinh.groupQuanLyTaiChinh'),
      items: [
        item({
          slug: 'danh-muc-tai-chinh',
          titleKey: 'page.taiChinh.modules.danhMucTaiChinh',
          descKey: 'page.taiChinh.descs.danhMucTaiChinh',
          icon: List,
          color: 'bg-indigo-500',
        }),
        item({
          slug: 'tai-khoan',
          titleKey: 'page.taiChinh.modules.taiKhoan',
          descKey: 'page.taiChinh.descs.taiKhoan',
          icon: Wallet,
          color: 'bg-violet-500',
        }),
        item({
          slug: 'thu-chi',
          titleKey: 'page.taiChinh.modules.thuChi',
          descKey: 'page.taiChinh.descs.thuChi',
          icon: ArrowRightLeft,
          color: 'bg-emerald-500',
        }),
        item({
          slug: 'bao-cao-tai-chinh',
          titleKey: 'page.taiChinh.modules.baoCaoTaiChinh',
          descKey: 'page.taiChinh.descs.baoCaoTaiChinh',
          icon: BarChart3,
          color: 'bg-cyan-500',
        }),
      ],
    },
  ];
}
