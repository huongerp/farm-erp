import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, ImagePlus, LogIn, LogOut } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Button from '../../../../components/ui/Button';
import MultiImageInput from '../../../../components/ui/MultiImageInput';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { formatDateTimeShort, formatYmdToDisplay, getTimezone } from '../../../../lib/utils';
import { checkInOutFormSchema, type CheckInOutFormValues } from '../core/schema';
import type { DangKyNhanHang } from '../core/types';
import {
  formatThoiLuong,
  fromDateTimeLocalValue,
  soPhutTrongFarm,
  soPhutVaoTre,
  toDateTimeLocalValue,
} from '../core/thoi-gian';
import { useChuyenTrangThaiDangKyNhanHang } from '../hooks/use-dang-ky-nhan-hang';
import { MAX_ANH_PHIEU, imageItemsToUrls, uploadAnhDangKyNhanHang, urlsToImageItems } from '../utils/anh-upload';

interface Props {
  mode: 'checkIn' | 'checkOut';
  data: DangKyNhanHang;
  onClose: () => void;
}

/** Check in / check out nhanh: giờ mặc định là bây giờ (sửa được), ảnh + ghi chú tuỳ chọn. */
const CheckInOutDialog: React.FC<Props> = ({ mode, data, onClose }) => {
  const { t } = useTranslation();
  const tz = getTimezone();
  const mutation = useChuyenTrangThaiDangKyNhanHang(onClose);
  const isIn = mode === 'checkIn';

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<CheckInOutFormValues>({
    resolver: zodResolver(checkInOutFormSchema),
    defaultValues: {
      thoi_diem: toDateTimeLocalValue(Date.now(), tz),
      hinh_anh_urls: [],
      ghi_chu: '',
    },
  });

  const thoiDiemIso = fromDateTimeLocalValue(watch('thoi_diem'), tz);
  const preview = useMemo(() => {
    if (!thoiDiemIso) return null;
    if (isIn) {
      const tre = soPhutVaoTre(data.ngay_dang_ky, data.gio_dang_ky_tu, thoiDiemIso, tz);
      if (tre == null) return null;
      return tre > 0
        ? t('dangKyNhanHang.checkInOut.treHon', { tg: formatThoiLuong(tre) })
        : t('dangKyNhanHang.checkInOut.somHon', { tg: formatThoiLuong(-tre) });
    }
    const phut = soPhutTrongFarm(data.tg_vao_thuc_te, thoiDiemIso);
    return phut == null
      ? null
      : t('dangKyNhanHang.checkInOut.oTrongFarm', {
          tg: formatThoiLuong(phut),
        });
  }, [thoiDiemIso, isIn, data, tz, t]);

  const onSubmit: SubmitHandler<CheckInOutFormValues> = (v) => {
    const iso = fromDateTimeLocalValue(v.thoi_diem, tz);
    if (!iso) return;
    mutation.mutate({
      action: mode,
      input: {
        id: data.id,
        thoiDiem: iso,
        hinhAnhUrls: v.hinh_anh_urls,
        ghiChu: v.ghi_chu ?? '',
      },
    });
  };

  const formId = `dknh-${mode}-form`;
  const xe = [data.so_xe, data.so_cont].filter(Boolean).join(' · ') || '—';
  const gioDk =
    data.gio_dang_ky_tu || data.gio_dang_ky_den
      ? `${data.gio_dang_ky_tu ?? '…'} – ${data.gio_dang_ky_den ?? '…'}`
      : '—';

  return (
    <GenericDrawer
      title={t(isIn ? 'dangKyNhanHang.checkInOut.titleIn' : 'dangKyNhanHang.checkInOut.titleOut')}
      subtitle={xe}
      icon={isIn ? <LogIn className="text-primary" size={22} /> : <LogOut className="text-emerald-600" size={22} />}
      onClose={onClose}
      isDirty={isDirty}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.MEDIUM}
      footer={
        <FormDrawerFooter
          formId={formId}
          onCancel={onClose}
          isEdit
          isLoading={mutation.isPending}
          saveLabel={t(isIn ? 'dangKyNhanHang.toolbar.checkIn' : 'dangKyNhanHang.toolbar.checkOut')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id={formId} className="space-y-4 pb-2" onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm grid grid-cols-2 gap-x-3 gap-y-1">
          <span className="text-muted-foreground">{t('dangKyNhanHang.col.ngay')}</span>
          <span className="tabular-nums">{formatYmdToDisplay(data.ngay_dang_ky)}</span>
          <span className="text-muted-foreground">{t('dangKyNhanHang.col.gioDangKy')}</span>
          <span className="tabular-nums">{gioDk}</span>
          {!isIn && (
            <>
              <span className="text-muted-foreground">{t('dangKyNhanHang.col.gioVao')}</span>
              <span className="tabular-nums">
                {data.tg_vao_thuc_te ? formatDateTimeShort(data.tg_vao_thuc_te) : '—'}
              </span>
            </>
          )}
        </div>

        <FormSection title={t(isIn ? 'dangKyNhanHang.checkInOut.gioVao' : 'dangKyNhanHang.checkInOut.gioRa')}>
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <Controller
                name="thoi_diem"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="datetime-local"
                    label={t('dangKyNhanHang.checkInOut.thoiDiem')}
                    icon={<Clock size={12} />}
                    required
                    error={errors.thoi_diem?.message}
                    className="min-w-0"
                  />
                )}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 shrink-0"
              onClick={() =>
                setValue('thoi_diem', toDateTimeLocalValue(Date.now(), tz), {
                  shouldDirty: true,
                })
              }
            >
              {t('dangKyNhanHang.checkInOut.bayGio')}
            </Button>
          </div>
          {preview && <p className="text-xs text-muted-foreground mt-2">{preview}</p>}
        </FormSection>

        <FormSection title={t('dangKyNhanHang.anh.title')}>
          <Controller
            name="hinh_anh_urls"
            control={control}
            render={({ field }) => (
              <MultiImageInput
                icon={<ImagePlus size={12} />}
                value={urlsToImageItems(field.value ?? [])}
                onChange={(items) => field.onChange(imageItemsToUrls(items))}
                uploadFile={uploadAnhDangKyNhanHang}
                maxFiles={Math.max(1, MAX_ANH_PHIEU - data.hinh_anh_urls.length)}
                maxSizeMB={8}
                columns={3}
                hint={t('dangKyNhanHang.anh.hintTuyChon')}
              />
            )}
          />
          <div className="mt-3">
            <Controller
              name="ghi_chu"
              control={control}
              render={({ field }) => (
                <Textarea label={t('dangKyNhanHang.col.ghiChu')} {...field} value={field.value ?? ''} rows={2} />
              )}
            />
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default CheckInOutDialog;
