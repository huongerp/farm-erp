/**
 * Form đánh giá phỏng vấn chuyên nghiệp – 5 phần: Thông tin cơ bản, Hard skills, Soft skills, Nhận xét định tính, Kết luận.
 * Dữ liệu lưu trong LichPhongVan.danh_gia_chi_tiet (JSON).
 */
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Award, User, Briefcase, MessageSquare, CheckSquare } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { LichPhongVan } from '../core/types';
import type { LichPhongVanFormValues } from '../core/schema';
import {
  type DanhGiaChiTiet,
  parseDanhGiaChiTiet,
  stringifyDanhGiaChiTiet,
  XEP_HANG_OPTIONS,
  DE_XUAT_OPTIONS,
  SCALE_1_5,
} from '../core/danh-gia-types';
import { useUpdateLichPhongVan } from '../hooks/use-lich-phong-van';

const scaleSchema = z.union([z.number().min(1).max(5), z.null()]);
const danhGiaSchema = z
  .object({
    nguoi_phong_van: z.string().nullable(),
    hard_nghiep_vu: scaleSchema,
    hard_kinh_nghiem: scaleSchema,
    hard_ky_thuat: scaleSchema,
    soft_giao_tiep: scaleSchema,
    soft_tu_duy: scaleSchema,
    soft_van_hoa: scaleSchema,
    soft_tac_phong: scaleSchema,
    diem_manh: z.string().nullable(),
    diem_yeu: z.string().nullable(),
    ky_vong_luong: z.string().nullable(),
    xep_hang_chung: z.string().nullable(),
    de_xuat: z.string().nullable(),
    ghi_chu: z.string().nullable(),
  })
  .refine(
    (d) => d.nguoi_phong_van != null && String(d.nguoi_phong_van).trim() !== '',
    { message: ' ', path: ['nguoi_phong_van'] }
  )
  .refine((d) => d.hard_nghiep_vu != null, { message: ' ', path: ['hard_nghiep_vu'] })
  .refine((d) => d.hard_kinh_nghiem != null, { message: ' ', path: ['hard_kinh_nghiem'] })
  .refine((d) => d.hard_ky_thuat != null, { message: ' ', path: ['hard_ky_thuat'] })
  .refine((d) => d.soft_giao_tiep != null, { message: ' ', path: ['soft_giao_tiep'] })
  .refine((d) => d.soft_tu_duy != null, { message: ' ', path: ['soft_tu_duy'] })
  .refine((d) => d.soft_van_hoa != null, { message: ' ', path: ['soft_van_hoa'] })
  .refine((d) => d.soft_tac_phong != null, { message: ' ', path: ['soft_tac_phong'] })
  .refine((d) => d.xep_hang_chung != null && d.xep_hang_chung !== '', { message: ' ', path: ['xep_hang_chung'] })
  .refine((d) => d.de_xuat != null && d.de_xuat !== '', { message: ' ', path: ['de_xuat'] });

type DanhGiaFormValues = z.infer<typeof danhGiaSchema>;

const emptyForm: DanhGiaFormValues = {
  nguoi_phong_van: null,
  hard_nghiep_vu: null,
  hard_kinh_nghiem: null,
  hard_ky_thuat: null,
  soft_giao_tiep: null,
  soft_tu_duy: null,
  soft_van_hoa: null,
  soft_tac_phong: null,
  diem_manh: null,
  diem_yeu: null,
  ky_vong_luong: null,
  xep_hang_chung: null,
  de_xuat: null,
  ghi_chu: null,
};

function toFormValues(d: DanhGiaChiTiet | null): DanhGiaFormValues {
  if (!d) return emptyForm;
  return {
    nguoi_phong_van: d.nguoi_phong_van ?? null,
    hard_nghiep_vu: d.hard_nghiep_vu ?? null,
    hard_kinh_nghiem: d.hard_kinh_nghiem ?? null,
    hard_ky_thuat: d.hard_ky_thuat ?? null,
    soft_giao_tiep: d.soft_giao_tiep ?? null,
    soft_tu_duy: d.soft_tu_duy ?? null,
    soft_van_hoa: d.soft_van_hoa ?? null,
    soft_tac_phong: d.soft_tac_phong ?? null,
    diem_manh: d.diem_manh ?? null,
    diem_yeu: d.diem_yeu ?? null,
    ky_vong_luong: d.ky_vong_luong ?? null,
    xep_hang_chung: d.xep_hang_chung ?? null,
    de_xuat: d.de_xuat ?? null,
    ghi_chu: d.ghi_chu ?? null,
  };
}

