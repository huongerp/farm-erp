import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Users, Images, ChevronDown, Layers } from 'lucide-react';
import NumberInput from '../../../../components/ui/NumberInput';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
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
import { cn, formatNumberVN } from '../../../../lib/utils';
import {
  applySubTotalsToChiTietForm,
  defaultFormValues,
  farmBaoCaoNhanCongToForm,
  findBaoCaoDuplicateByBranchAndDate,
} from '../core/form-mappers';
import BaoCaoNhanCongChuyenSubEditor from './BaoCaoNhanCongChuyenSubEditor';
import {
  emptySubFormByLoai,
  countSubLines,
  needsMultiLineEditor,
  getSubLoaiQuickGio,
  normalizeChiTietSubFormByLoai,
  setSubLoaiQuickValue,
  syncChiTietTotalsFromSub,
  type ChiTietSubFormByLoai,
} from '../core/ct-sub';

const SL_INPUT = { maxFractionDigits: 0, min: 0 } as const;
const GIO_INPUT = { maxFractionDigits: 2, min: 0 } as const;
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

  const [expandedRows, setExpandedRows] = useState<Set<number>>(() => new Set());

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BaoCaoNhanCongFormValues>({
    resolver: zodResolver(baoCaoNhanCongFormSchema) as any,
    defaultValues,
  });

  const idChiNhanh = watch('id_chi_nhanh');

  useEffect(() => {
    reset(defaultValues);
    const autoExpand = new Set<number>();
    defaultValues.chi_tiet.forEach((row, i) => {
      if (needsMultiLineEditor(row.sub ?? emptySubFormByLoai())) autoExpand.add(i);
    });
    setExpandedRows(autoExpand);
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
    const payload = { ...data, chi_tiet: applySubTotalsToChiTietForm(data.chi_tiet) };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: payload });
      return;
    }
    createMutation.mutate(payload);
  };

  const toggleExpandRow = useCallback((index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const patchSubAtIndex = useCallback(
    (index: number, updater: (sub: ChiTietSubFormByLoai) => ChiTietSubFormByLoai) => {
      const sub = updater(normalizeChiTietSubFormByLoai(getValues(`chi_tiet.${index}.sub`)));
      const totals = syncChiTietTotalsFromSub(sub);
      setValue(
        `chi_tiet.${index}.sub`,
        sub as BaoCaoNhanCongFormValues['chi_tiet'][number]['sub'],
        { shouldDirty: true }
      );
      setValue(`chi_tiet.${index}.sl_cong_ngay`, totals.sl_cong_ngay, { shouldDirty: true });
      setValue(`chi_tiet.${index}.sl_cong_nua`, totals.sl_cong_nua, { shouldDirty: true });
      setValue(`chi_tiet.${index}.sl_tang_ca`, totals.sl_tang_ca, { shouldDirty: true });
      setValue(`chi_tiet.${index}.so_gio_tc`, totals.so_gio_tc, { shouldDirty: true });
    },
    [getValues, setValue]
  );

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

  const readOnlyTotalNum = useCallback((n: number) => {
    return (
      <span className="block w-full text-right tabular-nums text-sm py-1.5 px-1">
        {formatNumberVN(n)}
      </span>
    );
  }, []);

  const renderChuyenDataRow = (
    index: number,
    tt: string,
    labelKey: `baoCaoNhanCong.chuyen.${LoaiChuyen}`,
    code: string
  ) => {
    const row = chiTiet?.[index];
    const sub = normalizeChiTietSubFormByLoai(row?.sub);
    const expanded = expandedRows.has(index);
    const multiLine = needsMultiLineEditor(sub);
    const quickEdit = !expanded && !multiLine;
    const subCount = countSubLines(sub);

    const quickNgay = quickEdit ? (
      <div className="flex flex-col gap-1 min-w-[5.75rem]">
        <Controller
          name={`chi_tiet.${index}.sl_cong_ngay`}
          control={control}
          render={({ field: f }) => (
            <NumberInput
              value={f.value ?? 0}
              onChange={(v) =>
                patchSubAtIndex(index, (s) =>
                  setSubLoaiQuickValue(s, 'CN_NGAY', v, getSubLoaiQuickGio(s, 'CN_NGAY'))
                )
              }
              {...SL_INPUT}
              compact
              className="w-full"
              placeholder={t('baoCaoNhanCong.sub.colSlCong')}
            />
          )}
        />
        <NumberInput
          value={getSubLoaiQuickGio(sub, 'CN_NGAY')}
          onChange={(v) =>
            patchSubAtIndex(index, (s) =>
              setSubLoaiQuickValue(s, 'CN_NGAY', row?.sl_cong_ngay ?? s.CN_NGAY[0]?.sl_cong ?? 0, v)
            )
          }
          {...GIO_INPUT}
          compact
          className="w-full"
          placeholder={t('baoCaoNhanCong.sub.colSoGio')}
        />
      </div>
    ) : (
      readOnlyTotalNum(Number(row?.sl_cong_ngay ?? 0))
    );

    const quickNua = quickEdit ? (
      <div className="flex flex-col gap-1 min-w-[5.75rem]">
        <Controller
          name={`chi_tiet.${index}.sl_cong_nua`}
          control={control}
          render={({ field: f }) => (
            <NumberInput
              value={f.value ?? 0}
              onChange={(v) =>
                patchSubAtIndex(index, (s) =>
                  setSubLoaiQuickValue(s, 'CN_NUA', v, getSubLoaiQuickGio(s, 'CN_NUA'))
                )
              }
              {...SL_INPUT}
              compact
              className="w-full"
              placeholder={t('baoCaoNhanCong.sub.colSlCong')}
            />
          )}
        />
        <NumberInput
          value={getSubLoaiQuickGio(sub, 'CN_NUA')}
          onChange={(v) =>
            patchSubAtIndex(index, (s) =>
              setSubLoaiQuickValue(s, 'CN_NUA', row?.sl_cong_nua ?? s.CN_NUA[0]?.sl_cong ?? 0, v)
            )
          }
          {...GIO_INPUT}
          compact
          className="w-full"
          placeholder={t('baoCaoNhanCong.sub.colSoGio')}
        />
      </div>
    ) : (
      readOnlyTotalNum(Number(row?.sl_cong_nua ?? 0))
    );

    const quickSlTc = quickEdit ? (
      <Controller
        name={`chi_tiet.${index}.sl_tang_ca`}
        control={control}
        render={({ field: f }) => (
          <NumberInput
            value={f.value ?? 0}
            onChange={(v) =>
              patchSubAtIndex(index, (s) =>
                setSubLoaiQuickValue(s, 'TANG_CA', v, s.TANG_CA[0]?.so_gio ?? row?.so_gio_tc ?? 0)
              )
            }
            {...SL_INPUT}
            compact
            className="w-full"
          />
        )}
      />
    ) : (
      readOnlyTotalNum(Number(row?.sl_tang_ca ?? 0))
    );

    const quickGioTc = quickEdit ? (
      <Controller
        name={`chi_tiet.${index}.so_gio_tc`}
        control={control}
        render={({ field: f }) => (
          <NumberInput
            value={f.value ?? 0}
            onChange={(v) =>
              patchSubAtIndex(index, (s) =>
                setSubLoaiQuickValue(s, 'TANG_CA', row?.sl_tang_ca ?? s.TANG_CA[0]?.sl_cong ?? 0, v)
              )
            }
            {...GIO_INPUT}
            compact
            className="w-full"
            placeholder={t('baoCaoNhanCong.sub.gioPlaceholder')}
          />
        )}
      />
    ) : (
      readOnlyTotalNum(Number(row?.so_gio_tc ?? 0))
    );

    return (
      <React.Fragment key={code}>
        <tr className={cn('border-b border-border/80', expanded && 'bg-primary/[0.03]')}>
          <td className="px-2 py-2 text-center font-medium text-muted-foreground tabular-nums align-top">{tt}</td>
          <td className="px-3 py-2 align-top text-muted-foreground max-w-[12rem]">
            <div className="text-sm leading-snug">{t(labelKey)}</div>
            <button
              type="button"
              onClick={() => toggleExpandRow(index)}
              className={cn(
                'mt-1.5 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors',
                expanded
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
              )}
            >
              <Layers size={12} />
              {expanded
                ? t('baoCaoNhanCong.sub.collapse')
                : multiLine
                  ? t('baoCaoNhanCong.sub.editMultiLine', { count: subCount })
                  : t('baoCaoNhanCong.sub.splitLines')}
              <ChevronDown size={12} className={cn('transition-transform', expanded && 'rotate-180')} />
            </button>
            {multiLine && !expanded && (
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">{t('baoCaoNhanCong.sub.multiLineHint')}</p>
            )}
          </td>
          <td className="px-2 py-1.5 align-top">{quickNgay}</td>
          <td className="px-2 py-1.5 align-top">{quickNua}</td>
          <td className="px-2 py-1.5 align-top bg-primary/[0.06] dark:bg-primary/10">
            {readOnlyFormulaNum(tongCongQuyDoiNgayVaNua(row ?? {}))}
          </td>
          <td className="px-2 py-1.5 align-top">{quickSlTc}</td>
          <td className="px-2 py-1.5 align-top">{quickGioTc}</td>
          <td className="px-2 py-1.5 align-top bg-primary/[0.06] dark:bg-primary/10">
            {readOnlyFormulaNum(tongGioTangCaTichMotDong(row ?? {}))}
          </td>
          <td className="px-2 py-1.5 align-top min-w-[20rem] max-w-[32rem]">
            <Controller
              name={`chi_tiet.${index}.ghi_chu`}
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  rows={2}
                  className="text-xs min-h-[3rem] resize-y w-full min-w-[18rem]"
                  placeholder="—"
                />
              )}
            />
          </td>
        </tr>
        {expanded && (
          <tr>
            <td colSpan={9} className="p-0">
              <BaoCaoNhanCongChuyenSubEditor
                chiTietIndex={index}
                chuyenLabel={t(labelKey)}
                control={control}
                setValue={setValue}
                getValues={getValues}
              />
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

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
                hint={
                  CLOUDINARY_READY
                    ? t('baoCaoNhanCong.form.hinhAnhHint')
                    : t('baoCaoNhanCong.form.hinhAnhOfflineHint')
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
          <p className="text-xs text-muted-foreground mb-3">{t('baoCaoNhanCong.form.tableEntryHint')}</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[86rem]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-center px-2 py-2 font-medium w-14">{t('baoCaoNhanCong.form.colTt')}</th>
                  <th className="text-left px-3 py-2 font-medium min-w-[9rem]">{t('baoCaoNhanCong.form.colChuyen')}</th>
                  <th className="text-right px-2 py-2 font-medium w-[6.5rem]">
                    <div>{t('baoCaoNhanCong.form.colSlNgay')}</div>
                    <div className="text-[10px] font-normal text-muted-foreground">{t('baoCaoNhanCong.form.colSlNgayHint')}</div>
                  </th>
                  <th className="text-right px-2 py-2 font-medium w-[6.5rem]">
                    <div>{t('baoCaoNhanCong.form.colSlNua')}</div>
                    <div className="text-[10px] font-normal text-muted-foreground">{t('baoCaoNhanCong.form.colSlNuaHint')}</div>
                  </th>
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
                  return renderChuyenDataRow(index, chuyenTtLabelByThuTu(index + 1), labelKey, code);
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
                {renderChuyenDataRow(vIndex, 'V', vLabelKey, vCode)}
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

      </form>
    </GenericDrawer>
  );
};

export default BaoCaoNhanCongForm;
