import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Beaker, Building2, Calendar, User } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import { TRANG_THAI } from '../../../../lib/constants';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { cn, getTodayISO } from '../../../../lib/utils';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { KHUNG_GIO_PHA } from '../core/constants';
import { dinhMucTheoLan, tinhChenhLech, tinhDinhMucPhen } from '../core/dinh-muc';
import { nhatKyFormSchema, type NhatKyFormValues } from '../core/schema';
import { parseSo, soSangChuoi } from '../core/so';
import type { NhatKyPhaPhen } from '../core/types';
import { useHoDangDungTheoChiNhanh, useLuuNhatKyPhaPhen } from '../hooks/use-nhat-ky-pha-phen';
import { formatChenhLech, formatKg } from '../utils/hien-thi';

interface Props {
  branches: Branch[];
  /** Phạm vi xem: người thường chỉ chọn được NSC được phân. */
  viewAll: boolean;
  allowedBranchIds: string[];
  initialData?: NhatKyPhaPhen | null;
  onClose: () => void;
}

/** Năm dòng lần pha: giữ số đã lưu (sửa phiếu) hoặc để trống (tạo mới, chờ điền định mức). */
function dongLanTuPhieu(d: NhatKyPhaPhen | null | undefined): NhatKyFormValues['lan'] {
  return KHUNG_GIO_PHA.map((gio, i) => {
    const l = d?.lan.find((x) => x.lan === i + 1);
    return { lan: i + 1, gio: l?.gio ?? gio, so_kg: soSangChuoi(l?.so_kg), dinh_muc_kg: l?.dinh_muc_kg ?? null };
  });
}

