/**
 * Feature locale vi — lazy load khi mở module (không gom lúc startup).
 * Khi thêm module: thêm key + loader + (nếu slug khác) map trong SUBMENU_SLUG_TO_FEATURE_I18N.
 */
import i18n from './i18n';

export type FeatureI18nKey =
  | 'bao-tri-sua-chua'
  | 'cap-phat-thu-hoi'
  | 'danh-muc-tai-san'
  | 'khau-hao-tai-san'
  | 'kiem-ke-tai-san'
  | 'noi-quan-ly'
  | 'thiet-lap-tai-san'
  | 'bao-cao-nhap-xuat-ton'
  | 'danh-muc-hang-hoa'
  | 'danh-sach-doi-tac'
  | 'danh-sach-hang-hoa'
  | 'danh-sach-nha-cung-cap'
  | 'kiem-ke-kho'
  | 'phieu-de-xuat-vat-tu'
  | 'phieu-kho'
  | 'phieu-kiem-ke'
  | 'ton-kho'
  | 'bao-cao-de-xuat-vat-tu'
  | 'don-dat-hang'
  | 'quan-ly-hop-dong'
  | 'thanh-toan-doi-tac'
  | 'thiet-lap-de-xuat-vat-tu'
  | 'bao-cao-nhan-cong'
  | 'bao-cao-so-che'
  | 'du-bao-sl-dong-thung'
  | 'hang-hoa-phan-thuoc'
  | 'phieu-kho-phan-thuoc'
  | 'thong-ke-san-xuat'
  | 'thu-hoach'
  | 'ton-kho-phan-thuoc';

const LOADERS: Record<FeatureI18nKey, () => Promise<{ default: Record<string, string> }>> = {
  'bao-tri-sua-chua': () => import('../features/hanh-chinh/bao-tri-sua-chua/locales/vi.json'),
  'cap-phat-thu-hoi': () => import('../features/hanh-chinh/cap-phat-thu-hoi/locales/vi.json'),
  'danh-muc-tai-san': () => import('../features/hanh-chinh/danh-muc-tai-san/locales/vi.json'),
  'khau-hao-tai-san': () => import('../features/hanh-chinh/khau-hao-tai-san/locales/vi.json'),
  'kiem-ke-tai-san': () => import('../features/hanh-chinh/kiem-ke-tai-san/locales/vi.json'),
  'noi-quan-ly': () => import('../features/hanh-chinh/noi-quan-ly/locales/vi.json'),
  'thiet-lap-tai-san': () => import('../features/hanh-chinh/thiet-lap-tai-san/locales/vi.json'),
  'bao-cao-nhap-xuat-ton': () => import('../features/kho-van/bao-cao-nhap-xuat-ton/locales/vi.json'),
  'danh-muc-hang-hoa': () => import('../features/kho-van/danh-muc-hang-hoa/locales/vi.json'),
  'danh-sach-doi-tac': () => import('../features/kho-van/danh-sach-doi-tac/locales/vi.json'),
  'danh-sach-hang-hoa': () => import('../features/kho-van/danh-sach-hang-hoa/locales/vi.json'),
  'danh-sach-nha-cung-cap': () => import('../features/kho-van/danh-sach-nha-cung-cap/locales/vi.json'),
  'kiem-ke-kho': () => import('../features/kho-van/kiem-ke-kho/locales/vi.json'),
  'phieu-de-xuat-vat-tu': () => import('../features/kho-van/phieu-de-xuat-vat-tu/locales/vi.json'),
  'phieu-kho': () => import('../features/kho-van/phieu-kho/locales/vi.json'),
  'phieu-kiem-ke': () => import('../features/kho-van/phieu-kiem-ke/locales/vi.json'),
  'ton-kho': () => import('../features/kho-van/ton-kho/locales/vi.json'),
  'bao-cao-de-xuat-vat-tu': () => import('../features/mua-hang/bao-cao-de-xuat-vat-tu/locales/vi.json'),
  'don-dat-hang': () => import('../features/mua-hang/don-dat-hang/locales/vi.json'),
  'quan-ly-hop-dong': () => import('../features/mua-hang/quan-ly-hop-dong/locales/vi.json'),
  'thanh-toan-doi-tac': () => import('../features/mua-hang/thanh-toan-doi-tac/locales/vi.json'),
  'thiet-lap-de-xuat-vat-tu': () => import('../features/mua-hang/thiet-lap-de-xuat-vat-tu/locales/vi.json'),
  'bao-cao-nhan-cong': () => import('../features/quan-ly-farm/bao-cao-nhan-cong/locales/vi.json'),
  'bao-cao-so-che': () => import('../features/quan-ly-farm/bao-cao-so-che/locales/vi.json'),
  'du-bao-sl-dong-thung': () => import('../features/quan-ly-farm/du-bao-sl-dong-thung/locales/vi.json'),
  'hang-hoa-phan-thuoc': () => import('../features/quan-ly-farm/hang-hoa-phan-thuoc/locales/vi.json'),
  'phieu-kho-phan-thuoc': () => import('../features/quan-ly-farm/phieu-kho-phan-thuoc/locales/vi.json'),
  'thong-ke-san-xuat': () => import('../features/quan-ly-farm/thong-ke-san-xuat/locales/vi.json'),
  'thu-hoach': () => import('../features/quan-ly-farm/thu-hoach/locales/vi.json'),
  'ton-kho-phan-thuoc': () => import('../features/quan-ly-farm/ton-kho-phan-thuoc/locales/vi.json'),
};

/** Slug submenu → key locale (khi slug ≠ tên file feature). */
export const SUBMENU_SLUG_TO_FEATURE_I18N: Partial<Record<string, FeatureI18nKey>> = {
  'chi-phi-tai-san': 'bao-tri-sua-chua',
  'danh-sach-tai-san': 'danh-muc-tai-san',
};

const loaded = new Set<FeatureI18nKey>();

function resolveFeatureI18nKey(slug: string): FeatureI18nKey | null {
  const mapped = SUBMENU_SLUG_TO_FEATURE_I18N[slug];
  if (mapped) return mapped;
  if (slug in LOADERS) return slug as FeatureI18nKey;
  return null;
}

export async function loadFeatureI18n(key: FeatureI18nKey): Promise<void> {
  if (loaded.has(key)) return;
  const mod = await LOADERS[key]();
  i18n.addResourceBundle('vi', 'translation', mod.default, true, true);
  loaded.add(key);
}

export async function loadFeatureI18nForSubmenuSlug(slug: string): Promise<void> {
  const key = resolveFeatureI18nKey(slug);
  if (key) await loadFeatureI18n(key);
}

export function wrapModuleImportWithFeatureI18n<T extends { default: unknown }>(
  slug: string,
  importFn: () => Promise<T>
): () => Promise<T> {
  return async () => {
    await loadFeatureI18nForSubmenuSlug(slug);
    return importFn();
  };
}
