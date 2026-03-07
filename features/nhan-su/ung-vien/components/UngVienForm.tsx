import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, MapPin, Calendar, Briefcase, Tag, FileText } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { TaiLieuSubTableForm } from './TaiLieuSubTable';
import type { UngVien } from '../core/types';
import { UngVienFormValues, ungVienSchema } from '../core/schema';
import { useCreateUngVien, useUpdateUngVien } from '../hooks/use-ung-vien';
import { useDeXuatTuyenDungs } from '@/features/nhan-su/de-xuat-tuyen-dung/hooks/use-de-xuat-tuyen-dung';
import { useTrangThaiUngViens } from '@/features/nhan-su/thiet-lap-tuyen-dung/hooks/use-trang-thai-ung-vien';
import { useKenhTuyenDungs } from '@/features/nhan-su/thiet-lap-tuyen-dung/hooks/use-kenh-tuyen-dung';

const DEFAULT_VALUES: UngVienFormValues = {
  ho_ten: '',
  email: '',
  so_dien_thoai: '',
  dia_chi: null,
  ngay_sinh: null,
  ghi_chu_noi_bo: null,
  id_de_xuat_tuyen_dung: '',
  id_trang_thai_ung_vien: '',
  id_kenh_tuyen_dung: null,
  ngay_phong_van_gan_nhat: null,
  ket_qua_phan_hoi_gan_nhat: null,
  tai_lieu: [],
};

interface Props {
  initialData?: UngVien | null;
  /** Khi tạo mới, preset đề xuất tuyển dụng (mở từ detail đề xuất). */
  initialIdDeXuatTuyenDung?: string;
  onClose: () => void;
}

