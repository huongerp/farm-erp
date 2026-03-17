import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, User, Calendar, FileText, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { phieuCapPhatThuHoiSchema, type PhieuCapPhatThuHoiFormValues } from '../core/schema';
import { useCreatePhieuAndExecute, useUpdatePhieu } from '../hooks/use-cap-phat-thu-hoi';
import { useTaiSanList } from '../../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useEmployees } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
import { useAuthStore } from '../../../../store/useStore';
import { LOAI_PHIEU_OPTIONS } from '../core/constants';
import type { PhieuCapPhatThuHoi } from '../core/types';

const DEFAULT_VALUES: PhieuCapPhatThuHoiFormValues = {
  loai_phieu: 'cap_phat',
  id_nguoi_giu_truoc: null,
  id_nguoi_giu_sau: null,
  ngay_thuc_hien: new Date().toISOString().slice(0, 10),
  id_nguoi_thuc_hien: '',
  ghi_chu: null,
  chi_tiet: [{ id_tai_san: '', id_noi_luu_truoc: '', id_noi_luu_sau: '', ghi_chu: '' }],
};

interface Props {
  onClose: () => void;
  defaultTaiSanId?: string;
  initialData?: PhieuCapPhatThuHoi | null;
  onSuccessAfterEdit?: (item: PhieuCapPhatThuHoi) => void;
}

const RequiredStar = () => <span className="text-destructive ml-0.5">*</span>;

