/**
 * Drawer con của form phiếu: thêm / sửa MỘT cột dây — tuần thu hoạch farm (chích bắp = −9 tuần, chỉ đọc),
 * màu 1, màu 2 («Không có» = dây 1 màu), xé đôi. Chỉ ghi vào field array của form cha (không gọi DB) —
 * cả phiếu vẫn lưu một lần ở form cha. «Lưu & thêm tiếp» giữ tuần thu hoạch vừa chọn, màu 1 focus sẵn.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Columns3 } from 'lucide-react';
import GenericDrawer from '../../../../../components/shared/GenericDrawer';
import FormSection from '../../../../../components/shared/FormSection';
import FormGrid from '../../../../../components/shared/FormGrid';
import Combobox from '../../../../../components/ui/Combobox';
import { DRAWER_WIDTH_STACKED } from '../../../../../lib/dialog-sizes';
import { dgdvCotFormSchema, type DgdvCotFormValues } from '../../core/schema';
import type { TuanFarm, VarMauDay } from '../../core/types';
import { cacTuanQuanh, docKhoaTuanFarm, khoaTuanFarm, nhanTuanFarm, soSanhTuan, tuanChichBapTuThuHoach } from '../../core/tuan';
import { ChipDay, nhanKemChamMau } from '../ChipDay';
import FooterLuuTiep from './FooterLuuTiep';

/** Combobox tuần thu hoạch: tuần của ngày phiếu − 4 … + 2. */
const TUAN_TH_TRUOC = 4;
const TUAN_TH_SAU = 2;
/** Giá trị option «Không có» của màu 2 (lưu là null). */
const KHONG_MAU_2 = '__khong__';

/** Focus nút mở Combobox trong khung (Combobox không nhận ref). */
export const focusCombobox = (khung: HTMLElement | null) =>
  khung?.querySelector<HTMLButtonElement>('button[role="combobox"]')?.focus();

interface Props {
  /** Dây đang sửa; null = thêm mới (dùng `macDinh`). */
  giaTri: DgdvCotFormValues | null;
  macDinh: DgdvCotFormValues;
  tuanCuaNgay: TuanFarm;
  mauOptions: { value: string; label: string }[];
  mauTheoId: ReadonlyMap<string, VarMauDay>;
  onLuu: (v: DgdvCotFormValues) => void;
  onClose: () => void;
}

