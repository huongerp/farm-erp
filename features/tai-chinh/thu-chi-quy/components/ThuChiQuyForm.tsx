import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, Calendar, Building2, Tags, FileText, Link2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useHangMucThuChiRef } from '../../thiet-lap-quy/hooks/use-hang-muc-thu-chi';
import { hangMucDungChoLoaiPhieu } from '../../thiet-lap-quy/core/constants';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useAuthStore } from '../../../../store/useStore';
import { thuChiQuySchema, type ThuChiQuyFormValues } from '../core/schema';
import { LOAI_THU_CHI, loaiThuChiToI18nKey, nguonChungTuFullI18nKey } from '../core/constants';
import type { ThuChiQuy } from '../core/types';
import {
  useChungTuRefList,
  useCreateThuChiQuy,
  usePhieuGanNhatCuaToi,
  useUpdateThuChiQuy,
} from '../hooks/use-thu-chi-quy';
import { NGUON_CHUNG_TU } from '../core/constants';
import { formatDate } from '../../../../lib/utils';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  initialData?: ThuChiQuy | null;
  /** Prefill khi mở từ drawer chứng từ nguồn (section "Thu chi quỹ liên quan") */
  prefill?: Partial<ThuChiQuyFormValues>;
  /** >0 khi form mở chồng lên một drawer khác */
  stackLevel?: number;
  /** Farm mặc định khi tạo mới: farm đang xem trên toolbar, rỗng thì lấy farm của chính mình */
  defaultChiNhanhId?: string;
  /** Chi nhánh được phép chọn; rỗng = không giới hạn (viewAll) */
  allowedBranchIds?: string[];
  onClose: () => void;
}

