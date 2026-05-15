import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Calculator, Layers, MessageSquare, Users } from 'lucide-react';
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
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { useBaoCaoNhanCongList } from '../../bao-cao-nhan-cong/hooks/use-bao-cao-nhan-cong';
import BaoCaoSoCheBcncKpiReadout from './BaoCaoSoCheBcncKpiReadout';
import BaoCaoSoCheSoLieuBuongFormTable from './BaoCaoSoCheSoLieuBuongFormTable';
import { BaoCaoSoChePhamCapFormSection } from './BaoCaoSoChePhamCapTables';

interface Props {
  branches: Branch[];
  initialData?: FarmBaoCaoSoChe | null;
  preferredBranch?: { id_chi_nhanh: string; ten_chi_nhanh: string } | null;
  existingList: FarmBaoCaoSoChe[];
  onClose: () => void;
}

const BaoCaoSoCheForm: React.FC<Props> = ({
  branches,
  initialData,
  preferredBranch,
  existingList,
  onClose,
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
  const tongBuongSoChe = watch('tong_buong_so_che') ?? 0;
  const soLieuMeta = watch('so_lieu_row_meta');
  const donViTinhKpi = useMemo(
    () => deriveDonViTinhSlipFromSoLieuMeta(soLieuMeta),
    [soLieuMeta]
  );
  const { data: bcncList = [] } = useBaoCaoNhanCongList();

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
      maxWidthClass={DRAWER_WIDTH_FORM}
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
            tongBuongSoChe={Number(tongBuongSoChe)}
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

        <FormSection title={t('baoCaoSoChe.form.sectionNsLuongTitle')} icon={<Calculator size={14} />} variant="primary">
          <BaoCaoSoCheBcncKpiReadout
            variant="kpi"
            ngay={ngay ?? ''}
            idChiNhanh={idChiNhanh ?? ''}
            tongBuongSoChe={Number(tongBuongSoChe)}
            bcncList={bcncList}
            donViTinh={donViTinhKpi}
            sttOffset={BCSC_KPI_STT_OFFSET}
          />
        </FormSection>

        <BaoCaoSoChePhamCapFormSection control={control} errors={errors} />
      </form>
    </GenericDrawer>
  );
};

export default BaoCaoSoCheForm;
