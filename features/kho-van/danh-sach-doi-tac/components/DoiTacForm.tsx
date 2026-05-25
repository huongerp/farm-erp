import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, FileText, ArrowUpFromLine, Power, Folder, MapPin, Phone, Mail, Landmark, CreditCard, User } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import LoaiToggleGroup from './LoaiToggleGroup';
import StatusToggle from '../../../../components/ui/StatusToggle';
import Combobox from '../../../../components/ui/Combobox';
import MultiSelect from '../../../../components/ui/MultiSelect';
import VietQRPreview from './VietQRPreview';
import { VN_BANKS, formatBankLabel } from '../../../../lib/vn-banks';
import { DoiTacFormValues, doiTacSchema } from '../core/schema';
import type { DoiTac } from '../core/types';
import { TRANG_THAI_DOI_TAC } from '../core/types';
import type { NhomDoiTac, Tag as TagType } from '../core/types';
import { useCreateDoiTac, useUpdateDoiTac, useCreateTag } from '../hooks/use-doi-tac';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { LoaiDoiTac } from '../core/types';

const ADD_NHOM_OPTION_VALUE = '__add_nhom__' as const;

interface Props {
  initialData?: DoiTac | null;
  loaiDoiTac: LoaiDoiTac;
  nhomList: NhomDoiTac[];
  tagList: TagType[];
  /** Khi tạo mới: thứ tự mặc định (tự tăng từ max + 1 theo danh sách cùng tab). */
  defaultThuTu?: number;
  /** Drawer chồng (vd. mở từ form phiếu kho). */
  stackLevel?: number;
  onClose: () => void;
  /** Gọi khi user chọn "Thêm nhóm mới" trong dropdown; trả về nhóm vừa tạo hoặc null. Sau khi resolve, form sẽ chọn nhóm đó. */
  onRequestAddNhom?: () => Promise<NhomDoiTac | null>;
  /** Gọi khi tạo mới đối tác thành công (dùng khi mở form từ "Thêm NCC/KH" ở form khác). */
  onSuccessCreate?: (item: DoiTac) => void;
}

