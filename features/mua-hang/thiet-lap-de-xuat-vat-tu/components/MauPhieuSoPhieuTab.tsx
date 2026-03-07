import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, ArrowLeft, Loader2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import ToggleSwitch from '../../../../components/ui/ToggleSwitch';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import { useCauHinhDeXuatVatTu, useSaveCauHinhDeXuatVatTu } from '../hooks/use-cau-hinh-de-xuat-vat-tu';
import { mauPhieuSoPhieuSchema, type MauPhieuSoPhieuFormValues } from '../core/schema';
import {
  DO_DAI_PHAN_SO_MIN,
  DO_DAI_PHAN_SO_MAX,
  SO_DONG_TOI_DA_MIN,
  SO_DONG_TOI_DA_MAX,
} from '../core/constants';

const MauPhieuSoPhieuTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: config, isLoading: loadingConfig } = useCauHinhDeXuatVatTu();
  const saveMutation = useSaveCauHinhDeXuatVatTu();

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<MauPhieuSoPhieuFormValues>({
    resolver: zodResolver(mauPhieuSoPhieuSchema),
    defaultValues: {
      tien_to_so_phieu: 'PDX-',
      tu_sinh_so_phieu: false,
      do_dai_phan_so: 4,
      so_thu_tu_tiep_theo: 1,
      ngay_can_bat_buoc: true,
      ghi_chu_bat_buoc: false,
      so_dong_toi_da: 0,
    },
  });

  useEffect(() => {
    if (config) {
      reset({
        tien_to_so_phieu: config.tien_to_so_phieu,
        tu_sinh_so_phieu: config.tu_sinh_so_phieu,
        do_dai_phan_so: config.do_dai_phan_so,
        so_thu_tu_tiep_theo: config.so_thu_tu_tiep_theo,
        ngay_can_bat_buoc: config.ngay_can_bat_buoc,
        ghi_chu_bat_buoc: config.ghi_chu_bat_buoc,
        so_dong_toi_da: config.so_dong_toi_da,
      });
    }
  }, [config, reset]);

  const onSubmit: SubmitHandler<MauPhieuSoPhieuFormValues> = (data) => saveMutation.mutate(data);
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
            title={t('thietLapDeXuatVatTu.mauPhieu.sectionTitle')}
            icon={<FileText size={14} />}
            variant="primary"
          >
            <FormGrid cols={1}>
              <Input
                label={t('thietLapDeXuatVatTu.mauPhieu.tienToLabel')}
                placeholder={t('thietLapDeXuatVatTu.mauPhieu.tienToPlaceholder')}
                {...register('tien_to_so_phieu')}
                error={errors.tien_to_so_phieu?.message}
              />
              <Controller
                name="tu_sinh_so_phieu"
                control={control}
                render={({ field }) => (
                  <ToggleSwitch
                    checked={field.value}
                    onChange={field.onChange}
                    label={t('thietLapDeXuatVatTu.mauPhieu.tuSinhSoPhieu')}
                    description={t('thietLapDeXuatVatTu.mauPhieu.tuSinhSoPhieuDesc')}
                  />
                )}
              />
              <Input
                type="number"
                min={DO_DAI_PHAN_SO_MIN}
                max={DO_DAI_PHAN_SO_MAX}
                label={t('thietLapDeXuatVatTu.mauPhieu.doDaiPhanSoLabel')}
                placeholder={t('thietLapDeXuatVatTu.mauPhieu.doDaiPhanSoPlaceholder')}
                {...register('do_dai_phan_so')}
                error={errors.do_dai_phan_so?.message}
              />
              <Input
                type="number"
                min={1}
                label={t('thietLapDeXuatVatTu.mauPhieu.soThuTuLabel')}
                placeholder={t('thietLapDeXuatVatTu.mauPhieu.soThuTuPlaceholder')}
                {...register('so_thu_tu_tiep_theo')}
                error={errors.so_thu_tu_tiep_theo?.message}
              />
              <Controller
                name="ngay_can_bat_buoc"
                control={control}
                render={({ field }) => (
                  <ToggleSwitch
                    checked={field.value}
                    onChange={field.onChange}
                    label={t('thietLapDeXuatVatTu.mauPhieu.ngayCanBatBuoc')}
                  />
                )}
              />
              <Controller
                name="ghi_chu_bat_buoc"
                control={control}
                render={({ field }) => (
                  <ToggleSwitch
                    checked={field.value}
                    onChange={field.onChange}
                    label={t('thietLapDeXuatVatTu.mauPhieu.ghiChuBatBuoc')}
                  />
                )}
              />
              <Input
                type="number"
                min={SO_DONG_TOI_DA_MIN}
                max={SO_DONG_TOI_DA_MAX}
                label={t('thietLapDeXuatVatTu.mauPhieu.soDongToiDaLabel')}
                placeholder={t('thietLapDeXuatVatTu.mauPhieu.soDongToiDaPlaceholder')}
                {...register('so_dong_toi_da')}
                error={errors.so_dong_toi_da?.message}
              />
            </FormGrid>
          </FormSection>
        </div>
        <div className="shrink-0 border-t border-border p-4 flex justify-end">
          <Button type="submit" disabled={isSaving} size="sm" className="bg-primary text-white hover:bg-primary/90">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t('thietLapDeXuatVatTu.mauPhieu.saveButton')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MauPhieuSoPhieuTab;
