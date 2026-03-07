import type { LucideIcon } from 'lucide-react';
import {
  Home as HomeIcon,
  Copyright,
  FileText,
  Users,
  Briefcase,
  Megaphone,
  Wallet,
  ShoppingCart,
  Package,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface MenuItem {
  path: string;
  nameKey: string;
  descriptionKey?: string;
  icon: LucideIcon;
  gradient: string;
}

/** Cấu hình menu sidebar và thẻ trên Trang chủ (Trang chủ, Hành chính, Nhân sự, ..., Hệ thống, Trợ lý AI) */
export const SIDEBAR_MENU: MenuItem[] = [
  {
    path: '/',
    nameKey: 'nav.home',
    descriptionKey: 'page.home.systemModuleDesc',
    icon: HomeIcon,
    gradient: 'bg-gradient-to-br from-primary/90 to-primary',
  },
  {
    path: '/hanh-chinh',
    nameKey: 'nav.hanhChinh',
    descriptionKey: 'page.home.hanhChinhDesc',
    icon: FileText,
    gradient: 'bg-gradient-to-br from-amber-600 to-amber-800',
  },
  {
    path: '/nhan-su',
    nameKey: 'nav.nhanSu',
    descriptionKey: 'page.home.nhanSuDesc',
    icon: Users,
    gradient: 'bg-gradient-to-br from-emerald-600 to-emerald-800',
  },
  {
    path: '/kinh-doanh',
    nameKey: 'nav.kinhDoanh',
    descriptionKey: 'page.home.kinhDoanhDesc',
    icon: Briefcase,
    gradient: 'bg-gradient-to-br from-blue-600 to-blue-800',
  },
  {
    path: '/marketing',
    nameKey: 'nav.marketing',
    descriptionKey: 'page.home.marketingDesc',
    icon: Megaphone,
    gradient: 'bg-gradient-to-br from-pink-600 to-rose-800',
  },
  {
    path: '/tai-chinh',
    nameKey: 'nav.taiChinh',
    descriptionKey: 'page.home.taiChinhDesc',
    icon: Wallet,
    gradient: 'bg-gradient-to-br from-violet-600 to-violet-800',
  },
  {
    path: '/mua-hang',
    nameKey: 'nav.muaHang',
    descriptionKey: 'page.home.muaHangDesc',
    icon: ShoppingCart,
    gradient: 'bg-gradient-to-br from-orange-600 to-orange-800',
  },
  {
    path: '/kho-van',
    nameKey: 'nav.khoVan',
    descriptionKey: 'page.home.khoVanDesc',
    icon: Package,
    gradient: 'bg-gradient-to-br from-cyan-600 to-cyan-800',
  },
  {
    path: '/dieu-hanh',
    nameKey: 'nav.dieuHanh',
    descriptionKey: 'page.home.dieuHanhDesc',
    icon: Activity,
    gradient: 'bg-gradient-to-br from-teal-600 to-teal-800',
  },
  {
    path: '/he-thong',
    nameKey: 'nav.system',
    descriptionKey: 'page.home.systemModuleDesc',
    icon: Layers,
    gradient: 'bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700',
  },
  {
    path: '/tro-ly-ai',
    nameKey: 'nav.aiAssistant',
    descriptionKey: 'page.home.systemModuleDesc',
    icon: Sparkles,
    gradient: 'bg-gradient-to-br from-indigo-600 to-indigo-800',
  },
  {
    path: '/thong-tin-ban-quyen',
    nameKey: 'nav.licenseInfo',
    descriptionKey: 'page.home.licenseInfoDesc',
    icon: Copyright,
    gradient: 'bg-gradient-to-br from-blue-600 to-blue-800',
  },
];

/** Các path là submenu (trang danh sách chức năng), không phải trang chủ hay trang đặc biệt */
export const SUBMENU_PATHS = [
  '/hanh-chinh',
  '/nhan-su',
  '/kinh-doanh',
  '/marketing',
  '/tai-chinh',
  '/mua-hang',
  '/kho-van',
  '/dieu-hanh',
];

export function isSubmenuPath(path: string): boolean {
  return SUBMENU_PATHS.includes(path);
}
