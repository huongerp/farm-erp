import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardCheck, ClipboardList, Hash } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import { formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import type { PhieuChecklistListItem } from '../core/list-types';
import { taoPhieuSchema, type TaoPhieuFormValues } from '../core/schema';
import { useCreatePhieu, useMauChoChon } from '../hooks/use-checklist-ban-giao';
import { congNgay, dauTuan } from '../../checklist-mau/core/ve-sinh-tuan';

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

  const idMau = useWatch({ control, name: 'id_mau' });
  const ngay = useWatch({ control, name: 'ngay' });
  const laVeSinh = mauList.find((m) => m.id === idMau)?.loai === 've_sinh_tuan';
  const tuan = laVeSinh && ngay ? dauTuan(ngay) : null;

  const mauOptions = useMemo(
    () =>
      mauList.map((m) => {
        const ten = m.ma ? `${m.ma} — ${m.ten}` : m.ten;
        // Picker gốc trên điện thoại không hiện subLabel → ghi loại vào nhãn để phân biệt mẫu vệ sinh tuần.
        const label = m.loai === 've_sinh_tuan' ? `${ten} (${t('checklistBanGiao.vs.loai')})` : ten;
        return { value: m.id, label, subLabel: m.co_khau_sau ? t('checklistBanGiao.form.coKhauSau') : undefined };
      }),
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
                <div className="space-y-1">
                  <Input
                    {...field}
                    type="date"
                    label={laVeSinh ? t('checklistBanGiao.form.tuan') : t('checklistBanGiao.form.ngay')}
                    required
                    error={errors.ngay?.message}
                  />
                  {tuan && (
                    <p className="m-0 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {t('checklistBanGiao.vs.tuan', { tu: formatYmdToDisplay(tuan), den: formatYmdToDisplay(congNgay(tuan, 6)) })}
                      </span>
                      {' · '}
                      {t('checklistBanGiao.vs.chonNgayTrongTuan')}
                    </p>
                  )}
                </div>
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
