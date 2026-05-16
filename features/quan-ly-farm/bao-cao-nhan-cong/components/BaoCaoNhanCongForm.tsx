import React, { useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useForm, Controller, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Users, Images, Award, Plus, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import NumberInput from '../../../../components/ui/NumberInput';
import MultiImageInput, { type ImageItem } from '../../../../components/ui/MultiImageInput';
import { uploadImageToCloudinary } from '../../../../lib/cloudinary';
import { baoCaoNhanCongFormSchema, type BaoCaoNhanCongFormValues } from '../core/schema';
import type { FarmBaoCaoNhanCong } from '../core/types';
import type { LoaiChuyen } from '../core/types';
import {
  chuyenTtLabelByThuTu,
  sumChiTietNumericPart,
  sumTongCongQuyDoiTuChiTiet,
  sumTongGioTangCaTichTuChiTiet,
  tongCongQuyDoiNgayVaNua,
  tongGioTangCaTichMotDong,
} from '../core/types';
import { formatNumberVN } from '../../../../lib/utils';
import Button from '../../../../components/ui/Button';
import {
  defaultFormValues,
  defaultKpiFormRow,
  farmBaoCaoNhanCongToForm,
  findBaoCaoDuplicateByBranchAndDate,
} from '../core/form-mappers';
import { useCreateBaoCaoNhanCong, useUpdateBaoCaoNhanCong } from '../hooks/use-bao-cao-nhan-cong';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { TRANG_THAI } from '../../../../lib/constants';
import GenericDrawer, { DRAWER_WIDTH_BAO_CAO_NHAN_CONG } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

const CLOUDINARY_READY =
  Boolean(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) && Boolean(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

function urlsToImageItems(urls: string[]): ImageItem[] {
  return urls.map((src) => ({ id: src, src }));
}

function imageItemsToUrls(items: ImageItem[]): string[] {
  return items.map((i) => i.src).filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
}

interface Props {
  branches: Branch[];
  initialData?: FarmBaoCaoNhanCong | null;
  preferredBranch?: { id_chi_nhanh: string; ten_chi_nhanh: string } | null;
  /** Danh sách đã tải — dùng chặn trùng cặp (ngày, chi nhánh). */
  existingList: FarmBaoCaoNhanCong[];
  onClose: () => void;
}

const BaoCaoNhanCongForm: React.FC<Props> = ({
  branches,
  initialData,
  preferredBranch,
  existingList,
  onClose,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateBaoCaoNhanCong(onClose);
  const updateMutation = useUpdateBaoCaoNhanCong(onClose);

  const branchComboboxOptions = useMemo(() => {
    const active = branches.filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG);
    const opts = active.map((b) => ({
      value: b.id,
      label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}`,
      subLabel: b.ma_chi_nhanh,
    }));
    if (initialData?.id_chi_nhanh && initialData.ten_chi_nhanh) {
      const idStr = String(initialData.id_chi_nhanh);
      if (!opts.some((o) => String(o.value) === idStr)) {
        opts.unshift({
          value: idStr,
          label: `${initialData.ten_chi_nhanh} (${t('baoCaoNhanCong.form.branchInactiveHint')})`,
          subLabel: '',
        });
      }
    }
    return opts;
  }, [branches, initialData?.id_chi_nhanh, initialData?.ten_chi_nhanh, t]);

  const defaultValues = useMemo(() => {
    if (initialData) return farmBaoCaoNhanCongToForm(initialData);
    const base = defaultFormValues();
    if (preferredBranch?.id_chi_nhanh) {
      return {
        ...base,
        id_chi_nhanh: preferredBranch.id_chi_nhanh,
        ten_chi_nhanh: preferredBranch.ten_chi_nhanh,
      };
    }
    return base;
  }, [initialData, preferredBranch?.id_chi_nhanh, preferredBranch?.ten_chi_nhanh]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BaoCaoNhanCongFormValues>({
    resolver: zodResolver(baoCaoNhanCongFormSchema) as any,
    defaultValues,
  });

  const { fields: kpiFields, append: appendKpi, remove: removeKpi } = useFieldArray({
    control,
    name: 'kpi',
  });

  const idChiNhanh = watch('id_chi_nhanh');

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (!idChiNhanh) {
      setValue('ten_chi_nhanh', '');
      return;
    }
    const b = branches.find((x) => String(x.id) === String(idChiNhanh));
    if (b) setValue('ten_chi_nhanh', b.ten_chi_nhanh);
  }, [idChiNhanh, branches, setValue]);

  const onSubmit: SubmitHandler<BaoCaoNhanCongFormValues> = (data) => {
    const dup = findBaoCaoDuplicateByBranchAndDate(
      existingList,
      data.ngay,
      data.id_chi_nhanh,
      initialData?.id
    );
    if (dup) {
      toast.error(t('baoCaoNhanCong.validation.duplicateNgayChiNhanh'));
      return;
    }
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data });
      return;
    }
    createMutation.mutate(data);
  };

  const chiTiet = watch('chi_tiet');

  const productionSlice = useMemo(() => (chiTiet ?? []).slice(0, 5), [chiTiet]);
  const rowV = chiTiet?.[5];
  const ivAgg = useMemo(() => sumChiTietNumericPart(productionSlice), [productionSlice]);
  const tongAgg = useMemo(
    () => sumChiTietNumericPart([ivAgg, rowV ?? {}]),
    [ivAgg, rowV]
  );
  const ivQuyDoi = useMemo(() => sumTongCongQuyDoiTuChiTiet(productionSlice), [productionSlice]);
  const vQuyDoi = useMemo(() => tongCongQuyDoiNgayVaNua(rowV ?? {}), [rowV]);
  const tongQuyDoiPhieu = useMemo(() => sumTongCongQuyDoiTuChiTiet(chiTiet ?? []), [chiTiet]);
  const ivGioTich = useMemo(() => sumTongGioTangCaTichTuChiTiet(productionSlice), [productionSlice]);
  const tongGioTichPhieu = useMemo(() => sumTongGioTangCaTichTuChiTiet(chiTiet ?? []), [chiTiet]);

  const kpiRows = watch('kpi');
  const tongTienThuongKpi = useMemo(
    () => (kpiRows ?? []).reduce((s, r) => s + Number(r?.tien_thuong ?? 0), 0),
    [kpiRows]
  );

  const vIndex = 5;
  const vCode = (rowV?.loai_chuyen ?? 'CONG_DINH_BIEN_KHONG_SAN_XUAT') as LoaiChuyen;
  const vLabelKey = `baoCaoNhanCong.chuyen.${vCode}` as const;

  const readOnlyFormulaNum = useCallback((n: number) => {
    return (
      <span className="block w-full text-right tabular-nums font-bold text-primary py-1.5 px-1">
        {formatNumberVN(n)}
      </span>
    );
  }, []);

  const handleUploadImage = useCallback((file: File) => uploadImageToCloudinary(file, 'farm-erp/bao-cao-nhan-cong'), []);

  return (
    <GenericDrawer
      onClose={onClose}
      title={isEdit ? t('baoCaoNhanCong.form.editTitle') : t('baoCaoNhanCong.form.createTitle')}
      maxWidthClass={DRAWER_WIDTH_BAO_CAO_NHAN_CONG}
      icon={<Users size={18} />}
      footer={
        <FormDrawerFooter
          onCancel={onClose}
          formId="bcnc-form"
          isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
          isEdit={isEdit}
        />
      }
    >
      <form id="bcnc-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('baoCaoNhanCong.form.ngay')} icon={<Building2 size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="ngay"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="date"
                  label={t('baoCaoNhanCong.form.ngay')}
                  required
                  error={errors.ngay?.message}
                />
              )}
            />
            <Controller
              name="id_chi_nhanh"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('baoCaoNhanCong.form.branch')}
                  options={branchComboboxOptions}
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v ? String(v) : '')}
                  placeholder={t('baoCaoNhanCong.form.branchPlaceholder')}
                  searchPlaceholder={t('baoCaoNhanCong.form.branchPlaceholder')}
                  required
                  error={errors.id_chi_nhanh?.message as string | undefined}
                />
              )}
            />
          </FormGrid>
          <Controller
            name="ghi_chu"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                value={field.value ?? ''}
                label={t('baoCaoNhanCong.form.ghiChuPhieu')}
                rows={5}
                className="mt-3 min-h-[7.5rem] whitespace-pre-wrap w-full max-w-none"
              />
            )}
          />
          <Controller
            name="hinh_anh_urls"
            control={control}
            render={({ field }) => (
              <MultiImageInput
                label={t('baoCaoNhanCong.form.hinhAnh')}
                icon={<Images className="w-4 h-4 text-muted-foreground" />}
                value={urlsToImageItems(field.value ?? [])}
                onChange={(items) => field.onChange(imageItemsToUrls(items))}
                uploadFile={CLOUDINARY_READY ? handleUploadImage : undefined}
                disabled={!CLOUDINARY_READY}
                hint={
                  CLOUDINARY_READY
                    ? t('baoCaoNhanCong.form.hinhAnhHint')
                    : t('baoCaoNhanCong.form.hinhAnhCloudinaryHint')
                }
                maxFiles={20}
                maxSizeMB={5}
                columns={4}
                className="mt-3"
                error={errors.hinh_anh_urls?.message as string | undefined}
              />
            )}
          />
        </FormSection>

        <FormSection title={t('baoCaoNhanCong.form.sectionChuyen')} icon={<Users size={14} />} variant="primary">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[86rem]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-center px-2 py-2 font-medium w-14">{t('baoCaoNhanCong.form.colTt')}</th>
                  <th className="text-left px-3 py-2 font-medium min-w-[9rem]">{t('baoCaoNhanCong.form.colChuyen')}</th>
                  <th className="text-right px-2 py-2 font-medium w-[6.25rem]">{t('baoCaoNhanCong.form.colSlNgay')}</th>
                  <th className="text-right px-2 py-2 font-medium w-[6.25rem]">{t('baoCaoNhanCong.form.colSlNua')}</th>
                  <th className="text-right px-2 py-2 font-semibold text-primary w-[6.5rem] bg-primary/[0.08] dark:bg-primary/15">
                    {t('baoCaoNhanCong.form.colTongCongQuyDoi')}
                  </th>
                  <th className="text-right px-2 py-2 font-medium w-[6.25rem]">{t('baoCaoNhanCong.form.colSlTangCa')}</th>
                  <th className="text-right px-2 py-2 font-medium w-[6.5rem]">{t('baoCaoNhanCong.form.colGioTangCa')}</th>
                  <th className="text-right px-2 py-2 font-semibold text-primary w-[6.5rem] bg-primary/[0.08] dark:bg-primary/15">
                    {t('baoCaoNhanCong.form.colTongGioTangCa')}
                  </th>
                  <th className="text-left px-2 py-2 font-medium min-w-[20rem] w-[22rem]">{t('baoCaoNhanCong.form.colGhiChu')}</th>
                </tr>
              </thead>
              <tbody>
                {productionSlice.map((row, index) => {
                  const code = row.loai_chuyen as LoaiChuyen;
                  const labelKey = `baoCaoNhanCong.chuyen.${code}` as const;
                  return (
                    <tr key={code} className="border-b border-border/80">
                      <td className="px-2 py-2 text-center font-medium text-muted-foreground tabular-nums align-top">
                        {chuyenTtLabelByThuTu(index + 1)}
                      </td>
                      <td className="px-3 py-2 align-top text-muted-foreground whitespace-normal max-w-[11rem]">
                        {t(labelKey)}
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <Controller
                          name={`chi_tiet.${index}.sl_cong_ngay`}
                          control={control}
                          render={({ field }) => (
                            <NumberInput
                              value={field.value ?? 0}
                              onChange={field.onChange}
                              min={0}
                              className="w-full"
                              compact
                            />
                          )}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <Controller
                          name={`chi_tiet.${index}.sl_cong_nua`}
                          control={control}
                          render={({ field }) => (
                            <NumberInput
                              value={field.value ?? 0}
                              onChange={field.onChange}
                              min={0}
                              className="w-full"
                              compact
                            />
                          )}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top bg-primary/[0.06] dark:bg-primary/10">{readOnlyFormulaNum(tongCongQuyDoiNgayVaNua(chiTiet?.[index] ?? {}))}</td>
                      <td className="px-2 py-1.5 align-top">
                        <Controller
                          name={`chi_tiet.${index}.sl_tang_ca`}
                          control={control}
                          render={({ field }) => (
                            <NumberInput
                              value={field.value ?? 0}
                              onChange={field.onChange}
                              min={0}
                              className="w-full"
                              compact
                            />
                          )}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <Controller
                          name={`chi_tiet.${index}.so_gio_tc`}
                          control={control}
                          render={({ field }) => (
                            <NumberInput
                              value={field.value ?? 0}
                              onChange={field.onChange}
                              min={0}
                              className="w-full"
                              compact
                            />
                          )}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top bg-primary/[0.06] dark:bg-primary/10">
                        {readOnlyFormulaNum(tongGioTangCaTichMotDong(chiTiet?.[index] ?? {}))}
                      </td>
                      <td className="px-2 py-1.5 align-top min-w-[20rem] max-w-[32rem]">
                        <Controller
                          name={`chi_tiet.${index}.ghi_chu`}
                          control={control}
                          render={({ field }) => (
                            <Textarea
                              {...field}
                              value={field.value ?? ''}
                              rows={3}
                              className="text-xs min-h-[4.5rem] resize-y w-full min-w-[18rem]"
                              placeholder="—"
                            />
                          )}
                        />
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-b border-border/80 bg-primary/10 dark:bg-primary/15">
                  <td className="px-2 py-2 text-center font-bold text-primary tabular-nums align-top">IV</td>
                  <td className="px-3 py-2 align-top font-bold text-primary">{t('baoCaoNhanCong.form.rowCongNhanDinhBien')}</td>
                  <td className="px-2 py-1.5 align-top text-right tabular-nums font-bold text-primary">{formatNumberVN(ivAgg.sl_cong_ngay)}</td>
                  <td className="px-2 py-1.5 align-top text-right tabular-nums font-bold text-primary">{formatNumberVN(ivAgg.sl_cong_nua)}</td>
                  <td className="px-2 py-1.5 align-top text-right tabular-nums font-bold text-primary bg-primary/[0.06] dark:bg-primary/10">
                    {formatNumberVN(ivQuyDoi)}
                  </td>
                  <td className="px-2 py-1.5 align-top text-right tabular-nums font-bold text-primary">{formatNumberVN(ivAgg.sl_tang_ca)}</td>
                  <td className="px-2 py-1.5 align-top text-right tabular-nums font-bold text-primary">{formatNumberVN(ivAgg.so_gio_tc)}</td>
                  <td className="px-2 py-1.5 align-top text-right tabular-nums font-bold text-primary bg-primary/[0.06] dark:bg-primary/10">
                    {formatNumberVN(ivGioTich)}
                  </td>
                  <td className="px-3 py-2 align-top text-muted-foreground text-xs">—</td>
                </tr>
                <tr key={vCode} className="border-b border-border/80">
                  <td className="px-2 py-2 text-center font-medium text-muted-foreground tabular-nums align-top">V</td>
                  <td className="px-3 py-2 align-top text-muted-foreground whitespace-normal max-w-[11rem]">
                    {t(vLabelKey)}
                  </td>
                  <td className="px-2 py-1.5 align-top">
                    <Controller
                      name={`chi_tiet.${vIndex}.sl_cong_ngay`}
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          value={field.value ?? 0}
                          onChange={field.onChange}
                          min={0}
                          className="w-full"
                          compact
                        />
                      )}
                    />
                  </td>
                  <td className="px-2 py-1.5 align-top">
                    <Controller
                      name={`chi_tiet.${vIndex}.sl_cong_nua`}
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          value={field.value ?? 0}
                          onChange={field.onChange}
                          min={0}
                          className="w-full"
                          compact
                        />
                      )}
                    />
                  </td>
                  <td className="px-2 py-1.5 align-top bg-primary/[0.06] dark:bg-primary/10">{readOnlyFormulaNum(tongCongQuyDoiNgayVaNua(chiTiet?.[vIndex] ?? {}))}</td>
                  <td className="px-2 py-1.5 align-top">
                    <Controller
                      name={`chi_tiet.${vIndex}.sl_tang_ca`}
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          value={field.value ?? 0}
                          onChange={field.onChange}
                          min={0}
                          className="w-full"
                          compact
                        />
                      )}
                    />
                  </td>
                  <td className="px-2 py-1.5 align-top">
                    <Controller
                      name={`chi_tiet.${vIndex}.so_gio_tc`}
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          value={field.value ?? 0}
                          onChange={field.onChange}
                          min={0}
                          className="w-full"
                          compact
                        />
                      )}
                    />
                  </td>
                  <td className="px-2 py-1.5 align-top bg-primary/[0.06] dark:bg-primary/10">
                    {readOnlyFormulaNum(tongGioTangCaTichMotDong(chiTiet?.[vIndex] ?? {}))}
                  </td>
                  <td className="px-2 py-1.5 align-top min-w-[20rem] max-w-[32rem]">
                    <Controller
                      name={`chi_tiet.${vIndex}.ghi_chu`}
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          rows={3}
                          className="text-xs min-h-[4.5rem] resize-y w-full min-w-[18rem]"
                          placeholder="—"
                        />
                      )}
                    />
                  </td>
                </tr>
                <tr className="border-b border-border/80 bg-primary/15 dark:bg-primary/20 last:border-0">
                  <td className="px-2 py-2.5 text-left font-bold text-primary align-top sm:pl-3 tracking-tight" colSpan={2}>
                    {t('baoCaoNhanCong.form.rowTongNgay')}
                  </td>
                  <td className="px-2 py-2 align-top text-right tabular-nums font-bold text-primary text-base">
                    {formatNumberVN(tongAgg.sl_cong_ngay)}
                  </td>
                  <td className="px-2 py-2 align-top text-right tabular-nums font-bold text-primary text-base">
                    {formatNumberVN(tongAgg.sl_cong_nua)}
                  </td>
                  <td className="px-2 py-2 align-top text-right tabular-nums font-bold text-primary text-base bg-primary/[0.08] dark:bg-primary/15">
                    {formatNumberVN(tongQuyDoiPhieu)}
                  </td>
                  <td className="px-2 py-2 align-top text-right tabular-nums font-bold text-primary text-base">
                    {formatNumberVN(tongAgg.sl_tang_ca)}
                  </td>
                  <td className="px-2 py-2 align-top text-right tabular-nums font-bold text-primary text-base">
                    {formatNumberVN(tongAgg.so_gio_tc)}
                  </td>
                  <td className="px-2 py-2 align-top text-right tabular-nums font-bold text-primary text-base bg-primary/[0.08] dark:bg-primary/15">
                    {formatNumberVN(tongGioTichPhieu)}
                  </td>
                  <td className="px-3 py-2 align-top text-muted-foreground text-xs">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </FormSection>

        <FormSection title={t('baoCaoNhanCong.form.sectionKpi')} icon={<Award size={14} />} variant="primary">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-xs text-muted-foreground">{t('baoCaoNhanCong.form.kpiHint')}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => appendKpi(defaultKpiFormRow())}
            >
              <Plus size={14} /> {t('baoCaoNhanCong.form.kpiAddRow')}
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[56rem]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-center px-1 py-2 font-medium w-10">{t('baoCaoNhanCong.form.colTt')}</th>
                  <th className="text-left px-2 py-2 font-medium min-w-[10rem]">{t('baoCaoNhanCong.form.kpiColHangMuc')}</th>
                  <th className="text-left px-2 py-2 font-medium w-[5.5rem]">{t('baoCaoNhanCong.form.kpiColDvt')}</th>
                  <th className="text-left px-2 py-2 font-medium min-w-[6rem]">{t('baoCaoNhanCong.form.kpiColMucTieu')}</th>
                  <th className="text-left px-2 py-2 font-medium min-w-[6rem]">{t('baoCaoNhanCong.form.kpiColThucTe')}</th>
                  <th className="text-right px-2 py-2 font-medium w-[6.5rem]">{t('baoCaoNhanCong.form.kpiColPhanTram')}</th>
                  <th className="text-left px-2 py-2 font-medium min-w-[6rem]">{t('baoCaoNhanCong.form.kpiColDanhGia')}</th>
                  <th className="text-right px-2 py-2 font-medium w-[7.5rem]">{t('baoCaoNhanCong.form.kpiColTienThuong')}</th>
                  <th className="text-left px-2 py-2 font-medium min-w-[8rem]">{t('baoCaoNhanCong.form.kpiColGhiChu')}</th>
                  <th className="w-10 px-1" aria-label={t('common.actions')} />
                </tr>
              </thead>
              <tbody>
                {kpiFields.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground text-sm">
                      {t('baoCaoNhanCong.form.kpiEmpty')}
                    </td>
                  </tr>
                ) : (
                  kpiFields.map((field, index) => (
                    <tr key={field.id} className="border-b border-border/80">
                      <td className="px-1 py-2 text-center tabular-nums text-muted-foreground align-top">{index + 1}</td>
                      <td className="px-2 py-1.5 align-top">
                        <Controller
                          name={`kpi.${index}.ten_hang_muc`}
                          control={control}
                          render={({ field: f }) => (
                            <Input {...f} value={f.value ?? ''} className="text-xs w-full min-w-[8rem]" placeholder="—" />
                          )}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <Controller
                          name={`kpi.${index}.don_vi_tinh`}
                          control={control}
                          render={({ field: f }) => (
                            <Input {...f} value={f.value ?? ''} className="text-xs w-full" placeholder="—" />
                          )}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <Controller
                          name={`kpi.${index}.muc_tieu`}
                          control={control}
                          render={({ field: f }) => (
                            <Input {...f} value={f.value ?? ''} className="text-xs w-full min-w-[5rem]" placeholder="—" />
                          )}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <Controller
                          name={`kpi.${index}.thuc_te`}
                          control={control}
                          render={({ field: f }) => (
                            <Input {...f} value={f.value ?? ''} className="text-xs w-full min-w-[5rem]" placeholder="—" />
                          )}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <Controller
                          name={`kpi.${index}.phan_tram`}
                          control={control}
                          render={({ field: f }) => (
                            <Input
                              type="number"
                              step="0.01"
                              className="text-xs w-full text-right tabular-nums"
                              value={f.value == null ? '' : String(f.value)}
                              onChange={(e) => {
                                const raw = e.target.value.trim();
                                if (raw === '') {
                                  f.onChange(null);
                                  return;
                                }
                                const n = Number(raw);
                                f.onChange(Number.isFinite(n) ? n : null);
                              }}
                              onBlur={f.onBlur}
                              name={f.name}
                              ref={f.ref}
                              placeholder="—"
                            />
                          )}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <Controller
                          name={`kpi.${index}.danh_gia`}
                          control={control}
                          render={({ field: f }) => (
                            <Input {...f} value={f.value ?? ''} className="text-xs w-full" placeholder="—" />
                          )}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <Controller
                          name={`kpi.${index}.tien_thuong`}
                          control={control}
                          render={({ field: f }) => (
                            <NumberInput
                              value={f.value ?? 0}
                              onChange={f.onChange}
                              min={-1e15}
                              max={1e15}
                              maxFractionDigits={2}
                              className="w-full"
                              compact
                            />
                          )}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-top">
                        <Controller
                          name={`kpi.${index}.ghi_chu`}
                          control={control}
                          render={({ field: f }) => (
                            <Input {...f} value={f.value ?? ''} className="text-xs w-full min-w-[6rem]" placeholder="—" />
                          )}
                        />
                      </td>
                      <td className="px-1 py-1.5 align-top text-center">
                        <button
                          type="button"
                          onClick={() => removeKpi(index)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                          title={t('common.delete')}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {kpiFields.length > 0 && (
                  <tr className="bg-primary/10 dark:bg-primary/15 border-t border-border">
                    <td colSpan={7} className="px-3 py-2 text-right font-bold text-primary tabular-nums">
                      {t('baoCaoNhanCong.form.kpiRowTongThuong')}
                    </td>
                    <td className="px-2 py-2 text-right font-bold text-primary tabular-nums text-sm">
                      {formatNumberVN(tongTienThuongKpi)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default BaoCaoNhanCongForm;