const TaoPhieuForm: React.FC<Props> = ({ onClose, defaultTaiSanId, initialData, onSuccessAfterEdit }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? '';
  const isEdit = !!initialData;
  const createMutation = useCreatePhieuAndExecute(onClose);
  const updateMutation = useUpdatePhieu((updatedItem) => {
    onClose();
    if (updatedItem) onSuccessAfterEdit?.(updatedItem);
  });

  const { data: assets = [] } = useTaiSanList();
  const { data: locations = [] } = useAssetStorageLocations();
  const { data: employees = [] } = useEmployees();

  const defaultValuesFromData: PhieuCapPhatThuHoiFormValues = initialData
    ? {
        loai_phieu: initialData.loai_phieu,
        id_nguoi_giu_truoc: initialData.id_nguoi_giu_truoc ?? null,
        id_nguoi_giu_sau: initialData.id_nguoi_giu_sau ?? null,
        ngay_thuc_hien: initialData.ngay_thuc_hien,
        id_nguoi_thuc_hien: initialData.id_nguoi_thuc_hien,
        ghi_chu: initialData.ghi_chu ?? null,
        chi_tiet: (initialData.chi_tiet ?? []).map((ct) => ({
          id_tai_san: ct.id_tai_san,
          id_noi_luu_truoc: ct.id_noi_luu_truoc ?? '',
          id_noi_luu_sau: ct.id_noi_luu_sau ?? '',
          ghi_chu: ct.ghi_chu ?? '',
        })),
      }
    : defaultTaiSanId
      ? {
          ...DEFAULT_VALUES,
          chi_tiet: [{ id_tai_san: defaultTaiSanId, id_noi_luu_truoc: '', id_noi_luu_sau: '', ghi_chu: '' }],
        }
      : DEFAULT_VALUES;

  const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<PhieuCapPhatThuHoiFormValues>({
    resolver: zodResolver(phieuCapPhatThuHoiSchema),
    defaultValues: defaultValuesFromData,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'chi_tiet' });

  const selectedLoai = useWatch({ control, name: 'loai_phieu', defaultValue: 'cap_phat' });
  const chiTietValues = useWatch({ control, name: 'chi_tiet' });

  useEffect(() => {
    if (!currentUserId) return;
    setValue('id_nguoi_thuc_hien', currentUserId);
  }, [currentUserId, setValue]);

  useEffect(() => {
    if (!chiTietValues) return;
    chiTietValues.forEach((ct, idx) => {
      if (!ct.id_tai_san) return;
      const asset = assets.find((a) => a.id === ct.id_tai_san);
      if (asset && ct.id_noi_luu_truoc !== asset.id_noi_luu) {
        setValue(`chi_tiet.${idx}.id_noi_luu_truoc`, asset.id_noi_luu);
      }
    });
  }, [chiTietValues, assets, setValue]);

  const assetOptions = useMemo(
    () => assets.filter((a) => a.trang_thai === 1).map((a) => ({
      value: a.id,
      label: `${a.ma_tai_san} - ${a.ten_tai_san}`,
      subLabel: a.ten_noi_luu ?? undefined,
    })),
    [assets]
  );
  const locationOptions = useMemo(
    () => locations.map((l) => ({ value: l.id, label: l.ten_noi_luu, subLabel: l.ma_noi_luu })),
    [locations]
  );
  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: e.ho_ten, subLabel: e.ma_nhan_vien })),
    [employees]
  );
  const loaiOptions = useMemo(
    () => LOAI_PHIEU_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  );

  const needNguoiGiuSau =
    selectedLoai === 'cap_phat' ||
    selectedLoai === 'luan_chuyen_nguoi' ||
    selectedLoai === 'luan_chuyen_ca_hai';

  const onSubmit: SubmitHandler<PhieuCapPhatThuHoiFormValues> = (data) => {
    if (!currentUserId) return;
    const validLines = data.chi_tiet.filter((ct) => ct.id_tai_san && ct.id_noi_luu_sau);
    const body = {
      loai_phieu: data.loai_phieu,
      id_nguoi_giu_truoc: data.id_nguoi_giu_truoc || null,
      id_nguoi_giu_sau: data.id_nguoi_giu_sau || null,
      ngay_thuc_hien: data.ngay_thuc_hien,
      id_nguoi_thuc_hien: data.id_nguoi_thuc_hien,
      ghi_chu: data.ghi_chu?.trim() || null,
      chi_tiet: validLines.map((ct) => ({
        id_tai_san: ct.id_tai_san,
        id_noi_luu_sau: ct.id_noi_luu_sau,
        ghi_chu: ct.ghi_chu?.trim() || null,
      })),
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: body, id_nguoi_thuc_hien: currentUserId });
    } else {
      createMutation.mutate({ data: body, id_nguoi_thuc_hien: currentUserId });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const getAssetNameForLine = (idTaiSan: string) => {
    const asset = assets.find((a) => a.id === idTaiSan);
    return asset ? (asset.ten_noi_luu ?? '—') : '';
  };

  return (
    <GenericDrawer
      title={t(isEdit ? 'capPhatThuHoi.form.editTitle' : 'capPhatThuHoi.form.createTitle')}
      icon={<Package size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="phieu-cap-phat-thu-hoi-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('capPhatThuHoi.form.submitEdit')}
          createLabel={t('capPhatThuHoi.form.submit')}
        />
      }
    >
      <form id="phieu-cap-phat-thu-hoi-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* 1. Loại phiếu */}
        <FormSection title={t('capPhatThuHoi.form.sectionTypeAsset')} icon={<Package size={18} />} variant="primary">
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.loaiPhieu')}<RequiredStar /></label>
              <Controller name="loai_phieu" control={control} render={({ field }) => (
                <Combobox value={field.value} onChange={field.onChange} options={loaiOptions} placeholder={t('capPhatThuHoi.form.loaiPhieuPlaceholder')} searchable dropdownInPortal />
              )} />
              {errors.loai_phieu && <p className="text-destructive text-xs mt-1">{errors.loai_phieu.message}</p>}
            </div>
          </FormGrid>
        </FormSection>

        {/* 2. Người giữ */}
        <FormSection title={t('capPhatThuHoi.form.sectionHolder')} icon={<User size={18} />}>
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.nguoiGiuTruoc')}</label>
              <Controller name="id_nguoi_giu_truoc" control={control} render={({ field }) => (
                <Combobox value={field.value ?? ''} onChange={(v) => field.onChange(v || null)} options={employeeOptions} placeholder={t('capPhatThuHoi.form.nguoiGiuTruocPlaceholder')} searchable dropdownInPortal />
              )} />
            </div>
            {needNguoiGiuSau && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.nguoiGiuSau')}<RequiredStar /></label>
                <Controller name="id_nguoi_giu_sau" control={control} render={({ field }) => (
                  <Combobox value={field.value ?? ''} onChange={(v) => field.onChange(v || null)} options={employeeOptions} placeholder={t('capPhatThuHoi.form.nguoiGiuSauPlaceholder')} searchable dropdownInPortal />
                )} />
                {errors.id_nguoi_giu_sau && <p className="text-destructive text-xs mt-1">{errors.id_nguoi_giu_sau.message}</p>}
              </div>
            )}
          </FormGrid>
        </FormSection>

        {/* 3. Ngày & Người thực hiện */}
        <FormSection title={t('capPhatThuHoi.form.sectionDatePerformer')} icon={<Calendar size={18} />}>
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.ngayThucHien')}<RequiredStar /></label>
              <Input type="date" {...register('ngay_thuc_hien')} className={errors.ngay_thuc_hien ? 'border-destructive' : ''} />
              {errors.ngay_thuc_hien && <p className="text-destructive text-xs mt-1">{errors.ngay_thuc_hien.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.nguoiThucHien')}<RequiredStar /></label>
              <Controller name="id_nguoi_thuc_hien" control={control} render={({ field }) => (
                <Combobox value={field.value} onChange={field.onChange} options={employeeOptions} placeholder={t('capPhatThuHoi.form.nguoiThucHienPlaceholder')} searchable dropdownInPortal />
              )} />
              {errors.id_nguoi_thuc_hien && <p className="text-destructive text-xs mt-1">{errors.id_nguoi_thuc_hien.message}</p>}
            </div>
          </FormGrid>
        </FormSection>

        {/* 4. Chi tiết tài sản – bảng con dạng list (theo chuẩn phiếu kho) */}
        <GenericSubTableSection
          title={t('capPhatThuHoi.form.sectionChiTiet')}
          icon={<Package size={14} className="text-primary" />}
          count={fields.length}
          addLabel={t('capPhatThuHoi.form.addAssetLine')}
          onAdd={() => append({ id_tai_san: '', id_noi_luu_truoc: '', id_noi_luu_sau: '', ghi_chu: '' })}
          emptyTitle={t('capPhatThuHoi.empty')}
          emptyDescription={t('capPhatThuHoi.emptyHint')}
          maxTableHeight="320px"
        >
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">{t('capPhatThuHoi.form.taiSan')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">{t('capPhatThuHoi.form.noiLuuTruoc')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">{t('capPhatThuHoi.form.noiLuuSau')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[120px]">{t('capPhatThuHoi.form.ghiChu')}</th>
              <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-16 bg-muted border-l border-border">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {fields.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-xs">
                  {t('capPhatThuHoi.empty')}
                </td>
              </tr>
            ) : (
              fields.map((field, index) => (
                <tr key={field.id} className="hover:bg-muted/60 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{index + 1}</td>
                  <td className="px-4 py-2.5 min-w-0 align-top">
                    <Controller
                      name={`chi_tiet.${index}.id_tai_san`}
                      control={control}
                      render={({ field: f }) => (
                        <Combobox
                          value={f.value}
                          onChange={f.onChange}
                          options={assetOptions}
                          placeholder={t('capPhatThuHoi.form.taiSanPlaceholder')}
                          searchable
                          dropdownInPortal
                          triggerClassName="h-9 text-sm border-border rounded-md"
                        />
                      )}
                    />
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <Input
                      readOnly
                      value={getAssetNameForLine(chiTietValues?.[index]?.id_tai_san ?? '')}
                      className="h-9 text-sm bg-muted/50 cursor-default border-border w-full"
                    />
                  </td>
                  <td className="px-4 py-2.5 min-w-0 align-top">
                    <Controller
                      name={`chi_tiet.${index}.id_noi_luu_sau`}
                      control={control}
                      render={({ field: f }) => (
                        <Combobox
                          value={f.value}
                          onChange={f.onChange}
                          options={locationOptions}
                          placeholder={t('capPhatThuHoi.form.noiLuuSauPlaceholder')}
                          searchable
                          dropdownInPortal
                          triggerClassName="h-9 text-sm border-border rounded-md"
                        />
                      )}
                    />
                  </td>
                  <td className="px-4 py-2.5 min-w-0 align-top">
                    <Input
                      {...register(`chi_tiet.${index}.ghi_chu`)}
                      placeholder={t('capPhatThuHoi.form.ghiChuPlaceholder')}
                      className="h-9 text-sm border-border w-full"
                    />
                  </td>
                  <td className="sticky right-0 z-[1] px-4 py-2.5 text-center bg-card border-l border-border/50">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                      title={t('common.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </GenericSubTableSection>
        {errors.chi_tiet && typeof errors.chi_tiet.message === 'string' && (
          <p className="text-destructive text-xs -mt-2">{errors.chi_tiet.message}</p>
        )}

        {/* 5. Ghi chú */}
        <FormSection title={t('capPhatThuHoi.form.sectionNote')} icon={<FileText size={18} />}>
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('capPhatThuHoi.form.ghiChu')}</label>
              <Textarea {...register('ghi_chu')} placeholder={t('capPhatThuHoi.form.ghiChuPlaceholder')} rows={2} />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default TaoPhieuForm;