function toDanhGiaChiTiet(v: DanhGiaFormValues): DanhGiaChiTiet {
  return {
    nguoi_phong_van: v.nguoi_phong_van === '' ? null : v.nguoi_phong_van,
    hard_nghiep_vu: v.hard_nghiep_vu ?? null,
    hard_kinh_nghiem: v.hard_kinh_nghiem ?? null,
    hard_ky_thuat: v.hard_ky_thuat ?? null,
    soft_giao_tiep: v.soft_giao_tiep ?? null,
    soft_tu_duy: v.soft_tu_duy ?? null,
    soft_van_hoa: v.soft_van_hoa ?? null,
    soft_tac_phong: v.soft_tac_phong ?? null,
    diem_manh: v.diem_manh === '' ? null : v.diem_manh,
    diem_yeu: v.diem_yeu === '' ? null : v.diem_yeu,
    ky_vong_luong: v.ky_vong_luong === '' ? null : v.ky_vong_luong,
    xep_hang_chung: v.xep_hang_chung === '' ? null : v.xep_hang_chung,
    de_xuat: v.de_xuat === '' ? null : v.de_xuat,
    ghi_chu: v.ghi_chu === '' ? null : v.ghi_chu,
  };
}

interface Props {
  initialData: LichPhongVan;
  onClose: () => void;
  onSuccess?: (updated: LichPhongVan) => void;
}

