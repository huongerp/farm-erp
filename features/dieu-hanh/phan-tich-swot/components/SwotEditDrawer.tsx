import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2X2, Plus, Trash2 } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import { swotFormSchema, type SwotFormValues } from '../core/schema';
import type { SwotAnalysis } from '../core/types';
import { useUpdateSwot } from '../hooks/use-swot';

interface Props {
  data: SwotAnalysis;
  onClose: () => void;
}

function toFormValues(d: SwotAnalysis): SwotFormValues {
  const toItems = (arr: { id: string; text: string }[]) =>
    arr.length > 0
      ? arr.map((x) => ({ id: x.id, text: x.text }))
      : [{ text: '' }];
  return {
    nam: d.nam,
    strengths: toItems(d.strengths),
    weaknesses: toItems(d.weaknesses),
    opportunities: toItems(d.opportunities),
    threats: toItems(d.threats),
    industrySuccessFactors: toItems(d.industrySuccessFactors ?? []),
  };
}

function filterEmptyItems<T extends { text?: string }>(arr: T[]): T[] {
  return arr.filter((x) => x.text?.trim()).map((x) => ({ ...x, text: (x.text ?? '').trim() }));
}

const SwotEditDrawer: React.FC<Props> = ({ data, onClose }) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateSwot();

  const defaultValues = toFormValues(data);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<SwotFormValues>({
    resolver: zodResolver(swotFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(toFormValues(data));
  }, [data, reset]);

  const s = useFieldArray({ control, name: 'strengths' });
  const w = useFieldArray({ control, name: 'weaknesses' });
  const o = useFieldArray({ control, name: 'opportunities' });
  const tArr = useFieldArray({ control, name: 'threats' });
  const isf = useFieldArray({ control, name: 'industrySuccessFactors' });

  const onSubmit: SubmitHandler<SwotFormValues> = async (formData) => {
    const payload = {
      strengths: filterEmptyItems(formData.strengths),
      weaknesses: filterEmptyItems(formData.weaknesses),
      opportunities: filterEmptyItems(formData.opportunities),
      threats: filterEmptyItems(formData.threats),
      industrySuccessFactors: filterEmptyItems(formData.industrySuccessFactors ?? []),
    };
    await updateMutation.mutateAsync({ idOrNam: data.id, payload });
    toast.success(t('phanTichSwot.saveSuccess'));
    onClose();
  };

  const isLoading = updateMutation.isPending;

  const renderList = (
    name: 'strengths' | 'weaknesses' | 'opportunities' | 'threats' | 'industrySuccessFactors',
    fields: { id: string }[],
    append: () => void,
    remove: (i: number) => void,
    titleKey: string
  ) => (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-start">
          <Input
            placeholder={t('phanTichSwot.itemPlaceholder')}
            className="flex-1"
            {...register(`${name}.${index}.text`)}
            error={errors[name]?.[index]?.text?.message ? t(errors[name][index].text.message as string) : undefined}
          />
          {fields.length > 1 && (
            <Button type="button" size="sm" variant="ghost" className="text-destructive shrink-0" onClick={() => remove(index)}>
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={append} className="w-full border-dashed">
        <Plus size={14} className="mr-1.5" />
        {t('common.add')}
      </Button>
    </div>
  );

  return (
    <GenericDrawer
      title={t('phanTichSwot.editTitle')}
      subtitle={String(data.nam)}
      icon={<Grid2X2 size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="swot-edit-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit
          saveLabel={t('common.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="swot-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('phanTichSwot.strengths')} variant="primary">
          {renderList('strengths', s.fields, () => s.append({ text: '' }), s.remove, 'strengths')}
        </FormSection>
        <FormSection title={t('phanTichSwot.weaknesses')} variant="primary">
          {renderList('weaknesses', w.fields, () => w.append({ text: '' }), w.remove, 'weaknesses')}
        </FormSection>
        <FormSection title={t('phanTichSwot.opportunities')} variant="primary">
          {renderList('opportunities', o.fields, () => o.append({ text: '' }), o.remove, 'opportunities')}
        </FormSection>
        <FormSection title={t('phanTichSwot.threats')} variant="primary">
          {renderList('threats', tArr.fields, () => tArr.append({ text: '' }), tArr.remove, 'threats')}
        </FormSection>
        <FormSection title={t('phanTichSwot.industrySuccessFactors')} variant="primary">
          {renderList('industrySuccessFactors', isf.fields, () => isf.append({ text: '' }), isf.remove, 'industrySuccessFactors')}
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default SwotEditDrawer;
