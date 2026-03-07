import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelpCircle, Plus, Trash2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '@/components/shared/GenericDrawer';
import FormSection from '@/components/shared/FormSection';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import Button from '@/components/ui/Button';
import type { CauHoi } from '../core/types';
import { cauHoiSchema, type CauHoiFormValues } from '../core/schema';
import { useCreateCauHoi, useUpdateCauHoi } from '../hooks/use-thiet-lap-khoa';

const DEFAULT_VALUES: CauHoiFormValues = {
  noi_dung: '',
  loai: 'trac_nghiem',
  dap_an_options: [{ label: '', dung: false }, { label: '', dung: false }],
  goi_y_cham: '',
};

interface Props {
  idBaiTest: string;
  initialData?: CauHoi | null;
  onClose: () => void;
}

const CauHoiFormDrawer: React.FC<Props> = ({ idBaiTest, initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateCauHoi(idBaiTest, onClose);
  const updateMutation = useUpdateCauHoi(idBaiTest, onClose);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<CauHoiFormValues>({
    resolver: zodResolver(cauHoiSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const loai = watch('loai');
  const options = watch('dap_an_options') ?? [];

  useEffect(() => {
    if (initialData) {
      reset({
        noi_dung: initialData.noi_dung,
        loai: initialData.loai,
        dap_an_options: (initialData.dap_an_options?.length ? initialData.dap_an_options : [{ label: '', dung: false }, { label: '', dung: false }]).map((o) => ({ label: o.label, dung: !!o.dung })),
        goi_y_cham: initialData.goi_y_cham ?? '',
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const addOption = () => setValue('dap_an_options', [...options, { label: '', dung: false }]);
  const removeOption = (i: number) => setValue('dap_an_options', options.filter((_, idx) => idx !== i));
  const setOption = (i: number, field: 'label' | 'dung', v: string | boolean) => {
    const next = [...options];
    next[i] = { ...next[i], [field]: v };
    setValue('dap_an_options', next);
  };
  const setDung = (i: number) => {
    setValue('dap_an_options', options.map((o, idx) => ({ ...o, dung: idx === i })));
  };

  const onSubmit: SubmitHandler<CauHoiFormValues> = (data) => {
    const sanitized = {
      noi_dung: data.noi_dung.trim(),
      loai: data.loai,
      dap_an_options: data.loai === 'trac_nghiem' ? (data.dap_an_options ?? []).filter((o) => o.label.trim()).map((o) => ({ label: o.label.trim(), dung: !!o.dung })) : undefined,
      goi_y_cham: data.loai === 'tu_luan' ? (data.goi_y_cham?.trim() || undefined) : undefined,
    };
    if (isEdit && initialData) updateMutation.mutate({ id: initialData.id, data: sanitized });
    else createMutation.mutate(sanitized);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('thietLapKhoa.cauHoi.title') : t('thietLapKhoa.cauHoi.add')}
      icon={<HelpCircle size={20} />}
      onClose={onClose}
      footer={<FormDrawerFooter formId="cau-hoi-form" onCancel={onClose} isLoading={isLoading} isEdit={isEdit} />}
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="cau-hoi-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormSection title={t('thietLapKhoa.cauHoi.title')}>
          <Textarea {...register('noi_dung')} label={t('thietLapKhoa.cauHoi.title')} placeholder={t('thietLapKhoa.cauHoi.noiDungPlaceholder')} rows={3} error={errors.noi_dung?.message} required autoFocus />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="trac_nghiem" {...register('loai')} />
              <span className="text-sm">{t('thietLapKhoa.cauHoi.tracNghiem')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="tu_luan" {...register('loai')} />
              <span className="text-sm">{t('thietLapKhoa.cauHoi.tuLuan')}</span>
            </label>
          </div>
        </FormSection>
        {loai === 'trac_nghiem' && (
          <FormSection title={t('thietLapKhoa.cauHoi.dapAn')}>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="dungOption" checked={!!opt.dung} onChange={() => setDung(i)} title={t('thietLapKhoa.cauHoi.dung')} />
                <Input value={opt.label} onChange={(e) => setOption(i, 'label', e.target.value)} placeholder={t('thietLapKhoa.cauHoi.dapAnN', { n: i + 1 })} className="flex-1" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(i)}><Trash2 size={14} /></Button>
              </div>
            ))}
            {errors.dap_an_options?.message && (
              <p className="text-sm text-destructive">{errors.dap_an_options.message}</p>
            )}
            <Button type="button" variant="outline" size="sm" className="gap-1 w-fit" onClick={addOption}><Plus size={14} /> {t('thietLapKhoa.cauHoi.addDapAn')}</Button>
          </FormSection>
        )}
        {loai === 'tu_luan' && (
          <FormSection title={t('thietLapKhoa.cauHoi.goiYCham')}>
            <Textarea {...register('goi_y_cham')} placeholder={t('thietLapKhoa.cauHoi.goiYChamPlaceholder')} rows={2} />
          </FormSection>
        )}
      </form>
    </GenericDrawer>
  );
};

export default CauHoiFormDrawer;
