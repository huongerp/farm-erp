import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_FORM } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { baoCaoKetQuaFormSchema, type BaoCaoKetQuaFormValues } from '../core/schema';
import type { KetQuaBaoCaoKpi } from '../core/types';
import { TRANG_THAI_BAO_CAO_LABEL_KEYS, TRANG_THAI_BAO_CAO_VALUES } from '../core/constants';
import type { TrangThaiBaoCaoKpi } from '../core/types';
import type { TieuChiKpi } from '../../tieu-chi-kpi/core/types';
import { useCreateBaoCao, useUpdateBaoCao } from '../hooks/use-theo-doi-danh-gia';

interface Department {
  id: string;
  ten_phong_ban: string;
}

interface Props {
  initialData?: KetQuaBaoCaoKpi | null;
  fixedTieuChiId?: string | null;
  fixedPhongBanId?: string | null;
  tieuChiList: TieuChiKpi[];
  phongBanList: Department[];
  onClose: () => void;
}

const TheoDoiDanhGiaFormDrawer: React.FC<Props> = ({
  initialData,
  fixedTieuChiId,
  fixedPhongBanId,
  tieuChiList,
  phongBanList,
  onClose,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateBaoCao(onClose);
  const updateMutation = useUpdateBaoCao(onClose);

  const tieuChiOptions = useMemo(
    () => tieuChiList.map((tc) => ({ value: tc.id, label: tc.ten })),
    [tieuChiList]
  );

  const phongBanOptions = useMemo(
    () => phongBanList.map((pb) => ({ value: pb.id, label: pb.ten_phong_ban })),
    [phongBanList]
  );

  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_BAO_CAO_VALUES.map((s) => ({
        value: s,
        label: t(TRANG_THAI_BAO_CAO_LABEL_KEYS[s]),
      })),
    [t]
  );

  const currentYear = new Date().getFullYear();
  const namOptions = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map((y) => ({
        value: String(y),
        label: String(y),
      })),
    [currentYear]
  );

  const quyOptions = useMemo(
    () => [1, 2, 3, 4].map((q) => ({ value: String(q), label: `Q${q}` })),
    []
  );

  const thangOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
        value: String(m),
        label: String(m),
      })),
    []
  );

  const defaultValues: Partial<BaoCaoKetQuaFormValues> = useMemo(
    () =>
      initialData
        ? {
            id_tieu_chi: initialData.id_tieu_chi,
            id_phong_ban: initialData.id_phong_ban,
            ky_nam: initialData.ky_nam,
            ky_quy: initialData.ky_quy ?? null,
            ky_thang: initialData.ky_thang ?? null,
            gia_tri_thuc_te: initialData.gia_tri_thuc_te,
            trang_thai: initialData.trang_thai,
            ghi_chu: initialData.ghi_chu ?? '',
          }
        : {
            id_tieu_chi: fixedTieuChiId ?? tieuChiOptions[0]?.value ?? '',
            id_phong_ban: fixedPhongBanId ?? phongBanOptions[0]?.value ?? '',
            ky_nam: currentYear,
            ky_quy: null,
            ky_thang: null,
            gia_tri_thuc_te: 0,
            trang_thai: 'nhap' as TrangThaiBaoCaoKpi,
            ghi_chu: '',
          },
    [
      initialData,
      fixedTieuChiId,
      fixedPhongBanId,
      tieuChiOptions,
      phongBanOptions,
      currentYear,
    ]
  );

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<
    BaoCaoKetQuaFormValues
  >({
    resolver: zodResolver(baoCaoKetQuaFormSchema) as any,
    defaultValues,
  });

  const idTieuChi = watch('id_tieu_chi');
  const selectedTieuChi = useMemo(
    () => tieuChiList.find((tc) => tc.id === idTieuChi),
    [tieuChiList, idTieuChi]
  );
  const showKyQuy = selectedTieuChi?.tan_suat === 'quy';
  const showKyThang = selectedTieuChi?.tan_suat === 'thang';

  useEffect(() => {
    reset(defaultValues);
  }, [initialData?.id, fixedTieuChiId, fixedPhongBanId, reset, JSON.stringify(defaultValues)]);

  const onSubmit: SubmitHandler<BaoCaoKetQuaFormValues> = (values) => {
    const payload = {
      ...values,
      ky_quy: showKyQuy ? (values.ky_quy ?? null) : null,
      ky_thang: showKyThang ? (values.ky_thang ?? null) : null,
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const formId = 'theo-doi-danh-gia-form';

  return (
    <GenericDrawer
      title={isEdit ? t('theoDoiDanhGia.form.editTitle') : t('theoDoiDanhGia.form.createTitle')}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId={formId}
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
        />
      }
    >
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
        <div className="flex-1 min-h-0 overflow-auto px-1">
          <FormSection title={t('theoDoiDanhGia.form.sectionBasic')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="id_tieu_chi"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('theoDoiDanhGia.form.tieuChi')}
                    options={tieuChiOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('theoDoiDanhGia.form.tieuChiHint')}
                    required
                    disabled={!!fixedTieuChiId}
                  />
                )}
              />
              <Controller
                name="id_phong_ban"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('theoDoiDanhGia.form.phongBan')}
                    options={phongBanOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('theoDoiDanhGia.form.phongBanHint')}
                    required
                    disabled={!!fixedPhongBanId}
                  />
                )}
              />
              <Controller
                name="ky_nam"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('theoDoiDanhGia.form.kyNam')}
                    options={namOptions}
                    value={String(field.value)}
                    onChange={(v) => field.onChange(v ? Number(v) : currentYear)}
                    required
                  />
                )}
              />
              {showKyQuy && (
                <Controller
                  name="ky_quy"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t('theoDoiDanhGia.form.kyQuy')}
                      options={quyOptions}
                      value={field.value != null ? String(field.value) : ''}
                      onChange={(v) => field.onChange(v ? Number(v) : null)}
                    />
                  )}
                />
              )}
              {showKyThang && (
                <Controller
                  name="ky_thang"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t('theoDoiDanhGia.form.kyThang')}
                      options={thangOptions}
                      value={field.value != null ? String(field.value) : ''}
                      onChange={(v) => field.onChange(v ? Number(v) : null)}
                    />
                  )}
                />
              )}
              <Controller
                name="gia_tri_thuc_te"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    label={t('theoDoiDanhGia.form.giaTriThucTe')}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    error={errors.gia_tri_thuc_te?.message}
                    required
                  />
                )}
              />
              <Controller
                name="trang_thai"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('theoDoiDanhGia.form.trangThai')}
                    options={trangThaiOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <Controller
              name="ghi_chu"
              control={control}
              render={({ field }) => (
                <Textarea
                  label={t('theoDoiDanhGia.form.ghiChu')}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  className="mt-3"
                  rows={3}
                />
              )}
            />
          </FormSection>
        </div>
      </form>
    </GenericDrawer>
  );
};

export default TheoDoiDanhGiaFormDrawer;
