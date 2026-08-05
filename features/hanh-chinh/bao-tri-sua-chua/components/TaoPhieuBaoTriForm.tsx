import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench, FileText } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import NumberInput from '../../../../components/ui/NumberInput';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { phieuBaoTriSuaChuaSchema, type PhieuBaoTriSuaChuaFormValues } from '../core/schema';
import { useCreatePhieuBaoTri, useUpdatePhieuBaoTri } from '../hooks/use-bao-tri-sua-chua';
import { useTaiSanList } from '../../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import { useLoaiChiPhiList } from '../../thiet-lap-tai-san/hooks/use-loai-chi-phi';
import { useAuthStore } from '../../../../store/useStore';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { TRANG_THAI_OPTIONS, getHangMucLabel } from '../core/constants';
import type { PhieuBaoTriSuaChua } from '../core/types';
import type { LoaiChiPhi } from '../../thiet-lap-tai-san/core/types';
import type { TFunction } from 'i18next';

const DEFAULT_VALUES: PhieuBaoTriSuaChuaFormValues = {
  ngay: new Date().toISOString().slice(0, 10),
  id_tai_san: '',
  id_hang_muc: '',
  mo_ta: '',
  so_tien: 0,
  ghi_chu: null,
  trang_thai: undefined,
  nguoi_duyet: null,
};

function resolveTenHangMuc(id: string, loai: LoaiChiPhi[], t: TFunction): string {
  const found = loai.find((l) => l.id === id);
  if (found) return found.ten;
  return getHangMucLabel(id, t);
}

interface Props {
  onClose: () => void;
  defaultTaiSanId?: string;
  initialData?: PhieuBaoTriSuaChua | null;
  onSuccessAfterEdit?: (item: PhieuBaoTriSuaChua) => void;
}

const RequiredStar = () => <span className="text-destructive ml-0.5">*</span>;

