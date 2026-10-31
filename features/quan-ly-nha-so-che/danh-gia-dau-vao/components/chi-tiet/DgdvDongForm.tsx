/**
 * Dialog thêm / sửa một dòng «Chi tiết đánh giá»: Lô · Dây (hoặc «Đứt dây») · SL đạt · Đánh giá ·
 * SL huỷ · Lý do huỷ — dòng dây lưu `so_luong` = đạt + huỷ (đứt dây: ô số là số đứt dây). Ngày luôn = ngày của phiếu (1 phiếu = 1 chuyến của một ngày) — không có ô chọn.
 * «Lưu & thêm tiếp» giữ Lô + Dây để nhập liền nhiều dòng; Enter trong ô gõ = Lưu. Nhập cả lô một lần:
 * `DgdvNhapTheoLoDrawer`.
 * Ghi theo kế hoạch ở core/chi-tiet-dong (`useLuuDongDgdv`); lý do gõ mới tự vào danh mục.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ListPlus, Save, Scissors } from 'lucide-react';
import GenericDrawer from '../../../../../components/shared/GenericDrawer';
import FormSection from '../../../../../components/shared/FormSection';
import FormGrid from '../../../../../components/shared/FormGrid';
import Input from '../../../../../components/ui/Input';
import Combobox from '../../../../../components/ui/Combobox';
import Button from '../../../../../components/ui/Button';
import { BTN_CANCEL } from '../../../../../lib/button-labels';
import { formatYmdToDisplay } from '../../../../../lib/utils';
import { DONG_DUT_DAY, dgdvDongFormSchema, type DgdvDongFormValues } from '../../core/schema';
import type { DgdvPhieuDayDu } from '../../core/types';
import { LOAI_LY_DO_DGDV } from '../../core/types';
import { sangSlDat, sangSlTong, type DgdvDongPhang } from '../../core/chi-tiet-dong';
import { nhanCotDay } from '../../core/bang-tinh';
import { tenKhongTrung } from '../../core/chuan-hoa-ten';
import { useLuuDongDgdv } from '../../hooks/use-danh-gia-dau-vao';
import { useLyDoDgdv, useMauDay, useThemLyDoNeuMoi } from '../../hooks/use-danh-muc-dgdv';
import { ChipDay } from '../ChipDay';

interface Props {
  phieu: DgdvPhieuDayDu;
  /** Dòng đang sửa; null = thêm mới. */
  dong: DgdvDongPhang | null;
  onClose: () => void;
  /** Tầng drawer (mặc định 1 — chồng trên Detail phiếu). */
  stackLevel?: number;
}

