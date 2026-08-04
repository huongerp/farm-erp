
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowRight, CheckCircle2, Eye, EyeOff, X } from 'lucide-react';
import { usePresenceTransition } from '../lib/usePresenceTransition';
import { cn } from '../lib/utils';
import { useAuthStore, useUIStore } from '../store/useStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from 'sonner';
import {
  signInWithPassword,
  signInWithGoogleIdToken,
  employeeToUser,
  getSessionBootstrap,
  ResignedEmployeeAuthError,
  WrongCredentialsError,
  TooManyAttemptsError,
  GoogleNoEmployeeError,
  type KetQuaDangNhap,
} from '../lib/auth';
import { googleDaCauHinh, veNutGoogle } from '../lib/google-signin';
import { queryClient } from '../lib/query-client';
import { getCurrentRoleContext } from '../features/he-thong/phan-quyen/services/phan-quyen-service';
import { CURRENT_ROLE_CONTEXT_KEY } from '../features/he-thong/phan-quyen/hooks/use-phan-quyen';
import { COMPANY_INFO_QUERY_KEY } from '../features/he-thong/thong-tin-cong-ty/hooks/use-thong-tin-cong-ty';

const REMEMBER_EMAIL_KEY = 'remember_login_email';

type LoginValues = {
  email: string;
  password: string;
};

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { companyInfo, setCompanyInfo } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const { mounted: forgotMounted, visible: forgotVisible } = usePresenceTransition(forgotOpen);

  const loginSchema = useMemo(() => z.object({
    email: z.string().min(1, t('page.login.emailRequired')).email(t('page.login.emailInvalid')),
    password: z.string().min(6, t('page.login.passwordMin')),
  }), [t]);

  const savedEmail = typeof window !== 'undefined' ? localStorage.getItem(REMEMBER_EMAIL_KEY) : null;
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: savedEmail ?? '',
      password: ''
    }
  });

  useEffect(() => {
    if (savedEmail) setRememberMe(true);
  }, []);

  /**
   * Phần dùng chung sau khi auth-service đã cấp token: seed cache rồi điều hướng.
   *
   * Gọi RPC bootstrap để seed cache phân quyền + công ty trong 1 request, thay cho
   * prefetchQuery getCurrentRoleContext (trước đây thêm 2 request fp_var_phan_quyen + fp_var_chuc_vu).
   */
  const hoanTatDangNhap = useCallback(
    async ({ employee, phaiDoiMatKhau }: KetQuaDangNhap) => {
      const user = employeeToUser(employee);
      login(user);
      const bootstrap = await getSessionBootstrap();
      if (bootstrap.roleContext && user.id_chuc_vu != null) {
        queryClient.setQueryData(
          [CURRENT_ROLE_CONTEXT_KEY, String(user.id_chuc_vu)],
          bootstrap.roleContext,
        );
      } else if (user.id_chuc_vu != null) {
        await queryClient.prefetchQuery({
          queryKey: [CURRENT_ROLE_CONTEXT_KEY, String(user.id_chuc_vu)],
          queryFn: () => getCurrentRoleContext(String(user.id_chuc_vu)),
        });
      }
      if (bootstrap.company) {
        queryClient.setQueryData(COMPANY_INFO_QUERY_KEY, bootstrap.company);
        setCompanyInfo(bootstrap.company);
      }
      toast.success(t('page.login.loginSuccess'));
      // Mật khẩu do admin cấp → buộc đổi trước khi vào app.
      navigate(phaiDoiMatKhau ? '/dat-lai-mat-khau' : '/');
    },
    [login, navigate, setCompanyInfo, t],
  );

  const baoLoiDangNhap = useCallback(
    (err: unknown) => {
      if (err instanceof ResignedEmployeeAuthError) toast.error(t('page.login.accountLocked'));
      else if (err instanceof WrongCredentialsError) toast.error(t('page.login.wrongCredentials'));
      else if (err instanceof TooManyAttemptsError) toast.error(t('page.login.tooManyAttempts'));
      else if (err instanceof GoogleNoEmployeeError) toast.error(t('page.login.googleNoEmployee'));
      else toast.error(err instanceof Error ? err.message : t('page.login.loginError'));
    },
    [t],
  );

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      const ketQua = await signInWithPassword(data.email, data.password);
      if (rememberMe) localStorage.setItem(REMEMBER_EMAIL_KEY, data.email.trim());
      else localStorage.removeItem(REMEMBER_EMAIL_KEY);
      await hoanTatDangNhap(ketQua);
    } catch (err) {
      baoLoiDangNhap(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Nút Google phải do Google render (luồng ID token của GIS), không dùng nút tự vẽ.
  const googleRef = useRef<HTMLDivElement>(null);
  const coGoogle = googleDaCauHinh();

  const xuLyIdTokenGoogle = useCallback(
    async (idToken: string) => {
      setIsGoogleLoading(true);
      try {
        await hoanTatDangNhap(await signInWithGoogleIdToken(idToken));
      } catch (err) {
        baoLoiDangNhap(err);
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [baoLoiDangNhap, hoanTatDangNhap],
  );

  useEffect(() => {
    if (!coGoogle || !googleRef.current) return;
    veNutGoogle(googleRef.current, (idToken) => void xuLyIdTokenGoogle(idToken), { width: 400 }).catch(
      (err) => {
        console.error('[Login] không vẽ được nút Google', err);
      },
    );
  }, [coGoogle, xuLyIdTokenGoogle]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left Side - Branding & Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-primary/20"></div>
        
        {/* Animated Orbs */}
        <div className="login-blob-a absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="login-blob-b absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 max-w-lg text-white space-y-8">
            <div className="login-brand-enter">
                <div className="flex items-center gap-3 mb-6">
                    {companyInfo.appLogo ? (
                         <img src={companyInfo.appLogo} alt="Logo" className="h-14 w-14 object-contain" />
                    ) : (
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="h-7 w-7 text-white" />
                        </div>
                    )}
                    <span className="text-3xl font-bold tracking-tight">{companyInfo.appName}</span>
                </div>
                <h1 className="text-4xl font-bold leading-tight mb-4">
                    {t('page.login.heading')} <br/> 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary/80 to-primary/60">{t('page.login.headingHighlight')}</span>
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed">
                    {t('page.login.description')}
                </p>
            </div>

            <div className="login-features-enter space-y-4 pt-8">
                {[
                    t('page.login.feature1'),
                    t('page.login.feature2'),
                    t('page.login.feature3')
                ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-slate-400">
                        <CheckCircle2 className="w-5 h-5 text-primary/70" />
                        <span>{feature}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="login-form-enter w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('page.login.welcome')}</h2>
                <p className="text-muted-foreground mt-2">{t('page.login.welcomeDesc')}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-4">
                    <div>
                        <Input 
                            label={t('page.login.email')} 
                            type="email" 
                            placeholder={t('page.login.emailPlaceholder')} 
                            required
                            {...register('email')}
                            error={errors.email?.message}
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-1">
                         <div className="flex items-center justify-between">
                            <label className="text-sm font-medium leading-none mb-2 block">
                              {t('page.login.password')}
                              <span className="text-red-500 ml-0.5">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setForgotOpen(true)}
                              className="text-xs font-medium text-primary hover:text-primary/80 hover:underline mb-2"
                            >
                              {t('page.login.forgotPassword')}
                            </button>
                         </div>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`flex h-11 w-full rounded-lg border bg-background pl-3 pr-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : 'border-input'}`}
                                placeholder="••••••••"
                                {...register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                aria-label={showPassword ? t('page.login.hidePassword') : t('page.login.showPassword')}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-sm font-medium text-destructive mt-1">{errors.password.message}</p>}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <input 
                        type="checkbox" 
                        id="remember" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">{t('page.login.rememberMe')}</label>
                </div>

                <Button 
                    type="submit" 
                    className="w-full h-11 text-base shadow-lg shadow-primary/20" 
                    isLoading={isLoading}
                    disabled={isGoogleLoading}
                >
                    {t('page.login.loginButton')}
                    {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                </Button>
            </form>

            {coGoogle && (
              <>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-3 text-muted-foreground font-medium">{t('page.login.orLoginWith')}</span>
                    </div>
                </div>

                {/* Nút do Google render — luồng ID token của GIS không cho dùng nút tự vẽ. */}
                <div
                  ref={googleRef}
                  className={cn(
                    'flex justify-center [color-scheme:light]',
                    (isGoogleLoading || isLoading) && 'pointer-events-none opacity-60',
                  )}
                />
              </>
            )}

            {/* Quên mật khẩu: self-host không gửi email, admin cấp lại mật khẩu. */}
            {forgotMounted && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className={cn(
                    'absolute inset-0 bg-black/50 presence-overlay',
                    forgotVisible && 'presence-visible',
                  )}
                  onClick={() => setForgotOpen(false)}
                />
                <div
                  className={cn(
                    'relative w-full max-w-md rounded-xl bg-card border border-border shadow-lg p-6 presence-dialog',
                    forgotVisible && 'presence-visible',
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{t('page.login.forgotPasswordTitle')}</h3>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(false)}
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t('common.close')}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('page.login.forgotPasswordDesc')}</p>
                  <div className="mt-5 flex justify-end">
                    <Button type="button" onClick={() => setForgotOpen(false)}>
                      {t('common.close')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
        </div>
        
        {/* Footer info for Login page */}
        <div className="absolute bottom-6 text-center text-xs text-muted-foreground w-full left-0 px-4">
             {t('page.login.copyright')} {companyInfo.companyName || t('page.login.companyFallback')}. {t('page.login.legal')}
        </div>
      </div>
    </div>
  );
};

export default Login;
