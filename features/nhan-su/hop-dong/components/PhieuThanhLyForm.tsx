import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import Input from '../../../../components/ui/Input';
import { useCreatePhieuThanhLy } from '../hooks/use-hop-dong';
import { phieuThanhLySchema, type PhieuThanhLyFormValues } from '../core/schema';
import type { HopDong } from '../core/types';

const LY_DO_OPTIONS = [
  { value: 'nghi-viec', labelKey: 'hopDong.phieuThanhLy.lyDoNghiViec' },
  { value: 'het-han-hd', labelKey: 'hopDong.phieuThanhLy.lyDoHetHanHD' },
  { value: 'thoa-thuan', labelKey: 'hopDong.phieuThanhLy.lyDoThoaThuan' },
  { value: 'vi-pham', labelKey: 'hopDong.phieuThanhLy.lyDoViPham' },
  { value: 'khac', labelKey: 'hopDong.phieuThanhLy.lyDoKhac' },
];

interface Props {
  hopDong: HopDong;
  onClose: () => void;
  /** Khi mở từ Detail (drawer chồng), truyền 1 để dùng 44rem và z-index cao hơn */
  stackLevel?: number;
}

const PhieuThanhLyForm: React.FC<Props> = ({ hopDong, onClose, stackLevel = 0 }) => {
  const { t } = useTranslation();
  const createMutation = useCreatePhieuThanhLy(onClose);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<PhieuThanhLyFormValues>({
    resolver: zodResolver(phieuThanhLySchema),
    defaultValues: {
      id_hop_dong: hopDong.id,
      ngay_thanh_ly: new Date().toISOString().slice(0, 10),
      ly_do: '',
      ghi_chu: null,
    },
  });

  const lyDoOptions = useMemo(
    () =>
      LY_DO_OPTIONS.map((o) => ({
        value: o.value,
        label: t(o.labelKey),
      })),
    [t]
  );

  const onSubmit: SubmitHandler<PhieuThanhLyFormValues> = (data) => {
    createMutation.mutate({
      id_hop_dong: hopDong.id,
      ngay_thanh_ly: data.ngay_thanh_ly,
      ly_do: data.ly_do,
      ghi_chu: data.ghi_chu?.trim() || null,
    });
  };

  return (
    <GenericDrawer
      title={t('hopDong.phieuThanhLy.title')}
      icon={<FileText size={20} />}
      onClose={onClose}
      stackLevel={stackLevel}
      footer={
        <FormDrawerFooter
          formId="phieu-thanh-ly-form"
          onCancel={onClose}
          isLoading={createMutation.isPending}
          isEdit={false}
          saveLabel={t('common.save')}
          createLabel={t('common.save')}
        />
      }
    >
      <form
        id="phieu-thanh-ly-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <div className="rounded-xl border border-border bg-muted/30 p-3 text-body-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{t('hopDong.table.soHopDong')}:</span>{' '}
            {hopDong.so_hop_dong}
          </p>
          <p className="text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground">{t('hopDong.table.ungVien')}:</span>{' '}
            {hopDong.ten_ung_vien ?? '—'}
          </p>
        </div>

        <FormSection
          title={t('hopDong.phieuThanhLy.title')}
          icon={<FileText size={14} />}
          variant="primary"
        >
          <FormGrid cols={2}>
            <Input
              type="date"
              label={t('hopDong.phieuThanhLy.ngayThanhLy')}
              {...register('ngay_thanh_ly')}
              error={errors.ngay_thanh_ly?.message}
              required
            />
            <Controller
              name="ly_do"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('hopDong.phieuThanhLy.lyDo')}
                  options={[{ value: '', label: t('hopDong.phieuThanhLy.selectLyDo') }, ...lyDoOptions]}
                  placeholder={t('hopDong.phieuThanhLy.selectLyDo')}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={errors.ly_do?.message}
                  required
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('hopDong.ghiChu')}
                placeholder={t('hopDong.ghiChu')}
                rows={3}
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default PhieuThanhLyForm;