const DgdvDongForm: React.FC<Props> = ({ phieu, dong, onClose, stackLevel = 1 }) => {
  const { t } = useTranslation();
  const isEdit = !!dong;
  const luu = useLuuDongDgdv();
  const themLyDo = useThemLyDoNeuMoi();
  const { data: dsLyDo = [] } = useLyDoDgdv();
  const { mauTheoId } = useMauDay();
  /** Bấm «Lưu & thêm tiếp» → lưu xong giữ dialog, xoá số. */
  const themTiep = useRef(false);

  const loSapXep = useMemo(() => [...phieu.lo].sort((a, b) => a.stt - b.stt), [phieu.lo]);
  const cotSapXep = useMemo(() => [...phieu.cot].sort((a, b) => a.stt - b.stt), [phieu.cot]);

  const defaultValues = useMemo<DgdvDongFormValues>(
    () =>
      dong
        ? {
            ngay: dong.ngay,
            id_phieu_lo: dong.id_phieu_lo,
            id_cot: dong.id_cot ?? DONG_DUT_DAY,
            so_luong: dong.id_cot ? sangSlDat(dong.so_luong, dong.so_luong_huy) : dong.so_luong,
            danh_gia: dong.danh_gia,
            so_luong_huy: dong.so_luong_huy,
            ly_do_huy: dong.ly_do_huy,
          }
        : {
            ngay: phieu.ngay,
            id_phieu_lo: loSapXep[0]?.id ?? '',
            id_cot: cotSapXep[0]?.id ?? '',
            so_luong: 0,
            danh_gia: null,
            so_luong_huy: 0,
            ly_do_huy: null,
          },
    [dong, phieu.ngay, loSapXep, cotSapXep]
  );

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setFocus,
    formState: { errors, isDirty },
  } = useForm<DgdvDongFormValues>({
    resolver: zodResolver(dgdvDongFormSchema) as Resolver<DgdvDongFormValues>,
    defaultValues,
  });
  const laDutDay = useWatch({ control, name: 'id_cot' }) === DONG_DUT_DAY;
  // Mở dialog là gõ số ngay (chờ hiệu ứng mở drawer xong).
  useEffect(() => {
    const h = setTimeout(() => setFocus('so_luong'), 200);
    return () => clearTimeout(h);
  }, [setFocus]);

  const cotTheoId = useMemo(() => new Map(cotSapXep.map((c) => [c.id, c])), [cotSapXep]);
  const loOptions = loSapXep.map((l) => ({ value: l.id, label: l.ten_lo ?? '—', subLabel: l.to_truong ?? '' }));
  const dayOptions = [
    ...cotSapXep.map((c) => ({ value: c.id, label: nhanCotDay(c, mauTheoId, t('danhGiaDauVao.luoi.xeDoi')) })),
    { value: DONG_DUT_DAY, label: t('danhGiaDauVao.luoi.dutDay') },
  ];
  const goiY = (loai: typeof LOAI_LY_DO_DGDV.DANH_GIA | typeof LOAI_LY_DO_DGDV.LOI) =>
    tenKhongTrung(dsLyDo.filter((x) => x.loai === loai).map((x) => x.ten)).map((ten) => ({ value: ten, label: ten }));

  const onSubmit: SubmitHandler<DgdvDongFormValues> = async (v) => {
    const dutDay = v.id_cot === DONG_DUT_DAY;
    await luu.mutateAsync({
      phieu,
      cu: dong,
      moi: {
        id_phieu_lo: v.id_phieu_lo,
        ngay: phieu.ngay,
        id_cot: dutDay ? null : v.id_cot,
        so_luong: dutDay ? v.so_luong : sangSlTong(v.so_luong, v.so_luong_huy),
        danh_gia: dutDay ? null : v.danh_gia,
        so_luong_huy: dutDay ? 0 : v.so_luong_huy,
        ly_do_huy: dutDay ? null : v.ly_do_huy,
      },
    });
    if (!dutDay) {
      themLyDo(v.danh_gia, LOAI_LY_DO_DGDV.DANH_GIA);
      themLyDo(v.ly_do_huy, LOAI_LY_DO_DGDV.LOI);
    }
    if (themTiep.current && !isEdit) {
      const { ngay, id_phieu_lo, id_cot } = getValues();
      reset({ ngay, id_phieu_lo, id_cot, so_luong: 0, danh_gia: null, so_luong_huy: 0, ly_do_huy: null });
      setTimeout(() => setFocus('so_luong'), 0);
    } else {
      onClose();
    }
  };
  const gui = (tiep: boolean) => {
    themTiep.current = tiep;
    void handleSubmit(onSubmit)().catch(() => undefined);
  };

  return (
    <GenericDrawer
      title={isEdit ? t('danhGiaDauVao.chiTiet.suaTitle') : t('danhGiaDauVao.chiTiet.themTitle')}
      subtitle={`${t('danhGiaDauVao.detail.tieuDeNgay', { ngay: formatYmdToDisplay(phieu.ngay) })} · ${t('danhGiaDauVao.detail.tieuDeChuyen', { chuyen: phieu.chuyen })}`}
      icon={<ListPlus size={18} />}
      onClose={onClose}
      isDirty={isDirty}
      stackLevel={stackLevel}
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={luu.isPending} className="border-border text-muted-foreground">
            {BTN_CANCEL()}
          </Button>
          <div className="flex gap-2">
            {!isEdit && (
              <Button type="button" variant="outline" size="sm" disabled={luu.isPending} onClick={() => gui(true)}>
                <ListPlus className="mr-2 h-4 w-4" />
                {t('danhGiaDauVao.chiTiet.luuThemTiep')}
              </Button>
            )}
            <Button type="button" size="sm" isLoading={luu.isPending} onClick={() => gui(false)} className="bg-primary text-white shadow-lg">
              <Save className="mr-2 h-4 w-4" />
              {t('common.save')}
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="dgdv-dong-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          gui(false);
        }}
        className="space-y-4"
      >
        <FormSection title={t('danhGiaDauVao.chiTiet.sectionVitri')} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="id_phieu_lo"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhGiaDauVao.form.lo')}
                  required
                  options={loOptions}
                  value={field.value}
                  onChange={(v) => field.onChange(v ? String(v) : '')}
                  placeholder={t('danhGiaDauVao.form.chonLo')}
                  dropdownInPortal
                  error={errors.id_phieu_lo?.message as string | undefined}
                />
              )}
            />
            <Controller
              name="id_cot"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhGiaDauVao.chiTiet.colDay')}
                  required
                  options={dayOptions}
                  value={field.value}
                  onChange={(v) => field.onChange(v ? String(v) : '')}
                  placeholder={t('danhGiaDauVao.chiTiet.chonDay')}
                  dropdownInPortal
                  renderOption={(o) => (
                    <ChipDay cot={o.value === DONG_DUT_DAY ? null : (cotTheoId.get(String(o.value)) ?? null)} mauTheoId={mauTheoId} />
                  )}
                  error={errors.id_cot?.message as string | undefined}
                />
              )}
            />
          </FormGrid>
          {laDutDay && (
            <p className="text-caption text-muted-foreground m-0 mt-2 inline-flex items-center gap-1">
              <Scissors size={12} />
              {t('danhGiaDauVao.chiTiet.dutDayHint')}
            </p>
          )}
        </FormSection>

        <FormSection title={t('danhGiaDauVao.chiTiet.sectionSoLieu')} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="so_luong"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label={laDutDay ? t('danhGiaDauVao.luoi.colSoLuong') : t('danhGiaDauVao.nhapLo.colSlDat')}
                  required={laDutDay}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={field.value === 0 ? '' : String(field.value ?? '')}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.so_luong?.message}
                />
              )}
            />
            {!laDutDay && (
              <Controller
                name="danh_gia"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('danhGiaDauVao.luoi.colDanhGia')}
                    options={goiY(LOAI_LY_DO_DGDV.DANH_GIA)}
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v ? String(v).trim() : null)}
                    placeholder={t('danhGiaDauVao.chiTiet.danhGiaPlaceholder')}
                    creatable
                    creatableLabel={t('danhGiaDauVao.form.dungTen')}
                    dropdownInPortal
                  />
                )}
              />
            )}
            {!laDutDay && (
              <Controller
                name="so_luong_huy"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t('danhGiaDauVao.luoi.colSlLoi')}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={field.value === 0 ? '' : String(field.value ?? '')}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={errors.so_luong_huy?.message}
                  />
                )}
              />
            )}
            {!laDutDay && (
              <Controller
                name="ly_do_huy"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('danhGiaDauVao.luoi.colLyDoLoi')}
                    options={goiY(LOAI_LY_DO_DGDV.LOI)}
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v ? String(v).trim() : null)}
                    placeholder={t('danhGiaDauVao.chiTiet.lyDoPlaceholder')}
                    creatable
                    creatableLabel={t('danhGiaDauVao.form.dungTen')}
                    dropdownInPortal
                  />
                )}
              />
            )}
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DgdvDongForm;
