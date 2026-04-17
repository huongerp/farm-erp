/**
 * Prefetch chunk route + dashboard + module khi user hover / focus (trước khi click).
 * Giảm thời gian chờ sau khi URL đã đổi — JS thường đã có trong cache.
 */
import {
  prefetchSubmenuModuleSlug,
  prefetchSubmenuDashboardForBase,
} from '../pages/submenu-lazy-registry';

/** Shell SubmenuPage (route matcher) — luôn prefetch cùng dashboard khi vào submenu. */
export function prefetchSubmenuPageChunk(): void {
  void import('../pages/SubmenuPage');
}

const BASE_TO_DASH: Record<string, '/hanh-chinh' | '/mua-hang' | '/quan-ly-farm'> = {
  'hanh-chinh': '/hanh-chinh',
  'mua-hang': '/mua-hang',
  'quan-ly-farm': '/quan-ly-farm',
};

/**
 * Gọi khi hover link tới `/hanh-chinh/...`, `/mua-hang/...`, v.v.
 * Không await — tránh chặn UI.
 */
export function warmupNavigationTarget(path: string): void {
  const clean = path.split('?')[0].split('#')[0];
  const parts = clean.replace(/^\//, '').split('/').filter(Boolean);
  if (parts.length === 0) return;

  prefetchSubmenuPageChunk();

  const baseSeg = parts[0];
  const dashBase = BASE_TO_DASH[baseSeg];
  if (dashBase) {
    prefetchSubmenuDashboardForBase(dashBase);
    if (parts[1] && parts[1] !== 'huong-dan') {
      prefetchSubmenuModuleSlug(decodeURIComponent(parts[1]));
    }
    return;
  }

  if (baseSeg === 'kho-van' && parts[1]) {
    prefetchSubmenuModuleSlug(decodeURIComponent(parts[1]));
  }

  if (baseSeg === 'he-thong') {
    void import('../pages/dashboards/SystemDashboard');
  }
}
