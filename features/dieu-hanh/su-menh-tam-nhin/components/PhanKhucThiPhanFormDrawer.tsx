import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { PieChart } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import { phanKhucThiPhanSchema, type PhanKhucThiPhanFormValues } from '../core/schema';
import type { PhanKhucThiPhan } from '../core/types';
import { useUpdatePhanKhucThiPhan } from '../hooks/use-su-menh-tam-nhin';

interface Props {
  segments: PhanKhucThiPhan[];
  editingId: string | null;
  onClose: () => void;
}

const PhanKhucThiPhanFormDrawer: React.FC<Props> = ({
  segments,
  editingId,
  onClose,
}) => {
  const { t } = useTranslation();
  const updateMutation = useUpdatePhanKhucThiPhan();
  const existing = editingId != null ? segments.find((x) => x.id === editingId) : undefined;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PhanKhucThiPhanFormValues>({
    resolver: zodResolver(phanKhucThiPhanSchema),
    defaultValues: {
      ten: existing?.ten ?? '',
      thu_tu: existing?.thu_tu ?? segments.length,
    },
  });

  useEffect(() => {
    reset({
      ten: existing?.ten ?? '',
      thu_tu: existing?.thu_tu ?? segments.length,
    });
  }, [editingId, existing, segments.length, reset]);

  const onSubmit: SubmitHandler<PhanKhucThiPhanFormValues> = async (data) => {
    if (existing) {
      const next = segments.map((s) =>
        s.id === existing.id ? { ...s, ten: data.ten, thu_tu: data.thu_tu } : s
      );
      await updateMutation.mutateAsync(next);
    } else {
      const newSeg: PhanKhucThiPhan = {
        id: `pk-${Date.now()}`,
        ten: data.ten,
        thu_tu: data.thu_tu,
      };
      await updateMutation.mutateAsync([...segments, newSeg].sort((a, b) => a.thu_tu - b.thu_tu));
    }
    toast.success(t('suMenhTamNhin.saveSuccess'));
    onClose();
  };

  const isLoading = updateMutation.isPending;

  return (
    <GenericDrawer
      title={t('suMenhTamNhin.editSegment')}
      icon={<PieChart size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="phan-khuc-thi-phan-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit
          saveLabel={t('common.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="phan-khuc-thi-phan-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('suMenhTamNhin.segmentName')} variant="primary">
          <Input
            label={t('suMenhTamNhin.segmentName')}
            placeholder={t('suMenhTamNhin.segmentNamePlaceholder')}
            {...register('ten')}
            error={errors.ten?.message ? t(errors.ten.message as string) : undefined}
          />
        </FormSection>
        <FormSection title={t('suMenhTamNhin.order')} variant="primary">
          <Input
            type="number"
            min={0}
            label={t('suMenhTamNhin.order')}
            {...register('thu_tu', { valueAsNumber: true })}
            error={errors.thu_tu?.message ? t(errors.thu_tu.message as string) : undefined}
          />
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default PhanKhucThiPhanFormDrawer;
