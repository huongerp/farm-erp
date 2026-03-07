import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings, ArrowLeft, Loader2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import ToggleSwitch from '../../../../components/ui/ToggleSwitch';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import { useCauHinhDeXuatVatTu, useSaveCauHinhDeXuatVatTu } from '../hooks/use-cau-hinh-de-xuat-vat-tu';
import {
  cauHinhChungSchema,
  type CauHinhChungFormValues,
} from '../core/schema';
import {
  SO_NGAY_MAC_DINH_NGAY_CAN_MIN,
  SO_NGAY_MAC_DINH_NGAY_CAN_MAX,
} from '../core/constants';
import Select from '../../../../components/ui/Select';

const CauHinhChungTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: config, isLoading: loadingConfig } = useCauHinhDeXuatVatTu();
  const saveMutation = useSaveCauHinhDeXuatVatTu();

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<CauHinhChungFormValues>({
    resolver: zodResolver(cauHinhChungSchema),
    defaultValues: {
      so_ngay_mac_dinh_ngay_can: 7,
      trang_thai_mac_dinh: 0,
      cho_phep_sua_sau_duyet: false,
    },
  });

  useEffect(() => {
    if (config) {
      reset({
        so_ngay_mac_dinh_ngay_can: config.so_ngay_mac_dinh_ngay_can,
        trang_thai_mac_dinh: config.trang_thai_mac_dinh,
        cho_phep_sua_sau_duyet: config.cho_phep_sua_sau_duyet,
      });
    }
  }, [config, reset]);

  const onSubmit: SubmitHandler<CauHinhChungFormValues> = (data) => {
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
            title={t('thietLapDeXuatVatTu.cauHinhChung.sectionTitle')}
            icon={<Settings size={14} />}
            variant="primary"
          >
            <FormGrid cols={1}>
              <Input
                type="number"
                min={SO_NGAY_MAC_DINH_NGAY_CAN_MIN}
                max={SO_NGAY_MAC_DINH_NGAY_CAN_MAX}
                label={t('thietLapDeXuatVatTu.cauHinhChung.soNgayMacDinhLabel')}
                placeholder={t('thietLapDeXuatVatTu.cauHinhChung.soNgayMacDinhPlaceholder')}
                {...register('so_ngay_mac_dinh_ngay_can')}
                error={errors.so_ngay_mac_dinh_ngay_can?.message}
              />
              <Controller
                name="trang_thai_mac_dinh"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('thietLapDeXuatVatTu.cauHinhChung.trangThaiMacDinhLabel')}
                    options={[
                      { value: '0', label: t('thietLapDeXuatVatTu.cauHinhChung.trangThaiPending') },
                      { value: '1', label: t('thietLapDeXuatVatTu.cauHinhChung.trangThaiApproved') },
                    ]}
                    value={String(field.value)}
                    onChange={(e) => field.onChange(Number(e.target.value) as 0 | 1)}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <Controller
                name="cho_phep_sua_sau_duyet"
                control={control}
                render={({ field }) => (
                  <ToggleSwitch
                    checked={field.value}
                    onChange={field.onChange}
                    label={t('thietLapDeXuatVatTu.cauHinhChung.choPhepSuaSauDuyet')}
                    description={t('thietLapDeXuatVatTu.cauHinhChung.choPhepSuaSauDuyetDesc')}
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
            {t('thietLapDeXuatVatTu.cauHinhChung.saveButton')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CauHinhChungTab;
