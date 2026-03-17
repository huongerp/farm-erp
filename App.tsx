import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AiStudio from './pages/AiStudio';
import ConfirmDialog from './components/shared/ConfirmDialog';
import PwaRegister from './components/shared/PwaRegister';
import ModulePermissionGuard from './components/shared/ModulePermissionGuard';

import Home from './pages/Home';
import LicenseInfo from './pages/LicenseInfo';
import NotificationPage from './pages/NotificationPage';
import SystemDashboard from './pages/dashboards/SystemDashboard';
import SubmenuPage from './pages/SubmenuPage';
import ModuleGuidePage from './pages/ModuleGuidePage';

import DepartmentPage from './features/he-thong/phong-ban/index';
import PositionPage from './features/he-thong/chuc-vu/index';
import ChucNangNhiemVuPage from './features/he-thong/chuc-nang-nhiem-vu/index';
import JobLevelPage from './features/he-thong/cap-bac/index';
import PayslipPreviewPage from './features/hanh-chinh/bang-luong/PayslipPreviewPage';
import EmployeeProfilePreviewPage from './features/he-thong/nhan-vien/EmployeeProfilePreviewPage';
import HoSoTaiSanPreviewPage from './features/hanh-chinh/danh-muc-tai-san/HoSoTaiSanPreviewPage';
import PhieuCPTHPreviewPage from './features/hanh-chinh/cap-phat-thu-hoi/PhieuCPTHPreviewPage';
import PhieuKiemKePreviewPage from './features/hanh-chinh/kiem-ke-tai-san/PhieuKiemKePreviewPage';
import PhieuKiemKeKhoPreviewPage from './features/kho-van/kiem-ke-kho/PhieuKiemKeKhoPreviewPage';
import PhieuKhoPreviewPage from './features/kho-van/phieu-kho/PhieuKhoPreviewPage';
import PhieuDeXuatVatTuPreviewPage from './features/kho-van/phieu-de-xuat-vat-tu/PhieuDeXuatVatTuPreviewPage';
import DonDatHangPreviewPage from './features/mua-hang/don-dat-hang/DonDatHangPreviewPage';
import ThanhToanDoiTacPreviewPage from './features/mua-hang/thanh-toan-doi-tac/ThanhToanDoiTacPreviewPage';
import BaoCaoKhauHaoPreviewPage from './features/hanh-chinh/khau-hao-tai-san/BaoCaoKhauHaoPreviewPage';
import PhieuDanhGiaPVPreviewPage from './features/nhan-su/lich-phong-van/PhieuDanhGiaPVPreviewPage';
import ThuMoiPhongVanPreviewPage from './features/nhan-su/lich-phong-van/ThuMoiPhongVanPreviewPage';
import ThuUngVienPreviewPage from './features/nhan-su/thu-gui-ung-vien/ThuUngVienPreviewPage';
import HopDongPreviewPage from './features/nhan-su/hop-dong/HopDongPreviewPage';
import PhieuThanhLyPreviewPage from './features/nhan-su/hop-dong/PhieuThanhLyPreviewPage';
import ThuChiPreviewPage from './features/tai-chinh/thu-chi/ThuChiPreviewPage';
import ThietLapKhoaHocPage from './features/nhan-su/khoa-dao-tao/thiet-lap/ThietLapKhoaHocPage';
import DangKyDaoTaoPage from './features/nhan-su/dang-ky-dao-tao';
import HocKhoaPage from './features/nhan-su/dang-ky-dao-tao/hoc/HocKhoaPage';
import PhanTichDoiThuDetailPage from './features/dieu-hanh/phan-tich-doi-thu/PhanTichDoiThuDetailPage';

import { useAuthStore } from './store/useStore';
import {
  ThemeSynchronizer,
  MetadataSynchronizer,
  LanguageSynchronizer,
  useResolvedTheme,
} from './lib/app-sync';
import { getSessionEmployee, employeeToUser } from './lib/auth';
import { supabase } from './lib/supabase';
import { upsertCurrentLoginDevice } from './features/he-thong/thiet-bi-dang-nhap/services/thiet-bi-dang-nhap-service';
import { toast } from 'sonner';
import i18n from './lib/i18n';

/** Lazy-loaded pages – giảm bundle initial (Nhân viên + Thống kê, Thông tin công ty, Sao lưu, Phân quyền) */
const EmployeePage = lazy(() => import('./features/he-thong/nhan-vien/index'));
const CompanyInfoPage = lazy(() => import('./features/he-thong/thong-tin-cong-ty/index'));
const BranchPage = lazy(() => import('./features/he-thong/chi-nhanh/index'));
const BackupPage = lazy(() => import('./features/he-thong/sao-luu/index'));
const LoginDevicePage = lazy(() => import('./features/he-thong/thiet-bi-dang-nhap/index'));
const SecurityPage = lazy(() => import('./features/he-thong/phan-quyen/index'));

