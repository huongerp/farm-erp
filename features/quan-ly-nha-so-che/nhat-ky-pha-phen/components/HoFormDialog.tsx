import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Waves } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { TRANG_THAI } from '../../../../lib/constants';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { TY_LE_DAU_CA_MAC_DINH, TY_LE_G_LIT_MAC_DINH } from '../core/dinh-muc';
import { hoFormSchema, type HoFormValues } from '../core/schema';
import { soSangChuoi } from '../core/so';
import type { HoPhen } from '../core/types';
import { useLuuHo } from '../hooks/use-nhat-ky-pha-phen';

interface Props {
  branches: Branch[];
  viewAll: boolean;
  allowedBranchIds: string[];
  initialData?: HoPhen | null;
  /** NSC gợi ý khi thêm hồ từ một nhóm NSC. */
  idChiNhanhMacDinh?: string;
  onClose: () => void;
}

const HoFormDialog: React.FC<Props> = ({ branches, viewAll, allowedBranchIds, initialData, idChiNhanhMacDinh, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const mutation = useLuuHo(onClose);

  const branchOptions = useMemo(() => {
    const allowed = new Set(allowedBranchIds);
    return branches
      .filter((b) => (b.trang_thai === TRANG_THAI.DANG_DUNG || b.id === initialData?.id_chi_nhanh) && (viewAll || allowed.has(b.id)))
      .map((b) => ({ value: b.id, label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` }));
  }, [branches, viewAll, allowedBranchIds, initialData?.id_chi_nhanh]);

  const defaultValues = useMemo<HoFormValues>(
    () => ({
      id_chi_nhanh: initialData?.id_chi_nhanh ?? idChiNhanhMacDinh ?? (branchOptions.length === 1 ? branchOptions[0].value : ''),
      ten_ho: initialData?.ten_ho ?? '',
      the_tich_xan_m3: soSangChuoi(initialData?.the_tich_xan_m3),
      the_tich_tia_m3: soSangChuoi(initialData?.the_tich_tia_m3),
      bo_sung_xan_kg: soSangChuoi(initialData?.bo_sung_xan_kg),
      bo_sung_tia_kg: soSangChuoi(initialData?.bo_sung_tia_kg),
      ty_le_g_lit: soSangChuoi(initialData ? initialData.ty_le_g_lit : TY_LE_G_LIT_MAC_DINH),
      ty_le_dau_ca: soSangChuoi(initialData ? initialData.ty_le_dau_ca : TY_LE_DAU_CA_MAC_DINH),
      dang_dung: initialData?.dang_dung ?? true,
      ghi_chu: initialData?.ghi_chu ?? '',
    }),
    [initialData, idChiNhanhMacDinh, branchOptions]
  );

  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<HoFormValues>({ resolver: zodResolver(hoFormSchema), defaultValues });

  useEffect(() => {
    if (isDirty) return;
    reset(defaultValues);
  }, [defaultValues, reset, isDirty]);

  const onSubmit: SubmitHandler<HoFormValues> = (values) => mutation.mutate({ id: initialData?.id ?? null, data: values });
  const pending = isSubmitting || mutation.isPending;
  const so = (name: keyof HoFormValues, labelKey: string) => (
    <Input {...register(name as 'the_tich_xan_m3')} inputMode="decimal" label={t(labelKey)} error={errors[name]?.message as string | undefined} />
  );

  return (
    <GenericDrawer
      title={t(isEdit ? 'nkpp.ho.formTitleEdit' : 'nkpp.ho.formTitleCreate')}
      subtitle={t('nkpp.ho.formSubtitle')}
      icon={<Waves className="text-primary" size={22} />}
      onClose={onClose}
      isDirty={isDirty}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.LARGE}
      footer={
        <FormDrawerFooter
          formId="nkpp-ho-form"
          onCancel={onClose}
          isEdit={isEdit}
          isLoading={pending}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id="nkpp-ho-form" className="space-y-4 pb-2" onSubmit={handleSubmit(onSubmit)}>
        <FormGrid cols={2}>
          <Controller
            name="id_chi_nhanh"
            control={control}
            render={({ field }) => (
              <Combobox
                label={t('nkpp.col.chiNhanh')}
                required
                icon={<Building2 size={16} className="text-muted-foreground" />}
                options={branchOptions}
                value={field.value || null}
                onChange={(v: string | number | null) => field.onChange(v != null ? String(v) : '')}
                error={errors.id_chi_nhanh?.message}
              />
            )}
          />
          <Input {...register('ten_ho')} label={t('nkpp.ho.tenHo')} required error={errors.ten_ho?.message} />
          {so('the_tich_xan_m3', 'nkpp.ho.theTichXan')}
          {so('the_tich_tia_m3', 'nkpp.ho.theTichTia')}
          {so('bo_sung_xan_kg', 'nkpp.ho.boSungXan')}
          {so('bo_sung_tia_kg', 'nkpp.ho.boSungTia')}
          {so('ty_le_g_lit', 'nkpp.ho.tyLeGLit')}
          {so('ty_le_dau_ca', 'nkpp.ho.tyLeDauCa')}
        </FormGrid>
        <p className="text-xs text-muted-foreground m-0">{t('nkpp.ho.congThucHint')}</p>
        <Textarea {...register('ghi_chu')} label={t('nkpp.col.ghiChu')} rows={2} />
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="checkbox" className="h-4 w-4 accent-primary" {...register('dang_dung')} />
          {t('nkpp.ho.dangDung')}
        </label>
      </form>
    </GenericDrawer>
  );
};

export default HoFormDialog;
