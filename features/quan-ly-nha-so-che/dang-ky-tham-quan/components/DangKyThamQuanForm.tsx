import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFieldArray, useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Calendar, Clock, Copy, ImagePlus, Plus, Trash2, User, Users } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import MultiImageInput from '../../../../components/ui/MultiImageInput';
import { TRANG_THAI } from '../../../../lib/constants';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { cn, getTimezone, getTodayISO } from '../../../../lib/utils';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { toDateTimeLocalValue } from '../../dang-ky-nhan-hang/core/thoi-gian';
import { goiYGiaTri } from '../../dang-ky-nhan-hang/core/goi-y';
import { dangKyThamQuanFormSchema, type DangKyThamQuanFormValues, type KhachFormValues } from '../core/schema';
import { GIOI_TINH, MUC_DICH_THAM_QUAN, PHUONG_TIEN, type DangKyThamQuan } from '../core/types';
import { useGoiYKhach, useLuuDangKyThamQuan } from '../hooks/use-dang-ky-tham-quan';
import { MAX_ANH_PHIEU, imageItemsToUrls, uploadAnhDangKyThamQuan, urlsToImageItems } from '../utils/anh-upload';

interface Props {
  branches: Branch[];
  initialData?: DangKyThamQuan | null;
  preferredBranchId?: string | null;
  onClose: () => void;
}

const KHACH_TRONG: KhachFormValues = {
  ho_ten: '',
  gioi_tinh: '',
  quoc_tich: '',
  so_dien_thoai: '',
  nguoi_gioi_thieu: '',
  khu_vuc_tham_quan: '',
  don_vi_lam_viec: '',
};

function toForm(d: DangKyThamQuan, tz: string): DangKyThamQuanFormValues {
  return {
    id_chi_nhanh: d.id_chi_nhanh,
    ngay_dang_ky: d.ngay_dang_ky,
    bat_dau: toDateTimeLocalValue(d.tg_bat_dau, tz),
    ket_thuc: d.tg_ket_thuc ? toDateTimeLocalValue(d.tg_ket_thuc, tz) : '',
    muc_dich: d.muc_dich,
    muc_dich_khac: d.muc_dich_khac ?? '',
    phuong_tien: d.phuong_tien ?? '',
    nguoi_dai_dien: d.nguoi_dai_dien ?? '',
    id_nguoi_tiep_don: d.id_nguoi_tiep_don ?? '',
    ghi_chu: d.ghi_chu ?? '',
    hinh_anh_urls: d.hinh_anh_urls,
    khach: d.khach.length
      ? d.khach.map((k) => ({
          ho_ten: k.ho_ten,
          gioi_tinh: k.gioi_tinh ?? '',
          quoc_tich: k.quoc_tich ?? '',
          so_dien_thoai: k.so_dien_thoai ?? '',
          nguoi_gioi_thieu: k.nguoi_gioi_thieu ?? '',
          khu_vuc_tham_quan: k.khu_vuc_tham_quan ?? '',
          don_vi_lam_viec: k.don_vi_lam_viec ?? '',
        }))
      : [{ ...KHACH_TRONG }],
  };
}

/** Ô đánh dấu dạng thẻ (mục đích / phương tiện) — giống ô ☐ trên phiếu giấy. */
const OChon: React.FC<{ checked: boolean; label: string; onClick: () => void; kieu: 'checkbox' | 'radio' }> = ({
  checked,
  label,
  onClick,
  kieu,
}) => (
  <button
    type="button"
    role={kieu}
    aria-checked={checked}
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition',
      checked ? 'border-primary bg-primary/[0.06] text-foreground' : 'border-border hover:bg-muted/40 text-muted-foreground'
    )}
  >
    <span
      className={cn(
        'h-4 w-4 shrink-0 border flex items-center justify-center text-[10px] font-bold',
        kieu === 'radio' ? 'rounded-full' : 'rounded',
        checked ? 'border-primary bg-primary text-white' : 'border-muted-foreground/50'
      )}
    >
      {checked ? '✓' : ''}
    </span>
    {label}
  </button>
);

