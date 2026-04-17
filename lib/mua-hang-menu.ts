import type { LucideIcon } from 'lucide-react';
import {
  ShoppingCart,
  CreditCard,
  BarChart3,
  Settings,
  ClipboardList,
  FileText,
} from 'lucide-react';
import type { ModuleItem } from '../components/dashboard/SubModuleCard';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';
import { getKhoVanGroups, getKhoVanModuleTitleKeyBySlug, KHO_VAN_MODULE_SLUGS } from './kho-van-menu';

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
  if (KHO_VAN_MODULE_SLUGS.includes(slug)) {
    return getKhoVanModuleTitleKeyBySlug(slug);
  }
  const key = slugToTitleKey(slug);
  return `page.muaHang.modules.${key}`;
}

/** Slug thuộc Mua hàng (không trùng với module quản lý kho chuyển sang) */
const MUA_HANG_ONLY_SLUGS: string[] = [
  'phieu-de-xuat-vat-tu',
  'don-dat-hang',
  'thanh-toan-doi-tac',
  'quan-ly-hop-dong',
  'bao-cao-de-xuat-vat-tu',
  'thiet-lap-de-xuat-vat-tu',
];

/** Tất cả slug module Mua hàng (gồm cả module quản lý kho chuyển sang) */
export const MUA_HANG_MODULE_SLUGS: string[] = [
  ...MUA_HANG_ONLY_SLUGS,
  ...KHO_VAN_MODULE_SLUGS.filter((s) => !MUA_HANG_ONLY_SLUGS.includes(s)),
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
 * Cấu hình nhóm và module cho submenu Mua hàng (gồm Đề xuất vật tư + toàn bộ module quản lý kho).
 */
export function getMuaHangGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const item = (c: MuaHangModuleConfig) => buildItem(c, t, navigate);

  const deXuatGroups: ModuleGroup[] = [
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
          slug: 'thanh-toan-doi-tac',
          titleKey: 'page.muaHang.modules.thanhToanDoiTac',
          descKey: 'page.muaHang.descs.thanhToanDoiTac',
          icon: CreditCard,
          color: 'bg-emerald-500',
        }),
        item({
          slug: 'quan-ly-hop-dong',
          titleKey: 'page.muaHang.modules.quanLyHopDong',
          descKey: 'page.muaHang.descs.quanLyHopDong',
          icon: FileText,
          color: 'bg-amber-600',
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

  const khoVanGroups = getKhoVanGroups(t, navigate, BASE_PATH);
  return [...deXuatGroups, ...khoVanGroups];
}
