import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Hash, ArrowLeft } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import ToggleSwitch from '../../../../components/ui/ToggleSwitch';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import { useCauHinhCongViec, useSaveCauHinhCongViec } from '../hooks/use-cau-hinh-cong-viec';
import {
  CauHinhCongViecFormValues,
  cauHinhCongViecSchema,
} from '../core/schema';
import { SO_NGAY_CANH_BAO_MIN, SO_NGAY_CANH_BAO_MAX } from '../core/constants';
import { Loader2 } from 'lucide-react';

const CanhBaoTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: config, isLoading: loadingConfig } = useCauHinhCongViec();
  const saveMutation = useSaveCauHinhCongViec();

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<CauHinhCongViecFormValues>({
    resolver: zodResolver(cauHinhCongViecSchema),
    defaultValues: {
      so_ngay_canh_bao_sap_han: 3,
      bat_canh_bao_qua_han: true,
    },
  });

  useEffect(() => {
    if (config) {
      reset({
        so_ngay_canh_bao_sap_han: config.so_ngay_canh_bao_sap_han,
        bat_canh_bao_qua_han: config.bat_canh_bao_qua_han,
      });
    }
  }, [config, reset]);

  const onSubmit: SubmitHandler<CauHinhCongViecFormValues> = (data) => {
    saveMutation.mutate(data);
  };

  const isSaving = saveMutation.isPending;

  if (loadingConfig) {
    return (
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden items-center justify-center gap-2 p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="shrink-0 h-8 flex items-center gap-1.5 px-2.5 rounded-lg border border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 active:scale-95 transition-all text-sm font-medium"
          aria-label={t('common.back')}
        >
          <ArrowLeft size={15} className="stroke-[2.5px]" />
          {t('common.back')}
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-auto">
        <div className="p-4 sm:p-6 space-y-6">
          <FormSection
            title={t('thietLapCongViec.canhBao.sectionTitle')}
            icon={<Bell size={14} />}
            variant="primary"
          >
            <FormGrid cols={1}>
              <Input
                type="number"
                min={SO_NGAY_CANH_BAO_MIN}
                max={SO_NGAY_CANH_BAO_MAX}
                label={t('thietLapCongViec.canhBao.soNgayLabel')}
                placeholder={t('thietLapCongViec.canhBao.soNgayPlaceholder')}
                icon={<Hash size={14} />}
                {...register('so_ngay_canh_bao_sap_han')}
                error={errors.so_ngay_canh_bao_sap_han?.message}
              />
              <Controller
                name="bat_canh_bao_qua_han"
                control={control}
                render={({ field }) => (
                  <ToggleSwitch
                    checked={field.value}
                    onChange={field.onChange}
                    label={t('thietLapCongViec.canhBao.batCanhBaoQuaHan')}
                    description={t('thietLapCongViec.canhBao.batCanhBaoQuaHanDesc')}
                  />
                )}
              />
            </FormGrid>
          </FormSection>
        </div>
        <div className="shrink-0 border-t border-border p-4 flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            size="sm"
            className="bg-primary text-white hover:bg-primary/90"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t('thietLapCongViec.canhBao.saveButton')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CanhBaoTab;