const DangKyThamQuanForm: React.FC<Props> = ({ branches, initialData, preferredBranchId, onClose }) => {
  const { t } = useTranslation();
  const tz = getTimezone();
  const isEdit = !!initialData;
  const mutation = useLuuDangKyThamQuan(onClose);
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: goiY = [] } = useGoiYKhach(true);

  const defaultValues = useMemo<DangKyThamQuanFormValues>(
    () =>
      initialData
        ? toForm(initialData, tz)
        : {
            id_chi_nhanh: preferredBranchId ?? '',
            ngay_dang_ky: getTodayISO(),
            bat_dau: '',
            ket_thuc: '',
            muc_dich: [],
            muc_dich_khac: '',
            phuong_tien: '',
            nguoi_dai_dien: '',
            id_nguoi_tiep_don: '',
            ghi_chu: '',
            hinh_anh_urls: [],
            khach: [{ ...KHACH_TRONG }],
          },
    [initialData, preferredBranchId, tz]
  );

  const {
    control,
    handleSubmit,
    reset,
    register,
    getValues,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DangKyThamQuanFormValues>({
    resolver: zodResolver(dangKyThamQuanFormSchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'khach' });

  useEffect(() => {
    if (isDirty) return;
    reset(defaultValues);
  }, [defaultValues, reset, isDirty]);

  const mucDich = useWatch({ control, name: 'muc_dich' });

  const branchOptions = useMemo(
    () =>
      branches
        .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG || b.id === initialData?.id_chi_nhanh)
        .map((b) => ({ value: b.id, label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` })),
    [branches, initialData?.id_chi_nhanh]
  );
  const nhanVienOptions = useMemo(
    () => employees.map((e) => ({ value: String(e.id), label: e.ho_ten })),
    [employees]
  );
  const goiYTheoCot = useMemo(
    () => ({
      quoc_tich: goiYGiaTri(goiY.map((r) => r.quoc_tich)),
      khu_vuc_tham_quan: goiYGiaTri(goiY.map((r) => r.khu_vuc_tham_quan)),
      don_vi_lam_viec: goiYGiaTri(goiY.map((r) => r.don_vi_lam_viec)),
      nguoi_gioi_thieu: goiYGiaTri(goiY.map((r) => r.nguoi_gioi_thieu)),
    }),
    [goiY]
  );

  const gioiTinhOptions = GIOI_TINH.map((g) => ({ value: g, label: t(`dangKyThamQuan.gioiTinh.${g}`) }));

  /** Đoàn thường cùng quốc tịch / đơn vị / người giới thiệu — chép từ khách liền trên. */
  const chepDongTren = (i: number) => {
    const tren = getValues(`khach.${i - 1}`);
    (['quoc_tich', 'nguoi_gioi_thieu', 'khu_vuc_tham_quan', 'don_vi_lam_viec'] as const).forEach((k) =>
      setValue(`khach.${i}.${k}`, tren[k] ?? '', { shouldDirty: true })
    );
  };

  const themKhach = () => {
    const cuoi = getValues('khach').at(-1);
    append({
      ...KHACH_TRONG,
      quoc_tich: cuoi?.quoc_tich ?? '',
      nguoi_gioi_thieu: cuoi?.nguoi_gioi_thieu ?? '',
      khu_vuc_tham_quan: cuoi?.khu_vuc_tham_quan ?? '',
      don_vi_lam_viec: cuoi?.don_vi_lam_viec ?? '',
    });
  };

  const onSubmit: SubmitHandler<DangKyThamQuanFormValues> = (values) =>
    mutation.mutate({ id: initialData?.id ?? null, data: values });

  const pending = isSubmitting || mutation.isPending;
  const loiKhach = errors.khach?.message ?? errors.khach?.root?.message;

  return (
    <GenericDrawer
      title={t(isEdit ? 'dangKyThamQuan.form.titleEdit' : 'dangKyThamQuan.form.titleCreate')}
      subtitle={t('dangKyThamQuan.form.subtitle')}
      icon={<Users className="text-primary" size={22} />}
      onClose={onClose}
      isDirty={isDirty}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="dang-ky-tham-quan-form"
          onCancel={onClose}
          isEdit={isEdit}
          isLoading={pending}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id="dang-ky-tham-quan-form" className="space-y-6 pb-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Gợi ý giá trị đã dùng cho ô của bảng khách (datalist nhẹ hơn combobox khi nhiều dòng). */}
        {(Object.keys(goiYTheoCot) as (keyof typeof goiYTheoCot)[]).map((k) => (
          <datalist key={k} id={`dktq-goi-y-${k}`}>
            {goiYTheoCot[k].slice(0, 50).map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        ))}

        <FormSection title={t('dangKyThamQuan.form.thongTinChung')}>
          <FormGrid cols={2}>
            <Controller
              name="id_chi_nhanh"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('dangKyThamQuan.col.chiNhanh')}
                  required
                  icon={<Building2 size={16} className="text-muted-foreground" />}
                  options={branchOptions}
                  value={field.value || null}
                  onChange={(v: string | number | null) => field.onChange(v != null ? String(v) : '')}
                  error={errors.id_chi_nhanh?.message}
                />
              )}
            />
            <Input
              {...register('ngay_dang_ky')}
              type="date"
              label={t('dangKyThamQuan.col.ngayDangKy')}
              icon={<Calendar size={12} />}
              required
              error={errors.ngay_dang_ky?.message}
            />
            <Input
              {...register('bat_dau')}
              type="datetime-local"
              label={`${t('dangKyThamQuan.form.thoiGian')} — ${t('dangKyThamQuan.form.tu')}`}
              icon={<Clock size={12} />}
              required
              error={errors.bat_dau?.message}
            />
            <Input
              {...register('ket_thuc')}
              type="datetime-local"
              label={t('dangKyThamQuan.form.den')}
              icon={<Clock size={12} />}
              error={errors.ket_thuc?.message}
            />
            <Input
              {...register('nguoi_dai_dien')}
              label={t('dangKyThamQuan.form.nguoiDaiDien')}
              placeholder={t('dangKyThamQuan.form.nguoiDaiDienHint')}
              icon={<User size={12} />}
            />
            <Controller
              name="id_nguoi_tiep_don"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('dangKyThamQuan.form.nguoiTiepDon')}
                  icon={<User size={16} className="text-muted-foreground" />}
                  options={nhanVienOptions}
                  value={field.value || null}
                  onChange={(v: string | number | null) => field.onChange(v != null ? String(v) : '')}
                />
              )}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={`${t('dangKyThamQuan.khach.title')} (${fields.length})`}>
          <div className="space-y-3">
            {fields.map((f, i) => {
              const loi = errors.khach?.[i];
              return (
                <div key={f.id} className="rounded-xl border border-border bg-muted/20 p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {t('dangKyThamQuan.khach.stt')} {i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() => chepDongTren(i)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-muted"
                          title={t('dangKyThamQuan.khach.chepDongTrenHint')}
                        >
                          <Copy size={12} />
                          <span className="hidden sm:inline">{t('dangKyThamQuan.khach.chepDongTren')}</span>
                        </button>
                      )}
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(i)}
                          className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          aria-label={t('dangKyThamQuan.khach.xoa')}
                          title={t('dangKyThamQuan.khach.xoa')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-2.5">
                    <Input
                      {...register(`khach.${i}.ho_ten`)}
                      label={t('dangKyThamQuan.khach.hoTen')}
                      required
                      error={loi?.ho_ten?.message}
                    />
                    <Select
                      {...register(`khach.${i}.gioi_tinh`)}
                      label={t('dangKyThamQuan.khach.gioiTinh')}
                      options={gioiTinhOptions}
                      placeholder="—"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <Input {...register(`khach.${i}.quoc_tich`)} label={t('dangKyThamQuan.khach.quocTich')} list="dktq-goi-y-quoc_tich" />
                    <Input
                      {...register(`khach.${i}.so_dien_thoai`)}
                      label={t('dangKyThamQuan.khach.sdt')}
                      type="tel"
                      inputMode="tel"
                    />
                    <Input
                      {...register(`khach.${i}.nguoi_gioi_thieu`)}
                      label={t('dangKyThamQuan.khach.nguoiGioiThieu')}
                      list="dktq-goi-y-nguoi_gioi_thieu"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Input
                      {...register(`khach.${i}.khu_vuc_tham_quan`)}
                      label={t('dangKyThamQuan.khach.khuVuc')}
                      list="dktq-goi-y-khu_vuc_tham_quan"
                    />
                    <Input
                      {...register(`khach.${i}.don_vi_lam_viec`)}
                      label={t('dangKyThamQuan.khach.donVi')}
                      list="dktq-goi-y-don_vi_lam_viec"
                    />
                  </div>
                </div>
              );
            })}
            {loiKhach && <p className="text-xs text-destructive">{loiKhach}</p>}
            <button
              type="button"
              onClick={themKhach}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 py-2.5 text-sm font-medium text-primary hover:bg-primary/5"
            >
              <Plus size={16} />
              {t('dangKyThamQuan.khach.them')}
            </button>
          </div>
        </FormSection>

        <FormSection title={t('dangKyThamQuan.form.mucDich')}>
          <Controller
            name="muc_dich"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MUC_DICH_THAM_QUAN.map((m) => {
                  const on = field.value.includes(m);
                  return (
                    <OChon
                      key={m}
                      kieu="checkbox"
                      checked={on}
                      label={t(`dangKyThamQuan.mucDich.${m}`)}
                      onClick={() => field.onChange(on ? field.value.filter((x) => x !== m) : [...field.value, m])}
                    />
                  );
                })}
              </div>
            )}
          />
          {mucDich.includes('khac') && (
            <div className="mt-2.5">
              <Input
                {...register('muc_dich_khac')}
                label={t('dangKyThamQuan.form.mucDichKhac')}
                required
                error={errors.muc_dich_khac?.message}
              />
            </div>
          )}
        </FormSection>

        <FormSection title={t('dangKyThamQuan.form.phuongTien')}>
          <Controller
            name="phuong_tien"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PHUONG_TIEN.map((p) => (
                  <OChon
                    key={p}
                    kieu="radio"
                    checked={field.value === p}
                    label={t(`dangKyThamQuan.phuongTien.${p}`)}
                    onClick={() => field.onChange(field.value === p ? '' : p)}
                  />
                ))}
              </div>
            )}
          />
          <div className="mt-3">
            <Textarea {...register('ghi_chu')} label={t('dangKyThamQuan.col.ghiChu')} rows={2} />
          </div>
        </FormSection>

        <FormSection title={t('dangKyThamQuan.form.anh')}>
          <Controller
            name="hinh_anh_urls"
            control={control}
            render={({ field }) => (
              <MultiImageInput
                icon={<ImagePlus size={12} />}
                value={urlsToImageItems(field.value ?? [])}
                onChange={(items) => field.onChange(imageItemsToUrls(items))}
                uploadFile={uploadAnhDangKyThamQuan}
                maxFiles={MAX_ANH_PHIEU}
                maxSizeMB={8}
                columns={4}
                hint={t('dangKyThamQuan.form.anhHint')}
              />
            )}
          />
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DangKyThamQuanForm;
