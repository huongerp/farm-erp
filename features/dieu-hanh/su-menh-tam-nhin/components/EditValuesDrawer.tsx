import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler, useFieldArray, Control, FieldArrayPath } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, Plus, Trash2 } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import { valuesFormSchema, type ValuesFormValues } from '../core/schema';
import type { CoreValue } from '../core/types';
import { useUpdateValues } from '../hooks/use-su-menh-tam-nhin';

interface Props {
  values: CoreValue[];
  onClose: () => void;
}

function mapValueToForm(v: CoreValue) {
  return {
    id: v.id,
    ten: v.ten,
    mo_ta: v.mo_ta ?? '',
    thu_tu: v.thu_tu,
    mo_dich: v.mo_dich ?? '',
    hanh_vi_nen_lam: v.hanh_vi_nen_lam?.length ? [...v.hanh_vi_nen_lam] : [],
    hanh_vi_khong_nen_lam: v.hanh_vi_khong_nen_lam?.length ? [...v.hanh_vi_khong_nen_lam] : [],
  };
}

function BehaviorList({
  control,
  index,
  name,
  label,
}: {
  control: Control<ValuesFormValues>;
  index: number;
  name: 'hanh_vi_nen_lam' | 'hanh_vi_khong_nen_lam';
  label: string;
}) {
  const { t } = useTranslation();
  const fieldName = `gia_tri.${index}.${name}` as FieldArrayPath<ValuesFormValues>;
  const { fields, append, remove } = useFieldArray({ control, name: fieldName });

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-muted-foreground block">{label}</span>
      <ul className="space-y-1.5">
        {fields.map((field, i) => (
          <li key={field.id} className="flex gap-2 items-center">
            <Input
              placeholder={t('suMenhTamNhin.behaviorPlaceholder')}
              className="flex-1"
              {...control.register(`${fieldName}.${i}` as const)}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="shrink-0 text-destructive hover:text-destructive h-8 w-8 p-0"
              onClick={() => remove(i)}
              aria-label={t('suMenhTamNhin.removeBehavior')}
            >
              <Trash2 size={14} />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="text-primary border border-dashed border-primary/40"
        onClick={() => append('')}
      >
        <Plus size={14} className="mr-1.5" />
        {t('suMenhTamNhin.addBehavior')}
      </Button>
    </div>
  );
}

const EditValuesDrawer: React.FC<Props> = ({ values, onClose }) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateValues();

  const initialGiaTri =
    values.length > 0
      ? values.sort((a, b) => a.thu_tu - b.thu_tu).map(mapValueToForm)
      : [{ ten: '', mo_ta: '', thu_tu: 0, mo_dich: '', hanh_vi_nen_lam: [], hanh_vi_khong_nen_lam: [] }];

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ValuesFormValues>({
    resolver: zodResolver(valuesFormSchema),
    defaultValues: { gia_tri: initialGiaTri },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'gia_tri' });

  useEffect(() => {
    const next =
      values.length > 0
        ? values.sort((a, b) => a.thu_tu - b.thu_tu).map(mapValueToForm)
        : [{ ten: '', mo_ta: '', thu_tu: 0, mo_dich: '', hanh_vi_nen_lam: [], hanh_vi_khong_nen_lam: [] }];
    reset({ gia_tri: next });
  }, [values, reset]);

  const onSubmit: SubmitHandler<ValuesFormValues> = async (data) => {
    const normalized = data.gia_tri
      .filter((v) => v.ten?.trim())
      .map((v, i) => ({
        id: v.id,
        ten: v.ten.trim(),
        mo_ta: v.mo_ta || '',
        thu_tu: i,
        mo_dich: v.mo_dich?.trim() || '',
        hanh_vi_nen_lam: (v.hanh_vi_nen_lam ?? []).filter((s) => String(s).trim()),
        hanh_vi_khong_nen_lam: (v.hanh_vi_khong_nen_lam ?? []).filter((s) => String(s).trim()),
      }));
    await updateMutation.mutateAsync({ gia_tri: normalized });
    toast.success(t('suMenhTamNhin.saveSuccess'));
    onClose();
  };

  const isLoading = updateMutation.isPending;

  return (
    <GenericDrawer
      title={t('suMenhTamNhin.editValues')}
      icon={<Heart size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="values-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit
          saveLabel={t('common.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="values-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('suMenhTamNhin.coreValues')} icon={<Heart size={14} />} variant="primary">
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-3 rounded-lg border border-border bg-muted/20 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('suMenhTamNhin.value')} {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder={t('suMenhTamNhin.valueNamePlaceholder')}
                  {...register(`gia_tri.${index}.ten`)}
                  error={errors.gia_tri?.[index]?.ten?.message ? t(errors.gia_tri[index].ten.message as string) : undefined}
                />
                <Textarea
                  placeholder={t('suMenhTamNhin.valueDescPlaceholder')}
                  rows={2}
                  {...register(`gia_tri.${index}.mo_ta`)}
                />
                <Textarea
                  label={t('suMenhTamNhin.purpose')}
                  placeholder={t('suMenhTamNhin.purposePlaceholder')}
                  rows={2}
                  {...register(`gia_tri.${index}.mo_dich`)}
                />
                <BehaviorList
                  control={control}
                  index={index}
                  name="hanh_vi_nen_lam"
                  label={t('suMenhTamNhin.behaviorsToDo')}
                />
                <BehaviorList
                  control={control}
                  index={index}
                  name="hanh_vi_khong_nen_lam"
                  label={t('suMenhTamNhin.behaviorsNotToDo')}
                />
                <input type="hidden" {...register(`gia_tri.${index}.thu_tu`)} value={index} />
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                append({
                  ten: '',
                  mo_ta: '',
                  thu_tu: fields.length,
                  mo_dich: '',
                  hanh_vi_nen_lam: [],
                  hanh_vi_khong_nen_lam: [],
                })
              }
              className="w-full border-dashed"
            >
              <Plus size={14} className="mr-1.5" />
              {t('suMenhTamNhin.addValue')}
            </Button>
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default EditValuesDrawer;
