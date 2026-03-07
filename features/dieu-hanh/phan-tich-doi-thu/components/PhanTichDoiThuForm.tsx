import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Globe, FileText, BarChart3, Tag } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import SingleImageInput from '../../../../components/ui/SingleImageInput';
import { doiThuFormSchema, type DoiThuFormValues } from '../core/schema';
import type { DoiThu } from '../core/types';
import {
  LOAI_DOI_THU,
  LOAI_DOI_THU_LABELS,
  QUY_MO_OPTIONS,
  QUY_MO_LABELS,
  PHAN_KHUC_OPTIONS,
  PHAN_KHUC_LABELS,
} from '../core/constants';
import type { LoaiDoiThu } from '../core/constants';
import { useCreateDoiThu, useUpdateDoiThu } from '../hooks/use-phan-tich-doi-thu';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

interface Props {
  initialData?: DoiThu | null;
  onClose: () => void;
}

const loaiOptions = LOAI_DOI_THU.map((v) => ({
  value: v,
  label: LOAI_DOI_THU_LABELS[v as LoaiDoiThu],
}));

const PhanTichDoiThuForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateDoiThu(onClose);
  const updateMutation = useUpdateDoiThu(onClose);

  const defaultValues: Partial<DoiThuFormValues> = {
    ten_doi_thu: '',
    logo: null,
    phan_loai: 'truc_tiep',
    diem_manh_nhat: '',
    website: '',
    fanpage: '',
    ghi_chu_nhan_dang: '',
    ten_cong_ty: '',
    mst: '',
    dia_chi: '',
    hotline: '',
    youtube: '',
    facebook: '',
    quy_mo: '',
    nam_thanh_lap: null,
    diem_manh: [] as string[],
    diem_yeu: [] as string[],
    phan_khuc: '',
    san_pham: '',
    linh_vuc_kinh_doanh: '',
    thi_truong_muc_tieu: '',
    so_nhan_vien: '',
    von_dieu_le: '',
    thi_phan: '',
    nguon_goc: '',
    nam_hoat_dong: '',
    dinh_vi: '',
    cach_thuc_hoat_dong: '',
    kenh_phan_phoi: '',
    chien_luoc_gia: '',
    marketing_truyen_thong: '',
    the_manh: '',
    tiktok: '',
    link_khac: '',
    ghi_chu_khac: '',
  };

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<DoiThuFormValues>({
    resolver: zodResolver(doiThuFormSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ten_doi_thu: initialData.ten_doi_thu,
        logo: initialData.logo ?? null,
        phan_loai: initialData.phan_loai,
        diem_manh_nhat: initialData.diem_manh_nhat ?? '',
        website: initialData.website ?? '',
        fanpage: initialData.fanpage ?? '',
        ghi_chu_nhan_dang: initialData.ghi_chu_nhan_dang ?? '',
        ten_cong_ty: initialData.ten_cong_ty ?? '',
        mst: initialData.mst ?? '',
        dia_chi: initialData.dia_chi ?? '',
        hotline: initialData.hotline ?? '',
        youtube: initialData.youtube ?? '',
        facebook: initialData.facebook ?? '',
        quy_mo: initialData.quy_mo ?? '',
        nam_thanh_lap: initialData.nam_thanh_lap ?? null,
        diem_manh: initialData.diem_manh ?? [],
        diem_yeu: initialData.diem_yeu ?? [],
        phan_khuc: initialData.phan_khuc ?? '',
        san_pham: initialData.san_pham ?? '',
        linh_vuc_kinh_doanh: initialData.linh_vuc_kinh_doanh ?? '',
        thi_truong_muc_tieu: initialData.thi_truong_muc_tieu ?? '',
        so_nhan_vien: initialData.so_nhan_vien ?? '',
        von_dieu_le: initialData.von_dieu_le ?? '',
        thi_phan: initialData.thi_phan ?? '',
        nguon_goc: initialData.nguon_goc ?? '',
        nam_hoat_dong: initialData.nam_hoat_dong ?? '',
        dinh_vi: initialData.dinh_vi ?? '',
        cach_thuc_hoat_dong: initialData.cach_thuc_hoat_dong ?? '',
        kenh_phan_phoi: initialData.kenh_phan_phoi ?? '',
        chien_luoc_gia: initialData.chien_luoc_gia ?? '',
        marketing_truyen_thong: initialData.marketing_truyen_thong ?? '',
        the_manh: initialData.the_manh ?? '',
        tiktok: initialData.tiktok ?? '',
        link_khac: initialData.link_khac ?? '',
        ghi_chu_khac: initialData.ghi_chu_khac ?? '',
      });
    } else {
      reset(defaultValues);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<DoiThuFormValues> = (data) => {
    const namThanhLap =
      data.nam_thanh_lap === '' || data.nam_thanh_lap == null
        ? null
        : Number(data.nam_thanh_lap);
    const sanitized = {
      ...data,
      website: data.website?.trim() || '',
      fanpage: data.fanpage?.trim() || '',
      youtube: data.youtube?.trim() || '',
      facebook: data.facebook?.trim() || '',
      nam_thanh_lap: Number.isNaN(namThanhLap) || namThanhLap < 1900 ? null : namThanhLap,
      tiktok: data.tiktok?.trim() || '',
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitized });
    } else {
      createMutation.mutate(sanitized);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('phanTichDoiThu.form.editTitle') : t('phanTichDoiThu.form.createTitle')}
      icon={<Building2 size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="phan-tich-doi-thu-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('phanTichDoiThu.form.save')}
          createLabel={t('phanTichDoiThu.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="phan-tich-doi-thu-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('phanTichDoiThu.detail.hoSo')} icon={<Building2 size={14} />} variant="primary">
          <div className="flex justify-center mb-4">
            <Controller
              name="logo"
              control={control}
              render={({ field }) => (
                <SingleImageInput
                  label={t('phanTichDoiThu.form.logo')}
                  value={field.value}
                  onChange={field.onChange}
                  shape="rounded"
                  maxSizeMB={2}
                  className="w-[120px]"
                />
              )}
            />
          </div>
          <FormGrid cols={2}>
            <Input
              label={t('phanTichDoiThu.form.tenDoiThu')}
              placeholder={t('phanTichDoiThu.form.tenDoiThuPlaceholder')}
              required
              {...register('ten_doi_thu')}
              error={errors.ten_doi_thu?.message}
            />
            <Controller
              name="phan_loai"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('phanTichDoiThu.form.phanLoai')}
                  options={loaiOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value as LoaiDoiThu)}
                  required
                  error={errors.phan_loai?.message}
                  icon={<Tag size={14} className="text-muted-foreground" />}
                />
              )}
            />
            <div className="col-span-2">
              <Input
                label={t('phanTichDoiThu.form.diemManhNhat')}
                placeholder={t('phanTichDoiThu.form.diemManhNhatPlaceholder')}
                {...register('diem_manh_nhat')}
                error={errors.diem_manh_nhat?.message}
              />
            </div>
            <Input
              label={t('phanTichDoiThu.form.website')}
              placeholder="https://..."
              icon={<Globe size={12} />}
              {...register('website')}
              error={errors.website?.message}
            />
            <Input
              label={t('phanTichDoiThu.form.fanpage')}
              placeholder="https://facebook.com/..."
              {...register('fanpage')}
              error={errors.fanpage?.message}
            />
            <Input
              label={t('phanTichDoiThu.form.tenCongTy')}
              {...register('ten_cong_ty')}
            />
            <Input
              label={t('phanTichDoiThu.form.mst')}
              {...register('mst')}
            />
            <div className="col-span-2">
              <Input
                label={t('phanTichDoiThu.form.diaChi')}
                {...register('dia_chi')}
              />
            </div>
            <Input
              label={t('phanTichDoiThu.form.hotline')}
              {...register('hotline')}
            />
            <Input
              label={t('phanTichDoiThu.form.youtube')}
              placeholder="https://youtube.com/..."
              {...register('youtube')}
            />
            <Input
              label={t('phanTichDoiThu.form.facebook')}
              placeholder="https://facebook.com/..."
              {...register('facebook')}
            />
            <Input
              label={t('phanTichDoiThu.form.tiktok')}
              placeholder="https://tiktok.com/..."
              {...register('tiktok')}
              error={errors.tiktok?.message}
            />
            <div className="col-span-2">
              <Textarea
                label={t('phanTichDoiThu.form.linkKhac')}
                placeholder={t('phanTichDoiThu.form.linkKhacPlaceholder')}
                rows={2}
                {...register('link_khac')}
              />
            </div>
            <div className="col-span-2">
              <Textarea
                label={t('phanTichDoiThu.form.ghiChuNhanDang')}
                placeholder={t('phanTichDoiThu.form.ghiChuPlaceholder')}
                icon={<FileText size={12} />}
                rows={2}
                {...register('ghi_chu_nhan_dang')}
                error={errors.ghi_chu_nhan_dang?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
        <FormSection title={t('phanTichDoiThu.form.thongTinMoRong')} icon={<BarChart3 size={14} />}>
          <FormGrid cols={2}>
            <Controller
              name="quy_mo"
              control={control}
              render={({ field }) => {
                const baseOptions = [
                  { value: '', label: t('phanTichDoiThu.form.selectQuyMo') },
                  ...QUY_MO_OPTIONS.map((v) => ({ value: v, label: QUY_MO_LABELS[v] })),
                ];
                const options =
                  field.value && !QUY_MO_OPTIONS.includes(field.value as any)
                    ? [...baseOptions, { value: field.value, label: field.value }]
                    : baseOptions;
                return (
                  <Select
                    label={t('phanTichDoiThu.form.quyMo')}
                    options={options}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || '')}
                  />
                );
              }}
            />
            <Input
              type="number"
              label={t('phanTichDoiThu.form.namThanhLap')}
              placeholder="VD: 2010"
              {...register('nam_thanh_lap')}
              error={errors.nam_thanh_lap?.message}
            />
            <Input
              label={t('phanTichDoiThu.form.thiPhan')}
              placeholder="VD: 15%"
              {...register('thi_phan')}
            />
            <Input
              label={t('phanTichDoiThu.form.nguonGoc')}
              placeholder="VD: Việt Nam, Mỹ"
              {...register('nguon_goc')}
            />
            <Input
              label={t('phanTichDoiThu.form.namHoatDong')}
              placeholder={t('phanTichDoiThu.form.namHoatDongPlaceholder')}
              {...register('nam_hoat_dong')}
            />
            <Controller
              name="phan_khuc"
              control={control}
              render={({ field }) => {
                const baseOptions = [
                  { value: '', label: t('phanTichDoiThu.form.selectPhanKhuc') },
                  ...PHAN_KHUC_OPTIONS.map((v) => ({ value: v, label: PHAN_KHUC_LABELS[v] })),
                ];
                const options =
                  field.value && !PHAN_KHUC_OPTIONS.includes(field.value as any)
                    ? [...baseOptions, { value: field.value, label: field.value }]
                    : baseOptions;
                return (
                  <Select
                    label={t('phanTichDoiThu.form.phanKhuc')}
                    options={options}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || '')}
                  />
                );
              }}
            />
            <div className="col-span-2">
              <Input
                label={t('phanTichDoiThu.form.dinhVi')}
                placeholder="Định vị thương hiệu, phân khúc..."
                {...register('dinh_vi')}
              />
            </div>
            <div className="col-span-2">
              <Textarea
                label={t('phanTichDoiThu.form.cachThucHoatDong')}
                rows={2}
                {...register('cach_thuc_hoat_dong')}
              />
            </div>
            <div className="col-span-2">
              <Textarea
                label={t('phanTichDoiThu.form.kenhPhanPhoi')}
                rows={2}
                {...register('kenh_phan_phoi')}
              />
            </div>
            <div className="col-span-2">
              <Textarea
                label={t('phanTichDoiThu.form.chienLuocGia')}
                rows={2}
                {...register('chien_luoc_gia')}
              />
            </div>
            <div className="col-span-2">
              <Textarea
                label={t('phanTichDoiThu.form.marketingTruyenThong')}
                rows={2}
                {...register('marketing_truyen_thong')}
              />
            </div>
            <div className="col-span-2">
              <Textarea
                label={t('phanTichDoiThu.form.theManh')}
                rows={3}
                {...register('the_manh')}
              />
            </div>
            <Input
              label={t('phanTichDoiThu.form.linhVucKinhDoanh')}
              {...register('linh_vuc_kinh_doanh')}
            />
            <div className="col-span-2">
              <Textarea
                label={t('phanTichDoiThu.form.sanPham')}
                placeholder={t('phanTichDoiThu.form.sanPhamPlaceholder')}
                rows={2}
                {...register('san_pham')}
              />
            </div>
            <Input
              label={t('phanTichDoiThu.form.thiTruongMucTieu')}
              {...register('thi_truong_muc_tieu')}
            />
            <Input
              label={t('phanTichDoiThu.form.soNhanVien')}
              placeholder="VD: 50-100"
              {...register('so_nhan_vien')}
            />
            <Input
              label={t('phanTichDoiThu.form.vonDieuLe')}
              {...register('von_dieu_le')}
            />
            <div className="col-span-2">
              <Textarea
                label={t('phanTichDoiThu.form.ghiChuKhac')}
                rows={3}
                {...register('ghi_chu_khac')}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default PhanTichDoiThuForm;
