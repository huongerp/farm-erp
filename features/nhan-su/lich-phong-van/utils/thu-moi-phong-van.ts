/**
 * Thay thế biến mẫu thư mời phỏng vấn từ LichPhongVan + company info.
 */
import { formatDate } from '../../../../lib/utils';
import { replaceTemplateVariables } from '@/features/nhan-su/thiet-lap-tuyen-dung/core/template-variables';
import type { LichPhongVan } from '../core/types';

export interface CompanyInfoForTemplate {
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
}

export function buildThuMoiVariables(
  lich: LichPhongVan,
  company: CompanyInfoForTemplate
): Record<string, string> {
  return {
    ten_ung_vien: lich.ten_ung_vien ?? lich.id_ung_vien ?? '—',
    vi_tri_ung_tuyen: lich.ma_de_xuat ?? '—',
    ngay_phong_van: lich.ngay ? formatDate(lich.ngay) : '—',
    gio_phong_van: lich.gio ?? '—',
    dia_diem_phong_van: lich.dia_diem ?? '—',
    ten_cong_ty: company.companyName ?? '—',
    ngay_hien_tai: formatDate(new Date().toISOString()),
    so_dien_thoai_lien_he: company.phone ?? '—',
    email_lien_he: company.email ?? '—',
  };
}

export function fillThuMoiContent(
  content: string,
  lich: LichPhongVan,
  company: CompanyInfoForTemplate
): string {
  const values = buildThuMoiVariables(lich, company);
  return replaceTemplateVariables(content, values);
}

export function fillThuMoiTitle(
  title: string,
  lich: LichPhongVan,
  company: CompanyInfoForTemplate
): string {
  const values = buildThuMoiVariables(lich, company);
  return replaceTemplateVariables(title, values);
}