/** Chỉ spinner primary, không chữ – tránh "đang tải 2 lần" với strip trong trang */
const PageFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[40vh]" aria-busy="true" aria-label="Đang mở trang">
    <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/dang-nhap" state={{ from: location }} replace />;
  return <>{children}</>;
};

/** Redirect /kho-van/:moduleId và /kho-van/:moduleId/huong-dan sang /mua-hang (module kho đã chuyển sang Mua hàng). */
const NavigateToMuaHangModule = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const location = useLocation();
  const to = moduleId ? `/mua-hang/${moduleId}${location.pathname.endsWith('/huong-dan') ? '/huong-dan' : ''}` : '/mua-hang';
  return <Navigate to={to} replace />;
};

/** Đồng bộ trạng thái đăng nhập với Supabase Auth khi load app (kể cả sau khi redirect từ Google OAuth). */
function useAuthSync() {
  useEffect(() => {
    getSessionEmployee().then((emp) => {
      const { login, logout } = useAuthStore.getState();
      if (emp) {
        login(employeeToUser(emp));
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) upsertCurrentLoginDevice(session, emp).catch(() => {});
        });
      } else {
        logout();
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.email) {
            toast.info(i18n.t('page.login.googleNoEmployee'));
          }
        });
      }
    });
  }, []);
}

