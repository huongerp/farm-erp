/**
 * Drawer con của form phiếu: thêm / sửa MỘT lô — tên lô (chọn lô của chi nhánh hoặc gõ mới; gõ trùng tên có
 * sẵn khác hoa thường → dùng đúng tên + tổ trưởng của lô), tổ trưởng (gõ tay / chọn gợi ý), ghi chú.
 * Chặn trùng lô trong phiếu ngay tại đây. Chỉ ghi vào field array của form cha (không gọi DB).
 */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPinned } from 'lucide-react';
import GenericDrawer from '../../../../../components/shared/GenericDrawer';
import FormSection from '../../../../../components/shared/FormSection';
import FormGrid from '../../../../../components/shared/FormGrid';
import Combobox from '../../../../../components/ui/Combobox';
import Input from '../../../../../components/ui/Input';
import { DRAWER_WIDTH_STACKED } from '../../../../../lib/dialog-sizes';
import { dgdvLoFormSchema, type DgdvLoFormValues } from '../../core/schema';
import type { VarLoThuHoach } from '../../core/types';
import { khoaTen } from '../../core/chuan-hoa-ten';
import FooterLuuTiep from './FooterLuuTiep';
import { focusCombobox } from './CotDayDrawer';

interface Opt {
  value: string;
  label: string;
  subLabel?: string;
}

interface Props {
  /** Lô đang sửa; null = thêm mới. */
  giaTri: DgdvLoFormValues | null;
  loOptions: Opt[];
  /** Lô đang dùng của chi nhánh theo `khoaTen(ten_lo)`. */
  loTheoTen: ReadonlyMap<string, VarLoThuHoach>;
  toTruongOptions: Opt[];
  /** `khoaTen` các lô KHÁC đã có trong phiếu — chặn trùng. */
  tenDaCo: ReadonlySet<string>;
  onLuu: (v: DgdvLoFormValues) => void;
  onClose: () => void;
}

const LO_TRONG: DgdvLoFormValues = { ten_lo: '', to_truong: null, ghi_chu: '' };

const LoDrawer: React.FC<Props> = ({ giaTri, loOptions, loTheoTen, toTruongOptions, tenDaCo, onLuu, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!giaTri;
  const themTiep = useRef(false);
  const oLo = useRef<HTMLDivElement>(null);
  /** Lô vừa thêm bằng «Lưu & thêm tiếp» — cũng tính là đã có. */
  const daThem = useRef(new Set<string>());

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    setError,
    formState: { errors, isDirty },
  } = useForm<DgdvLoFormValues>({
    resolver: zodResolver(dgdvLoFormSchema) as Resolver<DgdvLoFormValues>,
    defaultValues: giaTri ?? LO_TRONG,
  });
  const tenLo = useWatch({ control, name: 'ten_lo' }) ?? '';
  const loMoi = !!tenLo.trim() && !loTheoTen.has(khoaTen(tenLo));

  const focusLo = () => focusCombobox(oLo.current);
  useEffect(() => {
    const h = setTimeout(() => focusCombobox(oLo.current), 200);
    return () => clearTimeout(h);
  }, []);

  const luu = (tiep: boolean) => {
    themTiep.current = tiep;
    void handleSubmit((gt) => {
      const k = khoaTen(gt.ten_lo);
      if (tenDaCo.has(k) || daThem.current.has(k)) {
        setError('ten_lo', { message: t('danhGiaDauVao.validation.loTrung') });
        return;
      }
      onLuu({ ...gt, id: giaTri?.id });
      if (themTiep.current && !isEdit) {
        daThem.current.add(k);
        reset(LO_TRONG);
        setTimeout(focusLo, 0);
      } else {
        onClose();
      }
    })().catch(() => undefined);
  };

  return (
    <GenericDrawer
      title={isEdit ? t('danhGiaDauVao.form.suaLoTitle') : t('danhGiaDauVao.form.themLoTitle')}
      subtitle={t('danhGiaDauVao.form.drawerConHint')}
      icon={<MapPinned size={18} />}
      onClose={onClose}
      isDirty={isDirty}
      stackLevel={1}
      maxWidthClass={DRAWER_WIDTH_STACKED}
      footer={
        <FooterLuuTiep
          onHuy={onClose}
          onLuu={() => luu(false)}
          onLuuTiep={isEdit ? undefined : () => luu(true)}
          nhanTiep={t('danhGiaDauVao.chiTiet.luuThemTiep')}
        />
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          luu(false);
        }}
        className="space-y-4"
      >
        <FormSection title={t('danhGiaDauVao.form.sectionLo')} icon={<MapPinned size={14} />} variant="primary">
          <FormGrid cols={2}>
            <div ref={oLo}>
              <Controller
                name="ten_lo"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('danhGiaDauVao.form.lo')}
                    required
                    options={loOptions}
                    value={field.value ?? ''}
                    onChange={(x) => {
                      const ten = x ? String(x).trim() : '';
                      // Gõ trùng tên lô có sẵn (khác hoa thường) → dùng đúng tên trong danh mục + tổ trưởng của lô.
                      const lo = loTheoTen.get(khoaTen(ten));
                      field.onChange(lo?.ten_lo ?? ten);
                      if (lo && !getValues('to_truong')) setValue('to_truong', lo.to_truong, { shouldDirty: true });
                    }}
                    placeholder={t('danhGiaDauVao.form.chonLo')}
                    creatable
                    creatableLabel={t('danhGiaDauVao.form.taoLo')}
                    dropdownInPortal
                    error={errors.ten_lo?.message as string | undefined}
                  />
                )}
              />
              {!errors.ten_lo && loMoi && <p className="text-caption text-primary m-0 mt-0.5">{t('danhGiaDauVao.form.loMoiSeTao')}</p>}
            </div>
            <Controller
              name="to_truong"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhGiaDauVao.form.toTruong')}
                  options={toTruongOptions}
                  value={field.value ?? ''}
                  onChange={(x) => field.onChange(x ? String(x).trim() : null)}
                  placeholder={t('danhGiaDauVao.form.chonToTruong')}
                  creatable
                  creatableLabel={t('danhGiaDauVao.form.dungTen')}
                  dropdownInPortal
                />
              )}
            />
            <Controller
              name="ghi_chu"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value ?? ''} label={t('danhGiaDauVao.form.ghiChuLo')} className="sm:col-span-2" />
              )}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default LoDrawer;
