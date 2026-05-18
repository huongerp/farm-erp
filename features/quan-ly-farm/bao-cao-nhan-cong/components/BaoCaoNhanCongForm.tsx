import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Users, Images, ChevronDown } from 'lucide-react';
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
  findSubSlGioPairIssues,
  formatGioTbVN,
  tongGioCongNgayVaNua,
  subAlignedRowCount,
  normalizeChiTietSubFormByLoai,
  sumSlCongFromSubRows,
  sumGioCongFromSubRows,
  sumFormLoaiTotalsOnRows,
} from '../core/ct-sub';
import {
  bcncTableClass,
  bcncColChuyen,
  bcncColNum,
  bcncColTongGio,
  bcncColGhiChu,
  bcncThGroup,
  bcncThSub,
  bcncTrMain,
  bcncTdTt,
  bcncTdChuyen,
  bcncTdMainNum,
  bcncTdQuyDoi,
  bcncTdTongGio,
  bcncTdTongGioTc,
  bcncTdGhiChu,
} from '../core/bcnc-detail-table';

import { useCreateBaoCaoNhanCong, useUpdateBaoCaoNhanCong } from '../hooks/use-bao-cao-nhan-cong';
import { useBaoCaoNhanCongPermissions } from '../hooks/use-bao-cao-nhan-cong-permissions';
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
  const { canCreate, canEditRow } = useBaoCaoNhanCongPermissions();
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
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const idChiNhanh = watch('id_chi_nhanh');

  useEffect(() => {
    reset(defaultValues);
    setExpandedRows(new Set());
  }, [defaultValues, reset]);

  useEffect(() => {
    if (!idChiNhanh) {
      setValue('ten_chi_nhanh', '');
      return;
    }
    const b = branches.find((x) => String(x.id) === String(idChiNhanh));
    if (b) setValue('ten_chi_nhanh', b.ten_chi_nhanh);
  }, [idChiNhanh, branches, setValue]);

  const onInvalid = useCallback(() => {
    const pairMsg = t('baoCaoNhanCong.validation.slGioPairRequired');
    const expand = new Set<number>();
    getValues('chi_tiet').forEach((ct, i) => {
      if (findSubSlGioPairIssues(ct.sub).length > 0) expand.add(i);
    });
    if (expand.size > 0) {
      toast.error(pairMsg);
      setExpandedRows((prev) => new Set([...prev, ...expand]));
    }
  }, [getValues, t]);

  const onSubmit: SubmitHandler<BaoCaoNhanCongFormValues> = (data) => {
    if (isEdit && initialData) {
      if (!canEditRow(initialData)) {
        toast.message(t('baoCaoNhanCong.toast.editNotAllowed'));
        return;
      }
    } else if (!canCreate) {
      toast.message(t('baoCaoNhanCong.toast.createNotAllowed'));
      return;
    }
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

  const chiTiet = watch('chi_tiet');

  const productionSlice = useMemo(() => (chiTiet ?? []).slice(0, 5), [chiTiet]);
  const rowV = chiTiet?.[5];
  const ivCnNgay = useMemo(() => sumFormLoaiTotalsOnRows(productionSlice, 'CN_NGAY'), [productionSlice]);
  const ivCnNua = useMemo(() => sumFormLoaiTotalsOnRows(productionSlice, 'CN_NUA'), [productionSlice]);
  const ivTangCa = useMemo(() => sumFormLoaiTotalsOnRows(productionSlice, 'TANG_CA'), [productionSlice]);
  const tongCnNgay = useMemo(() => sumFormLoaiTotalsOnRows(chiTiet ?? [], 'CN_NGAY'), [chiTiet]);
  const tongCnNua = useMemo(() => sumFormLoaiTotalsOnRows(chiTiet ?? [], 'CN_NUA'), [chiTiet]);
  const tongTangCa = useMemo(() => sumFormLoaiTotalsOnRows(chiTiet ?? [], 'TANG_CA'), [chiTiet]);
  const ivQuyDoi = useMemo(() => sumTongCongQuyDoiTuChiTiet(productionSlice), [productionSlice]);
  const ivTongGioNgayNua = useMemo(() => tongGioCongNgayVaNua(ivCnNgay, ivCnNua), [ivCnNgay, ivCnNua]);
  const ivTongGioTc = useMemo(() => sumTongGioTangCaTichTuChiTiet(productionSlice), [productionSlice]);
  const tongQuyDoiPhieu = useMemo(() => sumTongCongQuyDoiTuChiTiet(chiTiet ?? []), [chiTiet]);
  const tongTongGioNgayNua = useMemo(() => tongGioCongNgayVaNua(tongCnNgay, tongCnNua), [tongCnNgay, tongCnNua]);
  const tongTongGioTc = useMemo(() => sumTongGioTangCaTichTuChiTiet(chiTiet ?? []), [chiTiet]);

  const vIndex = 5;
  const vCode = (rowV?.loai_chuyen ?? 'CONG_DINH_BIEN_KHONG_SAN_XUAT') as LoaiChuyen;
  const vLabelKey = `baoCaoNhanCong.chuyen.${vCode}` as const;

  const formLoaiTotals = useCallback(
    (row: BaoCaoNhanCongFormValues['chi_tiet'][number] | undefined, loai: 'CN_NGAY' | 'CN_NUA' | 'TANG_CA') => {
      const sub = normalizeChiTietSubFormByLoai(row?.sub);
      return {
        nhanSu: sumSlCongFromSubRows(sub[loai]),
        tongGio: sumGioCongFromSubRows(sub[loai]),
      };
    },
    []
  );

  const renderChuyenDataRow = (
    index: number,
    tt: string,
    labelKey: `baoCaoNhanCong.chuyen.${LoaiChuyen}`,
    code: string
  ) => {
    const row = chiTiet?.[index];
    const sub = normalizeChiTietSubFormByLoai(row?.sub);
    const expanded = expandedRows.has(index);
    const subCount = subAlignedRowCount(sub);
    const cnNgay = formLoaiTotals(row, 'CN_NGAY');
    const cnNua = formLoaiTotals(row, 'CN_NUA');
    const tangCa = formLoaiTotals(row, 'TANG_CA');

    const tongGioTcTich = tongGioTangCaTichMotDong({ ...row, sub });

    return (
      <React.Fragment key={code}>
        <tr className={cn(bcncTrMain, expanded && 'bg-primary/[0.03]')}>
          <td className={`${bcncTdTt} text-muted-foreground tabular-nums`}>{tt}</td>
          <td className={`${bcncTdChuyen} text-muted-foreground`}>
            <div className="flex items-center gap-2">
              <span className="text-sm leading-snug flex-1 min-w-0">{t(labelKey)}</span>
              <button
                type="button"
                onClick={() => toggleExpandRow(index)}
                aria-expanded={expanded}
                aria-label={
                  expanded
                    ? t('baoCaoNhanCong.sub.collapse')
                    : `${t('baoCaoNhanCong.sub.viewBreakdown')} (${subCount})`
                }
                title={`${expanded ? t('baoCaoNhanCong.sub.collapse') : t('baoCaoNhanCong.sub.viewBreakdown')} (${subCount})`}
                className={cn(
                  'shrink-0 size-7 inline-flex items-center justify-center rounded-md border transition-colors',
                  expanded
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:text-primary'
                )}
              >
                <ChevronDown size={15} className={cn('transition-transform', expanded && 'rotate-180')} />
              </button>
            </div>
          </td>
          <td className={bcncTdMainNum}>{formatNumberVN(cnNgay.nhanSu)}</td>
          <td className={bcncTdMainNum}>{formatGioTbVN(cnNgay.nhanSu, cnNgay.tongGio)}</td>
          <td className={bcncTdMainNum}>{formatNumberVN(cnNua.nhanSu)}</td>
          <td className={bcncTdMainNum}>{formatGioTbVN(cnNua.nhanSu, cnNua.tongGio)}</td>
          <td className={bcncTdQuyDoi}>{formatNumberVN(tongCongQuyDoiNgayVaNua(row ?? {}))}</td>
          <td className={bcncTdTongGio}>{formatNumberVN(tongGioCongNgayVaNua(cnNgay, cnNua))}</td>
          <td className={bcncTdMainNum}>{formatNumberVN(tangCa.nhanSu)}</td>
          <td className={bcncTdMainNum}>{formatGioTbVN(tangCa.nhanSu, tangCa.tongGio)}</td>
          <td className={bcncTdTongGioTc}>{formatNumberVN(tongGioTcTich)}</td>
          <td className={`${bcncTdGhiChu} font-normal`}>
            <Controller
              name={`chi_tiet.${index}.ghi_chu`}
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  rows={1}
                  className="text-sm resize-y w-full min-h-0 py-1.5"
                  placeholder="—"
                />
              )}
            />
          </td>
        </tr>
        {expanded && (
          <BaoCaoNhanCongChuyenSubEditor
            chiTietIndex={index}
            control={control}
            setValue={setValue}
            getValues={getValues}
            subErrors={errors.chi_tiet?.[index]?.sub}
          />
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
      <form id="bcnc-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
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
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className={bcncTableClass}>
              <thead>
                <tr className="bg-muted/50 border-b border-border/60">
                  <th rowSpan={2} className={`text-center px-2 py-2 font-medium w-14 align-middle border-b border-border ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colTt')}
                  </th>
                  <th rowSpan={2} className={`text-left px-2 py-2 font-medium align-middle border-b border-border ${bcncColChuyen} ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colChuyen')}
                  </th>
                  <th colSpan={2} className={`text-center px-2 py-1.5 font-medium border-b border-border/60 ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colSlNgay')}
                  </th>
                  <th colSpan={2} className={`text-center px-2 py-1.5 font-medium border-b border-border/60 ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colSlNua')}
                  </th>
                  <th rowSpan={2} className={`text-right px-2 py-2 font-semibold text-primary bg-primary/[0.08] dark:bg-primary/15 align-middle border-b border-border ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colTongCongQuyDoi')}
                  </th>
                  <th rowSpan={2} className={`text-right px-2 py-1.5 font-semibold text-primary bg-primary/[0.08] dark:bg-primary/12 align-middle border-b border-border ${bcncColTongGio} ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colTongGio')}
                  </th>
                  <th colSpan={2} className={`text-center px-2 py-1.5 font-medium border-b border-border/60 ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colSlTangCa')}
                  </th>
                  <th rowSpan={2} className={`text-right px-2 py-1.5 font-semibold text-primary bg-primary/[0.08] dark:bg-primary/12 align-middle border-b border-border ${bcncColTongGio} ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colTongGioTc')}
                  </th>
                  <th rowSpan={2} className={`text-left px-2 py-2 font-medium align-middle border-b border-border ${bcncColGhiChu}`}>
                    {t('baoCaoNhanCong.form.colGhiChu')}
                  </th>
                </tr>
                <tr className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
                  <th className={`text-right px-1 py-1 font-medium text-[11px] ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.detail.colNhanSu')}</th>
                  <th className={`text-right px-1 py-1 font-medium text-[11px] ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.form.colGioTb')}</th>
                  <th className={`text-right px-1 py-1 font-medium text-[11px] ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.detail.colNhanSu')}</th>
                  <th className={`text-right px-1 py-1 font-medium text-[11px] ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.form.colGioTb')}</th>
                  <th className={`text-right px-1 py-1 font-medium text-[11px] ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.detail.colNhanSu')}</th>
                  <th className={`text-right px-1 py-1 font-medium text-[11px] ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.form.colGioTb')}</th>
                </tr>
              </thead>
              <tbody>
                {productionSlice.map((row, index) => {
                  const code = row.loai_chuyen as LoaiChuyen;
                  const labelKey = `baoCaoNhanCong.chuyen.${code}` as const;
                  return renderChuyenDataRow(index, chuyenTtLabelByThuTu(index + 1), labelKey, code);
                })}
                <tr className="border-b border-border/80 bg-primary/10 dark:bg-primary/15 font-semibold">
                  <td className={`${bcncTdMainNum} text-center text-primary`}>IV</td>
                  <td className={`${bcncTdChuyen} text-primary`}>{t('baoCaoNhanCong.form.rowCongNhanDinhBien')}</td>
                  <td className={`${bcncTdMainNum} text-primary`}>{formatNumberVN(ivCnNgay.nhanSu)}</td>
                  <td className={`${bcncTdMainNum} text-primary`}>{formatGioTbVN(ivCnNgay.nhanSu, ivCnNgay.tongGio)}</td>
                  <td className={`${bcncTdMainNum} text-primary`}>{formatNumberVN(ivCnNua.nhanSu)}</td>
                  <td className={`${bcncTdMainNum} text-primary`}>{formatGioTbVN(ivCnNua.nhanSu, ivCnNua.tongGio)}</td>
                  <td className={bcncTdQuyDoi}>{formatNumberVN(ivQuyDoi)}</td>
                  <td className={bcncTdTongGio}>{formatNumberVN(ivTongGioNgayNua)}</td>
                  <td className={`${bcncTdMainNum} text-primary`}>{formatNumberVN(ivTangCa.nhanSu)}</td>
                  <td className={`${bcncTdMainNum} text-primary`}>{formatGioTbVN(ivTangCa.nhanSu, ivTangCa.tongGio)}</td>
                  <td className={bcncTdTongGioTc}>{formatNumberVN(ivTongGioTc)}</td>
                  <td className={`${bcncTdGhiChu} text-muted-foreground text-sm font-normal`}>—</td>
                </tr>
                {renderChuyenDataRow(vIndex, 'V', vLabelKey, vCode)}
                <tr className="border-b border-border/80 bg-primary/15 dark:bg-primary/20 last:border-0 font-semibold">
                  <td className={`${bcncTdChuyen} text-left text-primary sm:pl-3 tracking-tight`} colSpan={2}>
                    {t('baoCaoNhanCong.form.rowTongNgay')}
                  </td>
                  <td className={`${bcncTdMainNum} text-primary text-base`}>{formatNumberVN(tongCnNgay.nhanSu)}</td>
                  <td className={`${bcncTdMainNum} text-primary text-base`}>{formatGioTbVN(tongCnNgay.nhanSu, tongCnNgay.tongGio)}</td>
                  <td className={`${bcncTdMainNum} text-primary text-base`}>{formatNumberVN(tongCnNua.nhanSu)}</td>
                  <td className={`${bcncTdMainNum} text-primary text-base`}>{formatGioTbVN(tongCnNua.nhanSu, tongCnNua.tongGio)}</td>
                  <td className={`${bcncTdQuyDoi} text-base bg-primary/[0.1] dark:bg-primary/20`}>{formatNumberVN(tongQuyDoiPhieu)}</td>
                  <td className={`${bcncTdTongGio} text-base`}>{formatNumberVN(tongTongGioNgayNua)}</td>
                  <td className={`${bcncTdMainNum} text-primary text-base`}>{formatNumberVN(tongTangCa.nhanSu)}</td>
                  <td className={`${bcncTdMainNum} text-primary text-base`}>{formatGioTbVN(tongTangCa.nhanSu, tongTangCa.tongGio)}</td>
                  <td className={`${bcncTdTongGioTc} text-base`}>{formatNumberVN(tongTongGioTc)}</td>
                  <td className={`${bcncTdGhiChu} text-muted-foreground text-sm font-normal`}>—</td>
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
