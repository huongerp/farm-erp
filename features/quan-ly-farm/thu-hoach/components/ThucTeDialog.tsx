import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList } from 'lucide-react';
import NumberInput from '../../../../components/ui/NumberInput';
import { thuHoachThucTeFormSchema, type ThuHoachThucTeFormValues } from '../core/schema';
import type { FarmThuHoach } from '../core/types';
import { THU_HOACH_DAY_SUFFIXES } from '../core/types';
import { DAY_FORM_LABEL_KEY, farmThuHoachToThucTeForm } from '../core/form-mappers';
import { sumKeHoachWeek, sumThucTeWeek } from '../core/utils';
import { formatNumberVN } from '../../../../lib/utils';
import { useUpdateThuHoachThucTe } from '../hooks/use-thu-hoach';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

interface Props {
  data: FarmThuHoach;
  onClose: () => void;
}

const ThucTeDialog: React.FC<Props> = ({ data, onClose }) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateThuHoachThucTe(onClose);

  const defaultValues = useMemo(() => farmThuHoachToThucTeForm(data), [data]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<ThuHoachThucTeFormValues>({
    resolver: zodResolver(thuHoachThucTeFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const watched = watch();
  const tongKeHoachTuan = useMemo(() => sumKeHoachWeek(data), [data]);
  const tongThucTeTuan = useMemo(
    () =>
      sumThucTeWeek(watched as Pick<FarmThuHoach, `thuc_te_${(typeof THU_HOACH_DAY_SUFFIXES)[number]}`>),
    [watched]
  );

  const onSubmit: SubmitHandler<ThuHoachThucTeFormValues> = (formData) => {
    updateMutation.mutate({ id: data.id, data: formData });
  };

  const pending = isSubmitting || updateMutation.isPending;

  return (
    <GenericDrawer
      title={t('thuHoach.thucTe.title')}
      subtitle={`${t('thuHoach.store.colNam')} ${data.nam} · ${t('thuHoach.store.colTuan')} ${data.tuan}`}
      icon={<ClipboardList className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.MEDIUM}
      footer={
        <FormDrawerFooter
          formId="thu-hoach-thuc-te-form"
          onCancel={onClose}
          isEdit
          isLoading={pending}
          saveLabel={t('thuHoach.thucTe.submit')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form
        id="thu-hoach-thuc-te-form"
        className="space-y-2 pb-2 max-w-full min-w-0"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormSection title={t('thuHoach.detail.thucTe')} className="!p-3 sm:!p-3.5">
          <p className="text-2xs sm:text-caption text-muted-foreground leading-snug mb-1.5 line-clamp-3 sm:line-clamp-none">
            {t('thuHoach.thucTe.planHint')}
          </p>
          {/* Chỉ 2 thứ / hàng (sm+); mobile 1 cột — tránh 3 cột rối */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 w-full min-w-0">
            {THU_HOACH_DAY_SUFFIXES.map((s) => {
              const keHoach = Number(data[`ke_hoach_${s}` as keyof FarmThuHoach] ?? 0);
              return (
                <div
                  key={s}
                  className="rounded-md border border-border/80 bg-card px-2 py-1.5 sm:px-2.5 sm:py-2 min-w-0"
                >
                  <p
                    className="text-caption sm:text-xs font-semibold text-foreground mb-1 truncate"
                    title={t(DAY_FORM_LABEL_KEY[s])}
                  >
                    {t(DAY_FORM_LABEL_KEY[s])}
                  </p>
                  {/* Kế hoạch luôn trên, thực tế luôn dưới — mọi kích thước màn hình */}
                  <div className="flex flex-col gap-1.5 min-w-0 w-full">
                    <div className="w-full min-w-0 rounded border border-border/60 bg-muted/30 px-2 py-1.5">
                      <span className="text-[9px] sm:text-2xs uppercase tracking-wide text-muted-foreground">
                        {t('thuHoach.stats.abbrKH')}
                      </span>
                      <p className="text-xs sm:text-sm font-semibold tabular-nums text-foreground leading-none mt-0.5">
                        {formatNumberVN(keHoach)}
                      </p>
                    </div>
                    <div className="w-full min-w-0">
                      <Controller
                        name={`thuc_te_${s}` as keyof ThuHoachThucTeFormValues}
                        control={control}
                        render={({ field }) => (
                          <NumberInput
                            label={t('thuHoach.stats.abbrTT')}
                            value={field.value as number}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            min={0}
                            maxFractionDigits={2}
                            showZeroFormatted
                            compact
                            className="min-w-0 w-full [&_label]:text-2xs [&_label]:mb-1"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:gap-2 rounded-md border border-border bg-muted/25 px-2 py-1.5 min-w-0">
            <div className="min-w-0 overflow-hidden">
              <p className="text-[9px] sm:text-2xs font-medium text-muted-foreground leading-tight line-clamp-2">
                {t('thuHoach.store.colTongKeHoach')}
              </p>
              <p className="text-sm sm:text-base font-semibold tabular-nums text-foreground mt-0.5 truncate">
                {formatNumberVN(tongKeHoachTuan)}
              </p>
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="text-[9px] sm:text-2xs font-medium text-muted-foreground leading-tight line-clamp-2">
                {t('thuHoach.store.colTongThucTe')}
              </p>
              <p className="text-sm sm:text-base font-semibold tabular-nums text-primary mt-0.5 truncate">
                {formatNumberVN(tongThucTeTuan)}
              </p>
            </div>
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ThucTeDialog;
