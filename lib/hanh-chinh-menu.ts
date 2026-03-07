import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  Receipt,
  Calendar,
  Settings,
  FileText,
  Archive,
  ClipboardList,
  ClipboardCheck,
  Car,
  CalendarCheck,
  Fuel,
  UserCircle,
  Target,
  Scale,
  FolderOpen,
  BarChart3,
} from 'lucide-react';
import { danhMucTaiSanMenuConfig } from '@/features/hanh-chinh/danh-muc-tai-san/menu-config';
import { capPhatThuHoiMenuConfig } from '@/features/hanh-chinh/cap-phat-thu-hoi/menu-config';
import { baoTriSuaChuaMenuConfig } from '@/features/hanh-chinh/bao-tri-sua-chua/menu-config';
import { kiemKeTaiSanMenuConfig } from '@/features/hanh-chinh/kiem-ke-tai-san/menu-config';
import { khauHaoTaiSanMenuConfig } from '@/features/hanh-chinh/khau-hao-tai-san/menu-config';
import { noiQuanLyMenuConfig } from '@/features/hanh-chinh/noi-quan-ly/menu-config';
import { thietLapTaiSanMenuConfig } from '@/features/hanh-chinh/thiet-lap-tai-san/menu-config';
import type { ModuleItem } from '../components/dashboard/SubModuleCard';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';

const BASE_PATH = '/hanh-chinh';

export interface HanhChinhModuleConfig {
  /** URL slug (kebab-case), e.g. cham-cong */
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
}

