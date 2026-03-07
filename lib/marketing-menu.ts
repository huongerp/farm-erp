import type { LucideIcon } from 'lucide-react';
import {
  Megaphone,
  Mail,
  MessageSquare,
  Share2,
  BarChart3,
  Settings,
  FileText,
  Image,
  Layout,
  FormInput,
} from 'lucide-react';
import type { ModuleItem } from '../components/dashboard/SubModuleCard';
import type { ModuleGroup } from '../components/dashboard/ModuleDashboardLayout';

const BASE_PATH = '/marketing';

export interface MarketingModuleConfig {
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  color: string;
}

function slugToTitleKey(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function getMarketingModuleTitleKeyBySlug(slug: string): string {
  const key = slugToTitleKey(slug);
  return `page.marketing.modules.${key}`;
}

export const MARKETING_MODULE_SLUGS: string[] = [
  'chien-dich',
  'email-marketing',
  'sms-thong-bao',
  'mang-xa-hoi',
  'bao-cao-chien-dich',
  'thiet-lap-chien-dich',
  'quan-ly-noi-dung',
  'thu-vien-tai-san',
  'landing-page',
  'form-thu-thap-lead',
  'thiet-lap-noi-dung',
];

function buildItem(
  config: MarketingModuleConfig,
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
 * Cấu hình nhóm và module cho submenu Marketing.
 */
export function getMarketingGroups(
  t: (key: string) => string,
  navigate: (path: string) => void
): ModuleGroup[] {
  const item = (c: MarketingModuleConfig) => buildItem(c, t, navigate);

  return [
    {
      groupTitle: t('page.marketing.groupChienDich'),
      items: [
        item({
          slug: 'chien-dich',
          titleKey: 'page.marketing.modules.chienDich',
          descKey: 'page.marketing.descs.chienDich',
          icon: Megaphone,
          color: 'bg-pink-500',
        }),
        item({
          slug: 'email-marketing',
          titleKey: 'page.marketing.modules.emailMarketing',
          descKey: 'page.marketing.descs.emailMarketing',
          icon: Mail,
          color: 'bg-blue-500',
        }),
        item({
          slug: 'sms-thong-bao',
          titleKey: 'page.marketing.modules.smsThongBao',
          descKey: 'page.marketing.descs.smsThongBao',
          icon: MessageSquare,
          color: 'bg-emerald-500',
        }),
        item({
          slug: 'mang-xa-hoi',
          titleKey: 'page.marketing.modules.mangXaHoi',
          descKey: 'page.marketing.descs.mangXaHoi',
          icon: Share2,
          color: 'bg-indigo-500',
        }),
        item({
          slug: 'bao-cao-chien-dich',
          titleKey: 'page.marketing.modules.baoCaoChienDich',
          descKey: 'page.marketing.descs.baoCaoChienDich',
          icon: BarChart3,
          color: 'bg-cyan-500',
        }),
        item({
          slug: 'thiet-lap-chien-dich',
          titleKey: 'page.marketing.modules.thietLapChienDich',
          descKey: 'page.marketing.descs.thietLapChienDich',
          icon: Settings,
          color: 'bg-slate-500',
        }),
      ],
    },
    {
      groupTitle: t('page.marketing.groupNoiDungTruyenThong'),
      items: [
        item({
          slug: 'quan-ly-noi-dung',
          titleKey: 'page.marketing.modules.quanLyNoiDung',
          descKey: 'page.marketing.descs.quanLyNoiDung',
          icon: FileText,
          color: 'bg-pink-500',
        }),
        item({
          slug: 'thu-vien-tai-san',
          titleKey: 'page.marketing.modules.thuVienTaiSan',
          descKey: 'page.marketing.descs.thuVienTaiSan',
          icon: Image,
          color: 'bg-violet-500',
        }),
        item({
          slug: 'landing-page',
          titleKey: 'page.marketing.modules.landingPage',
          descKey: 'page.marketing.descs.landingPage',
          icon: Layout,
          color: 'bg-teal-500',
        }),
        item({
          slug: 'form-thu-thap-lead',
          titleKey: 'page.marketing.modules.formThuThapLead',
          descKey: 'page.marketing.descs.formThuThapLead',
          icon: FormInput,
          color: 'bg-amber-500',
        }),
        item({
          slug: 'thiet-lap-noi-dung',
          titleKey: 'page.marketing.modules.thietLapNoiDung',
          descKey: 'page.marketing.descs.thietLapNoiDung',
          icon: Settings,
          color: 'bg-slate-500',
        }),
      ],
    },
  ];
}
