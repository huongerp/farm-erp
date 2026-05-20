import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Calculator, Layers, MessageSquare, Users } from 'lucide-react';
import BaoCaoSoCheKpiThuongFormSection, {
  type BcscKpiPresetSource,
} from './BaoCaoSoCheKpiThuongFormSection';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import { baoCaoSoCheFormSchema, type BaoCaoSoCheFormValues } from '../core/schema';
import type { FarmBaoCaoSoChe } from '../core/types';
import {
  defaultFormValues,
  farmBaoCaoSoCheToForm,
  findBaoCaoSoCheDuplicateByBranchAndDate,
} from '../core/form-mappers';
import { BCSC_KPI_STT_OFFSET, BCSC_SO_LIEU_STT_OFFSET, deriveDonViTinhSlipFromSoLieuMeta } from '../core/so-lieu-row-meta';
import { useCreateBaoCaoSoChe, useUpdateBaoCaoSoChe } from '../hooks/use-bao-cao-so-che';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { TRANG_THAI } from '../../../../lib/constants';
import GenericDrawer, { DRAWER_WIDTH_BAO_CAO_SO_CHE } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { useBaoCaoNhanCongList } from '../../bao-cao-nhan-cong/hooks/use-bao-cao-nhan-cong';
import BaoCaoSoCheBcncKpiReadout from './BaoCaoSoCheBcncKpiReadout';
import BaoCaoSoCheSoLieuBuongFormTable from './BaoCaoSoCheSoLieuBuongFormTable';
import { BaoCaoSoChePhamCapFormSection } from './BaoCaoSoChePhamCapTables';
import { sumPhamCapDisplayTotals } from '../core/pham-cap-derived';
import {
  findBaoCaoNhanCongByBranchAndDate,
  computeBaoCaoSoCheKpis,
} from '../core/bcsc-kpi';
import { useDuBaoSlDongThungList } from '../../du-bao-sl-dong-thung/hooks/use-du-bao-sl-dong-thung';

interface Props {
  branches: Branch[];
  initialData?: FarmBaoCaoSoChe | null;
  preferredBranch?: { id_chi_nhanh: string; ten_chi_nhanh: string } | null;
  existingList: FarmBaoCaoSoChe[];
  onClose: () => void;
  /** Chỉ quản trị mới được thao tác section Phẩm cấp và KPI/thưởng. */
  canAdmin?: boolean;
}

