import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import ConfirmDialog from './components/shared/ConfirmDialog';
import PwaRegister from './components/shared/PwaRegister';
import ModulePermissionGuard from './components/shared/ModulePermissionGuard';
import AppPermissionGate from './components/auth/AppPermissionGate';
import { queryClient } from './lib/query-client';
import { getCurrentRoleContext } from './features/he-thong/phan-quyen/services/phan-quyen-service';
import { CURRENT_ROLE_CONTEXT_KEY } from './features/he-thong/phan-quyen/hooks/use-phan-quyen';
import { COMPANY_INFO_QUERY_KEY } from './features/he-thong/thong-tin-cong-ty/hooks/use-thong-tin-cong-ty';

import { useAuthStore, useUIStore } from './store/useStore';
import {
  ThemeSynchronizer,
  MetadataSynchronizer,
  LanguageSynchronizer,
  useResolvedTheme,
} from './lib/app-sync';
import { getSessionBootstrap, employeeToUser } from './lib/auth';
import { dangKyKhiMatPhien, emailPhienHienTai } from './lib/token-store';
import { toast } from 'sonner';
import i18n from './lib/i18n';
import { lazyWithFeatureI18n } from './lib/lazy-with-feature-i18n';

const Home = lazy(() => import('./pages/Home'));
const LicenseInfo = lazy(() => import('./pages/LicenseInfo'));
const NotificationPage = lazy(() => import('./pages/NotificationPage'));
const SystemDashboard = lazy(() => import('./pages/dashboards/SystemDashboard'));
const SubmenuPage = lazy(() => import('./pages/SubmenuPage'));
const ModuleGuidePage = lazy(() => import('./pages/ModuleGuidePage'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

const DepartmentPage = lazy(() => import('./features/he-thong/phong-ban/index'));
const PositionPage = lazy(() => import('./features/he-thong/chuc-vu/index'));
const JobLevelPage = lazy(() => import('./features/he-thong/cap-bac/index'));

const PayslipPreviewPage = lazy(() => import('./features/hanh-chinh/bang-luong/PayslipPreviewPage'));
const EmployeeProfilePreviewPage = lazy(() => import('./features/he-thong/nhan-vien/EmployeeProfilePreviewPage'));
const HoSoTaiSanPreviewPage = lazyWithFeatureI18n(
  'danh-muc-tai-san',
  () => import('./features/hanh-chinh/danh-muc-tai-san/HoSoTaiSanPreviewPage')
);
const PhieuCPTHPreviewPage = lazyWithFeatureI18n(
  'cap-phat-thu-hoi',
  () => import('./features/hanh-chinh/cap-phat-thu-hoi/PhieuCPTHPreviewPage')
);
const PhieuKiemKePreviewPage = lazyWithFeatureI18n(
  'kiem-ke-tai-san',
  () => import('./features/hanh-chinh/kiem-ke-tai-san/PhieuKiemKePreviewPage')
);
const PhieuKiemKeKhoPreviewPage = lazyWithFeatureI18n(
  'kiem-ke-kho',
  () => import('./features/kho-van/kiem-ke-kho/PhieuKiemKeKhoPreviewPage')
);
const PhieuKhoPreviewPage = lazyWithFeatureI18n(
  'phieu-kho',
  () => import('./features/kho-van/phieu-kho/PhieuKhoPreviewPage')
);
const PhieuKhoPTPreviewPage = lazyWithFeatureI18n(
  'phieu-kho-phan-thuoc',
  () => import('./features/quan-ly-farm/phieu-kho-phan-thuoc/PhieuKhoPTPreviewPage')
);
const PhieuDeXuatVatTuPreviewPage = lazyWithFeatureI18n(
  'phieu-de-xuat-vat-tu',
  () => import('./features/kho-van/phieu-de-xuat-vat-tu/PhieuDeXuatVatTuPreviewPage')
);
const DonDatHangPreviewPage = lazyWithFeatureI18n(
  'don-dat-hang',
  () => import('./features/mua-hang/don-dat-hang/DonDatHangPreviewPage')
);
const ThanhToanDoiTacPreviewPage = lazyWithFeatureI18n(
  'thanh-toan-doi-tac',
  () => import('./features/mua-hang/thanh-toan-doi-tac/ThanhToanDoiTacPreviewPage')
);
const BaoCaoKhauHaoPreviewPage = lazyWithFeatureI18n(
  'khau-hao-tai-san',
  () => import('./features/hanh-chinh/khau-hao-tai-san/BaoCaoKhauHaoPreviewPage')
);
const BaoCaoNhanCongPreviewPage = lazyWithFeatureI18n(
  'bao-cao-nhan-cong',
  () => import('./features/quan-ly-farm/bao-cao-nhan-cong/BaoCaoNhanCongPreviewPage')
);
const BaoCaoSoChePreviewPage = lazyWithFeatureI18n(
  'bao-cao-so-che',
  () => import('./features/quan-ly-farm/bao-cao-so-che/BaoCaoSoChePreviewPage')
);
const DuBaoSlDongThungPreviewPage = lazyWithFeatureI18n(
  'du-bao-sl-dong-thung',
  () => import('./features/quan-ly-farm/du-bao-sl-dong-thung/DuBaoSlDongThungPreviewPage')
);

const EmployeePage = lazy(() => import('./features/he-thong/nhan-vien/index'));
const CompanyInfoPage = lazy(() => import('./features/he-thong/thong-tin-cong-ty/index'));
const BranchPage = lazy(() => import('./features/he-thong/chi-nhanh/index'));
const SecurityPage = lazy(() => import('./features/he-thong/phan-quyen/index'));

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

const NavigateToMuaHangModule = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const location = useLocation();
  const to = moduleId ? `/mua-hang/${moduleId}${location.pathname.endsWith('/huong-dan') ? '/huong-dan' : ''}` : '/mua-hang';
  return <Navigate to={to} replace />;
};

/** Dedupe StrictMode double mount: một promise bootstrap, không gọi RPC 2 lần (dev). */
let authBootstrapPromise: Promise<void> | null = null;

function useAuthSync() {
  useEffect(() => {
    if (authBootstrapPromise == null) {
      // 1 RPC duy nhất thay cho getSessionEmployee + prefetch getCurrentRoleContext (2 request)
      // + useCompanyInfo (1 request). Sau khi có dữ liệu, seed thẳng vào React Query cache &
      // UI store để các hook (useCurrentRoleContext / useCompanyInfo) không gọi lại API.
      authBootstrapPromise = (async () => {
        const { employee, roleContext, company, lockoutReason } = await getSessionBootstrap();
        const { login, logout } = useAuthStore.getState();
        const { setCompanyInfo } = useUIStore.getState();
        if (employee) {
          login(employeeToUser(employee));
          if (roleContext && employee.id_chuc_vu != null) {
            queryClient.setQueryData([CURRENT_ROLE_CONTEXT_KEY, String(employee.id_chuc_vu)], roleContext);
          } else if (employee.id_chuc_vu != null) {
            await queryClient.prefetchQuery({
              queryKey: [CURRENT_ROLE_CONTEXT_KEY, String(employee.id_chuc_vu)],
              queryFn: () => getCurrentRoleContext(String(employee.id_chuc_vu)),
            });
          }
          if (company) {
            queryClient.setQueryData(COMPANY_INFO_QUERY_KEY, company);
            setCompanyInfo(company);
          }
        } else {
          logout();
          if (lockoutReason === 'resigned') {
            toast.error(i18n.t('page.login.accountLocked'));
          } else if (emailPhienHienTai()) {
            // Có phiên hợp lệ nhưng không đọc được hồ sơ nhân viên nào trùng email.
            toast.info(i18n.t('page.login.googleNoEmployee'));
          }
        }
      })();
    }
    void authBootstrapPromise;
  }, []);

  // Phiên mất hiệu lực giữa lúc đang dùng (refresh token bị thu hồi, nhân viên
  // chuyển sang Nghỉ việc, hoặc đăng xuất ở tab khác) → đưa về trang đăng nhập.
  useEffect(
    () =>
      dangKyKhiMatPhien(() => {
        if (!useAuthStore.getState().isAuthenticated) return;
        useAuthStore.getState().logout();
        toast.info(i18n.t('page.login.sessionExpired'));
      }),
    [],
  );
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
        <Route path="/phieu-luong/:id" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><PayslipPreviewPage /></Suspense></ProtectedRoute>} />
        <Route path="/ho-so-nhan-vien/:id" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><EmployeeProfilePreviewPage /></Suspense></ProtectedRoute>} />
        <Route path="/ho-so-tai-san/:id" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><HoSoTaiSanPreviewPage /></Suspense></ProtectedRoute>} />
        <Route path="/hanh-chinh/cap-phat-thu-hoi/preview/:id" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><PhieuCPTHPreviewPage /></Suspense></ProtectedRoute>} />
        <Route path="/phieu-kiem-ke/:id" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><PhieuKiemKePreviewPage /></Suspense></ProtectedRoute>} />
        <Route path="/mua-hang/kiem-ke-kho/preview/:id" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><PhieuKiemKeKhoPreviewPage /></Suspense></ProtectedRoute>} />
        <Route path="/mua-hang/phieu-kho/preview/:id" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><PhieuKhoPreviewPage /></Suspense></ProtectedRoute>} />
        <Route
          path="/quan-ly-farm/phieu-kho-phan-thuoc/preview/:id"
          element={
            <ProtectedRoute>
              <ModulePermissionGuard moduleId="quan-ly-farm/phieu-kho-phan-thuoc">
                <Suspense fallback={<PageFallback />}>
                  <PhieuKhoPTPreviewPage />
                </Suspense>
              </ModulePermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quan-ly-farm/bao-cao-nhan-cong/preview/:id"
          element={
            <ProtectedRoute>
              <ModulePermissionGuard moduleId="quan-ly-farm/bao-cao-nhan-cong">
                <Suspense fallback={<PageFallback />}>
                  <BaoCaoNhanCongPreviewPage />
                </Suspense>
              </ModulePermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quan-ly-farm/bao-cao-so-che/preview/:id"
          element={
            <ProtectedRoute>
              <ModulePermissionGuard moduleId="quan-ly-farm/bao-cao-so-che">
                <Suspense fallback={<PageFallback />}>
                  <BaoCaoSoChePreviewPage />
                </Suspense>
              </ModulePermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quan-ly-farm/du-bao-sl-dong-thung/preview/:id"
          element={
            <ProtectedRoute>
              <ModulePermissionGuard moduleId="quan-ly-farm/du-bao-sl-dong-thung">
                <Suspense fallback={<PageFallback />}>
                  <DuBaoSlDongThungPreviewPage />
                </Suspense>
              </ModulePermissionGuard>
            </ProtectedRoute>
          }
        />
        <Route path="/mua-hang/phieu-de-xuat-vat-tu/preview/:id" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><PhieuDeXuatVatTuPreviewPage /></Suspense></ProtectedRoute>} />
        <Route path="/mua-hang/don-dat-hang/preview/:id" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><DonDatHangPreviewPage /></Suspense></ProtectedRoute>} />
        <Route path="/mua-hang/thanh-toan-doi-tac/preview/:id" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><ThanhToanDoiTacPreviewPage /></Suspense></ProtectedRoute>} />
        <Route path="/bao-cao-khau-hao/:id" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><BaoCaoKhauHaoPreviewPage /></Suspense></ProtectedRoute>} />
        <Route path="/*" element={
            <ProtectedRoute>
              <AppPermissionGate>
              <Layout>
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                  <Route path="/thong-tin-ban-quyen" element={<LicenseInfo />} />

                  <Route path="/hanh-chinh" element={<SubmenuPage />} />
                  <Route path="/hanh-chinh/:moduleId/huong-dan" element={<ModuleGuidePage />} />
                  <Route path="/hanh-chinh/:moduleId" element={<SubmenuPage />} />
                  <Route path="/mua-hang" element={<SubmenuPage />} />
                  <Route path="/mua-hang/:moduleId/huong-dan" element={<ModuleGuidePage />} />
                  <Route path="/mua-hang/:moduleId" element={<SubmenuPage />} />
                  <Route path="/quan-ly-farm" element={<SubmenuPage />} />
                  <Route path="/quan-ly-farm/:moduleId/huong-dan" element={<ModuleGuidePage />} />
                  <Route path="/quan-ly-farm/:moduleId" element={<SubmenuPage />} />
                  <Route path="/kho-van" element={<Navigate to="/mua-hang" replace />} />
                  <Route path="/kho-van/:moduleId/huong-dan" element={<NavigateToMuaHangModule />} />
                  <Route path="/kho-van/:moduleId" element={<NavigateToMuaHangModule />} />

                  <Route path="/he-thong" element={<SystemDashboard />} />
                  <Route path="/nhan-vien" element={<ModulePermissionGuard moduleId="he-thong/nhan-vien"><EmployeePage /></ModulePermissionGuard>} />
                  <Route path="/phong-ban" element={<ModulePermissionGuard moduleId="he-thong/phong-ban"><DepartmentPage /></ModulePermissionGuard>} />
                  <Route path="/chuc-vu" element={<ModulePermissionGuard moduleId="he-thong/chuc-vu"><PositionPage /></ModulePermissionGuard>} />
                  <Route path="/cap-bac" element={<ModulePermissionGuard moduleId="he-thong/cap-bac"><JobLevelPage /></ModulePermissionGuard>} />
                  <Route path="/thong-tin-cong-ty" element={<ModulePermissionGuard moduleId="he-thong/thong-tin-cong-ty"><CompanyInfoPage /></ModulePermissionGuard>} />
                  <Route path="/chi-nhanh" element={<ModulePermissionGuard moduleId="he-thong/chi-nhanh"><BranchPage /></ModulePermissionGuard>} />
                  <Route path="/phan-quyen" element={<ModulePermissionGuard moduleId="he-thong/phan-quyen"><SecurityPage /></ModulePermissionGuard>} />

                  <Route path="/ho-so" element={<Profile />} />
                  <Route path="/cai-dat" element={<Settings />} />
                  <Route path="/thong-bao" element={<NotificationPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
              </AppPermissionGate>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
