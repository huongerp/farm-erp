import type { LucideIcon } from 'lucide-react';
import {
  ShoppingCart,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  ClipboardList,
} from 'lucide-react';
import type { ModuleItem } from '../components/dashboard/SubModuleCard';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';

const BASE_PATH = '/mua-hang';

export interface MuaHangModuleConfig {
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
}

function slugToTitleKey(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function getMuaHangModuleTitleKeyBySlug(slug: string): string {
  const key = slugToTitleKey(slug);
  return `page.muaHang.modules.${key}`;
}

export const MUA_HANG_MODULE_SLUGS: string[] = [
  'phieu-de-xuat-vat-tu',
  'don-dat-hang',
  'danh-sach-doi-tac',
  'thanh-toan-doi-tac',
  'bao-cao-de-xuat-vat-tu',
  'thiet-lap-de-xuat-vat-tu',
];

function buildItem(
  config: MuaHangModuleConfig,
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
 * Cấu hình nhóm và module cho submenu Mua hàng – nhóm Đề xuất vật tư.
 */
export function getMuaHangGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const item = (c: MuaHangModuleConfig) => buildItem(c, t, navigate);

  return [
    {
      groupTitle: t('page.muaHang.groupDeXuatVatTu'),
      items: [
        item({
          slug: 'phieu-de-xuat-vat-tu',
          titleKey: 'page.muaHang.modules.phieuDeXuatVatTu',
          descKey: 'page.muaHang.descs.phieuDeXuatVatTu',
          icon: ClipboardList,
          color: 'bg-orange-500',
        }),
        item({
          slug: 'don-dat-hang',
          titleKey: 'page.muaHang.modules.donDatHang',
          descKey: 'page.muaHang.descs.donDatHang',
          icon: ShoppingCart,
          color: 'bg-blue-500',
        }),
        item({
          slug: 'danh-sach-doi-tac',
          titleKey: 'page.muaHang.modules.danhSachDoiTac',
          descKey: 'page.muaHang.descs.danhSachDoiTac',
          icon: Users,
          color: 'bg-indigo-500',
        }),
        item({
          slug: 'thanh-toan-doi-tac',
          titleKey: 'page.muaHang.modules.thanhToanDoiTac',
          descKey: 'page.muaHang.descs.thanhToanDoiTac',
          icon: CreditCard,
          color: 'bg-emerald-500',
        }),
        item({
          slug: 'bao-cao-de-xuat-vat-tu',
          titleKey: 'page.muaHang.modules.baoCaoDeXuatVatTu',
          descKey: 'page.muaHang.descs.baoCaoDeXuatVatTu',
          icon: BarChart3,
          color: 'bg-violet-500',
        }),
        item({
          slug: 'thiet-lap-de-xuat-vat-tu',
          titleKey: 'page.muaHang.modules.thietLapDeXuatVatTu',
          descKey: 'page.muaHang.descs.thietLapDeXuatVatTu',
          icon: Settings,
          color: 'bg-slate-500',
        }),
      ],
    },
  ];
}
