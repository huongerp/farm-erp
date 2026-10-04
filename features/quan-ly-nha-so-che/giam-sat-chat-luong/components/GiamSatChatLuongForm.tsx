import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeCheck, Boxes, Building2, Calendar, Hash, Package } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import { TRANG_THAI, TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useHangHoaRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { getTodayISO } from '../../../../lib/utils';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { giamSatChatLuongFormSchema, type GiamSatChatLuongFormValues } from '../core/schema';
import type { GiamSatChatLuong } from '../core/types';
import { useCreateGiamSatChatLuong, useUpdateGiamSatChatLuong } from '../hooks/use-giam-sat-chat-luong';

/** Mặc định theo cách làm ở xưởng: 1 cây ~60 thùng (đôi khi 30), lấy 10 thùng mẫu. */
const SO_THUNG_CAY_MAC_DINH = 60;
const SO_THUNG_MAU_MAC_DINH = 10;

interface Props {
  branches: Branch[];
  initialData?: GiamSatChatLuong | null;
  preferredBranchId?: string | null;
  /** Farm được phép tạo phiếu (null = mọi farm). */
  allowedBranchIds?: string[] | null;
  onClose: () => void;
  /** Tạo xong — mở luôn chi tiết để in tem. */
  onCreated?: (item: GiamSatChatLuong) => void;
}

function toForm(d: GiamSatChatLuong): GiamSatChatLuongFormValues {
  return {
    id_chi_nhanh: d.id_chi_nhanh,
    ngay: d.ngay,
    id_hang_hoa: d.id_hang_hoa ?? '',
    ma_cay_hang: d.ma_cay_hang ?? '',
    so_thung_cay: d.so_thung_cay,
    so_thung_mau: d.so_thung_mau,
    ghi_chu: d.ghi_chu ?? '',
  };
}

const GiamSatChatLuongForm: React.FC<Props> = ({
  branches,
  initialData,
  preferredBranchId,
  allowedBranchIds,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateGiamSatChatLuong();
  const updateMutation = useUpdateGiamSatChatLuong(onClose);
  const { data: hangHoaList = [] } = useHangHoaRefQuery();

  const defaultValues = useMemo<GiamSatChatLuongFormValues>(
    () =>
      initialData
        ? toForm(initialData)
        : {
            id_chi_nhanh: preferredBranchId ?? '',
            ngay: getTodayISO(),
            id_hang_hoa: '',
            ma_cay_hang: '',
            so_thung_cay: SO_THUNG_CAY_MAC_DINH,
            so_thung_mau: SO_THUNG_MAU_MAC_DINH,
            ghi_chu: '',
          },
    [initialData, preferredBranchId]
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<GiamSatChatLuongFormValues>({
    // zod coerce: input là chuỗi, output là số.
    resolver: zodResolver(giamSatChatLuongFormSchema) as never,
    defaultValues,
  });

  useEffect(() => {
    if (isDirty) return;
    reset(defaultValues);
  }, [defaultValues, reset, isDirty]);

  const branchOptions = useMemo(
    () =>
      branches
        .filter(
          (b) =>
            (b.trang_thai === TRANG_THAI.DANG_DUNG && (!allowedBranchIds || allowedBranchIds.includes(b.id))) ||
            b.id === initialData?.id_chi_nhanh
        )
        .map((b) => ({ value: b.id, label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` })),
    [branches, allowedBranchIds, initialData?.id_chi_nhanh]
  );

  const hangHoaOptions = useMemo(
    () =>
      hangHoaList
        .filter((h) => h.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG || h.id === initialData?.id_hang_hoa)
        .map((h) => ({
          value: h.id,
          label: h.ma_hang ? `${h.ma_hang} - ${h.ten_hang}` : h.ten_hang,
          subLabel: h.ten_danh_muc || h.don_vi_tinh || undefined,
        })),
    [hangHoaList, initialData?.id_hang_hoa]
  );

  const onSubmit: SubmitHandler<GiamSatChatLuongFormValues> = (values) => {
    if (isEdit && initialData) updateMutation.mutate({ id: initialData.id, data: values });
    else
      createMutation.mutate(values, {
        onSuccess: (item) => {
          onClose();
          onCreated?.(item);
        },
      });
  };

  const pending = isSubmitting || createMutation.isPending || updateMutation.isPending;
  const daKiemMot = (initialData?.so_thung_da_kiem ?? 0) > 0;

  const soField = (name: 'so_thung_cay' | 'so_thung_mau', label: string, quick: number[]) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <Input
            {...field}
            value={field.value ?? ''}
            type="number"
            inputMode="numeric"
            min={1}
            label={label}
            icon={<Boxes size={12} />}
            required
            error={errors[name]?.message}
          />
          <div className="mt-1.5 flex gap-1.5">
            {quick.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setValue(name, n, { shouldDirty: true, shouldValidate: true })}
                className="px-2 py-0.5 rounded-md border border-border text-xs text-muted-foreground hover:bg-muted tabular-nums"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    />
  );

  return (
    <GenericDrawer
      title={t(isEdit ? 'giamSatChatLuong.form.titleEdit' : 'giamSatChatLuong.form.titleCreate')}
      subtitle={isEdit ? initialData?.so_phieu : t('giamSatChatLuong.form.subtitle')}
      icon={<BadgeCheck className="text-primary" size={22} />}
      onClose={onClose}
      isDirty={isDirty}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="giam-sat-chat-luong-form"
          onCancel={onClose}
          isEdit={isEdit}
          isLoading={pending}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id="giam-sat-chat-luong-form" className="space-y-6 pb-4" onSubmit={handleSubmit(onSubmit)}>
        <FormSection title={t('giamSatChatLuong.detail.thongTin')}>
          <FormGrid cols={2}>
            <Controller
              name="id_chi_nhanh"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('giamSatChatLuong.col.farm')}
                  required
                  icon={<Building2 size={16} className="text-muted-foreground" />}
                  options={branchOptions}
                  value={field.value || null}
                  onChange={(v: string | number | null) => field.onChange(v != null ? String(v) : '')}
                  error={errors.id_chi_nhanh?.message}
                />
              )}
            />
            <Controller
              name="ngay"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="date"
                  label={t('giamSatChatLuong.col.ngay')}
                  icon={<Calendar size={12} />}
                  required
                  error={errors.ngay?.message}
                />
              )}
            />
            <div className="sm:col-span-2">
              <Controller
                name="id_hang_hoa"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('giamSatChatLuong.col.thanhPham')}
                    required
                    icon={<Package size={16} className="text-muted-foreground" />}
                    placeholder={t('giamSatChatLuong.form.chonThanhPham')}
                    options={hangHoaOptions}
                    value={field.value || null}
                    onChange={(v: string | number | null) => field.onChange(v != null ? String(v) : '')}
                    error={errors.id_hang_hoa?.message}
                  />
                )}
              />
            </div>
            <Controller
              name="ma_cay_hang"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  label={t('giamSatChatLuong.col.cayHang')}
                  placeholder={t('giamSatChatLuong.form.cayHangPlaceholder')}
                  icon={<Hash size={12} />}
                  autoCapitalize="characters"
                />
              )}
            />
            <div className="hidden sm:block" />
            {soField('so_thung_cay', t('giamSatChatLuong.col.soThungCay'), [60, 30])}
            {soField('so_thung_mau', t('giamSatChatLuong.col.soThungMau'), [10, 5])}
          </FormGrid>
          <p className="text-xs text-muted-foreground mt-2">
            {t(daKiemMot ? 'giamSatChatLuong.form.soThungMauHintDaKiem' : 'giamSatChatLuong.form.soThungMauHint')}
          </p>
          <div className="mt-3">
            <Controller
              name="ghi_chu"
              control={control}
              render={({ field }) => (
                <Textarea label={t('giamSatChatLuong.col.ghiChu')} {...field} value={field.value ?? ''} rows={2} />
              )}
            />
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default GiamSatChatLuongForm;
