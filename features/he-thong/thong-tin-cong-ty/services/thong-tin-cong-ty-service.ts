import { supabase } from '../../../../lib/supabase';
import i18n from '../../../../lib/i18n';

const TABLE = 'fp_var_tt_cong_ty';

const COMPANY_ROW_COLUMNS =
  'id, ten_ung_dung, mo_ta, logo, ten_cong_ty, ma_so_thue, dia_chi, so_dien_thoai, email, trang_web, tg_tao, tg_cap_nhat';

/** Dòng bảng fp_var_tt_cong_ty (tên cột tiếng Việt) */
export interface TTCongTyRow {
  id: number;
  ten_ung_dung: string | null;
  mo_ta: string | null;
  logo: string | null;
  ten_cong_ty: string | null;
  ma_so_thue: string | null;
  dia_chi: string | null;
  so_dien_thoai: string | null;
  email: string | null;
  trang_web: string | null;
  tg_tao?: string;
  tg_cap_nhat?: string;
}

/** Đối tượng thông tin công ty dùng trong app (store, form) */
export interface CompanyInfoPayload {
  appName: string;
  appDescription: string;
  appLogo: string | null;
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

function rowToCompanyInfo(row: Record<string, unknown>): CompanyInfoPayload {
  return {
    appName: (row.ten_ung_dung as string) ?? '',
    appDescription: (row.mo_ta as string) ?? '',
    appLogo: (row.logo as string) ?? null,
    companyName: (row.ten_cong_ty as string) ?? '',
    taxId: (row.ma_so_thue as string) ?? '',
    address: (row.dia_chi as string) ?? '',
    phone: (row.so_dien_thoai as string) ?? '',
    email: (row.email as string) ?? '',
    website: (row.trang_web as string) ?? '',
  };
}

/**
 * Lấy bản ghi thông tin công ty đầu tiên (id nhỏ nhất).
 * App dùng 1 bản ghi làm cấu hình chung.
 */
export async function getCompanyInfo(): Promise<CompanyInfoPayload | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, ten_ung_dung, mo_ta, logo, ten_cong_ty, ma_so_thue, dia_chi, so_dien_thoai, email, trang_web')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message ?? i18n.t('company.service.loadError'));
  if (!data) return null;
  return rowToCompanyInfo(data);
}

/**
 * Cập nhật thông tin công ty theo id.
 */
export async function updateCompanyInfo(
  id: string,
  payload: CompanyInfoPayload
): Promise<CompanyInfoPayload> {
  const row = {
    ten_ung_dung: payload.appName?.trim() || null,
    mo_ta: payload.appDescription?.trim() || null,
    logo: payload.appLogo?.trim() || null,
    ten_cong_ty: payload.companyName?.trim() || null,
    ma_so_thue: payload.taxId?.trim() || null,
    dia_chi: payload.address?.trim() || null,
    so_dien_thoai: payload.phone?.trim() || null,
    email: payload.email?.trim() || null,
    trang_web: payload.website?.trim() || null,
    tg_cap_nhat: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select(COMPANY_ROW_COLUMNS)
    .single();

  if (error) throw new Error(error.message ?? i18n.t('company.service.updateError'));
  return rowToCompanyInfo(updated);
}

/**
 * Lấy id bản ghi đầu tiên (để cập nhật). Trả về null nếu bảng trống.
 */
export async function getFirstCompanyId(): Promise<string | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message ?? i18n.t('company.service.loadError'));
  return data ? String(data.id) : null;
}
