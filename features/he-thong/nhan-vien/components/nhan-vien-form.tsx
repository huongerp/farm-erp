
import React, { useCallback, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  UserPlus, Save, ArrowRight, UserCircle, Camera,
  Mail, Phone, Briefcase, IdCard, User, Building2, Calendar,
  CircleDot, MapPin, Heart, GraduationCap, Landmark,
  CreditCard, ShieldCheck, FileText, Globe, Users, BookOpen
} from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Combobox from '../../../../components/ui/Combobox';
import MultiSelect from '../../../../components/ui/MultiSelect';
import RadioGroup from '../../../../components/ui/RadioGroup';
import SingleImageInput from '../../../../components/ui/SingleImageInput';
import { uploadImageToCloudinary } from '../../../../lib/cloudinary';

const CLOUDINARY_READY =
  Boolean(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) &&
  Boolean(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import { employeeSchema, EmployeeFormValues } from '../core/schema';
import { BTN_CANCEL, BTN_SAVE, BTN_CREATE } from '../../../../lib/button-labels';
import { getTodayISO } from '../../../../lib/utils';
import { Employee } from '../core/types';
import { getDefaultEmployeeFormValues, employeeToFormValues } from '../utils/employee-to-form';
import { useCreateEmployee, useUpdateEmployee } from '../hooks/use-nhan-vien';
import { useDepartments } from '@/features/he-thong/phong-ban/hooks/use-phong-ban';
import { usePositions } from '../../chuc-vu/hooks/use-chuc-vu';
import { useJobLevels } from '../../cap-bac/hooks/use-cap-bac';
import { useBranches } from '../../chi-nhanh/hooks/use-chi-nhanh';
import {
  MARITAL_STATUS_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from '../core/constants';
import { TRANG_THAI, TRANG_THAI_NV } from '../../../../lib/constants';

interface Props {
  initialData?: Employee | null;
  prefillData?: Partial<EmployeeFormValues>;
  onClose: () => void;
}

const EmployeeForm: React.FC<Props> = ({ initialData, prefillData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateEmployee(onClose);
  const updateMutation = useUpdateEmployee(onClose);

  const handleUploadAvatar = useCallback(
    (file: File) => uploadImageToCloudinary(file, 'farm-erp/nhan-vien'),
    []
  );

  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
  const { data: jobLevels = [] } = useJobLevels();
  const { data: branches = [] } = useBranches();

  const defaultValues = getDefaultEmployeeFormValues(getTodayISO());
  const { register, handleSubmit, formState: { errors }, reset, control, watch, setValue } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues,
  });
  const selectedPhongBanId = watch('id_phong_ban');
  const selectedChucVuId = watch('id_chuc_vu');
  const selectedPosition = selectedChucVuId ? positions.find((p) => p.id === selectedChucVuId) : undefined;
  const capBacFromChucVu = !!selectedPosition?.cap_bac_id;

  // Cấp bậc tra cứu theo chức vụ: đồng bộ id_cap_bac khi chọn chức vụ hoặc khi positions vừa load xong
  useEffect(() => {
    if (!selectedChucVuId || !positions.length) return;
    const pos = positions.find((p) => p.id === selectedChucVuId);
    if (pos?.cap_bac_id) {
      setValue('id_cap_bac', pos.cap_bac_id, { shouldValidate: false });
    }
  }, [selectedChucVuId, positions, setValue]);

  // Prepare options for Combobox – hiển thị tất cả phòng ban và chức vụ (không lọc trạng thái Ngừng)
  const departmentOptions = departments.map((d) => ({
    label: d.ten_phong_ban,
    value: d.id,
    subLabel: undefined,
  }));

  // Chức vụ: hiển thị theo phòng ban đã chọn (chọn phòng ban → sổ ra chức vụ), hiển thị tất cả
  const positionOptions = selectedPhongBanId
    ? positions
        .filter((p) => p.phong_ban_id === selectedPhongBanId)
        .map((p) => ({
          label: p.ten_chuc_vu,
          value: p.id,
          subLabel: p.ten_cap_bac ?? p.ten_phong_ban ?? undefined,
        }))
    : positions.map((p) => ({
        label: p.ten_chuc_vu,
        value: p.id,
        subLabel: p.ten_phong_ban ?? p.ten_cap_bac ?? undefined,
      }));

  // Danh sách cấp bậc: luôn gồm cấp bậc đang chọn theo chức vụ để Combobox hiển thị đúng
  const jobLevelOptions = useMemo(() => {
    const active = jobLevels
      .filter((l: any) => l.trang_thai === TRANG_THAI.DANG_DUNG)
      .map((l: any) => ({ label: l.ten_cap_bac, value: l.id, subLabel: String(l.cap_bac) }));
    const fromPosId = selectedPosition?.cap_bac_id;
    if (fromPosId && !active.some((o) => o.value === fromPosId)) {
      const level = jobLevels.find((l: any) => l.id === fromPosId);
      const label = level?.ten_cap_bac ?? selectedPosition?.ten_cap_bac ?? fromPosId;
      const subLabel = level?.cap_bac != null ? String(level.cap_bac) : undefined;
      return [{ label, value: fromPosId, subLabel }, ...active];
    }
    return active;
  }, [jobLevels, selectedPosition?.cap_bac_id, selectedPosition?.ten_cap_bac]);

  const branchOptions = branches
    .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG)
    .map((b) => ({
      label: b.ten_chi_nhanh,
      value: b.id,
      subLabel: b.ma_chi_nhanh,
    }));

  const statusOptions = [
      { value: TRANG_THAI_NV.DANG_LAM_VIEC, label: t('employee.statusActive') },
      { value: TRANG_THAI_NV.THU_VIEC, label: t('employee.statusProbation') },
      { value: TRANG_THAI_NV.NGHI_PHEP, label: t('employee.statusLeave') },
      { value: TRANG_THAI_NV.NGHI_VIEC, label: t('employee.statusResigned') },
  ];

  useEffect(() => {
    if (initialData) {
      reset(employeeToFormValues(initialData));
    } else if (prefillData) {
      reset((prev) => ({
        ...prev,
        ...prefillData,
        ngay_vao_lam: prefillData.ngay_vao_lam || getTodayISO(),
        trang_thai: prefillData.trang_thai !== undefined ? prefillData.trang_thai : TRANG_THAI_NV.DANG_LAM_VIEC,
      }));
    }
  }, [initialData, prefillData, reset]);

  const onSubmit = (data: EmployeeFormValues) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const renderFooter = (
    <div className="flex items-center justify-between w-full gap-3">
        <Button variant="outline" onClick={onClose} className="border-border text-muted-foreground">
            {BTN_CANCEL()}
        </Button>
        <Button type="submit" form="emp-form" isLoading={isLoading} className="bg-primary text-white shadow-lg">
            {isEdit ? <><Save className="mr-2 h-4 w-4" /> {BTN_SAVE()}</> : <><UserPlus className="mr-2 h-4 w-4" /> {BTN_CREATE()} <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
    </div>
  );

  return (
    <GenericDrawer
        title={isEdit ? t('employee.form.editTitle') : t('employee.form.createTitle')}
        subtitle={isEdit ? `${t('employee.form.editSubtitle')} ${initialData.ho_ten}` : t('employee.form.createSubtitle')}
        icon={<UserCircle size={20} />}
        onClose={onClose}
        footer={renderFooter}
        maxWidthClass={DRAWER_WIDTH_FORM}
    >
          <form id="emp-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
             {Object.keys(errors).length > 0 && (
               <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
                 <span className="text-amber-600 dark:text-amber-400 font-bold text-lg leading-none">!</span>
                 <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                   {t('employee.form.validationError')}
                 </p>
               </div>
             )}

             {/* ===== SECTION 1: Thông tin cá nhân ===== */}
             <FormSection title={t('employee.form.personalInfo')} icon={<User size={14} />}>
                <div className="flex justify-center">
                    <Controller
                        name="anh_dai_dien"
                        control={control}
                        render={({ field }) => (
                            <SingleImageInput
                                label={t('employee.form.avatar')}
                                icon={<Camera className="w-4 h-4" />}
                                value={field.value}
                                onChange={field.onChange}
                                uploadFile={CLOUDINARY_READY ? handleUploadAvatar : undefined}
                                shape="circle"
                                maxSizeMB={2}
                                placeholder={t('employee.form.avatarPlaceholder')}
                                hint={t('employee.form.avatarHint')}
                                className="w-[180px]"
                            />
                        )}
                    />
                </div>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.fullName')}
                        placeholder={t('employee.form.fullNamePlaceholder')}
                        required
                        icon={<User className="w-4 h-4 text-muted-foreground" />}
                        {...register('ho_ten')}
                        error={errors.ho_ten?.message}
                    />
                    <Controller
                        name="gioi_tinh"
                        control={control}
                        render={({ field }) => (
                            <RadioGroup
                                label={t('employee.form.gender')}
                                options={[
                                    { value: 'Nam', label: t('employee.genderMale'), color: 'indigo' },
                                    { value: 'Nữ', label: t('employee.genderFemale'), color: 'pink' },
                                    { value: 'Khác', label: t('employee.genderOther'), color: 'slate' },
                                ]}
                                showColorDot
                                value={field.value}
                                onChange={(val) => field.onChange(val)}
                            />
                        )}
                    />
                </FormGrid>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.birthDate')}
                        type="date"
                        icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
                        {...register('ngay_sinh')}
                    />
                    <Input
                        label={t('employee.form.idCard')}
                        placeholder={t('employee.form.idCardPlaceholder')}
                        icon={<IdCard className="w-4 h-4 text-muted-foreground" />}
                        {...register('cmnd_cccd')}
                    />
                </FormGrid>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.idIssueDate')}
                        type="date"
                        icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
                        {...register('ngay_cap_cccd')}
                    />
                    <Input
                        label={t('employee.form.idIssuePlace')}
                        placeholder={t('employee.form.idIssuePlaceholder')}
                        icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                        {...register('noi_cap_cccd')}
                    />
                </FormGrid>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.nationality')}
                        placeholder={t('employee.form.nationalityPlaceholder')}
                        icon={<Globe className="w-4 h-4 text-muted-foreground" />}
                        {...register('quoc_tich')}
                    />
                    <Input
                        label={t('employee.form.ethnicity')}
                        placeholder={t('employee.form.ethnicityPlaceholder')}
                        {...register('dan_toc')}
                    />
                </FormGrid>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.religion')}
                        placeholder={t('employee.form.religionPlaceholder')}
                        {...register('ton_giao')}
                    />
                    <div />
                </FormGrid>
             </FormSection>

             {/* ===== SECTION 2: Thông tin công việc ===== */}
             <FormSection title={t('employee.form.workInfo')} icon={<Briefcase size={14} />}>
                <FormGrid cols={2}>
                    <Controller
                        name="id_phong_ban"
                        control={control}
                        render={({ field }) => (
                            <Combobox
                                label={t('employee.form.department')}
                                required
                                options={departmentOptions}
                                value={field.value}
                                onChange={(val) => {
                                    field.onChange(val);
                                    setValue('id_chuc_vu', '');
                                    setValue('id_cap_bac', '');
                                }}
                                placeholder={t('employee.form.departmentPlaceholder')}
                                error={errors.id_phong_ban?.message}
                            />
                        )}
                    />
                    <Controller
                        name="id_chuc_vu"
                        control={control}
                        render={({ field }) => (
                            <Combobox
                                label={t('employee.form.position')}
                                required
                                options={positionOptions}
                                value={field.value}
                                onChange={(val) => {
                                    field.onChange(val);
                                    const pos = positions.find((p) => p.id === val);
                                    setValue('id_cap_bac', pos?.cap_bac_id ?? '');
                                }}
                                placeholder={selectedPhongBanId ? t('employee.form.positionPlaceholder') : t('employee.form.selectDepartmentFirst')}
                                error={errors.id_chuc_vu?.message}
                            />
                        )}
                    />
                </FormGrid>
                <FormGrid cols={2}>
                    <Controller
                        name="id_cap_bac"
                        control={control}
                        render={({ field }) => (
                            <Combobox
                                label={t('employee.form.level')}
                                options={jobLevelOptions}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('employee.form.levelPlaceholder')}
                                disabled={capBacFromChucVu}
                            />
                        )}
                    />
                    <Controller
                        name="id_chi_nhanh"
                        control={control}
                        render={({ field }) => (
                            <MultiSelect
                                label={t('employee.form.branch')}
                                required
                                options={branchOptions}
                                value={Array.isArray(field.value) ? field.value : []}
                                onChange={field.onChange}
                                placeholder={t('employee.form.branchPlaceholder')}
                                icon={MapPin}
                                size="lg"
                                labelAbove
                                error={errors.id_chi_nhanh?.message}
                                dropdownInPortal
                            />
                        )}
                    />
                </FormGrid>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.hireDate')}
                        type="date"
                        required
                        icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
                        {...register('ngay_vao_lam')}
                        error={errors.ngay_vao_lam?.message}
                    />
                    <Controller
                        name="trang_thai"
                        control={control}
                        render={({ field }) => (
                            <Combobox
                                label={t('employee.form.workStatus')}
                                required
                                options={statusOptions}
                                value={field.value}
                                onChange={(val) => field.onChange(val)}
                                placeholder={t('employee.form.workStatusPlaceholder')}
                                icon={<CircleDot size={16} className="text-muted-foreground" />}
                                searchable={false}
                                error={errors.trang_thai?.message}
                            />
                        )}
                    />
                </FormGrid>
                <FormGrid cols={2}>
                    <Controller
                        name="loai_hop_dong"
                        control={control}
                        render={({ field }) => (
                            <Combobox
                                label={t('employee.form.contractType')}
                                options={CONTRACT_TYPE_OPTIONS}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('employee.form.contractTypePlaceholder')}
                                icon={<FileText size={16} className="text-muted-foreground" />}
                                searchable={false}
                            />
                        )}
                    />
                    <Input
                        label={t('employee.form.contractEndDate')}
                        type="date"
                        icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
                        {...register('ngay_het_han_hd')}
                    />
                </FormGrid>
                <FormGrid cols={1}>
                    <Input
                        label={t('employee.form.workplace')}
                        placeholder={t('employee.form.workplacePlaceholder')}
                        icon={<Building2 className="w-4 h-4 text-muted-foreground" />}
                        {...register('noi_lam_viec')}
                    />
                </FormGrid>
             </FormSection>

             {/* ===== SECTION 3: Thông tin liên hệ ===== */}
             <FormSection title={t('employee.form.contactInfo')} icon={<Phone size={14} />}>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.workEmail')}
                        type="email"
                        required
                        placeholder={t('employee.form.workEmailPlaceholder')}
                        icon={<Mail className="w-4 h-4 text-muted-foreground" />}
                        {...register('email')}
                        error={errors.email?.message}
                    />
                    <Input
                        label={t('employee.form.phoneNumber')}
                        required
                        placeholder={t('employee.form.phonePlaceholder')}
                        icon={<Phone className="w-4 h-4 text-muted-foreground" />}
                        {...register('so_dien_thoai')}
                        error={errors.so_dien_thoai?.message}
                    />
                </FormGrid>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.emergencyContact')}
                        placeholder={t('employee.form.emergencyContactPlaceholder')}
                        icon={<User className="w-4 h-4 text-muted-foreground" />}
                        {...register('nguoi_lien_he_khan_cap')}
                    />
                    <Input
                        label={t('employee.form.emergencyPhone')}
                        placeholder={t('employee.form.phonePlaceholder')}
                        icon={<Phone className="w-4 h-4 text-muted-foreground" />}
                        {...register('sdt_khan_cap')}
                    />
                </FormGrid>
                <FormGrid cols={2}>
                    <Controller
                        name="quan_he_khan_cap"
                        control={control}
                        render={({ field }) => (
                            <Combobox
                                label={t('employee.form.relationship')}
                                options={RELATIONSHIP_OPTIONS}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('employee.form.relationshipPlaceholder')}
                                icon={<Users size={16} className="text-muted-foreground" />}
                                searchable={false}
                            />
                        )}
                    />
                    <div />
                </FormGrid>
             </FormSection>

             {/* ===== SECTION 4: Địa chỉ ===== */}
             <FormSection title={t('employee.form.address')} icon={<MapPin size={14} />}>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.province')}
                        placeholder={t('employee.form.provincePlaceholder')}
                        icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                        {...register('tinh_thanh')}
                    />
                    <Input
                        label={t('employee.form.district')}
                        placeholder={t('employee.form.districtPlaceholder')}
                        {...register('quan_huyen')}
                    />
                </FormGrid>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.ward')}
                        placeholder={t('employee.form.wardPlaceholder')}
                        {...register('phuong_xa')}
                    />
                    <div />
                </FormGrid>
                <FormGrid cols={1}>
                    <Input
                        label={t('employee.form.detailAddress')}
                        placeholder={t('employee.form.detailAddressPlaceholder')}
                        icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                        {...register('dia_chi_cu_the')}
                    />
                </FormGrid>
                <FormGrid cols={1}>
                    <Input
                        label={t('employee.form.tempAddress')}
                        placeholder={t('employee.form.tempAddressPlaceholder')}
                        icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                        {...register('dia_chi_tam_tru')}
                    />
                </FormGrid>
             </FormSection>

             {/* ===== SECTION 5: Hôn nhân & Gia đình ===== */}
             <FormSection title={t('employee.form.familyInfo')} icon={<Heart size={14} />}>
                <FormGrid cols={2}>
                    <Controller
                        name="tinh_trang_hon_nhan"
                        control={control}
                        render={({ field }) => (
                            <Combobox
                                label={t('employee.form.maritalStatus')}
                                options={MARITAL_STATUS_OPTIONS}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('employee.form.maritalPlaceholder')}
                                icon={<Heart size={16} className="text-muted-foreground" />}
                                searchable={false}
                            />
                        )}
                    />
                    <Input
                        label={t('employee.form.dependents')}
                        type="number"
                        placeholder={t('employee.form.dependentsPlaceholder')}
                        icon={<Users className="w-4 h-4 text-muted-foreground" />}
                        {...register('so_nguoi_phu_thuoc')}
                    />
                </FormGrid>
             </FormSection>

             {/* ===== SECTION 6: Học vấn & Chứng chỉ ===== */}
             <FormSection title={t('employee.form.educationInfo')} icon={<GraduationCap size={14} />}>
                <FormGrid cols={2}>
                    <Controller
                        name="trinh_do_hoc_van"
                        control={control}
                        render={({ field }) => (
                            <Combobox
                                label={t('employee.form.educationLevel')}
                                options={EDUCATION_LEVEL_OPTIONS}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('employee.form.educationPlaceholder')}
                                icon={<GraduationCap size={16} className="text-muted-foreground" />}
                                searchable={false}
                            />
                        )}
                    />
                    <Input
                        label={t('employee.form.major')}
                        placeholder={t('employee.form.majorPlaceholder')}
                        icon={<BookOpen className="w-4 h-4 text-muted-foreground" />}
                        {...register('chuyen_nganh')}
                    />
                </FormGrid>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.school')}
                        placeholder={t('employee.form.schoolPlaceholder')}
                        icon={<Building2 className="w-4 h-4 text-muted-foreground" />}
                        {...register('truong_hoc')}
                    />
                    <Input
                        label={t('employee.form.graduationYear')}
                        placeholder={t('employee.form.graduationYearPlaceholder')}
                        icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
                        {...register('nam_tot_nghiep')}
                    />
                </FormGrid>
                <FormGrid cols={1}>
                    <Input
                        label={t('employee.form.certificates')}
                        placeholder={t('employee.form.certificatesPlaceholder')}
                        icon={<FileText className="w-4 h-4 text-muted-foreground" />}
                        {...register('chung_chi')}
                    />
                </FormGrid>
             </FormSection>

             {/* ===== SECTION 7: Tài chính & Ngân hàng ===== */}
             <FormSection title={t('employee.form.financialInfo')} icon={<Landmark size={14} />}>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.bankAccount')}
                        placeholder={t('employee.form.bankAccountPlaceholder')}
                        icon={<CreditCard className="w-4 h-4 text-muted-foreground" />}
                        {...register('so_tai_khoan')}
                    />
                    <Input
                        label={t('employee.form.bankName')}
                        placeholder={t('employee.form.bankNamePlaceholder')}
                        icon={<Landmark className="w-4 h-4 text-muted-foreground" />}
                        {...register('ten_ngan_hang')}
                    />
                </FormGrid>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.bankBranch')}
                        placeholder={t('employee.form.bankBranchPlaceholder')}
                        icon={<Building2 className="w-4 h-4 text-muted-foreground" />}
                        {...register('chi_nhanh_nh')}
                    />
                    <Input
                        label={t('employee.form.taxId')}
                        placeholder={t('employee.form.taxIdPlaceholder')}
                        icon={<FileText className="w-4 h-4 text-muted-foreground" />}
                        {...register('ma_so_thue_ca_nhan')}
                    />
                </FormGrid>
             </FormSection>

             {/* ===== SECTION 8: Bảo hiểm ===== */}
             <FormSection title={t('employee.form.insuranceInfo')} icon={<ShieldCheck size={14} />}>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.socialInsurance')}
                        placeholder={t('employee.form.socialInsurancePlaceholder')}
                        icon={<ShieldCheck className="w-4 h-4 text-muted-foreground" />}
                        {...register('so_bhxh')}
                    />
                    <Input
                        label={t('employee.form.healthInsurance')}
                        placeholder={t('employee.form.healthInsurancePlaceholder')}
                        icon={<ShieldCheck className="w-4 h-4 text-muted-foreground" />}
                        {...register('so_bhyt')}
                    />
                </FormGrid>
                <FormGrid cols={2}>
                    <Input
                        label={t('employee.form.insuranceDate')}
                        type="date"
                        icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
                        {...register('ngay_tham_gia_bh')}
                    />
                    <Input
                        label={t('employee.form.medicalFacility')}
                        placeholder={t('employee.form.medicalFacilityPlaceholder')}
                        icon={<Building2 className="w-4 h-4 text-muted-foreground" />}
                        {...register('noi_dang_ky_kcb')}
                    />
                </FormGrid>
             </FormSection>
          </form>
    </GenericDrawer>
  );
};

export default EmployeeForm;
