import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Hash, Briefcase, FileText, Link, Calendar, Filter, ListOrdered } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { DeXuatTuyenDung } from '../core/types';
import { DeXuatTuyenDungFormValues, deXuatTuyenDungSchema } from '../core/schema';
import { useCreateDeXuatTuyenDung, useUpdateDeXuatTuyenDung } from '../hooks/use-de-xuat-tuyen-dung';
import { usePositions } from '@/features/he-thong/chuc-vu/hooks/use-chuc-vu';

const DEFAULT_VALUES: DeXuatTuyenDungFormValues = {
  id_chuc_vu: '',
  ma_de_xuat: '',
  tieu_de: null,
  mo_ta: '',
  yeu_cau: '',
  link_tuyen: '',
  so_luong: 1,
  so_luong_da_tuyen: 0,
  han_nop: null,
  trang_thai: 0,
};

const STATUS_OPTIONS = [
  { value: '0', key: 'deXuatTuyenDung.status.nhap' },
  { value: '1', key: 'deXuatTuyenDung.status.choDuyet' },
  { value: '2', key: 'deXuatTuyenDung.status.daDuyet' },
  { value: '3', key: 'deXuatTuyenDung.status.tuChoi' },
];

interface Props {
  initialData?: DeXuatTuyenDung | null;
  onClose: () => void;
}

const DeXuatTuyenDungForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const { data: positions = [] } = usePositions();
  const isEdit = !!initialData;
  const createMutation = useCreateDeXuatTuyenDung(onClose);
  const updateMutation = useUpdateDeXuatTuyenDung(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<DeXuatTuyenDungFormValues>({
    resolver: zodResolver(deXuatTuyenDungSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const positionOptions = useMemo(
    () =>
      positions
        .filter((p) => p.trang_thai === 1)
        .map((p) => ({ value: p.id, label: p.ten_chuc_vu })),
    [positions]
  );

  const statusSelectOptions = useMemo(
    () => STATUS_OPTIONS.map(({ value, key }) => ({ value, label: t(key) })),
    [t]
  );

  useEffect(() => {
    if (initialData) {
      reset({
        id_chuc_vu: initialData.id_chuc_vu,
        ma_de_xuat: initialData.ma_de_xuat,
        tieu_de: initialData.tieu_de ?? null,
        mo_ta: initialData.mo_ta,
        yeu_cau: initialData.yeu_cau,
        link_tuyen: initialData.link_tuyen,
        so_luong: initialData.so_luong,
        so_luong_da_tuyen: initialData.so_luong_da_tuyen ?? 0,
        han_nop: initialData.han_nop ?? null,
        trang_thai: initialData.trang_thai,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<DeXuatTuyenDungFormValues> = (data) => {
    const payload = {
      ...data,
      tieu_de: data.tieu_de === '' ? null : data.tieu_de,
      han_nop: data.han_nop === '' ? null : data.han_nop,
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('deXuatTuyenDung.form.editTitle') : t('deXuatTuyenDung.form.createTitle')}
      icon={<Briefcase size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="de-xuat-tuyen-dung-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('deXuatTuyenDung.form.save')}
          createLabel={t('deXuatTuyenDung.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="de-xuat-tuyen-dung-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Section 1: Thông tin cơ bản */}
        <FormSection title={t('deXuatTuyenDung.form.basicInfo')} icon={<ListOrdered size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('deXuatTuyenDung.form.maDeXuat')}
              placeholder={t('deXuatTuyenDung.form.maDeXuatPlaceholder')}
              icon={<Hash size={14} />}
              required
              {...register('ma_de_xuat')}
              error={errors.ma_de_xuat?.message}
            />
            <Controller
              name="id_chuc_vu"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('deXuatTuyenDung.form.chucVu')}
                  options={positionOptions}
                  placeholder={t('deXuatTuyenDung.form.chucVuPlaceholder')}
                  icon={<Briefcase size={14} />}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.id_chuc_vu?.message}
                  required
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('deXuatTuyenDung.form.tieuDe')}
                placeholder={t('deXuatTuyenDung.form.tieuDePlaceholder')}
                icon={<FileText size={14} />}
                {...register('tieu_de')}
                error={errors.tieu_de?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('deXuatTuyenDung.form.status')}
                  options={statusSelectOptions}
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  icon={<Filter size={14} />}
                  error={errors.trang_thai?.message}
                  required
                />
              )}
            />
          </FormGrid>
        </FormSection>

        {/* Section 2: Nội dung tuyển dụng */}
        <FormSection title={t('deXuatTuyenDung.form.jobContent')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="mo_ta"
                control={control}
                render={({ field }) => (
                  <Textarea
                    label={t('deXuatTuyenDung.form.moTa')}
                    placeholder={t('deXuatTuyenDung.form.moTaPlaceholder')}
                    {...field}
                    error={errors.mo_ta?.message}
                    rows={4}
                    required
                  />
                )}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="yeu_cau"
                control={control}
                render={({ field }) => (
                  <Textarea
                    label={t('deXuatTuyenDung.form.yeuCau')}
                    placeholder={t('deXuatTuyenDung.form.yeuCauPlaceholder')}
                    {...field}
                    error={errors.yeu_cau?.message}
                    rows={4}
                    required
                  />
                )}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('deXuatTuyenDung.form.linkTuyen')}
                placeholder={t('deXuatTuyenDung.form.linkTuyenPlaceholder')}
                icon={<Link size={14} />}
                required
                {...register('link_tuyen')}
                error={errors.link_tuyen?.message}
              />
            </div>
          </FormGrid>
        </FormSection>

        {/* Section 3: Số lượng & trạng thái */}
        <FormSection title={t('deXuatTuyenDung.form.quantityAndStatus')} icon={<Calendar size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('deXuatTuyenDung.form.soLuong')}
              placeholder={t('deXuatTuyenDung.form.soLuongPlaceholder')}
              type="number"
              min={1}
              required
              {...register('so_luong')}
              error={errors.so_luong?.message}
            />
            {/* Số lượng đã tuyển / đã nghỉ / còn lại được tính tự động từ ứng viên + trạng thái ứng viên (xem danh sách & chi tiết). */}
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('deXuatTuyenDung.form.hanNop')}
                placeholder={t('deXuatTuyenDung.form.hanNopPlaceholder')}
                type="date"
                icon={<Calendar size={14} />}
                {...register('han_nop')}
                error={errors.han_nop?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DeXuatTuyenDungForm;
