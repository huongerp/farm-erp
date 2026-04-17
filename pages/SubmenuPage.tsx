import React, { Suspense } from 'react';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import ModulePermissionGuard from '../components/shared/ModulePermissionGuard';
import { getPermissionModuleId, getAllPermissionModules } from '../features/he-thong/phan-quyen/core/permission-modules-config';
import SubmenuPlaceholder from '../components/placeholder/SubmenuPlaceholder';
import ModulePlaceholder from '../components/placeholder/ModulePlaceholder';
import {
  LazyHanhChinhDashboard,
  LazyMuaHangDashboard,
  LazyQuanLyFarmDashboard,
  renderLazySubmenuModule,
  SubmenuChunkFallback,
} from './submenu-lazy-registry';
import { SUBMENU_PATHS, SIDEBAR_MENU } from '../lib/sidebar-menu';
import { getModuleTitleKeyBySlug, HANH_CHINH_MODULE_SLUGS } from '../lib/hanh-chinh-menu';
import { getMuaHangModuleTitleKeyBySlug, MUA_HANG_MODULE_SLUGS } from '../lib/mua-hang-menu';
import { getQuanLyFarmModuleTitleKeyBySlug, QUAN_LY_FARM_MODULE_SLUGS } from '../lib/quan-ly-farm-menu';

const PATH_TO_BREADCRUMB_KEY: Record<string, string> = {
  '/hanh-chinh': 'breadcrumb.hanhChinh',
  '/mua-hang': 'breadcrumb.muaHang',
  '/quan-ly-farm': 'breadcrumb.quanLyFarm',
  '/kho-van': 'breadcrumb.khoVan',
};

function getMenuIcon(path: string) {
  return SIDEBAR_MENU.find((m) => m.path === path)?.icon;
}

const PERMISSION_MODULE_IDS = new Set(getAllPermissionModules().map((m) => m.id));

function wrapWithPermission(basePath: string, slug: string, node: React.ReactNode): React.ReactNode {
  const id = getPermissionModuleId(basePath, slug);
  if (!PERMISSION_MODULE_IDS.has(id)) return node;
  return <ModulePermissionGuard moduleId={id}>{node}</ModulePermissionGuard>;
}

