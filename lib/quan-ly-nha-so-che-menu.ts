import type { LucideIcon } from 'lucide-react';
import { Sprout, PackagePlus, Package, BookOpen, Users, Layers, Boxes, BarChart3, ClipboardList, Settings } from 'lucide-react';
import type { ModuleItem } from '../components/dashboard/SubModuleCard';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';

const BASE_PATH = '/quan-ly-nha-so-che';

export interface QuanLyNhaSoCheModuleConfig {
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
}

function slugToTitleKey(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function getQuanLyNhaSoCheModuleTitleKeyBySlug(slug: string): string {
  const key = slugToTitleKey(slug);
  return `page.quanLyNhaSoChe.modules.${key}`;
}

/** Slug module Quản lý nhà sơ chế (dashboard, breadcrumb, hướng dẫn). Kho phân thuốc dùng slug riêng để không trùng kho vận /mua-hang. */
export const QUAN_LY_NHA_SO_CHE_MODULE_SLUGS: string[] = [
  'thu-hoach',
  'bao-cao-nhan-cong',
  'bao-cao-so-che',
  'du-bao-sl-dong-thung',
  'thong-ke-san-xuat',
  'de-xuat-mua-hang',
  'phieu-kho-phan-thuoc',
  'ton-kho-phan-thuoc',
  'hang-hoa-phan-thuoc',
  'thiet-lap-de-xuat-mua-hang',
];

function buildItem(
  config: QuanLyNhaSoCheModuleConfig,
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
 * Nhóm và module cho submenu Quản lý nhà sơ chế.
 */
export function getQuanLyNhaSoCheGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const item = (c: QuanLyNhaSoCheModuleConfig) => buildItem(c, t, navigate);

  return [
    {
      groupTitle: t('page.quanLyNhaSoChe.groupKeHoach'),
      items: [
        item({
          slug: 'thu-hoach',
          titleKey: 'page.quanLyNhaSoChe.modules.thuHoach',
          descKey: 'page.quanLyNhaSoChe.descs.thuHoach',
          icon: Sprout,
          color: 'bg-emerald-500',
        }),
        item({
          slug: 'bao-cao-nhan-cong',
          titleKey: 'page.quanLyNhaSoChe.modules.baoCaoNhanCong',
          descKey: 'page.quanLyNhaSoChe.descs.baoCaoNhanCong',
          icon: Users,
          color: 'bg-cyan-600',
        }),
        item({
          slug: 'bao-cao-so-che',
          titleKey: 'page.quanLyNhaSoChe.modules.baoCaoSoChe',
          descKey: 'page.quanLyNhaSoChe.descs.baoCaoSoChe',
          icon: Layers,
          color: 'bg-sky-600',
        }),
        item({
          slug: 'du-bao-sl-dong-thung',
          titleKey: 'page.quanLyNhaSoChe.modules.duBaoSlDongThung',
          descKey: 'page.quanLyNhaSoChe.descs.duBaoSlDongThung',
          icon: Boxes,
          color: 'bg-violet-600',
        }),
        item({
          slug: 'thong-ke-san-xuat',
          titleKey: 'page.quanLyNhaSoChe.modules.thongKeSanXuat',
          descKey: 'page.quanLyNhaSoChe.descs.thongKeSanXuat',
          icon: BarChart3,
          color: 'bg-indigo-600',
        }),
      ],
    },
    {
      groupTitle: t('page.quanLyNhaSoChe.groupKhoPhanThuoc'),
      items: [
        item({
          slug: 'de-xuat-mua-hang',
          titleKey: 'page.quanLyNhaSoChe.modules.deXuatMuaHang',
          descKey: 'page.quanLyNhaSoChe.descs.deXuatMuaHang',
          icon: ClipboardList,
          color: 'bg-orange-500',
        }),
        item({
          slug: 'phieu-kho-phan-thuoc',
          titleKey: 'page.quanLyNhaSoChe.modules.phieuKhoPhanThuoc',
          descKey: 'page.quanLyNhaSoChe.descs.phieuKhoPhanThuoc',
          icon: PackagePlus,
          color: 'bg-lime-600',
        }),
        item({
          slug: 'ton-kho-phan-thuoc',
          titleKey: 'page.quanLyNhaSoChe.modules.tonKhoPhanThuoc',
          descKey: 'page.quanLyNhaSoChe.descs.tonKhoPhanThuoc',
          icon: Package,
          color: 'bg-teal-600',
        }),
        item({
          slug: 'hang-hoa-phan-thuoc',
          titleKey: 'page.quanLyNhaSoChe.modules.hangHoaPhanThuoc',
          descKey: 'page.quanLyNhaSoChe.descs.hangHoaPhanThuoc',
          icon: BookOpen,
          color: 'bg-amber-600',
        }),
        item({
          slug: 'thiet-lap-de-xuat-mua-hang',
          titleKey: 'page.quanLyNhaSoChe.modules.thietLapDeXuatMuaHang',
          descKey: 'page.quanLyNhaSoChe.descs.thietLapDeXuatMuaHang',
          icon: Settings,
          color: 'bg-slate-500',
        }),
      ],
    },
  ];
}
