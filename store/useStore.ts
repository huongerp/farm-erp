import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types';
import i18n from '../lib/i18n';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user: User) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (!persisted || typeof persisted !== 'object') return persisted as AuthState;
        const state = persisted as AuthState;
        if (version < 1) {
          if (state.user?.id === '123' || state.user?.email === 'demo@example.com') {
            state.user = {
              id: 'emp-000',
              email: 'admin@5fedu.com',
              full_name: 'Lê Minh Công',
              role: 'admin',
              created_at: new Date().toISOString(),
              id_phong_ban: 'dep-7',
            };
            state.isAuthenticated = true;
          }
        }
        if (version < 2 && state.user?.id === 'user-123') {
          state.user = {
            ...state.user,
            id: 'emp-000',
            id_phong_ban: 'dep-7',
            role: 'admin',
          };
        }
        return state;
      },
    }
  )
);

interface CompanyInfo {
  appName: string;
  appDescription: string; // New field for short description
  appLogo: string | null; // Base64 string or URL
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export type PrimaryColor = ThemeState['primaryColor'];

interface ThemeState {
  primaryColor: 'blue' | 'violet' | 'emerald' | 'rose' | 'amber' | 'orange' | 'cyan' | 'slate';
  fontFamily:
  | 'Inter'
  | 'Be Vietnam Pro'
  | 'Lexend'
  | 'Nunito'
  | 'Source Sans 3'
  | 'Merriweather';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'light' | 'dark' | 'system';
  timezone: string;
  language: 'vi' | 'en';
  setTheme: (settings: Partial<Omit<ThemeState, 'setTheme'>>) => void;
}

interface UIState extends ThemeState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  // Branding & Company Info
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: Partial<CompanyInfo>) => void;
  // User Preferences
  skipRedirectConfirmation: boolean;
  setSkipRedirectConfirmation: (skip: boolean) => void;
}

/** Allowed font families – used for migration from old settings. */
const ALLOWED_FONTS = new Set<ThemeState['fontFamily']>([
  'Inter', 'Be Vietnam Pro', 'Lexend', 'Nunito', 'Source Sans 3', 'Merriweather',
]);

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Default Theme Settings
      primaryColor: 'blue',
      fontFamily: 'Inter',
      fontSize: 'medium',
      colorScheme: 'light',
      timezone: 'Asia/Ho_Chi_Minh',
      language: 'vi',
      setTheme: (settings) => {
        if (settings.language != null) {
          i18n.changeLanguage(settings.language).catch(() => {});
        }
        set((state) => ({ ...state, ...settings }));
      },

      // Default Company Info (dữ liệu mặc định cho module Thông tin công ty)
      companyInfo: {
        appName: 'Forpeasantz',
        appDescription: 'Hợp Tác Xã Nông Nghiệp Công Nghệ Cao FP - Forpeasantz',
        appLogo: 'https://ui-avatars.com/api/?name=FP&background=16a34a&color=fff&size=128',
        companyName: 'HỢP TÁC XÃ NÔNG NGHIỆP CÔNG NGHỆ CAO FP - FORPEASANTZ. Công ty TNHH XUẤT NHẬP KHẨU ForPeasantz',
        taxId: '',
        address: 'Trụ sở: 675 Hoàng Sa, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh, Việt Nam. Trang trại: Làng Ring, Xã Ia Mơ, Huyện Chư Prông, Gia Lai.',
        phone: '0335224927 / 0826 432 468 / (028)66545885',
        email: 'info@forpeasantz.com',
        website: 'https://forpeasantz.com'
      },
      setCompanyInfo: (info) => set((state) => ({
        companyInfo: { ...state.companyInfo, ...info }
      })),

      // User Preferences
      skipRedirectConfirmation: false,
      setSkipRedirectConfirmation: (skip) => set({ skipRedirectConfirmation: skip }),
    }),
    {
      name: 'ui-storage', // Persist UI settings including branding
      version: 2, // bump when schema changes
      migrate: (persisted: any, version: number) => {
        // v0 → v1: fonts list reduced from 11 → 6, reset invalid fontFamily
        if (version === 0 && persisted && typeof persisted === 'object') {
          const state = persisted as Record<string, any>;
          if (state.fontFamily && !ALLOWED_FONTS.has(state.fontFamily as any)) {
            state.fontFamily = 'Inter';
          }
        }
        // v1 → v2: default company info → Forpeasantz (chỉ áp dụng khi đang dùng mẫu cũ)
        if (version < 2 && persisted && typeof persisted === 'object') {
          const state = persisted as Record<string, any>;
          const ci = state.companyInfo;
          if (ci && (ci.companyName === '5F template' || ci.appName === '5F template')) {
            state.companyInfo = {
              appName: 'Forpeasantz',
              appDescription: 'Hợp Tác Xã Nông Nghiệp Công Nghệ Cao FP - Forpeasantz',
              appLogo: 'https://ui-avatars.com/api/?name=FP&background=16a34a&color=fff&size=128',
              companyName: 'HỢP TÁC XÃ NÔNG NGHIỆP CÔNG NGHỆ CAO FP - FORPEASANTZ. Công ty TNHH XUẤT NHẬP KHẨU ForPeasantz',
              taxId: '',
              address: 'Trụ sở: 675 Hoàng Sa, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh, Việt Nam. Trang trại: Làng Ring, Xã Ia Mơ, Huyện Chư Prông, Gia Lai.',
              phone: '0335224927 / 0826 432 468 / (028)66545885',
              email: 'info@forpeasantz.com',
              website: 'https://forpeasantz.com',
            };
          }
        }
        // Thay logo Facebook CDN (403 hotlink) bằng fallback
        if (persisted && typeof persisted === 'object') {
          const state = persisted as Record<string, any>;
          const ci = state.companyInfo;
          if (ci?.appLogo && String(ci.appLogo).includes('fbcdn.net')) {
            state.companyInfo = { ...ci, appLogo: 'https://ui-avatars.com/api/?name=FP&background=16a34a&color=fff&size=128' };
          }
        }
        return persisted as UIState;
      },
    }
  )
);