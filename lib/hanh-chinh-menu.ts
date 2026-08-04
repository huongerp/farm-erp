import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  Receipt,
  Settings,
  ClipboardList,
  Scale,
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

/** Slug module Hành chính còn dùng (khớp phân quyền + redirect công việc). */
export const HANH_CHINH_MODULE_SLUGS: string[] = [
  'phieu-hanh-chinh',
  'bang-luong',
  'diem-cong-tru',
  'thiet-lap-cong-luong',
  'cong-viec',
  'cong-viec-cua-toi',
  'cong-viec-toi-quan-ly',
  'danh-sach-tai-san',
  'cap-phat-thu-hoi',
  'chi-phi-tai-san',
  'kiem-ke-tai-san',
  'khau-hao-tai-san',
  'noi-quan-ly',
  'thiet-lap-tai-san',
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
        item({ slug: 'cong-viec', titleKey: 'page.hanhChinh.modules.congViec', descKey: 'page.hanhChinh.descs.congViec', icon: ClipboardList, color: 'bg-amber-500' }),
        item({ slug: 'phieu-hanh-chinh', titleKey: 'page.hanhChinh.modules.phieuHanhChinh', descKey: 'page.hanhChinh.descs.phieuHanhChinh', icon: Receipt, color: 'bg-indigo-500' }),
        item({ slug: 'bang-luong', titleKey: 'page.hanhChinh.modules.bangLuong', descKey: 'page.hanhChinh.descs.bangLuong', icon: Banknote, color: 'bg-emerald-500' }),
        item({ slug: 'diem-cong-tru', titleKey: 'page.hanhChinh.modules.diemCongTru', descKey: 'page.hanhChinh.descs.diemCongTru', icon: Scale, color: 'bg-violet-500' }),
        item({ slug: 'thiet-lap-cong-luong', titleKey: 'page.hanhChinh.modules.thietLapCongLuong', descKey: 'page.hanhChinh.descs.thietLapCongLuong', icon: Settings, color: 'bg-slate-500' }),
      ],
    },
    // Nhóm Tài liệu ẩn trên menu (code/route vẫn giữ)
    // { groupTitle: t('page.hanhChinh.groupTaiLieu'), items: [ danh-sach-tai-lieu, luu-tru-ho-so, thiet-lap-tai-lieu ] },
    // Nhóm Công việc ẩn trên menu (code/route vẫn giữ)
    // { groupTitle: t('page.hanhChinh.groupCongViec'), items: [ du-an, cong-viec-cua-toi, cong-viec-toi-quan-ly, bao-cao, thiet-lap-cong-viec ] },
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
  ];
}
