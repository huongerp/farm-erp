import React from 'react';
import { useTranslation } from 'react-i18next';
import { Employee } from '../core/types';
import {
  User, Mail, Phone, Calendar,
  Briefcase, Building2,
  Key, ShieldCheck,
  RefreshCw, MapPin, Heart, GraduationCap,
  Landmark, CreditCard, FileText, Globe,
  Users, IdCard, BookOpen, Printer,
} from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import Select from '../../../../components/ui/Select';
import Input from '../../../../components/ui/Input';
import EnumBadge from '../../../../components/ui/EnumBadge';
import AvatarWithFallback from '../../../../components/ui/AvatarWithFallback';
import { formatDate, getTenureText, cn } from '@/lib/utils';
import { CONFIRM_YES } from '../../../../lib/button-labels';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useUpdateStatusEmployee, useResetPasswordEmployee } from '../hooks/use-nhan-vien';
import {
  STATUS_BADGE_CONFIG,
  GENDER_BADGE_CONFIG,
  MARITAL_BADGE_CONFIG,
  CONTRACT_BADGE_CONFIG,
  EDUCATION_BADGE_CONFIG,
} from '../core/constants';
import { DEFAULT_PASSWORD, TRANG_THAI_NV } from '../../../../lib/constants';

interface Props {
  data: Employee;
  onClose: () => void;
  onEdit: (item: Employee) => void;
  onDelete: (id: string) => void;
  /** Phân quyền: có quyền sửa (admin hoặc update) */
  canUpdate?: boolean;
  /** Phân quyền: có quyền xoá (admin hoặc delete) */
  canDelete?: boolean;
}

const EmployeeDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore(state => state.confirm);
  const statusMutation = useUpdateStatusEmployee();
  const resetPasswordMutation = useResetPasswordEmployee();

  const handleUpdateStatus = () => {
    let selectedStatus = data.trang_thai;

    confirm({
      title: t('employee.statusChangeTitle'),
      message: (
        <div className="space-y-4 text-left py-2">
          <p className="text-sm">{t('employee.statusChangeMessage')} <strong>{data.ho_ten}</strong>:</p>
          <Select
            defaultValue={data.trang_thai}
            options={[
              { label: t('employee.statusActive'), value: TRANG_THAI_NV.DANG_LAM_VIEC },
              { label: t('employee.statusProbation'), value: TRANG_THAI_NV.THU_VIEC },
              { label: t('employee.statusLeave'), value: TRANG_THAI_NV.NGHI_PHEP },
              { label: t('employee.statusResigned'), value: TRANG_THAI_NV.NGHI_VIEC },
            ]}
            onChange={(e) => selectedStatus = e.target.value as any}
          />
        </div>
      ),
      variant: "info",
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await statusMutation.mutateAsync({ ids: [data.id], status: selectedStatus });
      }
    });
  };


  /**
   * Đặt lại mật khẩu cho nhân viên. Bỏ trống ô nhập = cấp lại mật khẩu mặc định
   * + bật cờ buộc đổi ở lần đăng nhập kế tiếp (xem lib/mat-khau.ts).
   *
   * Lỗi được ném ra để ConfirmDialog toast và giữ nguyên dialog cho admin nhập lại.
   */
  const handleResetPassword = () => {
    let matKhauMoi = '';

    confirm({
      title: t('employee.detail.resetPasswordTitle'),
      message: (
        <div className="space-y-3 text-left py-2">
          <p className="text-sm">
            {t('employee.detail.resetPasswordMessage')} <strong>{data.ho_ten}</strong>
            {data.email ? ` (${data.email})` : ''}
          </p>
          <Input
            type="password"
            autoComplete="new-password"
            label={t('employee.form.passwordEdit')}
            placeholder={t('employee.detail.resetPasswordPlaceholder')}
            onChange={(e) => { matKhauMoi = e.target.value; }}
          />
          <p className="text-xs text-muted-foreground">
            {t('employee.detail.resetPasswordHint', { password: DEFAULT_PASSWORD })}
          </p>
        </div>
      ),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        const mk = matKhauMoi.trim();
        if (mk && mk.length < 6) throw new Error(t('employee.validation.passwordMin'));
        await resetPasswordMutation.mutateAsync({ id: data.id, email: data.email, matKhau: mk });
      },
    });
  };

  const toolbarActions: DetailToolbarAction[] = [
    ...(canUpdate ? [{
      label: t('employee.detail.changeStatus'),
      icon: <RefreshCw />,
      onClick: handleUpdateStatus,
      variant: "info"
    } as DetailToolbarAction] : []),
    {
      label: t('employee.detail.print'),
      icon: <Printer />,
      onClick: () => window.open(`${window.location.origin}/ho-so-nhan-vien/${encodeURIComponent(data.id)}`, '_blank', 'noopener,noreferrer'),
      variant: "secondary"
    },
    ...(canUpdate ? [{
      label: t('employee.detail.changePassword'),
      icon: <Key />,
      onClick: handleResetPassword,
      variant: "warning"
    } as DetailToolbarAction] : []),
    {
      label: t('employee.detail.sendEmail'),
      icon: <Mail />,
      onClick: () => window.location.href = `mailto:${data.email}`,
      variant: "primary"
    },
    {
      label: t('employee.detail.callPhone'),
      icon: <Phone />,
      onClick: () => window.location.href = `tel:${data.so_dien_thoai}`,
      variant: "success"
    },
  ];

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      onEdit={() => onEdit(data)}
      onDelete={() => onDelete(data.id)}
      canUpdate={canUpdate}
      canDelete={canDelete}
    />
  );

  return (
    <GenericDrawer
      title={t('employee.detail.title')}
      subtitle={`${t('employee.detail.subtitle')} ${data.ma_nhan_vien}`}
      icon={<User size={20} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        {/* Header Summary Card - Compact Horizontal */}
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="relative shrink-0">
            <AvatarWithFallback
              src={data.anh_dai_dien}
              name={data.ho_ten}
              seed={data.id}
              size="xl"
              rounded="lg"
              className="border-2 border-card shadow-md"
              alt={data.ho_ten}
            />
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card shadow-sm",
              data.trang_thai === TRANG_THAI_NV.DANG_LAM_VIEC ? 'bg-emerald-500' : 'bg-muted-foreground/30'
            )}></div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ho_ten}</h2>
            <p className="text-body-sm text-primary font-medium mt-0.5">{data.ten_chuc_vu}</p>
            <div className="mt-1.5"><EnumBadge value={data.trang_thai} config={STATUS_BADGE_CONFIG} /></div>
          </div>
        </div>

        {/* Toolbar Detail (Circular Actions) */}
        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        {/* ===== [1] Thông tin cá nhân ===== */}
        <DetailSection title={t('employee.detail.personalInfo')} icon={<User size={14} />}>
          <DetailFieldGrid>
            <DetailField label={t('employee.detail.fullName')} value={data.ho_ten} icon={<User size={12} />} />
            <DetailField label={t('employee.detail.birthDate')} value={data.ngay_sinh ? formatDate(data.ngay_sinh) : undefined} icon={<Calendar size={12} />} />
            <DetailField
              label={t('employee.detail.gender')}
              value={<EnumBadge value={data.gioi_tinh} config={GENDER_BADGE_CONFIG} />}
              icon={<Users size={12} />}
            />
            <DetailField label={t('employee.detail.idCard')} value={data.cmnd_cccd} icon={<IdCard size={12} />} />
            <DetailField label={t('employee.detail.idIssueDate')} value={data.ngay_cap_cccd ? formatDate(data.ngay_cap_cccd) : undefined} icon={<Calendar size={12} />} />
            <DetailField label={t('employee.detail.idIssuePlace')} value={data.noi_cap_cccd} icon={<MapPin size={12} />} />
            <DetailField label={t('employee.detail.nationality')} value={data.quoc_tich} icon={<Globe size={12} />} />
            <DetailField label={t('employee.detail.ethnicity')} value={data.dan_toc} />
            <DetailField label={t('employee.detail.religion')} value={data.ton_giao} />
          </DetailFieldGrid>
        </DetailSection>

        {/* ===== [2] Thông tin công việc ===== */}
        <DetailSection title={t('employee.detail.workInfo')} icon={<Briefcase size={14} />}>
          <DetailFieldGrid>
            <DetailField label={t('employee.detail.employeeCode')} value={data.ma_nhan_vien} icon={<FileText size={12} />} />
            <DetailField label={t('employee.detail.position')} value={data.ten_chuc_vu} icon={<Briefcase size={12} />} />
            <DetailField label={t('employee.detail.department')} value={data.ten_phong_ban} icon={<Building2 size={12} />} />
            <DetailField label={t('employee.detail.branch')} value={data.ten_chi_nhanh} icon={<MapPin size={12} />} />
            <DetailField label={t('employee.detail.level')} value={data.ten_cap_bac} icon={<Users size={12} />} />
            <DetailField label={t('employee.detail.hireDate')} value={formatDate(data.ngay_vao_lam)} icon={<Calendar size={12} />} />
            <DetailField label={t('employee.detail.tenure')} value={getTenureText(data.ngay_vao_lam)} icon={<Calendar size={12} />} />
            <DetailField label={t('employee.detail.contractType')} value={data.loai_hop_dong ? <EnumBadge value={data.loai_hop_dong} config={CONTRACT_BADGE_CONFIG} /> : undefined} icon={<FileText size={12} />} />
            <DetailField label={t('employee.detail.contractEndDate')} value={data.ngay_het_han_hd ? formatDate(data.ngay_het_han_hd) : undefined} icon={<Calendar size={12} />} />
            <DetailField label={t('employee.detail.workplace')} value={data.noi_lam_viec} icon={<Building2 size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        {/* ===== [3] Thông tin liên hệ ===== */}
        <DetailSection title={t('employee.detail.contactInfo')} icon={<Phone size={14} />}>
          <DetailFieldGrid>
            <DetailField label={t('employee.detail.workEmail')} value={data.email} icon={<Mail size={12} />} />
            <DetailField label={t('employee.detail.phone')} value={data.so_dien_thoai} icon={<Phone size={12} />} />
            <DetailField label={t('employee.detail.emergencyContact')} value={data.nguoi_lien_he_khan_cap} icon={<User size={12} />} />
            <DetailField label={t('employee.detail.emergencyPhone')} value={data.sdt_khan_cap} icon={<Phone size={12} />} />
            <DetailField label={t('employee.detail.relationship')} value={data.quan_he_khan_cap} icon={<Users size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        {/* ===== [4] Địa chỉ ===== */}
        <DetailSection title={t('employee.detail.address')} icon={<MapPin size={14} />}>
          <DetailFieldGrid>
            <DetailField label={t('employee.detail.province')} value={data.tinh_thanh} icon={<MapPin size={12} />} />
            <DetailField label={t('employee.detail.district')} value={data.quan_huyen} />
            <DetailField label={t('employee.detail.ward')} value={data.phuong_xa} />
          </DetailFieldGrid>
          {/* Trường dài: full-width 1 cột */}
          <DetailFieldGrid cols={1} className="mt-4">
            <DetailField label={t('employee.detail.detailAddress')} value={data.dia_chi_cu_the} icon={<MapPin size={12} />} />
            <DetailField label={t('employee.detail.tempAddress')} value={data.dia_chi_tam_tru} icon={<MapPin size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        {/* ===== [5] Hôn nhân & Gia đình ===== */}
        <DetailSection title={t('employee.detail.familyInfo')} icon={<Heart size={14} />}>
          <DetailFieldGrid>
            <DetailField label={t('employee.detail.maritalStatus')} value={data.tinh_trang_hon_nhan ? <EnumBadge value={data.tinh_trang_hon_nhan} config={MARITAL_BADGE_CONFIG} /> : undefined} icon={<Heart size={12} />} />
            <DetailField
              label={t('employee.detail.dependents')}
              value={data.so_nguoi_phu_thuoc !== undefined && data.so_nguoi_phu_thuoc !== null ? String(data.so_nguoi_phu_thuoc) : undefined}
              icon={<Users size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>

        {/* ===== [6] Học vấn & Chứng chỉ ===== */}
        <DetailSection title={t('employee.detail.educationInfo')} icon={<GraduationCap size={14} />}>
          <DetailFieldGrid>
            <DetailField label={t('employee.detail.educationLevel')} value={data.trinh_do_hoc_van ? <EnumBadge value={data.trinh_do_hoc_van} config={EDUCATION_BADGE_CONFIG} /> : undefined} icon={<GraduationCap size={12} />} />
            <DetailField label={t('employee.detail.major')} value={data.chuyen_nganh} icon={<BookOpen size={12} />} />
            <DetailField label={t('employee.detail.school')} value={data.truong_hoc} icon={<Building2 size={12} />} />
            <DetailField label={t('employee.detail.graduationYear')} value={data.nam_tot_nghiep} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
          {/* Chứng chỉ: full-width 1 cột */}
          <DetailFieldGrid cols={1} className="mt-4">
            <DetailField label={t('employee.detail.certificates')} value={data.chung_chi} icon={<FileText size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        {/* ===== [7] Tài chính & Ngân hàng ===== */}
        <DetailSection title={t('employee.detail.financialInfo')} icon={<Landmark size={14} />}>
          <DetailFieldGrid>
            <DetailField label={t('employee.detail.bankAccount')} value={data.so_tai_khoan} icon={<CreditCard size={12} />} />
            <DetailField label={t('employee.detail.bankName')} value={data.ten_ngan_hang} icon={<Landmark size={12} />} />
            <DetailField label={t('employee.detail.bankBranch')} value={data.chi_nhanh_nh} icon={<Building2 size={12} />} />
            <DetailField label={t('employee.detail.taxId')} value={data.ma_so_thue_ca_nhan} icon={<FileText size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        {/* ===== [8] Bảo hiểm ===== */}
        <DetailSection title={t('employee.detail.insuranceInfo')} icon={<ShieldCheck size={14} />}>
          <DetailFieldGrid>
            <DetailField label={t('employee.detail.socialInsurance')} value={data.so_bhxh} icon={<ShieldCheck size={12} />} />
            <DetailField label={t('employee.detail.healthInsurance')} value={data.so_bhyt} icon={<ShieldCheck size={12} />} />
            <DetailField label={t('employee.detail.insuranceDate')} value={data.ngay_tham_gia_bh ? formatDate(data.ngay_tham_gia_bh) : undefined} icon={<Calendar size={12} />} />
            <DetailField label={t('employee.detail.medicalFacility')} value={data.noi_dang_ky_kcb} icon={<Building2 size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

      </div>
    </GenericDrawer>
  );
};

export default EmployeeDetail;
