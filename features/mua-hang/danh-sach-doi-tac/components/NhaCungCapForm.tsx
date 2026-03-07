import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, FileText, ArrowUpFromLine, Power, MapPin, Phone, Mail, Folder } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import Select from '../../../../components/ui/Select';
import MultiSelect from '../../../../components/ui/MultiSelect';
import { NhaCungCapFormValues, nhaCungCapSchema } from '../core/schema';
import type { NhaCungCap, NhomDoiTac, Tag as TagType } from '../core/types';
import { useCreateNhaCungCap, useUpdateNhaCungCap, useCreateTag } from '../hooks/use-nha-cung-cap';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

interface Props {
  initialData?: NhaCungCap | null;
  nhomList: NhomDoiTac[];
  tagList: TagType[];
  onClose: () => void;
}

const NhaCungCapForm: React.FC<Props> = ({ initialData, nhomList, tagList, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateNhaCungCap(onClose);
  const updateMutation = useUpdateNhaCungCap(onClose);
  const createTagMutation = useCreateTag();

  const groupOptions = useMemo(
    () => [
      { value: '', label: t('nhaCungCapMuaHang.form.groupNone') },
      ...nhomList.map((n) => ({ value: n.id, label: n.ten_nhom })),
    ],
    [nhomList, t]
  );

  const tagOptions = useMemo(
    () => tagList.map((tag) => ({ label: tag.ten_tag, value: tag.id })),
    [tagList]
  );

  const defaultValues: Partial<NhaCungCapFormValues> = {
    ma_ncc: '',
    ten_ncc: '',
    id_nhom: null,
    dia_chi: '',
    dien_thoai: '',
    email: '',
    mo_ta: '',
    tag_ids: [],
    trang_thai: 1,
    thu_tu: 0,
  };

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<NhaCungCapFormValues>({
    resolver: zodResolver(nhaCungCapSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma_ncc: initialData.ma_ncc,
        ten_ncc: initialData.ten_ncc,
        id_nhom: initialData.id_nhom ?? null,
        dia_chi: initialData.dia_chi ?? '',
        dien_thoai: initialData.dien_thoai ?? '',
        email: initialData.email ?? '',
        mo_ta: initialData.mo_ta ?? '',
        tag_ids: initialData.tag_ids ?? [],
        trang_thai: initialData.trang_thai,
        thu_tu: initialData.thu_tu,
      });
    } else {
      reset(defaultValues);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<NhaCungCapFormValues> = (data) => {
    const sanitized = {
      ...data,
      id_nhom: data.id_nhom === '' || data.id_nhom === undefined ? null : data.id_nhom,
      dia_chi: data.dia_chi?.trim() || undefined,
      dien_thoai: data.dien_thoai?.trim() || undefined,
      email: data.email?.trim() || undefined,
      mo_ta: data.mo_ta?.trim() || undefined,
      tag_ids: Array.isArray(data.tag_ids) ? data.tag_ids : [],
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
      title={isEdit ? t('nhaCungCapMuaHang.form.editTitle') : t('nhaCungCapMuaHang.form.createTitle')}
      icon={<Users size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="nha-cung-cap-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('nhaCungCapMuaHang.form.save')}
          createLabel={t('nhaCungCapMuaHang.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="nha-cung-cap-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('nhaCungCapMuaHang.detail.basicInfo')} icon={<Users size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('nhaCungCapMuaHang.form.code')}
              placeholder={t('nhaCungCapMuaHang.form.codePlaceholder')}
              icon={<Users size={12} />}
              required
              {...register('ma_ncc')}
              error={errors.ma_ncc?.message}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register('ma_ncc').onChange(e);
              }}
            />
            <Input
              label={t('nhaCungCapMuaHang.form.name')}
              placeholder={t('nhaCungCapMuaHang.form.namePlaceholder')}
              icon={<Users size={12} />}
              required
              {...register('ten_ncc')}
              error={errors.ten_ncc?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="id_nhom"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('nhaCungCapMuaHang.form.group')}
                    icon={<Folder size={12} />}
                    options={groupOptions}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                  />
                )}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('nhaCungCapMuaHang.form.address')}
                placeholder={t('nhaCungCapMuaHang.form.addressPlaceholder')}
                icon={<MapPin size={12} />}
                {...register('dia_chi')}
                error={errors.dia_chi?.message}
              />
            </div>
            <Input
              label={t('nhaCungCapMuaHang.form.phone')}
              placeholder={t('nhaCungCapMuaHang.form.phonePlaceholder')}
              icon={<Phone size={12} />}
              {...register('dien_thoai')}
              error={errors.dien_thoai?.message}
            />
            <Input
              label={t('nhaCungCapMuaHang.form.email')}
              placeholder={t('nhaCungCapMuaHang.form.emailPlaceholder')}
              type="email"
              icon={<Mail size={12} />}
              {...register('email')}
              error={errors.email?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="tag_ids"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    label={t('nhaCungCapMuaHang.form.tags')}
                    options={tagOptions}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder={t('nhaCungCapMuaHang.form.tagsPlaceholder')}
                    createOptionLabel={t('nhaCungCapMuaHang.form.createTagLabel')}
                    onCreateOption={async (label) => {
                      const tag = await createTagMutation.mutateAsync(label);
                      return tag.id;
                    }}
                  />
                )}
              />
            </div>
            <Input
              type="number"
              label={t('nhaCungCapMuaHang.detail.order')}
              icon={<ArrowUpFromLine size={12} />}
              required
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                {...register('mo_ta')}
                label={t('nhaCungCapMuaHang.form.description')}
                placeholder={t('nhaCungCapMuaHang.form.descriptionPlaceholder')}
                icon={<FileText size={12} />}
                rows={3}
                className="resize-y min-h-[80px]"
                error={errors.mo_ta?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('common.status')}
                  value={field.value}
                  onChange={field.onChange}
                  icon={<Power size={12} />}
                  required
                />
              )}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default NhaCungCapForm;