const ThuChiQuyForm: React.FC<Props> = ({
  initialData,
  prefill,
  stackLevel = 0,
  defaultChiNhanhId = '',
  allowedBranchIds = [],
  onClose,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const user = useAuthStore((s) => s.user);
  const { data: branches = [] } = useBranches();
  const { data: hangMucList = [] } = useHangMucThuChiRef();
  const createMutation = useCreateThuChiQuy(onClose);
  const updateMutation = useUpdateThuChiQuy(onClose);

  /**
   * Gợi ý từ phiếu gần nhất do chính mình lập: thủ quỹ thường nhập liên tiếp
   * cùng một farm và cùng loại chi (vật tư, chi khác...).
   */
  const { data: phieuGanNhat } = usePhieuGanNhatCuaToi(
    !initialData && user?.id ? String(user.id) : null
  );

  const defaultValues = useMemo<ThuChiQuyFormValues>(() => {
    const farmCuaToi = user?.id_chi_nhanh ? String(user.id_chi_nhanh) : '';
    const farmGoiY =
      defaultChiNhanhId || phieuGanNhat?.id_chi_nhanh || farmCuaToi || '';
    return {
      ngay: today(),
      id_chi_nhanh: farmGoiY,
      loai: phieuGanNhat?.loai ?? 'chi',
      so_tien: 0,
      so_luong: null,
      don_gia: null,
      id_hang_muc: phieuGanNhat?.id_hang_muc ?? '',
      dien_giai: '',
      ghi_chu: '',
      loai_chung_tu: null,
      id_chung_tu: null,
      so_chung_tu: null,
      // Chỉ ghi đè bằng các trường prefill THỰC SỰ có giá trị — spread thẳng sẽ
      // set undefined và xoá mất farm/hạng mục vừa suy ra ở trên.
      ...Object.fromEntries(Object.entries(prefill ?? {}).filter(([, v]) => v !== undefined)),
    };
  }, [defaultChiNhanhId, phieuGanNhat, user?.id_chi_nhanh, prefill]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    control,
    setValue,
  } = useForm<ThuChiQuyFormValues>({
    resolver: zodResolver(thuChiQuySchema),
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ngay: initialData.ngay,
        id_chi_nhanh: initialData.id_chi_nhanh,
        loai: initialData.loai,
        so_tien: initialData.so_tien,
        so_luong: initialData.so_luong ?? null,
        don_gia: initialData.don_gia ?? null,
        id_hang_muc: initialData.id_hang_muc ?? '',
        dien_giai: initialData.dien_giai,
        ghi_chu: initialData.ghi_chu ?? '',
        loai_chung_tu: initialData.loai_chung_tu ?? null,
        id_chung_tu: initialData.id_chung_tu ?? null,
        so_chung_tu: initialData.so_chung_tu ?? null,
      });
    } else {
      reset(defaultValues);
    }
  }, [initialData, reset, defaultValues]);

  const loai = useWatch({ control, name: 'loai' });
  const loaiChungTu = useWatch({ control, name: 'loai_chung_tu' });
  const idChungTu = useWatch({ control, name: 'id_chung_tu' });

  const { data: chungTuList = [], isFetching: chungTuLoading } = useChungTuRefList(loaiChungTu ?? null);
  const chungTuOptions = useMemo(
    () =>
      chungTuList.map((ct) => ({
        value: ct.id,
        label: ct.so || ct.id,
        subLabel: [ct.ngay ? formatDate(ct.ngay) : '', ct.mo_ta ?? ''].filter(Boolean).join(' · '),
      })),
    [chungTuList]
  );
  const nguonOptions = useMemo(
    () => NGUON_CHUNG_TU.map((n) => ({ value: n, label: t(nguonChungTuFullI18nKey(n)) })),
    [t]
  );

  const branchOptions = useMemo(() => {
    const allowed = new Set(allowedBranchIds.map(String));
    return branches
      .filter((b) => allowed.size === 0 || allowed.has(String(b.id)))
      .map((b) => ({ value: String(b.id), label: b.ten_chi_nhanh, subLabel: b.ma_chi_nhanh }));
  }, [branches, allowedBranchIds]);

  const hangMucOptions = useMemo(
    () =>
      hangMucList
        .filter(
          (hm) =>
            hm.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG &&
            hangMucDungChoLoaiPhieu(hm.loai, loai)
        )
        .map((hm) => ({ value: hm.id, label: hm.ten, subLabel: hm.ma })),
    [hangMucList, loai]
  );

  const onSubmit: SubmitHandler<ThuChiQuyFormValues> = (data) => {
    const branch = branches.find((b) => String(b.id) === data.id_chi_nhanh);
    const hangMuc = hangMucList.find((hm) => hm.id === data.id_hang_muc);
    const extra = {
      tenChiNhanh: branch?.ten_chi_nhanh ?? null,
      tenHangMuc: hangMuc?.ten ?? null,
      idNguoiTao: user?.id ? String(user.id) : null,
      tenNguoiTao: user?.ho_va_ten ?? user?.full_name ?? null,
    };
    const payload: ThuChiQuyFormValues = {
      ...data,
      dien_giai: data.dien_giai.trim(),
      ghi_chu: data.ghi_chu?.trim() || null,
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: payload, extra });
    } else {
      createMutation.mutate({ data: payload, extra });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      isDirty={isDirty}
      title={isEdit ? t('thuChiQuy.form.editTitle') : t('thuChiQuy.form.createTitle')}
      icon={<Wallet size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="thu-chi-quy-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('thuChiQuy.form.save')}
          createLabel={t('thuChiQuy.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
      stackLevel={stackLevel}
    >
      <form id="thu-chi-quy-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('thuChiQuy.form.chungTuSection')} icon={<Link2 size={14} />} variant="muted">
          <FormGrid cols={2}>
            <Controller
              name="loai_chung_tu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('thuChiQuy.form.moduleLienKet')}
                  icon={<Link2 size={14} />}
                  searchable={false}
                  options={nguonOptions}
                  value={field.value ?? null}
                  onChange={(v) => {
                    field.onChange(v ? String(v) : null);
                    // Đổi module thì bỏ phiếu đã chọn của module cũ.
                    setValue('id_chung_tu', null);
                    setValue('so_chung_tu', null);
                  }}
                  placeholder={t('thuChiQuy.form.moduleLienKetPlaceholder')}
                  error={errors.loai_chung_tu?.message}
                />
              )}
            />
            <Controller
              name="id_chung_tu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('thuChiQuy.form.phieuLienKet')}
                  icon={<FileText size={14} />}
                  // Đã chọn module thì bắt buộc chọn phiếu (zod refine chặn lúc lưu).
                  required={!!loaiChungTu}
                  options={chungTuOptions}
                  value={field.value ?? null}
                  onChange={(v) => {
                    const id = v ? String(v) : null;
                    field.onChange(id);
                    // Lưu kèm số phiếu để phiếu quỹ vẫn đọc được khi phiếu nguồn bị xoá.
                    setValue('so_chung_tu', chungTuList.find((ct) => ct.id === id)?.so ?? null);
                  }}
                  disabled={!loaiChungTu}
                  placeholder={
                    loaiChungTu
                      ? chungTuLoading
                        ? t('common.loading')
                        : t('thuChiQuy.form.phieuLienKetPlaceholder')
                      : t('thuChiQuy.form.chonModuleTruoc')
                  }
                  error={errors.id_chung_tu?.message}
                />
              )}
            />
            {loaiChungTu && !idChungTu ? (
              <p className="col-span-1 sm:col-span-2 text-xs text-muted-foreground">
                {t('thuChiQuy.form.chungTuHint')}
              </p>
            ) : null}
          </FormGrid>
        </FormSection>

        <FormSection title={t('thuChiQuy.form.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Controller
              name="loai"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('thuChiQuy.form.loai')}
                  icon={<Wallet size={14} />}
                  required
                  searchable={false}
                  options={LOAI_THU_CHI.map((l) => ({ value: l, label: t(loaiThuChiToI18nKey(l)) }))}
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    // Hạng mục lọc theo loại phiếu → đổi loại thì bỏ chọn cũ.
                    setValue('id_hang_muc', '');
                  }}
                  error={errors.loai?.message}
                />
              )}
            />
            <Input
              type="date"
              label={t('thuChiQuy.form.ngay')}
              icon={<Calendar size={14} />}
              required
              {...register('ngay')}
              error={errors.ngay?.message}
            />
            <Controller
              name="id_chi_nhanh"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('thuChiQuy.form.chiNhanh')}
                  icon={<Building2 size={14} />}
                  required
                  options={branchOptions}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ? String(v) : '')}
                  placeholder={t('thuChiQuy.form.chiNhanhPlaceholder')}
                  error={errors.id_chi_nhanh?.message}
                />
              )}
            />
            <Controller
              name="id_hang_muc"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={t('thuChiQuy.form.hangMuc')}
                  icon={<Tags size={14} />}
                  required
                  options={hangMucOptions}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ? String(v) : '')}
                  placeholder={t('thuChiQuy.form.hangMucPlaceholder')}
                  error={errors.id_hang_muc?.message}
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('thuChiQuy.form.dienGiai')}
                placeholder={t('thuChiQuy.form.dienGiaiPlaceholder')}
                required
                {...register('dien_giai')}
                error={errors.dien_giai?.message}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('thuChiQuy.form.tienSection')} icon={<Wallet size={14} />} variant="muted">
          <FormGrid cols={2}>
            <Controller
              name="so_tien"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label={t('thuChiQuy.form.soTien')}
                  required
                  value={field.value ?? 0}
                  onChange={(v) => field.onChange(v)}
                  error={errors.so_tien?.message}
                />
              )}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                label={t('thuChiQuy.form.ghiChu')}
                placeholder={t('thuChiQuy.form.ghiChuPlaceholder')}
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

export default ThuChiQuyForm;
