import type { LucideIcon } from 'lucide-react';
import {
  Home as HomeIcon,
  Copyright,
  FileText,
  ShoppingCart,
  Sprout,
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
  // Ẩn: Nhân sự, Kinh doanh, Marketing, Tài chính, Điều hành
  // { path: '/nhan-su', nameKey: 'nav.nhanSu', ... },
  // { path: '/kinh-doanh', nameKey: 'nav.kinhDoanh', ... },
  // { path: '/marketing', nameKey: 'nav.marketing', ... },
  // { path: '/tai-chinh', nameKey: 'nav.taiChinh', ... },
  {
    path: '/mua-hang',
    nameKey: 'nav.muaHang',
    descriptionKey: 'page.home.muaHangDesc',
    icon: ShoppingCart,
    gradient: 'bg-gradient-to-br from-orange-600 to-orange-800',
  },
  {
    path: '/quan-ly-farm',
    nameKey: 'nav.quanLyFarm',
    descriptionKey: 'page.home.quanLyFarmDesc',
    icon: Sprout,
    gradient: 'bg-gradient-to-br from-emerald-600 to-emerald-900',
  },
  // Kho vận đã chuyển vào submenu Mua hàng
  // Ẩn: Điều hành
  // { path: '/dieu-hanh', nameKey: 'nav.dieuHanh', ... },
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

/** Các path là submenu (trang danh sách chức năng). Ẩn: tai-chinh. Kho vận đã gộp vào Mua hàng. */
export const SUBMENU_PATHS = [
  '/hanh-chinh',
  '/mua-hang',
  '/quan-ly-farm',
];

export function isSubmenuPath(path: string): boolean {
  return SUBMENU_PATHS.includes(path);
}
