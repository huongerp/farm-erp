import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpen,
  Hash,
  Type,
  MapPin,
  Link2,
  Clock,
  Users,
  User,
  FileText,
  Shield,
} from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import PositionPermissionPicker from '../../../../components/shared/PositionPermissionPicker';
import { useLoaiKhoaHocs } from '@/features/nhan-su/thiet-lap-dao-tao/hooks/use-loai-khoa-hoc';
import { usePositions } from '@/features/he-thong/chuc-vu/hooks/use-chuc-vu';
import { useCreateKhoaDaoTao, useUpdateKhoaDaoTao } from '../hooks/use-khoa-dao-tao';
import { khoaDaoTaoSchema, type KhoaDaoTaoFormValues } from '../core/schema';
import { TRANG_THAI_KHOA_VALUES, getTrangThaiKhoaDaoTaoLabel } from '../core/constants';
import type { KhoaDaoTao } from '../core/types';

const DEFAULT_VALUES: KhoaDaoTaoFormValues = {
  ma: '',
  ten: '',
  id_loai_khoa_hoc: '',
  mo_ta: null,
  thoi_luong: 0,
  ngay_bat_dau: '',
  ngay_ket_thuc: '',
  dia_diem: null,
  link_online: null,
  trang_thai: 0,
  so_luong_toi_da: null,
  giang_vien: null,
  ghi_chu: null,
  id_chuc_vu_xem: [],
};

interface Props {
  onClose: () => void;
  initialData?: KhoaDaoTao | null;
}