const TaoPhieuBaoTriForm: React.FC<Props> = ({ onClose, defaultTaiSanId, initialData, onSuccessAfterEdit }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? '';
  const isEdit = !!initialData;
  const createMutation = useCreatePhieuBaoTri(onClose);
  const updateMutation = useUpdatePhieuBaoTri((updatedItem) => {
    onClose();
    if (updatedItem) onSuccessAfterEdit?.(updatedItem);
  });
  const { data: assets = [] } = useTaiSanList();
  const { data: loaiChiPhi = [] } = useLoaiChiPhiList();

  const activeLoai = React.useMemo(
    () => loaiChiPhi.filter((l) => l.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG),
    [loaiChiPhi]
  );
  const firstLoaiId = activeLoai[0]?.id ?? '';

  const defaultValuesFromData = initialData
    ? {
        ngay: initialData.ngay,
        id_tai_san: initialData.id_tai_san,
        id_hang_muc: initialData.id_hang_muc,
        mo_ta: initialData.mo_ta,
        so_tien: initialData.so_tien,
        ghi_chu: initialData.ghi_chu ?? null,
        trang_thai: initialData.trang_thai,
        nguoi_duyet: initialData.nguoi_duyet ?? null,
      }
    : { ...DEFAULT_VALUES, id_tai_san: defaultTaiSanId ?? '' };

  const { register, handleSubmit, formState: { errors, isDirty }, control, setValue, getValues } = useForm<PhieuBaoTriSuaChuaFormValues>({
    resolver: zodResolver(phieuBaoTriSuaChuaSchema),
    defaultValues: defaultValuesFromData,
  });

  React.useEffect(() => {
    if (isEdit || !firstLoaiId) return;
    if (!getValues('id_hang_muc')) setValue('id_hang_muc', firstLoaiId);
  }, [isEdit, firstLoaiId, getValues, setValue]);

  const assetOptions = React.useMemo(
    () => assets.filter((a) => a.trang_thai === 1).map((a) => ({
      value: a.id,
      label: `${a.ma_tai_san} - ${a.ten_tai_san}`,
      subLabel: a.ten_noi_luu ?? undefined,
    })),
    [assets]
  );

  const hangMucOptions = React.useMemo(() => {
    const base = activeLoai.map((l) => ({
      value: l.id,
      label: `${l.ten} (${l.ma})`,
    }));
    if (initialData?.id_hang_muc && !base.some((o) => o.value === initialData.id_hang_muc)) {
      const label =
        initialData.ten_hang_muc ?? getHangMucLabel(initialData.id_hang_muc, t);
      return [{ value: initialData.id_hang_muc, label }, ...base];
    }
    return base;
  }, [activeLoai, initialData, t]);

  const trangThaiOptions = React.useMemo(
    () => TRANG_THAI_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  );

  const payload = (data: PhieuBaoTriSuaChuaFormValues) => {
    const ten_hang_muc = resolveTenHangMuc(data.id_hang_muc, loaiChiPhi, t);
    const base = {
      ngay: data.ngay,
      id_tai_san: data.id_tai_san,
      id_hang_muc: data.id_hang_muc,
      ten_hang_muc,
      mo_ta: data.mo_ta.trim(),
      so_tien: Number(data.so_tien) || 0,
      ghi_chu: data.ghi_chu?.trim() || null,
    };
    if (isEdit) {
      return {
        ...base,
        trang_thai: data.trang_thai,
        nguoi_duyet: data.nguoi_duyet?.trim() || null,
      };
    }
    return base;
  };

  const onSubmit: SubmitHandler<PhieuBaoTriSuaChuaFormValues> = (data) => {
    const body = payload(data);
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: body });
    } else {
      if (!currentUserId) return;
      const tenNguoiTao = user?.ho_va_ten?.trim() || user?.full_name?.trim() || null;
      createMutation.mutate({ data: body, id_nguoi_tao: currentUserId, ten_nguoi_tao: tenNguoiTao });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      isDirty={isDirty}
      title={t(isEdit ? 'baoTriSuaChua.form.editTitle' : 'baoTriSuaChua.form.createTitle')}
      icon={<Wrench size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="phieu-bao-tri-sua-chua-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('baoTriSuaChua.form.submitEdit')}
          createLabel={t('baoTriSuaChua.form.submit')}
        />
      }
    >
      <form id="phieu-bao-tri-sua-chua-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormSection title={t('baoTriSuaChua.form.sectionGeneral')} icon={<Wrench size={18} />} variant="primary">
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.ngay')}<RequiredStar /></label>
              <Input type="date" {...register('ngay')} className={errors.ngay ? 'border-destructive' : ''} />
              {errors.ngay && <p className="text-destructive text-xs mt-1">{errors.ngay.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.hangMuc')}<RequiredStar /></label>
              <Controller
                name="id_hang_muc"
                control={control}
                render={({ field }) => (
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    options={hangMucOptions}
                    placeholder={t('baoTriSuaChua.form.hangMucPlaceholder')}
                  />
                )}
              />
              {errors.id_hang_muc && <p className="text-destructive text-xs mt-1">{errors.id_hang_muc.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.taiSan')}<RequiredStar /></label>
              <Controller
                name="id_tai_san"
                control={control}
                render={({ field }) => (
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    options={assetOptions}
                    placeholder={t('baoTriSuaChua.form.taiSanPlaceholder')}
                  />
                )}
              />
              {errors.id_tai_san && <p className="text-destructive text-xs mt-1">{errors.id_tai_san.message}</p>}
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('baoTriSuaChua.form.sectionContent')} icon={<FileText size={18} />}>
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.moTa')}<RequiredStar /></label>
              <Textarea {...register('mo_ta')} placeholder={t('baoTriSuaChua.form.moTaPlaceholder')} rows={3} className={errors.mo_ta ? 'border-destructive' : ''} />
              {errors.mo_ta && <p className="text-destructive text-xs mt-1">{errors.mo_ta.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.soTien')}<RequiredStar /></label>
              <Controller
                name="so_tien"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    min={0}
                    maxFractionDigits={2}
                    placeholder={t('baoTriSuaChua.form.soTienPlaceholder')}
                    error={errors.so_tien?.message}
                    className={errors.so_tien ? 'border-destructive' : undefined}
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.ghiChu')}</label>
              <Textarea {...register('ghi_chu')} placeholder={t('baoTriSuaChua.form.ghiChuPlaceholder')} rows={2} />
            </div>
          </FormGrid>
        </FormSection>

        {isEdit && (
          <FormSection title={t('baoTriSuaChua.form.sectionStatus')} icon={<Wrench size={18} />}>
            <FormGrid cols={1}>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.trangThai')}</label>
                <Controller
                  name="trang_thai"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      value={field.value ?? ''}
                      onChange={(v) => field.onChange(v || undefined)}
                      options={trangThaiOptions}
                      placeholder={t('baoTriSuaChua.form.trangThaiPlaceholder')}
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.nguoiDuyet')}</label>
                <Input {...register('nguoi_duyet')} placeholder={t('baoTriSuaChua.form.nguoiDuyetPlaceholder')} />
              </div>
            </FormGrid>
          </FormSection>
        )}
      </form>
    </GenericDrawer>
  );
};

export default TaoPhieuBaoTriForm;
