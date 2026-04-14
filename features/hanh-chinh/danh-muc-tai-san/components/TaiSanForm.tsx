import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useConfirmStore } from '@/store/useConfirmStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Hash, Type, Layers, MapPin, Tag, User, Calendar, DollarSign, FileText, Image as ImageIcon, Package, Barcode, Truck } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import SingleImageInput from '../../../../components/ui/SingleImageInput';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { TaiSan } from '../core/types';
import { TaiSanFormValues, taiSanSchema } from '../core/schema';
import { useCreateTaiSan, useUpdateTaiSan, useGetNextMaTaiSan, checkMaTaiSanExistsAsync, useDistinctThuongHieu, useDistinctModel, useDistinctXuatXu, useDistinctNhaCungCap } from '../hooks/use-danh-muc-tai-san';
import { useAssetGroups } from '../../thiet-lap-tai-san/hooks/use-nhom-tai-san';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useAssetStatuses } from '../../thiet-lap-tai-san/hooks/use-trang-thai';
import { useEmployeesRefQuery } from '@/lib/hooks/use-supabase-ref-queries';
import { generateAssetBarcode } from '../utils/barcode';
import BarcodeQRDisplay from './BarcodeQRDisplay';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import i18n from '../../../../lib/i18n';
const DEFAULT_VALUES: TaiSanFormValues = {
  ma_tai_san: '',
  ten_tai_san: '',
  id_nhom: '',
  id_noi_luu: '',
  id_trang_thai: '',
  id_nhan_vien_dang_giu: '',
  thuong_hieu: '',
  model: '',
  serial: '',
  xuat_xu: '',
  ma_barcode: '',
  id_nha_cung_cap: '',
  ten_nha_cung_cap: '',
  ngay_nhap: new Date().toISOString().slice(0, 10),
  nguyen_gia: undefined,
  ngay_bat_dau_trich_khau_hao: '',
  hinh_anh: '',
  ghi_chu: '',
};

interface Props {
  initialData?: TaiSan | null;
  onClose: () => void;
}

const TaiSanForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const lastMaTaiSanRef = useRef<string>(initialData?.ma_tai_san ?? '');
  const isEdit = !!initialData;
  const createMutation = useCreateTaiSan(onClose);
  const updateMutation = useUpdateTaiSan(onClose);
  const { data: nextMa, isSuccess: nextMaSuccess } = useGetNextMaTaiSan(!isEdit);
  const { data: groups = [] } = useAssetGroups();
  const { data: locations = [] } = useAssetStorageLocations();
  const { data: statuses = [] } = useAssetStatuses();
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: distinctThuongHieu = [] } = useDistinctThuongHieu();
  const { data: distinctModel = [] } = useDistinctModel();
  const { data: distinctXuatXu = [] } = useDistinctXuatXu();
  const { data: distinctNhaCungCap = [] } = useDistinctNhaCungCap();

  const groupOptions = useMemo(
    () => groups.map((g) => ({ label: g.ten, value: g.id, subLabel: g.ma })),
    [groups]
  );
  const locationOptions = useMemo(
    () => locations.map((l) => ({ label: l.ten_noi_luu, value: l.id, subLabel: l.ma_noi_luu })),
    [locations]
  );
  const statusOptions = useMemo(
    () => statuses.map((s) => ({ label: s.ten, value: s.id, subLabel: s.ma })),
    [statuses]
  );
  const employeeOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
      })),
    [employees]
  );

  const { register, handleSubmit, formState: { errors }, reset, control, setValue, setError, watch } = useForm<TaiSanFormValues>({
    resolver: zodResolver(taiSanSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const maBarcode = watch('ma_barcode');
  const maTaiSan = watch('ma_tai_san');
  const thuongHieuValue = watch('thuong_hieu');
  const modelValue = watch('model');
  const xuatXuValue = watch('xuat_xu');
  const nhaCungCapValue = watch('ten_nha_cung_cap');

  const thuongHieuOptions = useMemo(() => {
    const opts = distinctThuongHieu.map((v) => ({ label: v, value: v }));
    if (thuongHieuValue?.trim() && !opts.some((o) => o.value === thuongHieuValue.trim())) {
      return [...opts, { label: thuongHieuValue.trim(), value: thuongHieuValue.trim() }];
    }
    return opts;
  }, [distinctThuongHieu, thuongHieuValue]);

  const modelOptions = useMemo(() => {
    const opts = distinctModel.map((v) => ({ label: v, value: v }));
    if (modelValue?.trim() && !opts.some((o) => o.value === modelValue.trim())) {
      return [...opts, { label: modelValue.trim(), value: modelValue.trim() }];
    }
    return opts;
  }, [distinctModel, modelValue]);

  const xuatXuOptions = useMemo(() => {
    const opts = distinctXuatXu.map((v) => ({ label: v, value: v }));
    if (xuatXuValue?.trim() && !opts.some((o) => o.value === xuatXuValue.trim())) {
      return [...opts, { label: xuatXuValue.trim(), value: xuatXuValue.trim() }];
    }
    return opts;
  }, [distinctXuatXu, xuatXuValue]);

  const nhaCungCapOptions = useMemo(() => {
    const opts = distinctNhaCungCap.map((v) => ({ label: v, value: v }));
    if (nhaCungCapValue?.trim() && !opts.some((o) => o.value === nhaCungCapValue.trim())) {
      return [...opts, { label: nhaCungCapValue.trim(), value: nhaCungCapValue.trim() }];
    }
    return opts;
  }, [distinctNhaCungCap, nhaCungCapValue]);
  const maTaiSanRegister = register('ma_tai_san');
  const handleGenerateBarcode = () => {
    setValue('ma_barcode', generateAssetBarcode(maTaiSan, initialData?.id));
  };

  const handleMaTaiSanBlur = () => {
    const current = watch('ma_tai_san')?.trim() ?? '';
    if (current === lastMaTaiSanRef.current) return;
    const hasBarcode = !!watch('ma_barcode')?.trim();
    if (hasBarcode) {
      confirm({
        title: t('danhSachTaiSan.form.barcodeSyncTitle'),
        message: t('danhSachTaiSan.form.barcodeSyncMessage'),
        variant: 'info',
        confirmText: t('common.confirm'),
        cancelText: t('common.cancel'),
        onConfirm: () => {
          setValue('ma_barcode', current);
          lastMaTaiSanRef.current = current;
        },
        onCancel: () => {
          lastMaTaiSanRef.current = current;
        },
      });
    } else if (current) {
      setValue('ma_barcode', current);
      lastMaTaiSanRef.current = current;
    } else {
      lastMaTaiSanRef.current = current;
    }
  };

  useEffect(() => {
    if (initialData) {
      const defaultBarcode = initialData.ma_barcode?.trim() || initialData.ma_tai_san || '';
      lastMaTaiSanRef.current = initialData.ma_tai_san ?? '';
      reset({
        ma_tai_san: initialData.ma_tai_san,
        ten_tai_san: initialData.ten_tai_san,
        id_nhom: initialData.id_nhom,
        id_noi_luu: initialData.id_noi_luu,
        id_trang_thai: initialData.id_trang_thai,
        id_nhan_vien_dang_giu: initialData.id_nhan_vien_dang_giu ?? '',
        thuong_hieu: initialData.thuong_hieu ?? '',
        model: initialData.model ?? '',
        serial: initialData.serial ?? '',
        xuat_xu: initialData.xuat_xu ?? '',
        ma_barcode: defaultBarcode,
        id_nha_cung_cap: initialData.id_nha_cung_cap ?? '',
        ten_nha_cung_cap: initialData.ten_nha_cung_cap ?? '',
        ngay_nhap: initialData.ngay_nhap?.slice(0, 10) ?? DEFAULT_VALUES.ngay_nhap,
        nguyen_gia: initialData.nguyen_gia ?? undefined,
        ngay_bat_dau_trich_khau_hao: initialData.ngay_bat_dau_trich_khau_hao?.slice(0, 10) ?? initialData.ngay_nhap?.slice(0, 10) ?? '',
        hinh_anh: initialData.hinh_anh ?? '',
        ghi_chu: initialData.ghi_chu ?? '',
      });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      reset({ ...DEFAULT_VALUES, ngay_nhap: today, ngay_bat_dau_trich_khau_hao: today });
    }
  }, [initialData, reset]);

  useEffect(() => {
    if (!isEdit && nextMaSuccess && nextMa && typeof nextMa === 'string') {
      setValue('ma_tai_san', nextMa);
      lastMaTaiSanRef.current = nextMa;
    }
  }, [isEdit, nextMaSuccess, nextMa, setValue]);

  const onSubmit: SubmitHandler<TaiSanFormValues> = async (data) => {
    const ma = (data.ma_tai_san ?? '').trim();
    const exists = await checkMaTaiSanExistsAsync(ma, isEdit ? initialData?.id : null);
    if (exists) {
      setError('ma_tai_san', { type: 'manual', message: i18n.t('danhSachTaiSan.validation.maDuplicate') });
      return;
    }
    const sanitized: TaiSanFormValues = {
      ...data,
      id_nhan_vien_dang_giu: data.id_nhan_vien_dang_giu || undefined,
      thuong_hieu: data.thuong_hieu?.trim() || undefined,
      model: data.model?.trim() || undefined,
      serial: data.serial?.trim() || undefined,
      xuat_xu: data.xuat_xu?.trim() || undefined,
      ma_barcode: data.ma_barcode?.trim() || undefined,
      ten_nha_cung_cap: data.ten_nha_cung_cap?.trim() || undefined,
      hinh_anh: data.hinh_anh?.trim() || undefined,
      ghi_chu: data.ghi_chu?.trim() || undefined,
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
      title={isEdit ? t('danhSachTaiSan.form.editTitle') : t('danhSachTaiSan.form.createTitle')}
      icon={<Building2 size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="tai-san-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('danhSachTaiSan.form.save')}
          createLabel={t('danhSachTaiSan.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="tai-san-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Hình ảnh tài sản — một mình một dòng, trên cùng */}
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <Controller
            name="hinh_anh"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col items-center w-full">
                <SingleImageInput
                  label={t('danhSachTaiSan.form.hinhAnh')}
                  icon={<ImageIcon size={14} />}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('danhSachTaiSan.form.hinhAnhPlaceholder')}
                  hint={t('danhSachTaiSan.form.hinhAnhHint')}
                  shape="rounded"
                  aspectRatio="1/1"
                  maxSizeMB={3}
                  className="w-[200px]"
                />
                {errors.hinh_anh?.message && (
                  <p className="text-xs font-medium text-destructive mt-2 text-center">{errors.hinh_anh.message}</p>
                )}
              </div>
            )}
          />
        </div>

        <FormSection title={t('danhSachTaiSan.form.basicInfo')} icon={<Building2 size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('danhSachTaiSan.form.ma')}
              placeholder={t('danhSachTaiSan.form.maPlaceholder')}
              icon={<Hash size={12} />}
              required
              {...maTaiSanRegister}
              onBlur={(e) => {
                maTaiSanRegister.onBlur(e);
                handleMaTaiSanBlur();
              }}
              error={errors.ma_tai_san?.message}
            />
            <Input
              label={t('danhSachTaiSan.form.ten')}
              placeholder={t('danhSachTaiSan.form.tenPlaceholder')}
              icon={<Type size={12} />}
              required
              {...register('ten_tai_san')}
              error={errors.ten_tai_san?.message}
            />
            <Controller
              name="id_nhom"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhSachTaiSan.form.nhom')}
                  options={groupOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('danhSachTaiSan.form.nhomPlaceholder')}
                  error={errors.id_nhom?.message}
                  icon={<Layers size={12} />}
                />
              )}
            />
            <Controller
              name="id_noi_luu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhSachTaiSan.form.noiLuu')}
                  options={locationOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('danhSachTaiSan.form.noiLuuPlaceholder')}
                  error={errors.id_noi_luu?.message}
                  icon={<MapPin size={12} />}
                />
              )}
            />
            <Controller
              name="id_trang_thai"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhSachTaiSan.form.trangThai')}
                  options={statusOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('danhSachTaiSan.form.trangThaiPlaceholder')}
                  error={errors.id_trang_thai?.message}
                  icon={<Tag size={12} />}
                />
              )}
            />
            <Controller
              name="id_nhan_vien_dang_giu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhSachTaiSan.form.nguoiGiu')}
                  options={employeeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('danhSachTaiSan.form.nguoiGiuPlaceholder')}
                  icon={<User size={12} />}
                />
              )}
            />
            <Controller
              name="thuong_hieu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhSachTaiSan.form.thuongHieu')}
                  options={thuongHieuOptions}
                  value={field.value || ''}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('danhSachTaiSan.form.thuongHieuPlaceholder')}
                  icon={<Package size={12} />}
                  error={errors.thuong_hieu?.message}
                  creatable
                  creatableLabel={t('danhSachTaiSan.form.creatableNew')}
                />
              )}
            />
            <Controller
              name="model"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhSachTaiSan.form.model')}
                  options={modelOptions}
                  value={field.value || ''}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('danhSachTaiSan.form.modelPlaceholder')}
                  icon={<Package size={12} />}
                  error={errors.model?.message}
                  creatable
                  creatableLabel={t('danhSachTaiSan.form.creatableNew')}
                />
              )}
            />
            <Input
              label={t('danhSachTaiSan.form.serial')}
              placeholder={t('danhSachTaiSan.form.serialPlaceholder')}
              icon={<Hash size={12} />}
              {...register('serial')}
              error={errors.serial?.message}
            />
            <Controller
              name="xuat_xu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhSachTaiSan.form.xuatXu')}
                  options={xuatXuOptions}
                  value={field.value || ''}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('danhSachTaiSan.form.xuatXuPlaceholder')}
                  icon={<Package size={12} />}
                  error={errors.xuat_xu?.message}
                  creatable
                  creatableLabel={t('danhSachTaiSan.form.creatableNew')}
                />
              )}
            />
            <div className="space-y-2">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    label={t('danhSachTaiSan.form.maBarcode')}
                    placeholder={t('danhSachTaiSan.form.maBarcodePlaceholder')}
                    icon={<Barcode size={12} />}
                    {...register('ma_barcode')}
                    error={errors.ma_barcode?.message}
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleGenerateBarcode} className="shrink-0 mb-0.5">
                  {t('danhSachTaiSan.form.tuTaoMaBarcode')}
                </Button>
              </div>
              {maBarcode?.trim() ? (
                <BarcodeQRDisplay value={maBarcode.trim()} qrSize={100} barcodeHeight={40} className="mt-2" />
              ) : null}
            </div>
            <Controller
              name="ten_nha_cung_cap"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhSachTaiSan.form.nhaCungCap')}
                  options={nhaCungCapOptions}
                  value={field.value || ''}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder={t('danhSachTaiSan.form.nhaCungCapPlaceholder')}
                  icon={<Truck size={12} />}
                  error={errors.ten_nha_cung_cap?.message}
                  creatable
                  creatableLabel={t('danhSachTaiSan.form.creatableNew')}
                />
              )}
            />
            <Input
              type="date"
              label={t('danhSachTaiSan.form.ngayNhap')}
              {...register('ngay_nhap')}
              error={errors.ngay_nhap?.message}
              icon={<Calendar size={12} />}
            />
            <Controller
              name="nguyen_gia"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label={t('danhSachTaiSan.form.nguyenGia')}
                  placeholder={t('danhSachTaiSan.form.nguyenGiaPlaceholder')}
                  icon={<DollarSign size={12} />}
                  value={field.value ?? undefined}
                  onChange={(n) => field.onChange(n)}
                  suffix=""
                  error={errors.nguyen_gia?.message}
                />
              )}
            />
            <Input
              type="date"
              label={t('danhSachTaiSan.form.ngayBatDauTrichKhauHao')}
              {...register('ngay_bat_dau_trich_khau_hao')}
              error={errors.ngay_bat_dau_trich_khau_hao?.message}
              icon={<Calendar size={12} />}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('danhSachTaiSan.form.ghiChu')}
                placeholder={t('danhSachTaiSan.form.ghiChuPlaceholder')}
                icon={<FileText size={12} />}
                rows={3}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default TaiSanForm;
