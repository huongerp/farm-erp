/**
 * Feature locale vi — nạp LAZY theo từng feature.
 *
 * Trước đây locales/vi/core.ts nạp eager cả 30 file locale của feature
 * (256 KB) vào chunk chính, và cứ thêm một module là main lại phình. Giờ mỗi
 * feature tự nạp locale của nó, trung bình 43 KB cho mỗi module được mở.
 *
 * Điều kiện an toàn — locale PHẢI có mặt trước khi code module chạy, vì store và
 * core/schema.ts của nhiều module gọi i18n.t() ngay ở module scope (789 lời gọi
 * trong 91 file). `wrapModuleImportWithFeatureI18n` và `lazyWithFeatureI18n` đã
 * await loadFeatureI18n rồi mới import module, nên thứ tự luôn đúng.
 * Thêm module mới thì nhớ khai vào FEATURE_I18N_LOADERS.
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
  | 'de-xuat-mua-hang'
  | 'du-bao-sl-dong-thung'
  | 'hang-hoa-phan-thuoc'
  | 'phieu-kho-phan-thuoc'
  | 'thiet-lap-de-xuat-mua-hang'
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
  'de-xuat-mua-hang',
  'du-bao-sl-dong-thung',
  'hang-hoa-phan-thuoc',
  'phieu-kho-phan-thuoc',
  'thiet-lap-de-xuat-mua-hang',
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

const FEATURE_I18N_LOADERS: Record<FeatureI18nKey, () => Promise<{ default: Record<string, string> }>> = {
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
  'kiem-ke-kho': () => import('../features/kho-van/kiem-ke-kho/locales/vi.json'),
  'phieu-de-xuat-vat-tu': () => import('../features/kho-van/phieu-de-xuat-vat-tu/locales/vi.json'),
  'phieu-kho': () => import('../features/kho-van/phieu-kho/locales/vi.json'),
  'ton-kho': () => import('../features/kho-van/ton-kho/locales/vi.json'),
  'bao-cao-de-xuat-vat-tu': () => import('../features/mua-hang/bao-cao-de-xuat-vat-tu/locales/vi.json'),
  'don-dat-hang': () => import('../features/mua-hang/don-dat-hang/locales/vi.json'),
  'quan-ly-hop-dong': () => import('../features/mua-hang/quan-ly-hop-dong/locales/vi.json'),
  'thanh-toan-doi-tac': () => import('../features/mua-hang/thanh-toan-doi-tac/locales/vi.json'),
  'thiet-lap-de-xuat-vat-tu': () => import('../features/mua-hang/thiet-lap-de-xuat-vat-tu/locales/vi.json'),
  'bao-cao-nhan-cong': () => import('../features/quan-ly-farm/bao-cao-nhan-cong/locales/vi.json'),
  'bao-cao-so-che': () => import('../features/quan-ly-farm/bao-cao-so-che/locales/vi.json'),
  'de-xuat-mua-hang': () => import('../features/quan-ly-farm/de-xuat-mua-hang/locales/vi.json'),
  'du-bao-sl-dong-thung': () => import('../features/quan-ly-farm/du-bao-sl-dong-thung/locales/vi.json'),
  'hang-hoa-phan-thuoc': () => import('../features/quan-ly-farm/hang-hoa-phan-thuoc/locales/vi.json'),
  'phieu-kho-phan-thuoc': () => import('../features/quan-ly-farm/phieu-kho-phan-thuoc/locales/vi.json'),
  'thiet-lap-de-xuat-mua-hang': () => import('../features/quan-ly-farm/thiet-lap-de-xuat-mua-hang/locales/vi.json'),
  'thong-ke-san-xuat': () => import('../features/quan-ly-farm/thong-ke-san-xuat/locales/vi.json'),
  'thu-hoach': () => import('../features/quan-ly-farm/thu-hoach/locales/vi.json'),
  'ton-kho-phan-thuoc': () => import('../features/quan-ly-farm/ton-kho-phan-thuoc/locales/vi.json'),
};

/**
 * Feature dùng CODE của feature khác (import giá trị, không tính `import type`).
 * Mở module A thì phải nạp kèm locale của B, nếu không store/schema của B chạy lúc
 * import sẽ nhả ra tên key thay vì tiếng Việt. Danh sách sinh từ đồ thị import thật.
 */
