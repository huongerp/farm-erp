import type { LucideIcon } from 'lucide-react';
import {
  PackagePlus,
  ClipboardCheck,
  ClipboardList,
  Package,
  MapPin,
  BarChart3,
  BookOpen,
  List,
  Warehouse,
  Truck,
} from 'lucide-react';
import type { ModuleItem } from '../components/dashboard/SubModuleCard';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';

const BASE_PATH = '/kho-van';

export interface KhoVanModuleConfig {
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
}

function slugToTitleKey(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function getKhoVanModuleTitleKeyBySlug(slug: string): string {
  const key = slugToTitleKey(slug);
  return `page.khoVan.modules.${key}`;
}

export const KHO_VAN_MODULE_SLUGS: string[] = [
  'phieu-kho',
  'phieu-de-xuat-vat-tu',
  'kiem-ke-kho',
  'ton-kho',
  'bao-cao-nhap-xuat-ton',
  'danh-muc-hang-hoa',
  'danh-sach-hang-hoa',
  'danh-sach-kho',
  'danh-sach-doi-tac',
];

function buildItem(
  config: KhoVanModuleConfig,
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
 * Cấu hình nhóm và module cho submenu Kho vận.
 */
export function getKhoVanGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const item = (c: KhoVanModuleConfig) => buildItem(c, t, navigate);

  return [
    {
      groupTitle: t('page.khoVan.groupNhapXuatKho'),
      items: [
        item({
          slug: 'phieu-kho',
          titleKey: 'page.khoVan.modules.phieuKho',
          descKey: 'page.khoVan.descs.phieuKho',
          icon: PackagePlus,
          color: 'bg-emerald-500',
        }),
        item({
          slug: 'phieu-de-xuat-vat-tu',
          titleKey: 'page.khoVan.modules.phieuDeXuatVatTu',
          descKey: 'page.khoVan.descs.phieuDeXuatVatTu',
          icon: ClipboardList,
          color: 'bg-indigo-500',
        }),
        item({
          slug: 'kiem-ke-kho',
          titleKey: 'page.khoVan.modules.kiemKeKho',
          descKey: 'page.khoVan.descs.kiemKeKho',
          icon: ClipboardCheck,
          color: 'bg-teal-500',
        }),
      ],
    },
    {
      groupTitle: t('page.khoVan.groupBaoCao'),
      items: [
        item({
          slug: 'ton-kho',
          titleKey: 'page.khoVan.modules.tonKho',
          descKey: 'page.khoVan.descs.tonKho',
          icon: Package,
          color: 'bg-blue-500',
        }),
        item({
          slug: 'bao-cao-nhap-xuat-ton',
          titleKey: 'page.khoVan.modules.baoCaoNhapXuatTon',
          descKey: 'page.khoVan.descs.baoCaoNhapXuatTon',
          icon: BarChart3,
          color: 'bg-violet-500',
        }),
      ],
    },
    {
      groupTitle: t('page.khoVan.groupThietLapVaDanhMuc'),
      items: [
        item({
          slug: 'danh-muc-hang-hoa',
          titleKey: 'page.khoVan.modules.danhMucHangHoa',
          descKey: 'page.khoVan.descs.danhMucHangHoa',
          icon: BookOpen,
          color: 'bg-amber-500',
        }),
        item({
          slug: 'danh-sach-hang-hoa',
          titleKey: 'page.khoVan.modules.danhSachHangHoa',
          descKey: 'page.khoVan.descs.danhSachHangHoa',
          icon: List,
          color: 'bg-slate-500',
        }),
        item({
          slug: 'danh-sach-kho',
          titleKey: 'page.khoVan.modules.danhSachKho',
          descKey: 'page.khoVan.descs.danhSachKho',
          icon: Warehouse,
          color: 'bg-cyan-500',
        }),
        item({
          slug: 'danh-sach-doi-tac',
          titleKey: 'page.khoVan.modules.danhSachDoiTac',
          descKey: 'page.khoVan.descs.danhSachDoiTac',
          icon: Truck,
          color: 'bg-orange-500',
        }),
      ],
    },
  ];
}
