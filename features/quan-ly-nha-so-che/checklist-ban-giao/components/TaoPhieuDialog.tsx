import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardCheck, ClipboardList, Hash } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import { getTodayISO } from '../../../../lib/utils';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import type { PhieuChecklistListItem } from '../core/list-types';
import { taoPhieuSchema, type TaoPhieuFormValues } from '../core/schema';
import { useCreatePhieu, useMauChoChon } from '../hooks/use-checklist-ban-giao';

interface Props {
  onClose: () => void;
  onCreated: (phieu: PhieuChecklistListItem) => void;
}

const DEFAULT: TaoPhieuFormValues = {
  id_mau: '',
  ngay: getTodayISO(),
  ca: '',
  khu_vuc: '',
  day_chuyen: '',
  id_chi_nhanh: '',
  ghi_chu: '',
};

const TaoPhieuDialog: React.FC<Props> = ({ onClose, onCreated }) => {
  const { t } = useTranslation();
  const createMutation = useCreatePhieu(onCreated);
  const { data: mauList = [] } = useMauChoChon();
  const { data: branches = [] } = useBranches();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaoPhieuFormValues>({
    resolver: zodResolver(taoPhieuSchema) as never,
    defaultValues: DEFAULT,
  });

  const mauOptions = useMemo(
    () => mauList.map((m) => ({ value: m.id, label: m.ma ? `${m.ma} — ${m.ten}` : m.ten, subLabel: m.co_khau_sau ? t('checklistBanGiao.form.coKhauSau') : undefined })),
    [mauList, t]
  );

  const chiNhanhOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.ten_chi_nhanh })),
    [branches]
  );

  const onSubmit: SubmitHandler<TaoPhieuFormValues> = (values) => {
    createMutation.mutate(values);
  };

  const pending = isSubmitting || createMutation.isPending;

  return (
    <GenericDrawer
      title={t('checklistBanGiao.form.title')}
      subtitle={t('checklistBanGiao.form.subtitle')}
      icon={<ClipboardList className="text-primary" size={22} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="cl-tao-phieu-form"
          onCancel={onClose}
          isEdit={false}
          isLoading={pending}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id="cl-tao-phieu-form" className="space-y-6 pb-4" onSubmit={handleSubmit(onSubmit)}>
        <FormSection title={t('checklistBanGiao.form.thongTin')}>
          <FormGrid cols={2}>
            <div className="sm:col-span-2">
              <Controller
                name="id_mau"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('checklistBanGiao.form.idMau')}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    options={mauOptions}
                    required
                    error={errors.id_mau?.message}
                    placeholder={t('checklistBanGiao.form.chonMauPh')}
                  />
                )}
              />
            </div>
            <Controller
              name="ngay"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="date"
                  label={t('checklistBanGiao.form.ngay')}
                  required
                  error={errors.ngay?.message}
                />
              )}
            />
            <Controller
              name="ca"
              control={control}
              render={({ field }) => (
                <Input {...field} label={t('checklistBanGiao.form.ca')} placeholder={t('checklistBanGiao.form.caPh')} icon={<Hash size={12} />} error={errors.ca?.message} />
              )}
            />
            <Controller
              name="khu_vuc"
              control={control}
              render={({ field }) => (
                <Input {...field} label={t('checklistBanGiao.form.khuVuc')} error={errors.khu_vuc?.message} />
              )}
            />
            <Controller
              name="day_chuyen"
              control={control}
              render={({ field }) => (
                <Input {...field} label={t('checklistBanGiao.form.dayChuyen')} error={errors.day_chuyen?.message} />
              )}
            />
            <Controller
              name="id_chi_nhanh"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('checklistBanGiao.form.idChiNhanh')}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  options={chiNhanhOptions}
                  error={errors.id_chi_nhanh?.message}
                />
              )}
            />
            <Controller
              name="ghi_chu"
              control={control}
              render={({ field }) => (
                <Textarea {...field} value={field.value ?? ''} rows={2} label={t('checklistBanGiao.form.ghiChu')} error={errors.ghi_chu?.message} />
              )}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('checklistBanGiao.form.mau')}>
          <p className="text-xs text-muted-foreground m-0">
            <ClipboardCheck size={12} className="inline -mt-0.5 mr-1" />
            {t('checklistBanGiao.form.mauHint')}
          </p>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default TaoPhieuDialog;
