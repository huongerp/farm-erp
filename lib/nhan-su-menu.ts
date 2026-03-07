import type { LucideIcon } from 'lucide-react';
import {
  UserPlus,
  CalendarCheck,
  Send,
  BarChart3,
  Settings,
  Calendar,
  GraduationCap,
  ClipboardList,
  Mail,
  FileSignature,
} from 'lucide-react';
import type { ModuleItem } from '../components/dashboard/SubModuleCard';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';

const BASE_PATH = '/nhan-su';

export interface NhanSuModuleConfig {
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
}

function slugToTitleKey(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function getNhanSuModuleTitleKeyBySlug(slug: string): string {
  const key = slugToTitleKey(slug);
  return `page.nhanSu.modules.${key}`;
}

export const NHAN_SU_MODULE_SLUGS: string[] = [
  'de-xuat-tuyen-dung',
  'ho-so-ung-vien',
  'lich-phong-van',
  'thu-gui-ung-vien',
  'hop-dong',
  'bao-cao-tuyen-dung',
  'thiet-lap-tuyen-dung',
  'ke-hoach-dao-tao',
  'khoa-dao-tao',
  'dang-ky-dao-tao',
  'bao-cao-dao-tao',
  'thiet-lap-dao-tao',
];

function buildItem(
  config: NhanSuModuleConfig,
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
 * Cấu hình nhóm và module cho submenu Nhân sự.
 */
export function getNhanSuGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const item = (c: NhanSuModuleConfig) => buildItem(c, t, navigate);

  return [
    {
      groupTitle: t('page.nhanSu.groupTuyenDung'),
      items: [
        item({
          slug: 'de-xuat-tuyen-dung',
          titleKey: 'page.nhanSu.modules.deXuatTuyenDung',
          descKey: 'page.nhanSu.descs.deXuatTuyenDung',
          icon: Send,
          color: 'bg-teal-500',
        }),
        item({
          slug: 'ho-so-ung-vien',
          titleKey: 'page.nhanSu.modules.hoSoUngVien',
          descKey: 'page.nhanSu.descs.hoSoUngVien',
          icon: UserPlus,
          color: 'bg-indigo-500',
        }),
        item({
          slug: 'lich-phong-van',
          titleKey: 'page.nhanSu.modules.lichPhongVan',
          descKey: 'page.nhanSu.descs.lichPhongVan',
          icon: CalendarCheck,
          color: 'bg-violet-500',
        }),
        item({
          slug: 'thu-gui-ung-vien',
          titleKey: 'page.nhanSu.modules.thuGuiUngVien',
          descKey: 'page.nhanSu.descs.thuGuiUngVien',
          icon: Mail,
          color: 'bg-amber-500',
        }),
        item({
          slug: 'hop-dong',
          titleKey: 'page.nhanSu.modules.hopDong',
          descKey: 'page.nhanSu.descs.hopDong',
          icon: FileSignature,
          color: 'bg-rose-500',
        }),
        item({
          slug: 'bao-cao-tuyen-dung',
          titleKey: 'page.nhanSu.modules.baoCaoTuyenDung',
          descKey: 'page.nhanSu.descs.baoCaoTuyenDung',
          icon: BarChart3,
          color: 'bg-cyan-500',
        }),
        item({
          slug: 'thiet-lap-tuyen-dung',
          titleKey: 'page.nhanSu.modules.thietLapTuyenDung',
          descKey: 'page.nhanSu.descs.thietLapTuyenDung',
          icon: Settings,
          color: 'bg-slate-500',
        }),
      ],
    },
    {
      groupTitle: t('page.nhanSu.groupDaoTao'),
      items: [
        item({
          slug: 'ke-hoach-dao-tao',
          titleKey: 'page.nhanSu.modules.keHoachDaoTao',
          descKey: 'page.nhanSu.descs.keHoachDaoTao',
          icon: Calendar,
          color: 'bg-blue-500',
        }),
        item({
          slug: 'khoa-dao-tao',
          titleKey: 'page.nhanSu.modules.khoaDaoTao',
          descKey: 'page.nhanSu.descs.khoaDaoTao',
          icon: GraduationCap,
          color: 'bg-emerald-500',
        }),
        item({
          slug: 'dang-ky-dao-tao',
          titleKey: 'page.nhanSu.modules.dangKyDaoTao',
          descKey: 'page.nhanSu.descs.dangKyDaoTao',
          icon: ClipboardList,
          color: 'bg-teal-500',
        }),
        item({
          slug: 'bao-cao-dao-tao',
          titleKey: 'page.nhanSu.modules.baoCaoDaoTao',
          descKey: 'page.nhanSu.descs.baoCaoDaoTao',
          icon: BarChart3,
          color: 'bg-cyan-500',
        }),
        item({
          slug: 'thiet-lap-dao-tao',
          titleKey: 'page.nhanSu.modules.thietLapDaoTao',
          descKey: 'page.nhanSu.descs.thietLapDaoTao',
          icon: Settings,
          color: 'bg-slate-500',
        }),
      ],
    },
  ];
}
