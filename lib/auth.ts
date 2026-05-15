import { supabase } from './supabase';
import { formatSupabaseError } from './supabase-errors';
import type { User } from '../types';
import type { Employee } from '../features/he-thong/nhan-vien/core/types';
import { getEmployeeByEmail, normalizeChiNhanhIdsFromRow } from '../features/he-thong/nhan-vien/services/nhan-vien-service';
import { TRANG_THAI_NV, type TrangThaiNV } from './constants';
import type { ModulePermission, ActionType } from '../features/he-thong/phan-quyen/core/types';
import type { CurrentRoleContextData } from '../features/he-thong/phan-quyen/services/phan-quyen-service';
import { getModuleName } from '../features/he-thong/phan-quyen/services/phan-quyen-service';
import type { CompanyInfoPayload } from '../features/he-thong/thong-tin-cong-ty/services/thong-tin-cong-ty-service';

/** Ném khi nhân viên `trang_thai === Nghỉ việc` — UI map sang i18n `page.login.accountLocked`. */
export class ResignedEmployeeAuthError extends Error {
  constructor() {
    super('ResignedEmployeeAuth');
    this.name = 'ResignedEmployeeAuthError';
  }
}

async function resolveEmployeeOrSignOutIfResigned(
  employee: Employee | null
): Promise<{ employee: Employee | null; lockoutReason: 'resigned' | null }> {
  if (employee?.trang_thai === TRANG_THAI_NV.NGHI_VIEC) {
    await supabase.auth.signOut();
    return { employee: null, lockoutReason: 'resigned' };
  }
  return { employee, lockoutReason: null };
}

/**
 * Chuyển bản ghi nhân viên (fp_var_nhan_vien) sang User để lưu store.
 * App nhận diện user bằng email so với Supabase Auth; sau đăng nhập lưu id, ho_va_ten, phong_ban_id, chuc_vu_id, id_chi_nhanh (chi nhánh mặc định = phần tử đầu của chi_nhanh_ids), cap_bac.
 */
export function employeeToUser(emp: Employee): User {
  return {
    id: String(emp.id),
    email: emp.email,
    full_name: emp.ho_ten,
    ho_va_ten: emp.ho_ten,
    avatar_url: emp.anh_dai_dien ?? undefined,
    role: 'admin',
    created_at: new Date().toISOString(),
    id_phong_ban: emp.id_phong_ban ?? null,
    id_chuc_vu: emp.id_chuc_vu ?? null,
    id_chi_nhanh: emp.id_chi_nhanh?.[0] ?? null,
    cap_bac: emp.cap_bac ?? (emp.id_cap_bac != null ? Number(emp.id_cap_bac) : null),
  };
}

/**
 * Đăng nhập bằng email/password (Supabase Auth), sau đó lấy nhân viên theo email từ fp_var_nhan_vien.
 * Trả về Employee nếu thành công; throw nếu sai mật khẩu hoặc không tìm thấy nhân viên.
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<Employee> {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (authError) throw new Error(formatSupabaseError(authError, { resource: 'auth.signInWithPassword' }));
  const authEmail = authData?.user?.email;
  if (!authEmail) throw new Error('Không lấy được email từ phiên đăng nhập.');

  let employee: Employee | null = null;
  try {
    employee = await getEmployeeByEmail(authEmail);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    throw new Error(msg || 'Không thể tải hồ sơ nhân viên.', { cause: e });
  }
  if (!employee) {
    throw new Error(
      'Không tìm thấy hồ sơ nhân viên với email này. Kiểm tra: (1) Bảng fp_var_nhan_vien có dòng nào với cột email = "' +
        authEmail +
        '" không; (2) RLS: nếu bảng bật Row Level Security thì cần policy cho phép user đã đăng nhập được SELECT (xem docs hoặc chạy policy mẫu trong Supabase SQL Editor).'
    );
  }

  const gated = await resolveEmployeeOrSignOutIfResigned(employee);
  if (gated.lockoutReason === 'resigned') throw new ResignedEmployeeAuthError();
  return gated.employee!;
}

/**
 * Đăng xuất: xóa phiên Supabase Auth.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Kiểm tra phiên hiện tại: nếu có user Auth thì lấy nhân viên theo email.
 * Dùng khi load app để khôi phục trạng thái đăng nhập.
 */
export async function getSessionEmployee(): Promise<Employee | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const email = session?.user?.email;
  if (!email) return null;

  const employee = await getEmployeeByEmail(email);
  const gated = await resolveEmployeeOrSignOutIfResigned(employee);
  return gated.employee;
}

/**
 * Bootstrap phiên trong 1 request duy nhất (RPC `rpc_get_session_bootstrap`).
 *
 * Thay cho chuỗi: `getEmployeeByEmail` + `prefetch getCurrentRoleContext` (×2 request
 * song song: fp_var_phan_quyen + fp_var_chuc_vu) + `useCompanyInfo` (fp_var_tt_cong_ty).
 * Mỗi F5 trước kia = 3–5 request, nay chỉ còn 1 request JSON tổng hợp.
 *
 * Trả về cả dữ liệu đã "pha" sẵn cho React Query để caller dùng `setQueryData` mà không
 * cần gọi lại các query khác.
 */
export interface SessionBootstrap {
  employee: Employee | null;
  roleContext: CurrentRoleContextData | null;
  company: CompanyInfoPayload | null;
  /** Có khi nhân viên trùng email đang ở trạng thái Nghỉ việc — phiên Auth đã bị xóa. */
  lockoutReason?: 'resigned';
}