const KhoaDaoTaoForm: React.FC<Props> = ({ onClose, initialData }) => {
  const isEdit = !!initialData;
  const { t } = useTranslation();
  const [showPhanQuyen, setShowPhanQuyen] = useState(false);
  const { data: loaiList = [] } = useLoaiKhoaHocs();
  const { data: positionsList = [] } = usePositions();
  const createMutation = useCreateKhoaDaoTao(onClose);
  const updateMutation = useUpdateKhoaDaoTao(onClose);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
  } = useForm<KhoaDaoTaoFormValues>({
    resolver: zodResolver(khoaDaoTaoSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma: initialData.ma,
        ten: initialData.ten,
        id_loai_khoa_hoc: initialData.id_loai_khoa_hoc,
        mo_ta: initialData.mo_ta ?? null,
        thoi_luong: initialData.thoi_luong,
        ngay_bat_dau: initialData.ngay_bat_dau,
        ngay_ket_thuc: initialData.ngay_ket_thuc,
        dia_diem: initialData.dia_diem ?? null,
        link_online: initialData.link_online ?? null,
        trang_thai: initialData.trang_thai,
        so_luong_toi_da: initialData.so_luong_toi_da ?? null,
        giang_vien: initialData.giang_vien ?? null,
        ghi_chu: initialData.ghi_chu ?? null,
        id_chuc_vu_xem: initialData.id_chuc_vu_xem ?? [],
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const idChucVuXem = watch('id_chuc_vu_xem') ?? [];
  const positionsForPicker = useMemo(
    () => positionsList.filter((p) => p.trang_thai === 1).map((p) => ({
      id: p.id,
      ten_chuc_vu: p.ten_chuc_vu,
      id_phong_ban: p.id_phong_ban ?? undefined,
      ten_phong_ban: p.ten_phong_ban,
    })),
    [positionsList]
  );

  const loaiOptions = useMemo(
    () =>
      loaiList
        .filter((l) => l.trang_thai === 1)
        .map((l) => ({ value: l.id, label: l.ten })),
    [loaiList]
  );

  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_KHOA_VALUES.map((value) => ({
        value: String(value),
        label: getTrangThaiKhoaDaoTaoLabel(value, t),
      })),
    [t]
  );

  const onSubmit: SubmitHandler<KhoaDaoTaoFormValues> = (data) => {
    const payload = {
      ...data,
      mo_ta: data.mo_ta?.trim() || null,
      dia_diem: data.dia_diem?.trim() || null,
      link_online: data.link_online?.trim() || null,
      giang_vien: data.giang_vien?.trim() || null,
      ghi_chu: data.ghi_chu?.trim() || null,
      id_chuc_vu_xem: data.id_chuc_vu_xem ?? [],
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
      title={
        isEdit
          ? t('khoaDaoTao.form.editTitle')
          : t('khoaDaoTao.form.createTitle')
      }
      icon={<BookOpen size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="khoa-dao-tao-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('common.save')}
          createLabel={t('khoaDaoTao.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="khoa-dao-tao-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <FormSection
          title={t('khoaDaoTao.form.basicInfo')}
          icon={<BookOpen size={14} />}
          variant="primary"
        >
          <FormGrid cols={2}>
            <Input
              label={t('khoaDaoTao.form.ma')}
              placeholder={t('khoaDaoTao.form.maPlaceholder')}
              icon={<Hash size={14} />}
              {...register('ma')}
              error={errors.ma?.message}
              required
            />
            <Input
              label={t('khoaDaoTao.form.ten')}
              placeholder={t('khoaDaoTao.form.tenPlaceholder')}
              icon={<Type size={14} />}
              {...register('ten')}
              error={errors.ten?.message}
              required
            />
            <Controller
              name="id_loai_khoa_hoc"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('khoaDaoTao.form.loaiKhoaHoc')}
                  options={loaiOptions}
                  placeholder={t('khoaDaoTao.form.loaiKhoaHocPlaceholder')}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.id_loai_khoa_hoc?.message}
                  required
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('khoaDaoTao.form.moTa')}
                placeholder={t('khoaDaoTao.form.moTaPlaceholder')}
                icon={<FileText size={12} />}
                {...register('mo_ta')}
                error={errors.mo_ta?.message}
              />
            </div>
            <Input
              type="number"
              min={0}
              label={t('khoaDaoTao.form.thoiLuong')}
              placeholder={t('khoaDaoTao.form.thoiLuongPlaceholder')}
              icon={<Clock size={14} />}
              {...register('thoi_luong')}
              error={errors.thoi_luong?.message}
              required
            />
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('khoaDaoTao.form.trangThai')}
                  options={trangThaiOptions}
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={errors.trang_thai?.message}
                  required
                />
              )}
            />
            <Input
              type="date"
              label={t('khoaDaoTao.form.ngayBatDau')}
              {...register('ngay_bat_dau')}
              error={errors.ngay_bat_dau?.message}
              required
            />
            <Input
              type="date"
              label={t('khoaDaoTao.form.ngayKetThuc')}
              {...register('ngay_ket_thuc')}
              error={errors.ngay_ket_thuc?.message}
              required
            />
            <Input
              label={t('khoaDaoTao.form.diaDiem')}
              placeholder={t('khoaDaoTao.form.diaDiemPlaceholder')}
              icon={<MapPin size={14} />}
              {...register('dia_diem')}
              error={errors.dia_diem?.message}
            />
            <Input
              label={t('khoaDaoTao.form.linkOnline')}
              placeholder={t('khoaDaoTao.form.linkOnlinePlaceholder')}
              icon={<Link2 size={14} />}
              {...register('link_online')}
              error={errors.link_online?.message}
            />
            <Input
              type="number"
              min={0}
              label={t('khoaDaoTao.form.soLuongToiDa')}
              placeholder={t('khoaDaoTao.form.soLuongToiDaPlaceholder')}
              icon={<Users size={14} />}
              {...register('so_luong_toi_da')}
              error={errors.so_luong_toi_da?.message}
            />
            <Input
              label={t('khoaDaoTao.form.giangVien')}
              placeholder={t('khoaDaoTao.form.giangVienPlaceholder')}
              icon={<User size={14} />}
              {...register('giang_vien')}
              error={errors.giang_vien?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('khoaDaoTao.form.ghiChu')}
                placeholder={t('khoaDaoTao.form.ghiChuPlaceholder')}
                icon={<FileText size={12} />}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection
          title={t('khoaDaoTao.form.phanQuyen')}
          icon={<Shield size={14} />}
          variant="secondary"
        >
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t('khoaDaoTao.form.phanQuyenHint')}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPhanQuyen(true)}
              className="border-border"
            >
              <Shield size={16} className="mr-2" />
              {idChucVuXem.length
                ? t('khoaDaoTao.form.phanQuyenSelected', { count: idChucVuXem.length })
                : t('khoaDaoTao.form.phanQuyenSelect')}
            </Button>
          </div>
        </FormSection>
      </form>
      {showPhanQuyen && (
        <PositionPermissionPicker
          open={showPhanQuyen}
          onClose={() => setShowPhanQuyen(false)}
          positions={positionsForPicker}
          selectedIds={idChucVuXem}
          onSave={(ids) => {
            setValue('id_chuc_vu_xem', ids);
            setShowPhanQuyen(false);
          }}
          title={t('khoaDaoTao.form.phanQuyenTitle')}
          activeOnly={true}
        />
      )}
    </GenericDrawer>
  );
};

export default KhoaDaoTaoForm;
