import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFieldArray, useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Calendar, Clock, Droplets, Plus, Trash2, User } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import { TRANG_THAI } from '../../../../lib/constants';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { getTodayISO } from '../../../../lib/utils';
import { useAuthStore } from '../../../../store/useStore';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { locHangHoaChoChon } from '../../hang-hoa-phan-thuoc/core/trang-thai';
import { DON_VI_NONG_DO, DON_VI_NONG_DO_MAC_DINH, donViLuongThuoc } from '../core/constants';
import { tinhLuongThuoc } from '../core/luong-thuoc';
import { nhatKyFormSchema, type LanFormValues, type NhatKyFormValues } from '../core/schema';
import { formatSo, parseSo } from '../core/so';
import type { NhatKyPhunCui } from '../core/types';
import { useDinhMucThuoc, useHangHoaThuoc, useLuuNhatKyPhunCui } from '../hooks/use-nhat-ky-phun-cui';

interface Props {
  /** Chi nhánh đã lọc theo phạm vi của người dùng. */
  branches: Branch[];
  initialData?: NhatKyPhunCui | null;
  onClose: () => void;
}

const LAN_TRONG: LanFormValues = {
  gio: '',
  id_hang_hoa: '',
  nong_do: '',
  don_vi: DON_VI_NONG_DO_MAC_DINH,
  luong_nuoc_lit: '',
  ghi_chu: '',
};

function toForm(d: NhatKyPhunCui): NhatKyFormValues {
  return {
    id_chi_nhanh: d.id_chi_nhanh,
    ngay: d.ngay,
    id_nhan_vien_phu_trach: d.id_nhan_vien_phu_trach ?? '',
    ghi_chu: d.ghi_chu ?? '',
    lan: d.lan.length
      ? d.lan.map((l) => ({
          gio: l.gio ?? '',
          id_hang_hoa: l.id_hang_hoa,
          nong_do: l.nong_do != null ? String(l.nong_do) : '',
          don_vi: l.don_vi,
          luong_nuoc_lit: l.luong_nuoc_lit != null ? String(l.luong_nuoc_lit) : '',
          ghi_chu: l.ghi_chu ?? '',
        }))
      : [{ ...LAN_TRONG }],
  };
}

