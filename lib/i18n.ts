import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from '../locales/vi';
import en from '../locales/en';

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: 'vi',        // default language
  fallbackLng: 'vi', // fallback language
  interpolation: {
    escapeValue: false, // React already escapes
  },
  react: {
    useSuspense: false, // avoid Suspense wrapper requirement
  },
});

export default i18n;