const CotDayDrawer: React.FC<Props> = ({ giaTri, macDinh, tuanCuaNgay, mauOptions, mauTheoId, onLuu, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!giaTri;
  const themTiep = useRef(false);
  const oMau1 = useRef<HTMLDivElement>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<DgdvCotFormValues>({
    resolver: zodResolver(dgdvCotFormSchema) as Resolver<DgdvCotFormValues>,
    defaultValues: giaTri ?? macDinh,
  });
  const v = useWatch({ control });

  const focusMau1 = () => focusCombobox(oMau1.current);
  // Mở drawer là chọn màu 1 ngay (chờ hiệu ứng mở drawer xong).
  useEffect(() => {
    const h = setTimeout(() => focusCombobox(oMau1.current), 200);
    return () => clearTimeout(h);
  }, []);

  const th = useMemo<TuanFarm | null>(
    () => (v.th_nam && v.th_tuan ? { nam: Number(v.th_nam), tuan: Number(v.th_tuan) } : null),
    [v.th_nam, v.th_tuan]
  );
  /** Tuần chọn được: tuần của ngày phiếu −4 … +2 (+ tuần đang lưu của dây nếu nằm ngoài dải — không làm mất giá trị). */
  const tuanOptions = useMemo(() => {
    const dai = cacTuanQuanh(tuanCuaNgay, TUAN_TH_TRUOC, TUAN_TH_SAU);
    const ds = th && !dai.some((x) => soSanhTuan(x, th) === 0) ? [...dai, th] : dai;
    return [...ds]
      .sort(soSanhTuan)
      .map((x) => ({ value: khoaTuanFarm(x), label: `${nhanTuanFarm(x)}${x.nam !== tuanCuaNgay.nam ? ` · ${x.nam}` : ''}` }));
  }, [tuanCuaNgay, th]);

  const maMau = (id: string | number) => mauTheoId.get(String(id))?.ma_mau;
  const mau2Options = [{ value: KHONG_MAU_2, label: t('danhGiaDauVao.form.khongCoMau2') }, ...mauOptions];

  const luu = (tiep: boolean) => {
    themTiep.current = tiep;
    void handleSubmit((gt) => {
      onLuu({ ...gt, id: giaTri?.id });
      if (themTiep.current && !isEdit) {
        const { th_nam, th_tuan } = getValues();
        reset({ ...macDinh, th_nam, th_tuan });
        setTimeout(focusMau1, 0);
      } else {
        onClose();
      }
    })().catch(() => undefined);
  };

  const loiTuan = errors.th_tuan?.message ?? errors.th_nam?.message;

  return (
    <GenericDrawer
      title={isEdit ? t('danhGiaDauVao.form.suaDayTitle') : t('danhGiaDauVao.form.themDayTitle')}
      subtitle={t('danhGiaDauVao.form.drawerConHint')}
      icon={<Columns3 size={18} />}
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
        <FormSection title={t('danhGiaDauVao.form.sectionDay')} icon={<Columns3 size={14} />} variant="primary">
          <FormGrid cols={2}>
            <div ref={oMau1}>
              <Controller
                name="id_mau_1"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('danhGiaDauVao.form.mau1')}
                    required
                    options={mauOptions}
                    value={field.value ?? ''}
                    onChange={(x) => field.onChange(x ? String(x) : '')}
                    placeholder={t('danhGiaDauVao.form.chonMau')}
                    dropdownInPortal
                    renderOption={(o) => nhanKemChamMau(o.label, maMau(o.value))}
                    renderValue={(o) => nhanKemChamMau(o.label, maMau(o.value))}
                    error={errors.id_mau_1?.message as string | undefined}
                  />
                )}
              />
            </div>
            <Controller
              name="id_mau_2"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('danhGiaDauVao.form.mau2')}
                  options={mau2Options}
                  value={field.value ?? KHONG_MAU_2}
                  onChange={(x) => field.onChange(x && x !== KHONG_MAU_2 ? String(x) : null)}
                  placeholder={t('danhGiaDauVao.form.khongCoMau2')}
                  dropdownInPortal
                  renderOption={(o) => nhanKemChamMau(o.label, maMau(o.value))}
                  renderValue={(o) => nhanKemChamMau(o.label, maMau(o.value))}
                  error={errors.id_mau_2?.message as string | undefined}
                />
              )}
            />
            <Combobox
              label={t('danhGiaDauVao.form.tuanThuHoach')}
              required
              options={tuanOptions}
              value={th ? khoaTuanFarm(th) : ''}
              onChange={(x) => {
                const tf = docKhoaTuanFarm(String(x ?? ''));
                if (!tf) return;
                setValue('th_nam', tf.nam, { shouldDirty: true, shouldValidate: !!loiTuan });
                setValue('th_tuan', tf.tuan, { shouldDirty: true, shouldValidate: !!loiTuan });
              }}
              placeholder={t('danhGiaDauVao.validation.tuanThuHoachRequired')}
              dropdownInPortal
              dropdownAutoHeight
              error={loiTuan}
            />
            <div className="flex flex-col justify-end gap-1 pb-1">
              <span className="text-caption text-muted-foreground tabular-nums">
                {th ? t('danhGiaDauVao.form.chichBapLa', { tuan: nhanTuanFarm(tuanChichBapTuThuHoach(th)) }) : '—'}
              </span>
              <Controller
                name="xe_doi"
                control={control}
                render={({ field }) => (
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    {t('danhGiaDauVao.form.xeDoi')}
                  </label>
                )}
              />
            </div>
          </FormGrid>
          <div className="mt-3 flex items-center gap-2 text-caption text-muted-foreground">
            {t('danhGiaDauVao.form.xemTruoc')}:
            <ChipDay
              cot={v.id_mau_1 ? { id_mau_1: v.id_mau_1, id_mau_2: v.id_mau_2 ?? null, xe_doi: !!v.xe_doi } : { id_mau_1: '', id_mau_2: null, xe_doi: false }}
              mauTheoId={mauTheoId}
            />
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default CotDayDrawer;
