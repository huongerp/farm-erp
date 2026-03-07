import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList, Hash, Type, FolderOpen, Calendar, ListOrdered, Tag, User, Power, FileStack } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import MultiSelect from '../../../../components/ui/MultiSelect';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { CongViec } from '../core/types';
import { CongViecFormValues, congViecSchema } from '../core/schema';
import { getTrangThaiOptions, getUuTienOptions } from '../core/constants';
import { useCreateCongViec, useUpdateCongViec } from '../hooks/use-cong-viec';
import { useDuAnList } from '../../du-an/hooks/use-du-an';
import { useEmployees } from '../../../he-thong/nhan-vien/hooks/use-nhan-vien';
import { useMauCongViecList } from '../../thiet-lap-cong-viec/hooks/use-mau-cong-viec';
import { formatDateForInput } from '../../../../lib/utils';

const DEFAULT_VALUES: CongViecFormValues = {
  ma_cong_viec: '',
  tieu_de: '',
  mo_ta: '',
  id_du_an: null,
  id_cha: null,
  danh_sach_nguoi_thuc_hien: [],
  uu_tien: 'trung_binh',
  trang_thai: 'draft',
  ngay_het_han: '',
  phan_tram_hoan_thanh: 0,
  id_mau_cong_viec: null,
};

interface Props {
  initialData?: CongViec | null;
  parentId?: string | null;
  /** Khi tạo mới: chọn sẵn dự án (vd: mở từ detail Dự án). */
  defaultIdDuAn?: string | null;
  onClose: () => void;
  /** Drawer chồng (vd: mở từ trang Dự án). */
  stackLevel?: number;
}

