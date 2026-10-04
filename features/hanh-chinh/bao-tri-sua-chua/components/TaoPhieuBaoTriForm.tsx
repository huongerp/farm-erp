import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench, FileText } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import NumberInput from '../../../../components/ui/NumberInput';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { phieuBaoTriSuaChuaSchema, type PhieuBaoTriSuaChuaFormValues } from '../core/schema';
import { useCreatePhieuBaoTri, useUpdatePhieuBaoTri } from '../hooks/use-bao-tri-sua-chua';
import { useTaiSanList } from '../../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import { useLoaiChiPhiList } from '../../thiet-lap-tai-san/hooks/use-loai-chi-phi';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useDoiTacRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { useAuthStore } from '../../../../store/useStore';
import { TRANG_THAI, TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { TRANG_THAI_OPTIONS, getHangMucLabel } from '../core/constants';
import { thongTinDuyet } from '../core/duyet';
import type { PhieuBaoTriSuaChua } from '../core/types';
import type { LoaiChiPhi } from '../../thiet-lap-tai-san/core/types';
import type { TFunction } from 'i18next';

const DEFAULT_VALUES: PhieuBaoTriSuaChuaFormValues = {
  ngay: new Date().toISOString().slice(0, 10),
  id_chi_nhanh: '',
  id_tai_san: '',
  id_hang_muc: '',
  mo_ta: '',
  so_tien: 0,
  id_nha_cung_cap: '',
  ghi_chu: null,
  trang_thai: undefined,
};

function resolveTenHangMuc(id: string, loai: LoaiChiPhi[], t: TFunction): string {
  const found = loai.find((l) => l.id === id);
  if (found) return found.ten;
  return getHangMucLabel(id, t);
}

interface Props {
  onClose: () => void;
  defaultTaiSanId?: string;
  initialData?: PhieuBaoTriSuaChua | null;
  onSuccessAfterEdit?: (item: PhieuBaoTriSuaChua) => void;
}

const RequiredStar = () => <span className="text-destructive ml-0.5">*</span>;

const TaoPhieuBaoTriForm: React.FC<Props> = ({ onClose, defaultTaiSanId, initialData, onSuccessAfterEdit }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? '';
  const isEdit = !!initialData;
  const createMutation = useCreatePhieuBaoTri(onClose);
  const updateMutation = useUpdatePhieuBaoTri((updatedItem) => {
    onClose();
    if (updatedItem) onSuccessAfterEdit?.(updatedItem);
  });
  const { data: assets = [] } = useTaiSanList();
  const { data: loaiChiPhi = [] } = useLoaiChiPhiList();
  const { data: branches = [] } = useBranches();
  const { data: nhaCungCapList = [] } = useDoiTacRefQuery('nha_cung_cap');

  const activeLoai = React.useMemo(
    () => loaiChiPhi.filter((l) => l.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG),
    [loaiChiPhi]
  );
  const firstLoaiId = activeLoai[0]?.id ?? '';

  const defaultValuesFromData = initialData
    ? {
        ngay: initialData.ngay,
        id_chi_nhanh: initialData.id_chi_nhanh ?? '',
        id_tai_san: initialData.id_tai_san,
        id_hang_muc: initialData.id_hang_muc,
        mo_ta: initialData.mo_ta,
        so_tien: initialData.so_tien,
        id_nha_cung_cap: initialData.id_nha_cung_cap ?? '',
        ghi_chu: initialData.ghi_chu ?? null,
        trang_thai: initialData.trang_thai,
      }
    : { ...DEFAULT_VALUES, id_tai_san: defaultTaiSanId ?? '' };

  const { register, handleSubmit, formState: { errors, isDirty }, control, setValue, getValues } = useForm<PhieuBaoTriSuaChuaFormValues>({
    resolver: zodResolver(phieuBaoTriSuaChuaSchema),
    defaultValues: defaultValuesFromData,
  });

  React.useEffect(() => {
    if (isEdit || !firstLoaiId) return;
    if (!getValues('id_hang_muc')) setValue('id_hang_muc', firstLoaiId);
  }, [isEdit, firstLoaiId, getValues, setValue]);

  const idChiNhanh = useWatch({ control, name: 'id_chi_nhanh' });
  const idTaiSan = useWatch({ control, name: 'id_tai_san' });

  const chiNhanhCuaTaiSan = React.useCallback(
    (id: string) => assets.find((a) => a.id === id)?.id_chi_nhanh ?? null,
    [assets]
  );

  // Mở form với tài sản có sẵn (từ chi tiết tài sản / phiếu cũ chưa lưu chi nhánh): điền chi nhánh theo tài sản.
  React.useEffect(() => {
    if (getValues('id_chi_nhanh') || !idTaiSan) return;
    const cn = chiNhanhCuaTaiSan(idTaiSan);
    if (cn) setValue('id_chi_nhanh', cn);
  }, [idTaiSan, chiNhanhCuaTaiSan, getValues, setValue]);

  const chiNhanhOptions = React.useMemo(() => {
    const base = branches
      .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG || b.id === initialData?.id_chi_nhanh)
      .map((b) => ({ value: b.id, label: b.ten_chi_nhanh, subLabel: b.ma_chi_nhanh || undefined }));
    if (initialData?.id_chi_nhanh && !base.some((o) => o.value === initialData.id_chi_nhanh)) {
      return [{ value: initialData.id_chi_nhanh, label: initialData.ten_chi_nhanh ?? initialData.id_chi_nhanh }, ...base];
    }
    return base;
  }, [branches, initialData]);

  /** Đã chọn chi nhánh thì chỉ hiện tài sản của chi nhánh đó (luôn giữ tài sản đang chọn). */
  const assetOptions = React.useMemo(
    () => assets
      .filter((a) => !idChiNhanh || a.id_chi_nhanh === idChiNhanh || a.id === idTaiSan)
      .map((a) => ({
        value: a.id,
        label: `${a.ma_tai_san} - ${a.ten_tai_san}`,
        subLabel: a.ten_noi_luu ?? undefined,
      })),
    [assets, idChiNhanh, idTaiSan]
  );

  const nhaCungCapOptions = React.useMemo(() => {
    const base = nhaCungCapList
      .filter((d) => d.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG || d.id === initialData?.id_nha_cung_cap)
      .map((d) => ({ value: d.id, label: `${d.ma_ncc} - ${d.ten_ncc}` }));
    if (initialData?.id_nha_cung_cap && !base.some((o) => o.value === initialData.id_nha_cung_cap)) {
      return [{ value: initialData.id_nha_cung_cap, label: initialData.ten_nha_cung_cap ?? initialData.id_nha_cung_cap }, ...base];
    }
    return base;
  }, [nhaCungCapList, initialData]);

  const handleChiNhanhChange = (value: string) => {
    const cnTaiSan = idTaiSan ? chiNhanhCuaTaiSan(idTaiSan) : null;
    if (value && cnTaiSan && cnTaiSan !== value) setValue('id_tai_san', '', { shouldDirty: true });
  };

  const handleTaiSanChange = (value: string) => {
    const cn = value ? chiNhanhCuaTaiSan(value) : null;
    if (cn && cn !== getValues('id_chi_nhanh')) setValue('id_chi_nhanh', cn, { shouldDirty: true, shouldValidate: true });
  };

  const hangMucOptions = React.useMemo(() => {
    const base = activeLoai.map((l) => ({
      value: l.id,
      label: `${l.ten} (${l.ma})`,
    }));
    if (initialData?.id_hang_muc && !base.some((o) => o.value === initialData.id_hang_muc)) {
      const label =
        initialData.ten_hang_muc ?? getHangMucLabel(initialData.id_hang_muc, t);
      return [{ value: initialData.id_hang_muc, label }, ...base];
    }
    return base;
  }, [activeLoai, initialData, t]);

  const trangThaiOptions = React.useMemo(
    () => TRANG_THAI_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  );

  const payload = (data: PhieuBaoTriSuaChuaFormValues) => {
    const ten_hang_muc = resolveTenHangMuc(data.id_hang_muc, loaiChiPhi, t);
    const base = {
      ngay: data.ngay,
      id_chi_nhanh: data.id_chi_nhanh,
      ten_chi_nhanh: branches.find((b) => b.id === data.id_chi_nhanh)?.ten_chi_nhanh ?? initialData?.ten_chi_nhanh ?? null,
      id_tai_san: data.id_tai_san,
      id_hang_muc: data.id_hang_muc,
      ten_hang_muc,
      mo_ta: data.mo_ta.trim(),
      so_tien: Number(data.so_tien) || 0,
      id_nha_cung_cap: data.id_nha_cung_cap || null,
      ten_nha_cung_cap: data.id_nha_cung_cap
        ? (nhaCungCapList.find((d) => d.id === data.id_nha_cung_cap)?.ten_ncc ?? initialData?.ten_nha_cung_cap ?? null)
        : null,
      ghi_chu: data.ghi_chu?.trim() || null,
    };
    if (isEdit) {
      return {
        ...base,
        trang_thai: data.trang_thai,
        duyet: thongTinDuyet(initialData?.trang_thai, data.trang_thai, {
          id: currentUserId,
          hoTen: user?.ho_va_ten?.trim() || user?.full_name?.trim() || null,
        }, new Date()),
      };
    }
    return base;
  };

  const onSubmit: SubmitHandler<PhieuBaoTriSuaChuaFormValues> = (data) => {
    const body = payload(data);
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: body });
    } else {
      if (!currentUserId) return;
      const tenNguoiTao = user?.ho_va_ten?.trim() || user?.full_name?.trim() || null;
      createMutation.mutate({ data: body, id_nguoi_tao: currentUserId, ten_nguoi_tao: tenNguoiTao });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      isDirty={isDirty}
      title={t(isEdit ? 'baoTriSuaChua.form.editTitle' : 'baoTriSuaChua.form.createTitle')}
      icon={<Wrench size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="phieu-bao-tri-sua-chua-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('baoTriSuaChua.form.submitEdit')}
          createLabel={t('baoTriSuaChua.form.submit')}
        />
      }
    >
      <form id="phieu-bao-tri-sua-chua-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormSection title={t('baoTriSuaChua.form.sectionGeneral')} icon={<Wrench size={18} />} variant="primary">
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.ngay')}<RequiredStar /></label>
              <Input type="date" {...register('ngay')} className={errors.ngay ? 'border-destructive' : ''} />
              {errors.ngay && <p className="text-destructive text-xs mt-1">{errors.ngay.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.chiNhanh')}<RequiredStar /></label>
              <Controller
                name="id_chi_nhanh"
                control={control}
                render={({ field }) => (
                  <Combobox
                    value={field.value}
                    onChange={(v) => {
                      const value = String(v ?? '');
                      field.onChange(value);
                      handleChiNhanhChange(value);
                    }}
                    options={chiNhanhOptions}
                    placeholder={t('baoTriSuaChua.form.chiNhanhPlaceholder')}
                  />
                )}
              />
              {errors.id_chi_nhanh && <p className="text-destructive text-xs mt-1">{errors.id_chi_nhanh.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.hangMuc')}<RequiredStar /></label>
              <Controller
                name="id_hang_muc"
                control={control}
                render={({ field }) => (
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    options={hangMucOptions}
                    placeholder={t('baoTriSuaChua.form.hangMucPlaceholder')}
                  />
                )}
              />
              {errors.id_hang_muc && <p className="text-destructive text-xs mt-1">{errors.id_hang_muc.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.taiSan')}<RequiredStar /></label>
              <Controller
                name="id_tai_san"
                control={control}
                render={({ field }) => (
                  <Combobox
                    value={field.value}
                    onChange={(v) => {
                      const value = String(v ?? '');
                      field.onChange(value);
                      handleTaiSanChange(value);
                    }}
                    options={assetOptions}
                    placeholder={t('baoTriSuaChua.form.taiSanPlaceholder')}
                  />
                )}
              />
              {errors.id_tai_san && <p className="text-destructive text-xs mt-1">{errors.id_tai_san.message}</p>}
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('baoTriSuaChua.form.sectionContent')} icon={<FileText size={18} />}>
          <FormGrid cols={1}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.moTa')}<RequiredStar /></label>
              <Textarea {...register('mo_ta')} placeholder={t('baoTriSuaChua.form.moTaPlaceholder')} rows={3} className={errors.mo_ta ? 'border-destructive' : ''} />
              {errors.mo_ta && <p className="text-destructive text-xs mt-1">{errors.mo_ta.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.nhaCungCap')}</label>
              <Controller
                name="id_nha_cung_cap"
                control={control}
                render={({ field }) => (
                  <Combobox
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(String(v ?? ''))}
                    options={nhaCungCapOptions}
                    placeholder={t('baoTriSuaChua.form.nhaCungCapPlaceholder')}
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.soTien')}<RequiredStar /></label>
              <Controller
                name="so_tien"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    min={0}
                    maxFractionDigits={2}
                    placeholder={t('baoTriSuaChua.form.soTienPlaceholder')}
                    error={errors.so_tien?.message}
                    className={errors.so_tien ? 'border-destructive' : undefined}
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.ghiChu')}</label>
              <Textarea {...register('ghi_chu')} placeholder={t('baoTriSuaChua.form.ghiChuPlaceholder')} rows={2} />
            </div>
          </FormGrid>
        </FormSection>

        {isEdit && (
          <FormSection title={t('baoTriSuaChua.form.sectionStatus')} icon={<Wrench size={18} />}>
            <FormGrid cols={1}>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.trangThai')}</label>
                <Controller
                  name="trang_thai"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      value={field.value ?? ''}
                      onChange={(v) => field.onChange(v || undefined)}
                      options={trangThaiOptions}
                      placeholder={t('baoTriSuaChua.form.trangThaiPlaceholder')}
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('baoTriSuaChua.form.nguoiDuyet')}</label>
                <p className="text-sm text-foreground py-2">{initialData?.nguoi_duyet || '—'}</p>
                <p className="text-xs text-muted-foreground">{t('baoTriSuaChua.form.nguoiDuyetAuto')}</p>
              </div>
            </FormGrid>
          </FormSection>
        )}
      </form>
    </GenericDrawer>
  );
};

export default TaoPhieuBaoTriForm;
