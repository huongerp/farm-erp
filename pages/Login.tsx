
import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, X } from 'lucide-react';
import { useAuthStore, useUIStore } from '../store/useStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from 'sonner';
import { signInWithPassword, employeeToUser, requestPasswordReset, signInWithGoogle, getSessionBootstrap } from '../lib/auth';
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
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

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

  useEffect(() => {
    if (forgotOpen) setForgotEmail(savedEmail ?? '');
  }, [forgotOpen, savedEmail]);

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      const employee = await signInWithPassword(data.email, data.password);
      const user = employeeToUser(employee);
      login(user);
      // Gọi RPC bootstrap để seed cache phân quyền + công ty trong 1 request, thay cho
      // prefetchQuery getCurrentRoleContext (trước đây thêm 2 request fp_var_phan_quyen + fp_var_chuc_vu).
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
      if (rememberMe) localStorage.setItem(REMEMBER_EMAIL_KEY, data.email.trim());
      else localStorage.removeItem(REMEMBER_EMAIL_KEY);
      toast.success(t('page.login.loginSuccess'));
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('page.login.loginError');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = forgotEmail.trim();
    if (!email) {
      toast.error(t('page.login.emailRequired'));
      return;
    }
    setForgotLoading(true);
    try {
      await requestPasswordReset(email);
      toast.success(t('page.login.forgotPasswordSuccess'));
      setForgotOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('page.login.forgotPasswordError'));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Thành công: trình duyệt sẽ chuyển sang Google, sau đó redirect về app. useAuthSync sẽ xử lý session.
    } catch (err) {
      setIsGoogleLoading(false);
      const msg = err instanceof Error ? err.message : t('page.login.googleNotConfigured');
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left Side - Branding & Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-primary/20"></div>
        
        {/* Animated Orbs */}
        <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/20 rounded-full blur-3xl"
        />

        {/* Content */}
        <div className="relative z-10 max-w-lg text-white space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
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
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-4 pt-8"
            >
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
            </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md space-y-8"
        >
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

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-3 text-muted-foreground font-medium">{t('page.login.orLoginWith')}</span>
                </div>
            </div>

            {/* Google Login Button */}
            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
                className="w-full flex items-center justify-center gap-3 bg-card border border-border text-foreground hover:bg-muted/50 hover:border-border/80 font-medium h-11 rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span>Google</span>
                    </>
                )}
            </button>

            <div className="text-center text-sm text-muted-foreground">
                {t('page.login.noAccount')}{' '}
                <a href="#" className="font-semibold text-primary hover:underline">{t('page.login.register')}</a>
            </div>

            {/* Modal Quên mật khẩu */}
            {forgotOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md rounded-xl bg-card border border-border shadow-lg p-6"
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
                  <p className="text-sm text-muted-foreground mb-4">{t('page.login.forgotPasswordDesc')}</p>
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <Input
                      label={t('page.login.email')}
                      type="email"
                      placeholder={t('page.login.emailPlaceholder')}
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="h-11"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button type="submit" isLoading={forgotLoading}>
                        {t('page.login.sendResetLink')}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
        </motion.div>
        
        {/* Footer info for Login page */}
        <div className="absolute bottom-6 text-center text-xs text-muted-foreground w-full left-0 px-4">
             {t('page.login.copyright')} {companyInfo.companyName || t('page.login.companyFallback')}. {t('page.login.legal')}
        </div>
      </div>
    </div>
  );
};

export default Login;
