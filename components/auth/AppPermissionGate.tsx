import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useStore';
import { useCurrentRoleContext, CURRENT_ROLE_CONTEXT_KEY } from '../../features/he-thong/phan-quyen/hooks/use-phan-quyen';
import { queryClient } from '../../lib/query-client';

/**
 * Sau khi đăng nhập: chờ tải xong quyền theo chức vụ rồi mới render Layout (sidebar/trang chủ đúng module).
 * User không có id_chuc_vu: bỏ qua (không gọi API quyền).
 */
const AppPermissionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isPending, isError, refetch } = useCurrentRoleContext();

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.removeQueries({ queryKey: [CURRENT_ROLE_CONTEXT_KEY] });
    }
  }, [isAuthenticated]);

  if (!user) {
    return <>{children}</>;
  }

  if (user.id_chuc_vu && isPending) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[100dvh] gap-3 bg-background"
        aria-busy="true"
        aria-label={t('permission.bootstrapLoading')}
      >
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">{t('permission.bootstrapLoading')}</p>
      </div>
    );
  }

  if (user.id_chuc_vu && isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] gap-4 bg-background px-6 text-center">
        <p className="text-sm text-destructive max-w-md">{t('permission.bootstrapError')}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppPermissionGate;
