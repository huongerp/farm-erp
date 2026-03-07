import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Copyright,
  Building2,
  ShieldCheck,
  Globe,
  Users,
  MessageCircle,
  ExternalLink,
  Phone,
} from 'lucide-react';
import DashboardToolbar from '../components/shared/DashboardToolbar';
import Section from '../components/shared/Section';
import Button from '../components/ui/Button';
import { cn } from '../lib/utils';

/** Dữ liệu mẫu – có thể thay bằng config hoặc API */
const LICENSE_DATA = {
  companyName: 'CÔNG TY TNHH PHÁT TRIỂN CÔNG NGHỆ ABC',
  representative: 'Nguyễn Văn A',
  taxCode: '0123456789',
  address: 'Tòa nhà Innovation, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  version: 'v2.4.0 (Stable)',
  licenseDate: '01/01/2024',
  communityLinks: [
    { key: 'website', href: '#', labelKey: 'page.license.website', icon: Globe },
    { key: 'fanpage', href: '#', labelKey: 'page.license.fanpage', icon: ExternalLink },
    { key: 'communityGroup', href: '#', labelKey: 'page.license.communityGroup', icon: Users },
    { key: 'zaloGroup', href: '#', labelKey: 'page.license.zaloGroup', icon: MessageCircle },
    { key: 'tiktok', href: '#', labelKey: 'page.license.tiktok', icon: ExternalLink },
  ],
};

const TECHNICAL_CONTACT = {
  name: 'Trần Văn Kỹ Thuật',
  position: 'Trưởng phòng Kỹ thuật',
  phone: '0901 234 567',
  email: 'kythuat@company.com',
};

const BUSINESS_CONTACT = {
  name: 'Lê Thị Kinh Doanh',
  position: 'Trưởng phòng Kinh doanh',
  phone: '0909 876 543',
  email: 'kinhdoanh@company.com',
};

const LicenseInfo: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-0">
      <DashboardToolbar
        onBack={() => navigate('/')}
        leadingContent={
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Copyright className="h-4 w-4" />
            </div>
            <h1 className="text-sm font-semibold text-foreground truncate">
              {t('page.license.title')}
            </h1>
          </div>
        }
      />
      <div className="space-y-6 pb-10 pt-3 md:pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Đơn vị xây dựng & Phát triển */}
          <Section
            title={t('page.license.unitTitle')}
            icon={<Building2 className="h-4 w-4 text-primary" />}
          >
            <div className="space-y-4">
              <div className="flex flex-col border-b border-border/60 pb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('page.license.companyName')}
                </span>
                <span className="text-foreground font-semibold text-lg">
                  {LICENSE_DATA.companyName}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('page.license.representative')}
                  </span>
                  <span className="text-foreground font-medium">
                    {LICENSE_DATA.representative}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('page.license.taxCode')}
                  </span>
                  <span className="text-foreground font-medium">
                    {LICENSE_DATA.taxCode}
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('page.license.address')}
                </span>
                <span className="text-muted-foreground">{LICENSE_DATA.address}</span>
              </div>
            </div>
          </Section>

          {/* Quyền hạn & Bảo mật */}
          <Section
            title={t('page.license.rightsTitle')}
            icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />}
          >
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>{t('page.license.rightsIntro')}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  {t('page.license.version')}: <strong className="text-foreground">{LICENSE_DATA.version}</strong>
                </li>
                <li>
                  {t('page.license.licenseDate')}: {LICENSE_DATA.licenseDate}
                </li>
                <li>
                  {t('page.license.status')}: {t('page.license.statusRegistered')}
                </li>
              </ul>
              <p className="text-xs text-muted-foreground pt-2 border-t border-border/60 mt-3">
                {t('page.license.footer')}
              </p>
            </div>
          </Section>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Section title={t('page.license.communityLinks')}>
            <div className="grid grid-cols-1 gap-2">
              {LICENSE_DATA.communityLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                      'bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </a>
                );
              })}
            </div>
          </Section>

          {/* Liên hệ Kỹ thuật – cùng pattern thẻ gradient */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg">
            <h3 className="font-bold mb-1">{t('page.license.technicalContact')}</h3>
            <p className="text-sm text-primary-foreground/90 mb-0.5">{TECHNICAL_CONTACT.name}</p>
            <p className="text-xs text-primary-foreground/80 mb-1">{TECHNICAL_CONTACT.position}</p>
            <p className="text-sm text-primary-foreground/95 mb-0.5">{t('page.license.contactPhone')}: {TECHNICAL_CONTACT.phone}</p>
            <p className="text-sm text-primary-foreground/95 mb-3">{t('page.license.contactEmail')}: {TECHNICAL_CONTACT.email}</p>
            <a href={`mailto:${TECHNICAL_CONTACT.email}`} className="block mb-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full bg-background text-primary hover:bg-background/90 font-semibold text-sm"
              >
                {t('page.license.contactEmail')}
              </Button>
            </a>
            <a href={`tel:${TECHNICAL_CONTACT.phone.replace(/\s/g, '')}`}>
              <Button
                type="button"
                variant="secondary"
                className="w-full bg-background/80 text-primary hover:bg-background/90 font-semibold text-sm border border-background/30"
              >
                <Phone className="h-4 w-4 mr-1.5 inline" />
                {t('page.license.contactPhone')}
              </Button>
            </a>
          </div>

          {/* Liên hệ Kinh doanh – cùng pattern */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg">
            <h3 className="font-bold mb-1">{t('page.license.businessContact')}</h3>
            <p className="text-sm text-primary-foreground/90 mb-0.5">{BUSINESS_CONTACT.name}</p>
            <p className="text-xs text-primary-foreground/80 mb-1">{BUSINESS_CONTACT.position}</p>
            <p className="text-sm text-primary-foreground/95 mb-0.5">{t('page.license.contactPhone')}: {BUSINESS_CONTACT.phone}</p>
            <p className="text-sm text-primary-foreground/95 mb-3">{t('page.license.contactEmail')}: {BUSINESS_CONTACT.email}</p>
            <a href={`mailto:${BUSINESS_CONTACT.email}`} className="block mb-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full bg-background text-primary hover:bg-background/90 font-semibold text-sm"
              >
                {t('page.license.contactEmail')}
              </Button>
            </a>
            <a href={`tel:${BUSINESS_CONTACT.phone.replace(/\s/g, '')}`}>
              <Button
                type="button"
                variant="secondary"
                className="w-full bg-background/80 text-primary hover:bg-background/90 font-semibold text-sm border border-background/30"
              >
                <Phone className="h-4 w-4 mr-1.5 inline" />
                {t('page.license.contactPhone')}
              </Button>
            </a>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseInfo;
