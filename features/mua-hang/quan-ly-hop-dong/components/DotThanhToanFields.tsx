import React from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import Input from '../../../../components/ui/Input';
import Combobox from '../../../../components/ui/Combobox';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import type { HopDongChiTietLineValues } from '../core/schema';
import { LOAI_DOT, LOAI_DOT_VALUES } from '../core/constants';
import { giaTriHang, goiYThucTra } from '../core/tinh-tien-dot';
import { formatNumberVN } from '../../../../lib/utils';

interface Props {
  /** Đơn giá của HĐ đang chọn (null = chưa chọn / HĐ không có đơn giá) */
  donGia: number | null;
  /** Cọc còn lại của HĐ, đã bỏ qua chính dòng đang sửa */
  cocConLai: number;
}

/**
 * Nhóm ô tiền của một đợt (loại đợt, số cây, giá trị hàng, trừ cọc, thực trả) — dùng chung cho
 * modal trong chi tiết HĐ và drawer tab Thanh toán. Phải nằm trong `<FormProvider>`; trả về
 * fragment để form cha tự xếp lưới.
 */
const DotThanhToanFields: React.FC<Props> = ({ donGia, cocConLai }) => {
  const { t } = useTranslation();
  const {
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<HopDongChiTietLineValues>();

  const loaiDot = useWatch({ control, name: 'loai_dot' });
  const soCay = useWatch({ control, name: 'so_cay_thuc_nhan' });
  const laCoc = loaiDot === LOAI_DOT.COC;
  const giaTri = giaTriHang(soCay, donGia);
  const cocConLaiHienThi = Math.max(0, cocConLai);

  const loaiDotOptions = LOAI_DOT_VALUES.map((v) => ({
    value: v,
    label: v === LOAI_DOT.COC ? t('hopDong.loaiDot.coc') : t('hopDong.loaiDot.thanhToan'),
  }));

  /** Số cây / trừ cọc đổi → tự điền thực trả (vẫn sửa tay được sau đó). */
  const capNhatThucTra = () => {
    const goiY = goiYThucTra(getValues('so_cay_thuc_nhan'), donGia, getValues('tien_tru_coc'));
    if (goiY != null) setValue('so_tien', goiY, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <>
      <Controller
        name="loai_dot"
        control={control}
        render={({ field }) => (
          <Combobox
            label={t('hopDong.form.ctLoaiDot')}
            options={loaiDotOptions}
            value={field.value}
            onChange={(v) => {
              field.onChange(v);
              if (v === LOAI_DOT.COC) {
                setValue('so_cay_thuc_nhan', 0, { shouldDirty: true });
                setValue('tien_tru_coc', 0, { shouldDirty: true });
              }
            }}
            error={errors.loai_dot?.message}
            searchable={false}
            required
          />
        )}
      />
      {!laCoc && (
        <>
          <Controller
            name="so_cay_thuc_nhan"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label={t('hopDong.form.ctSoCay')}
                suffix={t('hopDong.form.suffixCay')}
                required
                value={field.value ?? ''}
                onChange={(v) => {
                  field.onChange(v);
                  capNhatThucTra();
                }}
                error={errors.so_cay_thuc_nhan?.message as string | undefined}
              />
            )}
          />
          <div>
            <Input
              label={t('hopDong.form.ctGiaTriHang')}
              value={giaTri != null ? formatNumberVN(giaTri) : ''}
              placeholder="—"
              readOnly
              tabIndex={-1}
              className="bg-muted/40 tabular-nums"
            />
            <p className="mt-1 ml-1 text-xs text-muted-foreground tabular-nums">
              {donGia != null
                ? t('hopDong.form.ctGiaTriHangHint', { donGia: formatNumberVN(donGia) })
                : t('hopDong.form.ctGiaTriHangChuaCoDonGia')}
            </p>
          </div>
          <Controller
            name="tien_tru_coc"
            control={control}
            render={({ field }) => (
              <div>
                <CurrencyInput
                  label={t('hopDong.form.ctTruCoc')}
                  suffix={t('hopDong.form.suffixDong')}
                  value={field.value ?? ''}
                  onChange={(v) => {
                    field.onChange(v);
                    capNhatThucTra();
                  }}
                  error={errors.tien_tru_coc?.message as string | undefined}
                />
                <div className="flex items-center justify-between gap-2 mt-1 ml-1 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {t('hopDong.form.ctCocConLai', { value: formatNumberVN(cocConLaiHienThi) })}
                  </span>
                  {cocConLaiHienThi > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        field.onChange(cocConLaiHienThi);
                        capNhatThucTra();
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      {t('hopDong.form.ctTruHetCoc')}
                    </button>
                  )}
                </div>
              </div>
            )}
          />
        </>
      )}
      <Controller
        name="so_tien"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            label={laCoc ? t('hopDong.form.ctSoTienCoc') : t('hopDong.form.ctSoTienThucTra')}
            suffix={t('hopDong.form.suffixDong')}
            required
            value={field.value ?? ''}
            onChange={(v) => field.onChange(v)}
            error={errors.so_tien?.message as string | undefined}
          />
        )}
      />
    </>
  );
};

export default DotThanhToanFields;
