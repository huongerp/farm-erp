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
import {
  useCreateHopDong,
  useCreateHopDongFromProbation,
  useUpdateHopDong,
} from '../hooks/use-hop-dong';
import { hopDongSchema, type HopDongFormValues } from '../core/schema';
import type { HopDong } from '../core/types';

interface Props {
  onClose: () => void;
  initialData?: HopDong | null;
  /** Khi tạo HĐ chính thức từ thử việc */
  prefillFromHopDong?: HopDong | null;
}

const DEFAULT_VALUES: HopDongFormValues = {
  id_ung_vien: '',
  loai_hop_dong: 'thu-viec',
  ngay_bat_dau: '',
  ngay_ket_thuc: null,
  bac_luong: null,
  muc_luong: null,
  ngay_vao_lam: null,
  co_che_khac: null,
  ghi_chu: null,
  ghi_chu_khac: null,
};

const HopDongForm: React.FC<Props> = ({ onClose, initialData, prefillFromHopDong }) => {
  const isEdit = !!initialData;
  const isFromProbation = !!prefillFromHopDong;
  const { t } = useTranslation();
  const { data: ungVienList = [] } = useUngViens();
  const { data: jobLevels = [] } = useJobLevels();
  const createMutation = useCreateHopDong(onClose);
  const createFromProbationMutation = useCreateHopDongFromProbation(onClose);
  const updateMutation = useUpdateHopDong(onClose);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
  } = useForm<HopDongFormValues>({
    resolver: zodResolver(hopDongSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const loaiHopDong = watch('loai_hop_dong');

  useEffect(() => {
    if (initialData) {
      reset({
        id_ung_vien: initialData.id_ung_vien,
        loai_hop_dong: initialData.loai_hop_dong,
        ngay_bat_dau: initialData.ngay_bat_dau,
        ngay_ket_thuc: initialData.ngay_ket_thuc ?? null,
        bac_luong: initialData.bac_luong ?? null,
        muc_luong: initialData.muc_luong ?? null,
        ngay_vao_lam: initialData.ngay_vao_lam ?? null,
        co_che_khac: initialData.co_che_khac ?? null,
        ghi_chu: initialData.ghi_chu ?? null,
        ghi_chu_khac: initialData.ghi_chu_khac ?? null,
      });
    } else if (prefillFromHopDong) {
      reset({
        id_ung_vien: prefillFromHopDong.id_ung_vien,
        loai_hop_dong: 'chinh-thuc',
        ngay_bat_dau: prefillFromHopDong.ngay_ket_thuc ?? new Date().toISOString().slice(0, 10),
        ngay_ket_thuc: null,
        bac_luong: prefillFromHopDong.bac_luong ?? null,
        muc_luong: prefillFromHopDong.muc_luong ?? null,
        ngay_vao_lam: prefillFromHopDong.ngay_ket_thuc ?? prefillFromHopDong.ngay_vao_lam ?? null,
        co_che_khac: prefillFromHopDong.co_che_khac ?? null,
        ghi_chu: prefillFromHopDong.ghi_chu ?? null,
        ghi_chu_khac: prefillFromHopDong.ghi_chu_khac ?? null,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, prefillFromHopDong, reset]);

  const ungVienOptions = useMemo(
    () =>
      ungVienList.map((u) => ({
        value: u.id,
        label: `${u.ho_ten}${u.ten_chuc_vu ? ` · ${u.ten_chuc_vu}` : ''}`,
      })),
    [ungVienList]
  );

  const loaiOptions = useMemo(
    () => [
      { value: 'thu-viec', label: t('hopDong.loaiThuViec') },
      { value: 'chinh-thuc', label: t('hopDong.loaiChinhThuc') },
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

  const onSubmit: SubmitHandler<HopDongFormValues> = (data) => {
    const payload = {
      id_ung_vien: data.id_ung_vien,
      loai_hop_dong: data.loai_hop_dong,
      ngay_bat_dau: data.ngay_bat_dau,
      ngay_ket_thuc: data.loai_hop_dong === 'thu-viec' ? (data.ngay_ket_thuc?.trim() || null) : null,
      bac_luong: data.bac_luong?.trim() || null,
      muc_luong: data.muc_luong?.trim() || null,
      ngay_vao_lam: data.ngay_vao_lam?.trim() || null,
      co_che_khac: data.co_che_khac?.trim() || null,
      ghi_chu: data.ghi_chu?.trim() || null,
      ghi_chu_khac: data.ghi_chu_khac?.trim() || null,
    };
    if (isEdit && initialData) {
      updateMutation.mutate({
        id: initialData.id,
        data: {
          ngay_bat_dau: payload.ngay_bat_dau,
          ngay_ket_thuc: payload.ngay_ket_thuc,
          bac_luong: payload.bac_luong,
          muc_luong: payload.muc_luong,
          ngay_vao_lam: payload.ngay_vao_lam,
          co_che_khac: payload.co_che_khac,
          ghi_chu: payload.ghi_chu,
          ghi_chu_khac: payload.ghi_chu_khac,
        },
      });
    } else if (isFromProbation && prefillFromHopDong) {
      createFromProbationMutation.mutate({
        data: payload,
        id_hop_dong_goc: prefillFromHopDong.id,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading =
    createMutation.isPending || createFromProbationMutation.isPending || updateMutation.isPending;

  const title = isEdit
    ? t('hopDong.edit')
    : isFromProbation
      ? t('hopDong.createChinhThuc')
      : t('hopDong.add');

  return (
    <GenericDrawer
      title={title}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="hop-dong-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('common.save')}
          createLabel={t('common.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="hop-dong-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <FormSection
          title={t('hopDong.form.basicInfo')}
          icon={<FileText size={14} />}
          variant="primary"
        >
          <FormGrid cols={2}>
            <Controller
              name="id_ung_vien"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('hopDong.table.ungVien')}
                  options={ungVienOptions}
                  placeholder={t('hopDong.table.ungVien')}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  disabled={isEdit || isFromProbation}
                  error={errors.id_ung_vien?.message}
                  required
                />
              )}
            />
            <Controller
              name="loai_hop_dong"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('hopDong.table.loaiHopDong')}
                  options={loaiOptions}
                  placeholder={t('hopDong.table.loaiHopDong')}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value as 'thu-viec' | 'chinh-thuc')}
                  disabled={isEdit || isFromProbation}
                  error={errors.loai_hop_dong?.message}
                  required
                />
              )}
            />
            <Input
              type="date"
              label={t('hopDong.table.ngayBatDau')}
              {...register('ngay_bat_dau')}
              error={errors.ngay_bat_dau?.message}
              required
            />
            {loaiHopDong === 'thu-viec' && (
              <Input
                type="date"
                label={t('hopDong.table.ngayKetThuc')}
                {...register('ngay_ket_thuc')}
                error={errors.ngay_ket_thuc?.message}
                required
              />
            )}
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('hopDong.ghiChu')}
                placeholder={t('hopDong.ghiChu')}
                rows={3}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection
          title={t('hopDong.form.terms')}
          icon={<Briefcase size={14} />}
          variant="primary"
        >
          <FormGrid cols={2}>
            <Controller
              name="bac_luong"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('hopDong.bacLuong')}
                  options={[
                    { value: '', label: t('hopDong.selectBacLuong') },
                    ...bacLuongOptions,
                  ]}
                  placeholder={t('hopDong.selectBacLuong')}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  error={errors.bac_luong?.message}
                  required
                />
              )}
            />
            <Input
              label={t('hopDong.mucLuong')}
              placeholder={t('hopDong.mucLuongPlaceholder')}
              {...register('muc_luong')}
              error={errors.muc_luong?.message}
              required
            />
            <Input
              type="date"
              label={t('hopDong.ngayVaoLam')}
              {...register('ngay_vao_lam')}
              error={errors.ngay_vao_lam?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('hopDong.coCheKhac')}
                placeholder={t('hopDong.coCheKhacPlaceholder')}
                rows={2}
                {...register('co_che_khac')}
                error={errors.co_che_khac?.message}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('hopDong.ghiChuKhac')}
                placeholder={t('hopDong.ghiChuKhacPlaceholder')}
                rows={2}
                {...register('ghi_chu_khac')}
                error={errors.ghi_chu_khac?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default HopDongForm;
