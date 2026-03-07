/**
 * Xuất hồ sơ nhân viên ra PDF (dạng in).
 * Sử dụng jsPDF + jspdf-autotable.
 * Refactor: types & buildSections dùng chung cho PDF và preview HTML.
 */
import type { Employee } from '../core/types';
import { formatDateTime } from '../../../../lib/utils';
import {
  STATUS_BADGE_CONFIG,
  GENDER_BADGE_CONFIG,
  CONTRACT_BADGE_CONFIG,
  EDUCATION_BADGE_CONFIG,
  MARITAL_BADGE_CONFIG,
} from '../core/constants';
import { formatDate, getTenureText } from '@/lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';

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

const PDF_MARGIN_X = 14;
const PDF_PRIMARY_COLOR: [number, number, number] = [59, 130, 246];

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

/**
 * Xuất hồ sơ nhân viên ra PDF A4 và mở tab mới.
 * Revoke object URL sau khi mở để tránh rò rỉ bộ nhớ.
 */
export async function printEmployeePDF(emp: Employee): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // Header công ty (như bảng lương)
  const company = useUIStore.getState().companyInfo;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyName || '', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80);
  if (company.address) {
    doc.text(company.address, PDF_MARGIN_X, y);
    y += 4;
  }
  const contact: string[] = [];
  if (company.email) contact.push(company.email);
  if (company.phone) contact.push(company.phone);
  if (contact.length) {
    doc.text(contact.join('  ·  '), PDF_MARGIN_X, y);
    y += 5;
  }
  doc.setTextColor(0);
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(PDF_MARGIN_X, y, pageWidth - PDF_MARGIN_X, y);
  y += 6;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(i18n.t('employee.pdf.title'), pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`${i18n.t('employee.pdf.code')} ${emp.ma_nhan_vien}  •  ${emp.ho_ten}`, pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0);
  y += 3;

  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(PDF_MARGIN_X, y, pageWidth - PDF_MARGIN_X, y);
  y += 6;

  const sections = buildEmployeeProfileSections(emp);

  for (const section of sections) {
    if (y > 260) {
      doc.addPage();
      y = 14;
    }

    autoTable(doc, {
      startY: y,
      head: [[{ content: section.title, colSpan: 2, styles: { fillColor: PDF_PRIMARY_COLOR, fontSize: 8, fontStyle: 'bold', textColor: 255, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } } }]],
      body: section.rows.map(r => [r.label, r.value]),
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: { top: 2, bottom: 2, left: 4, right: 4 },
        lineColor: [220, 220, 220],
        lineWidth: 0.2,
      },
      headStyles: { fillColor: PDF_PRIMARY_COLOR },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold', textColor: [80, 80, 80] },
        1: { textColor: [30, 30, 30] },
      },
      margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X },
      didDrawPage: () => {},
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 5;
  }

  const printDate = formatDateTime(new Date());
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(`${i18n.t('employee.pdf.printedAt')} ${printDate}`, PDF_MARGIN_X, doc.internal.pageSize.getHeight() - 8);

  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const w = window.open(url, '_blank');
  if (w) {
    w.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
  } else {
    URL.revokeObjectURL(url);
  }
}
