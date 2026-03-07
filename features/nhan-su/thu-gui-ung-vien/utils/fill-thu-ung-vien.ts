/**
 * Thay thế biến mẫu thư (từ chối / mời nhận việc) từ UngVien + company + (optional) letter data.
 */
import { formatDate } from '../../../../lib/utils';
import { replaceTemplateVariables } from '@/features/nhan-su/thiet-lap-tuyen-dung/core/template-variables';
import type { UngVien } from '@/features/nhan-su/ung-vien/core/types';

export interface CompanyInfoForTemplate {
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
}

/** Dữ liệu thư mời nhận việc để thay thế biến in phiếu */
export interface JobOfferLetterData {
  ngay_vao_lam?: string | null;
  bac_luong?: string | null;
  muc_luong?: string | null;
  co_che_khac?: string | null;
  ghi_chu_khac?: string | null;
}

export function buildVariablesFromUngVien(
  ungVien: UngVien,
  company: CompanyInfoForTemplate,
  jobOfferData?: JobOfferLetterData | null
): Record<string, string> {
  const base: Record<string, string> = {
    ten_ung_vien: ungVien.ho_ten ?? '—',
    vi_tri_ung_tuyen: ungVien.ten_chuc_vu ?? ungVien.ma_de_xuat ?? '—',
    ten_cong_ty: company.companyName ?? '—',
    ngay_hien_tai: formatDate(new Date().toISOString()),
    so_dien_thoai_lien_he: company.phone ?? '—',
    email_lien_he: company.email ?? '—',
  };
  if (jobOfferData) {
    base.ngay_nhan_viec = jobOfferData.ngay_vao_lam ? formatDate(jobOfferData.ngay_vao_lam) : '—';
    base.bac_luong = jobOfferData.bac_luong ?? '—';
    base.muc_luong = jobOfferData.muc_luong ?? '—';
    base.co_che_khac = jobOfferData.co_che_khac ?? '—';
    base.ghi_chu_khac = jobOfferData.ghi_chu_khac ?? '—';
  }
  return base;
}

export function fillTitle(
  title: string,
  ungVien: UngVien,
  company: CompanyInfoForTemplate,
  jobOfferData?: JobOfferLetterData | null
): string {
  const values = buildVariablesFromUngVien(ungVien, company, jobOfferData);
  return replaceTemplateVariables(title, values);
}

export function fillContent(
  content: string,
  ungVien: UngVien,
  company: CompanyInfoForTemplate,
  jobOfferData?: JobOfferLetterData | null
): string {
  const values = buildVariablesFromUngVien(ungVien, company, jobOfferData);
  return replaceTemplateVariables(content, values);
}
