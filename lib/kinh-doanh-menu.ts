import type { LucideIcon } from 'lucide-react';
import {
  Users,
  Settings,
  MapPin,
  CalendarCheck,
  Target,
  ShoppingCart,
  CircleDollarSign,
  FileText,
  FileSignature,
  Wallet,
  Receipt,
  BarChart3,
  PieChart,
} from 'lucide-react';
import type { ModuleItem } from '../components/dashboard/SubModuleCard';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';

const BASE_PATH = '/kinh-doanh';

export interface KinDoanhModuleConfig {
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
}

function slugToTitleKey(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function getKinhDoanhModuleTitleKeyBySlug(slug: string): string {
  const key = slugToTitleKey(slug);
  return `page.kinhDoanh.modules.${key}`;
}

export const KINH_DOANH_MODULE_SLUGS: string[] = [
  'danh-sach-khach-hang',
  'thiet-lap-crm',
  'ban-do-khach-hang',
  'lich-cham-soc',
  'co-hoi-ban-hang',
  'don-hang-ban',
  'bang-gia',
  'bao-gia',
  'hop-dong-ban',
  'cong-no-khach-hang',
  'phieu-thu',
  'bao-cao-doanh-so',
  'bao-cao-cong-no',
];

function buildItem(
  config: KinDoanhModuleConfig,
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
 * Cấu hình nhóm và module cho submenu Kinh doanh.
 * CRM & Khách hàng, Bán hàng & Đơn hàng, Báo giá & Hợp đồng, Công nợ & Thu tiền, Báo cáo.
 */
export function getKinhDoanhGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const item = (c: KinDoanhModuleConfig) => buildItem(c, t, navigate);

  return [
    {
      groupTitle: t('page.kinhDoanh.groupCrmKhachHang'),
      items: [
        item({
          slug: 'danh-sach-khach-hang',
          titleKey: 'page.kinhDoanh.modules.danhSachKhachHang',
          descKey: 'page.kinhDoanh.descs.danhSachKhachHang',
          icon: Users,
          color: 'bg-blue-500',
        }),
        item({
          slug: 'thiet-lap-crm',
          titleKey: 'page.kinhDoanh.modules.thietLapCrm',
          descKey: 'page.kinhDoanh.descs.thietLapCrm',
          icon: Settings,
          color: 'bg-indigo-500',
        }),
        item({
          slug: 'ban-do-khach-hang',
          titleKey: 'page.kinhDoanh.modules.banDoKhachHang',
          descKey: 'page.kinhDoanh.descs.banDoKhachHang',
          icon: MapPin,
          color: 'bg-emerald-500',
        }),
        item({
          slug: 'lich-cham-soc',
          titleKey: 'page.kinhDoanh.modules.lichChamSoc',
          descKey: 'page.kinhDoanh.descs.lichChamSoc',
          icon: CalendarCheck,
          color: 'bg-teal-500',
        }),
      ],
    },
    {
      groupTitle: t('page.kinhDoanh.groupBanHangDonHang'),
      items: [
        item({
          slug: 'co-hoi-ban-hang',
          titleKey: 'page.kinhDoanh.modules.coHoiBanHang',
          descKey: 'page.kinhDoanh.descs.coHoiBanHang',
          icon: Target,
          color: 'bg-amber-500',
        }),
        item({
          slug: 'don-hang-ban',
          titleKey: 'page.kinhDoanh.modules.donHangBan',
          descKey: 'page.kinhDoanh.descs.donHangBan',
          icon: ShoppingCart,
          color: 'bg-orange-500',
        }),
        item({
          slug: 'bang-gia',
          titleKey: 'page.kinhDoanh.modules.bangGia',
          descKey: 'page.kinhDoanh.descs.bangGia',
          icon: CircleDollarSign,
          color: 'bg-violet-500',
        }),
      ],
    },
    {
      groupTitle: t('page.kinhDoanh.groupBaoGiaHopDong'),
      items: [
        item({
          slug: 'bao-gia',
          titleKey: 'page.kinhDoanh.modules.baoGia',
          descKey: 'page.kinhDoanh.descs.baoGia',
          icon: FileText,
          color: 'bg-pink-500',
        }),
        item({
          slug: 'hop-dong-ban',
          titleKey: 'page.kinhDoanh.modules.hopDongBan',
          descKey: 'page.kinhDoanh.descs.hopDongBan',
          icon: FileSignature,
          color: 'bg-rose-500',
        }),
      ],
    },
    {
      groupTitle: t('page.kinhDoanh.groupCongNoThuTien'),
      items: [
        item({
          slug: 'cong-no-khach-hang',
          titleKey: 'page.kinhDoanh.modules.congNoKhachHang',
          descKey: 'page.kinhDoanh.descs.congNoKhachHang',
          icon: Wallet,
          color: 'bg-slate-500',
        }),
        item({
          slug: 'phieu-thu',
          titleKey: 'page.kinhDoanh.modules.phieuThu',
          descKey: 'page.kinhDoanh.descs.phieuThu',
          icon: Receipt,
          color: 'bg-cyan-500',
        }),
      ],
    },
    {
      groupTitle: t('page.kinhDoanh.groupBaoCao'),
      items: [
        item({
          slug: 'bao-cao-doanh-so',
          titleKey: 'page.kinhDoanh.modules.baoCaoDoanhSo',
          descKey: 'page.kinhDoanh.descs.baoCaoDoanhSo',
          icon: BarChart3,
          color: 'bg-blue-500',
        }),
        item({
          slug: 'bao-cao-cong-no',
          titleKey: 'page.kinhDoanh.modules.baoCaoCongNo',
          descKey: 'page.kinhDoanh.descs.baoCaoCongNo',
          icon: PieChart,
          color: 'bg-violet-500',
        }),
      ],
    },
  ];
}
