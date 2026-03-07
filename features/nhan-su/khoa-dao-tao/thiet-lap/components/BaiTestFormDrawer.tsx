import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileQuestion } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '@/components/shared/GenericDrawer';
import FormSection from '@/components/shared/FormSection';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import type { BaiTest } from '../core/types';
import { baiTestSchema, type BaiTestFormValues } from '../core/schema';
import { useCreateBaiTest, useUpdateBaiTest } from '../hooks/use-thiet-lap-khoa';

const DEFAULT_VALUES: BaiTestFormValues = {
  ten: '',
  mo_ta: '',
};

interface Props {
  idChuong: string;
  initialData?: BaiTest | null;
  onClose: () => void;
}

const BaiTestFormDrawer: React.FC<Props> = ({ idChuong, initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateBaiTest(idChuong, onClose);
  const updateMutation = useUpdateBaiTest(idChuong, onClose);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BaiTestFormValues>({
    resolver: zodResolver(baiTestSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({ ten: initialData.ten, mo_ta: initialData.mo_ta ?? '' });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<BaiTestFormValues> = (data) => {
    const sanitized = { ten: data.ten.trim(), mo_ta: data.mo_ta?.trim() || undefined };
    if (isEdit && initialData) updateMutation.mutate({ id: initialData.id, data: sanitized });
    else createMutation.mutate(sanitized);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('thietLapKhoa.baiTest.edit') : t('thietLapKhoa.baiTest.add')}
      icon={<FileQuestion size={20} />}
      onClose={onClose}
      footer={<FormDrawerFooter formId="bai-test-form" onCancel={onClose} isLoading={isLoading} isEdit={isEdit} />}
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="bai-test-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormSection title={t('thietLapKhoa.baiTest.title')}>
          <div className="space-y-3">
            <Input {...register('ten')} label={t('khoaDaoTao.form.ten')} placeholder={t('khoaDaoTao.form.tenPlaceholder')} error={errors.ten?.message} required autoFocus />
            <Textarea {...register('mo_ta')} label={t('khoaDaoTao.form.moTa')} placeholder={t('khoaDaoTao.form.moTaPlaceholder')} rows={3} error={errors.mo_ta?.message} />
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default BaiTestFormDrawer;
