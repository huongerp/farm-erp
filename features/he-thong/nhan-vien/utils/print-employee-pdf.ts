/**
 * Xuất hồ sơ nhân viên ra PDF (dạng in).
 * Sử dụng jsPDF + jspdf-autotable.
 * Refactor: types & buildSections dùng chung cho PDF và preview HTML.
 */
import type { Employee } from '../core/types';
import { STATUS_BADGE_CONFIG, GENDER_BADGE_CONFIG, CONTRACT_BADGE_CONFIG, EDUCATION_BADGE_CONFIG, MARITAL_BADGE_CONFIG } from '../core/constants';
import { formatDate, getTenureText } from '@/lib/utils';
import i18n from '../../../../lib/i18n';

/** Một dòng trong section (nhãn + giá trị) */
export interface EmployeePdfSectionRow {
  label: string;
  value: string;
}

/** Một khối thông tin (tiêu đề + các dòng) */
export interface EmployeePdfSection {
  title: string;
  rows: EmployeePdfSectionRow[];
}

function badgeLabel(value: unknown, config: Record<string, { label: string }>): string {
  if (value == null || value === '') return '—';
  return config[String(value)]?.label ?? String(value);
}

/**
 * Xây dựng các section hồ sơ (dùng cho PDF và preview HTML).
 */
export function buildEmployeeProfileSections(emp: Employee): EmployeePdfSection[] {
  return [
    {
      title: i18n.t('employee.pdf.personalInfo'),
      rows: [
        { label: i18n.t('employee.detail.fullName'), value: emp.ho_ten },
        { label: i18n.t('employee.detail.birthDate'), value: emp.ngay_sinh ? formatDate(emp.ngay_sinh) : '—' },
        { label: i18n.t('employee.detail.gender'), value: badgeLabel(emp.gioi_tinh, GENDER_BADGE_CONFIG) },
        { label: i18n.t('employee.detail.idCard'), value: emp.cmnd_cccd || '—' },
        { label: i18n.t('employee.detail.idIssueDate'), value: emp.ngay_cap_cccd ? formatDate(emp.ngay_cap_cccd) : '—' },
        { label: i18n.t('employee.detail.idIssuePlace'), value: emp.noi_cap_cccd || '—' },
        { label: i18n.t('employee.detail.nationality'), value: emp.quoc_tich || '—' },
        { label: i18n.t('employee.detail.ethnicity'), value: emp.dan_toc || '—' },
        { label: i18n.t('employee.detail.religion'), value: emp.ton_giao || '—' },
      ],
    },
    {
      title: i18n.t('employee.pdf.workInfo'),
      rows: [
        { label: i18n.t('employee.detail.employeeCode'), value: emp.ma_nhan_vien },
        { label: i18n.t('employee.detail.position'), value: emp.ten_chuc_vu || '—' },
        { label: i18n.t('employee.detail.department'), value: emp.ten_phong_ban || '—' },
        { label: i18n.t('employee.detail.branch'), value: emp.ten_chi_nhanh || '—' },
        { label: i18n.t('employee.detail.level'), value: emp.ten_cap_bac || '—' },
        { label: i18n.t('employee.detail.hireDate'), value: formatDate(emp.ngay_vao_lam) },
        { label: i18n.t('employee.detail.tenure'), value: getTenureText(emp.ngay_vao_lam) },
        { label: i18n.t('employee.detail.contractType'), value: emp.loai_hop_dong ? badgeLabel(emp.loai_hop_dong, CONTRACT_BADGE_CONFIG) : '—' },
        { label: i18n.t('employee.detail.contractEndDate'), value: emp.ngay_het_han_hd ? formatDate(emp.ngay_het_han_hd) : '—' },
        { label: i18n.t('employee.detail.workplace'), value: emp.noi_lam_viec || '—' },
        { label: i18n.t('employee.status'), value: badgeLabel(emp.trang_thai, STATUS_BADGE_CONFIG) },
      ],
    },
    {
      title: i18n.t('employee.pdf.contactInfo'),
      rows: [
        { label: i18n.t('employee.detail.workEmail'), value: emp.email },
        { label: i18n.t('employee.detail.phone'), value: emp.so_dien_thoai },
        { label: i18n.t('employee.detail.emergencyContact'), value: emp.nguoi_lien_he_khan_cap || '—' },
        { label: i18n.t('employee.detail.emergencyPhone'), value: emp.sdt_khan_cap || '—' },
        { label: i18n.t('employee.detail.relationship'), value: emp.quan_he_khan_cap || '—' },
      ],
    },
    {
      title: i18n.t('employee.pdf.address'),
      rows: [
        { label: i18n.t('employee.detail.province'), value: emp.tinh_thanh || '—' },
        { label: i18n.t('employee.detail.district'), value: emp.quan_huyen || '—' },
        { label: i18n.t('employee.detail.ward'), value: emp.phuong_xa || '—' },
        { label: i18n.t('employee.detail.detailAddress'), value: emp.dia_chi_cu_the || '—' },
        { label: i18n.t('employee.detail.tempAddress'), value: emp.dia_chi_tam_tru || '—' },
      ],
    },
    {
      title: i18n.t('employee.pdf.familyInfo'),
      rows: [
        { label: i18n.t('employee.detail.maritalStatus'), value: emp.tinh_trang_hon_nhan ? badgeLabel(emp.tinh_trang_hon_nhan, MARITAL_BADGE_CONFIG) : '—' },
        { label: i18n.t('employee.detail.dependents'), value: emp.so_nguoi_phu_thuoc != null ? String(emp.so_nguoi_phu_thuoc) : '—' },
      ],
    },
    {
      title: i18n.t('employee.pdf.educationInfo'),
      rows: [
        { label: i18n.t('employee.detail.educationLevel'), value: emp.trinh_do_hoc_van ? badgeLabel(emp.trinh_do_hoc_van, EDUCATION_BADGE_CONFIG) : '—' },
        { label: i18n.t('employee.detail.major'), value: emp.chuyen_nganh || '—' },
        { label: i18n.t('employee.detail.school'), value: emp.truong_hoc || '—' },
        { label: i18n.t('employee.detail.graduationYear'), value: emp.nam_tot_nghiep || '—' },
        { label: i18n.t('employee.detail.certificates'), value: emp.chung_chi || '—' },
      ],
    },
    {
      title: i18n.t('employee.pdf.financialInfo'),
      rows: [
        { label: i18n.t('employee.detail.bankAccount'), value: emp.so_tai_khoan || '—' },
        { label: i18n.t('employee.detail.bankName'), value: emp.ten_ngan_hang || '—' },
        { label: i18n.t('employee.detail.bankBranch'), value: emp.chi_nhanh_nh || '—' },
        { label: i18n.t('employee.detail.taxId'), value: emp.ma_so_thue_ca_nhan || '—' },
      ],
    },
    {
      title: i18n.t('employee.pdf.insuranceInfo'),
      rows: [
        { label: i18n.t('employee.detail.socialInsurance'), value: emp.so_bhxh || '—' },
        { label: i18n.t('employee.detail.healthInsurance'), value: emp.so_bhyt || '—' },
        { label: i18n.t('employee.detail.insuranceDate'), value: emp.ngay_tham_gia_bh ? formatDate(emp.ngay_tham_gia_bh) : '—' },
        { label: i18n.t('employee.detail.medicalFacility'), value: emp.noi_dang_ky_kcb || '—' },
      ],
    },
  ];
}
