import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Type, Tag, Hash, Calendar } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { TaiLieu } from '../core/types';
import type { HuongTaiLieu } from '../core/types';
import { TaiLieuFormValues, taiLieuSchema } from '../core/schema';
import { getHuongLabel, HUONG_OPTIONS } from '../core/constants';
import { useCreateTaiLieu, useUpdateTaiLieu } from '../hooks/use-tai-lieu';
import { useLoaiTaiLieuList } from '../../thiet-lap-tai-lieu/hooks/use-loai-tai-lieu';
import { useTrangThaiTaiLieuList } from '../../thiet-lap-tai-lieu/hooks/use-trang-thai-tai-lieu';
import { useNhomTaiLieuList } from '../../thiet-lap-tai-lieu/hooks/use-nhom-tai-lieu';
import { useHoSoList } from '../../luu-tru-ho-so/hooks/use-ho-so';
import { useDepartments } from '../../../he-thong/phong-ban/hooks/use-phong-ban';
import { formatDateForInput } from '../../../../lib/utils';

interface Props {
  initialData?: TaiLieu | null;
  defaultHuong: HuongTaiLieu;
  onClose: () => void;
}

const TaiLieuForm: React.FC<Props> = ({ initialData, defaultHuong, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateTaiLieu(onClose);
  const updateMutation = useUpdateTaiLieu(onClose);
  const { data: loaiList = [] } = useLoaiTaiLieuList();
  const { data: trangThaiList = [] } = useTrangThaiTaiLieuList();
  const { data: nhomList = [] } = useNhomTaiLieuList();
  const { data: departments = [] } = useDepartments();
  const phongBanOptions = useMemo(() => departments.map((d) => ({ label: d.ten_phong_ban, value: d.id })), [departments]);
  const nhomOptions = useMemo(() => nhomList.filter((n) => n.trang_thai === 1).map((n) => ({ label: n.ten, value: n.id })), [nhomList]);

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<TaiLieuFormValues>({
    resolver: zodResolver(taiLieuSchema),
    defaultValues: {
      ma_so: '',
      huong: defaultHuong,
      id_loai: '',
      id_nhom_tai_lieu: '',
      id_trang_thai: '',
      trich_yeu: '',
      so_den: '',
      ngay_den: '',
      noi_gui: '',
      so_di: '',
      ngay_ky: '',
      noi_nhan: '',
      id_phong_ban: '',
      ghi_chu: '',
    },
  });

  const huong = watch('huong');

  useEffect(() => {
    if (initialData) {
      reset({
        ma_so: initialData.ma_so ?? '',
        huong: initialData.huong,
        id_loai: initialData.id_loai,
        id_nhom_tai_lieu: initialData.id_nhom_tai_lieu ?? '',
        id_trang_thai: initialData.id_trang_thai,
        trich_yeu: initialData.trich_yeu,
        so_den: initialData.so_den ?? '',
        ngay_den: initialData.ngay_den ? formatDateForInput(initialData.ngay_den) : '',
        noi_gui: initialData.noi_gui ?? '',
        so_di: initialData.so_di ?? '',
        ngay_ky: initialData.ngay_ky ? formatDateForInput(initialData.ngay_ky) : '',
        noi_nhan: initialData.noi_nhan ?? '',
        id_phong_ban: initialData.id_phong_ban ?? '',
        ghi_chu: initialData.ghi_chu ?? '',
      });
    } else {
      reset({
        ma_so: '',
        huong: defaultHuong,
        id_loai: '',
        id_nhom_tai_lieu: '',
        id_trang_thai: '',
        trich_yeu: '',
        so_den: '',
        ngay_den: '',
        noi_gui: '',
        so_di: '',
        ngay_ky: '',
        noi_nhan: '',
        id_phong_ban: '',
        ghi_chu: '',
      });
    }
  }, [initialData, defaultHuong, reset]);

  const loaiOptions = useMemo(() => {
    const list = loaiList.filter((l) => l.trang_thai === 1);
    return list.map((l) => ({ label: l.ten, value: l.id }));
  }, [loaiList]);

  const trangThaiOptions = useMemo(
    () => trangThaiList.filter((t) => t.trang_thai === 1).map((t) => ({ label: t.ten, value: t.id })),
    [trangThaiList]
  );

  const huongOptions = useMemo(
    () => HUONG_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value })),
    [t]
  );

  const onSubmit: SubmitHandler<TaiLieuFormValues> = (data) => {
    const sanitized: TaiLieuFormValues = {
      ...data,
      ghi_chu: data.ghi_chu?.trim() || undefined,
      so_den: data.so_den?.trim() || undefined,
      noi_gui: data.noi_gui?.trim() || undefined,
      so_di: data.so_di?.trim() || undefined,
      noi_nhan: data.noi_nhan?.trim() || undefined,
      id_phong_ban: data.id_phong_ban?.trim() || undefined,
      id_nhom_tai_lieu: data.id_nhom_tai_lieu?.trim() || undefined,
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
      title={isEdit ? t('taiLieu.form.editTitle') : t('taiLieu.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="tai-lieu-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('taiLieu.form.save')}
          createLabel={t('taiLieu.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="tai-lieu-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('taiLieu.form.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('taiLieu.form.maSo')}
              placeholder={t('taiLieu.form.maSoPlaceholder')}
              icon={<Hash size={14} />}
              {...register('ma_so')}
              error={errors.ma_so?.message}
            />
            <Controller
              name="huong"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('taiLieu.store.huongCol')}
                  options={huongOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('taiLieu.store.huongCol')}
                  icon={<Tag size={16} className="text-muted-foreground" />}
                  required
                />
              )}
            />
            <Controller
              name="id_loai"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('taiLieu.form.loai')}
                  options={loaiOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('taiLieu.form.loai')}
                  icon={<FileText size={16} className="text-muted-foreground" />}
                  required
                />
              )}
            />
            {errors.id_loai?.message && (
              <p className="text-sm text-destructive col-span-2">{errors.id_loai.message}</p>
            )}
            <Controller
              name="id_nhom_tai_lieu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('taiLieu.form.nhomTaiLieu')}
                  options={[{ label: '—', value: '' }, ...nhomOptions]}
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v || undefined)}
                  placeholder={t('taiLieu.form.nhomTaiLieuPlaceholder')}
                  icon={<FileText size={16} className="text-muted-foreground" />}
                />
              )}
            />
            <Controller
              name="id_trang_thai"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('taiLieu.form.trangThai')}
                  options={trangThaiOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('taiLieu.form.trangThai')}
                  icon={<Tag size={16} className="text-muted-foreground" />}
                  required
                />
              )}
            />
            {errors.id_trang_thai?.message && (
              <p className="text-sm text-destructive col-span-2">{errors.id_trang_thai.message}</p>
            )}
            <Controller
              name="id_phong_ban"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('taiLieu.form.phongQuanLy')}
                  options={[{ label: '—', value: '' }, ...phongBanOptions]}
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v || undefined)}
                  placeholder={t('taiLieu.form.phongQuanLyPlaceholder')}
                  icon={<FileText size={16} className="text-muted-foreground" />}
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('taiLieu.form.trichYeu')}
                placeholder={t('taiLieu.form.trichYeuPlaceholder')}
                icon={<Type size={14} />}
                required
                {...register('trich_yeu')}
                error={errors.trich_yeu?.message}
              />
            </div>
            {huong === 'den' && (
              <>
                <Input label={t('taiLieu.form.soDen')} icon={<Hash size={14} />} {...register('so_den')} />
                <Input
                  type="date"
                  label={t('taiLieu.form.ngayDen')}
                  icon={<Calendar size={14} />}
                  {...register('ngay_den')}
                />
                <div className="col-span-1 sm:col-span-2">
                  <Input label={t('taiLieu.form.noiGui')} {...register('noi_gui')} />
                </div>
              </>
            )}
            {huong === 'di' && (
              <>
                <Input label={t('taiLieu.form.soDi')} icon={<Hash size={14} />} {...register('so_di')} />
                <Input
                  type="date"
                  label={t('taiLieu.form.ngayKy')}
                  icon={<Calendar size={14} />}
                  {...register('ngay_ky')}
                />
                <div className="col-span-1 sm:col-span-2">
                  <Input label={t('taiLieu.form.noiNhan')} {...register('noi_nhan')} />
                </div>
              </>
            )}
            <div className="col-span-1 sm:col-span-2">
              <Textarea label={t('taiLieu.form.ghiChu')} {...register('ghi_chu')} />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default TaiLieuForm;