const BaoCaoSoCheForm: React.FC<Props> = ({
  branches,
  initialData,
  preferredBranch,
  existingList,
  onClose,
  canAdmin = false,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateBaoCaoSoChe(onClose);
  const updateMutation = useUpdateBaoCaoSoChe(onClose);

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
          label: `${initialData.ten_chi_nhanh} (${t('baoCaoSoChe.form.branchInactiveHint')})`,
          subLabel: '',
        });
      }
    }
    return opts;
  }, [branches, initialData?.id_chi_nhanh, initialData?.ten_chi_nhanh, t]);

  const defaultValues = useMemo(() => {
    if (initialData) return farmBaoCaoSoCheToForm(initialData);
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
  } = useForm<BaoCaoSoCheFormValues>({
    resolver: zodResolver(baoCaoSoCheFormSchema) as any,
    defaultValues,
  });

  const idChiNhanh = watch('id_chi_nhanh');
  const ngay = watch('ngay');
  const phamCap = watch('pham_cap');
  const danhGiaLoiQcPct = watch('danh_gia_loi_qc_pct');
  const tongThungQD = useMemo(
    () => sumPhamCapDisplayTotals(phamCap ?? []).so_thung_quy_doi,
    [phamCap]
  );
  const soLieuMeta = watch('so_lieu_row_meta');
  const donViTinhKpi = useMemo(
    () => deriveDonViTinhSlipFromSoLieuMeta(soLieuMeta),
    [soLieuMeta]
  );
  const { data: bcncList = [] } = useBaoCaoNhanCongList();
  const { data: dbsdtList = [] } = useDuBaoSlDongThungList();

  const bcnc = useMemo(
    () => findBaoCaoNhanCongByBranchAndDate(bcncList, ngay ?? '', idChiNhanh ?? ''),
    [bcncList, ngay, idChiNhanh]
  );
  const kpis = useMemo(() => computeBaoCaoSoCheKpis(tongThungQD, bcnc), [tongThungQD, bcnc]);

  const dbsdtRecord = useMemo(
    () =>
      dbsdtList.find(
        (r) => r.ngay === ngay && String(r.id_chi_nhanh) === String(idChiNhanh)
      ) ?? null,
    [dbsdtList, ngay, idChiNhanh]
  );

  /* 3 nguồn tự tính cho section Đánh giá KPI/thưởng */
  const kpiPresetSources = useMemo<[BcscKpiPresetSource, BcscKpiPresetSource, BcscKpiPresetSource]>(
    () => [
      { thucTeValue: kpis.nsThungCongNgay,                                          isHigherBetter: true  },
      { thucTeValue: Number.isFinite(Number(danhGiaLoiQcPct)) ? Number(danhGiaLoiQcPct) : null, isHigherBetter: false },
      { thucTeValue: dbsdtRecord != null ? dbsdtRecord.ty_le_thu_hoi_thuc_te * 100 : null,      isHigherBetter: true  },
    ],
    [kpis.nsThungCongNgay, danhGiaLoiQcPct, dbsdtRecord]
  );

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

  const onSubmit: SubmitHandler<BaoCaoSoCheFormValues> = (data) => {
    const dup = findBaoCaoSoCheDuplicateByBranchAndDate(
      existingList,
      data.ngay,
      data.id_chi_nhanh,
      initialData?.id
    );
    if (dup) {
      toast.error(t('baoCaoSoChe.validation.duplicateNgayChiNhanh'));
      return;
    }
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data });
      return;
    }
    createMutation.mutate(data);
  };

  return (
    <GenericDrawer
      onClose={onClose}
      title={isEdit ? t('baoCaoSoChe.form.editTitle') : t('baoCaoSoChe.form.createTitle')}
      maxWidthClass={DRAWER_WIDTH_BAO_CAO_SO_CHE}
      icon={<Layers size={18} />}
      footer={
        <FormDrawerFooter
          onCancel={onClose}
          formId="bcsc-form"
          isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
          isEdit={isEdit}
        />
      }
    >
      <form id="bcsc-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('baoCaoSoChe.form.sectionChungTitle')} icon={<Building2 size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="ngay"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="date"
                  label={t('baoCaoSoChe.form.ngay')}
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
                  label={t('baoCaoSoChe.form.branch')}
                  options={branchComboboxOptions}
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v ? String(v) : '')}
                  placeholder={t('baoCaoSoChe.form.branchPlaceholder')}
                  searchPlaceholder={t('baoCaoSoChe.form.branchPlaceholder')}
                  required
                  error={errors.id_chi_nhanh?.message as string | undefined}
                />
              )}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('baoCaoSoChe.form.ghiChuPhieu')} icon={<MessageSquare size={14} />} variant="primary">
          <Controller
            name="ghi_chu"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                value={field.value ?? ''}
                rows={4}
                className="min-h-[6rem] whitespace-pre-wrap w-full max-w-none"
              />
            )}
          />
        </FormSection>

        <FormSection title={t('baoCaoSoChe.form.sectionBcncTitle')} icon={<Users size={14} />} variant="primary">
          <BaoCaoSoCheBcncKpiReadout
            variant="bcnc"
            ngay={ngay ?? ''}
            idChiNhanh={idChiNhanh ?? ''}
            tongThungQD={tongThungQD}
            bcncList={bcncList}
            donViTinh={donViTinhKpi}
          />
        </FormSection>

        <FormSection title={t('baoCaoSoChe.form.sectionSoCheTitle')} icon={<Layers size={14} />} variant="primary">
          <div className="mt-0">
            <BaoCaoSoCheSoLieuBuongFormTable
              control={control}
              errors={errors}
              sttOffset={BCSC_SO_LIEU_STT_OFFSET}
            />
          </div>
        </FormSection>

        <BaoCaoSoChePhamCapFormSection control={control} errors={errors} disabled={!canAdmin} />

        <FormSection title={t('baoCaoSoChe.form.sectionNsLuongTitle')} icon={<Calculator size={14} />} variant="primary">
          <BaoCaoSoCheBcncKpiReadout
            variant="kpi"
            ngay={ngay ?? ''}
            idChiNhanh={idChiNhanh ?? ''}
            tongThungQD={tongThungQD}
            bcncList={bcncList}
            donViTinh={donViTinhKpi}
            sttOffset={BCSC_KPI_STT_OFFSET}
          />
        </FormSection>

        <BaoCaoSoCheKpiThuongFormSection
          control={control}
          setValue={setValue}
          i18nPrefix="baoCaoSoChe.kpiThuong"
          presetSources={kpiPresetSources}
          disabled={!canAdmin}
        />
      </form>
    </GenericDrawer>
  );
};

export default BaoCaoSoCheForm;
