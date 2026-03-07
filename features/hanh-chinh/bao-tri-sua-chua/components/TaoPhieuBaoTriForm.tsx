import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench, Package, User, Calendar, FileText } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { phieuBaoTriSuaChuaSchema, type PhieuBaoTriSuaChuaFormValues } from '../core/schema';
import { useCreatePhieuBaoTri, useUpdatePhieuBaoTri } from '../hooks/use-bao-tri-sua-chua';
import { useTaiSanList } from '../../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import { useEmployees } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
import { useAuthStore } from '../../../../store/useStore';
import { HANG_MUC_OPTIONS } from '../core/constants';
import type { PhieuBaoTriSuaChua } from '../core/types';

const DEFAULT_VALUES: PhieuBaoTriSuaChuaFormValues = {
  hang_muc: 'bao_tri',
  id_tai_san: '',
  ngay_yeu_cau: new Date().toISOString().slice(0, 10),
  ngay_hen: new Date().toISOString().slice(0, 10),
  mo_ta: '',
  ghi_chu: null,
  id_nguoi_phu_trach: null,
};

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
    onSuccessAfterEdit?.(updatedItem);
  });
  const { data: assets = [] } = useTaiSanList();
  const { data: employees = [] } = useEmployees();

  const defaultValuesFromData = initialData
    ? {
        hang_muc: initialData.hang_muc,
        id_tai_san: initialData.id_tai_san,
        ngay_yeu_cau: initialData.ngay_yeu_cau,
        ngay_hen: initialData.ngay_hen,
        ngay_bat_dau: initialData.ngay_bat_dau ?? null,
        ngay_hoan_thanh: initialData.ngay_hoan_thanh ?? null,
        mo_ta: initialData.mo_ta,
        ghi_chu: initialData.ghi_chu ?? null,
        id_nguoi_phu_trach: initialData.id_nguoi_phu_trach ?? null,
        trang_thai: initialData.trang_thai,
      }
    : { ...DEFAULT_VALUES, id_tai_san: defaultTaiSanId ?? '' };

  const { register, handleSubmit, formState: { errors }, control } = useForm<PhieuBaoTriSuaChuaFormValues>({
    resolver: zodResolver(phieuBaoTriSuaChuaSchema),
    defaultValues: defaultValuesFromData,
  });

  const assetOptions = React.useMemo(
    () => assets.filter((a) => a.trang_thai === 1).map((a) => ({
      value: a.id,
      label: `${a.ma_tai_san} - ${a.ten_tai_san}`,
      subLabel: a.ten_noi_luu ?? undefined,
    })),
    [assets]
  );
  const employeeOptions = React.useMemo(
    () => employees.map((e) => ({ value: e.id, label: e.ho_ten, subLabel: e.ma_nhan_vien })),
    [employees]
  );
  const hangMucOptions = React.useMemo(
    () => HANG_MUC_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  );

  const payload = (data: PhieuBaoTriSuaChuaFormValues) => {
    const base = {
      hang_muc: data.hang_muc,
      id_tai_san: data.id_tai_san,
      ngay_yeu_cau: data.ngay_yeu_cau,
      ngay_hen: data.ngay_hen,
      mo_ta: data.mo_ta.trim(),
      ghi_chu: data.ghi_chu?.trim() || null,
      id_nguoi_phu_trach: data.id_nguoi_phu_trach || null,
    };
    if (isEdit) {
      return {
        ...base,
        ngay_bat_dau: data.ngay_bat_dau?.trim() || null,
        ngay_hoan_thanh: data.ngay_hoan_thanh?.trim() || null,
        trang_thai: data.trang_thai,
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
      createMutation.mutate({ data: body, id_nguoi_tao: currentUserId });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
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
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.hangMuc')}<RequiredStar /></label>
              <Controller
                name="hang_muc"
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
              {errors.hang_muc && <p className="text-destructive text-xs mt-1">{errors.hang_muc.message}</p>}
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

        <FormSection title={t('baoTriSuaChua.form.sectionDate')} icon={<Calendar size={18} />}>
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.ngayYeuCau')}<RequiredStar /></label>
              <Input type="date" {...register('ngay_yeu_cau')} className={errors.ngay_yeu_cau ? 'border-destructive' : ''} />
              {errors.ngay_yeu_cau && <p className="text-destructive text-xs mt-1">{errors.ngay_yeu_cau.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.ngayHen')}<RequiredStar /></label>
              <Input type="date" {...register('ngay_hen')} className={errors.ngay_hen ? 'border-destructive' : ''} />
              {errors.ngay_hen && <p className="text-destructive text-xs mt-1">{errors.ngay_hen.message}</p>}
            </div>
            {isEdit && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.ngayBatDau')}</label>
                  <Input type="date" {...register('ngay_bat_dau')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.ngayHoanThanh')}</label>
                  <Input type="date" {...register('ngay_hoan_thanh')} />
                </div>
              </>
            )}
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
                      value={String(field.value ?? 0)}
                      onChange={(v) => field.onChange(v === '1' ? 1 : 0)}
                      options={[
                        { value: '0', label: t('baoTriSuaChua.statusPending') },
                        { value: '1', label: t('baoTriSuaChua.statusCompleted') },
                      ]}
                      placeholder={t('baoTriSuaChua.form.trangThaiPlaceholder')}
                    />
                  )}
                />
              </div>
            </FormGrid>
          </FormSection>
        )}

        <FormSection title={t('baoTriSuaChua.form.sectionContent')} icon={<FileText size={18} />}>
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.moTa')}<RequiredStar /></label>
              <Textarea {...register('mo_ta')} placeholder={t('baoTriSuaChua.form.moTaPlaceholder')} rows={3} className={errors.mo_ta ? 'border-destructive' : ''} />
              {errors.mo_ta && <p className="text-destructive text-xs mt-1">{errors.mo_ta.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.nguoiPhuTrach')}</label>
              <Controller
                name="id_nguoi_phu_trach"
                control={control}
                render={({ field }) => (
                  <Combobox
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v || null)}
                    options={[{ value: '', label: '—' }, ...employeeOptions]}
                    placeholder={t('baoTriSuaChua.form.nguoiPhuTrachPlaceholder')}
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
      </form>
    </GenericDrawer>
  );
};

export default TaoPhieuBaoTriForm;
