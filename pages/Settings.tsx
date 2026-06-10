import React, { useId, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Palette,
  Type,
  Globe,
  Bell,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Layout as LayoutIcon,
  Clock,
  CheckCircle2,
  Settings as SettingsIcon,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Combobox from '../components/ui/Combobox';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import { useUIStore, type PrimaryColor } from '../store/useStore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const FONT_SIZE_CLASS = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-base',
} as const;

const TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: '(GMT+07:00) Hà Nội, TP.HCM, Bangkok' },
  { value: 'Asia/Tokyo', label: '(GMT+09:00) Tokyo, Seoul' },
  { value: 'Asia/Shanghai', label: '(GMT+08:00) Bắc Kinh, Singapore' },
  { value: 'Asia/Kolkata', label: '(GMT+05:30) Mumbai, Kolkata' },
  { value: 'Asia/Dubai', label: '(GMT+04:00) Dubai, Abu Dhabi' },
  { value: 'Europe/London', label: '(GMT+00:00) London, Dublin' },
  { value: 'Europe/Paris', label: '(GMT+01:00) Paris, Berlin' },
  { value: 'Europe/Moscow', label: '(GMT+03:00) Moscow' },
  { value: 'America/New_York', label: '(GMT-05:00) New York, Washington' },
  { value: 'America/Los_Angeles', label: '(GMT-08:00) Los Angeles, San Francisco' },
  { value: 'Australia/Sydney', label: '(GMT+11:00) Sydney, Melbourne' },
  { value: 'Pacific/Auckland', label: '(GMT+13:00) Auckland' },
  { value: 'UTC', label: '(GMT+00:00) UTC' },
];

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { primaryColor, fontFamily, fontSize, colorScheme, timezone, setTheme } = useUIStore();

  // Unique IDs for label → control association (C3, D2)
  const fontFamilyId = useId();
  const fontSizeId = useId();
  const timezoneId = useId();

  const THEME_COLORS = useMemo((): { name: PrimaryColor; label: string; color: string }[] => [
    { name: 'blue', label: t('settings.colorBlue'), color: 'bg-blue-600' },
    { name: 'violet', label: t('settings.colorViolet'), color: 'bg-indigo-600' },
    { name: 'emerald', label: t('settings.colorEmerald'), color: 'bg-emerald-600' },
    { name: 'rose', label: t('settings.colorRose'), color: 'bg-rose-600' },
    { name: 'amber', label: t('settings.colorAmber'), color: 'bg-amber-500' },
    { name: 'orange', label: t('settings.colorOrange'), color: 'bg-orange-600' },
    { name: 'cyan', label: t('settings.colorCyan'), color: 'bg-cyan-500' },
    { name: 'slate', label: t('settings.colorSlate'), color: 'bg-slate-600' },
  ], [t]);

  const FONTS = useMemo(() => [
    { value: 'Inter', label: 'Inter', desc: t('settings.fontInterDesc') },
    { value: 'Be Vietnam Pro', label: 'Be Vietnam Pro', desc: t('settings.fontBeVietnamDesc') },
    { value: 'Lexend', label: 'Lexend', desc: t('settings.fontLexendDesc') },
    { value: 'Nunito', label: 'Nunito', desc: t('settings.fontNunitoDesc') },
    { value: 'Source Sans 3', label: 'Source Sans 3', desc: t('settings.fontSourceSansDesc') },
    { value: 'Merriweather', label: 'Merriweather', desc: t('settings.fontMerriweatherDesc') },
  ], [t]);

  const FONT_SIZES = useMemo(() => [
    { value: 'small', label: t('settings.fontSmall'), desc: t('settings.fontSmallDesc') },
    { value: 'medium', label: t('settings.fontMedium'), desc: t('settings.fontMediumDesc') },
    { value: 'large', label: t('settings.fontLarge'), desc: t('settings.fontLargeDesc') },
  ], [t]);

  const handleReset = () => {
    setTheme({
      primaryColor: 'blue',
      fontFamily: 'Inter',
      fontSize: 'medium',
      colorScheme: 'light',
      timezone: 'Asia/Ho_Chi_Minh',
    });
    toast.info(t('settings.restored'));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* B1: Page header + Reset + Auto-save */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start gap-3"
      >
        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground">
            {t('settings.pageTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('settings.pageDescription')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Auto-save indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" />
            {t('settings.autoSaved')}
          </div>
          <Button
            variant="outline"
            onClick={handleReset}
            className="rounded-xl border-border text-muted-foreground bg-card shrink-0"
          >
            <RotateCcw size={16} className="mr-2" />
            {t('common.reset')}
          </Button>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* Giao diện & Hiển thị */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card p-5 rounded-xl border border-border shadow-sm"
        >
          <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2 border-b border-border pb-3">
            <Palette className="w-4 h-4 text-primary" />
            {t('settings.title')}
          </h3>

          <div className="space-y-6">
            {/* Chế độ hiển thị - C2: role="radiogroup" + role="radio" + aria-checked */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Moon size={14} />
                {t('settings.displayMode')}
              </label>
              <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={t('settings.displayMode')}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={colorScheme === 'light'}
                  onClick={() => setTheme({ colorScheme: 'light' })}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    colorScheme === 'light'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  )}
                >
                  {/* B4: Sun icon for Light mode */}
                  <Sun size={14} className={cn(colorScheme === 'light' ? 'text-primary' : 'text-muted-foreground')} />
                  {t('settings.light')}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={colorScheme === 'dark'}
                  onClick={() => setTheme({ colorScheme: 'dark' })}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    colorScheme === 'dark'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  )}
                >
                  {/* B4: Moon icon for Dark mode */}
                  <Moon size={14} className={cn(colorScheme === 'dark' ? 'text-primary' : 'text-muted-foreground')} />
                  {t('settings.dark')}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={colorScheme === 'system'}
                  onClick={() => setTheme({ colorScheme: 'system' })}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    colorScheme === 'system'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Monitor size={14} />
                  {t('settings.system')}
                </button>
              </div>
            </div>

            {/* Tông màu chủ đạo - C2: role="radiogroup" + role="radio" + aria-checked */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                {t('settings.primaryColor')}
              </label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('settings.primaryColor')}>
                {THEME_COLORS.map((theme) => (
                  <button
                    key={theme.name}
                    type="button"
                    role="radio"
                    aria-checked={primaryColor === theme.name}
                    aria-label={theme.label}
                    onClick={() => setTheme({ primaryColor: theme.name })}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
                      primaryColor === theme.name
                        ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    <span
                      className={cn('w-4 h-4 rounded-full shrink-0', theme.color)}
                      aria-hidden="true"
                    />
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kiểu chữ & Kích thước chữ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* B2: Show font description in renderOption */}
              <div className="space-y-3">
                <label htmlFor={fontFamilyId} className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Type size={14} />
                  {t('settings.fontFamily')}
                </label>
                <Combobox
                  label=""
                  options={FONTS.map((f) => ({ label: f.label, value: f.value }))}
                  value={fontFamily}
                  onChange={(v) =>
                    setTheme({ fontFamily: String(v) as typeof fontFamily })
                  }
                  placeholder={t('settings.selectFont')}
                  searchable={false}
                  triggerClassName="h-11 rounded-xl"
                  renderOption={(opt) => {
                    const font = FONTS.find((f) => f.value === opt.value);
                    return (
                      <div className="flex flex-col">
                        <span
                          style={{ fontFamily: String(opt.value) }}
                          className="text-foreground font-medium"
                        >
                          {opt.label}
                        </span>
                        {font?.desc && (
                          <span className="text-xs text-muted-foreground">
                            {font.desc}
                          </span>
                        )}
                      </div>
                    );
                  }}
                  renderValue={(opt) => (
                    <span
                      style={{ fontFamily: String(opt.value) }}
                      className="text-foreground font-medium"
                    >
                      {opt.label}
                    </span>
                  )}
                />
              </div>
              <div className="space-y-3">
                <label htmlFor={fontSizeId} className="text-sm font-medium text-foreground flex items-center gap-2">
                  <LayoutIcon size={14} className="text-muted-foreground" />
                  {t('settings.fontSize')}
                </label>
                <Combobox
                  label=""
                  options={FONT_SIZES.map((f) => ({ label: f.label, value: f.value }))}
                  value={fontSize}
                  onChange={(v) =>
                    setTheme({
                      fontSize: String(v) as 'small' | 'medium' | 'large',
                    })
                  }
                  placeholder={t('settings.selectFontSize')}
                  searchable={false}
                  triggerClassName="h-11 rounded-xl"
                  renderOption={(opt) => {
                    const size = FONT_SIZES.find((f) => f.value === opt.value);
                    return (
                      <div className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            'font-medium text-foreground',
                            FONT_SIZE_CLASS[opt.value as keyof typeof FONT_SIZE_CLASS]
                          )}
                        >
                          {opt.label}
                        </span>
                        {size?.desc && (
                          <span className="text-xs text-muted-foreground">
                            ({size.desc})
                          </span>
                        )}
                      </div>
                    );
                  }}
                  renderValue={(opt) => (
                    <span
                      className={cn(
                        'font-medium text-foreground',
                        FONT_SIZE_CLASS[opt.value as keyof typeof FONT_SIZE_CLASS]
                      )}
                    >
                      {opt.label}
                    </span>
                  )}
                />
                {/* B3: Font size preview text */}
                <p
                  className={cn(
                    'text-muted-foreground mt-1 border border-dashed border-border rounded-lg px-3 py-2',
                    FONT_SIZE_CLASS[fontSize],
                  )}
                >
                  {t('settings.fontSizePreview')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('settings.fontSizeHint')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cấu hình vùng & Thông báo - 2 cột */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cấu hình vùng */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card p-5 rounded-xl border border-border shadow-sm"
          >
            <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2 border-b border-border pb-3">
              <Globe className="w-4 h-4 text-muted-foreground" />
              {t('settings.region')}
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor={timezoneId} className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" />
                  {t('settings.timezone')}
                </label>
                {/* A1: Renamed variable from `t` to `tz` to avoid shadowing useTranslation's `t` */}
                <Combobox
                  label=""
                  options={TIMEZONES.map((tz) => ({ label: tz.label, value: tz.value }))}
                  value={timezone}
                  onChange={(v) => setTheme({ timezone: String(v) })}
                  placeholder={t('settings.selectTimezone')}
                  searchable
                  triggerClassName="h-11 rounded-xl"
                />
              </div>
            </div>
          </motion.div>

          {/* Thông báo - A4+B5: Coming Soon overlay */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card p-5 rounded-xl border border-border shadow-sm relative"
          >
            <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2 border-b border-border pb-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              {t('settings.notifications')}
              <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                {t('settings.comingSoon')}
              </span>
            </h3>
            <div className="space-y-3 opacity-50 pointer-events-none" aria-disabled="true">
              {/* C1+D1: Using ToggleSwitch with role="switch" + aria-checked */}
              <ToggleSwitch
                checked={false}
                onChange={() => {}}
                disabled
                label={t('settings.emailNotification')}
                description={t('settings.emailNotificationDesc')}
              />
              <ToggleSwitch
                checked={false}
                onChange={() => {}}
                disabled
                label={t('settings.browserNotification')}
                description={t('settings.browserNotificationDesc')}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center italic">
              {t('settings.comingSoonDesc')}
            </p>
          </motion.div>
        </div>
      </div>

    </div>
  );
};

export default Settings;
