import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../../store/useStore';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import CompanyInfoForm from './components/thong-tin-cong-ty-form';
import type { CompanyFormValues } from './core/types';
import { useCompanyInfo, useUpdateCompanyInfo, useFirstCompanyId } from './hooks/use-thong-tin-cong-ty';
import { toast } from 'sonner';

const CompanyInfoPage: React.FC = () => {
  const { t } = useTranslation();
  const { canUpdate } = useModulePermissionFromContext();
  const { companyInfo } = useUIStore();
  const { data: companyFromApi, isLoading } = useCompanyInfo();
  const { data: firstId } = useFirstCompanyId();
  const updateMutation = useUpdateCompanyInfo();

  const handleSubmit = async (data: CompanyFormValues & { appLogo: string | null }) => {
    if (!firstId) {
      toast.error(t('company.service.noRecord'));
      return;
    }
    await updateMutation.mutateAsync({
      id: firstId,
      data: {
        appName: data.appName,
        appDescription: data.appDescription ?? '',
        appLogo: data.appLogo ?? null,
        companyName: data.companyName,
        taxId: data.taxId ?? '',
        address: data.address ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        website: data.website ?? '',
      },
    });
  };

  const initialValues = companyFromApi ?? companyInfo;
  const displayValues = {
    ...initialValues,
    appDescription: initialValues.appDescription ?? '',
    address: initialValues.address ?? '',
    phone: initialValues.phone ?? '',
    email: initialValues.email ?? '',
    website: initialValues.website ?? '',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('company.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('company.description')}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-busy />
        </div>
      ) : (
        <CompanyInfoForm
          initialValues={displayValues}
          onSubmit={handleSubmit}
          canUpdate={canUpdate}
        />
      )}
    </div>
  );
};

export default CompanyInfoPage;
