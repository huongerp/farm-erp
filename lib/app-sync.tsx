import React, { useEffect, useRef, useState } from 'react';
import { useUIStore } from '../store/useStore';
import { PRIMARY_COLOR_MAP } from './theme-utils';
import { ensureLocaleForLanguage } from './i18n-feature-locales';
import i18n from './i18n';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';

const FONT_URL_MAP: Record<string, string> = {
  Inter: '',
  'Be Vietnam Pro': 'Be+Vietnam+Pro:wght@400;500;600;700',
  Lexend: 'Lexend:wght@400;500;600;700',
  Nunito: 'Nunito:wght@400;600;700',
  'Source Sans 3': 'Source+Sans+3:wght@400;500;600;700',
  Merriweather: 'Merriweather:wght@400;700',
};

export function loadFont(fontFamily: string): void {
  const fontParam = FONT_URL_MAP[fontFamily];
  if (!fontParam) return;
  const id = `gfont-${fontFamily.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontParam}&display=swap`;
  document.head.appendChild(link);
}

export const ThemeSynchronizer: React.FC = () => {
  const { primaryColor, fontFamily, fontSize, colorScheme } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    const hslValue = PRIMARY_COLOR_MAP[primaryColor];
    root.style.setProperty('--primary', hslValue);
    root.style.setProperty('--ring', hslValue);
    root.style.setProperty('--secondary-foreground', hslValue);
    root.style.setProperty('--accent-foreground', hslValue);
    root.style.setProperty('--color-primary', `hsl(${hslValue})`);
    root.style.setProperty('--color-ring', `hsl(${hslValue} / 0.5)`);

    loadFont(fontFamily);
    const safeFontFamily = fontFamily.includes(' ') ? `'${fontFamily}'` : fontFamily;
    root.style.setProperty('--font-sans', `${safeFontFamily}, 'Noto Sans'`);
    root.dataset.textSize = fontSize;
  }, [primaryColor, fontFamily, fontSize]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    const root = document.documentElement;
    const getResolvedTheme = (): 'dark' | 'light' => {
      if (colorScheme === 'dark') return 'dark';
      if (colorScheme === 'light') return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    let transitionTimer: ReturnType<typeof setTimeout> | undefined;
    if (!isFirstRender.current) {
      root.setAttribute('data-theme-transition', '');
      transitionTimer = setTimeout(() => root.removeAttribute('data-theme-transition'), 350);
    }
    isFirstRender.current = false;

    const apply = () => {
      const resolved = getResolvedTheme();
      if (resolved === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
    };
    apply();
    if (colorScheme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => {
        mq.removeEventListener('change', apply);
        if (transitionTimer) clearTimeout(transitionTimer);
      };
    }
    return () => {
      if (transitionTimer) clearTimeout(transitionTimer);
    };
  }, [colorScheme]);
  return null;
};

export const MetadataSynchronizer: React.FC = () => {
  const companyInfo = useUIStore((s) => s.companyInfo);
  useEffect(() => {
    const titlePart = companyInfo.appDescription
      ? `${companyInfo.appName} - ${companyInfo.appDescription}`
      : companyInfo.appName;
    document.title = titlePart;
    if (companyInfo.appLogo) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = companyInfo.appLogo;
    }
  }, [companyInfo]);
  return null;
};

export const LanguageSynchronizer: React.FC = () => {
  const language = useUIStore((s) => s.language);
  useEffect(() => {
    void ensureLocaleForLanguage(language).then(() => {
      i18n.changeLanguage(language);
    });
    dayjs.locale(language === 'vi' ? 'vi' : 'en');
    document.documentElement.lang = language === 'vi' ? 'vi' : 'en';
  }, [language]);
  return null;
};

export function useResolvedTheme(): 'dark' | 'light' {
  const colorScheme = useUIStore((s) => s.colorScheme);

  const resolve = (): 'dark' | 'light' => {
    if (colorScheme === 'dark') return 'dark';
    if (colorScheme === 'light') return 'light';
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(resolve);

  useEffect(() => {
    setTheme(resolve());
    if (colorScheme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [colorScheme]);

  return theme;
}
