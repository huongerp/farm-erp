
import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { HANH_CHINH_MODULE_SLUGS, getModuleTitleKeyBySlug } from '../../lib/hanh-chinh-menu';
import { NHAN_SU_MODULE_SLUGS, getNhanSuModuleTitleKeyBySlug } from '../../lib/nhan-su-menu';
import { MARKETING_MODULE_SLUGS, getMarketingModuleTitleKeyBySlug } from '../../lib/marketing-menu';
import { TAI_CHINH_MODULE_SLUGS, getTaiChinhModuleTitleKeyBySlug } from '../../lib/tai-chinh-menu';
import { MUA_HANG_MODULE_SLUGS, getMuaHangModuleTitleKeyBySlug } from '../../lib/mua-hang-menu';
import { DIEU_HANH_MODULE_SLUGS, getDieuHanhModuleTitleKeyBySlug } from '../../lib/dieu-hanh-menu';

interface RouteConfig {
  label: string;
  parentPath?: string;
  icon?: React.ReactNode;
}

// Cấu hình đường dẫn – uses t() for i18n
  const getRouteConfig = (t: TFunction): Record<string, RouteConfig> => {
  const hanhChinhModuleRoutes = Object.fromEntries(
    HANH_CHINH_MODULE_SLUGS.map((slug) => [
      `/hanh-chinh/${slug}`,
      { label: t(getModuleTitleKeyBySlug(slug)), parentPath: '/hanh-chinh' },
    ])
  );
  const nhanSuModuleRoutes = Object.fromEntries(
    NHAN_SU_MODULE_SLUGS.map((slug) => [
      `/nhan-su/${slug}`,
      { label: t(getNhanSuModuleTitleKeyBySlug(slug)), parentPath: '/nhan-su' },
    ])
  );
  const marketingModuleRoutes = Object.fromEntries(
    MARKETING_MODULE_SLUGS.map((slug) => [
      `/marketing/${slug}`,
      { label: t(getMarketingModuleTitleKeyBySlug(slug)), parentPath: '/marketing' },
    ])
  );
  const taiChinhModuleRoutes = Object.fromEntries(
    TAI_CHINH_MODULE_SLUGS.map((slug) => [
      `/tai-chinh/${slug}`,
      { label: t(getTaiChinhModuleTitleKeyBySlug(slug)), parentPath: '/tai-chinh' },
    ])
  );
  const muaHangModuleRoutes = Object.fromEntries(
    MUA_HANG_MODULE_SLUGS.map((slug) => [
      `/mua-hang/${slug}`,
      { label: t(getMuaHangModuleTitleKeyBySlug(slug)), parentPath: '/mua-hang' },
    ])
  );
  const dieuHanhModuleRoutes = Object.fromEntries(
    DIEU_HANH_MODULE_SLUGS.map((slug) => [
      `/dieu-hanh/${slug}`,
      { label: t(getDieuHanhModuleTitleKeyBySlug(slug)), parentPath: '/dieu-hanh' },
    ])
  );
  return {
    // --- GỐC ---
    '/': { label: t('breadcrumb.home') },
    '/thong-tin-ban-quyen': { label: t('breadcrumb.licenseInfo'), parentPath: '/' },

    // --- DASHBOARDS / SUBMENU (parent = Trang chủ) ---
    '/dieu-hanh': { label: t('breadcrumb.dieuHanh'), parentPath: '/' },
    '/he-thong': { label: t('breadcrumb.systemAdmin'), parentPath: '/' },
    '/hanh-chinh': { label: t('breadcrumb.hanhChinh'), parentPath: '/' },
    '/nhan-su': { label: t('breadcrumb.nhanSu'), parentPath: '/' },
    '/marketing': { label: t('breadcrumb.marketing'), parentPath: '/' },
    '/tai-chinh': { label: t('breadcrumb.taiChinh'), parentPath: '/' },
    '/mua-hang': { label: t('breadcrumb.muaHang'), parentPath: '/' },
    '/thiet-bi': { label: t('breadcrumb.deviceManagement') },

    // --- THIẾT BỊ ---
    '/thiet-bi/danh-sach': { label: t('breadcrumb.deviceList'), parentPath: '/thiet-bi' },
    '/thiet-bi/nhom-tai-san': { label: t('breadcrumb.assetGroup'), parentPath: '/thiet-bi' },
    '/thiet-bi/kiem-ke': { label: t('breadcrumb.inventoryCheck'), parentPath: '/thiet-bi' },
    '/thiet-bi/in-tem': { label: t('breadcrumb.barcodePrint'), parentPath: '/thiet-bi' },
    '/thiet-bi/bao-tri': { label: t('breadcrumb.maintenance'), parentPath: '/thiet-bi' },
    '/thiet-bi/linh-kien': { label: t('breadcrumb.spareParts'), parentPath: '/thiet-bi' },
    '/thiet-bi/tra-cuu': { label: t('breadcrumb.quickSearch'), parentPath: '/thiet-bi' },
    '/thiet-bi/bao-cao-khau-hao': { label: t('breadcrumb.depreciationReport'), parentPath: '/thiet-bi' },
    '/thiet-bi/bao-cao': { label: t('breadcrumb.operationReport'), parentPath: '/thiet-bi' },
    '/thiet-bi/vi-tri': { label: t('breadcrumb.locationSetup'), parentPath: '/thiet-bi' },
    '/thiet-bi/luan-chuyen': { label: t('breadcrumb.transferHandover'), parentPath: '/thiet-bi' },

    // --- HỆ THỐNG ---
    '/nhan-vien': { label: t('breadcrumb.employee'), parentPath: '/he-thong' },
    '/phong-ban': { label: t('breadcrumb.department'), parentPath: '/he-thong' },
    '/chuc-vu': { label: t('breadcrumb.position'), parentPath: '/he-thong' },
    '/chuc-nang-nhiem-vu': { label: t('breadcrumb.chucNangNhiemVu'), parentPath: '/he-thong' },
    '/cap-bac': { label: t('breadcrumb.jobLevel'), parentPath: '/he-thong' },
    '/thong-tin-cong-ty': { label: t('breadcrumb.companyInfo'), parentPath: '/he-thong' },
    '/chi-nhanh': { label: t('breadcrumb.branch'), parentPath: '/he-thong' },
    '/sao-luu': { label: t('breadcrumb.backup'), parentPath: '/he-thong' },
    '/thiet-bi-dang-nhap': { label: t('breadcrumb.loginDevices'), parentPath: '/he-thong' },
    '/phan-quyen': { label: t('breadcrumb.permission'), parentPath: '/he-thong' },

    // --- HÀNH CHÍNH (module con) ---
    ...hanhChinhModuleRoutes,

    // --- NHÂN SỰ (module con) ---
    ...nhanSuModuleRoutes,

    // --- MARKETING (module con) ---
    ...marketingModuleRoutes,

    // --- TÀI CHÍNH (module con) ---
    ...taiChinhModuleRoutes,

    // --- MUA HÀNG (module con, gồm cả quản lý kho) ---
    ...muaHangModuleRoutes,

    // --- ĐIỀU HÀNH (module con) ---
    ...dieuHanhModuleRoutes,

    // --- KHÁC ---
    '/tro-ly-ai': { label: t('breadcrumb.aiAssistant'), parentPath: '/' },
    '/ho-so': { label: t('breadcrumb.profile') },
    '/cai-dat': { label: t('breadcrumb.settings') },
    '/thong-bao': { label: t('notification.title') },
  };
};

