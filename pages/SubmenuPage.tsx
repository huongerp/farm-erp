import React from 'react';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import ModulePermissionGuard from '../components/shared/ModulePermissionGuard';
import { getPermissionModuleId, getAllPermissionModules } from '../features/he-thong/phan-quyen/core/permission-modules-config';
import SubmenuPlaceholder from '../components/placeholder/SubmenuPlaceholder';
import ModulePlaceholder from '../components/placeholder/ModulePlaceholder';
import HanhChinhDashboard from './dashboards/HanhChinhDashboard';
import MuaHangDashboard from './dashboards/MuaHangDashboard';
import QuanLyFarmDashboard from './dashboards/QuanLyFarmDashboard';
import PayrollSetupPage from '../features/hanh-chinh/thiet-lap-cong-luong';
import AdminFormPage from '../features/hanh-chinh/phieu-hanh-chinh';
import DiemCongTruPage from '../features/hanh-chinh/diem-cong-tru';
import BangLuongPage from '../features/hanh-chinh/bang-luong';
import NoiQuanLyPage from '../features/hanh-chinh/noi-quan-ly';
import ThietLapTaiSanPage from '../features/hanh-chinh/thiet-lap-tai-san';
import DanhSachTaiSanPage from '../features/hanh-chinh/danh-muc-tai-san';
import CapPhatThuHoiPage from '../features/hanh-chinh/cap-phat-thu-hoi';
import BaoTriSuaChuaPage from '../features/hanh-chinh/bao-tri-sua-chua';
import KiemKeTaiSanPage from '../features/hanh-chinh/kiem-ke-tai-san';
import KhauHaoTaiSanPage from '../features/hanh-chinh/khau-hao-tai-san';
import { SUBMENU_PATHS, SIDEBAR_MENU } from '../lib/sidebar-menu';
import { getModuleTitleKeyBySlug, HANH_CHINH_MODULE_SLUGS } from '../lib/hanh-chinh-menu';
import { getMuaHangModuleTitleKeyBySlug, MUA_HANG_MODULE_SLUGS } from '../lib/mua-hang-menu';
import { getQuanLyFarmModuleTitleKeyBySlug, QUAN_LY_FARM_MODULE_SLUGS } from '../lib/quan-ly-farm-menu';
import DanhSachKhoPage from '../features/kho-van/danh-sach-kho';
import DanhSachDoiTacPage from '../features/kho-van/danh-sach-doi-tac';
import PhieuKhoPage from '../features/kho-van/phieu-kho';
import TonKhoPage from '../features/kho-van/ton-kho';
import DanhMucHangHoaPage from '../features/kho-van/danh-muc-hang-hoa';
import DanhSachHangHoaPage from '../features/kho-van/danh-sach-hang-hoa';
import BaoCaoNhapXuatTonPage from '../features/kho-van/bao-cao-nhap-xuat-ton';
import KiemKeKhoPage from '../features/kho-van/kiem-ke-kho';
import PhieuDeXuatVatTuPage from '../features/kho-van/phieu-de-xuat-vat-tu';
import DonDatHangPage from '../features/mua-hang/don-dat-hang';
import ThietLapDeXuatVatTuPage from '../features/mua-hang/thiet-lap-de-xuat-vat-tu';
import ThanhToanDoiTacPage from '../features/mua-hang/thanh-toan-doi-tac';
import BaoCaoDeXuatVatTuPage from '../features/mua-hang/bao-cao-de-xuat-vat-tu';
import ThuHoachPage from '../features/quan-ly-farm/thu-hoach';
import CongViecPage from '../features/hanh-chinh/cong-viec';

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
        <HanhChinhDashboard />
      </ErrorBoundary>
    );
  }
  if (basePath === '/mua-hang' && !moduleId) {
    return (
      <ErrorBoundary>
        <MuaHangDashboard />
      </ErrorBoundary>
    );
  }
  if (basePath === '/quan-ly-farm' && !moduleId) {
    return (
      <ErrorBoundary>
        <QuanLyFarmDashboard />
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
        <ErrorBoundary>
          <ThuHoachPage />
        </ErrorBoundary>
      ));
    }
    if (basePath === '/hanh-chinh' && HANH_CHINH_MODULE_SLUGS.includes(decodedSlug)) {
      if (decodedSlug === 'thiet-lap-cong-luong') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <PayrollSetupPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'phieu-hanh-chinh') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <AdminFormPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'diem-cong-tru') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <DiemCongTruPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'bang-luong') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <BangLuongPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'cong-viec') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <CongViecPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'cong-viec-cua-toi' || decodedSlug === 'cong-viec-toi-quan-ly') {
        const search = location.search || '';
        return <Navigate to={`/hanh-chinh/cong-viec${search}`} replace />;
      }
      if (decodedSlug === 'noi-quan-ly') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <NoiQuanLyPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'thiet-lap-tai-san') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <ThietLapTaiSanPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'danh-sach-tai-san') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <DanhSachTaiSanPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'cap-phat-thu-hoi') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <CapPhatThuHoiPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'chi-phi-tai-san') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <BaoTriSuaChuaPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'kiem-ke-tai-san') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <KiemKeTaiSanPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'khau-hao-tai-san') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <KhauHaoTaiSanPage />
          </ErrorBoundary>
        ));
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
      if (decodedSlug === 'danh-muc-hang-hoa') {
        return wrap(<ErrorBoundary><DanhMucHangHoaPage /></ErrorBoundary>);
      }
      if (decodedSlug === 'danh-sach-kho') {
        return wrap(<ErrorBoundary><DanhSachKhoPage /></ErrorBoundary>);
      }
      if (decodedSlug === 'danh-sach-hang-hoa') {
        return wrap(<ErrorBoundary><DanhSachHangHoaPage /></ErrorBoundary>);
      }
      if (decodedSlug === 'danh-sach-doi-tac') {
        return wrap(<ErrorBoundary><DanhSachDoiTacPage /></ErrorBoundary>);
      }
      if (decodedSlug === 'phieu-kho') {
        return wrap(<ErrorBoundary><PhieuKhoPage /></ErrorBoundary>);
      }
      if (decodedSlug === 'phieu-de-xuat-vat-tu') {
        return wrap(<ErrorBoundary><PhieuDeXuatVatTuPage /></ErrorBoundary>);
      }
      if (decodedSlug === 'ton-kho') {
        return wrap(<ErrorBoundary><TonKhoPage /></ErrorBoundary>);
      }
      if (decodedSlug === 'bao-cao-nhap-xuat-ton') {
        return wrap(<ErrorBoundary><BaoCaoNhapXuatTonPage /></ErrorBoundary>);
      }
      if (decodedSlug === 'kiem-ke-kho') {
        return wrap(<ErrorBoundary><KiemKeKhoPage /></ErrorBoundary>);
      }
    } else if (basePath === '/mua-hang' && decodedSlug === 'don-dat-hang') {
      return wrapWithPermission(basePath ?? '', decodedSlug, (
        <ErrorBoundary>
          <DonDatHangPage />
        </ErrorBoundary>
      ));
    } else if (basePath === '/mua-hang' && decodedSlug === 'thiet-lap-de-xuat-vat-tu') {
      return wrapWithPermission(basePath ?? '', decodedSlug, (
        <ErrorBoundary>
          <ThietLapDeXuatVatTuPage />
        </ErrorBoundary>
      ));
    } else if (basePath === '/mua-hang' && decodedSlug === 'thanh-toan-doi-tac') {
      return wrapWithPermission(basePath ?? '', decodedSlug, (
        <ErrorBoundary>
          <ThanhToanDoiTacPage />
        </ErrorBoundary>
      ));
    } else if (basePath === '/mua-hang' && decodedSlug === 'bao-cao-de-xuat-vat-tu') {
      return wrapWithPermission(basePath ?? '', decodedSlug, (
        <ErrorBoundary>
          <BaoCaoDeXuatVatTuPage />
        </ErrorBoundary>
      ));
    } else if (basePath === '/quan-ly-farm' && QUAN_LY_FARM_MODULE_SLUGS.includes(decodedSlug)) {
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