const CongViecForm: React.FC<Props> = ({ initialData, parentId, defaultIdDuAn, onClose, stackLevel = 0 }) => {
  const { t } = useTranslation();
  const { data: duAnList = [] } = useDuAnList();
  const { data: employees = [] } = useEmployees();
  const { data: mauList = [] } = useMauCongViecList();
  const isEdit = !!initialData;
  const createMutation = useCreateCongViec(onClose);
  const updateMutation = useUpdateCongViec(onClose);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<CongViecFormValues>({
    resolver: zodResolver(congViecSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma_cong_viec: initialData.ma_cong_viec,
        tieu_de: initialData.tieu_de,
        mo_ta: initialData.mo_ta ?? '',
        id_du_an: initialData.id_du_an,
        id_cha: initialData.id_cha,
        danh_sach_nguoi_thuc_hien: initialData.danh_sach_nguoi_thuc_hien ?? [],
        uu_tien: initialData.uu_tien,
        trang_thai: initialData.trang_thai,
        ngay_het_han: formatDateForInput(initialData.ngay_het_han),
        phan_tram_hoan_thanh: initialData.phan_tram_hoan_thanh ?? 0,
        id_mau_cong_viec: initialData.id_mau_cong_viec,
      });
    } else if (parentId) {
      reset({
        ...DEFAULT_VALUES,
        id_cha: parentId,
      });
    } else if (defaultIdDuAn) {
      reset({
        ...DEFAULT_VALUES,
        id_du_an: defaultIdDuAn,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, parentId, defaultIdDuAn, reset]);

  const duAnOptions = useMemo(
    () => [{ label: '—', value: '' }, ...duAnList.map((d) => ({ label: d.ten_du_an, value: d.id }))],
    [duAnList]
  );
  const mauOptions = useMemo(
    () => [{ label: t('congViec.form.fromTemplateNone'), value: '' }, ...mauList.map((m) => ({ label: m.ten_mau, value: m.id }))],
    [mauList, t]
  );
  const trangThaiOptions = useMemo(() => getTrangThaiOptions(t), [t]);

  const handleSelectMau = (mauId: string) => {
    if (!mauId) return;
    const mau = mauList.find((m) => m.id === mauId);
    if (!mau) return;
    reset((prev) => ({
      ...prev,
      tieu_de: mau.tieu_de_mac_dinh,
      mo_ta: mau.mo_ta_mac_dinh ?? '',
      uu_tien: mau.uu_tien_mac_dinh,
      trang_thai: mau.trang_thai_mac_dinh === 1 ? 'dang_thuc_hien' : 'draft',
      id_mau_cong_viec: mau.id,
    }));
  };
  const uuTienOptions = useMemo(() => getUuTienOptions(t), [t]);
  const employeeOptions = useMemo(
    () => employees.slice(0, 300).map((e) => ({ label: e.full_name || e.ma_nhan_vien, value: e.id })),
    [employees]
  );

  const onSubmit: SubmitHandler<CongViecFormValues> = (data) => {
    const sanitized: CongViecFormValues = {
      ...data,
      id_du_an: data.id_du_an || null,
      id_cha: data.id_cha || null,
      mo_ta: data.mo_ta?.trim() || '',
    };
    const tenDuAn = data.id_du_an ? duAnList.find((d) => d.id === data.id_du_an)?.ten_du_an : null;
    if (isEdit && initialData) {
      updateMutation.mutate({
        id: initialData.id,
        data: {
          ...sanitized,
          ngay_het_han: data.ngay_het_han,
          phan_tram_hoan_thanh: data.phan_tram_hoan_thanh,
        },
        ten_du_an: tenDuAn ?? undefined,
      });
    } else {
      createMutation.mutate({ data: sanitized, ten_du_an: tenDuAn ?? undefined });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('congViec.form.editTitle') : t('congViec.form.createTitle')}
      icon={<ClipboardList size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="cong-viec-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('congViec.form.save')}
          createLabel={t('congViec.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
      stackLevel={stackLevel}
    >
      <form id="cong-viec-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('congViec.form.basicInfo')} icon={<ClipboardList size={14} />} variant="primary">
          <FormGrid cols={2}>
            {!isEdit && mauList.length > 0 && (
              <div className="col-span-1 sm:col-span-2">
                <Controller
                  name="id_mau_cong_viec"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      label={t('congViec.form.fromTemplate')}
                      options={mauOptions}
                      value={field.value ?? ''}
                      onChange={(v) => {
                        field.onChange(v || null);
                        handleSelectMau(v || '');
                      }}
                      placeholder={t('congViec.form.fromTemplatePlaceholder')}
                      icon={<FileStack size={16} className="text-muted-foreground" />}
                    />
                  )}
                />
              </div>
            )}
            <Input
              label={t('congViec.form.maCongViec')}
              placeholder={t('congViec.form.maCongViecPlaceholder')}
              icon={<Hash size={14} />}
              required
              {...register('ma_cong_viec')}
              error={errors.ma_cong_viec?.message}
            />
            <Input
              label={t('congViec.form.tieuDe')}
              placeholder={t('congViec.form.tieuDePlaceholder')}
              icon={<Type size={14} />}
              required
              {...register('tieu_de')}
              error={errors.tieu_de?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="id_du_an"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('congViec.form.duAn')}
                    options={duAnOptions}
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v || null)}
                    placeholder={t('congViec.form.duAnPlaceholder')}
                    icon={<FolderOpen size={16} className="text-muted-foreground" />}
                  />
                )}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('congViec.form.moTa')}
                placeholder={t('congViec.form.moTaPlaceholder')}
                {...register('mo_ta')}
                error={errors.mo_ta?.message}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="danh_sach_nguoi_thuc_hien"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    label={t('congViec.form.nguoiThucHien')}
                    options={employeeOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('congViec.form.nguoiThucHienPlaceholder')}
                    icon={User}
                  />
                )}
              />
            </div>
            <Controller
              name="uu_tien"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('congViec.form.uuTien')}
                  options={uuTienOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('congViec.form.uuTienPlaceholder')}
                  icon={<ListOrdered size={16} className="text-muted-foreground" />}
                  required
                />
              )}
            />
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('congViec.form.trangThai')}
                  options={trangThaiOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('congViec.form.trangThaiPlaceholder')}
                  icon={<Tag size={16} className="text-muted-foreground" />}
                  required
                />
              )}
            />
            <Input
              type="date"
              label={t('congViec.form.ngayHetHan')}
              icon={<Calendar size={14} />}
              required
              {...register('ngay_het_han')}
              error={errors.ngay_het_han?.message}
            />
            <Input
              type="number"
              min={0}
              max={100}
              label={t('congViec.form.tienDo')}
              icon={<Power size={14} />}
              {...register('phan_tram_hoan_thanh')}
              error={errors.phan_tram_hoan_thanh?.message}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default CongViecForm;