const NhatKyPhunCuiForm: React.FC<Props> = ({ branches, initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const mutation = useLuuNhatKyPhunCui(onClose);
  const userId = useAuthStore((s) => s.user?.id);
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: hangHoa = [] } = useHangHoaThuoc();

  const branchOptions = useMemo(
    () =>
      branches
        .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG || b.id === initialData?.id_chi_nhanh)
        .map((b) => ({ value: b.id, label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` })),
    [branches, initialData?.id_chi_nhanh]
  );
  const nhanVienOptions = useMemo(() => employees.map((e) => ({ value: String(e.id), label: e.ho_ten })), [employees]);

  const defaultValues = useMemo<NhatKyFormValues>(
    () =>
      initialData
        ? toForm(initialData)
        : {
            id_chi_nhanh: branchOptions.length === 1 ? branchOptions[0].value : '',
            ngay: getTodayISO(),
            id_nhan_vien_phu_trach: userId != null ? String(userId) : '',
            ghi_chu: '',
            lan: [{ ...LAN_TRONG }],
          },
    [initialData, branchOptions, userId]
  );

  const {
    control,
    handleSubmit,
    reset,
    register,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NhatKyFormValues>({
    resolver: zodResolver(nhatKyFormSchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lan' });

  useEffect(() => {
    if (isDirty) return;
    reset(defaultValues);
  }, [defaultValues, reset, isDirty]);

  const idChiNhanh = useWatch({ control, name: 'id_chi_nhanh' });
  const lanWatch = useWatch({ control, name: 'lan' });

  // Định mức của NSC đang chọn: chọn thuốc → điền sẵn nồng độ / đơn vị (chỉ định mức đang dùng).
  const { data: dinhMuc = [] } = useDinhMucThuoc(idChiNhanh || null, true, [], !!idChiNhanh);
  const dinhMucTheoThuoc = useMemo(
    () => new Map(dinhMuc.filter((d) => d.dang_dung).map((d) => [d.id_hang_hoa, d])),
    [dinhMuc]
  );

  const thuocOptions = useMemo(
    () =>
      locHangHoaChoChon(hangHoa, initialData?.lan.map((l) => l.id_hang_hoa) ?? []).map((h) => ({
        value: h.id,
        label: h.ten_hang_hoa,
        subLabel: [h.ma_hang_hoa, h.dvt].filter(Boolean).join(' · '),
      })),
    [hangHoa, initialData]
  );

  const donViOptions = DON_VI_NONG_DO.map((d) => ({ value: d, label: d }));

  const chonThuoc = (i: number, idHangHoa: string) => {
    const dm = dinhMucTheoThuoc.get(idHangHoa);
    if (!dm) return;
    setValue(`lan.${i}.nong_do`, String(dm.nong_do), { shouldDirty: true });
    setValue(`lan.${i}.don_vi`, dm.don_vi, { shouldDirty: true });
  };

  const onSubmit: SubmitHandler<NhatKyFormValues> = (values) => mutation.mutate({ id: initialData?.id ?? null, data: values });

  const pending = isSubmitting || mutation.isPending;
  const loiLan = errors.lan?.message ?? errors.lan?.root?.message;

  return (
    <GenericDrawer
      title={t(isEdit ? 'nkpc.form.titleEdit' : 'nkpc.form.titleCreate')}
      subtitle={t('nkpc.form.subtitle')}
      icon={<Droplets className="text-primary" size={22} />}
      onClose={onClose}
      isDirty={isDirty}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="nhat-ky-phun-cui-form"
          onCancel={onClose}
          isEdit={isEdit}
          isLoading={pending}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id="nhat-ky-phun-cui-form" className="space-y-6 pb-4" onSubmit={handleSubmit(onSubmit)}>
        <FormSection title={t('nkpc.form.thongTinChung')}>
          <FormGrid cols={2}>
            <Controller
              name="id_chi_nhanh"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('nkpc.col.chiNhanh')}
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
              {...register('ngay')}
              type="date"
              label={t('nkpc.col.ngay')}
              icon={<Calendar size={12} />}
              required
              error={errors.ngay?.message}
            />
            <Controller
              name="id_nhan_vien_phu_trach"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('nkpc.col.nhanSu')}
                  icon={<User size={16} className="text-muted-foreground" />}
                  options={nhanVienOptions}
                  value={field.value || null}
                  onChange={(v: string | number | null) => field.onChange(v != null ? String(v) : '')}
                />
              )}
            />
          </FormGrid>
          <div className="mt-3">
            <Textarea {...register('ghi_chu')} label={t('nkpc.col.ghiChu')} rows={2} error={errors.ghi_chu?.message} />
          </div>
        </FormSection>

        <FormSection title={`${t('nkpc.lan.title')} (${fields.length})`}>
          <div className="space-y-3">
            {fields.map((f, i) => {
              const loi = errors.lan?.[i];
              const l = lanWatch?.[i];
              const luongThuoc = tinhLuongThuoc(parseSo(l?.nong_do), parseSo(l?.luong_nuoc_lit));
              return (
                <div key={f.id} className="rounded-xl border border-border bg-muted/20 p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {t('nkpc.lan.lanThu', { so: i + 1 })}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        aria-label={t('nkpc.lan.xoa')}
                        title={t('nkpc.lan.xoa')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-2.5">
                    <Controller
                      name={`lan.${i}.id_hang_hoa`}
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          label={t('nkpc.lan.thuoc')}
                          required
                          options={thuocOptions}
                          value={field.value || null}
                          dropdownInPortal
                          onChange={(v: string | number | null) => {
                            const id = v != null ? String(v) : '';
                            field.onChange(id);
                            if (id) chonThuoc(i, id);
                          }}
                          error={loi?.id_hang_hoa?.message}
                        />
                      )}
                    />
                    <Input {...register(`lan.${i}.gio`)} type="time" label={t('nkpc.lan.gio')} icon={<Clock size={12} />} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <Input
                      {...register(`lan.${i}.nong_do`)}
                      label={t('nkpc.lan.nongDo')}
                      inputMode="decimal"
                      error={loi?.nong_do?.message}
                    />
                    <Select {...register(`lan.${i}.don_vi`)} label={t('nkpc.lan.donVi')} options={donViOptions} />
                    <Input
                      {...register(`lan.${i}.luong_nuoc_lit`)}
                      label={t('nkpc.lan.luongNuoc')}
                      inputMode="decimal"
                      error={loi?.luong_nuoc_lit?.message}
                    />
                    <Input
                      label={t('nkpc.lan.luongThuoc', { dv: donViLuongThuoc(l?.don_vi) })}
                      value={formatSo(luongThuoc)}
                      readOnly
                      tabIndex={-1}
                    />
                  </div>
                  <Input {...register(`lan.${i}.ghi_chu`)} label={t('nkpc.lan.ghiChu')} error={loi?.ghi_chu?.message} />
                </div>
              );
            })}
            {loiLan && <p className="text-xs text-destructive">{loiLan}</p>}
            <button
              type="button"
              onClick={() => append({ ...LAN_TRONG })}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 py-2.5 text-sm font-medium text-primary hover:bg-primary/5"
            >
              <Plus size={16} />
              {t('nkpc.lan.them')}
            </button>
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default NhatKyPhunCuiForm;
