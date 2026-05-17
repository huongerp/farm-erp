import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { thanhToanFormSchema, type ThanhToanFormValues } from '../core/schema';
import type { HopDongChiTietEnriched } from '../core/types';
import type { HopDong } from '../core/types';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { TRANG_THAI } from '../../../../lib/constants';
import { getTodayISO } from '../../../../lib/utils';

interface Props {
  open: boolean;
  hopDongList: HopDong[];
  chiNhanhList: Branch[];
  initial?: HopDongChiTietEnriched | null;
  onClose: () => void;
  onSubmit: (values: ThanhToanFormValues) => void;
  isLoading?: boolean;
}

function emptyValues(): ThanhToanFormValues {
  return {
    id_hop_dong: '',
    ngay: getTodayISO(),
    ten_dot: '',
    so_tien: undefined as unknown as number,
    so_cay_thuc_nhan: undefined as unknown as number,
    ghi_chu: '',
    id_chi_nhanh: '',
  };
}

function toFormValues(ct: HopDongChiTietEnriched | null | undefined): ThanhToanFormValues {
  if (!ct) return emptyValues();
  return {
    id_hop_dong: ct.id_hop_dong,
    ngay: ct.ngay ?? '',
    ten_dot: ct.ten_dot ?? '',
    so_tien: ct.so_tien ?? (undefined as unknown as number),
    so_cay_thuc_nhan: ct.so_cay_thuc_nhan ?? (undefined as unknown as number),
    ghi_chu: ct.ghi_chu ?? '',
    id_chi_nhanh: ct.id_chi_nhanh ?? '',
  };
}

const ThanhToanForm: React.FC<Props> = ({
  open,
  hopDongList,
  chiNhanhList,
  initial,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initial?.id;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ThanhToanFormValues>({
    resolver: zodResolver(thanhToanFormSchema) as any,
    defaultValues: emptyValues(),
  });

  useEffect(() => {
    if (open) reset(toFormValues(initial ?? null));
  }, [open, initial, reset]);

  const hopDongOptions = useMemo(
    () =>
      hopDongList.map((h) => ({
        value: h.id,
        label: `${h.ma_hop_dong} — ${h.ten_hop_dong ?? ''}`.trim(),
      })),
    [hopDongList]
  );

  const chiNhanhOptions = chiNhanhList
    .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG)
    .map((b) => ({ value: b.id, label: b.ten_chi_nhanh }));

  if (!open) return null;

  return (
    <GenericDrawer
      title={isEdit ? t('hopDong.chiTiet.editTitle') : t('hopDong.chiTiet.addTitle')}
      icon={<Wallet size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="thanh-toan-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('hopDong.form.save')}
          createLabel={t('hopDong.chiTiet.add')}
        />
      }
    >
      <form
        id="thanh-toan-form"
        onSubmit={handleSubmit((v) => onSubmit(v))}
        className="space-y-5"
      >
        <FormSection title={t('hopDong.thanhToan.detail.hopDongSection')} icon={<Wallet size={14} />} variant="primary">
          <FormGrid cols={1}>
            <Controller
              name="id_hop_dong"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('hopDong.form.maHopDong')}
                  placeholder={t('hopDong.thanhToan.selectHopDongPlaceholder')}
                  options={hopDongOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.id_hop_dong?.message}
                  required
                  disabled={isEdit}
                />
              )}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('hopDong.thanhToan.detail.paymentSection')} icon={<Wallet size={14} />}>
          <FormGrid cols={2}>
            <Input
              label={t('hopDong.form.ctNgay')}
              type="date"
              required
              error={errors.ngay?.message}
              {...register('ngay')}
            />
            <Input
              label={t('hopDong.form.ctTenDot')}
              required
              error={errors.ten_dot?.message}
              {...register('ten_dot')}
            />
            <Controller
              name="so_tien"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label={t('hopDong.form.ctSoTien')}
                  suffix={t('hopDong.form.suffixDong')}
                  required
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v)}
                  error={errors.so_tien?.message as string | undefined}
                />
              )}
            />
            <Controller
              name="so_cay_thuc_nhan"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label={t('hopDong.form.ctSoCay')}
                  suffix={t('hopDong.form.suffixCay')}
                  required
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v)}
                  error={errors.so_cay_thuc_nhan?.message as string | undefined}
                />
              )}
            />
            <div className="sm:col-span-2">
              <Controller
                name="id_chi_nhanh"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('hopDong.form.ctChiNhanh')}
                    placeholder={t('hopDong.form.ctChiNhanhPlaceholder')}
                    options={chiNhanhOptions}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.id_chi_nhanh?.message}
                    required
                  />
                )}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea label={t('hopDong.form.ctGhiChu')} rows={3} {...register('ghi_chu')} />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ThanhToanForm;