const App = () => {
  useAuthSync();
  const resolvedTheme = useResolvedTheme();
  return (
    <>
      <ThemeSynchronizer />
      <MetadataSynchronizer />
      <LanguageSynchronizer />
      <ConfirmDialog />
      <PwaRegister />
      <Toaster position="top-right" richColors theme={resolvedTheme} />
      <Routes>
        <Route path="/dang-nhap" element={<Login />} />
        <Route path="/dat-lai-mat-khau" element={<ResetPassword />} />
        <Route path="/login" element={<Navigate to="/dang-nhap" replace />} />
        <Route path="/phieu-luong/:id" element={<ProtectedRoute><PayslipPreviewPage /></ProtectedRoute>} />
        <Route path="/ho-so-nhan-vien/:id" element={<ProtectedRoute><EmployeeProfilePreviewPage /></ProtectedRoute>} />
        <Route path="/ho-so-tai-san/:id" element={<ProtectedRoute><HoSoTaiSanPreviewPage /></ProtectedRoute>} />
        <Route path="/hanh-chinh/cap-phat-thu-hoi/preview/:id" element={<ProtectedRoute><PhieuCPTHPreviewPage /></ProtectedRoute>} />
        <Route path="/phieu-kiem-ke/:id" element={<ProtectedRoute><PhieuKiemKePreviewPage /></ProtectedRoute>} />
        <Route path="/mua-hang/kiem-ke-kho/preview/:id" element={<ProtectedRoute><PhieuKiemKeKhoPreviewPage /></ProtectedRoute>} />
        <Route path="/mua-hang/phieu-kho/preview/:id" element={<ProtectedRoute><PhieuKhoPreviewPage /></ProtectedRoute>} />
        <Route path="/mua-hang/phieu-de-xuat-vat-tu/preview/:id" element={<ProtectedRoute><PhieuDeXuatVatTuPreviewPage /></ProtectedRoute>} />
        <Route path="/mua-hang/don-dat-hang/preview/:id" element={<ProtectedRoute><DonDatHangPreviewPage /></ProtectedRoute>} />
        <Route path="/mua-hang/thanh-toan-doi-tac/preview/:id" element={<ProtectedRoute><ThanhToanDoiTacPreviewPage /></ProtectedRoute>} />
        <Route path="/bao-cao-khau-hao/:id" element={<ProtectedRoute><BaoCaoKhauHaoPreviewPage /></ProtectedRoute>} />
        <Route path="/phieu-danh-gia-pv/:id" element={<ProtectedRoute><PhieuDanhGiaPVPreviewPage /></ProtectedRoute>} />
        <Route path="/thu-moi-phong-van/:id" element={<ProtectedRoute><ThuMoiPhongVanPreviewPage /></ProtectedRoute>} />
        <Route path="/thu-gui-ung-vien/preview/:idUngVien/:loaiThu" element={<ProtectedRoute><ThuUngVienPreviewPage /></ProtectedRoute>} />
        <Route path="/nhan-su/hop-dong/preview/:id" element={<ProtectedRoute><HopDongPreviewPage /></ProtectedRoute>} />
        <Route path="/nhan-su/hop-dong/thanh-ly/preview/:id" element={<ProtectedRoute><PhieuThanhLyPreviewPage /></ProtectedRoute>} />
        <Route path="/tai-chinh/thu-chi/preview/:id" element={<ProtectedRoute><ThuChiPreviewPage /></ProtectedRoute>} />
        <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                  <Route path="/thong-tin-ban-quyen" element={<LicenseInfo />} />

                  {/* === SUBMENU (placeholder) === */}
                  <Route path="/hanh-chinh" element={<SubmenuPage />} />
                  <Route path="/hanh-chinh/:moduleId/huong-dan" element={<ModuleGuidePage />} />
                  <Route path="/hanh-chinh/:moduleId" element={<SubmenuPage />} />
                  <Route path="/nhan-su/khoa-dao-tao/thiet-lap/:idKhoa" element={<ProtectedRoute><ThietLapKhoaHocPage /></ProtectedRoute>} />
                  <Route path="/nhan-su/dang-ky-dao-tao/hoc/:idDangKy" element={<ProtectedRoute><HocKhoaPage /></ProtectedRoute>} />
                  <Route path="/nhan-su" element={<SubmenuPage />} />
                  <Route path="/nhan-su/:moduleId/huong-dan" element={<ModuleGuidePage />} />
                  <Route path="/nhan-su/:moduleId" element={<SubmenuPage />} />
                  <Route path="/kinh-doanh" element={<SubmenuPage />} />
                  <Route path="/kinh-doanh/:moduleId/huong-dan" element={<ModuleGuidePage />} />
                  <Route path="/kinh-doanh/:moduleId" element={<SubmenuPage />} />
                  <Route path="/marketing" element={<SubmenuPage />} />
                  <Route path="/marketing/:moduleId/huong-dan" element={<ModuleGuidePage />} />
                  <Route path="/marketing/:moduleId" element={<SubmenuPage />} />
                  <Route path="/tai-chinh" element={<SubmenuPage />} />
                  <Route path="/tai-chinh/:moduleId/huong-dan" element={<ModuleGuidePage />} />
                  <Route path="/tai-chinh/:moduleId" element={<SubmenuPage />} />
                  <Route path="/mua-hang" element={<SubmenuPage />} />
                  <Route path="/mua-hang/:moduleId/huong-dan" element={<ModuleGuidePage />} />
                  <Route path="/mua-hang/:moduleId" element={<SubmenuPage />} />
                  <Route path="/kho-van" element={<Navigate to="/mua-hang" replace />} />
                  <Route path="/kho-van/:moduleId/huong-dan" element={<NavigateToMuaHangModule />} />
                  <Route path="/kho-van/:moduleId" element={<NavigateToMuaHangModule />} />
                  <Route path="/dieu-hanh" element={<SubmenuPage />} />
                  <Route path="/dieu-hanh/phan-tich-doi-thu/:id" element={<ProtectedRoute><PhanTichDoiThuDetailPage /></ProtectedRoute>} />
                  <Route path="/dieu-hanh/:moduleId/huong-dan" element={<ModuleGuidePage />} />
                  <Route path="/dieu-hanh/:moduleId" element={<SubmenuPage />} />

                  {/* === DASHBOARDS === */}
                  <Route path="/he-thong" element={<SystemDashboard />} />
                  {/* === HỆ THỐNG === */}
                  <Route path="/nhan-vien" element={<ModulePermissionGuard moduleId="he-thong/nhan-vien"><EmployeePage /></ModulePermissionGuard>} />
                  <Route path="/phong-ban" element={<ModulePermissionGuard moduleId="he-thong/phong-ban"><DepartmentPage /></ModulePermissionGuard>} />
                  <Route path="/chuc-vu" element={<ModulePermissionGuard moduleId="he-thong/chuc-vu"><PositionPage /></ModulePermissionGuard>} />
                  <Route path="/chuc-nang-nhiem-vu" element={<ChucNangNhiemVuPage />} />
                  <Route path="/cap-bac" element={<ModulePermissionGuard moduleId="he-thong/cap-bac"><JobLevelPage /></ModulePermissionGuard>} />
                  <Route path="/thong-tin-cong-ty" element={<ModulePermissionGuard moduleId="he-thong/thong-tin-cong-ty"><CompanyInfoPage /></ModulePermissionGuard>} />
                  <Route path="/chi-nhanh" element={<ModulePermissionGuard moduleId="he-thong/chi-nhanh"><BranchPage /></ModulePermissionGuard>} />
                  <Route path="/sao-luu" element={<ModulePermissionGuard moduleId="he-thong/sao-luu"><BackupPage /></ModulePermissionGuard>} />
                  <Route path="/thiet-bi-dang-nhap" element={<ModulePermissionGuard moduleId="he-thong/thiet-bi-dang-nhap"><LoginDevicePage /></ModulePermissionGuard>} />
                  <Route path="/phan-quyen" element={<ModulePermissionGuard moduleId="he-thong/phan-quyen"><SecurityPage /></ModulePermissionGuard>} />

                  {/* === CHUNG === */}
                  <Route path="/tro-ly-ai" element={<AiStudio />} />
                  <Route path="/ho-so" element={<Profile />} />
                  <Route path="/cai-dat" element={<Settings />} />
                  <Route path="/thong-bao" element={<NotificationPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