const FEATURE_I18N_DEPS: Partial<Record<FeatureI18nKey, FeatureI18nKey[]>> = {
  'bao-cao-de-xuat-vat-tu': ['don-dat-hang', 'phieu-de-xuat-vat-tu'],
  'bao-cao-nhan-cong': ['bao-cao-so-che'],
  'bao-cao-nhap-xuat-ton': ['danh-muc-hang-hoa', 'danh-sach-hang-hoa', 'phieu-kho'],
  'bao-cao-so-che': ['bao-cao-nhan-cong', 'du-bao-sl-dong-thung'],
  'bao-tri-sua-chua': ['danh-muc-tai-san', 'thiet-lap-tai-san'],
  'cap-phat-thu-hoi': ['danh-muc-tai-san', 'thiet-lap-tai-san'],
  'danh-muc-tai-san': ['bao-tri-sua-chua', 'cap-phat-thu-hoi', 'thiet-lap-tai-san'],
  'danh-sach-doi-tac': ['phieu-kho'],
  'danh-sach-hang-hoa': ['danh-muc-hang-hoa', 'ton-kho'],
  'de-xuat-mua-hang': ['hang-hoa-phan-thuoc', 'phieu-kho', 'phieu-kho-phan-thuoc', 'thiet-lap-de-xuat-mua-hang'],
  'don-dat-hang': ['danh-sach-doi-tac', 'danh-sach-hang-hoa', 'phieu-de-xuat-vat-tu', 'phieu-kho'],
  'hang-hoa-phan-thuoc': ['ton-kho-phan-thuoc'],
  'khau-hao-tai-san': ['danh-muc-tai-san', 'thiet-lap-tai-san'],
  'kiem-ke-kho': ['danh-muc-hang-hoa', 'danh-sach-hang-hoa', 'phieu-kho', 'ton-kho'],
  'kiem-ke-tai-san': ['danh-muc-tai-san', 'thiet-lap-tai-san'],
  'noi-quan-ly': ['danh-muc-tai-san', 'thiet-lap-tai-san'],
  'phieu-de-xuat-vat-tu': ['danh-sach-hang-hoa', 'don-dat-hang', 'phieu-kho', 'thiet-lap-de-xuat-vat-tu'],
  'phieu-kho': ['danh-sach-doi-tac', 'danh-sach-hang-hoa', 'ton-kho'],
  'phieu-kho-phan-thuoc': ['hang-hoa-phan-thuoc', 'ton-kho-phan-thuoc'],
  'quan-ly-hop-dong': ['danh-sach-doi-tac'],
  'thanh-toan-doi-tac': ['danh-sach-doi-tac', 'thiet-lap-de-xuat-vat-tu'],
  'thiet-lap-tai-san': ['danh-muc-tai-san'],
  'thong-ke-san-xuat': ['bao-cao-nhan-cong', 'bao-cao-so-che', 'du-bao-sl-dong-thung'],
  'ton-kho': ['bao-cao-nhap-xuat-ton', 'phieu-kho'],
  'ton-kho-phan-thuoc': ['hang-hoa-phan-thuoc', 'phieu-kho', 'phieu-kho-phan-thuoc', 'ton-kho'],
};

/** Bao đóng phụ thuộc — đồ thị có chu trình (A↔B) nên phải đánh dấu đã thăm. */
function featureI18nClosure(key: FeatureI18nKey): FeatureI18nKey[] {
  const seen = new Set<FeatureI18nKey>([key]);
  const stack: FeatureI18nKey[] = [key];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const dep of FEATURE_I18N_DEPS[current] ?? []) {
      if (!seen.has(dep)) {
        seen.add(dep);
        stack.push(dep);
      }
    }
  }
  return [...seen];
}

/** Nạp rồi thì thôi — giữ promise để nhiều lời gọi song song dùng chung một request. */
const inFlight = new Map<FeatureI18nKey, Promise<void>>();

function loadOne(key: FeatureI18nKey): Promise<void> {
  let pending = inFlight.get(key);
  if (!pending) {
    pending = FEATURE_I18N_LOADERS[key]()
      .then((mod) => {
        i18n.addResourceBundle('vi', 'translation', mod.default, true, true);
      })
      .catch((err) => {
        // Hỏng locale thì để module vẫn mở được (hiện tên key) còn hơn trắng màn hình.
        inFlight.delete(key);
        console.error(`[feature-i18n] không nạp được locale "${key}":`, err);
      });
    inFlight.set(key, pending);
  }
  return pending;
}

/** Nạp locale của feature + toàn bộ feature mà nó dùng code. */
export async function loadFeatureI18n(key: FeatureI18nKey): Promise<void> {
  await Promise.all(featureI18nClosure(key).map(loadOne));
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
