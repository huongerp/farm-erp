import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, Folder, DollarSign, FileText } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Combobox from '../../../../components/ui/Combobox';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import { farmHangHoaSchema, type FarmHangHoaFormValues } from '../core/schema';
import type { FarmHangHoa } from '../core/types';
import { useCreateFarmHangHoa, useUpdateFarmHangHoa } from '../hooks/use-farm-hang-hoa';
import { useFarmDanhMucCap2WithParent } from '../hooks/use-farm-danh-muc';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Textarea from '../../../../components/ui/Textarea';

interface Props {
  initialData?: FarmHangHoa | null;
  existingDvtList?: string[];
  onClose: () => void;
  /** Gọi sau khi tạo mới thành công (trước khi đóng drawer nếu onClose được gọi trong callback). */
  onSuccessCreate?: (item: FarmHangHoa) => void;
}

const HangHoaForm: React.FC<Props> = ({ initialData, existingDvtList = [], onClose, onSuccessCreate }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateFarmHangHoa((created) => {
    if (created) onSuccessCreate?.(created);
    onClose();
  });
  const updateMutation = useUpdateFarmHangHoa(onClose);
  const { data: danhMucCap2List = [] } = useFarmDanhMucCap2WithParent();

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('farmHangHoaPhanThuoc.hangHoa.form.categoryNone') },
      ...danhMucCap2List.map((d) => ({
        value: d.id,
        label: d.ten_danh_muc_cha ? `${d.ten_danh_muc_cha} / ${d.ten_danh_muc}` : d.ten_danh_muc,
        subLabel: d.ten_danh_muc,
      })),
    ],
    [danhMucCap2List, t]
  );

  const defaultValues: Partial<FarmHangHoaFormValues> = {
    ma_hang_hoa: '',
    ten_hang_hoa: '',
    id_danh_muc_cap2: null,
    dvt: '',
    don_gia: undefined,
    mo_ta: null,
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<FarmHangHoaFormValues>({
    resolver: zodResolver(farmHangHoaSchema) as any,
    defaultValues,
  });

  const dvtWatch = watch('dvt');

  const dvtOptions = useMemo(() => {
    const items = new Set<string>();
    existingDvtList.forEach((d) => {
      const s = d?.trim();
      if (s) items.add(s);
    });
    const cur = String(dvtWatch ?? '').trim();
    if (cur) items.add(cur);
    return [...items].sort((a, b) => a.localeCompare(b, 'vi')).map((d) => ({ value: d, label: d }));
  }, [existingDvtList, dvtWatch]);

  useEffect(() => {
    if (initialData) {
      reset({
        ma_hang_hoa: initialData.ma_hang_hoa,
        ten_hang_hoa: initialData.ten_hang_hoa,
        id_danh_muc_cap2: initialData.danh_muc_id ?? null,
        dvt: initialData.dvt ?? '',
        don_gia: initialData.don_gia ?? undefined,
        mo_ta: initialData.mo_ta ?? null,
      });
    } else {
      reset({
        ma_hang_hoa: '',
        ten_hang_hoa: '',
        id_danh_muc_cap2: null,
        dvt: '',
        don_gia: undefined,
        mo_ta: null,
      });
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<FarmHangHoaFormValues> = (data) => {
    const sanitized = {
      ...data,
      id_danh_muc_cap2: data.id_danh_muc_cap2 === '' || data.id_danh_muc_cap2 === undefined ? null : data.id_danh_muc_cap2,
      dvt: data.dvt?.trim() || null,
      don_gia:
        data.don_gia != null && !Number.isNaN(Number(data.don_gia)) && Number(data.don_gia) >= 0 ? Number(data.don_gia) : null,
      mo_ta: data.mo_ta?.trim() || null,
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitized });
    } else {
      createMutation.mutate(sanitized);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('farmHangHoaPhanThuoc.hangHoa.form.editTitle') : t('farmHangHoaPhanThuoc.hangHoa.form.createTitle')}
      icon={<Package size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="farm-hh-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('farmHangHoaPhanThuoc.hangHoa.form.save')}
          createLabel={t('farmHangHoaPhanThuoc.hangHoa.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="farm-hh-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('farmHangHoaPhanThuoc.hangHoa.detail.basicInfo')} icon={<Package size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('farmHangHoaPhanThuoc.hangHoa.form.code')}
              placeholder={t('farmHangHoaPhanThuoc.hangHoa.form.codePlaceholder')}
              icon={<Package size={12} />}
              required
              {...register('ma_hang_hoa')}
              error={errors.ma_hang_hoa?.message}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register('ma_hang_hoa').onChange(e);
              }}
            />
            <Input
              label={t('farmHangHoaPhanThuoc.hangHoa.form.name')}
              placeholder={t('farmHangHoaPhanThuoc.hangHoa.form.namePlaceholder')}
              icon={<Package size={12} />}
              required
              {...register('ten_hang_hoa')}
              error={errors.ten_hang_hoa?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="id_danh_muc_cap2"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('farmHangHoaPhanThuoc.hangHoa.form.category')}
                    icon={<Folder size={12} />}
                    options={categoryOptions}
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v ?? '')}
                    placeholder={t('farmHangHoaPhanThuoc.hangHoa.form.categoryPlaceholderCap2')}
                    searchable
                    dropdownInPortal
                    required
                    error={errors.id_danh_muc_cap2?.message}
                  />
                )}
              />
            </div>
            <Controller
              name="dvt"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('farmHangHoaPhanThuoc.hangHoa.form.unit')}
                  icon={<Package size={12} />}
                  options={dvtOptions}
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(typeof v === 'string' ? v : String(v ?? ''))}
                  placeholder={t('farmHangHoaPhanThuoc.hangHoa.form.unitPlaceholder')}
                  searchPlaceholder={t('farmHangHoaPhanThuoc.hangHoa.form.unitSearchPlaceholder')}
                  creatable
                  creatableLabel={t('farmHangHoaPhanThuoc.hangHoa.form.unitCreatableLabel')}
                  searchable
                  dropdownInPortal
                  required
                  error={errors.dvt?.message}
                />
              )}
            />
            <Controller
              name="don_gia"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label={t('farmHangHoaPhanThuoc.hangHoa.form.price')}
                  placeholder={t('farmHangHoaPhanThuoc.hangHoa.form.pricePlaceholder')}
                  icon={<DollarSign size={12} />}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.don_gia?.message}
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                {...register('mo_ta')}
                label={t('farmHangHoaPhanThuoc.hangHoa.detail.description')}
                placeholder={t('farmHangHoaPhanThuoc.hangHoa.form.descriptionPlaceholder')}
                icon={<FileText size={12} />}
                rows={3}
                className="resize-y min-h-[80px]"
                error={errors.mo_ta?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default HangHoaForm;