const UngVienForm: React.FC<Props> = ({ initialData, initialIdDeXuatTuyenDung, onClose }) => {
  const { t } = useTranslation();
  const { data: deXuatList = [] } = useDeXuatTuyenDungs();
  const { data: trangThaiList = [] } = useTrangThaiUngViens();
  const { data: kenhList = [] } = useKenhTuyenDungs();
  const isEdit = !!initialData;
  const createMutation = useCreateUngVien(onClose);
  const updateMutation = useUpdateUngVien(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<UngVienFormValues>({
    resolver: zodResolver(ungVienSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { fields: taiLieuFields, append: appendTaiLieu, remove: removeTaiLieu } = useFieldArray({
    control,
    name: 'tai_lieu',
  });

  const viTriOptions = useMemo(
    () => deXuatList.map((d) => ({ value: d.id, label: `${d.ma_de_xuat}${d.ten_chuc_vu ? ` · ${d.ten_chuc_vu}` : ''}` })),
    [deXuatList]
  );
  const trangThaiOptions = useMemo(
    () => trangThaiList.map((s) => ({ value: s.id, label: s.ten })),
    [trangThaiList]
  );
  const kenhOptions = useMemo(
    () => [{ value: '', label: t('ungVien.form.kenhPlaceholder') }, ...kenhList.map((k) => ({ value: k.id, label: k.ten }))],
    [kenhList, t]
  );

  useEffect(() => {
    if (initialData) {
      reset({
        ho_ten: initialData.ho_ten,
        email: initialData.email,
        so_dien_thoai: initialData.so_dien_thoai ?? '',
        dia_chi: initialData.dia_chi ?? null,
        ngay_sinh: initialData.ngay_sinh ?? null,
        ghi_chu_noi_bo: initialData.ghi_chu_noi_bo ?? null,
        id_de_xuat_tuyen_dung: initialData.id_de_xuat_tuyen_dung,
        id_trang_thai_ung_vien: initialData.id_trang_thai_ung_vien,
        id_kenh_tuyen_dung: initialData.id_kenh_tuyen_dung ?? null,
        ngay_phong_van_gan_nhat: initialData.ngay_phong_van_gan_nhat ?? null,
        ket_qua_phan_hoi_gan_nhat: initialData.ket_qua_phan_hoi_gan_nhat ?? null,
        tai_lieu: initialData.tai_lieu?.length ? initialData.tai_lieu : [],
      });
    } else {
      reset({
        ...DEFAULT_VALUES,
        id_de_xuat_tuyen_dung: initialIdDeXuatTuyenDung ?? '',
      });
    }
  }, [initialData, initialIdDeXuatTuyenDung, reset]);

  const onSubmit: SubmitHandler<UngVienFormValues> = (data) => {
    const taiLieuFiltered = (data.tai_lieu ?? []).filter((t) => t.ten_file?.trim());
    const payload: UngVienFormValues = {
      ...data,
      dia_chi: data.dia_chi === '' ? null : data.dia_chi,
      ngay_sinh: data.ngay_sinh === '' ? null : data.ngay_sinh,
      ghi_chu_noi_bo: data.ghi_chu_noi_bo === '' ? null : data.ghi_chu_noi_bo,
      id_kenh_tuyen_dung: data.id_kenh_tuyen_dung === '' ? null : data.id_kenh_tuyen_dung,
      ngay_phong_van_gan_nhat: data.ngay_phong_van_gan_nhat === '' ? null : data.ngay_phong_van_gan_nhat,
      ket_qua_phan_hoi_gan_nhat: data.ket_qua_phan_hoi_gan_nhat === '' ? null : data.ket_qua_phan_hoi_gan_nhat,
      tai_lieu: taiLieuFiltered,
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
      title={isEdit ? t('ungVien.form.editTitle') : t('ungVien.form.createTitle')}
      icon={<User size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="ung-vien-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('ungVien.form.save')}
          createLabel={t('ungVien.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="ung-vien-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('ungVien.form.basicInfo')} icon={<User size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('ungVien.form.hoTen')}
              placeholder={t('ungVien.form.hoTenPlaceholder')}
              icon={<User size={14} />}
              required
              {...register('ho_ten')}
              error={errors.ho_ten?.message}
            />
            <Input
              label={t('ungVien.form.email')}
              placeholder={t('ungVien.form.emailPlaceholder')}
              type="email"
              icon={<Mail size={14} />}
              required
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label={t('ungVien.form.soDienThoai')}
              placeholder={t('ungVien.form.soDienThoaiPlaceholder')}
              icon={<Phone size={14} />}
              {...register('so_dien_thoai')}
              error={errors.so_dien_thoai?.message}
            />
            <Input
              label={t('ungVien.form.diaChi')}
              placeholder={t('ungVien.form.diaChiPlaceholder')}
              icon={<MapPin size={14} />}
              {...register('dia_chi')}
              error={errors.dia_chi?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('ungVien.form.ngaySinh')}
                type="date"
                icon={<Calendar size={14} />}
                {...register('ngay_sinh')}
                error={errors.ngay_sinh?.message}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('ungVien.detail.viTriUngTuyen')} icon={<Briefcase size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="id_de_xuat_tuyen_dung"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('ungVien.form.viTriUngTuyen')}
                  options={viTriOptions}
                  placeholder={t('ungVien.form.viTriPlaceholder')}
                  icon={<Briefcase size={14} />}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.id_de_xuat_tuyen_dung?.message}
                  required
                />
              )}
            />
            <Controller
              name="id_trang_thai_ung_vien"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('ungVien.form.trangThai')}
                  options={trangThaiOptions}
                  placeholder={t('ungVien.form.trangThaiPlaceholder')}
                  icon={<Tag size={14} />}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.id_trang_thai_ung_vien?.message}
                  required
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="id_kenh_tuyen_dung"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('ungVien.form.kenhTuyenDung')}
                    options={kenhOptions}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                    icon={<Briefcase size={14} />}
                  />
                )}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('ungVien.detail.phongVanGanNhat')} icon={<Calendar size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('ungVien.form.ngayPhongVanGanNhat')}
              type="datetime-local"
              {...register('ngay_phong_van_gan_nhat')}
              error={errors.ngay_phong_van_gan_nhat?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('ungVien.form.ketQuaPhongVanGanNhat')}
                placeholder={t('ungVien.form.ketQuaPlaceholder')}
                {...register('ket_qua_phan_hoi_gan_nhat')}
                error={errors.ket_qua_phan_hoi_gan_nhat?.message}
                rows={2}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('ungVien.form.ghiChuNoiBo')} icon={<FileText size={14} />} variant="primary">
          <Textarea
            placeholder={t('ungVien.form.ghiChuPlaceholder')}
            {...register('ghi_chu_noi_bo')}
            error={errors.ghi_chu_noi_bo?.message}
            rows={3}
          />
        </FormSection>

        <TaiLieuSubTableForm
          control={control}
          register={register}
          onAdd={() => appendTaiLieu({ id: `tl-${Date.now()}`, ten_file: '', loai: '', link: '' })}
          onRemove={removeTaiLieu}
        />
      </form>
    </GenericDrawer>
  );
};

export default UngVienForm;
