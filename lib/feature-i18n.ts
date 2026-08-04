/**
 * Feature locale vi — đã gộp eager trong locales/vi/core.ts.
 * API giữ nguyên để wrapModuleImportWithFeatureI18n / lazyWithFeatureI18n vẫn tương thích.
 */
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
  | 'kiem-ke-kho'
  | 'phieu-de-xuat-vat-tu'
  | 'phieu-kho'
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

const FEATURE_I18N_KEYS = new Set<FeatureI18nKey>([
  'bao-tri-sua-chua',
  'cap-phat-thu-hoi',
  'danh-muc-tai-san',
  'khau-hao-tai-san',
  'kiem-ke-tai-san',
  'noi-quan-ly',
  'thiet-lap-tai-san',
  'bao-cao-nhap-xuat-ton',
  'danh-muc-hang-hoa',
  'danh-sach-doi-tac',
  'danh-sach-hang-hoa',
  'kiem-ke-kho',
  'phieu-de-xuat-vat-tu',
  'phieu-kho',
  'ton-kho',
  'bao-cao-de-xuat-vat-tu',
  'don-dat-hang',
  'quan-ly-hop-dong',
  'thanh-toan-doi-tac',
  'thiet-lap-de-xuat-vat-tu',
  'bao-cao-nhan-cong',
  'bao-cao-so-che',
  'du-bao-sl-dong-thung',
  'hang-hoa-phan-thuoc',
  'phieu-kho-phan-thuoc',
  'thong-ke-san-xuat',
  'thu-hoach',
  'ton-kho-phan-thuoc',
]);

/** Slug submenu → key locale (khi slug ≠ tên file feature). */
export const SUBMENU_SLUG_TO_FEATURE_I18N: Partial<Record<string, FeatureI18nKey>> = {
  'chi-phi-tai-san': 'bao-tri-sua-chua',
  'danh-sach-tai-san': 'danh-muc-tai-san',
};

function resolveFeatureI18nKey(slug: string): FeatureI18nKey | null {
  const mapped = SUBMENU_SLUG_TO_FEATURE_I18N[slug];
  if (mapped) return mapped;
  if (FEATURE_I18N_KEYS.has(slug as FeatureI18nKey)) return slug as FeatureI18nKey;
  return null;
}

/** Locale feature đã eager-load trong locales/vi/core.ts — no-op giữ API tương thích. */
export async function loadFeatureI18n(_key: FeatureI18nKey): Promise<void> {}

export async function loadFeatureI18nForSubmenuSlug(slug: string): Promise<void> {
  void resolveFeatureI18nKey(slug);
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
