import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layers, Hash, Type, ListOrdered, FileText, Power, Calculator } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import StatusToggle from '../../../../components/ui/StatusToggle';
import Select from '../../../../components/ui/Select';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { AssetGroup } from '../core/types';
import { AssetGroupFormValues, assetGroupSchema } from '../core/schema';
import { useCreateAssetGroup, useUpdateAssetGroup } from '../hooks/use-nhom-tai-san';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

const DEFAULT_VALUES: AssetGroupFormValues = {
  ma: '',
  ten: '',
  thu_tu: 0,
  ghi_chu: '',
  trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
  phuong_phap_khau_hao: 'duong_thang',
  ty_le_khau_hao: undefined,
  so_nam_su_dung: undefined,
};

interface Props {
  initialData?: AssetGroup | null;
  onClose: () => void;
}

const NhomTaiSanForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateAssetGroup(onClose);
  const updateMutation = useUpdateAssetGroup(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<AssetGroupFormValues>({
    resolver: zodResolver(assetGroupSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma: initialData.ma,
        ten: initialData.ten,
        thu_tu: initialData.thu_tu,
        ghi_chu: initialData.ghi_chu ?? '',
        trang_thai: initialData.trang_thai,
        phuong_phap_khau_hao: initialData.phuong_phap_khau_hao,
        ty_le_khau_hao: initialData.ty_le_khau_hao ?? undefined,
        so_nam_su_dung: initialData.so_nam_su_dung ?? undefined,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<AssetGroupFormValues> = (data) => {
    const sanitized = {
      ...data,
      ghi_chu: data.ghi_chu?.trim() || undefined,
      ty_le_khau_hao: data.ty_le_khau_hao ?? undefined,
      so_nam_su_dung: data.so_nam_su_dung ?? undefined,
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
      title={isEdit ? t('thietLapTaiSan.nhomTaiSan.form.editTitle') : t('thietLapTaiSan.nhomTaiSan.form.createTitle')}
      icon={<Layers size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="nhom-tai-san-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thietLapTaiSan.nhomTaiSan.form.save')}
          createLabel={t('thietLapTaiSan.nhomTaiSan.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="nhom-tai-san-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('thietLapTaiSan.nhomTaiSan.form.basicInfo')} icon={<ListOrdered size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('thietLapTaiSan.nhomTaiSan.form.ma')}
              placeholder={t('thietLapTaiSan.nhomTaiSan.form.maPlaceholder')}
              icon={<Hash size={14} />}
              {...register('ma')}
              error={errors.ma?.message}
            />
            <Input
              label={t('thietLapTaiSan.nhomTaiSan.form.ten')}
              placeholder={t('thietLapTaiSan.nhomTaiSan.form.tenPlaceholder')}
              icon={<Type size={14} />}
              {...register('ten')}
              error={errors.ten?.message}
            />
            <Input
              type="number"
              min={0}
              label={t('thietLapTaiSan.nhomTaiSan.form.thuTu')}
              placeholder={t('thietLapTaiSan.nhomTaiSan.form.thuTuPlaceholder')}
              icon={<Hash size={14} />}
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('thietLapTaiSan.nhomTaiSan.form.note')}
                placeholder={t('thietLapTaiSan.nhomTaiSan.form.notePlaceholder')}
                icon={<FileText size={12} />}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('thietLapTaiSan.nhomTaiSan.form.status')}
                  value={field.value}
                  onChange={field.onChange}
                  icon={<Power size={12} />}
                  required
                />
              )}
            />
          </FormGrid>
        </FormSection>
        <FormSection title={t('thietLapTaiSan.nhomTaiSan.form.depreciationSection')} icon={<Calculator size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="phuong_phap_khau_hao"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('thietLapTaiSan.nhomTaiSan.form.phuongPhapKhauHao')}
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'duong_thang', label: t('thietLapTaiSan.nhomTaiSan.form.phuongPhapDuongThang') },
                    { value: 'so_du_giam_dan', label: t('thietLapTaiSan.nhomTaiSan.form.phuongPhapSoDuGiamDan') },
                  ]}
                  placeholder={t('thietLapTaiSan.nhomTaiSan.form.phuongPhapPlaceholder')}
                  error={errors.phuong_phap_khau_hao?.message}
                />
              )}
            />
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              label={t('thietLapTaiSan.nhomTaiSan.form.tyLeKhauHao')}
              placeholder={t('thietLapTaiSan.nhomTaiSan.form.tyLeKhauHaoPlaceholder')}
              icon={<Calculator size={14} />}
              {...register('ty_le_khau_hao')}
              error={errors.ty_le_khau_hao?.message}
            />
            <Input
              type="number"
              min={1}
              label={t('thietLapTaiSan.nhomTaiSan.form.soNamSuDung')}
              placeholder={t('thietLapTaiSan.nhomTaiSan.form.soNamSuDungPlaceholder')}
              icon={<Calculator size={14} />}
              {...register('so_nam_su_dung')}
              error={errors.so_nam_su_dung?.message}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default NhomTaiSanForm;
