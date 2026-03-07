import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { updatePassword } from '../lib/auth';

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsRecoverySession(!!session);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(t('page.resetPassword.passwordMin'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('page.resetPassword.passwordMismatch'));
      return;
    }
    setIsLoading(true);
    try {
      await updatePassword(newPassword);
      toast.success(t('page.resetPassword.success'));
      navigate('/dang-nhap', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('page.resetPassword.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isRecoverySession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!isRecoverySession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <p className="text-muted-foreground">{t('page.resetPassword.invalidOrExpired')}</p>
          <Button onClick={() => navigate('/dang-nhap', { replace: true })}>
            {t('page.resetPassword.backToLogin')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('page.resetPassword.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('page.resetPassword.description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">{t('page.resetPassword.newPassword')}</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="flex h-11 w-full rounded-lg border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">{t('page.resetPassword.confirmPassword')}</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="flex h-11 w-full rounded-lg border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full h-11" isLoading={isLoading}>
            {t('page.resetPassword.submit')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <p className="text-center">
          <button
            type="button"
            onClick={() => navigate('/dang-nhap')}
            className="text-sm text-primary hover:underline"
          >
            {t('page.resetPassword.backToLogin')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
