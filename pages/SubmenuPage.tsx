import React from 'react';
import { useParams, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import ModulePermissionGuard from '../components/shared/ModulePermissionGuard';
import { getPermissionModuleId, getAllPermissionModules } from '../features/he-thong/phan-quyen/core/permission-modules-config';
import SubmenuPlaceholder from '../components/placeholder/SubmenuPlaceholder';
import ModulePlaceholder from '../components/placeholder/ModulePlaceholder';
import HanhChinhDashboard from './dashboards/HanhChinhDashboard';
import NhanSuDashboard from './dashboards/NhanSuDashboard';
import KinDoanhDashboard from './dashboards/KinhDoanhDashboard';
import MarketingDashboard from './dashboards/MarketingDashboard';
import TaiChinhDashboard from './dashboards/TaiChinhDashboard';
import MuaHangDashboard from './dashboards/MuaHangDashboard';
import QuanLyFarmDashboard from './dashboards/QuanLyFarmDashboard';
import DieuHanhDashboard from './dashboards/DieuHanhDashboard';
import PayrollSetupPage from '../features/hanh-chinh/thiet-lap-cong-luong';
import AdminFormPage from '../features/hanh-chinh/phieu-hanh-chinh';
import AttendancePage from '../features/hanh-chinh/cham-cong';
import AttendanceManagementPage from '../features/hanh-chinh/tong-hop-cham-cong';
import DiemCongTruPage from '../features/hanh-chinh/diem-cong-tru';
import ChamDiemKpiPage from '../features/hanh-chinh/cham-diem-kpi';
import BangLuongPage from '../features/hanh-chinh/bang-luong';
import ThietLapCongViecPage from '../features/hanh-chinh/thiet-lap-cong-viec';
import ThietLapTaiLieuPage from '../features/hanh-chinh/thiet-lap-tai-lieu';
import TaiLieuPage from '../features/hanh-chinh/tai-lieu';
import LuuTruHoSoPage from '../features/hanh-chinh/luu-tru-ho-so';
import DuAnPage from '../features/hanh-chinh/du-an';
import CongViecPage from '../features/hanh-chinh/cong-viec';
import BaoCaoPage from '../features/hanh-chinh/bao-cao';
import NoiQuanLyPage from '../features/hanh-chinh/noi-quan-ly';
import ThietLapTaiSanPage from '../features/hanh-chinh/thiet-lap-tai-san';
import DanhSachTaiSanPage from '../features/hanh-chinh/danh-muc-tai-san';
import CapPhatThuHoiPage from '../features/hanh-chinh/cap-phat-thu-hoi';
import BaoTriSuaChuaPage from '../features/hanh-chinh/bao-tri-sua-chua';
import KiemKeTaiSanPage from '../features/hanh-chinh/kiem-ke-tai-san';
import KhauHaoTaiSanPage from '../features/hanh-chinh/khau-hao-tai-san';
import ThietLapTuyenDungPage from '../features/nhan-su/thiet-lap-tuyen-dung';
import DeXuatTuyenDungPage from '../features/nhan-su/de-xuat-tuyen-dung';
import UngVienPage from '../features/nhan-su/ung-vien';
import LichPhongVanPage from '../features/nhan-su/lich-phong-van';
import ThuGuiUngVienPage from '../features/nhan-su/thu-gui-ung-vien';
import HopDongPage from '../features/nhan-su/hop-dong';
import BaoCaoTuyenDungPage from '../features/nhan-su/bao-cao-tuyen-dung';
import ThietLapDaoTaoPage from '../features/nhan-su/thiet-lap-dao-tao';
import KhoaDaoTaoPage from '../features/nhan-su/khoa-dao-tao';
import DangKyDaoTaoPage from '../features/nhan-su/dang-ky-dao-tao';
import BaoCaoDaoTaoPage from '../features/nhan-su/bao-cao-dao-tao';
import KeHoachDaoTaoPage from '../features/nhan-su/ke-hoach-dao-tao';
import { SUBMENU_PATHS, SIDEBAR_MENU } from '../lib/sidebar-menu';
import { getModuleTitleKeyBySlug, HANH_CHINH_MODULE_SLUGS } from '../lib/hanh-chinh-menu';
import { getNhanSuModuleTitleKeyBySlug, NHAN_SU_MODULE_SLUGS } from '../lib/nhan-su-menu';
import { getKinhDoanhModuleTitleKeyBySlug, KINH_DOANH_MODULE_SLUGS } from '../lib/kinh-doanh-menu';
import { getMarketingModuleTitleKeyBySlug, MARKETING_MODULE_SLUGS } from '../lib/marketing-menu';
import { getTaiChinhModuleTitleKeyBySlug, TAI_CHINH_MODULE_SLUGS } from '../lib/tai-chinh-menu';
import DanhMucTaiChinhPage from '../features/tai-chinh/danh-muc-tai-chinh';
import TaiKhoanPage from '../features/tai-chinh/tai-khoan';
import DeXuatChiPhiPage from '../features/tai-chinh/de-xuat-chi-phi';
import KeHoachChiPhiPage from '../features/tai-chinh/ke-hoach-chi-phi';
import ThuChiPage from '../features/tai-chinh/thu-chi';
import BaoCaoTaiChinhPage from '../features/tai-chinh/bao-cao-tai-chinh';
import { getMuaHangModuleTitleKeyBySlug, MUA_HANG_MODULE_SLUGS } from '../lib/mua-hang-menu';
import { getQuanLyFarmModuleTitleKeyBySlug, QUAN_LY_FARM_MODULE_SLUGS } from '../lib/quan-ly-farm-menu';
import { getKhoVanModuleTitleKeyBySlug, KHO_VAN_MODULE_SLUGS } from '../lib/kho-van-menu';
import { getDieuHanhModuleTitleKeyBySlug, DIEU_HANH_MODULE_SLUGS } from '../lib/dieu-hanh-menu';
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
import SuMenhTamNhinPage from '../features/dieu-hanh/su-menh-tam-nhin';
import TamNhinQuyMoThiPhanPage from '../features/dieu-hanh/tam-nhin-quy-mo-thi-phan';
import PhanTichSwotPage from '../features/dieu-hanh/phan-tich-swot';
import PhanTichDoiThuPage from '../features/dieu-hanh/phan-tich-doi-thu';
import ChienLuocPage from '../features/dieu-hanh/chien-luoc';
import HanhDongCotLoiPage from '../features/dieu-hanh/hanh-dong-cot-loi';
import TieuChiKpiPage from '../features/dieu-hanh/tieu-chi-kpi';
import TheoDoiDanhGiaPage from '../features/dieu-hanh/theo-doi-danh-gia';
import ThietLapCrmPage from '../features/kinh-doanh/thiet-lap-crm';
import ThuHoachPage from '../features/quan-ly-farm/thu-hoach';

const PATH_TO_BREADCRUMB_KEY: Record<string, string> = {
  '/hanh-chinh': 'breadcrumb.hanhChinh',
  '/nhan-su': 'breadcrumb.nhanSu',
  '/kinh-doanh': 'breadcrumb.kinhDoanh',
  '/marketing': 'breadcrumb.marketing',
  '/tai-chinh': 'breadcrumb.taiChinh',
  '/mua-hang': 'breadcrumb.muaHang',
  '/quan-ly-farm': 'breadcrumb.quanLyFarm',
  '/kho-van': 'breadcrumb.khoVan',
  '/dieu-hanh': 'breadcrumb.dieuHanh',
};

/** Lấy icon của module/submenu từ SIDEBAR_MENU (cùng icon trên Trang chủ) */
function getMenuIcon(path: string) {
  return SIDEBAR_MENU.find((m) => m.path === path)?.icon;
}

const PERMISSION_MODULE_IDS = new Set(getAllPermissionModules().map((m) => m.id));

/** Bọc trang bằng ModulePermissionGuard nếu (basePath, slug) thuộc cấu hình phân quyền. */
function wrapWithPermission(basePath: string, slug: string, node: React.ReactNode): React.ReactNode {
  const id = getPermissionModuleId(basePath, slug);
  if (!PERMISSION_MODULE_IDS.has(id)) return node;
  return <ModulePermissionGuard moduleId={id}>{node}</ModulePermissionGuard>;
}

/**
 * Trang submenu hoặc module con.
 * - /hanh-chinh, /nhan-su, /marketing, /tai-chinh, /mua-hang, /kho-van -> Dashboard (danh sách nhóm module)
 * - .../:moduleId -> ModulePlaceholder (Quay lại submenu)
 * - Các submenu khác -> SubmenuPlaceholder (placeholder)
 */
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
  if (basePath === '/nhan-su' && !moduleId) {
    return (
      <ErrorBoundary>
        <NhanSuDashboard />
      </ErrorBoundary>
    );
  }
  if (basePath === '/kinh-doanh' && !moduleId) {
    return (
      <ErrorBoundary>
        <KinDoanhDashboard />
      </ErrorBoundary>
    );
  }
  if (basePath === '/marketing' && !moduleId) {
    return (
      <ErrorBoundary>
        <MarketingDashboard />
      </ErrorBoundary>
    );
  }
  if (basePath === '/tai-chinh' && !moduleId) {
    return (
      <ErrorBoundary>
        <TaiChinhDashboard />
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
  if (basePath === '/dieu-hanh' && !moduleId) {
    return (
      <ErrorBoundary>
        <DieuHanhDashboard />
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
      if (decodedSlug === 'bao-cao-cong-viec') {
        return <Navigate to="/hanh-chinh/bao-cao" replace />;
      }
      if (decodedSlug === 'van-ban-den' || decodedSlug === 'van-ban-di') {
        return <Navigate to="/hanh-chinh/danh-sach-tai-lieu?tab=den_di" replace />;
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
      if (decodedSlug === 'cham-cong') {
        return (
          <ErrorBoundary>
            <AttendancePage />
          </ErrorBoundary>
        );
      }
      if (decodedSlug === 'tong-hop-cham-cong') {
        return (
          <ErrorBoundary>
            <AttendanceManagementPage />
          </ErrorBoundary>
        );
      }
      if (decodedSlug === 'diem-cong-tru') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <DiemCongTruPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'cham-diem-kpi') {
        return (
          <ErrorBoundary>
            <ChamDiemKpiPage />
          </ErrorBoundary>
        );
      }
      if (decodedSlug === 'bang-luong') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <BangLuongPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'thiet-lap-cong-viec') {
        return wrapWithPermission(basePath ?? '', decodedSlug, (
          <ErrorBoundary>
            <ThietLapCongViecPage />
          </ErrorBoundary>
        ));
      }
      if (decodedSlug === 'thiet-lap-tai-lieu') {
        return (
          <ErrorBoundary>
            <ThietLapTaiLieuPage />
          </ErrorBoundary>
        );
      }
      if (decodedSlug === 'danh-sach-tai-lieu') {
        return (
          <ErrorBoundary>
            <TaiLieuPage />
          </ErrorBoundary>
        );
      }
      if (decodedSlug === 'luu-tru-ho-so') {
        return (
          <ErrorBoundary>
            <LuuTruHoSoPage />
          </ErrorBoundary>
        );
      }
      if (decodedSlug === 'du-an') {
        return (
          <ErrorBoundary>
            <DuAnPage />
          </ErrorBoundary>
        );
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
      if (decodedSlug === 'bao-cao') {
        return (
          <ErrorBoundary>
            <BaoCaoPage />
          </ErrorBoundary>
        );
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
    if (basePath === '/nhan-su' && decodedSlug === 'thiet-lap-tuyen-dung') {
      return (
        <ErrorBoundary>
          <ThietLapTuyenDungPage />
        </ErrorBoundary>
      );
    }
    if (basePath === '/nhan-su' && decodedSlug === 'de-xuat-tuyen-dung') {
      return (
        <ErrorBoundary>
          <DeXuatTuyenDungPage />
        </ErrorBoundary>
      );
    }
    if (basePath === '/nhan-su' && decodedSlug === 'ho-so-ung-vien') {
      return (
        <ErrorBoundary>
          <UngVienPage />
        </ErrorBoundary>
      );
    }
    if (basePath === '/nhan-su' && decodedSlug === 'lich-phong-van') {
      return (
        <ErrorBoundary>
          <LichPhongVanPage />
        </ErrorBoundary>
      );
    }
    if (basePath === '/nhan-su' && decodedSlug === 'thu-gui-ung-vien') {
      return (
        <ErrorBoundary>
          <ThuGuiUngVienPage />
        </ErrorBoundary>
      );
    }
    if (basePath === '/nhan-su' && decodedSlug === 'hop-dong') {
      return (
        <ErrorBoundary>
          <HopDongPage />
        </ErrorBoundary>
      );
    }
    if (basePath === '/nhan-su' && decodedSlug === 'bao-cao-tuyen-dung') {
      return (
        <ErrorBoundary>
          <BaoCaoTuyenDungPage />
        </ErrorBoundary>
      );
    }
    if (basePath === '/nhan-su' && decodedSlug === 'thiet-lap-dao-tao') {
      return (
        <ErrorBoundary>
          <ThietLapDaoTaoPage />
        </ErrorBoundary>
      );
    }
    if (basePath === '/nhan-su' && decodedSlug === 'khoa-dao-tao') {
      return (
        <ErrorBoundary>
          <KhoaDaoTaoPage />
        </ErrorBoundary>
      );
    }
    if (basePath === '/nhan-su' && decodedSlug === 'dang-ky-dao-tao') {
      return (
        <ErrorBoundary>
          <DangKyDaoTaoPage />
        </ErrorBoundary>
      );
    }
    if (basePath === '/nhan-su' && decodedSlug === 'bao-cao-dao-tao') {
      return (
        <ErrorBoundary>
          <BaoCaoDaoTaoPage />
        </ErrorBoundary>
      );
    }
    if (basePath === '/nhan-su' && decodedSlug === 'ke-hoach-dao-tao') {
      return (
        <ErrorBoundary>
          <KeHoachDaoTaoPage />
        </ErrorBoundary>
      );
    }
    if (basePath === '/nhan-su' && NHAN_SU_MODULE_SLUGS.includes(decodedSlug)) {
      moduleTitle = t(getNhanSuModuleTitleKeyBySlug(decodedSlug));
    } else if (basePath === '/kinh-doanh' && decodedSlug === 'thiet-lap-crm') {
      return (
        <ErrorBoundary>
          <ThietLapCrmPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/kinh-doanh' && KINH_DOANH_MODULE_SLUGS.includes(decodedSlug)) {
      moduleTitle = t(getKinhDoanhModuleTitleKeyBySlug(decodedSlug));
    } else if (basePath === '/marketing' && MARKETING_MODULE_SLUGS.includes(decodedSlug)) {
      moduleTitle = t(getMarketingModuleTitleKeyBySlug(decodedSlug));
    } else if (basePath === '/tai-chinh' && decodedSlug === 'danh-muc-tai-chinh') {
      return (
        <ErrorBoundary>
          <DanhMucTaiChinhPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/tai-chinh' && decodedSlug === 'tai-khoan') {
      return (
        <ErrorBoundary>
          <TaiKhoanPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/tai-chinh' && decodedSlug === 'de-xuat-chi-phi') {
      return (
        <ErrorBoundary>
          <DeXuatChiPhiPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/tai-chinh' && decodedSlug === 'ke-hoach-chi-phi') {
      return (
        <ErrorBoundary>
          <KeHoachChiPhiPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/tai-chinh' && decodedSlug === 'thu-chi') {
      return (
        <ErrorBoundary>
          <ThuChiPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/tai-chinh' && decodedSlug === 'bao-cao-tai-chinh') {
      return (
        <ErrorBoundary>
          <BaoCaoTaiChinhPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/tai-chinh' && TAI_CHINH_MODULE_SLUGS.includes(decodedSlug)) {
      moduleTitle = t(getTaiChinhModuleTitleKeyBySlug(decodedSlug));
    } else if (basePath === '/mua-hang' && decodedSlug === 'phieu-de-xuat-vat-tu') {
      return wrapWithPermission(basePath ?? '', decodedSlug, (
        <ErrorBoundary>
          <PhieuDeXuatVatTuPage />
        </ErrorBoundary>
      ));
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
    } else if (basePath === '/mua-hang' && MUA_HANG_MODULE_SLUGS.includes(decodedSlug)) {
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
    } else if (basePath === '/dieu-hanh' && decodedSlug === 'su-menh-tam-nhin') {
      return (
        <ErrorBoundary>
          <SuMenhTamNhinPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/dieu-hanh' && decodedSlug === 'tam-nhin-quy-mo-thi-phan') {
      return (
        <ErrorBoundary>
          <TamNhinQuyMoThiPhanPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/dieu-hanh' && decodedSlug === 'phan-tich-swot') {
      return (
        <ErrorBoundary>
          <PhanTichSwotPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/dieu-hanh' && decodedSlug === 'phan-tich-doi-thu') {
      return (
        <ErrorBoundary>
          <PhanTichDoiThuPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/dieu-hanh' && decodedSlug === 'chien-luoc') {
      return (
        <ErrorBoundary>
          <ChienLuocPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/dieu-hanh' && decodedSlug === 'hanh-dong-cot-loi') {
      return (
        <ErrorBoundary>
          <HanhDongCotLoiPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/dieu-hanh' && decodedSlug === 'tieu-chi-kpi') {
      return (
        <ErrorBoundary>
          <TieuChiKpiPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/dieu-hanh' && decodedSlug === 'theo-doi-danh-gia') {
      return (
        <ErrorBoundary>
          <TheoDoiDanhGiaPage />
        </ErrorBoundary>
      );
    } else if (basePath === '/dieu-hanh' && DIEU_HANH_MODULE_SLUGS.includes(decodedSlug)) {
      moduleTitle = t(getDieuHanhModuleTitleKeyBySlug(decodedSlug));
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
