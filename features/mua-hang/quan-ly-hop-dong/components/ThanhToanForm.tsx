import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { thanhToanFormSchema, type ThanhToanFormValues } from '../core/schema';
import type { HopDongChiTietEnriched } from '../core/types';
import type { HopDong } from '../core/types';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { LOAI_DOT } from '../core/constants';
import { goiYThucTra, tongHopCoc, truCocVuotConLai } from '../core/tinh-tien-dot';
import { TRANG_THAI } from '../../../../lib/constants';
import { getTodayISO } from '../../../../lib/utils';
import DotThanhToanFields from './DotThanhToanFields';

interface Props {
  open: boolean;
  hopDongList: HopDong[];
  chiNhanhList: Branch[];
  /** Mọi dòng thanh toán (dữ liệu tab) — lọc theo HĐ đang chọn để tính cọc còn lại */
  chiTietAll: HopDongChiTietEnriched[];
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
    loai_dot: LOAI_DOT.THANH_TOAN,
    so_tien: undefined as unknown as number,
    so_cay_thuc_nhan: undefined as unknown as number,
    tien_tru_coc: 0,
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
    loai_dot: ct.loai_dot,
    so_tien: ct.so_tien ?? (undefined as unknown as number),
    so_cay_thuc_nhan: ct.so_cay_thuc_nhan ?? (undefined as unknown as number),
    tien_tru_coc: ct.tien_tru_coc ?? 0,
    ghi_chu: ct.ghi_chu ?? '',
    id_chi_nhanh: ct.id_chi_nhanh ?? '',
  };
}

const ThanhToanForm: React.FC<Props> = ({
  open,
  hopDongList,
  chiNhanhList,
  chiTietAll,
  initial,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initial?.id;

  const form = useForm<ThanhToanFormValues>({
    resolver: zodResolver(thanhToanFormSchema),
    defaultValues: emptyValues(),
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => {
    if (open) reset(toFormValues(initial ?? null));
  }, [open, initial, reset]);

  const idHopDong = useWatch({ control, name: 'id_hop_dong' });
  const donGiaCua = (id: string) => hopDongList.find((h) => h.id === id)?.don_gia ?? null;
  const dongCuaHd = (id: string) => chiTietAll.filter((c) => c.id_hop_dong === id);
  const donGia = donGiaCua(idHopDong);
  const { cocConLai } = useMemo(
    () => tongHopCoc(chiTietAll.filter((c) => c.id_hop_dong === idHopDong), initial?.id),
    [chiTietAll, idHopDong, initial?.id]
  );

  /** Chọn HĐ (thêm mới): HĐ chưa có đợt → Cọc, ngược lại Thanh toán; tính lại thực trả theo đơn giá mới. */
  const onChonHopDong = (id: string) => {
    if (dongCuaHd(id).length === 0) {
      setValue('loai_dot', LOAI_DOT.COC);
      setValue('so_cay_thuc_nhan', 0);
      setValue('tien_tru_coc', 0);
      return;
    }
    setValue('loai_dot', LOAI_DOT.THANH_TOAN);
    const goiY = goiYThucTra(getValues('so_cay_thuc_nhan'), donGiaCua(id), getValues('tien_tru_coc'));
    if (goiY != null) setValue('so_tien', goiY);
  };

  const submit = (v: ThanhToanFormValues) => {
    if (truCocVuotConLai(v.loai_dot, v.tien_tru_coc, cocConLai)) {
      setError('tien_tru_coc', { message: t('hopDong.validation.ctTruCocVuot') });
      return;
    }
    onSubmit(v);
  };

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
      isDirty={isDirty}
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
      <FormProvider {...form}>
      <form
        id="thanh-toan-form"
        onSubmit={handleSubmit(submit)}
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
                  onChange={(v) => {
                    field.onChange(v);
                    if (!isEdit && v) onChonHopDong(String(v));
                  }}
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
            <DotThanhToanFields donGia={donGia} cocConLai={cocConLai} />
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
      </FormProvider>
    </GenericDrawer>
  );
};

export default ThanhToanForm;