const NhatKyPhaPhenForm: React.FC<Props> = ({ branches, viewAll, allowedBranchIds, initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const mutation = useLuuNhatKyPhaPhen(onClose);
  const { data: employees = [] } = useEmployeesRefQuery();

  const branchOptions = useMemo(() => {
    const allowed = new Set(allowedBranchIds);
    return branches
      .filter((b) => (b.trang_thai === TRANG_THAI.DANG_DUNG || b.id === initialData?.id_chi_nhanh) && (viewAll || allowed.has(b.id)))
      .map((b) => ({ value: b.id, label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` }));
  }, [branches, viewAll, allowedBranchIds, initialData?.id_chi_nhanh]);

  const defaultValues = useMemo<NhatKyFormValues>(
    () => ({
      id_chi_nhanh: initialData?.id_chi_nhanh ?? (branchOptions.length === 1 ? branchOptions[0].value : ''),
      ngay: initialData?.ngay ?? getTodayISO(),
      so_buong_du_thu: soSangChuoi(initialData?.so_buong_du_thu),
      so_be_so_che: soSangChuoi(initialData?.so_be_so_che),
      id_nhan_vien_phu_trach: initialData?.id_nhan_vien_phu_trach ?? '',
      ghi_chu: initialData?.ghi_chu ?? '',
      lan: dongLanTuPhieu(initialData),
    }),
    [initialData, branchOptions]
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

  useEffect(() => {
    if (isDirty) return;
    reset(defaultValues);
  }, [defaultValues, reset, isDirty]);

  const idChiNhanh = useWatch({ control, name: 'id_chi_nhanh' });
  const lan = useWatch({ control, name: 'lan' });
  const { data: hoList, isFetching: dangTaiHo } = useHoDangDungTheoChiNhanh(idChiNhanh);

  /**
   * Điền sẵn số kg = định mức khi tạo mới / đổi NSC. Sửa phiếu cũ giữ số đã lưu (NSC ban đầu coi như đã điền).
   * Chỉ điền một lần cho mỗi NSC để lần tải lại hồ không đè số người dùng đang sửa.
   */
  const daDienCho = useRef<string | null>(initialData?.id_chi_nhanh ?? null);
  useEffect(() => {
    if (!idChiNhanh || !hoList || dangTaiHo) return;
    if (daDienCho.current === idChiNhanh) return;
    daDienCho.current = idChiNhanh;
    const dm = dinhMucTheoLan(tinhDinhMucPhen(hoList));
    const coHo = hoList.length > 0;
    dm.forEach((v, i) => {
      setValue(`lan.${i}.dinh_muc_kg`, v, { shouldDirty: true });
      setValue(`lan.${i}.so_kg`, coHo ? soSangChuoi(v) : '', { shouldDirty: true });
    });
  }, [idChiNhanh, hoList, dangTaiHo, setValue]);

  const tong = useMemo(() => {
    const thucTe = Math.round((lan ?? []).reduce((s, l) => s + (parseSo(l.so_kg) ?? 0), 0) * 1000) / 1000;
    const dinhMuc = Math.round((lan ?? []).reduce((s, l) => s + (l.dinh_muc_kg ?? 0), 0) * 1000) / 1000;
    return { thucTe, dinhMuc, chenhLech: tinhChenhLech(thucTe, dinhMuc) };
  }, [lan]);

  const nhanVienOptions = useMemo(() => employees.map((e) => ({ value: String(e.id), label: e.ho_ten })), [employees]);

  const onSubmit: SubmitHandler<NhatKyFormValues> = (values) => mutation.mutate({ id: initialData?.id ?? null, data: values });
  const pending = isSubmitting || mutation.isPending;
  const chuaCoHo = !!idChiNhanh && !dangTaiHo && !!hoList && hoList.length === 0;

  return (
    <GenericDrawer
      title={t(isEdit ? 'nkpp.form.titleEdit' : 'nkpp.form.titleCreate')}
      subtitle={t('nkpp.form.subtitle')}
      icon={<Beaker className="text-primary" size={22} />}
      onClose={onClose}
      isDirty={isDirty}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="nhat-ky-pha-phen-form"
          onCancel={onClose}
          isEdit={isEdit}
          isLoading={pending}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id="nhat-ky-pha-phen-form" className="space-y-6 pb-4" onSubmit={handleSubmit(onSubmit)}>
        <FormSection title={t('nkpp.form.thongTinChung')}>
          <FormGrid cols={2}>
            <Controller
              name="id_chi_nhanh"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('nkpp.col.chiNhanh')}
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
              label={t('nkpp.col.ngay')}
              icon={<Calendar size={12} />}
              required
              error={errors.ngay?.message}
            />
            <Input
              {...register('so_buong_du_thu')}
              inputMode="numeric"
              label={t('nkpp.col.soBuongDuThu')}
              error={errors.so_buong_du_thu?.message}
            />
            <Input
              {...register('so_be_so_che')}
              inputMode="numeric"
              label={t('nkpp.col.soBeSoChe')}
              error={errors.so_be_so_che?.message}
            />
            <Controller
              name="id_nhan_vien_phu_trach"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('nkpp.col.nhanSu')}
                  icon={<User size={16} className="text-muted-foreground" />}
                  options={nhanVienOptions}
                  value={field.value || null}
                  onChange={(v: string | number | null) => field.onChange(v != null ? String(v) : '')}
                />
              )}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('nkpp.form.cacLanPha')}>
          {chuaCoHo && <p className="text-xs text-amber-600 dark:text-amber-400 m-0 mb-3">{t('nkpp.form.chuaCoHo')}</p>}
          <div className="space-y-2">
            {(lan ?? []).map((l, i) => (
              <div key={l.lan} className="grid grid-cols-[5.5rem_1fr] sm:grid-cols-[7rem_1fr_9rem] items-start gap-x-3 gap-y-1">
                <div className="pt-2 text-sm font-medium">
                  {t(`nkpp.col.lan${l.lan}`)}
                </div>
                <Input
                  {...register(`lan.${i}.so_kg`)}
                  inputMode="decimal"
                  placeholder={t('nkpp.form.soKg')}
                  error={errors.lan?.[i]?.so_kg?.message}
                />
                <div className="col-span-2 sm:col-span-1 sm:pt-2 text-xs text-muted-foreground tabular-nums">
                  {t('nkpp.col.dinhMuc')}: {formatKg(l.dinh_muc_kg)} kg
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-border bg-muted/20 p-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">{t('nkpp.col.tongPhen')}</div>
              <div className="font-semibold tabular-nums">{formatKg(tong.thucTe)} kg</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t('nkpp.col.dinhMuc')}</div>
              <div className="font-semibold tabular-nums">{formatKg(tong.dinhMuc)} kg</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t('nkpp.col.chenhLech')}</div>
              <div
                className={cn(
                  'font-semibold tabular-nums',
                  tong.chenhLech > 0 ? 'text-rose-600 dark:text-rose-400' : tong.chenhLech < 0 ? 'text-emerald-600 dark:text-emerald-400' : ''
                )}
              >
                {formatChenhLech(tong.chenhLech)} kg
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title={t('nkpp.col.ghiChu')}>
          <Textarea {...register('ghi_chu')} rows={2} />
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default NhatKyPhaPhenForm;