const LichPhongVanDanhGiaForm: React.FC<Props> = ({ initialData, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateLichPhongVan();

  const parsed = parseDanhGiaChiTiet(initialData.danh_gia_chi_tiet);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DanhGiaFormValues>({
    resolver: zodResolver(danhGiaSchema),
    defaultValues: toFormValues(parsed),
  });

  useEffect(() => {
    reset(toFormValues(parseDanhGiaChiTiet(initialData.danh_gia_chi_tiet)));
  }, [initialData.id, initialData.danh_gia_chi_tiet, reset]);

  const onSubmit: SubmitHandler<DanhGiaFormValues> = (data) => {
    const danhGiaJson = stringifyDanhGiaChiTiet(toDanhGiaChiTiet(data));
    const payload: LichPhongVanFormValues = {
      id_ung_vien: initialData.id_ung_vien,
      so_vong: initialData.so_vong,
      ngay: initialData.ngay,
      gio: initialData.gio,
      hinh_thuc: initialData.hinh_thuc,
      dia_diem: initialData.dia_diem,
      trang_thai: initialData.trang_thai,
      danh_gia_diem_so: initialData.danh_gia_diem_so ?? null,
      danh_gia_nhan_xet: initialData.danh_gia_nhan_xet ?? null,
      ket_qua: initialData.ket_qua ?? null,
      ghi_chu: initialData.ghi_chu ?? null,
      danh_gia_chi_tiet: danhGiaJson,
    };
    updateMutation.mutate(
      { id: initialData.id, data: payload },
      {
        onSuccess: (updated) => {
          onSuccess?.(updated);
          onClose();
        },
      }
    );
  };

  const isLoading = updateMutation.isPending;

  const scaleOptions = SCALE_1_5.map((n) => ({ value: String(n), label: String(n) }));
  const xepHangOptions = XEP_HANG_OPTIONS.map((o) => ({
    value: o.value,
    label: t(o.labelKey),
  }));
  const deXuatOptions = DE_XUAT_OPTIONS.map((o) => ({
    value: o.value,
    label: t(o.labelKey),
  }));

  const ScaleSelect: React.FC<{
    name: keyof DanhGiaFormValues;
    label: string;
    hint?: string;
    required?: boolean;
  }> = ({ name, label, hint, required }) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <Select
            label={label}
            required={required}
            options={[{ value: '', label: `— ${t('lichPhongVan.danhGia.scaleLabel')} —` }, ...scaleOptions]}
            value={field.value != null ? String(field.value) : ''}
            onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
            error={errors[name]?.message}
          />
          {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
        </div>
      )}
    />
  );

  return (
    <GenericDrawer
      title={t('lichPhongVan.danhGiaForm.title')}
      subtitle={`${initialData.ten_ung_vien ?? '—'} · ${t('lichPhongVan.detail.lichColVong')} ${initialData.so_vong}`}
      icon={<Award size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="lich-phong-van-danh-gia-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit
          saveLabel={t('lichPhongVan.form.save')}
          createLabel={t('lichPhongVan.form.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="lich-phong-van-danh-gia-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {/* 1. Thông tin cơ bản */}
        <FormSection
          title={t('lichPhongVan.danhGia.sectionBasic')}
          icon={<User size={14} />}
          variant="primary"
        >
          <FormGrid cols={2}>
            <div className="col-span-2">
              <Input
                label={t('lichPhongVan.danhGia.hoTenUngVien')}
                value={initialData.ten_ung_vien ?? '—'}
                readOnly
                disabled
                className="bg-muted/50"
              />
            </div>
            <Input
              label={t('lichPhongVan.danhGia.viTriUngTuyen')}
              value={initialData.ma_de_xuat ?? '—'}
              readOnly
              disabled
              className="bg-muted/50"
            />
            <Input
              label={t('lichPhongVan.danhGia.ngayPhongVan')}
              value={`${initialData.ngay} – ${initialData.gio}`}
              readOnly
              disabled
              className="bg-muted/50"
            />
            <div className="col-span-2">
              <Input
                label={t('lichPhongVan.danhGia.nguoiPhongVan')}
                placeholder={t('lichPhongVan.danhGia.nguoiPhongVanPlaceholder')}
                required
                {...register('nguoi_phong_van')}
                error={errors.nguoi_phong_van?.message}
              />
            </div>
          </FormGrid>
        </FormSection>

        {/* 2. Hard skills (1-5) */}
        <FormSection
          title={t('lichPhongVan.danhGia.sectionHard')}
          icon={<Briefcase size={14} />}
          variant="primary"
        >
          <FormGrid cols={3}>
            <ScaleSelect
              name="hard_nghiep_vu"
              label={t('lichPhongVan.danhGia.hardNghiepVu')}
              hint={t('lichPhongVan.danhGia.hardNghiepVuHint')}
              required
            />
            <ScaleSelect
              name="hard_kinh_nghiem"
              label={t('lichPhongVan.danhGia.hardKinhNghiem')}
              hint={t('lichPhongVan.danhGia.hardKinhNghiemHint')}
              required
            />
            <ScaleSelect
              name="hard_ky_thuat"
              label={t('lichPhongVan.danhGia.hardKyThuat')}
              hint={t('lichPhongVan.danhGia.hardKyThuatHint')}
              required
            />
          </FormGrid>
        </FormSection>

        {/* 3. Soft skills (1-5) */}
        <FormSection
          title={t('lichPhongVan.danhGia.sectionSoft')}
          icon={<MessageSquare size={14} />}
          variant="primary"
        >
          <FormGrid cols={2}>
            <ScaleSelect
              name="soft_giao_tiep"
              label={t('lichPhongVan.danhGia.softGiaoTiep')}
              hint={t('lichPhongVan.danhGia.softGiaoTiepHint')}
              required
            />
            <ScaleSelect
              name="soft_tu_duy"
              label={t('lichPhongVan.danhGia.softTuDuy')}
              hint={t('lichPhongVan.danhGia.softTuDuyHint')}
              required
            />
            <ScaleSelect
              name="soft_van_hoa"
              label={t('lichPhongVan.danhGia.softVanHoa')}
              hint={t('lichPhongVan.danhGia.softVanHoaHint')}
              required
            />
            <ScaleSelect
              name="soft_tac_phong"
              label={t('lichPhongVan.danhGia.softTacPhong')}
              hint={t('lichPhongVan.danhGia.softTacPhongHint')}
              required
            />
          </FormGrid>
        </FormSection>

        {/* 4. Nhận xét định tính */}
        <FormSection
          title={t('lichPhongVan.danhGia.sectionNhanXet')}
          icon={<MessageSquare size={14} />}
          variant="primary"
        >
          <FormGrid cols={1}>
            <Textarea
              label={t('lichPhongVan.danhGia.diemManh')}
              placeholder={t('lichPhongVan.danhGia.diemManhPlaceholder')}
              {...register('diem_manh')}
              rows={3}
              error={errors.diem_manh?.message}
            />
            <Textarea
              label={t('lichPhongVan.danhGia.diemYeu')}
              placeholder={t('lichPhongVan.danhGia.diemYeuPlaceholder')}
              {...register('diem_yeu')}
              rows={3}
              error={errors.diem_yeu?.message}
            />
            <Input
              label={t('lichPhongVan.danhGia.kyVongLuong')}
              placeholder={t('lichPhongVan.danhGia.kyVongLuongPlaceholder')}
              {...register('ky_vong_luong')}
              error={errors.ky_vong_luong?.message}
            />
          </FormGrid>
        </FormSection>

        {/* 5. Kết luận & Quyết định */}
        <FormSection
          title={t('lichPhongVan.danhGia.sectionKetLuan')}
          icon={<CheckSquare size={14} />}
          variant="primary"
        >
          <FormGrid cols={2}>
            <Controller
              name="xep_hang_chung"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('lichPhongVan.danhGia.xepHangChung')}
                  required
                  options={[{ value: '', label: '—' }, ...xepHangOptions]}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                  error={errors.xep_hang_chung?.message}
                />
              )}
            />
            <Controller
              name="de_xuat"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('lichPhongVan.danhGia.deXuatLabel')}
                  required
                  options={[{ value: '', label: '—' }, ...deXuatOptions]}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                  error={errors.de_xuat?.message}
                />
              )}
            />
            <div className="col-span-2">
              <Textarea
                label={t('lichPhongVan.danhGia.ghiChu')}
                {...register('ghi_chu')}
                rows={2}
                error={errors.ghi_chu?.message}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default LichPhongVanDanhGiaForm;