/** Trả về parent path của pathname (để nút Back bottom nav). Trang chủ (/) trả về undefined. */
export function getParentPath(pathname: string, t: TFunction): string | undefined {
  if (pathname === '/') return undefined;
  const config = getRouteConfig(t);
  const exact = config[pathname]?.parentPath;
  if (exact !== undefined) return exact;
  if (pathname.endsWith('/huong-dan')) return pathname.replace(/\/huong-dan$/, '');
  return undefined;
}

interface BreadcrumbItem {
  label: string;
  to: string;
  isLast: boolean;
}

const Breadcrumbs: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const ROUTE_CONFIG = useMemo(() => getRouteConfig(t), [t]);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const currentPath = location.pathname;
    const items: BreadcrumbItem[] = [];

    // Thiết lập khóa học: Nhân sự > Khóa đào tạo > Thiết lập
    const thietLapMatch = currentPath.match(/^\/nhan-su\/khoa-dao-tao\/thiet-lap\/[^/]+$/);
    if (thietLapMatch) {
      const nhanSuLabel = ROUTE_CONFIG['/nhan-su']?.label ?? t('breadcrumb.nhanSu');
      const khoaDaoTaoLabel = ROUTE_CONFIG['/nhan-su/khoa-dao-tao']?.label ?? t('page.nhanSu.modules.khoaDaoTao');
      items.push(
        { label: ROUTE_CONFIG['/']?.label ?? t('breadcrumb.home'), to: '/', isLast: false },
        { label: nhanSuLabel, to: '/nhan-su', isLast: false },
        { label: khoaDaoTaoLabel, to: '/nhan-su/khoa-dao-tao', isLast: false },
        { label: t('thietLapKhoa.breadcrumb'), to: currentPath, isLast: true }
      );
      return items;
    }
    // Học khóa: Nhân sự > Đăng ký đào tạo > Học khóa
    const hocKhoaMatch = currentPath.match(/^\/nhan-su\/dang-ky-dao-tao\/hoc\/[^/]+$/);
    if (hocKhoaMatch) {
      const nhanSuLabel = ROUTE_CONFIG['/nhan-su']?.label ?? t('breadcrumb.nhanSu');
      const dangKyLabel = ROUTE_CONFIG['/nhan-su/dang-ky-dao-tao']?.label ?? t('page.nhanSu.modules.dangKyDaoTao');
      items.push(
        { label: ROUTE_CONFIG['/']?.label ?? t('breadcrumb.home'), to: '/', isLast: false },
        { label: nhanSuLabel, to: '/nhan-su', isLast: false },
        { label: dangKyLabel, to: '/nhan-su/dang-ky-dao-tao', isLast: false },
        { label: t('dangKyDaoTao.hoc.breadcrumb'), to: currentPath, isLast: true }
      );
      return items;
    }

    let currentConfig = ROUTE_CONFIG[currentPath];
    if (!currentConfig && currentPath.endsWith('/huong-dan')) {
      currentConfig = {
        label: t('guide.breadcrumbLabel'),
        parentPath: currentPath.replace(/\/huong-dan$/, ''),
      };
    }

    if (currentConfig) {
      items.unshift({
        label: currentConfig.label,
        to: currentPath,
        isLast: true
      });

      if (currentConfig.parentPath) {
        const parentConfig = ROUTE_CONFIG[currentConfig.parentPath];
        if (parentConfig) {
          items.unshift({
            label: parentConfig.label,
            to: currentConfig.parentPath,
            isLast: false
          });
        }
      }
    } else {
      const pathnames = currentPath.split('/').filter((x) => x);
      pathnames.forEach((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label = ROUTE_CONFIG[to]?.label || value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
        items.push({
          label,
          to,
          isLast: index === pathnames.length - 1
        });
      });
      // Thêm Trang chủ vào đầu nếu segment đầu có parentPath: '/'
      if (items.length > 0) {
        const firstPath = items[0].to;
        const firstConfig = ROUTE_CONFIG[firstPath];
        if (firstConfig?.parentPath === '/' && ROUTE_CONFIG['/']) {
          items.unshift({
            label: ROUTE_CONFIG['/'].label,
            to: '/',
            isLast: false
          });
        }
      }
    }

    return items;
  }, [location.pathname, ROUTE_CONFIG]);

  // Trang chủ - icon Home + Trang chủ theo pattern
  if (location.pathname === '/') {
    return (
      <nav aria-label={t('breadcrumb.label')}>
        <ol className="flex items-center gap-1 flex-nowrap overflow-hidden">
          <li className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-md text-primary" aria-hidden>
              <Home size={14} />
            </span>
            <span
              className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center whitespace-nowrap shadow-sm shadow-primary/20"
              aria-current="page"
            >
              {t('breadcrumb.home')}
            </span>
          </li>
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label={t('breadcrumb.label')}>
      <ol className="flex items-center gap-1 flex-nowrap overflow-hidden">
        {/* Home Icon */}
        <li className={`flex items-center ${breadcrumbs.length > 1 ? 'hidden md:flex' : 'flex'}`}>
          <Link 
            to="/" 
            className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            title={t('breadcrumb.goHome')}
          >
            <Home size={14} />
          </Link>
        </li>

        {breadcrumbs.map((crumb, index) => {
          const isHiddenOnMobile = breadcrumbs.length > 2 && index < breadcrumbs.length - 2;

          let separatorClass = "text-muted-foreground shrink-0";
          if (index === 0 && breadcrumbs.length > 1) {
              separatorClass += " hidden md:block";
          }

          return (
            <li 
              key={crumb.to} 
              className={`flex items-center gap-1 ${isHiddenOnMobile ? 'hidden md:flex' : 'flex'}`}
            >
              <ChevronRight size={12} className={separatorClass} />
              
              {crumb.isLast ? (
                <span 
                  className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center whitespace-nowrap shadow-sm shadow-primary/20"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="px-2 py-0.5 rounded-md text-muted-foreground hover:text-primary text-xs font-normal transition-all whitespace-nowrap"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default React.memo(Breadcrumbs);
