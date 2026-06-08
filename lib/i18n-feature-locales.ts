import i18n from './i18n';

type LocaleBundle = Record<string, string>;

type FeatureLocaleLoader = () => Promise<{ vi: LocaleBundle; en: LocaleBundle }>;

/** Slug submenu → loader locale feature (vi + en). */
export const FEATURE_LOCALE_LOADERS: Record<string, FeatureLocaleLoader> = {
  'thiet-lap-tai-san': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/hanh-chinh/thiet-lap-tai-san/locales/vi.json'),
      import('@/features/hanh-chinh/thiet-lap-tai-san/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'danh-sach-tai-san': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/hanh-chinh/danh-muc-tai-san/locales/vi.json'),
      import('@/features/hanh-chinh/danh-muc-tai-san/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'cap-phat-thu-hoi': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/hanh-chinh/cap-phat-thu-hoi/locales/vi.json'),
      import('@/features/hanh-chinh/cap-phat-thu-hoi/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'chi-phi-tai-san': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/hanh-chinh/bao-tri-sua-chua/locales/vi.json'),
      import('@/features/hanh-chinh/bao-tri-sua-chua/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'kiem-ke-tai-san': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/hanh-chinh/kiem-ke-tai-san/locales/vi.json'),
      import('@/features/hanh-chinh/kiem-ke-tai-san/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'khau-hao-tai-san': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/hanh-chinh/khau-hao-tai-san/locales/vi.json'),
      import('@/features/hanh-chinh/khau-hao-tai-san/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'noi-quan-ly': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/hanh-chinh/noi-quan-ly/locales/vi.json'),
      import('@/features/hanh-chinh/noi-quan-ly/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'danh-muc-hang-hoa': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/kho-van/danh-muc-hang-hoa/locales/vi.json'),
      import('@/features/kho-van/danh-muc-hang-hoa/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'danh-sach-hang-hoa': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/kho-van/danh-sach-hang-hoa/locales/vi.json'),
      import('@/features/kho-van/danh-sach-hang-hoa/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'danh-sach-doi-tac': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/kho-van/danh-sach-doi-tac/locales/vi.json'),
      import('@/features/kho-van/danh-sach-doi-tac/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'phieu-kho': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/kho-van/phieu-kho/locales/vi.json'),
      import('@/features/kho-van/phieu-kho/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'ton-kho': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/kho-van/ton-kho/locales/vi.json'),
      import('@/features/kho-van/ton-kho/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'bao-cao-nhap-xuat-ton': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/kho-van/bao-cao-nhap-xuat-ton/locales/vi.json'),
      import('@/features/kho-van/bao-cao-nhap-xuat-ton/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'kiem-ke-kho': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/kho-van/kiem-ke-kho/locales/vi.json'),
      import('@/features/kho-van/kiem-ke-kho/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'phieu-de-xuat-vat-tu': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/kho-van/phieu-de-xuat-vat-tu/locales/vi.json'),
      import('@/features/kho-van/phieu-de-xuat-vat-tu/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'don-dat-hang': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/mua-hang/don-dat-hang/locales/vi.json'),
      import('@/features/mua-hang/don-dat-hang/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'thiet-lap-de-xuat-vat-tu': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/mua-hang/thiet-lap-de-xuat-vat-tu/locales/vi.json'),
      import('@/features/mua-hang/thiet-lap-de-xuat-vat-tu/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'thanh-toan-doi-tac': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/mua-hang/thanh-toan-doi-tac/locales/vi.json'),
      import('@/features/mua-hang/thanh-toan-doi-tac/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'bao-cao-de-xuat-vat-tu': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/mua-hang/bao-cao-de-xuat-vat-tu/locales/vi.json'),
      import('@/features/mua-hang/bao-cao-de-xuat-vat-tu/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'quan-ly-hop-dong': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/mua-hang/quan-ly-hop-dong/locales/vi.json'),
      import('@/features/mua-hang/quan-ly-hop-dong/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'thu-hoach': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/quan-ly-farm/thu-hoach/locales/vi.json'),
      import('@/features/quan-ly-farm/thu-hoach/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'bao-cao-nhan-cong': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/quan-ly-farm/bao-cao-nhan-cong/locales/vi.json'),
      import('@/features/quan-ly-farm/bao-cao-nhan-cong/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'bao-cao-so-che': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/quan-ly-farm/bao-cao-so-che/locales/vi.json'),
      import('@/features/quan-ly-farm/bao-cao-so-che/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'du-bao-sl-dong-thung': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/quan-ly-farm/du-bao-sl-dong-thung/locales/vi.json'),
      import('@/features/quan-ly-farm/du-bao-sl-dong-thung/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'thong-ke-san-xuat': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/quan-ly-farm/thong-ke-san-xuat/locales/vi.json'),
      import('@/features/quan-ly-farm/thong-ke-san-xuat/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'hang-hoa-phan-thuoc': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/quan-ly-farm/hang-hoa-phan-thuoc/locales/vi.json'),
      import('@/features/quan-ly-farm/hang-hoa-phan-thuoc/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'phieu-kho-phan-thuoc': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/quan-ly-farm/phieu-kho-phan-thuoc/locales/vi.json'),
      import('@/features/quan-ly-farm/phieu-kho-phan-thuoc/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'ton-kho-phan-thuoc': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/quan-ly-farm/ton-kho-phan-thuoc/locales/vi.json'),
      import('@/features/quan-ly-farm/ton-kho-phan-thuoc/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'phieu-kiem-ke': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/kho-van/phieu-kiem-ke/locales/vi.json'),
      import('@/features/kho-van/phieu-kiem-ke/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
  'danh-sach-nha-cung-cap': async () => {
    const [vi, en] = await Promise.all([
      import('@/features/kho-van/danh-sach-nha-cung-cap/locales/vi.json'),
      import('@/features/kho-van/danh-sach-nha-cung-cap/locales/en.json'),
    ]);
    return { vi: vi.default, en: en.default };
  },
};

const loadedFeatures = new Set<string>();
let enCoreLoaded = false;

export async function ensureEnglishCoreLocale(): Promise<void> {
  if (enCoreLoaded) return;
  const en = (await import('../locales/en/core')).default;
  i18n.addResourceBundle('en', 'translation', en, true, true);
  enCoreLoaded = true;
}

export async function ensureFeatureLocale(slug: string): Promise<void> {
  if (loadedFeatures.has(slug)) return;
  const loader = FEATURE_LOCALE_LOADERS[slug];
  if (!loader) return;
  const bundles = await loader();
  i18n.addResourceBundle('vi', 'translation', bundles.vi, true, true);
  i18n.addResourceBundle('en', 'translation', bundles.en, true, true);
  loadedFeatures.add(slug);
}

export async function ensureLocaleForLanguage(lang: string): Promise<void> {
  if (lang === 'en') {
    await ensureEnglishCoreLocale();
  }
}
