import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquare } from 'lucide-react';
import Textarea from '../../../../components/ui/Textarea';
import {
  thuHoachTraoDoiAppendSchema,
  type ThuHoachTraoDoiAppendValues,
} from '../core/schema';
import type { FarmThuHoach } from '../core/types';
import { useAppendThuHoachTraoDoi } from '../hooks/use-thu-hoach';
import { useAuthStore } from '../../../../store/useStore';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

interface Props {
  data: FarmThuHoach;
  onClose: () => void;
}

const ThuHoachTraoDoiDialog: React.FC<Props> = ({ data, onClose }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const tenNguoiGhi =
    user?.ho_va_ten?.trim() || user?.full_name?.trim() || user?.email?.trim() || '';
  const appendMutation = useAppendThuHoachTraoDoi(onClose);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ThuHoachTraoDoiAppendValues>({
    resolver: zodResolver(thuHoachTraoDoiAppendSchema),
    defaultValues: { noi_dung: '' },
  });

  useEffect(() => {
    reset({ noi_dung: '' });
  }, [data.id, reset]);

  const onSubmit: SubmitHandler<ThuHoachTraoDoiAppendValues> = (formData) => {
    appendMutation.mutate({
      id: data.id,
      noiDung: formData.noi_dung,
      tenNguoiGhi,
    });
  };

  const pending = isSubmitting || appendMutation.isPending;

  return (
    <GenericDrawer
      title={t('thuHoach.traoDoiDialog.title')}
      subtitle={`${t('thuHoach.store.colNam')} ${data.nam} · ${t('thuHoach.store.colTuan')} ${data.tuan}`}
      icon={<MessageSquare className="text-violet-600" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.MEDIUM}
      footer={
        <FormDrawerFooter
          formId="thu-hoach-trao-doi-form"
          onCancel={onClose}
          isEdit
          isLoading={pending}
          saveLabel={t('thuHoach.traoDoiDialog.submit')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id="thu-hoach-trao-doi-form" className="space-y-4 pb-2" onSubmit={handleSubmit(onSubmit)}>
        <p className="text-xs text-muted-foreground leading-relaxed">{t('thuHoach.traoDoiDialog.hint')}</p>
        {(data.trao_doi ?? '').trim() !== '' && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 max-h-40 overflow-y-auto custom-scrollbar">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
              {t('thuHoach.traoDoiDialog.historyLabel')}
            </p>
            <pre className="text-xs whitespace-pre-wrap break-words text-foreground font-sans m-0">
              {data.trao_doi}
            </pre>
          </div>
        )}
        <FormSection title={t('thuHoach.traoDoiDialog.newEntry')} variant="primary">
          <Controller
            name="noi_dung"
            control={control}
            render={({ field }) => (
              <Textarea
                label={t('thuHoach.traoDoiDialog.contentLabel')}
                placeholder={t('thuHoach.traoDoiDialog.contentPlaceholder')}
                {...field}
                value={field.value ?? ''}
                rows={4}
                error={errors.noi_dung?.message}
              />
            )}
          />
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ThuHoachTraoDoiDialog;
