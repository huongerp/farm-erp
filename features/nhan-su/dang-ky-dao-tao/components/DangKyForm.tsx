import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Select from '../../../../components/ui/Select';
import { useCreateDangKyTuDangKy } from '../hooks/use-dang-ky-dao-tao';
import { useKhoaMoDangKy } from '../hooks/use-dang-ky-dao-tao';
import { dangKyTuDangKySchema, type DangKyTuDangKyFormValues } from '../core/schema';

interface Props {
  onClose: () => void;
  idNhanVien: string;
  prefillIdKhoaHoc?: string | null;
  /** Chức vụ user để lọc khóa mở đăng ký theo phân quyền */
  idChucVuUser?: string[] | null;
}

const DangKyForm: React.FC<Props> = ({ onClose, idNhanVien, prefillIdKhoaHoc, idChucVuUser }) => {
  const { t } = useTranslation();
  const { data: khoaList = [] } = useKhoaMoDangKy(idChucVuUser ?? undefined);
  const createMutation = useCreateDangKyTuDangKy(onClose);

  const {
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<DangKyTuDangKyFormValues>({
    resolver: zodResolver(dangKyTuDangKySchema),
    defaultValues: { id_khoa_hoc: prefillIdKhoaHoc ?? '' },
  });

  const idKhoaHoc = watch('id_khoa_hoc');

  useEffect(() => {
    if (prefillIdKhoaHoc) setValue('id_khoa_hoc', prefillIdKhoaHoc);
  }, [prefillIdKhoaHoc, setValue]);

  const onSubmit = (data: DangKyTuDangKyFormValues) => {
    createMutation.mutate(
      { data, id_nhan_vien: idNhanVien },
      { onSuccess: () => onClose() }
    );
  };

  const khoaOptions = khoaList.map((k) => ({
    value: k.id,
    label: `${k.ma} - ${k.ten}`,
  }));

  const formId = 'dang-ky-form';
  return (
    <GenericDrawer
      title={t('dangKyDaoTao.form.dangKyTitle')}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId={formId}
          onCancel={onClose}
          isLoading={createMutation.isPending}
          createLabel={t('dangKyDaoTao.dangKy')}
        />
      }
    >
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('dangKyDaoTao.form.thongTin')}>
          <FormGrid>
            <Select
              label={t('dangKyDaoTao.form.chonKhoa')}
              options={khoaOptions}
              value={idKhoaHoc}
              onChange={(e) => setValue('id_khoa_hoc', e.target.value, { shouldValidate: true })}
              error={errors.id_khoa_hoc?.message}
              placeholder={t('dangKyDaoTao.form.chonKhoaPlaceholder')}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DangKyForm;