const SubmenuPage: React.FC = () => {
  const { t } = useTranslation();
  const { moduleId } = useParams<{ moduleId?: string }>();
  const location = useLocation();
  const pathname = location.pathname;
  const basePath = SUBMENU_PATHS.find((p) => pathname === p || pathname.startsWith(p + '/'));
  const titleKey = basePath ? PATH_TO_BREADCRUMB_KEY[basePath] : null;
  const title = titleKey ? t(titleKey) : pathname;
  const icon = basePath ? getMenuIcon(basePath) : undefined;

  if (basePath === '/hanh-chinh' && !moduleId) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<SubmenuChunkFallback />}>
          <LazyHanhChinhDashboard />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (basePath === '/mua-hang' && !moduleId) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<SubmenuChunkFallback />}>
          <LazyMuaHangDashboard />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (basePath === '/quan-ly-farm' && !moduleId) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<SubmenuChunkFallback />}>
          <LazyQuanLyFarmDashboard />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (moduleId) {
    const decodedSlug = decodeURIComponent(moduleId);
    let moduleTitle = decodedSlug;

    if ((basePath === '/kho-van' || basePath === '/mua-hang') && decodedSlug === 'danh-sach-nha-cung-cap') {
      return <Navigate to="/mua-hang/danh-sach-doi-tac" replace />;
    }
    if (basePath === '/hanh-chinh') {
      if (decodedSlug === 'giao-viec' || decodedSlug === 'theo-doi-tien-do') {
        return <Navigate to="/hanh-chinh/cong-viec" replace />;
      }
    }
    if (basePath === '/quan-ly-farm' && decodedSlug === 'thu-hoach') {
      return wrapWithPermission(basePath ?? '', decodedSlug, (
        <ErrorBoundary>{renderLazySubmenuModule('thu-hoach')}</ErrorBoundary>
      ));
    }
    if (basePath === '/hanh-chinh' && HANH_CHINH_MODULE_SLUGS.includes(decodedSlug)) {
      const wrapLazy = () => (
        <ErrorBoundary>{renderLazySubmenuModule(decodedSlug)}</ErrorBoundary>
      );
      if (decodedSlug === 'thiet-lap-cong-luong') {
        return wrapWithPermission(basePath ?? '', decodedSlug, wrapLazy());
      }
      if (decodedSlug === 'phieu-hanh-chinh') {
        return wrapWithPermission(basePath ?? '', decodedSlug, wrapLazy());
      }
      if (decodedSlug === 'diem-cong-tru') {
        return wrapWithPermission(basePath ?? '', decodedSlug, wrapLazy());
      }
      if (decodedSlug === 'bang-luong') {
        return wrapWithPermission(basePath ?? '', decodedSlug, wrapLazy());
      }
      if (decodedSlug === 'cong-viec') {
        return wrapWithPermission(basePath ?? '', decodedSlug, wrapLazy());
      }
      if (decodedSlug === 'cong-viec-cua-toi' || decodedSlug === 'cong-viec-toi-quan-ly') {
        const search = location.search || '';
        return <Navigate to={`/hanh-chinh/cong-viec${search}`} replace />;
      }
      if (decodedSlug === 'noi-quan-ly') {
        return wrapWithPermission(basePath ?? '', decodedSlug, wrapLazy());
      }
      if (decodedSlug === 'thiet-lap-tai-san') {
        return wrapWithPermission(basePath ?? '', decodedSlug, wrapLazy());
      }
      if (decodedSlug === 'danh-sach-tai-san') {
        return wrapWithPermission(basePath ?? '', decodedSlug, wrapLazy());
      }
      if (decodedSlug === 'cap-phat-thu-hoi') {
        return wrapWithPermission(basePath ?? '', decodedSlug, wrapLazy());
      }
      if (decodedSlug === 'chi-phi-tai-san') {
        return wrapWithPermission(basePath ?? '', decodedSlug, wrapLazy());
      }
      if (decodedSlug === 'kiem-ke-tai-san') {
        return wrapWithPermission(basePath ?? '', decodedSlug, wrapLazy());
      }
      if (decodedSlug === 'khau-hao-tai-san') {
        return wrapWithPermission(basePath ?? '', decodedSlug, wrapLazy());
      }
      moduleTitle = t(getModuleTitleKeyBySlug(decodedSlug));
    }
    if (basePath === '/mua-hang' && MUA_HANG_MODULE_SLUGS.includes(decodedSlug)) {
      moduleTitle = t(getMuaHangModuleTitleKeyBySlug(decodedSlug));
    }
    const isKhoVanModule =
      decodedSlug === 'danh-muc-hang-hoa' ||
      decodedSlug === 'danh-sach-kho' ||
      decodedSlug === 'danh-sach-hang-hoa' ||
      decodedSlug === 'danh-sach-doi-tac' ||
      decodedSlug === 'phieu-kho' ||
      decodedSlug === 'phieu-de-xuat-vat-tu' ||
      decodedSlug === 'ton-kho' ||
      decodedSlug === 'bao-cao-nhap-xuat-ton' ||
      decodedSlug === 'kiem-ke-kho';
    if ((basePath === '/kho-van' || basePath === '/mua-hang') && isKhoVanModule) {
      const wrap = (node: React.ReactNode) => wrapWithPermission(basePath === '/kho-van' ? '/kho-van' : '/mua-hang', decodedSlug, node);
      const body = renderLazySubmenuModule(decodedSlug);
      if (body) {
        return wrap(<ErrorBoundary>{body}</ErrorBoundary>);
      }
    }
    if (basePath === '/mua-hang' && decodedSlug === 'don-dat-hang') {
      return wrapWithPermission(basePath ?? '', decodedSlug, (
        <ErrorBoundary>{renderLazySubmenuModule('don-dat-hang')}</ErrorBoundary>
      ));
    }
    if (basePath === '/mua-hang' && decodedSlug === 'thiet-lap-de-xuat-vat-tu') {
      return wrapWithPermission(basePath ?? '', decodedSlug, (
        <ErrorBoundary>{renderLazySubmenuModule('thiet-lap-de-xuat-vat-tu')}</ErrorBoundary>
      ));
    }
    if (basePath === '/mua-hang' && decodedSlug === 'thanh-toan-doi-tac') {
      return wrapWithPermission(basePath ?? '', decodedSlug, (
        <ErrorBoundary>{renderLazySubmenuModule('thanh-toan-doi-tac')}</ErrorBoundary>
      ));
    }
    if (basePath === '/mua-hang' && decodedSlug === 'quan-ly-hop-dong') {
      return wrapWithPermission(basePath ?? '', decodedSlug, (
        <ErrorBoundary>{renderLazySubmenuModule('quan-ly-hop-dong')}</ErrorBoundary>
      ));
    }
    if (basePath === '/mua-hang' && decodedSlug === 'bao-cao-de-xuat-vat-tu') {
      return wrapWithPermission(basePath ?? '', decodedSlug, (
        <ErrorBoundary>{renderLazySubmenuModule('bao-cao-de-xuat-vat-tu')}</ErrorBoundary>
      ));
    }
    if (basePath === '/quan-ly-farm' && QUAN_LY_FARM_MODULE_SLUGS.includes(decodedSlug)) {
      moduleTitle = t(getQuanLyFarmModuleTitleKeyBySlug(decodedSlug));
    }
    return (
      <ModulePlaceholder
        submenuPath={basePath ?? '/'}
        submenuTitle={title}
        moduleTitle={moduleTitle}
        icon={icon}
      />
    );
  }

  return <SubmenuPlaceholder title={title} icon={icon} />;
};

export default SubmenuPage;
