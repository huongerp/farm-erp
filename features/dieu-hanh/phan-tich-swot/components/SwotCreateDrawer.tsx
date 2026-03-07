import React from 'react';
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
import { useCreateSwot } from '../hooks/use-swot';

interface Props {
  nam: number;
  onClose: () => void;
}

function filterEmptyItems<T extends { text?: string }>(arr: T[]): T[] {
  return arr.filter((x) => x.text?.trim()).map((x) => ({ ...x, text: (x.text ?? '').trim() }));
}

const SwotCreateDrawer: React.FC<Props> = ({ nam, onClose }) => {
  const { t } = useTranslation();
  const createMutation = useCreateSwot();

  const defaultValues: SwotFormValues = {
    nam,
    strengths: [{ text: '' }],
    weaknesses: [{ text: '' }],
    opportunities: [{ text: '' }],
    threats: [{ text: '' }],
    industrySuccessFactors: [{ text: '' }],
  };

  const { register, handleSubmit, control, formState: { errors } } = useForm<SwotFormValues>({
    resolver: zodResolver(swotFormSchema),
    defaultValues,
  });

  const s = useFieldArray({ control, name: 'strengths' });
  const w = useFieldArray({ control, name: 'weaknesses' });
  const o = useFieldArray({ control, name: 'opportunities' });
  const tArr = useFieldArray({ control, name: 'threats' });
  const isf = useFieldArray({ control, name: 'industrySuccessFactors' });

  const onSubmit: SubmitHandler<SwotFormValues> = async (formData) => {
    const payload: SwotFormValues = {
      nam: formData.nam,
      strengths: filterEmptyItems(formData.strengths),
      weaknesses: filterEmptyItems(formData.weaknesses),
      opportunities: filterEmptyItems(formData.opportunities),
      threats: filterEmptyItems(formData.threats),
      industrySuccessFactors: filterEmptyItems(formData.industrySuccessFactors ?? []),
    };
    await createMutation.mutateAsync(payload);
    toast.success(t('phanTichSwot.createSuccess'));
    onClose();
  };

  const isLoading = createMutation.isPending;

  const renderList = (
    name: 'strengths' | 'weaknesses' | 'opportunities' | 'threats' | 'industrySuccessFactors',
    fields: { id: string }[],
    append: () => void,
    remove: (i: number) => void
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
      title={t('phanTichSwot.createTitle')}
      subtitle={String(nam)}
      icon={<Grid2X2 size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="swot-create-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={false}
          createLabel={t('phanTichSwot.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="swot-create-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('phanTichSwot.strengths')} variant="primary">
          {renderList('strengths', s.fields, () => s.append({ text: '' }), s.remove)}
        </FormSection>
        <FormSection title={t('phanTichSwot.weaknesses')} variant="primary">
          {renderList('weaknesses', w.fields, () => w.append({ text: '' }), w.remove)}
        </FormSection>
        <FormSection title={t('phanTichSwot.opportunities')} variant="primary">
          {renderList('opportunities', o.fields, () => o.append({ text: '' }), o.remove)}
        </FormSection>
        <FormSection title={t('phanTichSwot.threats')} variant="primary">
          {renderList('threats', tArr.fields, () => tArr.append({ text: '' }), tArr.remove)}
        </FormSection>
        <FormSection title={t('phanTichSwot.industrySuccessFactors')} variant="primary">
          {renderList('industrySuccessFactors', isf.fields, () => isf.append({ text: '' }), isf.remove)}
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default SwotCreateDrawer;
