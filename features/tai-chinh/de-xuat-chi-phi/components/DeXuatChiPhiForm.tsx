import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Calendar, Wallet, User, Tag, List, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import { deXuatChiPhiSchema, type DeXuatChiPhiFormValues } from '../core/schema';
import type { DeXuatChiPhi } from '../core/types';
import { useCreateDeXuatChiPhi, useUpdateDeXuatChiPhi } from '../hooks/use-de-xuat-chi-phi';
import { useDanhMucTaiChinh } from '../../danh-muc-tai-chinh/hooks/use-danh-muc-tai-chinh';
import { useTaiKhoan } from '../../tai-khoan/hooks/use-tai-khoan';
import { useEmployees } from '../../../he-thong/nhan-vien/hooks/use-nhan-vien';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';

interface Props {
  initialData?: DeXuatChiPhi | null;
  onClose: () => void;
  /** Khi thêm mới từ tab Thu/Chi, mặc định chọn loại theo tab */
  defaultLoai?: 'thu' | 'chi';
}

const DeXuatChiPhiForm: React.FC<Props> = ({ initialData, onClose, defaultLoai }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateDeXuatChiPhi(onClose);
  const updateMutation = useUpdateDeXuatChiPhi(onClose);

  const { data: allDanhMuc = [] } = useDanhMucTaiChinh();
  const { data: taiKhoanList = [] } = useTaiKhoan();
  const { data: employees = [] } = useEmployees();

  const taiKhoanOptions = useMemo(
    () => [
      { value: '', label: t('deXuatChiPhi.form.taiKhoanPlaceholder') },
      ...taiKhoanList
        .filter((tk) => tk.trang_thai === 1)
        .map((tk) => ({ value: tk.id, label: `${tk.ten_tai_khoan}${tk.so_tai_khoan ? ` (${tk.so_tai_khoan})` : ''}` })),
    ],
    [taiKhoanList, t]
  );

  const requesterOptions = useMemo(
    () => [
      { value: '', label: t('deXuatChiPhi.form.requesterPlaceholder') },
      ...employees.map((e) => ({ value: e.id, label: `${e.ma_nhan_vien ?? ''} - ${e.ho_ten}` })),
    ],
    [employees, t]
  );

  const defaultValues: Partial<DeXuatChiPhiFormValues> = {
    so_phieu: '',
    ngay: new Date().toISOString().slice(0, 10),
    loai: 'chi',
    id_tai_khoan: null,
    id_nguoi_de_xuat: '',
    trang_thai: 0,
    ghi_chu: null,
    chi_tiet: [],
  };

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<DeXuatChiPhiFormValues>({
    resolver: zodResolver(deXuatChiPhiSchema) as any,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'chi_tiet' });
  const selectedLoai = watch('loai');

  const danhMucOptionsByLoai = useMemo(() => {
    const list = allDanhMuc.filter((d) => d.loai === selectedLoai && d.trang_thai === 1);
    return list
      .sort((a, b) => {
        const orderA = a.thu_tu ?? 0;
        const orderB = b.thu_tu ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return (a.ten_danh_muc ?? '').localeCompare(b.ten_danh_muc ?? '');
      })
      .map((d) => ({
        value: d.id,
        label: d.id_cha ? `  ${d.ma_danh_muc} - ${d.ten_danh_muc}` : `${d.ma_danh_muc} - ${d.ten_danh_muc}`,
      }));
  }, [allDanhMuc, selectedLoai]);

  useEffect(() => {
    if (initialData) {
      reset({
        so_phieu: initialData.so_phieu,
        ngay: initialData.ngay,
        loai: initialData.loai,
        id_tai_khoan: initialData.id_tai_khoan ?? null,
        id_nguoi_de_xuat: initialData.id_nguoi_de_xuat,
        trang_thai: initialData.trang_thai,
        ghi_chu: initialData.ghi_chu ?? null,
        chi_tiet: (initialData.chi_tiet ?? []).map((ct) => ({
          id_danh_muc: ct.id_danh_muc,
          so_tien: ct.so_tien,
          noi_dung: ct.noi_dung ?? '',
        })),
      });
    } else {
      reset({
        ...defaultValues,
        loai: defaultLoai ?? 'chi',
        ngay: new Date().toISOString().slice(0, 10),
      });
    }
  }, [initialData, defaultLoai, reset]);

  const onSubmit: SubmitHandler<DeXuatChiPhiFormValues> = (data) => {
    const validChiTiet = (data.chi_tiet ?? []).filter((r) => r.id_danh_muc && Number(r.so_tien) > 0);
    const sanitized: DeXuatChiPhiFormValues = {
      ...data,
      id_tai_khoan: data.id_tai_khoan && data.id_tai_khoan.trim() ? data.id_tai_khoan : null,
      ghi_chu: data.ghi_chu?.trim() || null,
      chi_tiet: validChiTiet.map((c) => ({
        id_danh_muc: c.id_danh_muc,
        so_tien: Number(c.so_tien),
        noi_dung: c.noi_dung?.trim() || undefined,
      })),
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitized });
    } else {
      createMutation.mutate(sanitized);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('deXuatChiPhi.form.editTitle') : t('deXuatChiPhi.form.createTitle')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="de-xuat-chi-phi-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('deXuatChiPhi.form.save')}
          createLabel={t('deXuatChiPhi.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="de-xuat-chi-phi-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <FormSection title={t('deXuatChiPhi.form.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('deXuatChiPhi.form.code')}
              placeholder={t('deXuatChiPhi.form.codePlaceholder')}
              icon={<FileText size={12} />}
              required
              {...register('so_phieu')}
              error={errors.so_phieu?.message}
            />
            <Input
              label={t('deXuatChiPhi.form.date')}
              type="date"
              icon={<Calendar size={12} />}
              required
              {...register('ngay')}
              error={errors.ngay?.message}
            />
            <Controller
              name="loai"
              control={control}
              render={({ field }) => (
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                    <Tag size={12} className="text-muted-foreground" />
                    {t('deXuatChiPhi.form.loai')}
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="thu"
                        checked={field.value === 'thu'}
                        onChange={() => field.onChange('thu')}
                        className="rounded border-border text-primary accent-primary"
                      />
                      <span className="text-sm">{t('deXuatChiPhi.loaiThu')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="chi"
                        checked={field.value === 'chi'}
                        onChange={() => field.onChange('chi')}
                        className="rounded border-border text-primary accent-primary"
                      />
                      <span className="text-sm">{t('deXuatChiPhi.loaiChi')}</span>
                    </label>
                  </div>
                </div>
              )}
            />
            <Controller
              name="id_tai_khoan"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('deXuatChiPhi.form.taiKhoan')}
                  options={taiKhoanOptions}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                  onBlur={field.onBlur}
                  icon={<Wallet size={12} />}
                  error={errors.id_tai_khoan?.message}
                />
              )}
            />
            <Controller
              name="id_nguoi_de_xuat"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('deXuatChiPhi.form.requester')}
                  options={requesterOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  icon={<User size={12} />}
                  required
                  error={errors.id_nguoi_de_xuat?.message}
                />
              )}
            />
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('deXuatChiPhi.form.status')}
                  options={[
                    { value: '0', label: t('deXuatChiPhi.status.pending') },
                    { value: '1', label: t('deXuatChiPhi.status.approved') },
                    { value: '2', label: t('deXuatChiPhi.status.rejected') },
                  ]}
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('deXuatChiPhi.form.notes')}
                placeholder={t('deXuatChiPhi.form.notesPlaceholder')}
                icon={<FileText size={12} />}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
                rows={2}
              />
            </div>
          </FormGrid>
        </FormSection>

        <GenericSubTableSection
          title={t('deXuatChiPhi.form.detailSection')}
          icon={<List size={14} className="text-primary" />}
          count={fields.length}
          addLabel={t('deXuatChiPhi.form.addRow')}
          onAdd={() => append({ id_danh_muc: '', so_tien: 0, noi_dung: '' })}
          emptyTitle={t('deXuatChiPhi.form.noItems')}
          emptyDescription={t('deXuatChiPhi.form.noItemsHint')}
          maxTableHeight="320px"
        >
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[220px]">
                {t('deXuatChiPhi.form.danhMuc')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[120px]">
                {t('deXuatChiPhi.form.soTien')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[160px]">
                {t('deXuatChiPhi.form.noiDung')}
              </th>
              <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-16 bg-muted border-l border-border">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {fields.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-xs">
                  {t('deXuatChiPhi.form.noItems')}
                </td>
              </tr>
            ) : (
              fields.map((field, index) => (
                <tr key={field.id} className="hover:bg-muted/60 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{index + 1}</td>
                  <td className="px-4 py-2.5 min-w-0 align-top">
                    <Controller
                      name={`chi_tiet.${index}.id_danh_muc`}
                      control={control}
                      render={({ field: f }) => (
                        <Select
                          options={[
                            { value: '', label: t('deXuatChiPhi.form.danhMucPlaceholder') },
                            ...danhMucOptionsByLoai,
                          ]}
                          value={f.value}
                          onChange={(e) => f.onChange(e.target.value)}
                          onBlur={f.onBlur}
                          className="h-9 text-sm min-w-[200px]"
                        />
                      )}
                    />
                  </td>
                  <td className="px-4 py-2.5 min-w-[100px] align-top">
                    <Input
                      type="number"
                      min={0}
                      step="1000"
                      inputMode="numeric"
                      className="h-9 text-sm border-border w-full min-w-[6rem] max-w-[10rem] tabular-nums"
                      {...register(`chi_tiet.${index}.so_tien`, { valueAsNumber: true })}
                    />
                  </td>
                  <td className="px-4 py-2.5 min-w-0 align-top">
                    <Input
                      placeholder={t('deXuatChiPhi.form.noiDungPlaceholder')}
                      className="h-9 text-sm border-border w-full min-w-0"
                      {...register(`chi_tiet.${index}.noi_dung`)}
                    />
                  </td>
                  <td className="sticky right-0 z-[1] px-4 py-2.5 text-center bg-card border-l border-border/50">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                      title={t('common.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </GenericSubTableSection>
      </form>
    </GenericDrawer>
  );
};

export default DeXuatChiPhiForm;
