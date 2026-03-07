import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, User, CircleDot, Video, MapPin, Award } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { LichPhongVan } from '../core/types';
import { LichPhongVanFormValues, lichPhongVanSchema } from '../core/schema';
import { HINH_THUC_OPTIONS, TRANG_THAI_LICH_PV_KEYS, TRANG_THAI_DANH_GIA_KEYS } from '../core/constants';
import { useCreateLichPhongVan, useUpdateLichPhongVan } from '../hooks/use-lich-phong-van';
import { useUngViens } from '@/features/nhan-su/ung-vien/hooks/use-ung-vien';

const DEFAULT_VALUES: LichPhongVanFormValues = {
  id_ung_vien: '',
  so_vong: 1,
  ngay: '',
  gio: '09:00',
  hinh_thuc: 'offline',
  dia_diem: '',
  trang_thai: 0,
  trang_thai_danh_gia: 0,
  danh_gia_diem_so: null,
  danh_gia_nhan_xet: null,
  ket_qua: null,
  ghi_chu: null,
};

interface Props {
  initialData?: LichPhongVan | null;
  /** Khi thêm từ detail Ứng viên: preset id_ung_vien */
  initialIdUngVien?: string;
  onClose: () => void;
}

const LichPhongVanForm: React.FC<Props> = ({ initialData, initialIdUngVien, onClose }) => {
  const { t } = useTranslation();
  const { data: ungVienList = [] } = useUngViens();
  const isEdit = !!initialData;
  const createMutation = useCreateLichPhongVan(onClose);
  const updateMutation = useUpdateLichPhongVan(onClose);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LichPhongVanFormValues>({
    resolver: zodResolver(lichPhongVanSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const ungVienOptions = useMemo(
    () =>
      ungVienList.map((u) => ({
        value: u.id,
        label: `${u.ho_ten}${u.ma_de_xuat ? ` · ${u.ma_de_xuat}` : ''}`,
      })),
    [ungVienList]
  );

  const trangThaiOptions = useMemo(
    () =>
      [0, 1, 2, 3].map((value) => ({
        value: String(value),
        label: t(TRANG_THAI_LICH_PV_KEYS[value]),
      })),
    [t]
  );

  const hinhThucOptions = useMemo(
    () =>
      HINH_THUC_OPTIONS.map(({ value, labelKey }) => ({
        value,
        label: t(labelKey),
      })),
    [t]
  );

  const trangThaiDanhGiaOptions = useMemo(
    () =>
      [0, 1, 2].map((value) => ({
        value: String(value),
        label: t(TRANG_THAI_DANH_GIA_KEYS[value]),
      })),
    [t]
  );

  useEffect(() => {
    if (initialData) {
      reset({
        id_ung_vien: initialData.id_ung_vien,
        so_vong: initialData.so_vong,
        ngay: initialData.ngay,
        gio: initialData.gio,
        hinh_thuc: initialData.hinh_thuc,
        dia_diem: initialData.dia_diem,
        trang_thai: initialData.trang_thai,
        trang_thai_danh_gia: initialData.trang_thai_danh_gia ?? 0,
        danh_gia_diem_so: initialData.danh_gia_diem_so ?? null,
        danh_gia_nhan_xet: initialData.danh_gia_nhan_xet ?? null,
        ket_qua: initialData.ket_qua ?? null,
        ghi_chu: initialData.ghi_chu ?? null,
      });
    } else {
      reset({
        ...DEFAULT_VALUES,
        id_ung_vien: initialIdUngVien ?? '',
      });
    }
  }, [initialData, initialIdUngVien, reset]);

  const onSubmit: SubmitHandler<LichPhongVanFormValues> = (data) => {
    const payload: LichPhongVanFormValues = {
      ...data,
      trang_thai_danh_gia: data.trang_thai_danh_gia ?? 0,
      danh_gia_diem_so: data.danh_gia_diem_so === '' ? null : data.danh_gia_diem_so,
      danh_gia_nhan_xet: data.danh_gia_nhan_xet === '' ? null : data.danh_gia_nhan_xet,
      ket_qua: data.ket_qua === '' ? null : data.ket_qua,
      ghi_chu: data.ghi_chu === '' ? null : data.ghi_chu,
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
      title={isEdit ? t('lichPhongVan.form.editTitle') : t('lichPhongVan.form.createTitle')}
      icon={<Calendar size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="lich-phong-van-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('lichPhongVan.form.save')}
          createLabel={t('lichPhongVan.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="lich-phong-van-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <FormSection title={t('lichPhongVan.detail.sectionInfo')} icon={<Calendar size={14} />} variant="primary">
          <FormGrid cols={2}>
            <div className="col-span-2">
              <Controller
                name="id_ung_vien"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('lichPhongVan.form.ungVien')}
                    options={ungVienOptions}
                    placeholder={t('lichPhongVan.form.ungVienPlaceholder')}
                    icon={<User size={14} />}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={errors.id_ung_vien?.message}
                    required
                    disabled={!!initialIdUngVien}
                  />
                )}
              />
            </div>
            <Input
              label={t('lichPhongVan.form.soVong')}
              type="number"
              min={1}
              placeholder={t('lichPhongVan.form.soVongPlaceholder')}
              {...register('so_vong')}
              error={errors.so_vong?.message}
              required
            />
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('lichPhongVan.form.trangThai')}
                  options={trangThaiOptions}
                  icon={<CircleDot size={14} />}
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={errors.trang_thai?.message}
                />
              )}
            />
            <Input
              label={t('lichPhongVan.form.ngay')}
              type="date"
              icon={<Calendar size={14} />}
              {...register('ngay')}
              error={errors.ngay?.message}
              required
            />
            <Input
              label={t('lichPhongVan.form.gio')}
              type="time"
              placeholder={t('lichPhongVan.form.gioPlaceholder')}
              icon={<Calendar size={14} />}
              {...register('gio')}
              error={errors.gio?.message}
              required
            />
            <Controller
              name="hinh_thuc"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('lichPhongVan.form.hinhThuc')}
                  options={hinhThucOptions}
                  icon={<Video size={14} />}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value as 'online' | 'offline')}
                  error={errors.hinh_thuc?.message}
                  required
                />
              )}
            />
            <div className="col-span-2">
              <Input
                label={t('lichPhongVan.form.diaDiem')}
                placeholder={t('lichPhongVan.form.diaDiemPlaceholder')}
                icon={<MapPin size={14} />}
                {...register('dia_diem')}
                error={errors.dia_diem?.message}
                required
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('lichPhongVan.detail.sectionDanhGia')} icon={<Award size={14} />} variant="primary">
          <FormGrid cols={1}>
            <Controller
              name="trang_thai_danh_gia"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('lichPhongVan.store.trangThaiDanhGiaCol')}
                  options={trangThaiDanhGiaOptions}
                  value={field.value != null ? String(field.value) : '0'}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={errors.trang_thai_danh_gia?.message}
                />
              )}
            />
            <Input
              label={t('lichPhongVan.form.danhGiaDiemSo')}
              {...register('danh_gia_diem_so')}
            />
            <Textarea
              label={t('lichPhongVan.form.danhGiaNhanXet')}
              {...register('danh_gia_nhan_xet')}
              rows={3}
            />
            <Input
              label={t('lichPhongVan.form.ketQua')}
              {...register('ket_qua')}
            />
            <Textarea
              label={t('lichPhongVan.form.ghiChu')}
              {...register('ghi_chu')}
              rows={2}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default LichPhongVanForm;
