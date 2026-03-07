import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, FileText, Briefcase } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import Input from '../../../../components/ui/Input';
import { useUngViens } from '@/features/nhan-su/ung-vien/hooks/use-ung-vien';
import { useJobLevels } from '@/features/he-thong/cap-bac/hooks/use-cap-bac';
import { useCreateThuGuiUngVien, useUpdateThuGuiUngVien } from '../hooks/use-thu-gui-ung-vien';
import { thuGuiUngVienSchema, type ThuGuiUngVienFormValues } from '../core/schema';
import type { ThuGuiUngVien } from '../core/types';

interface Props {
  onClose: () => void;
  initialData?: ThuGuiUngVien | null;
}

const DEFAULT_VALUES: Partial<ThuGuiUngVienFormValues> & { id_ung_vien: string } = {
  id_ung_vien: '',
  loai_thu: undefined,
  ghi_chu: null,
  ngay_vao_lam: null,
  bac_luong: null,
  muc_luong: null,
  co_che_khac: null,
  ghi_chu_khac: null,
};

const ThuGuiUngVienForm: React.FC<Props> = ({ onClose, initialData }) => {
  const isEdit = !!initialData;
  const { t } = useTranslation();
  const { data: ungVienList = [] } = useUngViens();
  const { data: jobLevels = [] } = useJobLevels();
  const createMutation = useCreateThuGuiUngVien(onClose);
  const updateMutation = useUpdateThuGuiUngVien(onClose);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
  } = useForm<ThuGuiUngVienFormValues>({
    resolver: zodResolver(thuGuiUngVienSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const loaiThu = watch('loai_thu');

  useEffect(() => {
    if (initialData) {
      reset({
        id_ung_vien: initialData.id_ung_vien,
        loai_thu: initialData.loai_thu,
        ghi_chu: initialData.ghi_chu ?? null,
        ngay_vao_lam: initialData.ngay_vao_lam ?? null,
        bac_luong: initialData.bac_luong ?? null,
        muc_luong: initialData.muc_luong ?? null,
        co_che_khac: initialData.co_che_khac ?? null,
        ghi_chu_khac: initialData.ghi_chu_khac ?? null,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const ungVienOptions = useMemo(
    () =>
      ungVienList.map((u) => ({
        value: u.id,
        label: `${u.ho_ten}${u.ten_chuc_vu ? ` · ${u.ten_chuc_vu}` : ''}`,
      })),
    [ungVienList]
  );

  const loaiThuOptions = useMemo(
    () => [
      { value: 'tu-choi', label: t('thuGuiUngVien.letterReject') },
      { value: 'moi-nhan-viec', label: t('thuGuiUngVien.letterJobOffer') },
    ],
    [t]
  );

  const bacLuongOptions = useMemo(
    () =>
      jobLevels
        .filter((l) => l.trang_thai === 1)
        .map((l) => ({
          value: `${l.ma_cap_bac} - ${l.ten_cap_bac}`,
          label: `${l.ma_cap_bac} - ${l.ten_cap_bac}`,
        })),
    [jobLevels]
  );

  const onSubmit: SubmitHandler<ThuGuiUngVienFormValues> = (data) => {
    const isJobOffer = data.loai_thu === 'moi-nhan-viec';
    const payload = {
      id_ung_vien: data.id_ung_vien,
      loai_thu: data.loai_thu,
      ghi_chu: data.ghi_chu?.trim() || null,
      ngay_vao_lam: isJobOffer && data.ngay_vao_lam?.trim() ? data.ngay_vao_lam.trim() : null,
      bac_luong: isJobOffer ? (data.bac_luong?.trim() || null) : null,
      muc_luong: isJobOffer ? (data.muc_luong?.trim() || null) : null,
      co_che_khac: isJobOffer ? (data.co_che_khac?.trim() || null) : null,
      ghi_chu_khac: isJobOffer ? (data.ghi_chu_khac?.trim() || null) : null,
    };
    if (isEdit && initialData) {
      updateMutation.mutate({
        id: initialData.id,
        data: {
          ghi_chu: payload.ghi_chu,
          ngay_vao_lam: payload.ngay_vao_lam,
          bac_luong: payload.bac_luong,
          muc_luong: payload.muc_luong,
          co_che_khac: payload.co_che_khac,
          ghi_chu_khac: payload.ghi_chu_khac,
        },
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={
        isEdit
          ? t('thuGuiUngVien.edit')
          : t('thuGuiUngVien.add')
      }
      icon={<User size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="thu-gui-ung-vien-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thuGuiUngVien.save')}
          createLabel={t('thuGuiUngVien.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="thu-gui-ung-vien-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <FormSection
          title={t('thuGuiUngVien.form.basicInfo')}
          icon={<FileText size={14} />}
          variant="primary"
        >
          <FormGrid cols={2}>
            <Controller
              name="id_ung_vien"
              control={control}
              render={({ field }) => (
                <Select
                    label={t('thuGuiUngVien.table.ungVien')}
                    options={ungVienOptions}
                    placeholder={t('ungVien.form.hoTen')}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={isEdit}
                    error={errors.id_ung_vien?.message}
                    required
                  />
              )}
            />
            <Controller
              name="loai_thu"
              control={control}
              render={({ field }) => (
                <Select
                    label={t('thuGuiUngVien.table.loaiPhieu')}
                    options={loaiThuOptions}
                    placeholder={t('thuGuiUngVien.selectLoaiThu')}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={isEdit}
                    error={errors.loai_thu?.message}
                    required
                  />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('thuGuiUngVien.ghiChu')}
                placeholder={t('thuGuiUngVien.ghiChu')}
                rows={3}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
          </FormGrid>
        </FormSection>

        {loaiThu === 'moi-nhan-viec' && (
          <FormSection
            title={t('thuGuiUngVien.sectionJobOffer')}
            icon={<Briefcase size={14} />}
            variant="primary"
          >
            <FormGrid cols={2}>
              <Controller
                name="bac_luong"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('thuGuiUngVien.bacLuong')}
                    options={[{ value: '', label: t('thuGuiUngVien.selectBacLuong') }, ...bacLuongOptions]}
                    placeholder={t('thuGuiUngVien.selectBacLuong')}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    disabled={isEdit}
                    error={errors.bac_luong?.message}
                    required
                  />
                )}
              />
              <Input
                label={t('thuGuiUngVien.mucLuong')}
                placeholder={t('thuGuiUngVien.mucLuongPlaceholder')}
                {...register('muc_luong')}
                error={errors.muc_luong?.message}
                required
              />
              <Input
                type="date"
                label={t('thuGuiUngVien.ngayNhanViec')}
                {...register('ngay_vao_lam')}
                error={errors.ngay_vao_lam?.message}
                required
              />
              <div className="col-span-1 sm:col-span-2">
                <Textarea
                  label={t('thuGuiUngVien.coCheKhac')}
                  placeholder={t('thuGuiUngVien.coCheKhacPlaceholder')}
                  rows={2}
                  {...register('co_che_khac')}
                  error={errors.co_che_khac?.message}
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Textarea
                  label={t('thuGuiUngVien.ghiChuKhac')}
                  placeholder={t('thuGuiUngVien.ghiChuKhacPlaceholder')}
                  rows={2}
                  {...register('ghi_chu_khac')}
                  error={errors.ghi_chu_khac?.message}
                />
              </div>
            </FormGrid>
          </FormSection>
        )}
      </form>
    </GenericDrawer>
  );
};

export default ThuGuiUngVienForm;
