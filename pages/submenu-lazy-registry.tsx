import React, { lazy, Suspense } from 'react';

/** Hàm import thuần — dùng cho prefetch (hover) trước khi React.lazy chạy. */
export const SUBMENU_MODULE_IMPORTS = {
  'thiet-lap-cong-luong': () => import('../features/hanh-chinh/thiet-lap-cong-luong'),
  'phieu-hanh-chinh': () => import('../features/hanh-chinh/phieu-hanh-chinh'),
  'diem-cong-tru': () => import('../features/hanh-chinh/diem-cong-tru'),
  'bang-luong': () => import('../features/hanh-chinh/bang-luong'),
  'cong-viec': () => import('../features/hanh-chinh/cong-viec'),
  'noi-quan-ly': () => import('../features/hanh-chinh/noi-quan-ly'),
  'thiet-lap-tai-san': () => import('../features/hanh-chinh/thiet-lap-tai-san'),
  'danh-sach-tai-san': () => import('../features/hanh-chinh/danh-muc-tai-san'),
  'cap-phat-thu-hoi': () => import('../features/hanh-chinh/cap-phat-thu-hoi'),
  'chi-phi-tai-san': () => import('../features/hanh-chinh/bao-tri-sua-chua'),
  'kiem-ke-tai-san': () => import('../features/hanh-chinh/kiem-ke-tai-san'),
  'khau-hao-tai-san': () => import('../features/hanh-chinh/khau-hao-tai-san'),
  'danh-muc-hang-hoa': () => import('../features/kho-van/danh-muc-hang-hoa'),
  'danh-sach-kho': () => import('../features/kho-van/danh-sach-kho'),
  'danh-sach-hang-hoa': () => import('../features/kho-van/danh-sach-hang-hoa'),
  'danh-sach-doi-tac': () => import('../features/kho-van/danh-sach-doi-tac'),
  'phieu-kho': () => import('../features/kho-van/phieu-kho'),
  'phieu-de-xuat-vat-tu': () => import('../features/kho-van/phieu-de-xuat-vat-tu'),
  'ton-kho': () => import('../features/kho-van/ton-kho'),
  'bao-cao-nhap-xuat-ton': () => import('../features/kho-van/bao-cao-nhap-xuat-ton'),
  'kiem-ke-kho': () => import('../features/kho-van/kiem-ke-kho'),
  'don-dat-hang': () => import('../features/mua-hang/don-dat-hang'),
  'thiet-lap-de-xuat-vat-tu': () => import('../features/mua-hang/thiet-lap-de-xuat-vat-tu'),
  'thanh-toan-doi-tac': () => import('../features/mua-hang/thanh-toan-doi-tac'),
  'quan-ly-hop-dong': () => import('../features/mua-hang/quan-ly-hop-dong'),
  'bao-cao-de-xuat-vat-tu': () => import('../features/mua-hang/bao-cao-de-xuat-vat-tu'),
  'thu-hoach': () => import('../features/quan-ly-farm/thu-hoach'),
  'hang-hoa-phan-thuoc': () => import('../features/quan-ly-farm/hang-hoa-phan-thuoc'),
  'phieu-kho-phan-thuoc': () => import('../features/quan-ly-farm/phieu-kho-phan-thuoc'),
  'ton-kho-phan-thuoc': () => import('../features/quan-ly-farm/ton-kho-phan-thuoc'),
} as const;

export type SubmenuLazySlug = keyof typeof SUBMENU_MODULE_IMPORTS;

/** Prefetch chunk JS của một module (gọi khi hover / focus vào thẻ). */
export function prefetchSubmenuModuleSlug(slug: string): void {
  const fn = SUBMENU_MODULE_IMPORTS[slug as SubmenuLazySlug];
  if (fn) void fn();
}

const DASHBOARD_IMPORTS = {
  '/hanh-chinh': () => import('./dashboards/HanhChinhDashboard'),
  '/mua-hang': () => import('./dashboards/MuaHangDashboard'),
  '/quan-ly-farm': () => import('./dashboards/QuanLyFarmDashboard'),
} as const;

export function prefetchSubmenuDashboardForBase(basePath: keyof typeof DASHBOARD_IMPORTS): void {
  void DASHBOARD_IMPORTS[basePath]();
}

/** Skeleton full vùng nội dung — cảm giác đã chuyển trang ngay (không chỉ spinner nhỏ). */
export const SubmenuChunkFallback = () => (
  <div
    className="flex flex-col min-h-[calc(100dvh-7rem)] w-full animate-in fade-in duration-150"
    aria-busy="true"
    aria-label="Đang mở module"
  >
    <div className="shrink-0 h-10 w-48 max-w-[60%] rounded-lg bg-muted/80 animate-pulse mb-6" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 content-start">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          <div className="h-11 w-11 rounded-xl bg-muted animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-muted/90 animate-pulse" />
          <div className="h-3 w-full rounded bg-muted/70 animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-muted/60 animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

export const LazyHanhChinhDashboard = lazy(() => import('./dashboards/HanhChinhDashboard'));
export const LazyMuaHangDashboard = lazy(() => import('./dashboards/MuaHangDashboard'));
export const LazyQuanLyFarmDashboard = lazy(() => import('./dashboards/QuanLyFarmDashboard'));

export const SUBMENU_MODULE_LAZY = Object.fromEntries(
  (Object.entries(SUBMENU_MODULE_IMPORTS) as [SubmenuLazySlug, (typeof SUBMENU_MODULE_IMPORTS)[SubmenuLazySlug]][]).map(
    ([k, loader]) => [k, lazy(loader)]
  )
) as { [K in SubmenuLazySlug]: React.LazyExoticComponent<React.FC> };

export function renderLazySubmenuModule(slug: string): React.ReactNode {
  const Comp = SUBMENU_MODULE_LAZY[slug as SubmenuLazySlug];
  if (!Comp) return null;
  return (
    <Suspense fallback={<SubmenuChunkFallback />}>
      <Comp />
    </Suspense>
  );
}