const DoiTacForm: React.FC<Props> = ({ initialData, loaiDoiTac, nhomList, tagList, defaultThuTu, stackLevel = 0, onClose, onRequestAddNhom, onSuccessCreate }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateDoiTac(onClose);
  const updateMutation = useUpdateDoiTac(onClose);
  const createTagMutation = useCreateTag();

  /** Tab Khách hàng chỉ chọn được nhóm loại khách hàng; tab NCC chỉ chọn được nhóm loại NCC. */
  const nhomListTheoLoai = useMemo(
    () => nhomList.filter((n) => n.loai === loaiDoiTac),
    [nhomList, loaiDoiTac]
  );

  const groupOptionsWithAdd = useMemo(
    () => [
      { value: ADD_NHOM_OPTION_VALUE, label: `➕ ${t('doiTac.form.addGroupNew')}` },
      ...nhomListTheoLoai.map((n) => ({ value: n.id, label: n.ten_nhom })),
    ],
    [nhomListTheoLoai, t]
  );

  const tagOptions = useMemo(
    () => tagList.map((tag) => ({ label: tag.ten_tag, value: tag.id })),
    [tagList]
  );

  const loaiOptions = useMemo(
    (): { value: LoaiDoiTac; label: string }[] => [
      { value: 'nha_cung_cap', label: t('doiTac.tabs.nhaCungCap') },
      { value: 'khach_hang', label: t('doiTac.tabs.khachHang') },
    ],
    [t]
  );

  const defaultValues: Partial<DoiTacFormValues> = {
    ma_ncc: '',
    ten_ncc: '',
    loai_doi_tac: loaiDoiTac,
    id_nhom: '',
    dia_chi: '',
    dien_thoai: '',
    email: '',
    mo_ta: '',
    ngan_hang_bin: '',
    so_tai_khoan: '',
    chu_tai_khoan: '',
    tag_ids: [],
    trang_thai: TRANG_THAI_DOI_TAC.DANG_HOAT_DONG,
    thu_tu: defaultThuTu ?? 1,
  };

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<DoiTacFormValues>({
    resolver: zodResolver(doiTacSchema) as any,
    defaultValues,
  });

  const bankOptions = useMemo(
    () => VN_BANKS.map((b) => ({ value: b.bin, label: formatBankLabel(b), subLabel: b.ten })),
    []
  );

  const watchedBin = useWatch({ control, name: 'ngan_hang_bin' });
  const watchedAcc = useWatch({ control, name: 'so_tai_khoan' });
  const watchedHolder = useWatch({ control, name: 'chu_tai_khoan' });

  useEffect(() => {
    if (initialData) {
      reset({
        ma_ncc: initialData.ma_ncc,
        ten_ncc: initialData.ten_ncc,
        loai_doi_tac: initialData.loai_doi_tac,
        id_nhom: initialData.id_nhom ?? '',
        dia_chi: initialData.dia_chi ?? '',
        dien_thoai: initialData.dien_thoai ?? '',
        email: initialData.email ?? '',
        mo_ta: initialData.mo_ta ?? '',
        ngan_hang_bin: initialData.ngan_hang_bin ?? '',
        so_tai_khoan: initialData.so_tai_khoan ?? '',
        chu_tai_khoan: initialData.chu_tai_khoan ?? '',
        tag_ids: initialData.tag_ids ?? [],
        trang_thai: initialData.trang_thai,
        thu_tu: initialData.thu_tu,
      });
    } else {
      reset({ ...defaultValues, loai_doi_tac: loaiDoiTac, thu_tu: defaultThuTu ?? 1 });
    }
  }, [initialData, loaiDoiTac, defaultThuTu, reset]);

  const onSubmit: SubmitHandler<DoiTacFormValues> = (data) => {
    const sanitized = {
      ...data,
      loai_doi_tac: data.loai_doi_tac,
      id_nhom: data.id_nhom,
      dia_chi: data.dia_chi?.trim() || undefined,
      dien_thoai: data.dien_thoai?.trim() || undefined,
      email: data.email?.trim() || undefined,
      mo_ta: data.mo_ta?.trim() || undefined,
      ngan_hang_bin: data.ngan_hang_bin?.trim() || undefined,
      so_tai_khoan: data.so_tai_khoan?.trim() || undefined,
      chu_tai_khoan: data.chu_tai_khoan?.trim() || undefined,
      tag_ids: Array.isArray(data.tag_ids) ? data.tag_ids : [],
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitized });
    } else {
      createMutation.mutate(sanitized, {
        onSuccess: (created) => {
          if (onSuccessCreate) {
            onSuccessCreate(created);
          } else {
            onClose();
          }
        },
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? t('doiTac.form.editTitle') : t('doiTac.form.createTitle')}
      icon={<Users size={20} />}
      onClose={onClose}
      stackLevel={stackLevel}
      footer={
        <FormDrawerFooter
          formId="doi-tac-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('doiTac.form.save')}
          createLabel={t('doiTac.form.create')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="doi-tac-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('doiTac.detail.basicInfo')} icon={<Users size={14} />} variant="primary">
          <FormGrid cols={2}>
            <div className="col-span-1 sm:col-span-2">
              <LoaiToggleGroup
                label={t('doiTac.danhMuc.form.loai')}
                options={loaiOptions}
                value={loaiDoiTac}
                onChange={() => {}}
                disabled
              />
            </div>
            <Input
              label={t('doiTac.form.code')}
              placeholder={t('doiTac.form.codePlaceholder')}
              icon={<Users size={12} />}
              required
              {...register('ma_ncc')}
              error={errors.ma_ncc?.message}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register('ma_ncc').onChange(e);
              }}
            />
            <Input
              label={t('doiTac.form.name')}
              placeholder={t('doiTac.form.namePlaceholder')}
              icon={<Users size={12} />}
              required
              {...register('ten_ncc')}
              error={errors.ten_ncc?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="id_nhom"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('doiTac.form.group')}
                    icon={<Folder size={12} />}
                    options={groupOptionsWithAdd}
                    value={field.value ?? ''}
                    onChange={(v) => {
                      if (v === ADD_NHOM_OPTION_VALUE) {
                        const p = onRequestAddNhom?.();
                        if (p) {
                          p.then((nhom) => {
                            if (nhom) field.onChange(nhom.id);
                          });
                        }
                        return;
                      }
                      field.onChange(v ?? '');
                    }}
                    placeholder={t('doiTac.form.groupPlaceholder')}
                    searchPlaceholder={t('doiTac.danhMuc.searchPlaceholder')}
                    searchable
                    dropdownInPortal
                    required
                    error={errors.id_nhom?.message}
                  />
                )}
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Input
                label={t('doiTac.form.address')}
                placeholder={t('doiTac.form.addressPlaceholder')}
                icon={<MapPin size={12} />}
                {...register('dia_chi')}
                error={errors.dia_chi?.message}
              />
            </div>
            <Input
              label={t('doiTac.form.phone')}
              placeholder={t('doiTac.form.phonePlaceholder')}
              icon={<Phone size={12} />}
              {...register('dien_thoai')}
              error={errors.dien_thoai?.message}
            />
            <Input
              label={t('doiTac.form.email')}
              placeholder={t('doiTac.form.emailPlaceholder')}
              type="email"
              icon={<Mail size={12} />}
              {...register('email')}
              error={errors.email?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="tag_ids"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    label={t('doiTac.form.tags')}
                    options={tagOptions}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder={t('doiTac.form.tagsPlaceholder')}
                    createOptionLabel={t('doiTac.form.createTagLabel')}
                    onCreateOption={async (label) => {
                      const tag = await createTagMutation.mutateAsync(label);
                      return tag.id;
                    }}
                  />
                )}
              />
            </div>
            <Input
              type="number"
              label={t('doiTac.detail.order')}
              icon={<ArrowUpFromLine size={12} />}
              required
              {...register('thu_tu')}
              error={errors.thu_tu?.message}
            />
            <div className="col-span-1 sm:col-span-2">
              <Textarea
                {...register('mo_ta')}
                label={t('doiTac.detail.description')}
                placeholder={t('doiTac.form.descriptionPlaceholder')}
                icon={<FileText size={12} />}
                rows={3}
                className="resize-y min-h-[80px]"
                error={errors.mo_ta?.message}
              />
            </div>
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={t('common.status')}
                  value={field.value}
                  onChange={field.onChange}
                  activeValue={TRANG_THAI_DOI_TAC.DANG_HOAT_DONG}
                  inactiveValue={TRANG_THAI_DOI_TAC.NGUNG_HOAT_DONG}
                  activeLabel={t('common.activeStatus')}
                  inactiveLabel={t('common.inactiveStatus')}
                  icon={<Power size={12} />}
                  required
                />
              )}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('doiTac.form.bankSection')} icon={<Landmark size={14} />} variant="primary">
          <FormGrid cols={2}>
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="ngan_hang_bin"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('doiTac.form.bank')}
                    icon={<Landmark size={12} />}
                    options={bankOptions}
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v ?? '')}
                    placeholder={t('doiTac.form.bankPlaceholder')}
                    searchPlaceholder={t('doiTac.form.bankSearchPlaceholder')}
                    searchable
                    dropdownInPortal
                    error={errors.ngan_hang_bin?.message}
                  />
                )}
              />
            </div>
            <Input
              label={t('doiTac.form.accountNumber')}
              placeholder={t('doiTac.form.accountNumberPlaceholder')}
              icon={<CreditCard size={12} />}
              {...register('so_tai_khoan')}
              error={errors.so_tai_khoan?.message}
            />
            <Input
              label={t('doiTac.form.accountHolder')}
              placeholder={t('doiTac.form.accountHolderPlaceholder')}
              icon={<User size={12} />}
              {...register('chu_tai_khoan')}
              error={errors.chu_tai_khoan?.message}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register('chu_tai_khoan').onChange(e);
              }}
            />
            <div className="col-span-1 sm:col-span-2">
              <VietQRPreview
                bin={watchedBin}
                accountNumber={watchedAcc}
                accountName={watchedHolder}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DoiTacForm;