/** Chuyển slug (cham-cong) thành key (chamCong) cho i18n */
export function slugToTitleKey(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/** Lấy tiêu đề module từ slug (dùng cho breadcrumb / placeholder) */
export function getModuleTitleKeyBySlug(slug: string): string {
  const key = slugToTitleKey(slug);
  return `page.hanhChinh.modules.${key}`;
}

/** Danh sách tất cả slug module (để breadcrumb / resolve title) */
export const HANH_CHINH_MODULE_SLUGS: string[] = [
  'cham-cong',
  'tong-hop-cham-cong',
  'phieu-hanh-chinh',
  'cham-diem-kpi',
  'bang-luong',
  'diem-cong-tru',
  'thiet-lap-cong-luong',
  'luu-tru-ho-so',
  'thiet-lap-tai-lieu',
  'danh-sach-tai-lieu',
  'du-an',
  'cong-viec',
  'cong-viec-cua-toi',
  'cong-viec-toi-quan-ly',
  'bao-cao',
  'thiet-lap-cong-viec',
  'danh-sach-tai-san',
  'cap-phat-thu-hoi',
  'bao-tri-sua-chua',
  'kiem-ke-tai-san',
  'khau-hao-tai-san',
  'noi-quan-ly',
  'thiet-lap-tai-san',
  'danh-sach-xe',
  'dang-ky-su-dung-xe',
  'lich-bao-duong',
  'phieu-xang-chi-phi-xe',
  'quan-ly-lai-xe',
  'thiet-lap-quan-ly-xe',
];

function buildItem(config: HanhChinhModuleConfig, t: (key: string) => string, navigate: (path: string) => void): ModuleItem {
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
 * Cấu hình nhóm và module cho submenu Hành chính.
 * Trả về groups dùng cho ModuleDashboardLayout (cần t, navigate).
 */
export function getHanhChinhGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const item = (c: HanhChinhModuleConfig) => buildItem(c, t, navigate);

  return [
    {
      groupTitle: t('page.hanhChinh.groupCongLuong'),
      items: [
        item({ slug: 'cham-cong', titleKey: 'page.hanhChinh.modules.chamCong', descKey: 'page.hanhChinh.descs.chamCong', icon: Calendar, color: 'bg-blue-500' }),
        item({ slug: 'tong-hop-cham-cong', titleKey: 'page.hanhChinh.modules.tongHopChamCong', descKey: 'page.hanhChinh.descs.tongHopChamCong', icon: ClipboardCheck, color: 'bg-amber-500' }),
        item({ slug: 'phieu-hanh-chinh', titleKey: 'page.hanhChinh.modules.phieuHanhChinh', descKey: 'page.hanhChinh.descs.phieuHanhChinh', icon: Receipt, color: 'bg-indigo-500' }),
        item({ slug: 'cham-diem-kpi', titleKey: 'page.hanhChinh.modules.chamDiemKpi', descKey: 'page.hanhChinh.descs.chamDiemKpi', icon: Target, color: 'bg-purple-500' }),
        item({ slug: 'bang-luong', titleKey: 'page.hanhChinh.modules.bangLuong', descKey: 'page.hanhChinh.descs.bangLuong', icon: Banknote, color: 'bg-emerald-500' }),
        item({ slug: 'diem-cong-tru', titleKey: 'page.hanhChinh.modules.diemCongTru', descKey: 'page.hanhChinh.descs.diemCongTru', icon: Scale, color: 'bg-violet-500' }),
        item({ slug: 'thiet-lap-cong-luong', titleKey: 'page.hanhChinh.modules.thietLapCongLuong', descKey: 'page.hanhChinh.descs.thietLapCongLuong', icon: Settings, color: 'bg-slate-500' }),
      ],
    },
    {
      groupTitle: t('page.hanhChinh.groupTaiLieu'),
      items: [
        item({ slug: 'danh-sach-tai-lieu', titleKey: 'page.hanhChinh.modules.danhSachTaiLieu', descKey: 'page.hanhChinh.descs.danhSachTaiLieu', icon: FileText, color: 'bg-blue-500' }),
        item({ slug: 'luu-tru-ho-so', titleKey: 'page.hanhChinh.modules.luuTruHoSo', descKey: 'page.hanhChinh.descs.luuTruHoSo', icon: Archive, color: 'bg-teal-500' }),
        item({ slug: 'thiet-lap-tai-lieu', titleKey: 'page.hanhChinh.modules.thietLapTaiLieu', descKey: 'page.hanhChinh.descs.thietLapTaiLieu', icon: Settings, color: 'bg-slate-500' }),
      ],
    },
    {
      groupTitle: t('page.hanhChinh.groupCongViec'),
      items: [
        item({ slug: 'du-an', titleKey: 'page.hanhChinh.modules.duAn', descKey: 'page.hanhChinh.descs.duAn', icon: FolderOpen, color: 'bg-blue-500' }),
        item({ slug: 'cong-viec-cua-toi', titleKey: 'page.hanhChinh.modules.congViecCuaToi', descKey: 'page.hanhChinh.descs.congViecCuaToi', icon: ClipboardList, color: 'bg-emerald-500' }),
        item({ slug: 'cong-viec-toi-quan-ly', titleKey: 'page.hanhChinh.modules.congViecToiQuanLy', descKey: 'page.hanhChinh.descs.congViecToiQuanLy', icon: ClipboardList, color: 'bg-teal-500' }),
        item({ slug: 'bao-cao', titleKey: 'page.hanhChinh.modules.baoCao', descKey: 'page.hanhChinh.descs.baoCao', icon: BarChart3, color: 'bg-cyan-500' }),
        item({ slug: 'thiet-lap-cong-viec', titleKey: 'page.hanhChinh.modules.thietLapCongViec', descKey: 'page.hanhChinh.descs.thietLapCongViec', icon: Settings, color: 'bg-slate-500' }),
      ],
    },
    {
      groupTitle: t('page.hanhChinh.groupTaiSan'),
      items: [
        item(danhMucTaiSanMenuConfig),
        item(capPhatThuHoiMenuConfig),
        item(baoTriSuaChuaMenuConfig),
        item(kiemKeTaiSanMenuConfig),
        item(khauHaoTaiSanMenuConfig),
        item(noiQuanLyMenuConfig),
        item(thietLapTaiSanMenuConfig),
      ],
    },
    {
      groupTitle: t('page.hanhChinh.groupQuanLyXe'),
      items: [
        item({ slug: 'danh-sach-xe', titleKey: 'page.hanhChinh.modules.danhSachXe', descKey: 'page.hanhChinh.descs.danhSachXe', icon: Car, color: 'bg-blue-500' }),
        item({ slug: 'dang-ky-su-dung-xe', titleKey: 'page.hanhChinh.modules.dangKySuDungXe', descKey: 'page.hanhChinh.descs.dangKySuDungXe', icon: CalendarCheck, color: 'bg-emerald-500' }),
        item({ slug: 'lich-bao-duong', titleKey: 'page.hanhChinh.modules.lichBaoDuong', descKey: 'page.hanhChinh.descs.lichBaoDuong', icon: Calendar, color: 'bg-amber-500' }),
        item({ slug: 'phieu-xang-chi-phi-xe', titleKey: 'page.hanhChinh.modules.phieuXangChiPhiXe', descKey: 'page.hanhChinh.descs.phieuXangChiPhiXe', icon: Fuel, color: 'bg-orange-500' }),
        item({ slug: 'quan-ly-lai-xe', titleKey: 'page.hanhChinh.modules.quanLyLaiXe', descKey: 'page.hanhChinh.descs.quanLyLaiXe', icon: UserCircle, color: 'bg-rose-500' }),
        item({ slug: 'thiet-lap-quan-ly-xe', titleKey: 'page.hanhChinh.modules.thietLapQuanLyXe', descKey: 'page.hanhChinh.descs.thietLapQuanLyXe', icon: Settings, color: 'bg-slate-500' }),
      ],
    },
  ];
}
