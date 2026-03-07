import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Select from '../../../../components/ui/Select';
import { useCreateDangKyGiao } from '../hooks/use-dang-ky-dao-tao';
import { useKhoaDaoTaos } from '@/features/nhan-su/khoa-dao-tao/hooks/use-khoa-dao-tao';
import { useEmployees } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
import { giaoKhoaSchema, type GiaoKhoaFormValues } from '../core/schema';

interface Props {
  onClose: () => void;
  idNguoiGiao: string;
}

const GiaoKhoaForm: React.FC<Props> = ({ onClose, idNguoiGiao }) => {
  const { t } = useTranslation();
  const { data: khoaList = [] } = useKhoaDaoTaos();
  const { data: employees = [] } = useEmployees();
  const createMutation = useCreateDangKyGiao(onClose);

  const {
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<GiaoKhoaFormValues>({
    resolver: zodResolver(giaoKhoaSchema),
    defaultValues: { id_khoa_hoc: '', id_nhan_vien: '' },
  });

  const idKhoaHoc = watch('id_khoa_hoc');
  const idNhanVien = watch('id_nhan_vien');

  const onSubmit = (data: GiaoKhoaFormValues) => {
    createMutation.mutate(
      { data, id_nguoi_giao: idNguoiGiao },
      { onSuccess: () => onClose() }
    );
  };

  const khoaOptions = khoaList.map((k) => ({
    value: k.id,
    label: `${k.ma} - ${k.ten}`,
  }));
  const nhanVienOptions = employees.map((e) => ({
    value: e.id,
    label: e.ho_ten ? `${e.ho_ten} (${e.ma_nhan_vien ?? e.email})` : e.email ?? e.id,
  }));

  const formId = 'giao-khoa-form';
  return (
    <GenericDrawer
      title={t('dangKyDaoTao.form.giaoKhoaTitle')}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId={formId}
          onCancel={onClose}
          isLoading={createMutation.isPending}
          createLabel={t('dangKyDaoTao.giaoKhoa')}
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
            <Select
              label={t('dangKyDaoTao.form.chonNhanVien')}
              options={nhanVienOptions}
              value={idNhanVien}
              onChange={(e) => setValue('id_nhan_vien', e.target.value, { shouldValidate: true })}
              error={errors.id_nhan_vien?.message}
              placeholder={t('dangKyDaoTao.form.chonNhanVienPlaceholder')}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default GiaoKhoaForm;