/** Chuẩn hoá bản ghi nhân viên trả về từ RPC (JSONB) — chỉ có các cột cần cho auth/guard. */
function bootstrapEmployeeFromRpc(row: Record<string, unknown> | null): Employee | null {
  if (!row) return null;
  return {
    id: String(row.id),
    ma_nhan_vien: 'NV' + String(row.id),
    ho_ten: (row.ho_va_ten as string) ?? '',
    email: (row.email as string) ?? '',
    so_dien_thoai: (row.so_dien_thoai as string) ?? '',
    id_phong_ban: row.phong_ban_id != null ? String(row.phong_ban_id) : null,
    id_chuc_vu: row.chuc_vu_id != null ? String(row.chuc_vu_id) : null,
    id_chi_nhanh: normalizeChiNhanhIdsFromRow(row.chi_nhanh_ids),
    ten_phong_ban: (row.ten_phong_ban as string) ?? undefined,
    ten_chuc_vu: (row.ten_chuc_vu as string) ?? undefined,
    ten_chi_nhanh: (row.ten_chi_nhanh as string) ?? undefined,
    ten_cap_bac: (row.ten_cap_bac as string) ?? undefined,
    id_cap_bac: row.cap_bac_id != null ? String(row.cap_bac_id) : null,
    cap_bac: row.cap_bac != null ? Number(row.cap_bac) : undefined,
    gioi_tinh: ((row.gioi_tinh as string) as 'Nam' | 'Nữ' | 'Khác') ?? 'Khác',
    trang_thai: (row.trang_thai as TrangThaiNV) ?? TRANG_THAI_NV.DANG_LAM_VIEC,
    ngay_vao_lam: (row.ngay_vao_lam as string) ?? '',
    // Avatar chỉ lấy URL (Supabase Storage) — không kéo base64 trong bootstrap.
    anh_dai_dien: (row.hinh_anh_url as string) ?? undefined,
  };
}

function bootstrapCompanyFromRpc(row: Record<string, unknown> | null): CompanyInfoPayload | null {
  if (!row) return null;
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
 * Gọi RPC gom bootstrap. Fallback: nếu RPC không tồn tại/không có quyền, rơi về
 * `getSessionEmployee()` truyền thống để app không gãy.
 */
export async function getSessionBootstrap(): Promise<SessionBootstrap> {
  const { data: { session } } = await supabase.auth.getSession();
  const email = session?.user?.email;
  if (!email) return { employee: null, roleContext: null, company: null };

  try {
    const { data, error } = await supabase.rpc('rpc_get_session_bootstrap', {
      p_email: email.trim(),
    });
    if (error) throw error;
    const payload = data as {
      employee: Record<string, unknown> | null;
      chuc_vu: { id: number; tt: number | null } | null;
      phan_quyen: Array<{ module_id: string; actions?: string[] }> | null;
      company: Record<string, unknown> | null;
    } | null;

    let employee = bootstrapEmployeeFromRpc(payload?.employee ?? null);
    const gated = await resolveEmployeeOrSignOutIfResigned(employee);
    if (gated.lockoutReason === 'resigned') {
      return { employee: null, roleContext: null, company: null, lockoutReason: 'resigned' };
    }
    employee = gated.employee;
    const company = bootstrapCompanyFromRpc(payload?.company ?? null);
    const roleContext: CurrentRoleContextData | null = employee
      ? {
          quyenHan: (payload?.phan_quyen ?? []).map((r) => ({
            module_id: r.module_id,
            module_name: getModuleName(r.module_id),
            actions: (r.actions ?? []) as ActionType[],
          })) as ModulePermission[],
          thuTuChucVu:
            payload?.chuc_vu?.tt != null && !Number.isNaN(Number(payload.chuc_vu.tt))
              ? Number(payload.chuc_vu.tt)
              : 999,
        }
      : null;
    return { employee, roleContext, company };
  } catch {
    // RPC chưa được tạo hoặc quyền chưa cấp → fallback request truyền thống để app không gãy.
    const employee = await getEmployeeByEmail(email);
    const gated = await resolveEmployeeOrSignOutIfResigned(employee);
    if (gated.lockoutReason === 'resigned') {
      return { employee: null, roleContext: null, company: null, lockoutReason: 'resigned' };
    }
    return { employee: gated.employee, roleContext: null, company: null };
  }
}

/** Gửi email đặt lại mật khẩu (Supabase Auth). User nhận link và mở trang /dat-lai-mat-khau để đổi mật khẩu. */
export async function requestPasswordReset(email: string): Promise<void> {
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/dat-lai-mat-khau`
      : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });
  if (error) throw new Error(formatSupabaseError(error, { resource: 'auth.resetPasswordForEmail' }));
}

/** Đặt lại mật khẩu (sau khi user mở link từ email trên trang /dat-lai-mat-khau). */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(formatSupabaseError(error, { resource: 'auth.updateUser' }));
}

/**
 * Đăng nhập bằng Google (Supabase OAuth).
 * Chuyển hướng sang Google, sau khi đăng nhập xong redirect về redirectTo (mặc định: trang chủ).
 * Khi quay lại app, useAuthSync sẽ gọi getSessionEmployee() và đăng nhập nếu có hồ sơ nhân viên trùng email.
 * Cần bật Google provider trong Supabase Dashboard và thêm redirect URL vào allow list.
 */
export async function signInWithGoogle(): Promise<void> {
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw new Error(formatSupabaseError(error, { resource: 'auth.signInWithOAuth' }));
}
